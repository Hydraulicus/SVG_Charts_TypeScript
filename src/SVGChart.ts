import {ChartFn, ChartProps, DrawFn, Point, Ranges, SVGChartsTypes} from "./types";
import {catmullRom2bezier, getMinMax, scaleBetween} from "./utils";
import {defRanges} from "./const";

export class SVGCharts {
    private parent: HTMLElement;
    private container: SVGElement;

    readonly xSize: number;
    readonly ySize: number;

    // TODO get from parameters
    readonly numFnPts = 100;
    readonly xAxis: boolean;
    readonly yAxis: boolean;
    readonly ticks: boolean;

    private svgNS: string;
    private scoreXY: number[];

    private gradientId = 'ChartGradient';

    private relativeUnit: number;

    ranges: Ranges;

    readonly lightStyle = {
        fill: 'none',
        stroke: `url(#${this.gradientId})`,
        backgroundColor: '#eee'
    };
    readonly darkStyle = {
        fill: 'none',
        stroke: `url(#${this.gradientId})`,
        backgroundColor: '#555'
    };



    constructor({
                    parent,
                    size = {w: 400, h: 264},
                    xAxis = true,
                    yAxis = true,
                    ticks = true,
                    ranges = defRanges,
                }: SVGChartsTypes) {
        this.parent = parent;
        this.xSize = size.w;
        this.ySize = size.h;
        this.xAxis = xAxis;
        this.yAxis = yAxis;
        this.ticks = ticks;

        this.relativeUnit = 0.01 * size.h;

        this.ranges = ranges

        this.container = this.addSVG({...this.lightStyle, width: this.xSize, height: this.ySize});
    }

    addSVG({
               backgroundColor = "lightgray",
               width,
               height,
           }: ChartProps): SVGElement {

        const svgChart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svgNS = svgChart.namespaceURI;
        svgChart.setAttribute("style", `background-color: ${backgroundColor}; stroke-width: ${2 * this.relativeUnit}px`);
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
        const opts = {doEqualizeAxes: true, doDrawAxes: true}
        this.drawFn({
            score,
            xMin: -2.5,
            xMax: 2.5,
            yMin: -10,
            yMax: 55,
            opts,
            fn: (x: number) => Math.exp(-(x * x) / 600) * 45 + 2
        })
        this.showPoint(score)

        // this.drawPointsChart([-2, -2, -5, -8, 0 ,5, 4, 3, 0, -5, -9]);
    };

    drawPointsChart = (graph: number[]) => {
        var points: Point[] = this.normalizePoints(graph);

        const chart = this.add('path', this.lightStyle)
        this.addAttributes(chart, {d: this.makePath(points)})

        for (var i = 0; i < points.length; i++) {
            var circle = points[i];
            var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("cx", `${circle.x}`);
            c.setAttribute("cy", `${circle.y}`);
            c.setAttribute("r", "3");
            this.container.appendChild(c);


            var text = this.add(
                'text',
                {
                    ...this.darkStyle,
                    x: circle.x,
                    y: circle.y,
                    fill: 'blue',
                }
            )
            var myText = document.createTextNode(`${graph[i]}`);
            text.appendChild(myText);
        }
    }

    normalizePoints = (graph: number[]): Point[] => {
        const {minY, maxY} = getMinMax(graph);
        const amph = Math.abs(minY - maxY);
        const factorY = 0.9 * this.ySize / amph;
        console.log(this.xSize, this.ySize, minY, maxY, amph, factorY);
        const points: Point[] = [];
        const scaledX: number[] = scaleBetween(
            {
                arr: Array.from(Array(graph.length), (_, i) => i),
                scaledMin: this.xSize * 0.1,
                scaledMax: this.xSize * 0.9
            }
        );
        const scaledY: number[] = scaleBetween({arr: graph, scaledMin: this.ySize * 0.1, scaledMax: this.ySize * 0.9});
        for (var i = 0; i < graph.length; i++) {
            points.push({x: scaledX[i], y: -1 * scaledY[i] + this.ySize});
        }
        console.log(graph, scaledY)
        return points
    }

    makePath = (points: any) => {
        var result = "M" + points[0].x + "," + points[0].y + " ";
        var catmull = catmullRom2bezier(points);
        for (var i = 0; i < catmull.length; i++) {
            result += "C" + catmull[i][0].x + "," + catmull[i][0].y + " " + catmull[i][1].x + "," + catmull[i][1].y + " " + catmull[i][2].x + "," + catmull[i][2].y + " ";
        }
        return result;
    }

