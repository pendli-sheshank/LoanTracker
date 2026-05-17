# STATE.md

Rolling session state. Updated at end of every session and before any context compaction. New sessions should read this file (after CONTEXT.md) to resume cold.

---

lastUpdated: 2026-05-17
phase: M3.5 complete — through full v1 feature set (CRUD, amortization, payments, import). Next is M4/M5 (suggestions, analytics, tax).
currentTask: None — clean working tree
nextStep: Pick from queue — (a) M4 prepayment-suggestions rule engine on Dashboard, (b) M5 analytics/tax screens (portfolio mix, FY tax summary with 80C/24b/80E), (c) M6 settings polish + encrypted backup/restore, (d) bundle code-splitting (recharts + xlsx) to drop main chunk below 500 KB.
turnsSinceCompaction: 0

inFlightFiles:
- (none — all M0–M3.5 work committed)

decisionsThisSession:
- Skipped shadcn/ui in favour of plain Tailwind primitives (Button/Field/Input/Select/Tabs) to keep momentum. Can swap later if desired.
- Skipped Tesseract.js OCR fallback for v1 import — too heavy (10 MB). Can add lazy-load later for scanned PDFs.
- Used dexie-react-hooks `useLiveQuery` for reads instead of TanStack Query — simpler, auto-reactive to writes. TanStack Query reserved for v2 Supabase sync.
- pdf.js code-split via dynamic import — only loaded when user uploads a PDF.
- Newton-Raphson rate solver with first-row interest fallback for ill-conditioned schedules.

openQuestionsForUser:
- Next milestone preference: M4 (suggestions) vs M5 (analytics/tax) vs bundle optimization?
- Supabase auth: magic-link vs Google OAuth? (defer until v2)
- Ship sample/demo data on first launch?
- Lender presets (HDFC/SBI/ICICI/Axis/Bajaj) for one-click column mapping — implement now or wait for real user files?

recentDecisionsLog:
- 2026-05-16 — Swapped Firebase for Supabase per user.
- 2026-05-16 — Added amortization-doc import feature + dedicated milestone M3.5.
- 2026-05-17 — Authored CONTEXT.md, SKILLS.md, STATE.md; established compaction cadence (every 10–15 turns).
- 2026-05-17 — M0 scaffold complete; commit `eaf6a97`.
- 2026-05-17 — M1 loan CRUD complete; Zod discriminated union, Dexie repo, live-reactive list/forms.
- 2026-05-17 — M2 amortization complete; build/summarize/prepay engines + chart/table/simulator + 7 tests.
- 2026-05-17 — M3 payments complete; auto-split interest-first reconciliation against schedule + 4 tests.
- 2026-05-17 — M3.5 doc import complete; XLSX/CSV/PDF parsers, fuzzy column mapping, Newton-Raphson rate inference, 4-step UI, 12 tests.

testCoverage:
- 5 test files, 29 tests passing
- Domain layer: emi (3), money (3), amortization (7), payment-split (4), import (12)

buildArtifacts:
- Main bundle: 1168 KB JS (mostly Recharts + SheetJS)
- PDF chunk (lazy): 442 KB
- Service worker precaches 8 entries (1.6 MB)

knownDeferrals:
- Tesseract.js OCR for scanned PDFs — lazy-load if/when needed
- Web Worker for heavy schedule recomputes (PLAN.md M2 nice-to-have)
- shadcn/ui swap-in
- Code-splitting Recharts + SheetJS to bring main bundle under 500 KB
- Storing computed amortization rows in IDB by default (currently only stored from imports)
- Floating-rate / pre-EMI / foreclosure row handling in imports
