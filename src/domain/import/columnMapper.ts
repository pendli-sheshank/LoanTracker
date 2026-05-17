import type { CanonicalField, ColumnMapping } from './types';

const synonyms: Record<CanonicalField, RegExp[]> = {
  installmentNo: [/install/i, /^emi\s*no/i, /^month/i, /^sl\.?\s*no/i, /^s\.?\s*no/i, /sequence/i],
  dueDate: [/due\s*date/i, /payment\s*date/i, /emi\s*date/i, /^date$/i, /installment\s*date/i],
  emi: [/^emi$/i, /installment\s*amount/i, /^payment$/i, /monthly\s*payment/i],
  principal: [/principal\s*(component|paid|amount)?/i, /^principal$/i],
  interest: [/interest\s*(component|paid|amount)?/i, /^interest$/i],
  openingBalance: [/opening\s*balance/i, /beginning\s*balance/i, /balance\s*\(?\s*start/i, /outstanding\s*(start|opening)/i],
  closingBalance: [/closing\s*balance/i, /ending\s*balance/i, /balance\s*\(?\s*end/i, /outstanding\s*(end|closing|after)/i, /^balance$/i],
};

export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const field of Object.keys(synonyms) as CanonicalField[]) {
    const patterns = synonyms[field];
    for (const h of headers) {
      if (patterns.some((p) => p.test(h))) {
        mapping[field] = h;
        break;
      }
    }
  }
  return mapping;
}