    private addAttributes(elt: SVGElement, attr: any) {
        for (var key in attr) {
            elt.setAttribute(key, attr[key])
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


    drawFn = ({score, xMin, xMax, yMin, yMax, opts, fn}: DrawFn) => {
        if (opts && fn === undefined) {
            fn = opts
            opts = null
        }

        if (opts && opts.doEqualizeAxes) {
            // This means to *increase* the frame just enough so that the axes are
            // equally scaled.
            var xRatio = (xMax - xMin) / this.xSize
            var yRatio = (yMax - yMin) / this.ySize
            if (xRatio < yRatio) {
                var xMid = (xMax + xMin) / 2
                var half = (xMax - xMin) / 2
                xMin = xMid - half * (yRatio / xRatio)
                xMax = xMid + half * (yRatio / xRatio)
            } else {
                var yMid = (yMax + yMin) / 2
                var half = (yMax - yMin) / 2
                yMin = yMid - half * (xRatio / yRatio)
                yMax = yMid + half * (xRatio / yRatio)
            }
        }

        const canvasPtFromXY = (x: number, y: number) => {
            var xPerc = (x - xMin) / (xMax - xMin)
            var yPerc = (y - yMin) / (yMax - yMin)
            return [xPerc * this.xSize, this.ySize - yPerc * this.ySize]
        }

        const drawTickAroundPt = (p: any, dir: any) => {
            var tick = this.add('line', this.lightStyle)
            var a = [p[0], p[1]]
            a[dir] -= 5
            var b = [p[0], p[1]]
            b[dir] += 5
            this.addAttributes(tick, {x1: a[0], y1: a[1], x2: b[0], y2: b[1]})
        }

        if (this.xAxis) {
            // The x-axis.
            var leftPt = canvasPtFromXY(xMin, 0)
            var rightPt = canvasPtFromXY(xMax, 0)
            if (0 <= leftPt[1] && leftPt[1] < this.ySize) {
                var xAxis = this.add('line', this.lightStyle)
                this.addAttributes(xAxis, {
                    x1: leftPt[0], y1: leftPt[1],
                    x2: rightPt[0], y2: rightPt[1]
                })
                if (this.ticks) {
                    for (var x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
                        var p = canvasPtFromXY(x, 0)
                        drawTickAroundPt(p, 1)  // 1 == vertical tick
                    }
                }
            }
        }

        if (this.yAxis) {
            // The y-axis.
            if (this.yAxis) {
                var botPt = canvasPtFromXY(0, yMin)
                var topPt = canvasPtFromXY(0, yMax)
                if (0 <= botPt[0] && botPt[0] < this.xSize) {
                    var yAxis = this.add('line', this.lightStyle)
                    this.addAttributes(yAxis, {
                        x1: botPt[0], y1: botPt[1],
                        x2: topPt[0], y2: topPt[1]
                    })
                    if (this.ticks) {
                        for (var y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
                            var p = canvasPtFromXY(0, y)
                            drawTickAroundPt(p, 0)  // 0 == horizontal tick
                        }
                    }
                }
            }
        }

        var xDelta = (xMax - xMin) / (this.numFnPts - 1)
        var pts = []
        var xPrev = xMin
        var prevCanvasY = null


        for (var i = 0; i < this.numFnPts; i++) {
            var x: number, xTarget: number = xMin + i * xDelta
            do {
                x = xTarget
                var y: number = fn(x)
                var canvasPt = canvasPtFromXY(x, y)
                var perc = 0.5
                while (prevCanvasY && Math.abs(prevCanvasY - canvasPt[1]) > 30 &&
                perc > 0.0001) {
                    x = (1 - perc) * xPrev + perc * xTarget
                    var y: number = fn(x)
                    var canvasPt = canvasPtFromXY(x, y)
                    perc /= 2
                }
                if (i === score) {
                    this.scoreXY = canvasPt
                }
                pts.push(canvasPt[0], canvasPt[1])
                xPrev = x
                prevCanvasY = canvasPt[1]
            } while (x < xTarget);
        }
        var polyline = this.add('polyline', this.darkStyle)
        this.addAttributes(polyline, {points: pts.join(' ')})
    }

    showPoint = (score: number) => {
        const circle = this.add('circle', this.darkStyle);
        this.addAttributes(circle, {cx: this.scoreXY[0], cy: this.scoreXY[1], r: 5})

        const text = this.add(
            'text',
            {
                ...this.darkStyle,
                x: this.scoreXY[0] - 3 * this.relativeUnit,
                y: this.scoreXY[1] - 8 * this.relativeUnit,
                'stroke-width': this.relativeUnit,
                'font-size': 8 * this.relativeUnit,
                'font-family': 'Roboto'
            }
        )
        const mark = document.createTextNode(`${score}`);
        text.appendChild(mark);

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
            elMax.setAttribute('offset', `${stop.max}%`);
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

}
