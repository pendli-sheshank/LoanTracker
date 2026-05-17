import { useMemo } from 'react';
import { useLoans } from '@/hooks/useLoans';
import { formatINR, paiseToRupees } from '@/lib/money';
import { buildSchedule } from '@/domain/loan/amortization';
import { IconShield, IconTax } from '@/components/ui/Icons';

const HOME_INTEREST_CAP_SELF = 200000 * 100; // ₹2L in paise
const HOME_INTEREST_CAP_LETOUT = Infinity;
const HOME_PRINCIPAL_CAP = 150000 * 100; // ₹1.5L in paise (80C)

type FY = string; // e.g. "2024-25"

function getFY(date: string): FY {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-indexed
  const startYear = m >= 3 ? y : y - 1; // Apr = month 3
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

interface FYBenefit {
  fy: FY;
  sec24b: number; // interest deduction (paise)
  sec80C: number; // principal repaid (paise)
  sec80E: number; // education loan interest (paise)
  sec24bCap: number;
  notes: string[];
}

export function Tax() {
  const loans = useLoans();

  const fyMap = useMemo<Map<FY, FYBenefit>>(() => {
    const map = new Map<FY, FYBenefit>();

    if (!loans) return map;

    loans.forEach((loan) => {
      if (loan.type === 'credit_card') return;

      let schedule;
      try {
        schedule = buildSchedule({
          principalPaise: loan.principal,
          annualRatePct: loan.annualRatePct,
          tenureMonths: loan.tenureMonths,
          startDate: loan.startDate,
          emiOverridePaise: loan.emiAmount,
        });
      } catch {
        return;
      }

      schedule.forEach((row) => {
        const fy = getFY(row.dueDate);
        if (!map.has(fy)) {
          map.set(fy, { fy, sec24b: 0, sec80C: 0, sec80E: 0, sec24bCap: 0, notes: [] });
        }
        const entry = map.get(fy)!;

        if (loan.type === 'housing') {
          entry.sec24b += row.interest;
          entry.sec80C += row.principal;
          const cap = loan.isSelfOccupied ? HOME_INTEREST_CAP_SELF : HOME_INTEREST_CAP_LETOUT;
          entry.sec24bCap = Math.max(entry.sec24bCap, cap);
        } else if (loan.type === 'education') {
          entry.sec80E += row.interest;
        }
      });
    });

    // Apply caps
    map.forEach((entry) => {
      if (entry.sec24bCap > 0) {
        entry.sec24b = Math.min(entry.sec24b, entry.sec24bCap);
      }
      entry.sec80C = Math.min(entry.sec80C, HOME_PRINCIPAL_CAP);
    });

    return map;
  }, [loans]);

  const rows = Array.from(fyMap.values()).sort((a, b) => a.fy.localeCompare(b.fy));

  const hasHousing = loans?.some((l) => l.type === 'housing');
  const hasEducation = loans?.some((l) => l.type === 'education');

  if (!loans) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tax Benefits (FY)</h2>
        <p className="text-sm text-slate-500 mt-0.5">Income tax deductions from your loan repayments</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoCard
          section="Section 24(b)"
          title="Home Loan Interest"
          cap="₹2L cap (self-occupied) · No cap (let-out)"
          color="from-sky-500 to-indigo-600"
          active={!!hasHousing}
        />
        <InfoCard
          section="Section 80C"
          title="Home Loan Principal"
          cap="₹1.5L cap (combined with other 80C investments)"
          color="from-violet-500 to-purple-600"
          active={!!hasHousing}
        />
        <InfoCard
          section="Section 80E"
          title="Education Loan Interest"
          cap="No cap · Up to 8 AYs after repayment starts"
          color="from-amber-500 to-orange-600"
          active={!!hasEducation}
        />
      </div>

      {rows.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-400">
          <IconTax className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Add housing or education loans to calculate tax deductions.</p>
        </div>
      ) : (
        <>
          {/* FY table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold">Year-wise Tax Deductions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Amounts in ₹ · After applicable caps</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
                    {['Financial Year', 'Sec 24(b) Interest', 'Sec 80C Principal', 'Sec 80E Interest', 'Total Deduction'].map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((row) => {
                    const total = row.sec24b + row.sec80C + row.sec80E;
                    return (
                      <tr key={row.fy} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-semibold">FY {row.fy}</td>
                        <td className="px-5 py-3.5 text-sky-600 dark:text-sky-400">
                          {row.sec24b > 0 ? formatINR(row.sec24b) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-violet-600 dark:text-violet-400">
                          {row.sec80C > 0 ? formatINR(row.sec80C) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-amber-600 dark:text-amber-400">
                          {row.sec80E > 0 ? formatINR(row.sec80E) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">{formatINR(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                    <td className="px-5 py-3 text-xs font-semibold text-slate-500">Lifetime total</td>
                    <td className="px-5 py-3 font-semibold text-sky-600 dark:text-sky-400">
                      {formatINR(rows.reduce((a, r) => a + r.sec24b, 0))}
                    </td>
                    <td className="px-5 py-3 font-semibold text-violet-600 dark:text-violet-400">
                      {formatINR(rows.reduce((a, r) => a + r.sec80C, 0))}
                    </td>
                    <td className="px-5 py-3 font-semibold text-amber-600 dark:text-amber-400">
                      {formatINR(rows.reduce((a, r) => a + r.sec80E, 0))}
                    </td>
                    <td className="px-5 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(rows.reduce((a, r) => a + r.sec24b + r.sec80C + r.sec80E, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Tax saving estimates */}
          <TaxSavingEstimate rows={rows} />

          {/* Disclaimer */}
          <p className="text-xs text-slate-400 text-center">
            Figures are estimates based on the amortization schedule. Consult a chartered accountant for actual tax filing.
            Caps applied: Sec 24(b) ₹2L/yr self-occupied, Sec 80C ₹1.5L/yr, Sec 80E no cap.
          </p>
        </>
      )}
    </div>
  );
}

