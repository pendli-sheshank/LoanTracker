import { z } from 'zod';
import { rupeesToPaise } from '@/lib/money';

const positiveRupees = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'string' ? Number(v.replace(/[₹,\s]/g, '')) : v))
  .refine((n) => Number.isFinite(n) && n > 0, 'Must be a positive amount')
  .transform((n) => rupeesToPaise(n));

const ratePct = z.coerce.number().min(0).max(100);
const tenure = z.coerce.number().int().positive().max(600);

const baseLoan = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name required').max(80),
  lender: z.string().min(1, 'Lender required').max(80),
  principal: positiveRupees,
  annualRatePct: ratePct,
  tenureMonths: tenure,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  notes: z.string().max(500).optional(),
});

export const personalLoanSchema = baseLoan.extend({
  type: z.literal('personal'),
  interestType: z.literal('reducing_balance'),
});

export const educationLoanSchema = baseLoan.extend({
  type: z.literal('education'),
  interestType: z.literal('reducing_balance'),
});

export const housingLoanSchema = baseLoan.extend({
  type: z.literal('housing'),
  interestType: z.literal('reducing_balance'),
  isSelfOccupied: z.boolean().default(true),
  coBorrowerShare: z.coerce.number().min(0).max(100).optional(),
});

export const creditCardLoanSchema = baseLoan.extend({
  type: z.literal('credit_card'),
  interestType: z.literal('revolving'),
  creditLimit: positiveRupees,
  billingCycleDay: z.coerce.number().int().min(1).max(31),
  minPaymentPct: z.coerce.number().min(0).max(100).default(5),
});

export const loanSchema = z.discriminatedUnion('type', [
  personalLoanSchema,
  educationLoanSchema,
  housingLoanSchema,
  creditCardLoanSchema,
]);

export type LoanInput = z.infer<typeof loanSchema>;
