export type LoanType = 'personal' | 'credit_card' | 'education' | 'housing';
export type InterestType = 'reducing_balance' | 'flat' | 'revolving';

export interface Loan {
  id: string;
  type: LoanType;
  name: string;
  lender: string;
  principal: number;
  annualRatePct: number;
  interestType: InterestType;
  tenureMonths: number;
  startDate: string;
  emiAmount?: number;
  processingFee?: number;
  creditLimit?: number;
  billingCycleDay?: number;
  minPaymentPct?: number;
  isSelfOccupied?: boolean;
  coBorrowerShare?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AmortizationRow {
  installmentNo: number;
  dueDate: string;
  openingBalance: number;
  emi: number;
  interest: number;
  principal: number;
  closingBalance: number;
}

export interface RateChange {
  id: string;
  loanId: string;
  effectiveDate: string;
  newRatePct: number;
}
