import type { SearchBoxData } from '../type.js'

type ParseResult = {
    value: string
    nextIndex: number
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

function parseValue(text: string, index: number): ParseResult | null {
    const qualifiedValue =
        parseBracketValue(text, index) ?? parseQuotedValue(text, index)

    if (qualifiedValue) {
        return qualifiedValue
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
