import { useMemo } from 'react';
import { useLoans } from '@/hooks/useLoans';
import { formatINR, paiseToRupees } from '@/lib/money';
import { buildSchedule, summarize } from '@/domain/loan/amortization';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import type { Loan } from '@/domain/loan/types';

const TYPE_COLORS: Record<Loan['type'], string> = {
  housing: '#10b981',
  personal: '#8b5cf6',
  education: '#f59e0b',
  credit_card: '#f43f5e',
};

const inrCompact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

export function Analytics() {
  const loans = useLoans();

  const data = useMemo(() => {
    if (!loans || loans.length === 0) return null;

    const summaries: Array<{
      loan: Loan;
      totalInterest: number;
      totalPaid: number;
      tenureMonths: number;
    }> = [];

    loans.forEach((loan) => {
      if (loan.type === 'credit_card') return;
      try {
        const sched = buildSchedule({
          principalPaise: loan.principal,
          annualRatePct: loan.annualRatePct,
          tenureMonths: loan.tenureMonths,
          startDate: loan.startDate,
          emiOverridePaise: loan.emiAmount,
        });
        const sum = summarize(sched);
        summaries.push({ loan, totalInterest: sum.totalInterest, totalPaid: sum.totalPaid, tenureMonths: loan.tenureMonths });
      } catch {
        // skip
      }
    });

    const barData = summaries.map((s) => ({
      name: s.loan.name.length > 12 ? s.loan.name.slice(0, 12) + '…' : s.loan.name,
      Principal: paiseToRupees(s.loan.principal),
      Interest: paiseToRupees(s.totalInterest),
    }));

    const costRatio = summaries.map((s) => ({
      name: s.loan.name.length > 14 ? s.loan.name.slice(0, 14) + '…' : s.loan.name,
      ratio: s.loan.principal > 0 ? ((s.totalInterest / s.loan.principal) * 100) : 0,
      rate: s.loan.annualRatePct,
      tenure: s.tenureMonths,
    }));

    const totalPrincipal = summaries.reduce((a, s) => a + s.loan.principal, 0);
    const totalInterest = summaries.reduce((a, s) => a + s.totalInterest, 0);
    const totalCost = totalPrincipal + totalInterest;

    const typeBreakdown = Object.entries(
      loans.reduce<Record<string, number>>((acc, l) => {
        acc[l.type] = (acc[l.type] ?? 0) + l.principal;
        return acc;
      }, {}),
    ).map(([type, amount]) => ({
      name: { housing: 'Housing', personal: 'Personal', education: 'Education', credit_card: 'Credit Card' }[type] ?? type,
      value: paiseToRupees(amount),
      color: TYPE_COLORS[type as Loan['type']] ?? '#94a3b8',
    }));

    return { barData, costRatio, totalPrincipal, totalInterest, totalCost, typeBreakdown, summaries };
  }, [loans]);

  if (!loans) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.summaries.length === 0) {
    return (
      <div className="max-w-5xl space-y-4">
        <PageHeader />
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-400">
          <p className="text-sm">Add loans to see analytics here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader />

      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MiniStat label="Total Borrowed" value={formatINR(data.totalPrincipal)} color="text-sky-600 dark:text-sky-400" />
        <MiniStat label="Total Interest Cost" value={formatINR(data.totalInterest)} color="text-rose-600 dark:text-rose-400" />
        <MiniStat label="Total Payable" value={formatINR(data.totalCost)} color="text-violet-600 dark:text-violet-400" />
      </div>

      {/* Principal vs Interest bar chart */}
      <ChartCard title="Principal vs Interest Breakdown" subtitle="Per loan — how much of total cost goes to interest">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${inrCompact.format(v)}`} />
              <Tooltip
                formatter={(value: number, name) => [`₹${new Intl.NumberFormat('en-IN').format(Math.round(value))}`, name]}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Principal" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Interest" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Interest cost ratio + Composition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Interest-to-Principal Ratio" subtitle="Higher % = more expensive loan">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.costRatio} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(1)}%`, 'Interest ratio']}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="ratio" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Portfolio Composition" subtitle="By loan type · principal value">
          <div className="flex items-center gap-4 h-52">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.typeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {data.typeBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`₹${new Intl.NumberFormat('en-IN').format(Math.round(v))}`, 'Principal']}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 shrink-0">
              {data.typeBreakdown.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Per-loan stats table */}
      <ChartCard title="Loan-by-Loan Summary" subtitle="Rates, tenure, and total cost">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                {['Loan', 'Type', 'Rate', 'Tenure', 'Principal', 'Interest', 'Total Cost'].map((h) => (
                  <th key={h} className="pb-2 pr-4 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.summaries.map(({ loan, totalInterest, totalPaid }) => (
                <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2.5 pr-4 font-medium">{loan.name}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ background: TYPE_COLORS[loan.type] }}
                    >
                      {loan.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{loan.annualRatePct}%</td>
                  <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{loan.tenureMonths}m</td>
                  <td className="py-2.5 pr-4">{formatINR(loan.principal)}</td>
                  <td className="py-2.5 pr-4 text-rose-600 dark:text-rose-400">{formatINR(totalInterest)}</td>
                  <td className="py-2.5 font-semibold">{formatINR(totalPaid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h2 className="text-2xl font-bold">Analytics</h2>
      <p className="text-sm text-slate-500 mt-0.5">Deep-dive into your loan cost and composition</p>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
