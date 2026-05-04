import { SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION } from '../constant.js'
import type { SearchBoxAutocompleteKeyOption, SearchBoxData } from '../type.js'

export function normalizeSearchBoxKey(
    label: string,
    keyOption: SearchBoxAutocompleteKeyOption[] = SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION,
) {
    const normalizedLabel = label.toLocaleLowerCase()

    return keyOption.find(item => {
        const displayName = item.displayName ?? item.key

        return (
            item.key.toLocaleLowerCase() === normalizedLabel ||
            displayName.toLocaleLowerCase() === normalizedLabel
        )
    })
}

export function normalizeSearchBoxData(
    data: SearchBoxData,
    keyOption?: SearchBoxAutocompleteKeyOption[],
): SearchBoxData {
    return {
        ...data,
        structuredValue: data.structuredValue.map(item => {
            const normalizedKeyOption = normalizeSearchBoxKey(
                item.key,
                keyOption,
            )

            if (!normalizedKeyOption) {
                return item
            }

            const displayName =
                normalizedKeyOption.displayName ?? normalizedKeyOption.key

            return {
                ...item,
                displayName,
                key: normalizedKeyOption.key,
            }
        }),
    }
}
