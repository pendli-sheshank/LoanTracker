import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLoans } from '@/hooks/useLoans';
import { LoanCard } from '@/components/loan/LoanCard';
import { Button } from '@/components/ui/Button';
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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Loans</h2>
        <Link to="/loans/new">
          <Button>+ Add loan</Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
              filter === f.value
                ? 'bg-brand-accent text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <p className="text-slate-500">No loans yet.</p>
          <Link to="/loans/new" className="text-brand-accent text-sm font-medium">
            Add your first loan →
          </Link>
          <div className="mt-2 text-xs text-slate-500">
            Or <Link to="/import" className="underline">import an amortization schedule</Link>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered?.map((loan) => <LoanCard key={loan.id} loan={loan} />)}
      </div>
    </section>
  );
}
