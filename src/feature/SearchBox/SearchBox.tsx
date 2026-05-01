import { useEffect, useRef } from 'react'

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
    $getRoot,
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    $isTextNode,
    CLICK_COMMAND,
    COMMAND_PRIORITY_HIGH,
    KEY_BACKSPACE_COMMAND,
    KEY_ENTER_COMMAND,
    HISTORY_MERGE_TAG,
    type LexicalNode,
} from 'lexical'

import {
    parseSearchBoxText,
    populateSearchBoxRoot,
    shouldAutoParseSearchBoxText,
} from './helper/index.js'
import {
    $isSearchBoxDelimiterNode,
    $isSearchBoxPairNode,
    SearchBoxDelimiterNode,
    SearchBoxUnstructuredTextNode,
    SearchBoxPairNode,
    type SearchBoxDelimiterNode as SearchBoxDelimiterNodeType,
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

function getSearchBoxDelimiterBackspaceTarget(): {
    delimiterNode: SearchBoxDelimiterNodeType
    pairNode: SearchBoxPairNodeType
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

    if (!isEmptyDelimiter && !isAtDelimiterStart && !isAtUntouchedDelimiterEnd) {
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

function SearchBoxInteractionPlugin() {
    const [editor] = useLexicalComposerContext()
    const previousTextRef = useRef<string | null>(null)
    const isAutoParsingRef = useRef(false)

    useEffect(() => {
        previousTextRef.current = editor
            .getEditorState()
            .read(() => $getRoot().getTextContent())

        const removeAutoParseListener = editor.registerUpdateListener(
            ({ editorState }) => {
                const text = editorState.read(() => $getRoot().getTextContent())
                const previousText = previousTextRef.current

                previousTextRef.current = text

                if (
                    isAutoParsingRef.current ||
                    previousText === null ||
                    !shouldAutoParseSearchBoxText(previousText, text)
                ) {
                    return
                }

                const parsedData = parseSearchBoxText(text)

                if (
                    parsedData.structuredValue.length === 0 ||
                    parsedData.unstructuredValue
                ) {
                    return
                }

                isAutoParsingRef.current = true

                editor.update(
                    () => {
                        populateSearchBoxRoot(parsedData)
                    },
                    { tag: HISTORY_MERGE_TAG },
                )

                isAutoParsingRef.current = false
            },
        )

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
                const delimiterBackspaceTarget =
                    getSearchBoxDelimiterBackspaceTarget()

                if (delimiterBackspaceTarget) {
                    const { delimiterNode, pairNode } = delimiterBackspaceTarget
                    const nextSibling = delimiterNode.getNextSibling()
                    const previousSibling = pairNode.getPreviousSibling()

                    event.preventDefault()
                    pairNode.remove()
                    delimiterNode.remove()

                    if ($isTextNode(nextSibling)) {
                        nextSibling.select(0, 0)
                    } else if ($isTextNode(previousSibling)) {
                        previousSibling.selectEnd()
                    } else {
                        $getRoot().selectEnd()
                    }

                    return true
                }

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

        const removeEnterCommand = editor.registerCommand(
            KEY_ENTER_COMMAND,
            (event) => {
                event?.preventDefault()

                const text = $getRoot().getTextContent()
                populateSearchBoxRoot(parseSearchBoxText(text))

                return true
            },
            COMMAND_PRIORITY_HIGH,
        )

        return () => {
            removeAutoParseListener()
            removeClickCommand()
            removeBackspaceCommand()
            removeEnterCommand()
        }
    }, [editor])

    return null
}

export function SearchBox({ data }: SearchBoxProps) {
    return (
        <LexicalComposer
            initialConfig={{
                namespace: 'SearchBox',
                nodes: [
                    SearchBoxDelimiterNode,
                    SearchBoxPairNode,
                    SearchBoxUnstructuredTextNode,
                ],
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
