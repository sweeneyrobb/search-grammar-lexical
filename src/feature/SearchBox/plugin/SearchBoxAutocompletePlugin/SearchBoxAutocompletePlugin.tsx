import { useCallback, useEffect, useMemo, useState } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
    $getNodeByKey,
    $getRoot,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    COMMAND_PRIORITY_HIGH,
    HISTORY_MERGE_TAG,
    KEY_ARROW_DOWN_COMMAND,
    KEY_ARROW_UP_COMMAND,
    KEY_DOWN_COMMAND,
    KEY_ENTER_COMMAND,
    KEY_ESCAPE_COMMAND,
    KEY_TAB_COMMAND,
    type NodeKey,
} from 'lexical'

import { SearchBoxAutocomplete } from '../../component/index.js'
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
import type {
    SearchBoxAutocompleteContext,
    SearchBoxAutocompleteKeyOption,
    SearchBoxAutocompleteValueOption,
} from '../../type.js'

type SearchBoxAutocompleteTarget = SearchBoxAutocompleteContext & {
    left: number
    nodeKey: NodeKey
    top: number
}

type SearchBoxAutocompleteMatch = {
    insertText: string
    kind: 'key' | 'value'
    label: string
}

type SearchBoxAutocompletePluginProps = {
    keyOption: SearchBoxAutocompleteKeyOption[]
    valueOption: SearchBoxAutocompleteValueOption[]
}

export function SearchBoxAutocompletePlugin({
    keyOption,
    valueOption,
}: SearchBoxAutocompletePluginProps) {
    const [editor] = useLexicalComposerContext()
    const [target, setTarget] = useState<SearchBoxAutocompleteTarget | null>(
        null,
    )
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    const match = useMemo<SearchBoxAutocompleteMatch[]>(() => {
        if (!target) {
            return []
        }

        const normalizedQuery = target.query.toLocaleLowerCase()

        if (target.kind === 'key') {
            return keyOption
                .filter(item =>
                    (item.displayName ?? item.key)
                        .toLocaleLowerCase()
                        .includes(normalizedQuery),
                )
                .map(item => ({
                    insertText: `${item.displayName ?? item.key}:`,
                    kind: 'key',
                    label: item.displayName ?? item.key,
                }))
        }

        const normalizedKey = normalizeSearchBoxKey(target.key, keyOption)?.key

        return valueOption
            .filter(
                item =>
                    item.key === normalizedKey &&
                    item.value.toLocaleLowerCase().includes(normalizedQuery),
            )
            .map(item => ({
                insertText: formatSearchBoxAutocompleteValue(item.value),
                kind: 'value',
                label: item.value,
            }))
    }, [keyOption, target, valueOption])

    const closeAutocomplete = useCallback(() => {
        setTarget(null)
        setActiveIndex(null)
    }, [])

    const acceptOption = useCallback(
        (
            item: SearchBoxAutocompleteMatch,
            insertText = item.insertText,
            shouldPopulateRoot = true,
        ) => {
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
                        insertText,
                    )
                    const selectionIndex =
                        target.replaceStartIndex + insertText.length

                    targetNode.setTextContent(completedText)
                    targetNode.select(selectionIndex, selectionIndex)

                    if (!shouldPopulateRoot) {
                        return
                    }

                    if (item.kind === 'value') {
                        populateSearchBoxRoot(
                            parseNormalizedSearchBoxData(
                                $getRoot().getTextContent(),
                                keyOption,
                            ),
                        )
                    } else {
                        const parsedData = parseNormalizedSearchBoxData(
                            $getRoot().getTextContent(),
                            keyOption,
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
        [closeAutocomplete, editor, keyOption, target],
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
                    isBracketValue: autocompleteText.isBracketValue,
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
        setActiveIndex(null)
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
                    currentIndex === null || currentIndex + 1 >= match.length
                        ? 0
                        : currentIndex + 1,
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
                    currentIndex === null || currentIndex - 1 < 0
                        ? match.length - 1
                        : currentIndex - 1,
                )

                return true
            },
            COMMAND_PRIORITY_HIGH,
        )
        const removeTabCommand = editor.registerCommand(
            KEY_TAB_COMMAND,
            event => {
                const item =
                    activeIndex === null ? undefined : match[activeIndex]

                if (!item) {
                    return false
                }

                event?.preventDefault()

                return acceptOption(item)
            },
            COMMAND_PRIORITY_HIGH,
        )
        const removeCommaCommand = editor.registerCommand(
            KEY_DOWN_COMMAND,
            event => {
                if (target?.kind !== 'value' || !target.isBracketValue) {
                    return false
                }

                const item =
                    activeIndex === null ? undefined : match[activeIndex]

                if (!item) {
                    return false
                }

                if (event.key === ',') {
                    event.preventDefault()

                    return acceptOption(item, `${item.insertText}, `, false)
                }

                if (event.key === '-') {
                    event.preventDefault()

                    return acceptOption(item, `${item.insertText} - `, false)
                }

                if (event.key === ']') {
                    event.preventDefault()

                    return acceptOption(item, `${item.insertText}]`)
                }

                return false
            },
            COMMAND_PRIORITY_CRITICAL,
        )
        const removeEnterCommand = editor.registerCommand(
            KEY_ENTER_COMMAND,
            event => {
                const item =
                    activeIndex === null ? undefined : match[activeIndex]

                if (!item) {
                    return false
                }

                event?.preventDefault()

                return acceptOption(item)
            },
            COMMAND_PRIORITY_CRITICAL,
        )
        const removeEscapeCommand = editor.registerCommand(
            KEY_ESCAPE_COMMAND,
            event => {
                event.preventDefault()
                closeAutocomplete()

                return true
            },
            COMMAND_PRIORITY_HIGH,
        )

        return () => {
            removeArrowDownCommand()
            removeArrowUpCommand()
            removeTabCommand()
            removeCommaCommand()
            removeEnterCommand()
            removeEscapeCommand()
        }
    }, [acceptOption, activeIndex, closeAutocomplete, editor, match, target])

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
