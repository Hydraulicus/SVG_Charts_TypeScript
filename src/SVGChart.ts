import {ChartFn, ChartProps, DrawFn, Point, Ranges, SVGChartsTypes} from "./types";
import {defChartProps, defDarkStyle, defLightStyle, defRanges} from "./const";
import {calcRoughBox} from "./helpers";

type HeadlessSVGGetter = {score: number};
type StructureElAttr = { [key: string]: string | number };

export class SVGCharts {
    private name: string= '';
    private parent: HTMLElement | null; // null - for headless generation
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

    private readonly relativeFontSize: number;

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

    private chartStructure: {eltName: string, attr?: StructureElAttr}[];

    constructor({
                    parent,
                    headless = false,
                    size = {w: 400, h: 264},
                    xAxis = true,
                    yAxis = true,
                    ticks = true,
                    ranges = defRanges,
                    name = 'chart1',
                }: SVGChartsTypes) {
        this.headless = headless;
        this.parent = parent;
        this.xSize = size.w;
        this.ySize = size.h;
        this.xAxis = xAxis;
        this.yAxis = yAxis;
        this.ticks = ticks;

        this.relativeUnit = 0.01 * size.h;
        this.relativeStrokeWidth = 0.5 * this.relativeUnit;
        this.relativeFontSize = 8 * this.relativeUnit;

        this.ranges = ranges;

        this.container = this.headless ? null : this.addSVG({...this.getLightStyle(), width: this.xSize, height: this.ySize});
        // this.container = this.addSVG({...this.getLightStyle(), width: this.xSize, height: this.ySize});

        this.chartProps = {
            ...defChartProps,
            ...this.refineProps(defChartProps)
        }

        this.chartStructure = [];
        this.name = name;
        this.gradientId = `${this.name}_Gradient`
    }

    private getGradientId = () => this.gradientId;

