import type { SearchBoxAutocompleteKeyOption, SearchBoxData } from '../type.js'
import { normalizeSearchBoxData } from './normalizeSearchBoxData.js'
import { parseSearchBoxText } from './parseSearchBoxText.js'

export function parseNormalizedSearchBoxData(
    text: string,
    keyOption?: SearchBoxAutocompleteKeyOption[],
): SearchBoxData {
    return normalizeSearchBoxData(parseSearchBoxText(text), keyOption)
}
