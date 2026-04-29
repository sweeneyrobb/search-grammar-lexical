import type { SearchBoxDataItem, TextNodeState } from '../type.js'

export function dataToLexicalState(data: SearchBoxDataItem[]) {
    const children: TextNodeState[] = []

    data.forEach(({ key, value }, index) => {
        children.push({
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: `${key}: `,
            type: 'text',
            version: 1,
        })
        children.push({
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: value,
            type: 'text',
            version: 1,
        })

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
