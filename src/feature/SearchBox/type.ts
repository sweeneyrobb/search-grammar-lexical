export type SearchBoxDataItem = {
    displayName?: string
    key: string
    value: string
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
