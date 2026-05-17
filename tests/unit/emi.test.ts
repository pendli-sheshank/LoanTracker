import { describe, expect, it } from 'vitest';
import { calculateEmi } from '@/domain/loan/emi';
import { rupeesToPaise, paiseToRupees } from '@/lib/money';

describe('calculateEmi', () => {
  it('matches HDFC sample: ₹10L @ 8.5% for 20y ≈ ₹8678/month', () => {
    const emi = calculateEmi(rupeesToPaise(1_000_000), 8.5, 240);
    expect(Math.round(paiseToRupees(emi))).toBe(8678);
  });

  it('zero rate splits principal evenly', () => {
    expect(calculateEmi(120_000, 0, 12)).toBe(10_000);
  });

  it('throws on invalid tenure', () => {
    expect(() => calculateEmi(100, 10, 0)).toThrow();
  });
});
