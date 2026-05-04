import type { SearchBoxData, SearchBoxDataValue } from '../type.js'

type ParseResult<TValue = string> = {
    nextIndex: number
    value: TValue
}

const isWhitespace = (character: string) => /\s/.test(character)

function skipWhitespace(text: string, index: number): number {
    let nextIndex = index

    while (nextIndex < text.length && isWhitespace(text.charAt(nextIndex))) {
        nextIndex += 1
    }

    return nextIndex
}

function parseBracketValue(text: string, index: number): ParseResult | null {
    if (text.charAt(index) !== '[') {
        return null
    }

    const endIndex = text.indexOf(']', index + 1)

    if (endIndex === -1) {
        return null
    }

    return {
        value: text.slice(index + 1, endIndex),
        nextIndex: endIndex + 1,
    }
}

function parseQuotedValue(text: string, index: number): ParseResult | null {
    if (text.charAt(index) !== '"') {
        return null
    }

    const endIndex = text.indexOf('"', index + 1)

    if (endIndex === -1) {
        return null
    }

    return {
        value: text.slice(index + 1, endIndex),
        nextIndex: endIndex + 1,
    }
}

function unquoteSearchBoxValue(value: string): string {
    const trimmedValue = value.trim()

    if (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) {
        return trimmedValue.slice(1, -1)
    }

    return trimmedValue
}

function splitCommaSeparatedValue(value: string): string[] {
    const item: string[] = []
    let currentItem = ''
    let isInsideQuote = false

    for (const character of value) {
        if (character === '"') {
            isInsideQuote = !isInsideQuote
            currentItem += character
            continue
        }

        if (character === ',' && !isInsideQuote) {
            item.push(unquoteSearchBoxValue(currentItem))
            currentItem = ''
            continue
        }

        currentItem += character
    }

    const finalItem = unquoteSearchBoxValue(currentItem)

    if (finalItem || !/,\s*$/.test(value)) {
        item.push(finalItem)
    }

    return item
}

function splitRangeValue(value: string): [string, string] | null {
    let isInsideQuote = false
    const rangeSeparatorIndex: number[] = []

    for (let index = 0; index < value.length; index += 1) {
        const character = value.charAt(index)

        if (character === '"') {
            isInsideQuote = !isInsideQuote
            continue
        }

        if (character === '-' && !isInsideQuote) {
            rangeSeparatorIndex.push(index)
        }
    }

    if (rangeSeparatorIndex.length !== 1) {
        return null
    }

    const separatorIndex = rangeSeparatorIndex[0]

    if (separatorIndex === undefined) {
        return null
    }

    return [
        unquoteSearchBoxValue(value.slice(0, separatorIndex)),
        unquoteSearchBoxValue(value.slice(separatorIndex + 1)),
    ]
}

function parseBracketSearchBoxValue(value: string): SearchBoxDataValue {
    const listValue = splitCommaSeparatedValue(value)

    if (listValue.length > 1) {
        return listValue
    }

    const rangeValue = splitRangeValue(value)

    if (rangeValue) {
        const [start, end] = rangeValue

        return {
            end,
            kind: 'range',
            start,
        }
    }

    return value
}

function parseKey(text: string, index: number): ParseResult | null {
    const bracketKey = parseBracketValue(text, index)

    if (bracketKey) {
        return bracketKey
    }

    let nextIndex = index

    while (
        nextIndex < text.length &&
        text.charAt(nextIndex) !== ':' &&
        !isWhitespace(text.charAt(nextIndex))
    ) {
        nextIndex += 1
    }

    if (nextIndex === index) {
        return null
    }

    return {
        value: text.slice(index, nextIndex),
        nextIndex,
    }
}

function parseValue(
    text: string,
    index: number,
): ParseResult<SearchBoxDataValue> | null {
    const bracketValue = parseBracketValue(text, index)

    if (bracketValue) {
        return {
            ...bracketValue,
            value: parseBracketSearchBoxValue(bracketValue.value),
        }
    }

    const quotedValue = parseQuotedValue(text, index)

    if (quotedValue) {
        return quotedValue
    }

    let nextIndex = index

    while (nextIndex < text.length && !isWhitespace(text.charAt(nextIndex))) {
        nextIndex += 1
    }

    if (nextIndex === index) {
        return null
    }

    return {
        value: text.slice(index, nextIndex),
        nextIndex,
    }
}

export function parseSearchBoxText(text: string): SearchBoxData {
    const trimmedText = text.trim()
    const structuredValue: SearchBoxData['structuredValue'] = []

    if (!trimmedText) {
        return {
            structuredValue,
            unstructuredValue: '',
        }
    }

    let index = 0

    while (index < trimmedText.length) {
        index = skipWhitespace(trimmedText, index)

        const key = parseKey(trimmedText, index)

        const colonIndex = skipWhitespace(trimmedText, key?.nextIndex ?? index)

        if (!key || trimmedText.charAt(colonIndex) !== ':') {
            break
        }

        const value = parseValue(
            trimmedText,
            skipWhitespace(trimmedText, colonIndex + 1),
        )

        if (!value) {
            break
        }

        const nextIndex = skipWhitespace(trimmedText, value.nextIndex)

        if (nextIndex < trimmedText.length && value.nextIndex === nextIndex) {
            break
        }

        structuredValue.push({ key: key.value, value: value.value })
        index = nextIndex
    }

    return {
        structuredValue,
        unstructuredValue: trimmedText.slice(index).trim(),
    }
}
