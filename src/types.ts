export interface ChartProps {
    width: number;
    height: number;
    backgroundColor: string;
}


export interface SVGChartsTypes {
    parent: HTMLElement
    backgroundColor?: string,
    size?: { w: number, h: number },
    xAxis?: boolean,
    yAxis?: boolean,
    ticks?: boolean,
}

export type Point = {x: number, y: number};