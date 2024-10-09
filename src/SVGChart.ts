import {ChartFn, ChartProps, DrawFn, Point, Ranges, SVGChartsTypes} from "./types";
import {defDarkStyle, defLightStyle, defRanges} from "./const";

type HeadlessSVGGetter = {score: number, name: string};

// TODO move to const
const defChartProps = {
    opts: {doEqualizeAxes: true, doDrawAxes: true},
    xMin: -2.5,
    xMax: 2.5,
    yMin: -10,
    yMax: 55,
    fn: (x: number) => Math.exp(-(x * x) / 600) * 45 + 2
};

export class SVGCharts {
    private parent: HTMLElement;
    private readonly legendClassName: string;
    private container: SVGElement;
    private readonly headless: boolean = false;

    readonly xSize: number;
    readonly ySize: number;

    readonly numFnPts = 101;
    readonly pnts: Point[] = [];
    readonly xAxis: boolean;
    readonly yAxis: boolean;
    readonly ticks: boolean;

    private svgNS: string;
    private scoreXY: number[];

    private gradientId = 'ChartGradient';

    private readonly relativeUnit: number;
    private readonly relativeStrokeWidth: number;

    private chartProps = defChartProps;

    ranges: Ranges;

    readonly lightStyle = {
        ...defLightStyle,
        stroke: `url(#${this.gradientId})`,
    };
    readonly darkStyle = {
        ...defDarkStyle,
        stroke: `url(#${this.gradientId})`,
    };

    constructor({
                    parent,
                    headless = false,
                    legendClassName,
                    size = {w: 400, h: 264},
                    xAxis = true,
                    yAxis = true,
                    ticks = true,
                    ranges = defRanges,
                }: SVGChartsTypes) {
        this.headless = headless;
        this.parent = parent;
        this.legendClassName = legendClassName;
        this.xSize = size.w;
        this.ySize = size.h;
        this.xAxis = xAxis;
        this.yAxis = yAxis;
        this.ticks = ticks;

        this.relativeUnit = 0.01 * size.h;
        this.relativeStrokeWidth = 0.5 * this.relativeUnit;

        this.ranges = ranges;

        this.container = this.headless ? null : this.addSVG({...this.lightStyle, width: this.xSize, height: this.ySize});

        this.chartProps = {
            ...defChartProps,
            ...this.refineProps(defChartProps)
        }
    }

    addSVG({
               backgroundColor = "lightgray",
               width,
               height,
           }: ChartProps): SVGElement {

        const svgChart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svgNS = svgChart.namespaceURI;
        svgChart.setAttribute("style", `background-color: ${backgroundColor}; stroke-width: ${this.getStrokeWidth()}`);
        svgChart.setAttribute("width", `${width}`);
        svgChart.setAttribute("height", `${height}`);
        svgChart.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svgChart.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");


        const defs = this.generateGradient({stops: this.ranges});
        svgChart.appendChild(defs);


        this.parent.appendChild(svgChart);
        return svgChart
    }

    addChart({score}: { score: number }) {
        this.drawFn({ score, ...this.chartProps })
        this.showPoint(score)
    };

    private addAttributes(elt: SVGElement | HTMLElement, attr: {[key: string]: string | number}) {
        for (const key in attr) {
            elt.setAttribute(key, `${attr[key]}`)
        }
        return elt
    }

    add(eltName: string, attr?: { [key: string]: string | number }): SVGElement {
        const elt = document.createElementNS(this.svgNS, eltName) as SVGElement;
        this.container.appendChild(elt);

        if (attr) {
            this.addAttributes(elt, attr);
        }

        return elt;
    }

    getPtFromXY({x, y}:{x: number, y: number}){
        const {xMin, yMin, xMax, yMax} = this.chartProps;
        const xPerc = (x - xMin) / (xMax - xMin);
        const yPerc = (y - yMin) / (yMax - yMin);
        return [xPerc * this.xSize, this.ySize - yPerc * this.ySize]
    }

    refineProps({xMin, yMin, xMax, yMax, opts}:{xMin: number, yMin: number, xMax: number, yMax: number, opts: {[key: string]: any}, fn: ChartFn}) {
        let half;
        if (opts && opts.doEqualizeAxes) {
            // This means to *increase* the frame just enough so that the axes are
            // equally scaled.
            const xRatio = (xMax - xMin) / this.xSize;
            const yRatio = (yMax - yMin) / this.ySize;
            if (xRatio < yRatio) {
                const xMid = (xMax + xMin) / 2;
                half = (xMax - xMin) / 2;
                xMin = xMid - half * (yRatio / xRatio)
                xMax = xMid + half * (yRatio / xRatio)
            } else {
                const yMid = (yMax + yMin) / 2;
                half = (yMax - yMin) / 2;
                yMin = yMid - half * (xRatio / yRatio)
                yMax = yMid + half * (xRatio / yRatio)
            }
        }
        console.log(' refined: ', xMin, yMin, xMax, yMax)
        return {xMin, yMin, xMax, yMax}
    }

