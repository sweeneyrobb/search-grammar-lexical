import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import {
    $createParagraphNode,
    $findMatchingParent,
    $getNearestNodeFromDOMNode,
    $getNodeByKey,
    $getRoot,
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    $isTextNode,
    CLICK_COMMAND,
    COMMAND_PRIORITY_HIGH,
    KEY_ARROW_DOWN_COMMAND,
    KEY_ARROW_UP_COMMAND,
    KEY_BACKSPACE_COMMAND,
    KEY_ENTER_COMMAND,
    KEY_TAB_COMMAND,
    HISTORY_MERGE_TAG,
    type LexicalEditor,
    type LexicalNode,
    type NodeKey,
} from 'lexical'

import { SearchBoxAutocomplete } from './component/index.js'
import {
    SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION,
    SEARCH_BOX_AUTOCOMPLETE_VALUE_OPTION,
} from './constant.js'
import {
    parseSearchBoxDelimiterAutocompleteText,
    parseSearchBoxText,
    populateSearchBoxRoot,
    shouldAutoParseSearchBoxText,
} from './helper/index.js'
import {
    $createSearchBoxDelimiterNode,
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
    onSubmit?: (data: SearchBoxData) => void
}

type SearchBoxSubmitProps = {
    onSubmit: ((data: SearchBoxData) => void) | undefined
}

type SearchBoxAutocompleteTarget = {
    key: string
    kind: 'key' | 'value'
    left: number
    nodeKey: NodeKey
    query: string
    replaceEndIndex: number
    replaceStartIndex: number
    top: number
}

