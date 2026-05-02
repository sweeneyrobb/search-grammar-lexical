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

function getClosingQualifier(openingQualifier: string): string | null {
    if (openingQualifier === '[') {
        return ']'
    }

    if (openingQualifier === '"') {
        return '"'
    }

    return null
}

function getQualifiedAutocompleteRange(
    text: string,
    startIndex: number,
    cursorIndex: number,
): {
    queryEndIndex: number
    queryStartIndex: number
    replaceEndIndex: number
} | null {
    const closingQualifier = getClosingQualifier(text.charAt(startIndex))

    if (!closingQualifier) {
        return null
    }

    const closingIndex = text.indexOf(closingQualifier, startIndex + 1)

    return {
        queryEndIndex: Math.min(
            cursorIndex,
            closingIndex === -1 ? text.length : closingIndex,
        ),
        queryStartIndex: startIndex + 1,
        replaceEndIndex: closingIndex === -1 ? text.length : closingIndex + 1,
    }
}

function stripSearchBoxAutocompleteQualifier(text: string): string {
    return text
        .trim()
        .replace(/^[\["]+/, '')
        .replace(/[\]"]+$/, '')
        .trim()
}

export function parseSearchBoxDelimiterAutocompleteText(
    text: string,
    cursorIndex: number,
): SearchBoxDelimiterAutocompleteText | null {
    const boundedCursorIndex = Math.min(Math.max(cursorIndex, 0), text.length)
    const colonIndex = text.indexOf(':')

    if (colonIndex !== -1 && boundedCursorIndex > colonIndex) {
        const replaceStartIndex = skipWhitespace(text, colonIndex + 1)
        const qualifiedRange = getQualifiedAutocompleteRange(
            text,
            replaceStartIndex,
            boundedCursorIndex,
        )
        const replaceEndIndex =
            qualifiedRange?.replaceEndIndex ??
            findNextWhitespaceIndex(
                text,
                Math.max(replaceStartIndex, boundedCursorIndex),
            )
        const query = text
            .slice(
                qualifiedRange?.queryStartIndex ?? replaceStartIndex,
                qualifiedRange?.queryEndIndex ??
                    Math.max(replaceStartIndex, boundedCursorIndex),
            )
        const unqualifiedQuery = stripSearchBoxAutocompleteQualifier(query)

        return {
            key: text.slice(0, colonIndex).trim(),
            kind: 'value',
            query: unqualifiedQuery,
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
    const qualifiedRange = getQualifiedAutocompleteRange(
        text,
        replaceStartIndex,
        boundedCursorIndex,
    )
    const query = text
        .slice(
            qualifiedRange?.queryStartIndex ?? replaceStartIndex,
            qualifiedRange?.queryEndIndex ??
                Math.min(queryEndIndex, boundedCursorIndex),
        )
    const unqualifiedQuery = stripSearchBoxAutocompleteQualifier(query)

    if (!unqualifiedQuery) {
        return null
    }

    return {
        key: '',
        kind: 'key',
        query: unqualifiedQuery,
        replaceEndIndex,
        replaceStartIndex,
    }
}
