import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loanSchema, type LoanInput } from '@/domain/loan/schema';
import type { Loan, LoanType } from '@/domain/loan/types';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { paiseToRupees } from '@/lib/money';

interface Props {
  initial?: Loan;
  onSubmit: (data: LoanInput) => Promise<void> | void;
  submitLabel?: string;
}

const typeOptions: { value: LoanType; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'housing', label: 'Housing' },
  { value: 'education', label: 'Education' },
  { value: 'credit_card', label: 'Credit Card' },
];

export function LoanForm({ initial, onSubmit, submitLabel = 'Save' }: Props) {
  const defaultType: LoanType = initial?.type ?? 'personal';
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors: rawErrors, isSubmitting },
  } = useForm<LoanInput>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      type: defaultType,
      interestType: defaultType === 'credit_card' ? 'revolving' : 'reducing_balance',
      name: initial?.name ?? '',
      lender: initial?.lender ?? '',
      principal: (initial ? paiseToRupees(initial.principal) : '') as never,
      annualRatePct: initial?.annualRatePct ?? ('' as never),
      tenureMonths: initial?.tenureMonths ?? ('' as never),
      startDate: initial?.startDate ?? new Date().toISOString().slice(0, 10),
      notes: initial?.notes ?? '',
      ...(defaultType === 'housing'
        ? { isSelfOccupied: initial?.isSelfOccupied ?? true, coBorrowerShare: initial?.coBorrowerShare }
        : {}),
      ...(defaultType === 'credit_card'
        ? {
            creditLimit: (initial?.creditLimit ? paiseToRupees(initial.creditLimit) : '') as never,
            billingCycleDay: initial?.billingCycleDay ?? 1,
            minPaymentPct: initial?.minPaymentPct ?? 5,
          }
        : {}),
    } as never,
  });

  const type = watch('type');
  const isCard = type === 'credit_card';
  // RHF can't narrow discriminated-union errors at field level; cast for variant-only fields.
  const errors = rawErrors as Record<string, { message?: string } | undefined>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <Field label="Loan type" error={errors.type?.message}>
        <Select {...register('type')} disabled={!!initial}>
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      <input type="hidden" {...register('interestType')} value={isCard ? 'revolving' : 'reducing_balance'} />

      <Field label="Loan name" error={errors.name?.message}>
        <Input {...register('name')} placeholder="e.g. HDFC Home Loan" />
      </Field>

      <Field label="Lender" error={errors.lender?.message}>
        <Input {...register('lender')} placeholder="e.g. HDFC Bank" />
      </Field>

      <Field label={isCard ? 'Outstanding (₹)' : 'Principal (₹)'} error={errors.principal?.message}>
        <Input type="text" inputMode="decimal" {...register('principal')} placeholder="e.g. 500000" />
      </Field>

      <Field label="Annual interest rate (%)" error={errors.annualRatePct?.message}>
        <Input type="number" step="0.01" {...register('annualRatePct')} placeholder="e.g. 8.5" />
      </Field>

      <Field label={isCard ? 'Repayment horizon (months)' : 'Tenure (months)'} error={errors.tenureMonths?.message}>
        <Input type="number" {...register('tenureMonths')} placeholder="e.g. 240" />
      </Field>

      <Field label="Start date" error={errors.startDate?.message}>
        <Input type="date" {...register('startDate')} />
      </Field>

      {type === 'housing' && (
        <>
          <Field label="Self-occupied?">
            <Select {...register('isSelfOccupied', { setValueAs: (v) => v === 'true' })}>
              <option value="true">Yes (₹2L Sec 24(b) cap applies)</option>
              <option value="false">No (let-out)</option>
            </Select>
          </Field>
          <Field label="Co-borrower share (%)" hint="Leave blank if sole borrower">
            <Input type="number" step="0.01" {...register('coBorrowerShare')} placeholder="e.g. 50" />
          </Field>
        </>
      )}

      {isCard && (
        <>
          <Field label="Credit limit (₹)" error={errors.creditLimit?.message}>
            <Input type="text" inputMode="decimal" {...register('creditLimit')} />
          </Field>
          <Field label="Billing cycle day (1–31)" error={errors.billingCycleDay?.message}>
            <Input type="number" min={1} max={31} {...register('billingCycleDay')} />
          </Field>
          <Field label="Min payment (%)" error={errors.minPaymentPct?.message}>
            <Input type="number" step="0.01" {...register('minPaymentPct')} />
          </Field>
        </>
      )}

      <Field label="Notes">
        <Textarea {...register('notes')} rows={3} />
      </Field>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
