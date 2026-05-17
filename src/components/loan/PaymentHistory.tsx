import type { Loan } from '@/domain/loan/types';
import { usePayments } from '@/hooks/usePayments';
import { addPayment, deletePayment } from '@/db/repos/payment';
import { PaymentForm } from './PaymentForm';
import { formatINR } from '@/lib/money';

const typeLabel: Record<string, string> = {
  scheduled: 'EMI',
  prepayment: 'Prepay',
  partial: 'Partial',
  foreclosure: 'Foreclose',
};

export function PaymentHistory({ loan }: { loan: Loan }) {
  const payments = usePayments(loan.id);
  const totalPaid = payments?.reduce((a, p) => a + p.amount, 0) ?? 0;
  const totalPrincipal = payments?.reduce((a, p) => a + p.principalPaid, 0) ?? 0;
  const totalInterest = payments?.reduce((a, p) => a + p.interestPaid, 0) ?? 0;

  return (
    <div className="space-y-4">
      <PaymentForm onSubmit={async (data) => { await addPayment(loan.id, data); }} />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total paid" value={formatINR(totalPaid)} />
        <Stat label="Principal" value={formatINR(totalPrincipal)} accent="text-sky-600" />
        <Stat label="Interest" value={formatINR(totalInterest)} accent="text-rose-600" />
      </div>

      {payments && payments.length === 0 && (
        <p className="text-sm text-slate-500">No payments logged yet.</p>
      )}

      {payments && payments.length > 0 && (
        <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-right">Principal</th>
                <th className="p-2 text-right">Interest</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-2">{p.date}</td>
                  <td className="p-2">{typeLabel[p.type] ?? p.type}</td>
                  <td className="p-2 text-right tabular-nums">{formatINR(p.amount)}</td>
                  <td className="p-2 text-right tabular-nums text-sky-600">{formatINR(p.principalPaid)}</td>
                  <td className="p-2 text-right tabular-nums text-rose-600">{formatINR(p.interestPaid)}</td>
                  <td className="p-2 text-right">
                    <button
                      onClick={async () => {
                        if (confirm('Delete this payment?')) await deletePayment(p.id);
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`font-semibold mt-1 ${accent ?? ''}`}>{value}</div>
    </div>
  );
}
