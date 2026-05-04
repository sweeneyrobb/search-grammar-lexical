import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'

import {
    SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION,
    SEARCH_BOX_AUTOCOMPLETE_VALUE_OPTION,
} from './constant.js'
import {
    SearchBoxDelimiterNode,
    SearchBoxPairNode,
    SearchBoxUnstructuredTextNode,
} from './node/index.js'
import {
    SearchBoxAutocompletePlugin,
    SearchBoxChangePlugin,
    SearchBoxDataPlugin,
    SearchBoxInteractionPlugin,
    SearchBoxSubmitPlugin,
} from './plugin/index.js'
import type {
    SearchBoxAutocompleteKeyOption,
    SearchBoxAutocompleteValueOption,
    SearchBoxChangeEvent,
    SearchBoxData,
} from './type.js'

import './SearchBox.style.css'

type SearchBoxProps = {
    autocompleteKeyOption?: SearchBoxAutocompleteKeyOption[]
    autocompleteValueOption?: SearchBoxAutocompleteValueOption[]
    data: SearchBoxData
    onChange?: (event: SearchBoxChangeEvent) => void
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

export function SearchBox({
    autocompleteKeyOption = SEARCH_BOX_AUTOCOMPLETE_KEY_OPTION,
    autocompleteValueOption = SEARCH_BOX_AUTOCOMPLETE_VALUE_OPTION,
    data,
    onChange,
    onSubmit,
}: SearchBoxProps) {
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
                    <SearchBoxChangePlugin
                        keyOption={autocompleteKeyOption}
                        onChange={onChange}
                    />
                    <SearchBoxInteractionPlugin
                        keyOption={autocompleteKeyOption}
                        onSubmit={onSubmit}
                    />
                    <SearchBoxAutocompletePlugin
                        keyOption={autocompleteKeyOption}
                        valueOption={autocompleteValueOption}
                    />
                </div>
                <SearchBoxSubmitPlugin
                    keyOption={autocompleteKeyOption}
                    onSubmit={onSubmit}
                />
            </div>
        </LexicalComposer>
    )
}
