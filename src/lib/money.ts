const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100);

export const paiseToRupees = (paise: number): number => paise / 100;

export const formatINR = (paise: number): string => inrFormatter.format(paiseToRupees(paise));

export function parseINRString(input: string): number {
  const cleaned = input.replace(/[₹\s,]/g, '').replace(/^Rs\.?/i, '');
  const value = Number(cleaned);
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot parse INR string: "${input}"`);
  }
  return rupeesToPaise(value);
}
