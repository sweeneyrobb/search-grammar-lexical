import {
    $createParagraphNode,
    $findMatchingParent,
    $getRoot,
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    type LexicalEditor,
    type LexicalNode,
} from 'lexical'

import {
    $createSearchBoxDelimiterNode,
    $isSearchBoxDelimiterNode,
    $isSearchBoxPairNode,
    type SearchBoxDelimiterNode,
    type SearchBoxPairNode,
} from '../node/index.js'

export function getSearchBoxPairNode(
    node: LexicalNode | null | undefined,
): SearchBoxPairNode | null {
    if (!node) {
        return null
    }

    if ($isSearchBoxPairNode(node)) {
        return node
    }

    return $findMatchingParent(node, $isSearchBoxPairNode)
}

export function getSelectedSearchBoxPairNode(): SearchBoxPairNode | null {
    const selection = $getSelection()

    if (!$isRangeSelection(selection)) {
        return null
    }

    for (const node of selection.getNodes()) {
        const pairNode = getSearchBoxPairNode(node)

        if (pairNode) {
            return pairNode
        }
    }

    if (!selection.isCollapsed()) {
        return null
    }

    const anchor = selection.anchor
    const anchorNode = anchor.getNode()

    if (anchor.type === 'element' && $isElementNode(anchorNode)) {
        return getSearchBoxPairNode(
            anchorNode.getChildAtIndex(anchor.offset - 1),
        )
    }

    if (anchor.type === 'text' && anchor.offset === 0) {
        return getSearchBoxPairNode(anchorNode.getPreviousSibling())
    }

    return null
}

export function getSearchBoxDelimiterBackspaceTarget(): {
    delimiterNode: SearchBoxDelimiterNode
    pairNode: SearchBoxPairNode
} | null {
    const selection = $getSelection()

    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return null
    }

    const anchor = selection.anchor

    if (anchor.type !== 'text') {
        return null
    }

    const anchorNode = anchor.getNode()

    if (!$isSearchBoxDelimiterNode(anchorNode)) {
        return null
    }

    const delimiterText = anchorNode.getTextContent()
    const isEmptyDelimiter = delimiterText.length === 0
    const isAtDelimiterStart = anchor.offset === 0
    const isAtUntouchedDelimiterEnd =
        /^\s+$/.test(delimiterText) && anchor.offset === delimiterText.length

    if (
        !isEmptyDelimiter &&
        !isAtDelimiterStart &&
        !isAtUntouchedDelimiterEnd
    ) {
        return null
    }

    const previousSibling = anchorNode.getPreviousSibling()

    if (!$isSearchBoxPairNode(previousSibling)) {
        return null
    }

    return {
        delimiterNode: anchorNode,
        pairNode: previousSibling,
    }
}

export function getSelectionRect(editor: LexicalEditor) {
    const domSelection = window.getSelection()

    if (domSelection?.rangeCount) {
        const selectionRect = domSelection.getRangeAt(0).getBoundingClientRect()

        if (selectionRect.width || selectionRect.height) {
            return selectionRect
        }
    }

    const lexicalSelection = $getSelection()

    if (!$isRangeSelection(lexicalSelection)) {
        return null
    }

    const anchorNode = lexicalSelection.anchor.getNode()
    const anchorElement = editor.getElementByKey(anchorNode.getKey())

    return anchorElement?.getBoundingClientRect() ?? null
}

export function ensureSearchBoxHasDefaultDelimiter() {
    const root = $getRoot()

    if (root.getTextContent()) {
        return false
    }

    const paragraph = $createParagraphNode()
    const delimiterNode = $createSearchBoxDelimiterNode()

    paragraph.append(delimiterNode)
    root.clear()
    root.append(paragraph)
    delimiterNode.selectEnd()

    return true
}
