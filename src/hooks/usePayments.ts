import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Payment } from '@/db/schema';

export function usePayments(loanId: string | undefined): Payment[] | undefined {
  return useLiveQuery<Payment[]>(
    async () =>
      loanId ? db.payments.where('loanId').equals(loanId).reverse().sortBy('date') : [],
    [loanId],
  );
}
