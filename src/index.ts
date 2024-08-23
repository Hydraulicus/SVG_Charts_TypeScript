import {SVGCharts} from "./SVGChart";
import "./styles.module.css"

const start = () => {
    const SVGChart = new SVGCharts({
        parent: document.body,
        // size: {w: 800, h: 530},
        yAxis: false,
        ticks: false,
        sections: [
            {
                color: "#AA1212",
                offset: "7%"
            },{
                color: "#ffaa11",
                offset: "8%"
            },{
                color: "#ffaa11",
                offset: "16%"
            },{
                color: "#00aa00",
                offset: "17%"
            }
        ],
    })
    SVGChart.addChart({
        score: 15,
    });

}

document.body.onload = start;