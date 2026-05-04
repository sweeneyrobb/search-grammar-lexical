import { useCallback } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'

import { SearchBoxSubmitButton } from '../../component/index.js'
import {
    parseNormalizedSearchBoxData,
    populateSearchBoxRoot,
} from '../../helper/index.js'
import type {
    SearchBoxAutocompleteKeyOption,
    SearchBoxData,
} from '../../type.js'

type SearchBoxSubmitPluginProps = {
    keyOption: SearchBoxAutocompleteKeyOption[]
    onSubmit: ((data: SearchBoxData) => void) | undefined
}

export function SearchBoxSubmitPlugin({
    keyOption,
    onSubmit,
}: SearchBoxSubmitPluginProps) {
    const [editor] = useLexicalComposerContext()

    const handleSubmit = useCallback(() => {
        editor.update(() => {
            const parsedData = parseNormalizedSearchBoxData(
                $getRoot().getTextContent(),
                keyOption,
            )

            populateSearchBoxRoot(parsedData)
            onSubmit?.(parsedData)
        })
    }, [editor, keyOption, onSubmit])

    return <SearchBoxSubmitButton onClick={handleSubmit} />
}
