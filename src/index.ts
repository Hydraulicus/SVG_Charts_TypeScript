import {SVGCharts} from "./SVGChart";

const start = () => {
    const SVGChart = new SVGCharts({
        parent: document.body,
        size: {w: 800, h: 530},
        yAxis: false,
        ticks: false
    })
    SVGChart.addChart({point: 15});

}

document.body.onload = start;