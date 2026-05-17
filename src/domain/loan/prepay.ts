import { buildSchedule, summarize, type ScheduleSummary } from './amortization';
import type { AmortizationRow } from './types';

export type PrepayMode = 'reduce_tenure' | 'reduce_emi';

export interface PrepayScenario {
  prepayAmountPaise: number;
  afterInstallment: number; // apply prepay AFTER this installment number
  mode: PrepayMode;
}

export interface PrepayResult {
  baseline: ScheduleSummary;
  scenario: ScheduleSummary;
  interestSavedPaise: number;
  monthsSaved: number;
  rows: AmortizationRow[];
}

export interface SimulateInput {
  principalPaise: number;
  annualRatePct: number;
  tenureMonths: number;
  startDate: string;
  prepay: PrepayScenario;
}

/**
 * Simulate a one-time prepayment after a given installment.
 * - reduce_tenure: keep EMI same, recompute remaining tenure.
 * - reduce_emi: keep remaining tenure same, recompute EMI on lower balance.
 */
export function simulatePrepay({
  principalPaise,
  annualRatePct,
  tenureMonths,
  startDate,
  prepay,
}: SimulateInput): PrepayResult {
  const baselineRows = buildSchedule({ principalPaise, annualRatePct, tenureMonths, startDate });
  const baseline = summarize(baselineRows);

  const cutoff = Math.min(Math.max(1, prepay.afterInstallment), baselineRows.length);
  const head = baselineRows.slice(0, cutoff);
  const lastHead = head[head.length - 1];
  if (!lastHead) {
    return { baseline, scenario: baseline, interestSavedPaise: 0, monthsSaved: 0, rows: baselineRows };
  }

  const balanceAfter = Math.max(0, lastHead.closingBalance - prepay.prepayAmountPaise);
  const remainingMonths = tenureMonths - cutoff;
  const startNext = lastHead.dueDate;

  let tail: AmortizationRow[] = [];
  if (balanceAfter > 0 && remainingMonths > 0) {
    const baseEmi = baseline.totalPaid / baseline.months;
    if (prepay.mode === 'reduce_tenure') {
      tail = buildScheduleAtBalance(balanceAfter, annualRatePct, startNext, Math.round(baseEmi));
    } else {
      tail = buildSchedule({
        principalPaise: balanceAfter,
        annualRatePct,
        tenureMonths: remainingMonths,
        startDate: startNext,
      });
    }
    tail = tail.map((r) => ({ ...r, installmentNo: r.installmentNo + cutoff }));
  }

  const rows = [...head, ...tail];
  const scenario = summarize(rows);

  return {
    baseline,
    scenario,
    interestSavedPaise: baseline.totalInterest - scenario.totalInterest,
    monthsSaved: baseline.months - scenario.months,
    rows,
  };
}

function buildScheduleAtBalance(balance: number, annualRatePct: number, startDate: string, emi: number) {
  const r = annualRatePct / 12 / 100;
  const rows: AmortizationRow[] = [];
  let bal = balance;
  let i = 0;
  const start = new Date(startDate);
  while (bal > 0 && i < 1200) {
    i++;
    const interest = Math.round(bal * r);
    let principal = Math.min(bal, emi - interest);
    if (principal <= 0) {
      // EMI lower than interest — degenerate; bail to avoid infinite loop
      break;
    }
    const closing = Math.max(0, bal - principal);
    const due = new Date(start);
    due.setMonth(due.getMonth() + i);
    rows.push({
      installmentNo: i,
      dueDate: due.toISOString().slice(0, 10),
      openingBalance: bal,
      emi: principal + interest,
      interest,
      principal,
      closingBalance: closing,
    });
    bal = closing;
  }
  return rows;
}
