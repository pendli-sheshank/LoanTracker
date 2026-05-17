import { db } from '@/db/schema';
import { newId } from '@/lib/id';
import { calculateEmi } from '@/domain/loan/emi';
import type { Loan, LoanType, AmortizationRow } from '@/domain/loan/types';
import type { InferredLoanMeta, MappedRow } from './types';

export interface CommitInput {
  meta: InferredLoanMeta;
  rows: MappedRow[];
  loanName: string;
  lender: string;
  loanType: LoanType;
  originalFile?: { name: string; mimeType: string; blob: Blob };
  seedPastAsPaid: boolean;
  isSelfOccupied?: boolean;
}

export async function commitImport(input: CommitInput): Promise<Loan> {
  const now = new Date().toISOString();
  const today = new Date();
  const id = newId();

  const emi = input.meta.emiPaise || calculateEmi(input.meta.principalPaise, input.meta.annualRatePct, input.meta.tenureMonths);

  const loan: Loan = {
    id,
    type: input.loanType,
    name: input.loanName,
    lender: input.lender,
    principal: input.meta.principalPaise,
    annualRatePct: input.meta.annualRatePct,
    interestType: 'reducing_balance',
    tenureMonths: input.meta.tenureMonths,
    startDate: input.meta.startDate,
    emiAmount: emi,
    createdAt: now,
    updatedAt: now,
    ...(input.loanType === 'housing' ? { isSelfOccupied: input.isSelfOccupied ?? true } : {}),
  };

  const amortizationRows = input.rows
    .filter((r) => r.installmentNo !== undefined && r.openingBalance !== undefined)
    .map<AmortizationRow & { loanId: string }>((r, i) => ({
      loanId: id,
      installmentNo: r.installmentNo ?? i + 1,
      dueDate: r.dueDate ?? '',
      openingBalance: r.openingBalance ?? 0,
      emi: r.emi ?? emi,
      interest: r.interest ?? 0,
      principal: r.principal ?? 0,
      closingBalance: r.closingBalance ?? Math.max(0, (r.openingBalance ?? 0) - (r.principal ?? 0)),
    }));

  await db.transaction('rw', [db.loans, db.amortizationRows, db.payments, db.importDocs], async () => {
    await db.loans.add(loan);
    if (amortizationRows.length) await db.amortizationRows.bulkAdd(amortizationRows);

    if (input.seedPastAsPaid) {
      const past = amortizationRows.filter((r) => r.dueDate && r.dueDate <= today.toISOString().slice(0, 10));
      if (past.length) {
        await db.payments.bulkAdd(
          past.map((r) => ({
            id: newId(),
            loanId: id,
            date: r.dueDate,
            amount: r.emi,
            principalPaid: r.principal,
            interestPaid: r.interest,
            type: 'scheduled' as const,
            source: 'imported',
          })),
        );
      }
    }

    if (input.originalFile) {
      await db.importDocs.add({
        id: newId(),
        loanId: id,
        filename: input.originalFile.name,
        mimeType: input.originalFile.mimeType,
        uploadedAt: now,
        blob: input.originalFile.blob,
      });
    }
  });

  return loan;
}
