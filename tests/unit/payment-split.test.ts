import { describe, expect, it } from 'vitest';
import { splitPayment } from '@/domain/payment/split';
import { buildSchedule } from '@/domain/loan/amortization';
import { rupeesToPaise } from '@/lib/money';

describe('splitPayment', () => {
  const schedule = buildSchedule({
    principalPaise: rupeesToPaise(1_000_000),
    annualRatePct: 8.5,
    tenureMonths: 240,
    startDate: '2026-01-01',
  });

  it('exact one EMI splits per the first row', () => {
    const first = schedule[0]!;
    const split = splitPayment(first.interest + first.principal, schedule);
    expect(split.interestPaid).toBe(first.interest);
    expect(split.principalPaid).toBe(first.principal);
  });

  it('split sums to total amount paid (conservation)', () => {
    const first = schedule[0]!;
    const extra = rupeesToPaise(50_000);
    const total = first.interest + first.principal + extra;
    const split = splitPayment(total, schedule);
    expect(split.interestPaid + split.principalPaid).toBe(total);
    // extra applied across multiple rows means principal weighting tilts up vs a single EMI
    expect(split.principalPaid).toBeGreaterThan(first.principal);
  });

  it('payment beyond entire schedule lands entirely on principal', () => {
    const total = schedule.reduce((a, r) => a + r.interest + r.principal, 0);
    const split = splitPayment(total + rupeesToPaise(10_000), schedule);
    expect(split.interestPaid + split.principalPaid).toBe(total + rupeesToPaise(10_000));
  });

  it('partial below interest pays only interest', () => {
    const first = schedule[0]!;
    const split = splitPayment(Math.floor(first.interest / 2), schedule);
    expect(split.principalPaid).toBe(0);
    expect(split.interestPaid).toBe(Math.floor(first.interest / 2));
  });
});
