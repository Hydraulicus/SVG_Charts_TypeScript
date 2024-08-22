import {SVGCharts} from "./SVGChart";

const start = () => {
    const SVGChart = new SVGCharts({
        parent: document.body,
        // size: {w: 400, h: 264}
        yAxis: false,
        ticks: false
    })
    SVGChart.addChart({});

}

document.body.onload = start;