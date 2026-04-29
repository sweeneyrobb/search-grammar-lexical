import {
    $createParagraphNode,
    $createTextNode,
    $getRoot,
} from 'lexical'

import type { SearchBoxDataItem } from '../type.js'

export function populateSearchBoxRoot(data: SearchBoxDataItem[]) {
    const root = $getRoot()
    const paragraph = $createParagraphNode()

    data.forEach(({ key, value }, index) => {
        paragraph.append(
            $createTextNode(`${key}: `).toggleFormat('bold'),
            $createTextNode(value),
        )

        if (index < data.length - 1) {
            paragraph.append($createTextNode(' | '))
        }
    })

    root.clear()
    root.append(paragraph)
    paragraph.selectEnd()
}
