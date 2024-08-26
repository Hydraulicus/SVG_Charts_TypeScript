import {SVGCharts} from "./SVGChart";
import "./styles.module.css"

const start = () => {
    let score = 19;
    const SVGChart = new SVGCharts({
        parent: document.body,
        legendClassName: "legend", /** looks example of class in styles.module.css*/
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
                max: 29,
                name: "Borderline",
                color: "#fd9c13"
            },
            {
                min: 30,
                max: 100,
                name: "Normal",
                color: "#189e05"
            }
        ]
    })
    SVGChart.addChart({
        score: score,
    });

    /** next lines just for demo */
    document.body.appendChild(document.createElement("br"));
    const iFeild = document.createElement("input");
    iFeild.setAttribute('value', `${score}`);
    iFeild.setAttribute('type', 'range');
    iFeild.setAttribute('min', '0');
    iFeild.setAttribute('max', '100');
    iFeild.setAttribute('style', 'width: 800px');
    iFeild.setAttribute('width', '800px');
    iFeild.setAttribute("placeholder", "Enter value");

    iFeild.addEventListener("input", updateValue)

    function updateValue(e: any) {
        SVGChart.updateScore({
            score: e.target.value,
        });
    }

    document.body.appendChild(iFeild);
}

document.body.onload = start;