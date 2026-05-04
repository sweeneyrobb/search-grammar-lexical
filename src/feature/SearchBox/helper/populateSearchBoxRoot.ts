import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'

import {
    $createSearchBoxDelimiterNode,
    $createSearchBoxPairNode,
    $createSearchBoxUnstructuredTextNode,
} from '../node/index.js'
import type {
    SearchBoxData,
    SearchBoxDataValue,
    SearchBoxRangeValue,
} from '../type.js'

function formatSearchBoxKey(key: string): string {
    if (!/[\s:]/.test(key)) {
        return key
    }

    return `[${key}]`
}

function isSearchBoxRangeValue(
    value: SearchBoxDataValue,
): value is SearchBoxRangeValue {
    return typeof value === 'object' && !Array.isArray(value)
}

function formatSearchBoxListItem(value: string): string {
    if (!value || /[\s,]/.test(value)) {
        return `"${value}"`
    }

    return value
}

function formatSearchBoxValue(value: SearchBoxDataValue): string {
    if (Array.isArray(value)) {
        return `[${value.map(formatSearchBoxListItem).join(', ')}]`
    }

    if (isSearchBoxRangeValue(value)) {
        return `[${value.start} - ${value.end}]`
    }

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

    structuredValue.forEach(({ displayName, key, value }) => {
        const pairNode = $createSearchBoxPairNode()
        const label = displayName ?? key

        pairNode.append(
            $createTextNode(`${formatSearchBoxKey(label)}:`).toggleFormat(
                'bold',
            ),
            $createTextNode(formatSearchBoxValue(value)),
        )

        paragraph.append(pairNode, $createSearchBoxDelimiterNode())
    })

    if (unstructuredValue) {
        paragraph.append(
            $createSearchBoxUnstructuredTextNode(unstructuredValue),
        )
    }

    if (!paragraph.getTextContent()) {
        paragraph.append($createSearchBoxDelimiterNode())
    }

    root.clear()
    root.append(paragraph)
    paragraph.selectEnd()
}
