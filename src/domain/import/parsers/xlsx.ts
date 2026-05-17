import * as XLSX from 'xlsx';
import type { ParsedTable, RawRow } from '../types';

export async function parseXlsx(file: File): Promise<ParsedTable[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: false });
  return wb.SheetNames.map((sheetName) => {
    const sheet = wb.Sheets[sheetName]!;
    const json = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: null, raw: true });
    const headers = json[0] ? Object.keys(json[0]) : [];
    return { sheetName, headers, rows: json };
  });
}
