import { writeFileSync } from "fs";
import {SVGCharts} from "./SVGChart";

let score = 18;
const headless = true;
const SVGChart = new SVGCharts({
    name: "headlessChart",
    parent: null,
    headless,
    // TODO remove classes
    size: {w: 800, h: 530},
    yAxis: false,
    ticks: false,
    ranges: [
        {
            min: 0,
            max: 9,
            name: "Low",
            color: "#AA1212"
        },
        {
            min: 10,
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

    SVGChart.addChart({ score: score});

const headlessSVG = SVGChart.getHeadlessSVGChart({ score: score});

console.log(headlessSVG)

writeFileSync("chart.svg", headlessSVG, {
    flag: "w"
})
console.log("chart.svg composed")