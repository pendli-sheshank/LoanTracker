import { z } from 'zod';
import { rupeesToPaise } from '@/lib/money';

const positiveRupees = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'string' ? Number(v.replace(/[₹,\s]/g, '')) : v))
  .refine((n) => Number.isFinite(n) && n > 0, 'Must be a positive amount')
  .transform((n) => rupeesToPaise(n));

export const paymentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  amount: positiveRupees,
  type: z.enum(['scheduled', 'prepayment', 'partial', 'foreclosure']).default('scheduled'),
  source: z.string().max(60).optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
