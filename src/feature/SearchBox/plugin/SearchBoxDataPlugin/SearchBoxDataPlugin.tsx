import { useEffect } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { populateSearchBoxRoot } from '../../helper/index.js'
import type { SearchBoxData } from '../../type.js'

type SearchBoxDataPluginProps = {
    data: SearchBoxData
}

export function SearchBoxDataPlugin({ data }: SearchBoxDataPluginProps) {
    const [editor] = useLexicalComposerContext()

    useEffect(() => {
        editor.update(() => {
            populateSearchBoxRoot(data)
        })
    }, [data, editor])

    return null
}
