import { addMonths, formatISO } from 'date-fns';
import type { AmortizationRow } from './types';
import { calculateEmi } from './emi';

export interface BuildScheduleInput {
  principalPaise: number;
  annualRatePct: number;
  tenureMonths: number;
  startDate: string; // YYYY-MM-DD
  emiOverridePaise?: number;
}

/**
 * Build a reducing-balance amortization schedule.
 * All money in integer paise. Last row is corrected so closingBalance = 0.
 */
export function buildSchedule({
  principalPaise,
  annualRatePct,
  tenureMonths,
  startDate,
  emiOverridePaise,
}: BuildScheduleInput): AmortizationRow[] {
  const rate = annualRatePct / 12 / 100;
  const emi = emiOverridePaise ?? calculateEmi(principalPaise, annualRatePct, tenureMonths);
  const start = new Date(startDate);

  const rows: AmortizationRow[] = [];
  let balance = principalPaise;

  for (let i = 1; i <= tenureMonths; i++) {
    const interest = Math.round(balance * rate);
    let principal = emi - interest;
    if (i === tenureMonths) {
      principal = balance;
    }
    const closing = Math.max(0, balance - principal);
    rows.push({
      installmentNo: i,
      dueDate: formatISO(addMonths(start, i), { representation: 'date' }),
      openingBalance: balance,
      emi: i === tenureMonths ? principal + interest : emi,
      interest,
      principal,
      closingBalance: closing,
    });
    balance = closing;
    if (balance === 0) break;
  }
  return rows;
}

export interface ScheduleSummary {
  totalInterest: number;
  totalPrincipal: number;
  totalPaid: number;
  payoffDate: string;
  months: number;
}

export function summarize(rows: AmortizationRow[]): ScheduleSummary {
  let totalInterest = 0;
  let totalPrincipal = 0;
  for (const r of rows) {
    totalInterest += r.interest;
    totalPrincipal += r.principal;
  }
  const last = rows[rows.length - 1];
  return {
    totalInterest,
    totalPrincipal,
    totalPaid: totalInterest + totalPrincipal,
    payoffDate: last?.dueDate ?? '',
    months: rows.length,
  };
}
