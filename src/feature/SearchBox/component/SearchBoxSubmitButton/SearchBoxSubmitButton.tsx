import './SearchBoxSubmitButton.style.css'

type SearchBoxSubmitButtonProps = {
    onClick: () => void
}

export function SearchBoxSubmitButton({ onClick }: SearchBoxSubmitButtonProps) {
    return (
        <button
            aria-label="Search"
            className="search-box-submit"
            onClick={onClick}
            type="button"
        />
    )
}
