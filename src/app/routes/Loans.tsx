import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLoans } from '@/hooks/useLoans';
import { LoanCard } from '@/components/loan/LoanCard';
import { IconPlus, IconImport } from '@/components/ui/Icons';
import type { LoanType } from '@/domain/loan/types';

const filters: { value: LoanType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'personal', label: 'Personal' },
  { value: 'housing', label: 'Housing' },
  { value: 'education', label: 'Education' },
  { value: 'credit_card', label: 'Credit Card' },
];

export function Loans() {
  const loans = useLoans();
  const [filter, setFilter] = useState<LoanType | 'all'>('all');
  const filtered = filter === 'all' ? loans : loans?.filter((l) => l.type === filter);

  return (
    <section className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Loans</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loans?.length ?? 0} loan{loans?.length !== 1 ? 's' : ''} in your portfolio
          </p>
        </div>
        <Link
          to="/loans/new"
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <IconPlus className="w-4 h-4" />
          Add loan
        </Link>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-sky-500 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-300 dark:hover:border-sky-700'
            }`}
          >
            {f.label}
            {f.value !== 'all' && loans && (
              <span className="ml-1 opacity-70">
                ({loans.filter((l) => l.type === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered && filtered.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center space-y-4">
          <div className="text-slate-400">
            {filter === 'all' ? 'No loans yet.' : `No ${filter.replace('_', ' ')} loans.`}
          </div>
          {filter === 'all' && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/loans/new"
                className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <IconPlus className="w-4 h-4" />
                Add your first loan
              </Link>
              <Link
                to="/import"
                className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <IconImport className="w-4 h-4" />
                Import schedule
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Loan grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered?.map((loan) => <LoanCard key={loan.id} loan={loan} />)}
      </div>
    </section>
  );
}
