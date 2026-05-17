# STATE.md

Rolling session state. Updated at end of every session and before any context compaction. New sessions should read this file (after CONTEXT.md) to resume cold.

---

lastUpdated: 2026-05-17
phase: M0 complete — moving to M1 (core loan CRUD)
currentTask: None — M0 scaffold done, committed as `eaf6a97`
nextStep: Begin M1 — implement loan CRUD: Zod schemas per loan type, RHF form (stepper for housing/credit-card), Dexie repo + TanStack Query hooks, Loans list with progress bar, INR formatting at edge
turnsSinceCompaction: 0

inFlightFiles:
- (none — clean working tree)

decisionsThisSession:
- M0 stack locked in: Vite 5 + React 18 + TS strict + Tailwind + Dexie + vite-plugin-pwa.
- Path alias `@/*` → `src/*` configured in tsconfig + vite.
- Vitest with `fake-indexeddb` + jsdom; setup file at `tests/setup.ts`.
- EMI formula committed and verified against HDFC sample (₹10L @ 8.5% / 20y → ₹8,678/mo).
- `*.tsbuildinfo` gitignored.

openQuestionsForUser:
- Approve M1 scope, or pivot to M3.5 (doc import) first? Import is the highest-value differentiator and lets users skip manual data entry from day one.
- Supabase auth: magic-link vs Google OAuth? (defer until v2)
- Ship sample/demo data on first launch?
- iOS: stay PWA-only or plan Capacitor wrap later?

recentDecisionsLog:
- 2026-05-16 — Swapped Firebase for Supabase per user.
- 2026-05-16 — Added amortization-doc import feature + dedicated milestone M3.5.
- 2026-05-17 — Authored CONTEXT.md, SKILLS.md, STATE.md; established compaction cadence (every 10–15 turns).
- 2026-05-17 — M0 scaffold complete; typecheck, 3/3 tests, and production PWA build all green; initial commit `eaf6a97`.

buildArtifacts:
- dist/index.html, dist/sw.js, dist/manifest.webmanifest — 206 KiB precache, 7 entries
- Bundle: 197.69 kB JS (gzip 63.56 kB), 6.75 kB CSS (gzip 1.92 kB)
