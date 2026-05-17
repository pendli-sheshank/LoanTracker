import type { ColumnMapping, MappedRow, ParsedTable } from './types';
import { parseDateCell, parseNumberCell } from './parseNumber';

export function mapRows(table: ParsedTable, mapping: ColumnMapping): MappedRow[] {
  return table.rows.map((raw) => {
    const get = (field: keyof ColumnMapping) => {
      const col = mapping[field];
      return col ? raw[col] : null;
    };
    const installmentNo = parseNumberCell(get('installmentNo') as any, false) ?? undefined;
    const dueDate = parseDateCell(get('dueDate') as any) ?? undefined;
    const emi = parseNumberCell(get('emi') as any, true) ?? undefined;
    const principal = parseNumberCell(get('principal') as any, true) ?? undefined;
    const interest = parseNumberCell(get('interest') as any, true) ?? undefined;
    const openingBalance = parseNumberCell(get('openingBalance') as any, true) ?? undefined;
    const closingBalance = parseNumberCell(get('closingBalance') as any, true) ?? undefined;
    return {
      ...(installmentNo !== undefined ? { installmentNo } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
      ...(emi !== undefined ? { emi } : {}),
      ...(principal !== undefined ? { principal } : {}),
      ...(interest !== undefined ? { interest } : {}),
      ...(openingBalance !== undefined ? { openingBalance } : {}),
      ...(closingBalance !== undefined ? { closingBalance } : {}),
    };
  });
}
