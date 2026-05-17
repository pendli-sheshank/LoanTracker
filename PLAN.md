# LoanTracker PWA — Implementation Plan

A Progressive Web App for individuals in India to track personal, credit-card, education, and housing loans. Offline-first, installable, with amortization charts, early-payment suggestions, payment history, and loan analytics.

---

## 1. Goals & Non-Goals

**Goals**
- Track multiple loan types: Personal, Credit Card, Education, Housing.
- Generate amortization schedules (EMI breakdown of principal vs. interest).
- Record and reconcile payment history (scheduled vs. actual).
- Recommend early-payment / prepayment strategies and show interest saved.
- Analyze portfolio: total outstanding, weighted avg. interest, DTI ratio, tax-deductible interest (Sec 24b / 80E / 80C principal).
- Work offline; installable on Android/iOS/desktop.
- All data stored locally on device by default (privacy-first).

**Non-Goals (v1)**
- No bank account integration / statement scraping.
- No multi-user sync (deferred to v2 — **Supabase** when added).
- No actual payment processing.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Vite + React 18 + TypeScript** | Fast HMR, strong typing, mature PWA tooling |
| PWA | **vite-plugin-pwa** (Workbox) | Service worker, manifest, offline cache |
| UI | **Tailwind CSS + shadcn/ui** | Mobile-first, accessible primitives |
| Charts | **Recharts** | Amortization line/area + pie/bar for analytics |
| State | **Zustand** + **TanStack Query** | Lightweight; query layer for IDB |
| Storage | **Dexie.js (IndexedDB)** | Offline, indexed queries, migrations |
| Forms | **React Hook Form + Zod** | Validation for INR/rate/tenure inputs |
| Date/Money | **date-fns**, **dinero.js** (INR, paise precision) | Avoid float errors on EMI |
| Testing | **Vitest** + **React Testing Library** + **Playwright** | Unit + E2E |
| Import parsing | **PDF.js** (text extraction) + **SheetJS (xlsx)** + **PapaParse (csv)** | Parse uploaded amortization documents |
| OCR fallback | **Tesseract.js** (lazy-loaded) | Scanned/image-based PDFs |
| Backend (v2) | **Supabase** (Postgres + Auth + Storage + Realtime + RLS) | Replaces Firebase; cloud sync, multi-device, optional cloud backup of import docs |
| Build/Deploy | Vercel / Netlify / GitHub Pages | Static hosting; HTTPS required for PWA |

---

## 3. Domain Model

```ts
type LoanType = 'personal' | 'credit_card' | 'education' | 'housing';
type InterestType = 'reducing_balance' | 'flat' | 'revolving';
type Frequency = 'monthly' | 'quarterly' | 'yearly';

interface Loan {
  id: string;
  type: LoanType;
  name: string;              // "HDFC Home Loan"
  lender: string;
  principal: number;         // in paise
  annualRatePct: number;     // e.g. 8.65
  interestType: InterestType;
  tenureMonths: number;
  startDate: string;         // ISO
  emiAmount?: number;        // computed or override
  processingFee?: number;
  // Credit-card specific
  creditLimit?: number;
  billingCycleDay?: number;
  minPaymentPct?: number;
  // Housing specific (tax)
  isSelfOccupied?: boolean;
  coBorrowerShare?: number;
  notes?: string;
}

interface Payment {
  id: string;
  loanId: string;
  date: string;
  amount: number;            // paise
  principalPaid: number;
  interestPaid: number;
  type: 'scheduled' | 'prepayment' | 'partial' | 'foreclosure';
  source?: string;           // "UPI/HDFC"
}

interface RateChange { id: string; loanId: string; effectiveDate: string; newRatePct: number; }
interface Settings { currency: 'INR'; financialYearStart: '04-01'; defaultRoundingPaise: true; }
```

---

## 4. Core Calculations

- **EMI (reducing balance):** `EMI = P × r × (1+r)^n / ((1+r)^n - 1)` where `r = annualRate/12/100`, `n = tenureMonths`.
- **Amortization schedule:** iterate month-by-month; for each row emit `{month, openingBal, interest, principal, emi, closingBal}`.
- **Credit-card revolving:** daily interest on average daily balance; handle min-payment trap visualization.
- **Prepayment scenarios:** recompute schedule with (a) tenure-reduction or (b) EMI-reduction; report interest saved and new payoff date.
- **Rate changes:** segment schedule at each effective date, recompute remaining tenure/EMI.
- All money math in **paise (integer)** via dinero.js — no floating-point drift.

**Suggestion engine (rule-based, v1):**
1. If liquid savings > 6×EMI **and** loan rate > FD rate + 1%, suggest part-prepayment.
2. Rank loans by rate; recommend extra payment toward highest-rate loan (avalanche).
3. For housing: warn before exceeding ₹2L Sec 24(b) interest cap (self-occupied).
4. For credit card: flag if min-payment-only — show "X years to clear" projection.
5. Annual bonus prompt: suggest lump-sum scenario.

