import { Link } from 'react-router-dom';
import { useLoans } from '@/hooks/useLoans';
import { formatINR } from '@/lib/money';

export function Dashboard() {
  const loans = useLoans();
  const totalOutstanding = loans?.reduce((acc, l) => acc + l.principal, 0) ?? 0;
  const totalMonthlyEMI = loans?.reduce((acc, l) => acc + (l.emiAmount ?? 0), 0) ?? 0;
  const count = loans?.length ?? 0;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4">
          <div className="text-xs text-slate-500">Total outstanding</div>
          <div className="text-xl font-semibold mt-1">{formatINR(totalOutstanding)}</div>
        </div>
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4">
          <div className="text-xs text-slate-500">Monthly EMIs</div>
          <div className="text-xl font-semibold mt-1">{formatINR(totalMonthlyEMI)}</div>
        </div>
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4">
          <div className="text-xs text-slate-500">Active loans</div>
          <div className="text-xl font-semibold mt-1">{count}</div>
        </div>
      </div>

      {count === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-2">
          <p>No loans yet. Get started:</p>
          <div className="flex gap-2 justify-center">
            <Link to="/loans/new" className="text-brand-accent font-medium">Add loan manually</Link>
            <span className="text-slate-400">·</span>
            <Link to="/import" className="text-brand-accent font-medium">Import a schedule</Link>
          </div>
        </div>
      )}
    </section>
  );
}
