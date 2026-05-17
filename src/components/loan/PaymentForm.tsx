import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentSchema, type PaymentInput } from '@/domain/payment/schema';
import { Field, Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export function PaymentForm({ onSubmit }: { onSubmit: (data: PaymentInput) => Promise<void> | void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      type: 'scheduled',
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        await onSubmit(data);
        reset({ date: new Date().toISOString().slice(0, 10), type: 'scheduled' });
      })}
      className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
    >
      <Field label="Date" error={errors.date?.message}>
        <Input type="date" {...register('date')} />
      </Field>
      <Field label="Amount (₹)" error={errors.amount?.message}>
        <Input type="text" inputMode="decimal" {...register('amount')} placeholder="e.g. 8678" />
      </Field>
      <Field label="Type">
        <Select {...register('type')}>
          <option value="scheduled">Scheduled EMI</option>
          <option value="prepayment">Prepayment</option>
          <option value="partial">Partial</option>
          <option value="foreclosure">Foreclosure</option>
        </Select>
      </Field>
      <Button type="submit" disabled={isSubmitting}>
        Add payment
      </Button>
    </form>
  );
}
