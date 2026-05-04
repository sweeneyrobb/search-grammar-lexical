import { useCallback, useRef, useState } from 'react'

import { SearchBox } from './SearchBox.js'
import {
    SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION,
    SEARCH_BOX_AUTOCOMPLETE_VALUE_OPTION,
    SEARCH_BOX_SAMPLE_DATA,
} from './constant.js'
import type {
    SearchBoxAutocompleteValueOption,
    SearchBoxChangeEvent,
    SearchBoxData,
} from './type.js'

type SearchBoxContainerProps = {
    onChange?: (event: SearchBoxChangeEvent) => void
    onSubmit?: (data: SearchBoxData) => void
}

const BACKEND_VALUE_OPTION: SearchBoxAutocompleteValueOption[] = [
    ...SEARCH_BOX_AUTOCOMPLETE_VALUE_OPTION,
    { key: 'assignee', value: 'Ada Lovelace' },
    { key: 'assignee', value: 'Grace Hopper' },
    { key: 'assignee', value: 'Katherine Johnson' },
    { key: 'city', value: 'Cape Town' },
    { key: 'city', value: 'Charlotte' },
    { key: 'city', value: 'Chicago' },
    { key: 'priority', value: 'critical' },
    { key: 'status', value: 'needs review' },
]

function getFakeBackendValueOption({
    key,
    query,
}: NonNullable<SearchBoxChangeEvent['autocomplete']>) {
    const canonicalKey =
        SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION.find(item => {
            const displayName = item.displayName ?? item.key

            return (
                item.key.toLocaleLowerCase() === key.toLocaleLowerCase() ||
                displayName.toLocaleLowerCase() === key.toLocaleLowerCase()
            )
        })?.key ?? key
    const normalizedQuery = query.toLocaleLowerCase()

    return BACKEND_VALUE_OPTION.filter(
        item =>
            item.key === canonicalKey &&
            item.value.toLocaleLowerCase().includes(normalizedQuery),
    )
}

export function SearchBoxContainer({
    onChange,
    onSubmit,
}: SearchBoxContainerProps) {
    const requestIdRef = useRef(0)
    const [autocompleteValueOption, setAutocompleteValueOption] = useState(
        SEARCH_BOX_AUTOCOMPLETE_VALUE_OPTION,
    )
    const handleChange = useCallback(
        (event: SearchBoxChangeEvent) => {
            onChange?.(event)

            if (event.autocomplete?.kind !== 'value') {
                setAutocompleteValueOption(SEARCH_BOX_AUTOCOMPLETE_VALUE_OPTION)
                return
            }

            const requestId = requestIdRef.current + 1

            requestIdRef.current = requestId

            window.setTimeout(() => {
                if (requestIdRef.current !== requestId || !event.autocomplete) {
                    return
                }

                setAutocompleteValueOption(
                    getFakeBackendValueOption(event.autocomplete),
                )
            }, 1500)
        },
        [onChange],
    )

    return (
        <SearchBox
            autocompleteKeyOption={SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION}
            autocompleteValueOption={autocompleteValueOption}
            data={SEARCH_BOX_SAMPLE_DATA}
            onChange={handleChange}
            {...(onSubmit ? { onSubmit } : {})}
        />
    )
}
