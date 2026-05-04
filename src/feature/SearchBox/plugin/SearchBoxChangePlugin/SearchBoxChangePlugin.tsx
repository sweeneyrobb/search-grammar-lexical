import { useEffect } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical'

import {
    parseNormalizedSearchBoxData,
    parseSearchBoxDelimiterAutocompleteText,
} from '../../helper/index.js'
import { $isSearchBoxDelimiterNode } from '../../node/index.js'
import type {
    SearchBoxAutocompleteKeyOption,
    SearchBoxChangeEvent,
} from '../../type.js'

type SearchBoxChangePluginProps = {
    keyOption: SearchBoxAutocompleteKeyOption[]
    onChange: ((event: SearchBoxChangeEvent) => void) | undefined
}

export function SearchBoxChangePlugin({
    keyOption,
    onChange,
}: SearchBoxChangePluginProps) {
    const [editor] = useLexicalComposerContext()

    useEffect(() => {
        if (!onChange) {
            return
        }

        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const text = $getRoot().getTextContent()
                const selection = $getSelection()
                let autocomplete: SearchBoxChangeEvent['autocomplete'] = null

                if (
                    $isRangeSelection(selection) &&
                    selection.isCollapsed() &&
                    selection.anchor.type === 'text'
                ) {
                    const anchorNode = selection.anchor.getNode()

                    if ($isSearchBoxDelimiterNode(anchorNode)) {
                        autocomplete = parseSearchBoxDelimiterAutocompleteText(
                            anchorNode.getTextContent(),
                            selection.anchor.offset,
                        )
                    }
                }

                onChange({
                    autocomplete,
                    data: parseNormalizedSearchBoxData(text, keyOption),
                    text,
                })
            })
        })
    }, [editor, keyOption, onChange])

    return null
}