    drawFn = (props: DrawFn) => {
        const {score, xMin, yMin, xMax, yMax, fn} = props;
        let y;
        let p;

        const canvasPtFromXY = (x: number, y: number) => this.getPtFromXY({x, y});

        const drawLegend = () => {
            const fontSize = 8 * this.relativeUnit;
            const gap = 0.5 * fontSize;
            const [_, botY] = canvasPtFromXY(xMin, 0);
            const legendTopPadding = 1.5 * fontSize + this.relativeUnit

            const commonProps = {
                ...this.darkStyle,
                y: botY + legendTopPadding,
                'stroke-width': `${this.relativeStrokeWidth}px`,
                'font-size': `${fontSize}px`,
            }

            const putLegendSign = (i: number): SVGElement => {
                const txt = this.add(
                    'text',
                    {...commonProps, x: 0,}
                )
                txt.classList.add(this.legendClassName);
                const mark = document.createTextNode(`${this.ranges[i].name}`);
                txt.appendChild(mark);

                return txt
            }

            const refineLegendMarks = ([mark0, mark1, mark2]: SVGElement[]) => {
                const bbox0 = (mark0 as SVGSVGElement).getBBox();
                const bbox1 = (mark1 as SVGSVGElement).getBBox();
                const bbox2 = (mark2 as SVGSVGElement).getBBox();

                const xMiddle0 = this.pnts[Math.round((this.ranges[0].min + this.ranges[0].max) / 2)].x;
                const xMiddle1 = this.pnts[Math.round((this.ranges[1].min + this.ranges[1].max) / 2)].x;
                const xMiddle2 = this.pnts[Math.round((this.ranges[2].min + this.ranges[2].max) / 2)].x;

                const refinedX0 = Math.min(Math.max(0, xMiddle0 - 0.5 * bbox0.width), this.xSize - bbox0.width - gap - bbox1.width - gap - bbox2.width)
                mark0.setAttribute('x', `${refinedX0}px`);
                const refinedX1 = Math.min(Math.max(bbox0.width + gap, xMiddle1 - 0.5 * bbox1.width), this.xSize - bbox1.width - gap - bbox2.width)
                mark1.setAttribute('x', `${refinedX1}px`);
                const refinedX2 = Math.min(Math.max(0, xMiddle2 - 0.5 * bbox2.width), this.xSize - bbox2.width);
                mark2.setAttribute('x', `${refinedX2}px`);
            }

            const drawLegendLinks = (marks: SVGElement[]) => {
                marks.forEach((mark, i) => {
                    const bbox = (mark as SVGSVGElement).getBBox();
                    const xMiddle = this.pnts[Math.round((this.ranges[i].min + this.ranges[i].max) / 2)].x;

                    const wordMiddle = bbox.x + 0.5 * bbox.width;
                    const halfLength = 0.6 * (legendTopPadding - bbox.height)
                    const points = `
                        ${xMiddle} ${botY + this.relativeUnit}
                        ${xMiddle} ${botY + this.relativeUnit + halfLength}
                        ${wordMiddle} ${botY + this.relativeUnit + halfLength}
                        ${wordMiddle} ${botY + this.relativeUnit + 2 * halfLength}
                    `;

                    const ln = this.add('polyline', {
                        ...this.darkStyle,
                        'stroke-width': `${this.relativeStrokeWidth}px`
                    })
                    ln.classList.add('legend')
                    this.addAttributes(ln, {points})
                })
            }

            const marks = Array.from([0, 1, 2], putLegendSign);
            refineLegendMarks(marks);
            drawLegendLinks(marks);
        }

        const drawBorders = () => {
            const [_, botY] = canvasPtFromXY(xMin, 0);
            const drawBorder = (i0: number, i1: number) => {
                const points = `
                ${this.pnts[Math.abs(this.ranges[i0].max)].x} ${botY + this.relativeUnit}
                ${this.pnts[Math.abs(this.ranges[i0].max)].x} 0
                ${this.pnts[Math.abs(this.ranges[i1].min)].x} 0
                ${this.pnts[Math.abs(this.ranges[i1].min)].x} ${botY + this.relativeUnit}
            `;
                const border1 = this.add('polyline', {...this.darkStyle, 'stroke-width': '0', fill: 'magenta'})
                this.addAttributes(border1, {points})
            }
            drawBorder(0, 1)
            drawBorder(1, 2)
        }

        const drawTickAroundPt = (p: number[], dir: 0 | 1) => {
            const tick = this.add('line', this.lightStyle);
            const a = [p[0], p[1]];
            a[dir] -= 5
            const b = [p[0], p[1]];
            b[dir] += 5
            this.addAttributes(tick, {x1: a[0], y1: a[1], x2: b[0], y2: b[1]})
        }

        if (this.xAxis) {
            // The x-axis.
            const leftPt = canvasPtFromXY(xMin, 0);
            const rightPt = canvasPtFromXY(xMax, 0);
            if (0 <= leftPt[1] && leftPt[1] < this.ySize) {
                const xAxis = this.add('line', this.lightStyle);
                this.addAttributes(xAxis, {
                    x1: leftPt[0], y1: leftPt[1],
                    x2: rightPt[0], y2: rightPt[1]
                })
                if (this.ticks) {
                    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
                        p = canvasPtFromXY(x, 0);
                        drawTickAroundPt(p, 1)  // 1 == vertical tick
                    }
                }
            }
        }

