import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLoan } from '@/hooks/useLoans';
import { deleteLoan } from '@/db/repos/loan';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { AmortizationChart } from '@/components/loan/AmortizationChart';
import { AmortizationTable } from '@/components/loan/AmortizationTable';
import { PrepaySimulator } from '@/components/loan/PrepaySimulator';
import { buildSchedule, summarize } from '@/domain/loan/amortization';
import { formatINR } from '@/lib/money';

export function LoanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loan = useLoan(id);

  const schedule = useMemo(() => {
    if (!loan || loan.type === 'credit_card') return null;
    return buildSchedule({
      principalPaise: loan.principal,
      annualRatePct: loan.annualRatePct,
      tenureMonths: loan.tenureMonths,
      startDate: loan.startDate,
      emiOverridePaise: loan.emiAmount,
    });
  }, [loan]);

  const summary = useMemo(() => (schedule ? summarize(schedule) : null), [schedule]);

  if (loan === undefined) return <p>Loading…</p>;
  if (!loan) return <p>Loan not found</p>;

  const summaryTab = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Stat label="Principal" value={formatINR(loan.principal)} />
      <Stat label="Rate" value={`${loan.annualRatePct}% p.a.`} />
      <Stat label="Tenure" value={`${loan.tenureMonths} months`} />
      <Stat label="EMI" value={loan.emiAmount ? formatINR(loan.emiAmount) : '—'} />
      {summary && (
        <>
          <Stat label="Total interest" value={formatINR(summary.totalInterest)} accent="text-rose-600" />
          <Stat label="Total payable" value={formatINR(summary.totalPaid)} />
          <Stat label="Payoff date" value={summary.payoffDate} />
          <Stat label="Start date" value={loan.startDate} />
        </>
      )}
    </div>
  );

  const tabs = [{ id: 'summary', label: 'Summary', content: summaryTab }];
  if (schedule) {
    tabs.push(
      { id: 'chart', label: 'Schedule chart', content: <AmortizationChart rows={schedule} /> },
      { id: 'table', label: 'Schedule table', content: <AmortizationTable rows={schedule} /> },
      { id: 'prepay', label: 'Prepay simulator', content: <PrepaySimulator loan={loan} /> },
    );
  }

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

      <Tabs tabs={tabs} />
    </section>
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
