import { useEffect } from 'react'

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import {
    $findMatchingParent,
    $getNearestNodeFromDOMNode,
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    CLICK_COMMAND,
    COMMAND_PRIORITY_HIGH,
    KEY_BACKSPACE_COMMAND,
    type LexicalNode,
} from 'lexical'

import { populateSearchBoxRoot } from './helper/index.js'
import {
    $isSearchBoxPairNode,
    SearchBoxUnstructuredTextNode,
    SearchBoxPairNode,
    type SearchBoxPairNode as SearchBoxPairNodeType,
} from './node/index.js'
import type { SearchBoxData } from './type.js'

import './SearchBox.style.css'

type SearchBoxProps = {
    data: SearchBoxData
}

const onError = (error: Error) => {
    console.error(error)
}

const theme = {
    text: {
        bold: 'search-box-key',
    },
}

function SearchBoxDataPlugin({ data }: SearchBoxProps) {
    const [editor] = useLexicalComposerContext()

    useEffect(() => {
        editor.update(() => {
            populateSearchBoxRoot(data)
        })
    }, [data, editor])

    return null
}

function getSearchBoxPairNode(
    node: LexicalNode | null | undefined,
): SearchBoxPairNodeType | null {
    if (!node) {
        return null
    }

    if ($isSearchBoxPairNode(node)) {
        return node
    }

    return $findMatchingParent(node, $isSearchBoxPairNode)
}

function getSelectedSearchBoxPairNode(): SearchBoxPairNodeType | null {
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
        return getSearchBoxPairNode(anchorNode.getChildAtIndex(anchor.offset - 1))
    }

    if (anchor.type === 'text' && anchor.offset === 0) {
        return getSearchBoxPairNode(anchorNode.getPreviousSibling())
    }

    return null
}

function SearchBoxInteractionPlugin() {
    const [editor] = useLexicalComposerContext()

    useEffect(() => {
        const removeClickCommand = editor.registerCommand(
            CLICK_COMMAND,
            (event) => {
                const target = event.target

                if (!(target instanceof Node)) {
                    return false
                }

                const node = $getNearestNodeFromDOMNode(target)
                const pairNode = getSearchBoxPairNode(node)

                if (!pairNode) {
                    return false
                }

                event.preventDefault()
                pairNode.remove()

                return true
            },
            COMMAND_PRIORITY_HIGH,
        )

        const removeBackspaceCommand = editor.registerCommand(
            KEY_BACKSPACE_COMMAND,
            (event) => {
                const pairNode = getSelectedSearchBoxPairNode()

                if (!pairNode) {
                    return false
                }

                event.preventDefault()
                pairNode.remove()

                return true
            },
            COMMAND_PRIORITY_HIGH,
        )

        return () => {
            removeClickCommand()
            removeBackspaceCommand()
        }
    }, [editor])

    return null
}

export function SearchBox({ data }: SearchBoxProps) {
    return (
        <LexicalComposer
            initialConfig={{
                namespace: 'SearchBox',
                nodes: [SearchBoxPairNode, SearchBoxUnstructuredTextNode],
                onError,
                theme,
            }}
        >
            <div className="editor-container">
                <div className="editor-inner">
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable className="editor-input" />
                        }
                        placeholder={
                            <div className="editor-placeholder">
                                Enter some text...
                            </div>
                        }
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <AutoFocusPlugin />
                    <SearchBoxDataPlugin data={data} />
                    <SearchBoxInteractionPlugin />
                </div>
            </div>
        </LexicalComposer>
    )
}
