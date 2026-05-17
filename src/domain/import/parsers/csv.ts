import Papa from 'papaparse';
import type { ParsedTable, RawRow } from '../types';

export async function parseCsv(file: File): Promise<ParsedTable[]> {
  const text = await file.text();
  const result = Papa.parse<RawRow>(text, {
    header: true,
    dynamicTyping: false,
    skipEmptyLines: true,
  });
  const headers = result.meta.fields ?? (result.data[0] ? Object.keys(result.data[0]) : []);
  return [{ sheetName: file.name, headers, rows: result.data }];
}
