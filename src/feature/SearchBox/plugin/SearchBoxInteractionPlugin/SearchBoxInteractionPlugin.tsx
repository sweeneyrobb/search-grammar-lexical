import { useEffect, useRef } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
    $getNearestNodeFromDOMNode,
    $getRoot,
    $isTextNode,
    CLICK_COMMAND,
    COMMAND_PRIORITY_HIGH,
    HISTORY_MERGE_TAG,
    KEY_BACKSPACE_COMMAND,
    KEY_ENTER_COMMAND,
} from 'lexical'

import {
    ensureSearchBoxHasDefaultDelimiter,
    getSearchBoxDelimiterBackspaceTarget,
    getSearchBoxPairNode,
    getSelectedSearchBoxPairNode,
    parseNormalizedSearchBoxData,
    populateSearchBoxRoot,
    shouldAutoParseSearchBoxText,
} from '../../helper/index.js'
import type { SearchBoxData } from '../../type.js'

type SearchBoxInteractionPluginProps = {
    onSubmit: ((data: SearchBoxData) => void) | undefined
}

export function SearchBoxInteractionPlugin({
    onSubmit,
}: SearchBoxInteractionPluginProps) {
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

                if (!text) {
                    isAutoParsingRef.current = true

                    editor.update(
                        () => {
                            ensureSearchBoxHasDefaultDelimiter()
                        },
                        { tag: HISTORY_MERGE_TAG },
                    )

                    isAutoParsingRef.current = false
                    return
                }

                if (
                    isAutoParsingRef.current ||
                    previousText === null ||
                    !shouldAutoParseSearchBoxText(previousText, text)
                ) {
                    return
                }

                const parsedData = parseNormalizedSearchBoxData(text)

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
            event => {
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
            event => {
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
            event => {
                event?.preventDefault()

                const text = $getRoot().getTextContent()
                const parsedData = parseNormalizedSearchBoxData(text)

                populateSearchBoxRoot(parsedData)
                onSubmit?.(parsedData)

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
    }, [editor, onSubmit])

    return null
}
