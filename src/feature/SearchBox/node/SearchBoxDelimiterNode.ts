import {
    $applyNodeReplacement,
    TextNode,
    type EditorConfig,
    type LexicalNode,
    type LexicalUpdateJSON,
    type SerializedTextNode,
} from 'lexical'

export class SearchBoxDelimiterNode extends TextNode {
    static getType(): string {
        return 'search-box-delimiter'
    }

    static clone(node: SearchBoxDelimiterNode): SearchBoxDelimiterNode {
        return new SearchBoxDelimiterNode(node.__text, node.__key)
    }

    static importJSON(
        serializedNode: SerializedTextNode,
    ): SearchBoxDelimiterNode {
        return $createSearchBoxDelimiterNode().updateFromJSON(serializedNode)
    }

    createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config)
        element.classList.add('search-box-delimiter')

        return element
    }

    updateDOM(
        prevNode: this,
        dom: HTMLElement,
        config: EditorConfig,
    ): boolean {
        const shouldReplace = super.updateDOM(prevNode, dom, config)
        dom.classList.add('search-box-delimiter')

        return shouldReplace
    }

    exportJSON(): SerializedTextNode {
        return {
            ...super.exportJSON(),
            type: SearchBoxDelimiterNode.getType(),
            version: 1,
        }
    }

    updateFromJSON(
        serializedNode: LexicalUpdateJSON<SerializedTextNode>,
    ): this {
        return super.updateFromJSON(serializedNode)
    }
}

export function $createSearchBoxDelimiterNode(
    text = ' ',
): SearchBoxDelimiterNode {
    return $applyNodeReplacement(
        new SearchBoxDelimiterNode(text).toggleUnmergeable(),
    )
}

export function $isSearchBoxDelimiterNode(
    node: LexicalNode | null | undefined,
): node is SearchBoxDelimiterNode {
    return node instanceof SearchBoxDelimiterNode
}
