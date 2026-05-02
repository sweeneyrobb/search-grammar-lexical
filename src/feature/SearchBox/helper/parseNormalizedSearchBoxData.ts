import type { SearchBoxData } from '../type.js'
import { normalizeSearchBoxData } from './normalizeSearchBoxData.js'
import { parseSearchBoxText } from './parseSearchBoxText.js'

export function parseNormalizedSearchBoxData(text: string): SearchBoxData {
    return normalizeSearchBoxData(parseSearchBoxText(text))
}
