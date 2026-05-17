import type { ParsedTable } from './types';
import { parseXlsx } from './parsers/xlsx';
import { parseCsv } from './parsers/csv';

export async function parseFile(file: File): Promise<ParsedTable[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return parseXlsx(file);
  if (name.endsWith('.csv') || name.endsWith('.tsv')) return parseCsv(file);
  if (name.endsWith('.pdf')) {
    const { parsePdf } = await import('./parsers/pdf');
    return parsePdf(file);
  }
  throw new Error(`Unsupported file type: ${file.name}`);
}
