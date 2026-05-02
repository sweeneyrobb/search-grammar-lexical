import { useCallback, useEffect, useMemo, useState } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
    $getNodeByKey,
    $getRoot,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_HIGH,
    HISTORY_MERGE_TAG,
    KEY_ARROW_DOWN_COMMAND,
    KEY_ARROW_UP_COMMAND,
    KEY_TAB_COMMAND,
    type NodeKey,
} from 'lexical'

import { SearchBoxAutocomplete } from '../../component/index.js'
import {
    SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION,
    SEARCH_BOX_AUTOCOMPLETE_VALUE_OPTION,
} from '../../constant.js'
import {
    formatSearchBoxAutocompleteValue,
    getSelectionRect,
    normalizeSearchBoxKey,
    parseNormalizedSearchBoxData,
    parseSearchBoxDelimiterAutocompleteText,
    populateSearchBoxRoot,
    replaceTextRange,
} from '../../helper/index.js'
import { $isSearchBoxDelimiterNode } from '../../node/index.js'

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

export function SearchBoxAutocompletePlugin() {
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
