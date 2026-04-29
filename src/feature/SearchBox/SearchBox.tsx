import { useEffect } from 'react'

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'

import { populateSearchBoxRoot } from './helper/index.js'
import type { SearchBoxDataItem } from './type.js'

import './SearchBox.style.css'

type SearchBoxProps = {
    data: SearchBoxDataItem[]
}

const onError = (error: Error) => {
    console.error(error)
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

export function SearchBox({ data }: SearchBoxProps) {
    return (
        <LexicalComposer
            initialConfig={{
                namespace: 'SearchBox',
                onError,
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
                </div>
            </div>
        </LexicalComposer>
    )
}
