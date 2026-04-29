import {
    $applyNodeReplacement,
    TextNode,
    type EditorConfig,
    type LexicalNode,
    type LexicalUpdateJSON,
    type NodeKey,
    type SerializedTextNode,
} from 'lexical'

export class SearchBoxUnstructuredTextNode extends TextNode {
    static getType(): string {
        return 'search-box-unstructured-text'
    }

    static clone(
        node: SearchBoxUnstructuredTextNode,
    ): SearchBoxUnstructuredTextNode {
        return new SearchBoxUnstructuredTextNode(node.__text, node.__key)
    }

    static importJSON(
        serializedNode: SerializedTextNode,
    ): SearchBoxUnstructuredTextNode {
        return $createSearchBoxUnstructuredTextNode().updateFromJSON(
            serializedNode,
        )
    }

    createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config)
        element.classList.add('search-box-unstructured-text')

        return element
    }

    updateDOM(
        prevNode: this,
        dom: HTMLElement,
        config: EditorConfig,
    ): boolean {
        const shouldReplace = super.updateDOM(prevNode, dom, config)
        dom.classList.add('search-box-unstructured-text')

        return shouldReplace
    }

    exportJSON(): SerializedTextNode {
        return {
            ...super.exportJSON(),
            type: SearchBoxUnstructuredTextNode.getType(),
            version: 1,
        }
    }

    updateFromJSON(
        serializedNode: LexicalUpdateJSON<SerializedTextNode>,
    ): this {
        return super.updateFromJSON(serializedNode)
    }
}

export function $createSearchBoxUnstructuredTextNode(
    text = '',
): SearchBoxUnstructuredTextNode {
    return $applyNodeReplacement(new SearchBoxUnstructuredTextNode(text))
}

export function $isSearchBoxUnstructuredTextNode(
    node: LexicalNode | null | undefined,
): node is SearchBoxUnstructuredTextNode {
    return node instanceof SearchBoxUnstructuredTextNode
}