---

## 5. Feature Breakdown by Screen

| Screen | Purpose |
|---|---|
| **Dashboard** | Total outstanding, next EMI due, monthly cashflow, suggestions feed |
| **Loans list** | Cards per loan with progress bar (% paid), filter by type |
| **Loan detail** | Tabs: Summary · Amortization chart + table · Payments · Prepay simulator · Tax |
| **Add/Edit loan** | Stepper form per loan type (different fields for CC vs housing) |
| **Import schedule** | Upload amortization doc (PDF / XLSX / CSV) → preview → map columns → confirm → creates loan + payments in one shot |
| **Payment log** | Add payment, mark scheduled paid, split principal/interest auto |
| **Analytics** | Portfolio mix pie, interest paid YTD, projected payoff timeline, DTI |
| **Tax** | FY-wise interest & principal split, 80C/80E/24(b) summaries, export CSV |
| **Settings** | Theme, backup/restore JSON, clear data, install prompt |

---

## 6. PWA Specifics

- **Manifest:** name, short_name "Loans", theme color, maskable icons (192/512), `display: standalone`, `start_url: /`.
- **Service worker (Workbox):**
  - Precache app shell.
  - Runtime: `StaleWhileRevalidate` for fonts; `NetworkFirst` for any future API.
  - Background sync placeholder for v2 cloud sync.
- **Install prompt:** custom UI via `beforeinstallprompt`.
- **Notifications (optional v1.1):** local notification N days before EMI due.
- **iOS quirks:** apple-touch-icon, `apple-mobile-web-app-capable`, splash screens.
- **Lighthouse target:** PWA 100, Perf > 90 on Moto G class.

---

## 6a. Amortization Document Import

Users can upload a lender-provided amortization schedule (HDFC/SBI/ICICI/Bajaj statements, generic XLSX/CSV) and have the app auto-create the loan + back-fill all rows.

