import {Ranges} from "./types";

export const defRanges: Ranges = [
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
];

export const defLightStyle = {
    fill: 'none',
    stroke: 'black',
    backgroundColor: '#eee'
};

export const defDarkStyle = {
    fill: 'none',
    stroke: 'black',
    backgroundColor: '#555'
}

export const defChartProps = {
    opts: {doEqualizeAxes: true, doDrawAxes: true},
    xMin: -2.5,
    xMax: 2.5,
    yMin: -10,
    yMax: 55,
    fn: (x: number) => Math.exp(-(x * x) / 600) * 45 + 2
};