export type SearchBoxDelimiterAutocompleteText = {
    key: string
    kind: 'key' | 'value'
    query: string
    replaceEndIndex: number
    replaceStartIndex: number
}

function findNextWhitespaceIndex(text: string, startIndex: number): number {
    const whitespaceMatch = /\s/.exec(text.slice(startIndex))

    if (whitespaceMatch?.index === undefined) {
        return text.length
    }

    return startIndex + whitespaceMatch.index
}

function findPreviousWhitespaceIndex(text: string, startIndex: number): number {
    let index = startIndex - 1

    while (index >= 0) {
        if (/\s/.test(text.charAt(index))) {
            return index
        }

        index -= 1
    }

    return -1
}

function skipWhitespace(text: string, startIndex: number): number {
    let index = startIndex

    while (index < text.length && /\s/.test(text.charAt(index))) {
        index += 1
    }

    return index
}

export function parseSearchBoxDelimiterAutocompleteText(
    text: string,
    cursorIndex: number,
): SearchBoxDelimiterAutocompleteText | null {
    const boundedCursorIndex = Math.min(Math.max(cursorIndex, 0), text.length)
    const colonIndex = text.indexOf(':')

    if (colonIndex !== -1 && boundedCursorIndex > colonIndex) {
        const replaceStartIndex = skipWhitespace(text, colonIndex + 1)
        const replaceEndIndex = findNextWhitespaceIndex(
            text,
            Math.max(replaceStartIndex, boundedCursorIndex),
        )
        const query = text
            .slice(
                replaceStartIndex,
                Math.max(replaceStartIndex, boundedCursorIndex),
            )
            .trim()

        return {
            key: text.slice(0, colonIndex).trim(),
            kind: 'value',
            query,
            replaceEndIndex,
            replaceStartIndex,
        }
    }

    const replaceStartIndex = findPreviousWhitespaceIndex(
        text,
        boundedCursorIndex,
    ) + 1
    const replaceEndIndex =
        colonIndex === -1
            ? findNextWhitespaceIndex(text, boundedCursorIndex)
            : colonIndex + 1
    const queryEndIndex = colonIndex === -1 ? replaceEndIndex : colonIndex
    const query = text
        .slice(replaceStartIndex, Math.min(queryEndIndex, boundedCursorIndex))
        .trim()

    if (!query) {
        return null
    }

    return {
        key: '',
        kind: 'key',
        query,
        replaceEndIndex,
        replaceStartIndex,
    }
}