type SearchBoxAutocompleteMatch = {
    insertText: string
    kind: 'key' | 'value'
    label: string
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
        return getSearchBoxPairNode(
            anchorNode.getChildAtIndex(anchor.offset - 1),
        )
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

function getSelectionRect(editor: LexicalEditor) {
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

function formatSearchBoxAutocompleteValue(value: string): string {
    if (!/\s/.test(value)) {
        return value
    }

    if (!value.includes('"')) {
        return `"${value}"`
    }

    return `[${value}]`
}

function normalizeSearchBoxKey(label: string) {
    const normalizedLabel = label.toLocaleLowerCase()

    return SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION.find(item => {
        const displayName = item.displayName ?? item.key

        return (
            item.key.toLocaleLowerCase() === normalizedLabel ||
            displayName.toLocaleLowerCase() === normalizedLabel
        )
    })
}

function normalizeSearchBoxData(data: SearchBoxData): SearchBoxData {
    return {
        ...data,
        structuredValue: data.structuredValue.map(item => {
            const keyOption = normalizeSearchBoxKey(item.key)

            if (!keyOption) {
                return item
            }

            const displayName = keyOption.displayName ?? keyOption.key

            return {
                ...item,
                displayName,
                key: keyOption.key,
            }
        }),
    }
}

function parseNormalizedSearchBoxData(text: string): SearchBoxData {
    return normalizeSearchBoxData(parseSearchBoxText(text))
}

function replaceTextRange(
    text: string,
    startIndex: number,
    endIndex: number,
    value: string,
) {
    return `${text.slice(0, startIndex)}${value}${text.slice(endIndex)}`
}

function ensureSearchBoxHasDefaultDelimiter() {
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

function SearchBoxAutocompletePlugin() {
    const [editor] = useLexicalComposerContext()
    const [target, setTarget] = useState<SearchBoxAutocompleteTarget | null>(
        null,
    )
    const [activeIndex, setActiveIndex] = useState(0)

    const match = useMemo<SearchBoxAutocompleteMatch[]>(() => {
        if (!target) {
            return []
        }

        const normalizedQuery = target.query.toLocaleLowerCase()

        if (target.kind === 'key') {
            return SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION.filter(item =>
                (item.displayName ?? item.key)
                    .toLocaleLowerCase()
                    .includes(normalizedQuery),
            ).map(item => ({
                insertText: `${item.displayName ?? item.key}:`,
                kind: 'key',
                label: item.displayName ?? item.key,
            }))
        }

        const normalizedKey = normalizeSearchBoxKey(target.key)?.key

        return SEARCH_BOX_AUTOCOMPLETE_VALUE_OPTION.filter(
            item =>
                item.key === normalizedKey &&
                item.value.toLocaleLowerCase().includes(normalizedQuery),
        ).map(item => ({
            insertText: formatSearchBoxAutocompleteValue(item.value),
            kind: 'value',
            label: item.value,
        }))
    }, [target])

    const closeAutocomplete = useCallback(() => {
        setTarget(null)
        setActiveIndex(0)
    }, [])

    const acceptOption = useCallback(
        (item: SearchBoxAutocompleteMatch) => {
            if (!target) {
                return false
            }

            editor.update(
                () => {
                    const targetNode = $getNodeByKey(target.nodeKey)

                    if (!$isSearchBoxDelimiterNode(targetNode)) {
                        return
                    }

                    const targetText = targetNode.getTextContent()
                    const completedText = replaceTextRange(
                        targetText,
                        target.replaceStartIndex,
                        target.replaceEndIndex,
                        item.insertText,
                    )
                    const selectionIndex =
                        target.replaceStartIndex + item.insertText.length

                    targetNode.setTextContent(completedText)
                    targetNode.select(selectionIndex, selectionIndex)

                    if (item.kind === 'value') {
                        populateSearchBoxRoot(
                            parseNormalizedSearchBoxData(
                                $getRoot().getTextContent(),
                            ),
                        )
                    } else {
                        const parsedData = parseNormalizedSearchBoxData(
                            $getRoot().getTextContent(),
                        )

                        if (
                            parsedData.structuredValue.length > 0 &&
                            !parsedData.unstructuredValue
                        ) {
                            populateSearchBoxRoot(parsedData)
                        }
                    }
                },
                { tag: HISTORY_MERGE_TAG },
            )

            closeAutocomplete()

            return true
        },
        [closeAutocomplete, editor, target],
    )

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const selection = $getSelection()

                if (
                    !$isRangeSelection(selection) ||
                    !selection.isCollapsed() ||
                    selection.anchor.type !== 'text'
                ) {
                    closeAutocomplete()
                    return
                }

                const anchorNode = selection.anchor.getNode()

                if (!$isSearchBoxDelimiterNode(anchorNode)) {
                    closeAutocomplete()
                    return
                }

                const autocompleteText =
                    parseSearchBoxDelimiterAutocompleteText(
                        anchorNode.getTextContent(),
                        selection.anchor.offset,
                    )

                if (!autocompleteText) {
                    closeAutocomplete()
                    return
                }

                const rect = getSelectionRect(editor)

                if (!rect) {
                    closeAutocomplete()
                    return
                }

                setTarget({
                    key: autocompleteText.key,
                    kind: autocompleteText.kind,
                    left: rect.left,
                    nodeKey: anchorNode.getKey(),
                    query: autocompleteText.query,
                    replaceEndIndex: autocompleteText.replaceEndIndex,
                    replaceStartIndex: autocompleteText.replaceStartIndex,
                    top: rect.bottom + 4,
                })
            })
        })
    }, [closeAutocomplete, editor])

    useEffect(() => {
        setActiveIndex(0)
    }, [target?.query])

    useEffect(() => {
        if (match.length === 0) {
            return
        }

        const removeArrowDownCommand = editor.registerCommand(
            KEY_ARROW_DOWN_COMMAND,
            event => {
                event?.preventDefault()
                setActiveIndex(currentIndex =>
                    currentIndex + 1 >= match.length ? 0 : currentIndex + 1,
                )

                return true
            },
            COMMAND_PRIORITY_HIGH,
        )
        const removeArrowUpCommand = editor.registerCommand(
            KEY_ARROW_UP_COMMAND,
            event => {
                event?.preventDefault()
                setActiveIndex(currentIndex =>
                    currentIndex - 1 < 0 ? match.length - 1 : currentIndex - 1,
                )

                return true
            },
            COMMAND_PRIORITY_HIGH,
        )
        const removeTabCommand = editor.registerCommand(
            KEY_TAB_COMMAND,
            event => {
                event?.preventDefault()

                const item = match[activeIndex] ?? match[0]

                if (!item) {
                    return false
                }

                return acceptOption(item)
            },
            COMMAND_PRIORITY_HIGH,
        )

        return () => {
            removeArrowDownCommand()
            removeArrowUpCommand()
            removeTabCommand()
        }
    }, [acceptOption, activeIndex, editor, match])

    if (!target) {
        return null
    }

    return (
        <SearchBoxAutocomplete
            activeIndex={activeIndex}
            left={target.left}
            onSelect={acceptOption}
            option={match}
            top={target.top}
        />
    )
}

function SearchBoxInteractionPlugin({ onSubmit }: SearchBoxSubmitProps) {
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

function SearchBoxSubmitPlugin({ onSubmit }: SearchBoxSubmitProps) {
    const [editor] = useLexicalComposerContext()

    const handleSubmit = useCallback(() => {
        editor.update(() => {
            const parsedData = parseNormalizedSearchBoxData(
                $getRoot().getTextContent(),
            )

            populateSearchBoxRoot(parsedData)
            onSubmit?.(parsedData)
        })
    }, [editor, onSubmit])

    return (
        <button
            aria-label="Search"
            className="search-box-submit"
            onClick={handleSubmit}
            type="button"
        />
    )
}

export function SearchBox({ data, onSubmit }: SearchBoxProps) {
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
                    <SearchBoxInteractionPlugin onSubmit={onSubmit} />
                    <SearchBoxAutocompletePlugin />
                </div>
                <SearchBoxSubmitPlugin onSubmit={onSubmit} />
            </div>
        </LexicalComposer>
    )
}
