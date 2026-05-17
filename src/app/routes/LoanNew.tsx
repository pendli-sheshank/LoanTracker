import { useNavigate } from 'react-router-dom';
import { LoanForm } from '@/components/loan/LoanForm';
import { createLoan } from '@/db/repos/loan';
import type { LoanInput } from '@/domain/loan/schema';

export function LoanNew() {
  const navigate = useNavigate();
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Add loan</h2>
      <LoanForm
        submitLabel="Create loan"
        onSubmit={async (data: LoanInput) => {
          const loan = await createLoan(data);
          navigate(`/loans/${loan.id}`);
        }}
      />
    </section>
  );
}
