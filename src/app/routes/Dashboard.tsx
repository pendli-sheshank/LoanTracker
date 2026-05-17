import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLoans } from '@/hooks/useLoans';
import { formatINR } from '@/lib/money';
import { buildSchedule, summarize } from '@/domain/loan/amortization';
import { IconPlus, IconImport, IconArrowRight, IconCalendar, IconWallet, IconTrendUp } from '@/components/ui/Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Loan } from '@/domain/loan/types';

const TYPE_COLORS: Record<Loan['type'], string> = {
  housing: '#10b981',
  personal: '#8b5cf6',
  education: '#f59e0b',
  credit_card: '#f43f5e',
};
const TYPE_LABELS: Record<Loan['type'], string> = {
  housing: 'Housing',
  personal: 'Personal',
  education: 'Education',
  credit_card: 'Credit Card',
};

function RepaymentRing({ pct }: { pct: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-200 dark:text-slate-700" />
      <circle
        cx="70" cy="70" r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="12"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
      />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <text x="70" y="65" textAnchor="middle" className="text-slate-900" style={{ fill: 'currentColor', fontSize: 22, fontWeight: 700 }}>
        {Math.round(pct)}%
      </text>
      <text x="70" y="82" textAnchor="middle" style={{ fill: '#94a3b8', fontSize: 11 }}>repaid</text>
    </svg>
  );
}

export function Dashboard() {
  const loans = useLoans();

  const stats = useMemo(() => {
    if (!loans) return null;
    let totalPrincipal = 0;
    let totalPaid = 0;
    let totalEMI = 0;
    const byType: Record<string, number> = {};

    loans.forEach((loan) => {
      totalPrincipal += loan.principal;
      totalEMI += loan.emiAmount ?? 0;
      byType[loan.type] = (byType[loan.type] ?? 0) + loan.principal;

      if (loan.type !== 'credit_card') {
        try {
          const sched = buildSchedule({
            principalPaise: loan.principal,
            annualRatePct: loan.annualRatePct,
            tenureMonths: loan.tenureMonths,
            startDate: loan.startDate,
            emiOverridePaise: loan.emiAmount,
          });
          const sum = summarize(sched);
          totalPaid += sum.totalPaid - sum.totalInterest - loan.principal;
        } catch {
          // skip
        }
      }
    });

    const paidPct = totalPrincipal > 0 ? Math.min(100, (totalPaid / totalPrincipal) * 100) : 0;
    const outstanding = totalPrincipal - totalPaid;

    const pieData = Object.entries(byType).map(([type, amount]) => ({
      name: TYPE_LABELS[type as Loan['type']] ?? type,
      value: amount,
      color: TYPE_COLORS[type as Loan['type']] ?? '#94a3b8',
    }));

    return { totalPrincipal, outstanding: Math.max(0, outstanding), totalEMI, paidPct, pieData, count: loans.length };
  }, [loans]);

  const upcomingLoans = useMemo(() => {
    if (!loans) return [];
    return loans
      .filter((l) => l.emiAmount && l.type !== 'credit_card')
      .slice(0, 4);
  }, [loans]);

  if (!loans) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loans.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">Your loan portfolio at a glance</p>
        </div>
        <Link
          to="/loans/new"
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <IconPlus className="w-4 h-4" />
          Add loan
        </Link>
      </div>

      {/* Hero stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Outstanding"
          value={formatINR(stats?.outstanding ?? 0)}
          sub={`of ${formatINR(stats?.totalPrincipal ?? 0)} borrowed`}
          gradient="from-sky-500 to-indigo-600"
          icon={<IconWallet className="w-6 h-6 text-white/80" />}
        />
        <StatCard
          label="Monthly EMI"
          value={formatINR(stats?.totalEMI ?? 0)}
          sub={`across ${stats?.count ?? 0} active loan${(stats?.count ?? 0) !== 1 ? 's' : ''}`}
          gradient="from-violet-500 to-purple-600"
          icon={<IconCalendar className="w-6 h-6 text-white/80" />}
        />
        <StatCard
          label="Repayment Progress"
          value={`${(stats?.paidPct ?? 0).toFixed(1)}%`}
          sub="principal repaid"
          gradient="from-emerald-500 to-teal-600"
          icon={<IconTrendUp className="w-6 h-6 text-white/80" />}
        />
      </div>

      {/* Middle section: Ring chart + Loan composition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Repayment ring */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center justify-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 self-start">Overall Repayment</h3>
          <RepaymentRing pct={stats?.paidPct ?? 0} />
          <p className="text-xs text-slate-500 text-center">
            {formatINR((stats?.totalPrincipal ?? 0) - (stats?.outstanding ?? 0))} paid · {formatINR(stats?.outstanding ?? 0)} remaining
          </p>
        </div>

        {/* Loan type breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Loan Composition</h3>
          {(stats?.pieData.length ?? 0) > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={52}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {stats?.pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatINR(v)}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {stats?.pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-xs font-medium">{formatINR(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No data</p>
          )}
        </div>
      </div>

      {/* Upcoming EMIs */}
      {upcomingLoans.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active Loans</h3>
            <Link to="/loans" className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-600 font-medium">
              View all <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingLoans.map((loan) => (
              <LoanRow key={loan.id} loan={loan} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  gradient,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  gradient: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white" />
        <div className="absolute -right-2 -bottom-8 w-24 h-24 rounded-full bg-white" />
      </div>
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-white/80">{label}</span>
          {icon}
        </div>
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="text-xs text-white/70 mt-1">{sub}</div>
      </div>
    </div>
  );
}

function LoanRow({ loan }: { loan: Loan }) {
  const typeColor = TYPE_COLORS[loan.type];
  return (
    <Link
      to={`/loans/${loan.id}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold"
        style={{ background: typeColor }}
      >
        {loan.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{loan.name}</div>
        <div className="text-xs text-slate-500 truncate">{loan.lender}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold">{formatINR(loan.emiAmount ?? 0)}</div>
        <div className="text-xs text-slate-400">/ month</div>
      </div>
      <IconArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">Your loan portfolio at a glance</p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
          <IconWallet className="w-8 h-8 text-white" />
        </div>
        <div>
          <p className="text-lg font-semibold">No loans yet</p>
          <p className="text-sm text-slate-500 mt-1">Add a loan manually or import an amortization schedule</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/loans/new"
            className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <IconPlus className="w-4 h-4" />
            Add loan manually
          </Link>
          <Link
            to="/import"
            className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <IconImport className="w-4 h-4" />
            Import schedule
          </Link>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'EMI Calculator', desc: 'Compute exact EMIs with reducing-balance interest', color: 'from-sky-500 to-indigo-500' },
          { title: 'Prepay Simulator', desc: 'See how extra payments cut your interest cost', color: 'from-violet-500 to-purple-500' },
          { title: 'Tax Deductions', desc: 'Track Sec 24b & 80C/80E benefits automatically', color: 'from-emerald-500 to-teal-500' },
        ].map((f) => (
          <div key={f.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${f.color} mb-3`} />
            <div className="text-sm font-semibold">{f.title}</div>
            <div className="text-xs text-slate-500 mt-1">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
