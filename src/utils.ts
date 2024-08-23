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

export function  catmullRom2bezier(points: any) {
    var result = [];
    for (var i = 0; i < points.length - 1; i++) {
        var p = [];

        p.push({
            x: points[Math.max(i - 1, 0)].x,
            y: points[Math.max(i - 1, 0)].y
        });
        p.push({
            x: points[i].x,
            y: points[i].y
        });
        p.push({
            x: points[i + 1].x,
            y: points[i + 1].y
        });
        p.push({
            x: points[Math.min(i + 2, points.length - 1)].x,
            y: points[Math.min(i + 2, points.length - 1)].y
        });

        // Catmull-Rom to Cubic Bezier conversion matrix
        //    0       1       0       0
        //  -1/6      1      1/6      0
        //    0      1/6      1     -1/6
        //    0       0       1       0

        var bp = [];
        bp.push({
            x: ((-p[0].x + 6 * p[1].x + p[2].x) / 6),
            y: ((-p[0].y + 6 * p[1].y + p[2].y) / 6)
        });
        bp.push({
            x: ((p[1].x + 6 * p[2].x - p[3].x) / 6),
            y: ((p[1].y + 6 * p[2].y - p[3].y) / 6)
        });
        bp.push({
            x: p[2].x,
            y: p[2].y
        });
        result.push(bp);
    }

    return result;
}