function InfoCard({ section, title, cap, color, active }: { section: string; title: string; cap: string; color: string; active: boolean }) {
  return (
    <div className={`rounded-2xl p-4 text-white bg-gradient-to-br ${color} ${!active ? 'opacity-40' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold text-white/70 uppercase tracking-wide">{section}</div>
          <div className="text-sm font-semibold mt-1">{title}</div>
        </div>
        <IconShield className="w-5 h-5 text-white/60 shrink-0" />
      </div>
      <div className="mt-3 text-[11px] text-white/70 leading-relaxed">{cap}</div>
      {!active && <div className="mt-2 text-[11px] text-white/60 italic">No eligible loans</div>}
    </div>
  );
}

function TaxSavingEstimate({ rows }: { rows: FYBenefit[] }) {
  const slabs = [
    { label: '5% slab', rate: 0.05 },
    { label: '20% slab', rate: 0.20 },
    { label: '30% slab', rate: 0.30 },
  ];

  const currentFY = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const sy = m >= 3 ? y : y - 1;
    return `${sy}-${String(sy + 1).slice(-2)}`;
  })();

  const currentRow = rows.find((r) => r.fy === currentFY);
  if (!currentRow) return null;

  const totalDeduction = currentRow.sec24b + currentRow.sec80C + currentRow.sec80E;
  if (totalDeduction === 0) return null;

  const deductionRupees = paiseToRupees(totalDeduction);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="text-sm font-semibold mb-1">Estimated Tax Savings — FY {currentFY}</h3>
      <p className="text-xs text-slate-400 mb-4">Based on total deduction of {formatINR(totalDeduction)} this year</p>
      <div className="grid grid-cols-3 gap-3">
        {slabs.map((s) => (
          <div key={s.label} className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-center">
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{s.label}</div>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              ₹{Math.round(deductionRupees * s.rate).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-500/70 mt-0.5">saved</div>
          </div>
        ))}
      </div>
    </div>
  );
}
