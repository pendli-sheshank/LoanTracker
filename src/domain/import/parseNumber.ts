/**
 * Parse a money/number cell. Handles:
 *  - Indian grouping "1,23,456.78"
 *  - Western grouping "123,456.78"
 *  - Currency prefixes "₹ 1,234" / "Rs. 1,234"
 *  - Parentheses for negatives "(1,234)"
 *  - Trailing CR/DR markers
 *  - Returns paise (integer) when isMoney; otherwise raw number.
 */
export function parseNumberCell(input: string | number | null | undefined, isMoney: boolean): number | null {
  if (input === null || input === undefined || input === '') return null;
  if (typeof input === 'number') return isMoney ? Math.round(input * 100) : input;

  let s = String(input).trim();
  if (!s) return null;

  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  // strip ₹, Rs, INR, CR/DR
  s = s.replace(/^(?:₹|Rs\.?|INR)\s*/i, '').replace(/\s*(CR|DR)\s*$/i, (_, m) => {
    if (/dr/i.test(m)) negative = true;
    return '';
  });
  s = s.replace(/[, ]/g, '');
  if (s === '-' || s === '') return null;

  const value = Number(s);
  if (!Number.isFinite(value)) return null;
  const signed = negative ? -value : value;
  return isMoney ? Math.round(signed * 100) : signed;
}

/** Try to parse a variety of date strings into ISO YYYY-MM-DD. */
export function parseDateCell(input: string | number | null | undefined): string | null {
  if (input === null || input === undefined || input === '') return null;
  if (typeof input === 'number') {
    // Excel serial date (days since 1899-12-30)
    const epoch = Date.UTC(1899, 11, 30);
    const ms = epoch + input * 86400000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  const s = String(input).trim();
  // Try ISO first
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // dd/MM/yyyy or dd-MM-yyyy or dd.MM.yyyy
  const dmy = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/.exec(s);
  if (dmy) {
    const dd = dmy[1]!.padStart(2, '0');
    const mm = dmy[2]!.padStart(2, '0');
    let yyyy = dmy[3]!;
    if (yyyy.length === 2) yyyy = (Number(yyyy) > 70 ? '19' : '20') + yyyy;
    return `${yyyy}-${mm}-${dd}`;
  }
  // Month-name formats: 01 Jan 2026 / Jan 01 2026
  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  return null;
}
