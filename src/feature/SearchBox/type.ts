export type SearchBoxRangeValue = {
    end: string
    kind: 'range'
    start: string
}

export type SearchBoxDataValue = string | string[] | SearchBoxRangeValue

export type SearchBoxDataItem = {
    displayName?: string
    key: string
    value: SearchBoxDataValue
}

export type SearchBoxData = {
    structuredValue: SearchBoxDataItem[]
    unstructuredValue: string
}

export type SearchBoxAutocompleteContext = {
    isBracketValue: boolean
    key: string
    kind: 'key' | 'value'
    query: string
    replaceEndIndex: number
    replaceStartIndex: number
}

export type SearchBoxChangeEvent = {
    autocomplete: SearchBoxAutocompleteContext | null
    data: SearchBoxData
    text: string
}

export type SearchBoxAutocompleteValueOption = {
    key: string
    value: string
}

export type SearchBoxAutocompleteKeyOption = {
    displayName?: string
    key: string
}
