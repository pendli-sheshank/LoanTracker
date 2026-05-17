import { useParams } from 'react-router-dom';

export function LoanDetail() {
  const { id } = useParams();
  return <h2 className="text-2xl font-bold">Loan {id}</h2>;
}
