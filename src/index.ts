import {SVGCharts} from "./SVGChart";
import "./styles.module.css"

const start = () => {
    const SVGChart = new SVGCharts({
        parent: document.body,
        legendClassName: "legend", /** looks example of class in styles.module.css*/
        size: {w: 800, h: 530},
        yAxis: false,
        ticks: false,
        ranges: [
            {
                min: 0,
                max: 79,
                name: "Low",
                color: "#AA1212"
            },
            {
                min: 80,
                max: 89,
                name: "Borderline",
                color: "#fd9c13"
            },
            {
                min: 90,
                max: 100,
                name: "Normal",
                color: "#189e05"
            }
        ]
    })
    SVGChart.addChart({
        score: 56,
    });

}

document.body.onload = start;