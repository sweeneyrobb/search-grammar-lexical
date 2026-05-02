export function replaceTextRange(
    text: string,
    startIndex: number,
    endIndex: number,
    value: string,
) {
    return `${text.slice(0, startIndex)}${value}${text.slice(endIndex)}`
}
