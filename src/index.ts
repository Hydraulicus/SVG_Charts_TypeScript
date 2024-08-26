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
                max: 7,
                name: "Low",
                color: "#AA1212"
            },
            {
                min: 8,
                max: 16,
                name: "Borderline",
                color: "#fd9c13"
            },
            {
                min: 17,
                max: 100,
                name: "Normal",
                color: "#189e05"
            }
        ]
    })
    SVGChart.addChart({
        score: 15,
    });

}

document.body.onload = start;