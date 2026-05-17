import { db } from '@/db/schema';
import type { Loan } from '@/domain/loan/types';
import type { LoanInput } from '@/domain/loan/schema';
import { newId } from '@/lib/id';
import { calculateEmi } from '@/domain/loan/emi';

function withDerived(input: LoanInput, existing?: Loan): Loan {
  const now = new Date().toISOString();
  const emi =
    input.type === 'credit_card'
      ? undefined
      : calculateEmi(input.principal, input.annualRatePct, input.tenureMonths);
  return {
    ...(existing ?? {}),
    ...input,
    id: existing?.id ?? input.id ?? newId(),
    emiAmount: emi,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  } as Loan;
}

export async function createLoan(input: LoanInput): Promise<Loan> {
  const loan = withDerived(input);
  await db.loans.add(loan);
  return loan;
}

export async function updateLoan(id: string, input: LoanInput): Promise<Loan> {
  const existing = await db.loans.get(id);
  if (!existing) throw new Error(`Loan ${id} not found`);
  const loan = withDerived(input, existing);
  await db.loans.put(loan);
  return loan;
}

export async function deleteLoan(id: string): Promise<void> {
  await db.transaction('rw', [db.loans, db.amortizationRows, db.payments, db.rateChanges, db.importDocs], async () => {
    await db.loans.delete(id);
    await db.amortizationRows.where('loanId').equals(id).delete();
    await db.payments.where('loanId').equals(id).delete();
    await db.rateChanges.where('loanId').equals(id).delete();
    await db.importDocs.where('loanId').equals(id).delete();
  });
}

export async function getLoan(id: string): Promise<Loan | undefined> {
  return db.loans.get(id);
}

export async function listLoans(): Promise<Loan[]> {
  return db.loans.toArray();
}
