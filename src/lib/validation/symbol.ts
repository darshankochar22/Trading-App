/** NSE-style equity symbols (uppercase alphanumerics, &, hyphen, dot). */
export const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9&.-]{0,48}$/;

export function normalizeSymbol(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidSymbol(raw: string): boolean {
  return SYMBOL_PATTERN.test(normalizeSymbol(raw));
}
