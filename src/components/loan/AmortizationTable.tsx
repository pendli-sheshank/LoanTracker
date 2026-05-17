import type { AmortizationRow } from '@/domain/loan/types';
import { formatINR } from '@/lib/money';

export function AmortizationTable({ rows }: { rows: AmortizationRow[] }) {
  return (
    <div className="overflow-auto max-h-[60vh] rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Due</th>
            <th className="p-2 text-right">Opening</th>
            <th className="p-2 text-right">EMI</th>
            <th className="p-2 text-right">Interest</th>
            <th className="p-2 text-right">Principal</th>
            <th className="p-2 text-right">Closing</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.installmentNo} className="border-t border-slate-100 dark:border-slate-800">
              <td className="p-2">{r.installmentNo}</td>
              <td className="p-2">{r.dueDate}</td>
              <td className="p-2 text-right tabular-nums">{formatINR(r.openingBalance)}</td>
              <td className="p-2 text-right tabular-nums">{formatINR(r.emi)}</td>
              <td className="p-2 text-right tabular-nums text-rose-600">{formatINR(r.interest)}</td>
              <td className="p-2 text-right tabular-nums text-sky-600">{formatINR(r.principal)}</td>
              <td className="p-2 text-right tabular-nums">{formatINR(r.closingBalance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
