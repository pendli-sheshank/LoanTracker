/**
 * Reducing-balance EMI. All amounts in integer paise.
 * P = principal (paise), annualRatePct e.g. 8.65, n = tenure in months.
 */
export function calculateEmi(principalPaise: number, annualRatePct: number, tenureMonths: number): number {
  if (tenureMonths <= 0) throw new Error('tenureMonths must be > 0');
  if (annualRatePct < 0) throw new Error('annualRatePct must be >= 0');

  if (annualRatePct === 0) {
    return Math.round(principalPaise / tenureMonths);
  }

  const r = annualRatePct / 12 / 100;
  const pow = Math.pow(1 + r, tenureMonths);
  const emi = (principalPaise * r * pow) / (pow - 1);
  return Math.round(emi);
}