        if (this.yAxis) {
            // The y-axis.
            if (this.yAxis) {
                const botPt = canvasPtFromXY(0, yMin);
                const topPt = canvasPtFromXY(0, yMax);
                if (0 <= botPt[0] && botPt[0] < this.xSize) {
                    const yAxis = this.add('line', this.lightStyle);
                    this.addAttributes(yAxis, {
                        x1: botPt[0], y1: botPt[1],
                        x2: topPt[0], y2: topPt[1]
                    })
                    if (this.ticks) {
                        for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
                            p = canvasPtFromXY(0, y);
                            drawTickAroundPt(p, 0)  // 0 == horizontal tick
                        }
                    }
                }
            }
        }

        const xDelta = (xMax - xMin) / (this.numFnPts - 1);
        const pts = [];
        let xPrev = xMin;
        let prevCanvasY = null;


        for (let i = 0; i < this.numFnPts; i++) {
            let x: number;
            let xTarget: number = xMin + i * xDelta;
            do {
                x = xTarget
                y = fn(x);
                let canvasPt = canvasPtFromXY(x, y);
                let perc = 0.5;
                while (prevCanvasY && Math.abs(prevCanvasY - canvasPt[1]) > 30 &&
                perc > 0.0001) {
                    x = (1 - perc) * xPrev + perc * xTarget
                    y = fn(x);
                    canvasPt = canvasPtFromXY(x, y);
                    perc /= 2
                }
                if (i === score) {
                    this.scoreXY = canvasPt
                }
                this.pnts.push({x: canvasPt[0], y: canvasPt[1]});
                pts.push(canvasPt[0], canvasPt[1])
                xPrev = x
                prevCanvasY = canvasPt[1]
            } while (x < xTarget);
        }

        drawBorders();
        if (this.xAxis) {
            drawLegend();
        }

        const polyline = this.add('polyline', this.darkStyle);
        this.addAttributes(polyline, {points: pts.join(' ')})
    }

    getXCoordOfScoreText = (score: number): number => {
        const shift = score < 50 ? 6 : 4;
        return Math.min(Math.max(0, this.pnts[score].x - shift * this.relativeUnit), this.xSize - 13 * this.relativeUnit)
    }

    showPoint = (score: number) => {
        const circle = this.add('circle', this.darkStyle);
        this.addAttributes(circle, {id: 'scorePoint', cx: this.scoreXY[0], cy: this.scoreXY[1], r: 0.75 * this.relativeUnit})

        const gallo= this.add('circle', {
                ...this.darkStyle,
                'stroke-width': `${this.relativeUnit * 4}px`,
                'opacity': 0.5,
            }
        );

        this.addAttributes(gallo, {id: 'gallo', cx: this.scoreXY[0], cy: this.scoreXY[1], r: this.relativeUnit})

        const text = this.add(
            'text',
            {
                ...this.darkStyle,
                x: this.getXCoordOfScoreText(score),
                y: this.scoreXY[1] - 6 * this.relativeUnit,
                'stroke-width': `${this.relativeStrokeWidth}px`,
                'font-size': `${8 * this.relativeUnit}px`,
                id: 'scoreText',
            }
        )
        const mark = document.createTextNode(`${score}`);
        text.appendChild(mark);
    }

    updateScore = ({score}: {score: number}) => {
        const scoreText = document.getElementById('scoreText');
        this.addAttributes(scoreText, {
            x: this.getXCoordOfScoreText(score),
            y: this.pnts[score].y - 6 * this.relativeUnit,
        });

        ['gallo', 'scorePoint'].forEach((id) => {
            const el = document.getElementById(id);
            this.addAttributes(el, {
                cx: this.pnts[score].x,
                cy: this.pnts[score].y,
            })

        })

        scoreText.childNodes[0].nodeValue = `${score}`
    }

    generateGradient = ({stops}: { stops: Ranges }): Element => {

        const defs = document.createElementNS(this.svgNS, 'defs');
        const gradient = document.createElementNS(this.svgNS, 'linearGradient');


        stops.forEach(stop => {
            const elMin = document.createElementNS(this.svgNS, 'stop');
            elMin.setAttribute('offset', `${stop.min}%`);
            elMin.setAttribute('stop-color', stop.color);
            gradient.appendChild(elMin);
            const elMax = document.createElementNS(this.svgNS, 'stop');
            elMax.setAttribute('offset', `${stop.max + 1}%`);
            elMax.setAttribute('stop-color', stop.color);
            gradient.appendChild(elMax);
        });

        gradient.id = this.gradientId;
        gradient.setAttribute('x1', '0');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y1', '0');
        gradient.setAttribute('y2', '0');
        gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
        defs.appendChild(gradient);

        return defs
    }

    private getStrokeWidth = (): string => `${2 * this.relativeUnit}px`

    /** generating headless SVG **/
    private generateHeadlessGradient = ({stops, id}: { stops: Ranges, id: string }): string => {
        const body = stops.reduce((prevStops, stop) => {
            return `
                ${prevStops}
                <stop offset="${stop.min}%" stop-color="${stop.color}"></stop>
                <stop offset="${stop.max+1}%" stop-color="${stop.color}"></stop>
            `
        }, '')

        return `
        <linearGradient id="${id}" x1="0" x2="100%" y1="0" y2="0" gradientUnits="userSpaceOnUse">
            ${body}
        </linearGradient>
`    }

    private headlessSVG = ({score, name, backgroundColor, width, height}: HeadlessSVGGetter & ChartProps): string => {
        const headlessGradientId = `${name}_headlessGradient`;
        const body = `
        <?xml version="1.0" encoding="UTF-8"?>
        <svg style="background-color: ${backgroundColor}; stroke-width: ${this.getStrokeWidth()}" width="${width}" height="${height}"
     viewBox="0 0 ${width} ${height}" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
        ${this.generateHeadlessGradient({stops: this.ranges, id: headlessGradientId})}
    </defs>
    <line fill="none" stroke="url(#${headlessGradientId})" backgroundColor="${backgroundColor}" x1="0" y1="448.46153846153845" x2="800"
          y2="448.46153846153845"></line>
    <polyline fill="white" stroke="url(#${headlessGradientId})" backgroundColor="#555" stroke-width="0" points="
                72 453.76153846153846
                72 0
                80 0
                80 453.76153846153846
            "></polyline>
    <polyline fill="white" stroke="url(#${headlessGradientId})" backgroundColor="#555" stroke-width="0" points="
                232.00000000000003 453.76153846153846
                232.00000000000003 0
                240 0
                240 453.76153846153846
            "></polyline>
    <text fill="none" stroke="url(#${headlessGradientId})" backgroundColor="#555" y="517.3615384615384" stroke-width="2.65px"
          font-size="42.4px" x="1.1054687500000284px" class="legend">Low
    </text>
    <text fill="none" stroke="url(#${headlessGradientId})" backgroundColor="#555" y="517.3615384615384" stroke-width="2.65px"
          font-size="42.4px" x="98.9890625px" class="legend">Borderline
    </text>
    <text fill="none" stroke="url(#${headlessGradientId})" backgroundColor="#555" y="517.3615384615384" stroke-width="2.65px"
          font-size="42.4px" x="451.6796875px" class="legend">Normal
    </text>
    <polyline fill="none" stroke="url(#${headlessGradientId})" backgroundColor="#555" stroke-width="2.65px" class="legend"
              points="
                        40.00000000000003 453.76153846153846
                        40.00000000000003 465.70153846153846
                        40 465.70153846153846
                        40 477.64153846153846
                    "></polyline>
    <polyline fill="none" stroke="url(#${headlessGradientId})" backgroundColor="#555" stroke-width="2.65px" class="legend"
              points="
                        160 453.76153846153846
                        160 465.70153846153846
                        195.6218719482422 465.70153846153846
                        195.6218719482422 477.64153846153846
                    "></polyline>
    <polyline fill="none" stroke="url(#${headlessGradientId})" backgroundColor="#555" stroke-width="2.65px" class="legend"
              points="
                        520 453.76153846153846
                        520 465.70153846153846
                        520 465.70153846153846
                        520 477.64153846153846
                    "></polyline>
    <polyline fill="none" stroke="url(#${headlessGradientId})" backgroundColor="#555"
              points="0 425.50638542302784 8.000000000000005 424.36208228614913 16.00000000000001 423.0500557721038 24.000000000000018 421.55117771157694 32.00000000000002 419.8450784185344 40.00000000000003 417.9102242361895 47.99999999999998 415.7240277822905 55.999999999999986 413.2629938655773 63.99999999999999 410.5029036571898 72 407.4190391808036 80 403.9864495289562 88 400.1802594200344 96.00000000000001 395.97601978498744 104.00000000000003 391.35009902440805 112.00000000000003 386.2801124201317 119.99999999999997 380.74538594161754 128.00000000000003 374.72744938255613 136 368.2105524293672 144.00000000000003 361.1821959375585 152 353.6336694156739 160 345.56058453442176 168.00000000000003 336.96339343725805 176 327.847879775444 184 318.22560977149715 192.00000000000003 308.1143302731561 200 297.53830073372154 208 286.5285463754086 216 275.1230204830599 224.00000000000003 263.3666648488692 232.00000000000003 251.31135884571546 240 239.01574943568176 248 226.5449565964164 256 213.97015113281958 264 201.36800458367526 272 188.8200138686728 280 176.41170637648474 288.00000000000006 164.23173428615524 296.00000000000006 152.37086995273154 304 140.9209170811481 312 129.97355506691224 320 119.61913620826942 328 109.94545740884553 336.00000000000006 101.03652941860508 344.00000000000006 92.9713675434644 352 85.82282804467667 360 79.65651412041001 368 74.52977440526269 376 70.49081535033832 384.00000000000006 67.57794668869673 392 65.8189764997411 400 65.23076923076923 408 65.8189764997411 416 67.57794668869673 424 70.49081535033838 432 74.52977440526274 440.00000000000006 79.65651412041012 448.00000000000006 85.82282804467667 456.00000000000006 92.9713675434644 464.00000000000006 101.03652941860514 472 109.94545740884553 480 119.61913620826942 488 129.97355506691224 496 140.9209170811481 504 152.3708699527316 512 164.2317342861553 520 176.4117063764848 528 188.8200138686729 536 201.36800458367526 544 213.97015113281958 552 226.5449565964164 560 239.0157494356818 568 251.31135884571546 576.0000000000001 263.3666648488694 584 275.1230204830599 592.0000000000001 286.5285463754087 600 297.5383007337216 608 308.1143302731561 616 318.22560977149715 624 327.847879775444 632 336.9633934372581 640 345.56058453442176 648 353.63366941567404 656 361.1821959375585 664 368.2105524293672 672.0000000000001 374.7274493825562 680.0000000000001 380.74538594161766 688.0000000000001 386.2801124201317 696 391.35009902440805 704 395.97601978498744 712 400.1802594200344 720 403.98644952895626 728 407.4190391808036 736 410.5029036571898 744 413.2629938655773 752 415.7240277822905 760 417.9102242361895 768.0000000000001 419.8450784185344 776.0000000000001 421.55117771157694 784 423.0500557721038 792.0000000000001 424.36208228614913 800 425.50638542302784"></polyline>
    <circle fill="none" stroke="url(#${headlessGradientId})" backgroundColor="#555" id="scorePoint" cx="296.00000000000006"
            cy="152.37086995273154" r="3.9749999999999996"></circle>
    <circle fill="none" stroke="url(#${headlessGradientId})" backgroundColor="#555" stroke-width="21.2px" opacity="0.5"
            id="gallo" cx="296.00000000000006" cy="152.37086995273154" r="5.3"></circle>
    <text fill="none" stroke="url(#ChartGradient)" backgroundColor="#555" x="264.20000000000005" y="120.57086995273154"
          stroke-width="2.65px" font-size="42.4px" id="scoreText">${score}
    </text>
</svg>
        `
        return body
    }

    /** end of generating headless SVG **/

    getHeadlessSVGChart = (args: HeadlessSVGGetter): string => this.headlessSVG(
        {
            ...args,
            ...this.lightStyle,
            width: this.xSize,
            height: this.ySize
        }
    )
}
