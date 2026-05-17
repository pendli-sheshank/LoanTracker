import { Link } from 'react-router-dom';
import type { Loan } from '@/domain/loan/types';
import { formatINR } from '@/lib/money';

const typeLabel: Record<Loan['type'], string> = {
  personal: 'Personal',
  housing: 'Housing',
  education: 'Education',
  credit_card: 'Credit Card',
};

const typeColor: Record<Loan['type'], string> = {
  personal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  housing: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  education: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  credit_card: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
};

export function LoanCard({ loan, outstanding, paidPct }: { loan: Loan; outstanding?: number; paidPct?: number }) {
  return (
    <Link
      to={`/loans/${loan.id}`}
      className="block rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-brand-accent transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{loan.name}</div>
          <div className="text-xs text-slate-500">{loan.lender}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${typeColor[loan.type]}`}>{typeLabel[loan.type]}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-xs text-slate-500">Principal</div>
          <div className="font-medium">{formatINR(loan.principal)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">{loan.type === 'credit_card' ? 'Outstanding' : 'EMI'}</div>
          <div className="font-medium">
            {loan.type === 'credit_card'
              ? formatINR(outstanding ?? loan.principal)
              : loan.emiAmount
                ? formatINR(loan.emiAmount)
                : '—'}
          </div>
        </div>
      </div>
      {typeof paidPct === 'number' && (
        <div className="mt-3">
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="h-full bg-brand-accent" style={{ width: `${Math.min(100, Math.max(0, paidPct))}%` }} />
          </div>
          <div className="mt-1 text-xs text-slate-500">{paidPct.toFixed(1)}% paid</div>
        </div>
      )}
    </Link>
  );
}
