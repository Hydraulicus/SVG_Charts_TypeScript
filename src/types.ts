export interface ChartProps {
    width: number;
    height: number;
    backgroundColor: string;
}

export type sections = {color: string, offset: string}[]

export interface SVGChartsTypes {
    parent: HTMLElement
    backgroundColor?: string,
    size?: { w: number, h: number },
    xAxis?: boolean,
    yAxis?: boolean,
    ticks?: boolean,
    sections: sections
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