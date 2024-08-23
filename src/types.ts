export interface ChartProps {
    width: number;
    height: number;
    backgroundColor: string;
}

export type Ranges = {color: string, name: string, min: number, max: number}[];

export interface SVGChartsTypes {
    parent: HTMLElement
    backgroundColor?: string,
    size?: { w: number, h: number },
    xAxis?: boolean,
    yAxis?: boolean,
    ticks?: boolean,
    ranges: Ranges
}

export type ChartFn = (x: number) => number;
export type DrawFn = {
    score: number,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    // TODO - remove any or remove this parameter
    opts: any,
    fn: ChartFn
}

export type Point = {x: number, y: number};