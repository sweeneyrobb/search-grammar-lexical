import type { CSSProperties } from 'react'

import './SearchBoxAutocomplete.style.css'

type SearchBoxAutocompleteOption = {
    label: string
}

type SearchBoxAutocompleteProps<TOption extends SearchBoxAutocompleteOption> = {
    activeIndex: number
    left: number
    onSelect: (option: TOption) => void
    option: TOption[]
    top: number
}

export function SearchBoxAutocomplete<TOption extends SearchBoxAutocompleteOption>({
    activeIndex,
    left,
    onSelect,
    option,
    top,
}: SearchBoxAutocompleteProps<TOption>) {
    if (option.length === 0) {
        return null
    }

    return (
        <ul
            aria-label="Search suggestions"
            className="search-box-autocomplete"
            role="listbox"
            style={
                {
                    '--search-box-autocomplete-left': `${left}px`,
                    '--search-box-autocomplete-top': `${top}px`,
                } as CSSProperties
            }
        >
            {option.map((item, index) => (
                <li key={item.label} role="presentation">
                    <button
                        aria-selected={index === activeIndex}
                        className={[
                            'search-box-autocomplete-option',
                            index === activeIndex
                                ? 'search-box-autocomplete-option-active'
                                : '',
                        ].join(' ')}
                        onMouseDown={event => {
                            event.preventDefault()
                            onSelect(item)
                        }}
                        role="option"
                        type="button"
                    >
                        {item.label}
                    </button>
                </li>
            ))}
        </ul>
    )
}
