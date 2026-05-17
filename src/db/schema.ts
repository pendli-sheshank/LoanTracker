import Dexie, { type Table } from 'dexie';
import type { Loan, AmortizationRow, RateChange } from '@/domain/loan/types';

export interface Payment {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  type: 'scheduled' | 'prepayment' | 'partial' | 'foreclosure';
  source?: string;
}

export interface ImportDoc {
  id: string;
  loanId: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
  blob: Blob;
}

export class LoanTrackerDB extends Dexie {
  loans!: Table<Loan, string>;
  amortizationRows!: Table<AmortizationRow & { loanId: string }, [string, number]>;
  payments!: Table<Payment, string>;
  rateChanges!: Table<RateChange, string>;
  importDocs!: Table<ImportDoc, string>;

  constructor() {
    super('loan_tracker');
    this.version(1).stores({
      loans: 'id, type, lender, startDate',
      amortizationRows: '[loanId+installmentNo], loanId, dueDate',
      payments: 'id, loanId, date',
      rateChanges: 'id, loanId, effectiveDate',
      importDocs: 'id, loanId, uploadedAt',
    });
  }
}

export const db = new LoanTrackerDB();
