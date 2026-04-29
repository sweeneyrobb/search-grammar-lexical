import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'

import { dataToLexicalState } from './helper/index.js'
import type { SearchBoxDataItem } from './type.js'

import './SearchBox.style.css'

type SearchBoxProps = {
    data: SearchBoxDataItem[]
}

const onError = (error: Error) => {
    console.error(error)
}

export function SearchBox({ data }: SearchBoxProps) {
    const editorState = JSON.stringify(dataToLexicalState(data))

    return (
        <LexicalComposer
            initialConfig={{
                namespace: 'SearchBox',
                onError,
                editorState,
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
                </div>
            </div>
        </LexicalComposer>
    )
}