    private getLightStyle = () => ({...this.lightStyle, stroke: `url(#${this.getGradientId()})`});
    private getDarkStyle = () => ({...this.darkStyle, stroke: `url(#${this.getGradientId()})`});

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
        if (this.headless) {
            return
        }
        for (const key in attr) {
            elt.setAttribute(key, `${attr[key]}`)
        }
        return elt
    }

    add(eltName: string, attr?: StructureElAttr): SVGElement | null {
        this.chartStructure.push({eltName: eltName, attr: attr});
        if (this.headless) {
            return
        }

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
        return {xMin, yMin, xMax, yMax}
    }

    drawFn = (props: DrawFn) => {
        const {score, xMin, yMin, xMax, yMax, fn} = props;
        let y;
        let p;

        const canvasPtFromXY = (x: number, y: number) => this.getPtFromXY({x, y});

        const drawLegend = () => {
            const gap = 0.5 * this.relativeFontSize;
            const [_, botY] = canvasPtFromXY(xMin, 0);
            const legendTopPadding = 1.5 * this.relativeFontSize + this.relativeUnit

            const commonProps = {
                ...this.getDarkStyle(),
                y: botY + legendTopPadding,
                'stroke-width': `${this.relativeStrokeWidth}px`,
                'font-size': `${this.relativeFontSize}px`,
                'fill': 'gray',
                'stroke': 'gray'
            }

            const putLegendSign = (i: number): SVGElement | null => {
                const txt = this.add(
                    'text',
                    {...commonProps, x: 0, val: this.ranges[i].name}
                )

                if (txt) {
                    const mark = document.createTextNode(`${this.ranges[i].name}`);
                    txt.appendChild(mark);

                    return txt
                }
            }
            let refinedX:{[p: string]: number};
            const refineLegendMarks = ([mark0, mark1, mark2]: SVGElement[]) => {
                const bbox0 = (mark0 as SVGSVGElement)?.getBBox() || calcRoughBox.call(this, this.ranges[0].name);
                const bbox1 = (mark1 as SVGSVGElement)?.getBBox() || calcRoughBox.call(this, this.ranges[1].name);
                const bbox2 = (mark2 as SVGSVGElement)?.getBBox() || calcRoughBox.call(this, this.ranges[2].name);

                const xMiddle0 = this.pnts[Math.round((this.ranges[0].min + this.ranges[0].max) / 2)].x;
                const xMiddle1 = this.pnts[Math.round((this.ranges[1].min + this.ranges[1].max) / 2)].x;
                const xMiddle2 = this.pnts[Math.round((this.ranges[2].min + this.ranges[2].max) / 2)].x;

                refinedX = {
                    [this.ranges[0].name]: Math.min(Math.max(0, xMiddle0 - 0.5 * bbox0.width), this.xSize - bbox0.width - gap - bbox1.width - gap - bbox2.width),
                    [this.ranges[1].name]: Math.min(Math.max(bbox0.width + gap, xMiddle1 - 0.5 * bbox1.width), this.xSize - bbox1.width - gap - bbox2.width),
                    [this.ranges[2].name]: Math.min(Math.max(0, xMiddle2 - 0.5 * bbox2.width), this.xSize - bbox2.width),
                };

                if (!this.headless) {
                    [mark0, mark1, mark2].forEach(
                        (el: SVGElement) => el.setAttribute('x', `${refinedX[el.innerHTML]}px`)
                    )
                }

                this.chartStructure
                    .filter(el => el.eltName === 'text')
                    .forEach(el => {el.attr.x = refinedX[el.attr.val]})
            }

            const drawLegendLinks = (marks: SVGElement[]) => {
                marks.forEach((mark, i) => {

                    const bbox = (mark as SVGSVGElement)?.getBBox() // rendering in browser
                        || {...calcRoughBox.call(this, this.ranges[i].name), x: refinedX[this.ranges[i].name]} // rendering in Node.js
                    ;
                    const xMiddle = this.pnts[Math.round((this.ranges[i].min + this.ranges[i].max) / 2)].x;

                    const wordMiddle = bbox.x + 0.5 * bbox.width;
                    const halfLength = 0.6 * (legendTopPadding - bbox.height)
                    const points = `${xMiddle} ${botY + this.relativeUnit} `
                        + `${xMiddle} ${botY + this.relativeUnit + halfLength} `
                        + `${wordMiddle} ${botY + this.relativeUnit + halfLength} `
                        + `${wordMiddle} ${botY + this.relativeUnit + 2 * halfLength}`;

                    const ln = this.add('polyline', {
                        ...this.getDarkStyle(),
                        'stroke-width': `${this.relativeStrokeWidth}px`,
                        'stroke': 'gray',
                        points
                    })
                })
            }

            const marks = Array.from([0, 1, 2], putLegendSign);
            refineLegendMarks(marks);
            drawLegendLinks(marks);
        }

        const drawBorders = () => {
            const [_, botY] = canvasPtFromXY(xMin, 0);
            const drawBorder = (i0: number, i1: number) => {
                const points = `${this.pnts[Math.abs(this.ranges[i0].max)].x} ${botY + this.relativeUnit} `
                + `${this.pnts[Math.abs(this.ranges[i0].max)].x} 0 `
                + `${this.pnts[Math.abs(this.ranges[i1].min)].x} 0 `
                + `${this.pnts[Math.abs(this.ranges[i1].min)].x} ${botY + this.relativeUnit}`;

                const border1 = this.add('polyline', {
                    ...this.getDarkStyle(),
                    'stroke-width': '0',
                    fill: 'white', points
                })
            }
            drawBorder(0, 1)
            drawBorder(1, 2)
        }

        const drawTickAroundPt = (p: number[], dir: 0 | 1) => {
            const a = [p[0], p[1]];
            a[dir] -= 5
            const b = [p[0], p[1]];
            b[dir] += 5
            const tick = this.add('line', {
                ...this.getLightStyle(),
                x1: a[0], y1: a[1], x2: b[0], y2: b[1]
            });
        }

        if (this.xAxis) {
            // The x-axis.
            const leftPt = canvasPtFromXY(xMin, 0);
            const rightPt = canvasPtFromXY(xMax, 0);
            if (0 <= leftPt[1] && leftPt[1] < this.ySize) {
                this.add('line', {
                    ...this.getLightStyle(),
                    x1: leftPt[0], y1: leftPt[1],
                    x2: rightPt[0], y2: rightPt[1]
                });
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
                    this.add('line', {
                        ...this.getLightStyle(),
                        x1: botPt[0], y1: botPt[1],
                        x2: topPt[0], y2: topPt[1]
                    });
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

        const polyline = this.add('polyline', {...this.getDarkStyle(), points: pts.join(' ')});
    }

    getXCoordOfScoreText = (score: number): number => {
        const shift = score < 50 ? 6 : 4;
        return Math.min(Math.max(0, this.pnts[score].x - shift * this.relativeUnit), this.xSize - 13 * this.relativeUnit)
    }

    showPoint = (score: number) => {
        const circle = this.add('circle', this.getDarkStyle());
        this.addAttributes(circle, {id: 'scorePoint', cx: this.scoreXY[0], cy: this.scoreXY[1], r: 0.75 * this.relativeUnit})

        const gallo= this.add('circle', {
                ...this.getDarkStyle(),
                'stroke-width': `${this.relativeUnit * 4}px`,
                'opacity': 0.5,
            }
        );

        this.addAttributes(gallo, {id: 'gallo', cx: this.scoreXY[0], cy: this.scoreXY[1], r: this.relativeUnit})

        const text = this.add(
            'text',
            {
                ...this.getDarkStyle(),
                x: this.getXCoordOfScoreText(score),
                y: this.scoreXY[1] - 6 * this.relativeUnit,
                'stroke-width': `${this.relativeStrokeWidth}px`,
                'font-size': `${this.relativeFontSize}px`,
                id: 'scoreText',
                val: score
            }
        )
        if (text) {
            const mark = document.createTextNode(`${score}`);
            text.appendChild(mark);
        }
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

        gradient.id = this.getGradientId();
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
            return prevStops
                + `<stop offset="${stop.min}%" stop-color="${stop.color}"></stop>`
                + `<stop offset="${stop.max+1}%" stop-color="${stop.color}"></stop>`
        }, '')

        return `
        <linearGradient id="${id}" x1="0" x2="100%" y1="0" y2="0" gradientUnits="userSpaceOnUse">
            ${body}
        </linearGradient>
`    }

    private headlessSVG = ({score, backgroundColor, width, height}: HeadlessSVGGetter & ChartProps): string => {
        const genTag = ({eltName, attr}: {eltName: string, attr?: StructureElAttr}): string => {
            const attrs: string = Object.keys(attr).reduce((composed, key) => `${composed} ${key}="${attr[key]}"`, '')
            const content = eltName === 'text' ? attr.val : '';
            return `
                <${eltName} ${attrs}>${content}</${eltName}>`
        }

        const content: string = this.chartStructure.map(genTag).join(' ');
        const body = `<?xml version="1.0" encoding="UTF-8"?>
        <svg id="${this.name}" style="background-color: ${backgroundColor}; stroke-width: ${this.getStrokeWidth()}" width="${width}" height="${height}"
            viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                ${this.generateHeadlessGradient({stops: this.ranges, id: this.getGradientId()})}
            </defs>
            ${content}
        </svg>
        `;
        return body
    }

    /** end of generating headless SVG **/

    getHeadlessSVGChart = (args: HeadlessSVGGetter): string => this.headlessSVG(
        {
            ...args,
            ...this.getLightStyle(),
            width: this.xSize,
            height: this.ySize
        }
    )
}
