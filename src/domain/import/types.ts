export type RawRow = Record<string, string | number | null>;

export interface ParsedTable {
  headers: string[];
  rows: RawRow[];
  sheetName?: string;
}

export type CanonicalField =
  | 'installmentNo'
  | 'dueDate'
  | 'emi'
  | 'principal'
  | 'interest'
  | 'openingBalance'
  | 'closingBalance';

export type ColumnMapping = Partial<Record<CanonicalField, string>>;

export interface MappedRow {
  installmentNo?: number;
  dueDate?: string;
  emi?: number;
  principal?: number;
  interest?: number;
  openingBalance?: number;
  closingBalance?: number;
}

export interface ValidationIssue {
  rowIndex: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export interface InferredLoanMeta {
  principalPaise: number;
  tenureMonths: number;
  emiPaise: number;
  annualRatePct: number;
  startDate: string;
}
