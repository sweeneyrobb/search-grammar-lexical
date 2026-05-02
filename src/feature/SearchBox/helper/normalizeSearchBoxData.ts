import { SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION } from '../constant.js'
import type { SearchBoxData } from '../type.js'

export function normalizeSearchBoxKey(label: string) {
    const normalizedLabel = label.toLocaleLowerCase()

    return SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION.find(item => {
        const displayName = item.displayName ?? item.key

        return (
            item.key.toLocaleLowerCase() === normalizedLabel ||
            displayName.toLocaleLowerCase() === normalizedLabel
        )
    })
}

export function normalizeSearchBoxData(data: SearchBoxData): SearchBoxData {
    return {
        ...data,
        structuredValue: data.structuredValue.map(item => {
            const keyOption = normalizeSearchBoxKey(item.key)

            if (!keyOption) {
                return item
            }

            const displayName = keyOption.displayName ?? keyOption.key

            return {
                ...item,
                displayName,
                key: keyOption.key,
            }
        }),
    }
}
