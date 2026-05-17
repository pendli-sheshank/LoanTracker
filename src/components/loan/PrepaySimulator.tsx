import { useMemo, useState } from 'react';
import type { Loan } from '@/domain/loan/types';
import { simulatePrepay, type PrepayMode } from '@/domain/loan/prepay';
import { formatINR, rupeesToPaise } from '@/lib/money';
import { Field, Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export function PrepaySimulator({ loan }: { loan: Loan }) {
  const [amountRupees, setAmountRupees] = useState<number>(50000);
  const [afterInstallment, setAfterInstallment] = useState<number>(12);
  const [mode, setMode] = useState<PrepayMode>('reduce_tenure');
  const [run, setRun] = useState(false);

  const result = useMemo(() => {
    if (!run) return null;
    return simulatePrepay({
      principalPaise: loan.principal,
      annualRatePct: loan.annualRatePct,
      tenureMonths: loan.tenureMonths,
      startDate: loan.startDate,
      prepay: {
        prepayAmountPaise: rupeesToPaise(amountRupees),
        afterInstallment,
        mode,
      },
    });
  }, [run, loan, amountRupees, afterInstallment, mode]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Prepay amount (₹)">
          <Input
            type="number"
            value={amountRupees}
            onChange={(e) => setAmountRupees(Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="After installment #">
          <Input
            type="number"
            min={1}
            max={loan.tenureMonths}
            value={afterInstallment}
            onChange={(e) => setAfterInstallment(Number(e.target.value) || 1)}
          />
        </Field>
        <Field label="Mode">
          <Select value={mode} onChange={(e) => setMode(e.target.value as PrepayMode)}>
            <option value="reduce_tenure">Reduce tenure (keep EMI)</option>
            <option value="reduce_emi">Reduce EMI (keep tenure)</option>
          </Select>
        </Field>
      </div>
      <Button onClick={() => setRun(true)}>Simulate</Button>

      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Stat label="Interest saved" value={formatINR(result.interestSavedPaise)} accent="text-emerald-600" />
          <Stat label="Months saved" value={`${result.monthsSaved} months`} />
          <Stat
            label="New total payable"
            value={formatINR(result.scenario.totalPaid)}
            hint={`Was ${formatINR(result.baseline.totalPaid)}`}
          />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`font-semibold mt-1 ${accent ?? ''}`}>{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
