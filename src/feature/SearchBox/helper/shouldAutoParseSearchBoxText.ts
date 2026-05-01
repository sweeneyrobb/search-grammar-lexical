type InsertedCharacter = {
    character: string
    index: number
}

type QualifierState = {
    bracketOpen: boolean
    quoteOpen: boolean
}

const isWhitespace = (character: string) => /\s/.test(character)

function getInsertedCharacter(
    previousText: string,
    nextText: string,
): InsertedCharacter | null {
    if (nextText.length !== previousText.length + 1) {
        return null
    }

    let startIndex = 0

    while (
        startIndex < previousText.length &&
        previousText.charAt(startIndex) === nextText.charAt(startIndex)
    ) {
        startIndex += 1
    }

    return {
        character: nextText.charAt(startIndex),
        index: startIndex,
    }
}

function getQualifierStateAt(text: string, index: number): QualifierState {
    const state: QualifierState = {
        bracketOpen: false,
        quoteOpen: false,
    }

    for (let textIndex = 0; textIndex < index; textIndex += 1) {
        const character = text.charAt(textIndex)

        if (state.quoteOpen) {
            state.quoteOpen = character !== '"'
            continue
        }

        if (state.bracketOpen) {
            state.bracketOpen = character !== ']'
            continue
        }

        if (character === '"') {
            state.quoteOpen = true
            continue
        }

        if (character === '[') {
            state.bracketOpen = true
        }
    }

    return state
}

export function shouldAutoParseSearchBoxText(
    previousText: string,
    nextText: string,
): boolean {
    const insertedCharacter = getInsertedCharacter(previousText, nextText)

    if (!insertedCharacter) {
        return false
    }

    const state = getQualifierStateAt(nextText, insertedCharacter.index)
    const { character } = insertedCharacter

    if (character === '"') {
        return state.quoteOpen
    }

    if (character === ']') {
        return state.bracketOpen
    }

    return isWhitespace(character) && !state.bracketOpen && !state.quoteOpen
}
