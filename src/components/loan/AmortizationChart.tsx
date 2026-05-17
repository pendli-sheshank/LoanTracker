import { Area, AreaChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AmortizationRow } from '@/domain/loan/types';
import { paiseToRupees } from '@/lib/money';

const inrCompact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

export function AmortizationChart({ rows }: { rows: AmortizationRow[] }) {
  const data = rows.map((r) => ({
    month: r.installmentNo,
    principal: paiseToRupees(r.principal),
    interest: paiseToRupees(r.interest),
    balance: paiseToRupees(r.closingBalance),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${inrCompact.format(v)}`} />
          <Tooltip
            formatter={(value: number, name) => [`₹${new Intl.NumberFormat('en-IN').format(Math.round(value))}`, name]}
            labelFormatter={(m) => `Month ${m}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="principal" stackId="1" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.5} />
          <Area type="monotone" dataKey="interest" stackId="1" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.5} />
          <Line type="monotone" dataKey="balance" stroke="#10b981" dot={false} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
