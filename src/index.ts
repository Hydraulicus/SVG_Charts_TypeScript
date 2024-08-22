import {SVGCharts} from "./SVGChart";

const start = () => {
    const SVGChart = new SVGCharts({parent: document.body})
    SVGChart.addChart({});

}

document.body.onload = start;