/**
 * Avance helpers — preserve the exact amount the user entered.
 * No step rounding, no scroll-step mutation, no lossy reformatting.
 */

/** Normalize typed input: trim, remove spaces, accept comma decimal (150,5 → 150.5). */
function normalizeAvanceText(raw: string): string {
  let s = raw.trim().replace(/\s/g, '')
  if (!s) return ''
  // European decimal comma when there is no dot
  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.')
  }
  return s
}

/**
 * Parse avance for DB storage. Returns null if empty or invalid.
 * Does not round to step 10 or alter magnitude.
 */
export function parseAvanceInput(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === '') return null
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null
  }

  const s = normalizeAvanceText(String(raw))
  if (!s) return null
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null

  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/**
 * Display avance exactly as a clean number string (no step rounding).
 * Whole numbers stay without trailing decimals; fractional values keep their value.
 */
export function formatAvanceDisplay(value: string | number | null | undefined): string {
  if (value == null || value === '') return ''

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''
    const parsed = parseAvanceInput(trimmed)
    if (parsed == null) return trimmed
    return formatAvanceNumber(parsed)
  }

  if (!Number.isFinite(value)) return ''
  return formatAvanceNumber(value)
}

function formatAvanceNumber(n: number): string {
  // Avoid float noise like 100.1000000001 while keeping real decimals
  if (Number.isInteger(n)) return String(n)
  const fixed = n.toFixed(10).replace(/\.?0+$/, '')
  return fixed
}

/** True when a row already has a stored avance value. */
export function hasAvanceValue(value: string | number | null | undefined): boolean {
  if (value == null || value === '') return false
  if (typeof value === 'number') return Number.isFinite(value)
  return value.trim() !== ''
}

/**
 * Pick the order avance from sibling rows (first non-null).
 * Used on grouped Correction cards / receipts — still one amount for the order.
 */
export function pickAvanceFromRows(
  rows: Array<{ avance?: string | number | null }>
): string | number | null {
  for (const row of rows) {
    if (hasAvanceValue(row.avance)) return row.avance as string | number
  }
  return null
}
