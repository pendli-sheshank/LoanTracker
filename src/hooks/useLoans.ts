import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import type { Loan } from '@/domain/loan/types';

export function useLoans(): Loan[] | undefined {
  return useLiveQuery<Loan[]>(() => db.loans.toArray());
}

export function useLoan(id: string | undefined): Loan | undefined {
  return useLiveQuery<Loan | undefined>(async () => (id ? await db.loans.get(id) : undefined), [id]);
}
