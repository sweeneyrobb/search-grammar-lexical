import {
    $createParagraphNode,
    $createTextNode,
    $getRoot,
} from 'lexical'

import {
    $createSearchBoxPairNode,
    $createSearchBoxUnstructuredTextNode,
} from '../node/index.js'
import type { SearchBoxData } from '../type.js'

export function populateSearchBoxRoot(data: SearchBoxData) {
    const root = $getRoot()
    const paragraph = $createParagraphNode()
    const { structuredValue, unstructuredValue } = data

    structuredValue.forEach(({ key, value }, index) => {
        const pairNode = $createSearchBoxPairNode()

        pairNode.append(
            $createTextNode(`${key}: `).toggleFormat('bold'),
            $createTextNode(value),
        )

        paragraph.append(pairNode)

        if (index < structuredValue.length - 1) {
            paragraph.append($createTextNode(' | '))
        }
    })

    if (unstructuredValue) {
        if (structuredValue.length > 0) {
            paragraph.append($createTextNode(' '))
        }

        paragraph.append($createSearchBoxUnstructuredTextNode(unstructuredValue))
    }

    root.clear()
    root.append(paragraph)
    paragraph.selectEnd()
}
