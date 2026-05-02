import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'

import {
    SearchBoxDelimiterNode,
    SearchBoxPairNode,
    SearchBoxUnstructuredTextNode,
} from './node/index.js'
import {
    SearchBoxAutocompletePlugin,
    SearchBoxDataPlugin,
    SearchBoxInteractionPlugin,
    SearchBoxSubmitPlugin,
} from './plugin/index.js'
import type { SearchBoxData } from './type.js'

import './SearchBox.style.css'

type SearchBoxProps = {
    data: SearchBoxData
    onSubmit?: (data: SearchBoxData) => void
}

const onError = (error: Error) => {
    console.error(error)
}

const theme = {
    text: {
        bold: 'search-box-key',
    },
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
