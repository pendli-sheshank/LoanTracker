import { Link } from 'react-router-dom';
import type { Loan } from '@/domain/loan/types';
import { formatINR } from '@/lib/money';
import { IconArrowRight } from '@/components/ui/Icons';

const TYPE_LABEL: Record<Loan['type'], string> = {
  personal: 'Personal',
  housing: 'Housing',
  education: 'Education',
  credit_card: 'Credit Card',
};

const TYPE_COLOR: Record<Loan['type'], { bg: string; text: string; dot: string }> = {
  personal: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  housing: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  education: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  credit_card: { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
};

const AVATAR_COLOR: Record<Loan['type'], string> = {
  personal: 'from-purple-500 to-violet-600',
  housing: 'from-emerald-500 to-teal-600',
  education: 'from-amber-500 to-orange-600',
  credit_card: 'from-rose-500 to-pink-600',
};

export function LoanCard({ loan, outstanding, paidPct }: { loan: Loan; outstanding?: number; paidPct?: number }) {
  const colors = TYPE_COLOR[loan.type];
  const avatar = AVATAR_COLOR[loan.type];

  return (
    <Link
      to={`/loans/${loan.id}`}
      className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md transition-all group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${avatar} text-white font-bold text-sm`}
          >
            {loan.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold leading-tight">{loan.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">{loan.lender}</div>
          </div>
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${colors.bg} ${colors.text}`}>
          {TYPE_LABEL[loan.type]}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Principal</div>
          <div className="font-semibold mt-0.5 text-xs">{formatINR(loan.principal)}</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
            {loan.type === 'credit_card' ? 'Outstanding' : 'EMI'}
          </div>
          <div className="font-semibold mt-0.5 text-xs">
            {loan.type === 'credit_card'
              ? formatINR(outstanding ?? loan.principal)
              : loan.emiAmount
              ? formatINR(loan.emiAmount)
              : '—'}
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Rate</div>
          <div className="font-semibold mt-0.5 text-xs">{loan.annualRatePct}% p.a.</div>
        </div>
      </div>

      {/* Progress bar */}
      {typeof paidPct === 'number' && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400">Repaid</span>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{paidPct.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full ${colors.dot} transition-all`}
              style={{ width: `${Math.min(100, Math.max(0, paidPct))}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] text-slate-400">
          {loan.tenureMonths} months · starts {loan.startDate}
        </div>
        <IconArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 transition-colors" />
      </div>
    </Link>
  );
}
