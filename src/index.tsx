import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'

const onError = (error: Error) => {
    console.error(error)
}

// Sample data structure: array of key-value pairs
const sampleData = [
    { key: 'Name', value: 'John Doe' },
    { key: 'Age', value: '30' },
    { key: 'City', value: 'New York' },
]

// Function to convert data to Lexical editor state JSON
function dataToLexicalState(data: Array<{ key: string; value: string }>) {
    const children = []

    data.forEach(({ key, value }, index) => {
        children.push({
            detail: 0,
            format: 1, // bold
            mode: 'normal',
            style: '',
            text: `${key}: `,
            type: 'text',
            version: 1,
        })
        children.push({
            detail: 0,
            format: 0, // normal
            mode: 'normal',
            style: '',
            text: value,
            type: 'text',
            version: 1,
        })
        // Add separator if not the last item
        if (index < data.length - 1) {
            children.push({
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: ' | ',
                type: 'text',
                version: 1,
            })
        }
    })

    return {
        root: {
            children: [
                {
                    children,
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
        },
    }
}

const initialEditorStateJson = dataToLexicalState(sampleData)

function Editor() {
    return (
        <LexicalComposer
            initialConfig={{
                namespace: 'MyEditor',
                onError,
                editorState: JSON.stringify(initialEditorStateJson),
            }}
        >
            <div
                className="editor-container"
                style={{
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '10px',
                }}
            >
                <div className="editor-inner">
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable
                                className="editor-input"
                                style={{ minHeight: '200px', outline: 'none' }}
                            />
                        }
                        placeholder={
                            <div
                                className="editor-placeholder"
                                style={{
                                    color: '#999',
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    pointerEvents: 'none',
                                }}
                            >
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

const root = document.getElementById('root')

if (!root) {
    throw new Error('Root element not found')
}

createRoot(root).render(
    <StrictMode>
        <Editor />
    </StrictMode>,
)
