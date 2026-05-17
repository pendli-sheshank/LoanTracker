import { db, type Payment } from '@/db/schema';
import { newId } from '@/lib/id';
import { splitPayment } from '@/domain/payment/split';
import { buildSchedule } from '@/domain/loan/amortization';
import type { PaymentInput } from '@/domain/payment/schema';

export async function addPayment(loanId: string, input: PaymentInput): Promise<Payment> {
  const loan = await db.loans.get(loanId);
  if (!loan) throw new Error(`Loan ${loanId} not found`);

  let principalPaid = input.amount;
  let interestPaid = 0;

  if (loan.type !== 'credit_card') {
    const existing = await db.payments.where('loanId').equals(loanId).toArray();
    const totalAlreadyPaid = existing.reduce((acc, p) => acc + p.amount, 0);
    const schedule = buildSchedule({
      principalPaise: loan.principal,
      annualRatePct: loan.annualRatePct,
      tenureMonths: loan.tenureMonths,
      startDate: loan.startDate,
      emiOverridePaise: loan.emiAmount,
    });
    // Skip schedule rows already covered by prior payments.
    let skip = totalAlreadyPaid;
    const upcoming = schedule.filter((r) => {
      const rowAmount = r.interest + r.principal;
      if (skip >= rowAmount) {
        skip -= rowAmount;
        return false;
      }
      return true;
    });
    const split = splitPayment(input.amount, upcoming);
    principalPaid = split.principalPaid;
    interestPaid = split.interestPaid;
  }

  const payment: Payment = {
    id: newId(),
    loanId,
    date: input.date,
    amount: input.amount,
    principalPaid,
    interestPaid,
    type: input.type,
    ...(input.source ? { source: input.source } : {}),
  };
  await db.payments.add(payment);
  return payment;
}

export async function deletePayment(id: string): Promise<void> {
  await db.payments.delete(id);
}

export async function listPaymentsForLoan(loanId: string): Promise<Payment[]> {
  return db.payments.where('loanId').equals(loanId).reverse().sortBy('date');
}
