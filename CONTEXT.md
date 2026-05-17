# CONTEXT.md

Persistent project context for the LoanTracker PWA. Load this at the start of every session so the assistant has a shared mental model without re-deriving it from scratch.

---

## 1. What this project is

A **Progressive Web App** for individuals in India to track loans (personal, credit card, education, housing). Offline-first, installable, privacy-first (local IndexedDB), with an opt-in Supabase sync layer in v2.

**Authoritative plan:** [PLAN.md](PLAN.md). If anything below conflicts with PLAN.md, PLAN.md wins.

---

## 2. Current state

- **Phase:** Pre-M0 (planning complete, scaffold not started).
- **Repository:** Not yet a git repo. `git init` is the first action of M0.
- **Working directory:** `H:\Projects\LoanTracker`.
- **Files present:** `PLAN.md`, `CONTEXT.md`, `SKILLS.md`, `STATE.md`, `memory/` index.
- **No code yet.**

---

## 3. Locked-in decisions

| Area | Decision | Source |
|---|---|---|
| Framework | Vite + React 18 + TypeScript | PLAN §2 |
| Styling | Tailwind + shadcn/ui | PLAN §2 |
| Storage (v1) | Dexie / IndexedDB | PLAN §2 |
| Money math | Integer paise via dinero.js — **never floats** | PLAN §4 |
| Charts | Recharts | PLAN §2 |
| Forms | React Hook Form + Zod | PLAN §2 |
| Cloud (v2) | **Supabase** (Auth + Postgres + Storage + RLS) — not Firebase | PLAN §2, §7 |
| Heavy compute | Web Workers (amortization, import parsing) | PLAN §10, §6a |
| Locale | `en-IN`, ₹, FY = Apr 1 – Mar 31 | PLAN §8 |
| Import formats | XLSX, CSV, PDF (text + Tesseract OCR fallback) | PLAN §6a |

---

## 4. Domain glossary

- **EMI** — Equated Monthly Installment; computed via reducing-balance formula.
- **Amortization row** — `{installmentNo, dueDate, emi, principal, interest, openingBalance, closingBalance}`.
- **Prepayment** — Extra payment toward principal; two modes: tenure-reduction, EMI-reduction.
- **Pre-EMI interest** — Interest-only payments during under-construction housing loan period.
- **Sec 24(b)** — Housing-loan interest deduction (₹2L cap self-occupied).
- **Sec 80C** — Housing principal deduction (₹1.5L cap, shared with other 80C items).
- **Sec 80E** — Education-loan interest deduction (no cap, 8-year window).
- **Avalanche** — Pay highest-interest debt first.
- **Floating rate** — Rate that changes with RBI repo; tracked via `RateChange` records.

---

## 5. Constraints & invariants

- All monetary values stored as **integer paise**. Display formats to ₹ at the edge.
- Dates stored as **ISO strings** (`YYYY-MM-DD`).
- Every Dexie schema change requires a numbered migration — never mutate existing version.
- Any new feature must keep the app **fully usable offline**.
- Original uploaded import documents are **preserved** (Blob in IDB) — never discard after parsing.
- Never auto-commit imported data — always show preview + mapping UI first.
- Tax constants live in a **versioned config file** (`src/domain/tax/constants.ts`), keyed by FY.

---

## 6. Known open questions (not blocking)

See PLAN.md §11. Headline items:
1. Supabase auth mechanism (magic-link vs OAuth) — defer until v2 starts.
2. Demo data on first launch?
3. iOS: stay PWA-only or wrap with Capacitor later?

---

## 7. How sessions should bootstrap

1. Read this file (CONTEXT.md).
2. Read [STATE.md](STATE.md) for the latest in-flight task and last decisions.
3. Skim [MEMORY.md](memory/MEMORY.md) for any saved feedback/preferences.
4. Only then begin work.

Update STATE.md and memory/ at the end of each session — see SKILLS.md.
