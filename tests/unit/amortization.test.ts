import { describe, expect, it } from 'vitest';
import { buildSchedule, summarize } from '@/domain/loan/amortization';
import { simulatePrepay } from '@/domain/loan/prepay';
import { rupeesToPaise } from '@/lib/money';

describe('buildSchedule', () => {
  it('produces exactly tenureMonths rows', () => {
    const rows = buildSchedule({
      principalPaise: rupeesToPaise(1_000_000),
      annualRatePct: 8.5,
      tenureMonths: 240,
      startDate: '2026-01-01',
    });
    expect(rows.length).toBe(240);
  });

  it('reconciles balance: opening - principal = closing on every row', () => {
    const rows = buildSchedule({
      principalPaise: rupeesToPaise(500_000),
      annualRatePct: 10,
      tenureMonths: 60,
      startDate: '2026-01-01',
    });
    for (const r of rows) {
      expect(r.openingBalance - r.principal).toBe(r.closingBalance);
    }
  });

  it('ends with closingBalance = 0', () => {
    const rows = buildSchedule({
      principalPaise: rupeesToPaise(750_000),
      annualRatePct: 9.25,
      tenureMonths: 84,
      startDate: '2026-01-01',
    });
    expect(rows[rows.length - 1]?.closingBalance).toBe(0);
  });

  it('total principal equals starting principal', () => {
    const principal = rupeesToPaise(1_200_000);
    const rows = buildSchedule({
      principalPaise: principal,
      annualRatePct: 7.5,
      tenureMonths: 120,
      startDate: '2026-01-01',
    });
    const totalPrincipal = rows.reduce((acc, r) => acc + r.principal, 0);
    expect(totalPrincipal).toBe(principal);
  });
});

describe('simulatePrepay', () => {
  it('reduce_tenure prepayment saves interest and months vs baseline', () => {
    const result = simulatePrepay({
      principalPaise: rupeesToPaise(1_000_000),
      annualRatePct: 8.5,
      tenureMonths: 240,
      startDate: '2026-01-01',
      prepay: { prepayAmountPaise: rupeesToPaise(200_000), afterInstallment: 12, mode: 'reduce_tenure' },
    });
    expect(result.interestSavedPaise).toBeGreaterThan(0);
    expect(result.monthsSaved).toBeGreaterThan(0);
    expect(result.scenario.totalInterest).toBeLessThan(result.baseline.totalInterest);
  });

  it('zero prepay produces zero savings', () => {
    const result = simulatePrepay({
      principalPaise: rupeesToPaise(500_000),
      annualRatePct: 10,
      tenureMonths: 60,
      startDate: '2026-01-01',
      prepay: { prepayAmountPaise: 0, afterInstallment: 12, mode: 'reduce_tenure' },
    });
    expect(result.interestSavedPaise).toBeLessThanOrEqual(2); // ≤ rounding
  });
});

describe('summarize', () => {
  it('sums interest, principal, and totalPaid correctly', () => {
    const rows = buildSchedule({
      principalPaise: rupeesToPaise(300_000),
      annualRatePct: 12,
      tenureMonths: 36,
      startDate: '2026-01-01',
    });
    const s = summarize(rows);
    expect(s.totalPaid).toBe(s.totalInterest + s.totalPrincipal);
    expect(s.months).toBe(36);
  });
});
