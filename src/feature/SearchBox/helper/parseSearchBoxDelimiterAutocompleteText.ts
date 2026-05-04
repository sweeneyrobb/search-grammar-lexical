export type SearchBoxDelimiterAutocompleteText = {
    isBracketValue: boolean
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

function skipSearchBoxAutocompleteWhitespace(
    text: string,
    startIndex: number,
    endIndex: number,
) {
    let index = startIndex

    while (index < endIndex && /\s/.test(text.charAt(index))) {
        index += 1
    }

    return index
}

function isSearchBoxBracketValueDelimiter(character: string) {
    return character === ',' || character === '-'
}

function findNextUnquotedBracketValueDelimiterIndex(
    text: string,
    startIndex: number,
    endIndex: number,
) {
    let isInsideQuote = false

    for (let index = startIndex; index < endIndex; index += 1) {
        const character = text.charAt(index)

        if (character === '"') {
            isInsideQuote = !isInsideQuote
            continue
        }

        if (isSearchBoxBracketValueDelimiter(character) && !isInsideQuote) {
            return index
        }
    }

    return -1
}

function findPreviousUnquotedBracketValueDelimiterIndex(
    text: string,
    startIndex: number,
    endIndex: number,
) {
    let isInsideQuote = false

    for (let index = startIndex; index >= endIndex; index -= 1) {
        const character = text.charAt(index)

        if (character === '"') {
            isInsideQuote = !isInsideQuote
            continue
        }

        if (isSearchBoxBracketValueDelimiter(character) && !isInsideQuote) {
            return index
        }
    }

    return -1
}

function getBracketValueAutocompleteRange(
    text: string,
    startIndex: number,
    cursorIndex: number,
): {
    queryEndIndex: number
    queryStartIndex: number
    replaceEndIndex: number
    replaceStartIndex: number
} | null {
    if (text.charAt(startIndex) !== '[') {
        return null
    }

    const bracketContentStartIndex = startIndex + 1
    const bracketEndIndex = text.indexOf(']', bracketContentStartIndex)
    const contentEndIndex =
        bracketEndIndex === -1 ? text.length : bracketEndIndex
    const boundedCursorIndex = Math.min(cursorIndex, contentEndIndex)
    const previousDelimiterIndex =
        findPreviousUnquotedBracketValueDelimiterIndex(
            text,
            boundedCursorIndex - 1,
            bracketContentStartIndex,
        )
    const queryStartIndex = skipSearchBoxAutocompleteWhitespace(
        text,
        previousDelimiterIndex === -1
            ? bracketContentStartIndex
            : previousDelimiterIndex + 1,
        contentEndIndex,
    )
    const nextDelimiterIndex = findNextUnquotedBracketValueDelimiterIndex(
        text,
        boundedCursorIndex,
        contentEndIndex,
    )

    return {
        queryEndIndex: boundedCursorIndex,
        queryStartIndex,
        replaceEndIndex:
            nextDelimiterIndex === -1 ? contentEndIndex : nextDelimiterIndex,
        replaceStartIndex: queryStartIndex,
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
        const valueStartIndex = skipWhitespace(text, colonIndex + 1)
        const bracketRange = getBracketValueAutocompleteRange(
            text,
            valueStartIndex,
            boundedCursorIndex,
        )
        const replaceStartIndex =
            bracketRange?.replaceStartIndex ?? valueStartIndex
        const qualifiedRange = getQualifiedAutocompleteRange(
            text,
            valueStartIndex,
            boundedCursorIndex,
        )
        const replaceEndIndex =
            bracketRange?.replaceEndIndex ??
            qualifiedRange?.replaceEndIndex ??
            findNextWhitespaceIndex(
                text,
                Math.max(replaceStartIndex, boundedCursorIndex),
            )
        const query = text.slice(
            bracketRange?.queryStartIndex ??
                qualifiedRange?.queryStartIndex ??
                replaceStartIndex,
            bracketRange?.queryEndIndex ??
                qualifiedRange?.queryEndIndex ??
                Math.max(replaceStartIndex, boundedCursorIndex),
        )
        const unqualifiedQuery = stripSearchBoxAutocompleteQualifier(query)

        return {
            isBracketValue: Boolean(bracketRange),
            key: text.slice(0, colonIndex).trim(),
            kind: 'value',
            query: unqualifiedQuery,
            replaceEndIndex,
            replaceStartIndex,
        }
    }

    const replaceStartIndex =
        findPreviousWhitespaceIndex(text, boundedCursorIndex) + 1
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
    const query = text.slice(
        qualifiedRange?.queryStartIndex ?? replaceStartIndex,
        qualifiedRange?.queryEndIndex ??
            Math.min(queryEndIndex, boundedCursorIndex),
    )
    const unqualifiedQuery = stripSearchBoxAutocompleteQualifier(query)

    if (!unqualifiedQuery) {
        return null
    }

    return {
        isBracketValue: false,
        key: '',
        kind: 'key',
        query: unqualifiedQuery,
        replaceEndIndex,
        replaceStartIndex,
    }
}
