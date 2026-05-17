import type { MappedRow, ValidationResult } from './types';

const PAISE_TOLERANCE = 200; // ₹2 per row

export function validateRows(rows: MappedRow[]): ValidationResult {
  const result: ValidationResult = { ok: true, issues: [] };

  rows.forEach((r, i) => {
    if (r.openingBalance !== undefined && r.principal !== undefined && r.closingBalance !== undefined) {
      const expected = r.openingBalance - r.principal;
      if (Math.abs(expected - r.closingBalance) > PAISE_TOLERANCE) {
        result.issues.push({
          rowIndex: i,
          field: 'closingBalance',
          severity: 'error',
          message: `Balance mismatch: opening − principal = ${expected} but closing = ${r.closingBalance}`,
        });
      }
    }

    if (r.emi !== undefined && r.principal !== undefined && r.interest !== undefined) {
      const expected = r.principal + r.interest;
      if (Math.abs(expected - r.emi) > PAISE_TOLERANCE) {
        result.issues.push({
          rowIndex: i,
          field: 'emi',
          severity: 'warning',
          message: `EMI mismatch: principal + interest = ${expected} but EMI = ${r.emi}`,
        });
      }
    }
  });

  // Monotonic dates
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1]?.dueDate;
    const curr = rows[i]?.dueDate;
    if (prev && curr && curr < prev) {
      result.issues.push({
        rowIndex: i,
        field: 'dueDate',
        severity: 'warning',
        message: `Date out of order: ${curr} comes before previous ${prev}`,
      });
    }
  }

  result.ok = !result.issues.some((i) => i.severity === 'error');
  return result;
}
