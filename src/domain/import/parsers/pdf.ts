import * as pdfjs from 'pdfjs-dist';
// Bundle worker so Vite resolves it at build time
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { ParsedTable, RawRow } from '../types';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface Item {
  str: string;
  x: number;
  y: number;
}

/**
 * Parse PDF amortization schedules by clustering text items into rows by Y-coordinate
 * and columns by X-coordinate. Assumes the first detected row is the header.
 */
export async function parsePdf(file: File): Promise<ParsedTable[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;

  const allItems: Item[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    for (const item of content.items as any[]) {
      if (!('str' in item) || !item.str || !item.transform) continue;
      allItems.push({
        str: String(item.str).trim(),
        x: item.transform[4],
        y: Math.round(item.transform[5]),
      });
    }
  }
  if (allItems.length === 0) return [{ headers: [], rows: [] }];

  // Group items by y (with small tolerance) — each group is a line
  const yTolerance = 3;
  const lines: Item[][] = [];
  const sorted = [...allItems].sort((a, b) => b.y - a.y || a.x - b.x);
  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last[0]!.y - item.y) <= yTolerance) {
      last.push(item);
    } else {
      lines.push([item]);
    }
  }

  // Find header line: first line with ≥ 3 items containing a known header keyword
  const headerHints = /install|emi|principal|interest|balance|due|payment|date/i;
  let headerLineIdx = lines.findIndex((l) => l.length >= 3 && l.some((it) => headerHints.test(it.str)));
  if (headerLineIdx < 0) headerLineIdx = 0;
  const headerLine = lines[headerLineIdx]!;
  const sortedHeader = [...headerLine].sort((a, b) => a.x - b.x);
  const headers = sortedHeader.map((h) => h.str);
  const columnXs = sortedHeader.map((h) => h.x);

  // For each line after the header, snap each item to the nearest column.
  const rows: RawRow[] = [];
  for (let i = headerLineIdx + 1; i < lines.length; i++) {
    const line = lines[i]!;
    const cells: (string | null)[] = headers.map(() => null);
    const bins: string[][] = headers.map(() => []);
    for (const item of line) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let c = 0; c < columnXs.length; c++) {
        const d = Math.abs(item.x - columnXs[c]!);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = c;
        }
      }
      bins[bestIdx]!.push(item.str);
    }
    for (let c = 0; c < headers.length; c++) {
      cells[c] = bins[c]!.join(' ') || null;
    }
    // Skip lines where every cell is empty
    if (cells.every((c) => !c)) continue;
    const row: RawRow = {};
    headers.forEach((h, c) => {
      row[h] = cells[c] ?? null;
    });
    rows.push(row);
  }

  return [{ sheetName: file.name, headers, rows }];
}
