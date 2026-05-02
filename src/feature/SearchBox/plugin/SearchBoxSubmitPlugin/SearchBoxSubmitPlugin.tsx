import { useCallback } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'

import { SearchBoxSubmitButton } from '../../component/index.js'
import {
    parseNormalizedSearchBoxData,
    populateSearchBoxRoot,
} from '../../helper/index.js'
import type { SearchBoxData } from '../../type.js'

type SearchBoxSubmitPluginProps = {
    onSubmit: ((data: SearchBoxData) => void) | undefined
}

export function SearchBoxSubmitPlugin({
    onSubmit,
}: SearchBoxSubmitPluginProps) {
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

    return <SearchBoxSubmitButton onClick={handleSubmit} />
}
