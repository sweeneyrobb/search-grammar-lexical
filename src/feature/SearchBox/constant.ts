import type {
    SearchBoxAutocompleteValueOption,
    SearchBoxData,
} from './type.js'

export const SEARCH_BOX_SAMPLE_DATA: SearchBoxData = {
    structuredValue: [
        { key: 'Name', value: 'John Doe' },
        { key: 'Age', value: '30' },
        { key: 'City', value: 'New York' },
    ],
    unstructuredValue: 'status active',
}

export const SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION = [
    'Name',
    'Age',
    'City',
    'Status',
    'Assignee',
    'Priority',
]

export const SEARCH_BOX_AUTOCOMPLETE_VALUE_OPTION: SearchBoxAutocompleteValueOption[] =
    [
        { key: 'City', value: 'Cairo' },
        { key: 'City', value: 'Calgary' },
        { key: 'City', value: 'California' },
        { key: 'City', value: 'Cambridge' },
        { key: 'City', value: 'New York' },
        { key: 'Status', value: 'open' },
        { key: 'Status', value: 'pending' },
        { key: 'Status', value: 'in progress' },
        { key: 'Status', value: 'closed' },
        { key: 'Priority', value: 'high' },
        { key: 'Priority', value: 'medium' },
        { key: 'Priority', value: 'low' },
        { key: 'Age', value: '30' },
        { key: 'Name', value: 'John Doe' },
    ]
