import {
    $applyNodeReplacement,
    ElementNode,
    type EditorConfig,
    type LexicalNode,
    type LexicalUpdateJSON,
    type NodeKey,
    type SerializedElementNode,
} from 'lexical'

export class SearchBoxPairNode extends ElementNode {
    static getType(): string {
        return 'search-box-pair'
    }

    static clone(node: SearchBoxPairNode): SearchBoxPairNode {
        return new SearchBoxPairNode(node.__key)
    }

    static importJSON(
        serializedNode: SerializedElementNode,
    ): SearchBoxPairNode {
        return $createSearchBoxPairNode().updateFromJSON(serializedNode)
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const element = document.createElement('span')
        element.className = 'search-box-pair'

        return element
    }

    updateDOM(): boolean {
        return false
    }

    exportJSON(): SerializedElementNode {
        return {
            ...super.exportJSON(),
            type: SearchBoxPairNode.getType(),
            version: 1,
        }
    }

    updateFromJSON(
        serializedNode: LexicalUpdateJSON<SerializedElementNode>,
    ): this {
        return super.updateFromJSON(serializedNode)
    }

    isInline(): true {
        return true
    }

    canInsertTextBefore(): true {
        return true
    }

    canInsertTextAfter(): true {
        return true
    }
}

export function $createSearchBoxPairNode(): SearchBoxPairNode {
    return $applyNodeReplacement(new SearchBoxPairNode())
}

export function $isSearchBoxPairNode(
    node: LexicalNode | null | undefined,
): node is SearchBoxPairNode {
    return node instanceof SearchBoxPairNode
}
