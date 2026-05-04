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

export type SearchBoxAutocompleteValueOption = {
    key: string
    value: string
}

export type SearchBoxAutocompleteKeyOption = {
    displayName?: string
    key: string
}
