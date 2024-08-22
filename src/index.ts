import {ChartProps} from "./types";

function bellCurve(x0: number, x1: number, x2: number, height: number): string {
    const width = x2 - x1;
    const quart = width / 4;

    return `M${x0} ${height} C ${quart} ${height}, ${quart} 0, ${quart * 2} 0, ${quart * 3} 0, ${quart * 3} ${height}, ${quart * 4} ${height}`;
}


function addSVG({
                      backgroundColor = "lightgray",
                    parent,
                  }: ChartProps): SVGElement {

    const svgChart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgChart.setAttribute("style", `background-color: ${backgroundColor}`);
    svgChart.setAttribute("width", "400px");
    svgChart.setAttribute("height", "264px");
    svgChart.setAttribute("viewBox", "0 0 200 100");
    svgChart.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgChart.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    parent.appendChild(svgChart);
    return svgChart
}

function addChart({SVGtag}:{SVGtag: SVGElement}) {
    var curve = document.createElementNS("http://www.w3.org/2000/svg", "path");

    curve.setAttribute("d", bellCurve(25,50, 200, 50));
    curve.setAttribute('stroke-width', "3")
    curve.setAttribute("fill", 'none');
    curve.setAttribute("stroke", 'black');
    curve.setAttribute("stroke-dasharray", '5');

    SVGtag.appendChild(curve);

};

const start = () => {
    const SVGtag= addSVG({parent: document.body});
    addChart({SVGtag})

}

document.body.onload = start;