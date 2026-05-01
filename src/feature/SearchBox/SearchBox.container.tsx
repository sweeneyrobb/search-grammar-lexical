import { SearchBox } from './SearchBox.js'
import { SEARCH_BOX_SAMPLE_DATA } from './constant.js'
import type { SearchBoxData } from './type.js'

type SearchBoxContainerProps = {
    onSubmit?: (data: SearchBoxData) => void
}

export function SearchBoxContainer({ onSubmit }: SearchBoxContainerProps) {
    return (
        <SearchBox
            data={SEARCH_BOX_SAMPLE_DATA}
            {...(onSubmit ? { onSubmit } : {})}
        />
    )
}
