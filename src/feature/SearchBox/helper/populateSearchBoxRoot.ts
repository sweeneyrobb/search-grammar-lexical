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

function formatSearchBoxKey(key: string): string {
    if (!/[\s:]/.test(key)) {
        return key
    }

    return `[${key}]`
}

function formatSearchBoxValue(value: string): string {
    if (!/\s/.test(value)) {
        return value
    }

    if (!value.includes('"')) {
        return `"${value}"`
    }

    return `[${value}]`
}

export function populateSearchBoxRoot(data: SearchBoxData) {
    const root = $getRoot()
    const paragraph = $createParagraphNode()
    const { structuredValue, unstructuredValue } = data

    structuredValue.forEach(({ key, value }, index) => {
        const pairNode = $createSearchBoxPairNode()

        pairNode.append(
            $createTextNode(`${formatSearchBoxKey(key)}:`).toggleFormat('bold'),
            $createTextNode(formatSearchBoxValue(value)),
        )

        paragraph.append(pairNode)

        if (index < structuredValue.length - 1) {
            paragraph.append($createTextNode(' '))
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