**Supported inputs**
- `.xlsx` / `.xls` (SheetJS)
- `.csv` / `.tsv` (PapaParse)
- `.pdf` — text-based via PDF.js; scanned/image PDFs fall back to Tesseract.js OCR (lazy-loaded, user-confirmed since it's heavy).
- `.html` (table copy-paste from net-banking)

**Pipeline**
1. **Upload** — drag-drop or file picker; processed in a **Web Worker** so UI stays responsive on long schedules.
2. **Detect format** — sniff extension + MIME; for PDFs, sample first page to decide text vs OCR path.
3. **Extract rows** — for tabular files, read sheets/tables; for PDFs, extract text with positional info and reconstruct rows by Y-coordinate clustering.
4. **Auto-map columns** — fuzzy header matcher recognizes common labels:
   - Month / Installment No / EMI No → `installmentNo`
   - Date / Due Date / Payment Date → `dueDate`
   - EMI / Installment / Payment → `emi`
   - Principal / Principal Component → `principal`
   - Interest / Interest Component → `interest`
   - Opening Balance / Outstanding (start) → `openingBalance`
   - Closing Balance / Outstanding (end) → `closingBalance`
5. **Preview + manual mapping UI** — show first 10 rows in a table; user can re-map columns, set date format (`dd-MM-yyyy` vs `dd/MM/yy`), and pick currency notation (₹/Rs./plain). Detects amounts like `1,23,456.78` (Indian) vs `123,456.78`.
6. **Infer loan metadata** — from the schedule itself:
   - `principal` = first row opening balance.
   - `tenureMonths` = row count.
   - `emiAmount` = mode of EMI column.
   - `annualRatePct` = solved numerically (Newton-Raphson on EMI formula) and cross-checked against per-row interest/principal split.
   - `startDate` = first row's due date.
7. **Validate** — checks: balances reconcile (`opening - principal = closing`), EMI ≈ principal + interest each row, monotonic dates. Surface mismatches inline; allow row edits.
8. **Confirm & commit** — single Dexie transaction creates the `Loan` + `AmortizationRow[]` + optionally seeds historical `Payment` records for past-dated rows (user toggle: "mark past EMIs as paid").
9. **Source preservation** — store original file in IndexedDB (Blob) so the user can re-import / audit later. In v2 with Supabase, also upload to Supabase Storage bucket (per-user, RLS-protected).

**Edge cases handled**
- Multi-sheet workbooks → sheet picker.
- Rate-change rows (some lenders insert a row mid-schedule) → captured as `RateChange` entries.
- Pre-EMI interest rows (housing, under-construction) → separate `preEmiInterest` bucket.
- Foreclosure / moratorium rows → tagged, excluded from EMI mode calc.
- Currency-symbol stripping, negative numbers in parens.

---

## 7. Data, Privacy & Backup

- All data in IndexedDB; nothing leaves device by default.
- **Backup:** Export encrypted JSON (AES-GCM via Web Crypto, user passphrase).
- **Restore:** import + schema-version migrate.
- **Clear data:** wipe IDB + caches.
- Dexie migrations for each schema version bump.
- **v2 (Supabase) — opt-in cloud sync:**
  - Auth: email magic-link or Google OAuth.
  - Schema mirrors local Dexie (loans, payments, amortization_rows, rate_changes, import_docs).
  - **Row Level Security** on every table: `user_id = auth.uid()`.
  - Sync strategy: last-write-wins per row with `updated_at`; conflict log surfaced to user. Realtime channel for multi-device push.
  - Uploaded amortization documents go to a private Supabase Storage bucket; signed URLs only.
  - Local-first remains the default — Supabase is opt-in, togglable in Settings, and the app must remain fully functional offline.

---

## 8. India-Specific Considerations

- ₹ formatting with Indian numbering (lakh/crore) via `Intl.NumberFormat('en-IN')`.
- Financial year **Apr 1 – Mar 31** for tax screens.
- Tax sections wired in: **80C** (housing principal up to ₹1.5L), **24(b)** (housing interest up to ₹2L self-occupied / no cap let-out), **80E** (education-loan interest, no cap, 8-year window), **80EEA** (affordable housing).
- Floating-rate loans (RBI repo-linked) — support rate change history.
- Credit-card statement cycle ≠ calendar month.

---

## 9. Milestones

| Phase | Scope | Est. |
|---|---|---|
| **M0 — Scaffold** | Vite+React+TS, Tailwind, shadcn, Dexie, routing, PWA plugin, CI | 2–3 d |
| **M1 — Core loan CRUD** | Loan model, add/edit/delete, list, INR formatting | 3–4 d |
| **M2 — Amortization** | EMI calc engine, schedule table, Recharts visualization | 3 d |
| **M3 — Payments** | Log payments, reconcile with schedule, history view | 3 d |
| **M3.5 — Doc import** | XLSX/CSV/PDF amortization upload, parser worker, mapping UI, validation, commit | 4–5 d |
| **M4 — Prepayment simulator** | Scenario engine, interest-saved compare chart | 3 d |
| **M5 — Suggestions** | Rule engine + dashboard feed | 2 d |
| **M6 — Analytics & Tax** | Portfolio analytics, FY tax summary, CSV export | 3–4 d |
| **M7 — PWA polish** | Offline test, install UX, icons, splash, Lighthouse pass | 2 d |
| **M8 — Backup/Restore** | Encrypted export/import, migrations | 2 d |
| **M9 — QA + Launch** | E2E tests, real-device testing (Android/iOS), deploy | 3 d |

Total: ~6–7 weeks solo (add ~1 wk for v2 Supabase sync).

**v2 — M10 Supabase sync** (post-launch): schema mirror, auth, RLS policies, sync engine, Storage bucket for import docs, conflict UI. ~5–7 d.

---

## 10. Project Structure

```
src/
  app/                 # routes (Dashboard, Loans, Detail, Analytics, Tax, Settings)
  components/          # UI (charts, forms, cards)
  domain/
    loan/              # types, calculators (emi, amortization, prepay)
    payment/
    tax/               # 80C/24b/80E logic
    suggestions/       # rule engine
    import/            # parsers (xlsx, csv, pdf), column mapper, validators
  db/                  # Dexie schema + migrations + repos
  supabase/            # v2: client, sync engine, RLS-aware queries
  lib/                 # money (dinero), date, format
  workers/             # heavy schedule calc in Web Worker
  pwa/                 # SW registration, install hook
  styles/
tests/
  unit/
  e2e/
public/
  icons/ manifest.webmanifest
```

Move heavy amortization recomputes to a Web Worker to keep UI responsive on long-tenure housing loans.

---

## 11. Open Questions

1. Confirm v2 stack: **Supabase** (Auth + Postgres + Storage) — magic-link or Google OAuth preferred?
2. Multi-currency? (default INR; locking to INR simplifies tax module)
3. Should we ship sample/demo data on first launch?
4. iOS install via Safari only — acceptable, or wrap in TWA/Capacitor later?
5. Notification permission: ask up-front or on first EMI added?

---

## 12. Risks

- **Floating-point money bugs** → mitigated by paise-integer math.
- **iOS PWA limitations** (no push, storage eviction) → document; plan Capacitor fallback if needed.
- **Schedule perf on 30-year housing loans (360 rows)** → Web Worker + virtualized table.
- **Import accuracy** (lender PDFs vary wildly) → always show preview + mapping UI before commit; never auto-commit without user confirmation. Bundle a small library of named "presets" for major Indian lenders (HDFC, SBI, ICICI, Axis, Bajaj) that pre-fill column mappings.
- **OCR cost/perf** (Tesseract.js is ~10 MB) → lazy-load only when user picks a scanned PDF; show size warning.
- **Tax rules change yearly** → keep tax constants in a versioned config file.
