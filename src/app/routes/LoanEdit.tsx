import { useNavigate, useParams } from 'react-router-dom';
import { LoanForm } from '@/components/loan/LoanForm';
import { updateLoan } from '@/db/repos/loan';
import { useLoan } from '@/hooks/useLoans';

export function LoanEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loan = useLoan(id);

  if (!id) return null;
  if (loan === undefined) return <p>Loading…</p>;
  if (loan === null) return <p>Loan not found</p>;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Edit loan</h2>
      <LoanForm
        initial={loan}
        submitLabel="Save changes"
        onSubmit={async (data) => {
          await updateLoan(id, data);
          navigate(`/loans/${id}`);
        }}
      />
    </section>
  );
}
