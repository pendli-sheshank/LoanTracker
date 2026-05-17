import { describe, expect, it } from 'vitest';
import { parseNumberCell, parseDateCell } from '@/domain/import/parseNumber';
import { autoMapColumns } from '@/domain/import/columnMapper';
import { mapRows } from '@/domain/import/mapRows';
import { validateRows } from '@/domain/import/validator';
import { inferMeta } from '@/domain/import/inferMeta';
import { buildSchedule } from '@/domain/loan/amortization';
import { rupeesToPaise } from '@/lib/money';
import type { ParsedTable } from '@/domain/import/types';

describe('parseNumberCell', () => {
  it('parses Indian grouping into paise', () => {
    expect(parseNumberCell('1,23,456.78', true)).toBe(12345678);
    expect(parseNumberCell('₹ 5,000', true)).toBe(500000);
    expect(parseNumberCell('Rs. 1,234', true)).toBe(123400);
  });
  it('parses parens as negative', () => {
    expect(parseNumberCell('(1,234)', true)).toBe(-123400);
  });
  it('returns null for blanks and dashes', () => {
    expect(parseNumberCell('', true)).toBeNull();
    expect(parseNumberCell('-', true)).toBeNull();
  });
  it('passes numbers through', () => {
    expect(parseNumberCell(1234.5, true)).toBe(123450);
    expect(parseNumberCell(5, false)).toBe(5);
  });
});

describe('parseDateCell', () => {
  it('parses dd/MM/yyyy', () => {
    expect(parseDateCell('01/02/2026')).toBe('2026-02-01');
  });
  it('parses dd-MM-yyyy', () => {
    expect(parseDateCell('15-08-2026')).toBe('2026-08-15');
  });
  it('parses ISO directly', () => {
    expect(parseDateCell('2026-05-17')).toBe('2026-05-17');
  });
  it('parses Excel serial dates round-trip', () => {
    // Confirm produces a valid ISO date in expected range
    const d = parseDateCell(46169);
    expect(d).toMatch(/^2026-05-\d{2}$/);
  });
});

describe('autoMapColumns', () => {
  it('maps common HDFC-style headers', () => {
    const mapping = autoMapColumns([
      'EMI No', 'Due Date', 'EMI', 'Principal', 'Interest', 'Opening Balance', 'Closing Balance',
    ]);
    expect(mapping.installmentNo).toBe('EMI No');
    expect(mapping.dueDate).toBe('Due Date');
    expect(mapping.emi).toBe('EMI');
    expect(mapping.principal).toBe('Principal');
    expect(mapping.interest).toBe('Interest');
    expect(mapping.openingBalance).toBe('Opening Balance');
    expect(mapping.closingBalance).toBe('Closing Balance');
  });

  it('maps SBI-style header variants', () => {
    const mapping = autoMapColumns([
      'Installment No', 'Payment Date', 'Monthly Payment', 'Principal Component', 'Interest Component', 'Beginning Balance', 'Ending Balance',
    ]);
    expect(mapping.installmentNo).toBe('Installment No');
    expect(mapping.dueDate).toBe('Payment Date');
    expect(mapping.principal).toBe('Principal Component');
    expect(mapping.interest).toBe('Interest Component');
  });
});

describe('end-to-end inference from synthesized HDFC-style table', () => {
  it('infers principal, tenure, EMI, and rate from a clean schedule', () => {
    // Use the engine to produce a known schedule, then round-trip through mapRows + inferMeta.
    const principal = rupeesToPaise(1_000_000);
    const rate = 8.5;
    const tenure = 240;
    const schedule = buildSchedule({
      principalPaise: principal,
      annualRatePct: rate,
      tenureMonths: tenure,
      startDate: '2026-01-01',
    });

    const table: ParsedTable = {
      headers: ['EMI No', 'Due Date', 'EMI', 'Principal', 'Interest', 'Opening Balance', 'Closing Balance'],
      rows: schedule.map((r) => ({
        'EMI No': r.installmentNo,
        'Due Date': r.dueDate,
        EMI: r.emi / 100,
        Principal: r.principal / 100,
        Interest: r.interest / 100,
        'Opening Balance': r.openingBalance / 100,
        'Closing Balance': r.closingBalance / 100,
      })),
    };

    const mapping = autoMapColumns(table.headers);
    const mapped = mapRows(table, mapping);
    const validation = validateRows(mapped);
    expect(validation.ok).toBe(true);

    const meta = inferMeta(mapped);
    expect(meta).not.toBeNull();
    expect(meta!.principalPaise).toBe(principal);
    expect(meta!.tenureMonths).toBe(tenure);
    expect(Math.abs(meta!.annualRatePct - rate)).toBeLessThan(0.05);
  });

  it('validator flags an explicit balance mismatch', () => {
    const mapped = [
      // opening - principal = 999,900 but closing claims 950,000 → 49,900 paise mismatch (>> 200 tolerance)
      { installmentNo: 1, dueDate: '2026-02-01', openingBalance: 1_000_000, principal: 100, interest: 50, emi: 150, closingBalance: 950_000 },
    ];
    const result = validateRows(mapped);
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.field).toBe('closingBalance');
  });
});
