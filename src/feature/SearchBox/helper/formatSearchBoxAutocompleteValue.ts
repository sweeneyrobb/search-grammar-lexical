export function formatSearchBoxAutocompleteValue(value: string): string {
    if (!/\s/.test(value)) {
        return value
    }

    if (!value.includes('"')) {
        return `"${value}"`
    }

    return `[${value}]`
}
