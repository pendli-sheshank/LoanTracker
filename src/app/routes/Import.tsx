import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseFile } from '@/domain/import/parse';
import { autoMapColumns } from '@/domain/import/columnMapper';
import { mapRows } from '@/domain/import/mapRows';
import { validateRows } from '@/domain/import/validator';
import { inferMeta } from '@/domain/import/inferMeta';
import { commitImport } from '@/domain/import/commit';
import type { CanonicalField, ColumnMapping, InferredLoanMeta, MappedRow, ParsedTable, ValidationResult } from '@/domain/import/types';
import type { LoanType } from '@/domain/loan/types';
import { Field, Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/money';

type Step = 'upload' | 'map' | 'preview' | 'confirm';

const canonicalFields: { key: CanonicalField; label: string; required: boolean }[] = [
  { key: 'installmentNo', label: 'Installment #', required: true },
  { key: 'dueDate', label: 'Due date', required: true },
  { key: 'emi', label: 'EMI', required: false },
  { key: 'principal', label: 'Principal', required: true },
  { key: 'interest', label: 'Interest', required: true },
  { key: 'openingBalance', label: 'Opening balance', required: true },
  { key: 'closingBalance', label: 'Closing balance', required: false },
];

export function Import() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [tables, setTables] = useState<ParsedTable[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [mapped, setMapped] = useState<MappedRow[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [meta, setMeta] = useState<InferredLoanMeta | null>(null);
  const [loanType, setLoanType] = useState<LoanType>('housing');
  const [loanName, setLoanName] = useState('Imported loan');
  const [lender, setLender] = useState('');
  const [seedPaid, setSeedPaid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activeTable = tables[activeSheet];

  async function onFile(f: File) {
    setError(null);
    setBusy(true);
    setFile(f);
    try {
      const parsed = await parseFile(f);
      setTables(parsed);
      setActiveSheet(0);
      const first = parsed[0];
      if (first) {
        const auto = autoMapColumns(first.headers);
        setMapping(auto);
        setStep('map');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function applyMapping() {
    if (!activeTable) return;
    const rows = mapRows(activeTable, mapping);
    const v = validateRows(rows);
    const m = inferMeta(rows);
    setMapped(rows);
    setValidation(v);
    setMeta(m);
    setStep('preview');
  }

  async function commit() {
    if (!meta || !file) return;
    setBusy(true);
    try {
      const loan = await commitImport({
        meta,
        rows: mapped,
        loanName,
        lender: lender || 'Unknown',
        loanType,
        seedPastAsPaid: seedPaid,
        originalFile: { name: file.name, mimeType: file.type, blob: file },
      });
      navigate(`/loans/${loan.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Import amortization schedule</h2>
      <ol className="flex gap-2 text-xs text-slate-500">
        {(['upload', 'map', 'preview', 'confirm'] as Step[]).map((s, i) => (
          <li key={s} className={s === step ? 'text-brand-accent font-semibold' : ''}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      {error && <div className="rounded bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 p-3 text-sm">{error}</div>}

      {step === 'upload' && (
        <div className="rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <p className="text-sm text-slate-500 mb-3">
            Upload an XLSX, CSV, or PDF amortization schedule from your lender (HDFC, SBI, ICICI, etc.).
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.pdf"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          {busy && <p className="text-xs text-slate-500 mt-2">Parsing…</p>}
        </div>
      )}

      {step === 'map' && activeTable && (
        <div className="space-y-3">
          {tables.length > 1 && (
            <Field label="Sheet">
              <Select value={activeSheet} onChange={(e) => {
                const i = Number(e.target.value);
                setActiveSheet(i);
                const t = tables[i];
                if (t) setMapping(autoMapColumns(t.headers));
              }}>
                {tables.map((t, i) => <option key={i} value={i}>{t.sheetName ?? `Sheet ${i + 1}`}</option>)}
              </Select>
            </Field>
          )}

          <p className="text-sm text-slate-500">
            Detected {activeTable.rows.length} rows. Map columns below (auto-detected where possible).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {canonicalFields.map((f) => (
              <Field key={f.key} label={`${f.label}${f.required ? ' *' : ''}`}>
                <Select
                  value={mapping[f.key] ?? ''}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [f.key]: e.target.value || undefined }))
                  }
                >
                  <option value="">— skip —</option>
                  {activeTable.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </Select>
              </Field>
            ))}
          </div>

          <Button onClick={applyMapping}>Preview rows</Button>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          {meta && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Principal" value={formatINR(meta.principalPaise)} />
              <Stat label="EMI" value={formatINR(meta.emiPaise)} />
              <Stat label="Tenure" value={`${meta.tenureMonths} mo`} />
              <Stat label="Inferred rate" value={`${meta.annualRatePct.toFixed(2)}%`} />
            </div>
          )}

          {validation && validation.issues.length > 0 && (
            <div className="rounded bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 p-3 text-sm space-y-1">
              <div className="font-semibold">{validation.issues.length} issue{validation.issues.length === 1 ? '' : 's'} found:</div>
              <ul className="list-disc ml-5">
                {validation.issues.slice(0, 8).map((i, idx) => (
                  <li key={idx}>
                    Row {i.rowIndex + 1} ({i.field}): {i.message}
                  </li>
                ))}
                {validation.issues.length > 8 && <li>…and {validation.issues.length - 8} more</li>}
              </ul>
            </div>
          )}

          <div className="overflow-auto max-h-80 rounded border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Due</th>
                  <th className="p-2 text-right">EMI</th>
                  <th className="p-2 text-right">Principal</th>
                  <th className="p-2 text-right">Interest</th>
                  <th className="p-2 text-right">Closing</th>
                </tr>
              </thead>
              <tbody>
                {mapped.slice(0, 30).map((r, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-2">{r.installmentNo ?? '—'}</td>
                    <td className="p-2">{r.dueDate ?? '—'}</td>
                    <td className="p-2 text-right">{r.emi ? formatINR(r.emi) : '—'}</td>
                    <td className="p-2 text-right">{r.principal ? formatINR(r.principal) : '—'}</td>
                    <td className="p-2 text-right">{r.interest ? formatINR(r.interest) : '—'}</td>
                    <td className="p-2 text-right">{r.closingBalance ? formatINR(r.closingBalance) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mapped.length > 30 && (
              <div className="p-2 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
                Showing first 30 of {mapped.length} rows.
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep('map')}>Back to mapping</Button>
            <Button onClick={() => setStep('confirm')} disabled={!meta}>Continue</Button>
          </div>
        </div>
      )}

      {step === 'confirm' && meta && (
        <div className="space-y-4 max-w-xl">
          <Field label="Loan name"><Input value={loanName} onChange={(e) => setLoanName(e.target.value)} /></Field>
          <Field label="Lender"><Input value={lender} onChange={(e) => setLender(e.target.value)} placeholder="e.g. HDFC Bank" /></Field>
          <Field label="Loan type">
            <Select value={loanType} onChange={(e) => setLoanType(e.target.value as LoanType)}>
              <option value="housing">Housing</option>
              <option value="personal">Personal</option>
              <option value="education">Education</option>
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={seedPaid} onChange={(e) => setSeedPaid(e.target.checked)} />
            Mark past-dated installments as already paid
          </label>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep('preview')}>Back</Button>
            <Button onClick={commit} disabled={busy}>{busy ? 'Importing…' : 'Create loan'}</Button>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
