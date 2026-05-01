import type {
    SearchBoxAutocompleteKeyOption,
    SearchBoxAutocompleteValueOption,
    SearchBoxData,
} from './type.js'

export const SEARCH_BOX_SAMPLE_DATA: SearchBoxData = {
    structuredValue: [
        { displayName: 'Name', key: 'name', value: 'John Doe' },
        { displayName: 'Age', key: 'age', value: '30' },
        { displayName: 'City', key: 'city', value: 'New York' },
    ],
    unstructuredValue: 'status active',
}

export const SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION: SearchBoxAutocompleteKeyOption[] =
    [
        { displayName: 'Name', key: 'name' },
        { displayName: 'Age', key: 'age' },
        { displayName: 'City', key: 'city' },
        { displayName: 'Status', key: 'status' },
        { displayName: 'Assignee', key: 'assignee' },
        { displayName: 'Priority', key: 'priority' },
    ]

export const SEARCH_BOX_AUTOCOMPLETE_VALUE_OPTION: SearchBoxAutocompleteValueOption[] =
    [
        { key: 'city', value: 'Cairo' },
        { key: 'city', value: 'Calgary' },
        { key: 'city', value: 'California' },
        { key: 'city', value: 'Cambridge' },
        { key: 'city', value: 'New York' },
        { key: 'status', value: 'open' },
        { key: 'status', value: 'pending' },
        { key: 'status', value: 'in progress' },
        { key: 'status', value: 'closed' },
        { key: 'priority', value: 'high' },
        { key: 'priority', value: 'medium' },
        { key: 'priority', value: 'low' },
        { key: 'age', value: '30' },
        { key: 'name', value: 'John Doe' },
    ]
