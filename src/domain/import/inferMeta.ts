import type { InferredLoanMeta, MappedRow } from './types';
import { calculateEmi } from '@/domain/loan/emi';

function mode(values: number[]): number | null {
  if (!values.length) return null;
  const counts = new Map<number, number>();
  let best = values[0]!;
  let bestCount = 0;
  for (const v of values) {
    const c = (counts.get(v) ?? 0) + 1;
    counts.set(v, c);
    if (c > bestCount) {
      bestCount = c;
      best = v;
    }
  }
  return best;
}

/** Newton–Raphson solver for the annual rate (percent) that produces the observed EMI. */
function solveRatePct(principalPaise: number, emiPaise: number, tenureMonths: number): number {
  if (principalPaise <= 0 || emiPaise <= 0 || tenureMonths <= 0) return 0;
  // Trivial zero-interest case
  if (Math.abs(emiPaise * tenureMonths - principalPaise) < 100) return 0;

  let r = 0.01; // monthly rate guess (~12% p.a.)
  for (let iter = 0; iter < 80; iter++) {
    const pow = Math.pow(1 + r, tenureMonths);
    const f = (principalPaise * r * pow) / (pow - 1) - emiPaise;
    // derivative wrt r
    const numD = principalPaise * (pow + r * tenureMonths * pow / (1 + r)) * (pow - 1) -
      principalPaise * r * pow * (tenureMonths * pow / (1 + r));
    const denD = (pow - 1) * (pow - 1);
    const fp = numD / denD;
    if (!Number.isFinite(fp) || fp === 0) break;
    const next = r - f / fp;
    if (!Number.isFinite(next) || next <= 0) {
      r = r / 2;
      continue;
    }
    if (Math.abs(next - r) < 1e-10) {
      r = next;
      break;
    }
    r = next;
  }
  return r * 12 * 100;
}

export function inferMeta(rows: MappedRow[]): InferredLoanMeta | null {
  const valid = rows.filter((r) => r.openingBalance !== undefined && r.emi !== undefined);
  if (valid.length === 0) return null;

  const principalPaise = valid[0]!.openingBalance!;
  const tenureMonths = valid.length;
  const emiPaise = mode(valid.map((r) => r.emi!)) ?? valid[0]!.emi!;
  const startDate = valid[0]!.dueDate ?? new Date().toISOString().slice(0, 10);

  let annualRatePct = solveRatePct(principalPaise, emiPaise, tenureMonths);
  // Sanity check: recompute EMI with solved rate; if off > 2% relative, fall back to first-row method.
  const recomputed = calculateEmi(principalPaise, annualRatePct, tenureMonths);
  if (Math.abs(recomputed - emiPaise) / emiPaise > 0.02 && valid[0]?.interest !== undefined) {
    // (interest / opening) * 12 * 100
    annualRatePct = (valid[0].interest! / principalPaise) * 12 * 100;
  }

  return {
    principalPaise,
    tenureMonths,
    emiPaise,
    annualRatePct: Math.round(annualRatePct * 100) / 100,
    startDate,
  };
}
