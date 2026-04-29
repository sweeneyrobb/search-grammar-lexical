import {
    $createParagraphNode,
    $createTextNode,
    $getRoot,
} from 'lexical'

import { $createSearchBoxPairNode } from '../node/index.js'
import type { SearchBoxDataItem } from '../type.js'

export function populateSearchBoxRoot(data: SearchBoxDataItem[]) {
    const root = $getRoot()
    const paragraph = $createParagraphNode()

    data.forEach(({ key, value }, index) => {
        const pairNode = $createSearchBoxPairNode()

        pairNode.append(
            $createTextNode(`${key}: `).toggleFormat('bold'),
            $createTextNode(value),
        )

        paragraph.append(pairNode)

        if (index < data.length - 1) {
            paragraph.append($createTextNode(' | '))
        }
    })

    root.clear()
    root.append(paragraph)
    paragraph.selectEnd()
}
