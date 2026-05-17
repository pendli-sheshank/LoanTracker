import type { AmortizationRow } from '@/domain/loan/types';

export interface PaymentSplit {
  principalPaid: number;
  interestPaid: number;
}

/**
 * Allocate a payment amount across upcoming amortization rows.
 * Greedy: pay interest first for the next unpaid row, then principal,
 * then move to the next row if any amount remains.
 */
export function splitPayment(amountPaise: number, upcomingRows: AmortizationRow[]): PaymentSplit {
  let remaining = amountPaise;
  let principalPaid = 0;
  let interestPaid = 0;

  for (const row of upcomingRows) {
    if (remaining <= 0) break;
    const intPart = Math.min(remaining, row.interest);
    interestPaid += intPart;
    remaining -= intPart;
    if (remaining <= 0) break;
    const prinPart = Math.min(remaining, row.principal);
    principalPaid += prinPart;
    remaining -= prinPart;
  }

  // Any extra (prepayment beyond schedule) counts as principal
  if (remaining > 0) {
    principalPaid += remaining;
  }
  return { principalPaid, interestPaid };
}
