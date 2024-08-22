import {SVGCharts} from "./SVGChart";

const start = () => {
    const SVGChart = new SVGCharts({
        parent: document.body,
        size: {w: 800, h: 530},
        yAxis: false,
        ticks: false
    })
    SVGChart.addChart({});

}

document.body.onload = start;