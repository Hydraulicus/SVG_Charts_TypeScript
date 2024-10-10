export function calcRoughBox (name: string): {width: number, height: number, x: number, y: number} {
    return {
        width: name.length * (this!.relativeFontSize ?? 48)  * 0.5,
        height: this!.relativeFontSize * 1.2,
        x: 0,
        y: 0
    }
}