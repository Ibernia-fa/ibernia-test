/**
 * Capitalizes only the first letter of a string, leaving everything else unchanged.
 * Handles leading whitespace, accented characters, empty strings, and non-letter starts.
 *
 * Intended for use on first creation only — not on subsequent edits.
 */
export function capitalizeFirstLetter(value: string | null | undefined): string {
  if (value == null) return value as any;
  if (typeof value !== 'string') return value;
  if (value.length === 0) return value;

  const firstLetterIndex = value.search(/\p{L}/u);
  if (firstLetterIndex === -1) return value;

  return (
    value.slice(0, firstLetterIndex) +
    value.charAt(firstLetterIndex).toLocaleUpperCase() +
    value.slice(firstLetterIndex + 1)
  );
}
