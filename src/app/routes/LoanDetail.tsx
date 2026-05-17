import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLoan } from '@/hooks/useLoans';
import { deleteLoan } from '@/db/repos/loan';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/money';

export function LoanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loan = useLoan(id);

  if (loan === undefined) return <p>Loading…</p>;
  if (!loan) return <p>Loan not found</p>;

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold">{loan.name}</h2>
          <p className="text-sm text-slate-500">{loan.lender} · {loan.type.replace('_', ' ')}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/loans/${loan.id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button
            variant="danger"
            onClick={async () => {
              if (confirm(`Delete "${loan.name}"? This removes all payments and schedule rows. Cannot be undone.`)) {
                await deleteLoan(loan.id);
                navigate('/loans');
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Principal" value={formatINR(loan.principal)} />
        <Stat label="Rate" value={`${loan.annualRatePct}% p.a.`} />
        <Stat label="Tenure" value={`${loan.tenureMonths} months`} />
        <Stat label="EMI" value={loan.emiAmount ? formatINR(loan.emiAmount) : '—'} />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
        <p className="text-sm text-slate-500">
          Tabs (amortization, payments, prepay simulator) are wired up in the next milestones.
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
