/**
 * Turns free text into a safe FTS5 query: every word becomes a quoted prefix
 * term and all words must match. Quoting means user input can never inject
 * FTS operators (AND, OR, NEAR, column filters, parentheses).
 */
export function buildFtsQuery(input: string): string | null {
  const tokens = input.toLowerCase().match(/[\p{L}\p{N}]+/gu);
  if (!tokens || tokens.length === 0) return null;
  return tokens
    .slice(0, 8)
    .map((t) => `"${t}"*`)
    .join(" ");
}
