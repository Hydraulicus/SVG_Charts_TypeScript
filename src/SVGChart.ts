import {ChartProps, SVGChartsTypes} from "./types";

export class SVGCharts {
    private parent: HTMLElement;
    private container: SVGElement;

    readonly xSize: number;
    readonly ySize: number;

    // TODO get from parameters
    readonly numFnPts = 300;
    readonly xAxis: boolean;
    readonly yAxis: boolean;
    readonly ticks: boolean;

    private svgNS: string;

    readonly lightStyle = {stroke: '#ddd', fill: 'transparent', 'stroke-width': 3, backgroundColor: 'lightgray'};
    readonly darkStyle = {stroke: '#666', fill: 'transparent', 'stroke-width': 3, backgroundColor: 'darkgray'};

    constructor({
                    parent,
                    size = {w: 400, h: 264},
                    xAxis = true,
                    yAxis = true,
                    ticks = true,
                }: SVGChartsTypes) {
        this.parent = parent;
        this.xSize = size.w;
        this.ySize = size.h;
        this.xAxis = xAxis;
        this.yAxis = yAxis;
        this.ticks = ticks;

        this.container = this.addSVG({...this.lightStyle, width: this.xSize, height: this.ySize});
    }

    addSVG({
               backgroundColor = "lightgray",
               width,
               height,
           }: ChartProps): SVGElement {

        const svgChart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svgNS = svgChart.namespaceURI;
        svgChart.setAttribute("style", `background-color: ${backgroundColor}`);
        svgChart.setAttribute("width", `${width}`);
        svgChart.setAttribute("height", `${height}`);
        svgChart.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svgChart.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
        this.parent.appendChild(svgChart);
        return svgChart
    }

    addChart({}: {}) {
        const opts = {doEqualizeAxes: true, doDrawAxes: true}
        this.drawFn(-2.9, 2.9, 1, 1.1, opts, function (x: number) {
            return Math.exp(-(x * x) / 3 + 1)
        })

    };

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


    drawFn = (xMin: number, xMax: number, yMin: number, yMax: number, opts: any, fn: any) => {
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
                pts.push(canvasPt[0], canvasPt[1])
                xPrev = x
                prevCanvasY = canvasPt[1]
            } while (x < xTarget);
        }
        var polyline = this.add('polyline', this.darkStyle)
        this.addAttributes(polyline, {points: pts.join(' ')})
    }

}
