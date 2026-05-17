import { describe, expect, it } from 'vitest';
import { formatINR, parseINRString, rupeesToPaise } from '@/lib/money';

describe('money', () => {
  it('formats paise as ₹ with Indian grouping', () => {
    expect(formatINR(rupeesToPaise(1234567.89))).toBe('₹12,34,567.89');
  });

  it('parses Indian number format strings', () => {
    expect(parseINRString('₹1,23,456.78')).toBe(12345678);
    expect(parseINRString('Rs. 5,000')).toBe(500000);
    expect(parseINRString('1000')).toBe(100000);
  });

  it('throws on invalid input', () => {
    expect(() => parseINRString('abc')).toThrow();
  });
});
