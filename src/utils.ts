export function getMinMax(values: number[]): { minY: number, maxY: number } {
    if (values.length === 0) {
        throw new Error("The array is empty. Cannot determine min and max values.");
    }

    let minY = values[0];
    let maxY = values[0];

    for (let i = 1; i < values.length; i++) {
        if (values[i] < minY) {
            minY = values[i];
        } else if (values[i] > maxY) {
            maxY = values[i];
        }
    }

    return { minY, maxY };
}

export function scaleBetween ({arr, scaledMin, scaledMax}: {arr: number[], scaledMin: number, scaledMax: number}) {
    const {minY, maxY} = getMinMax(arr);
    return arr.map(num => (scaledMax-scaledMin)*(num-minY)/(maxY-minY)+scaledMin);
}