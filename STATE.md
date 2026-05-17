# STATE.md

Rolling session state. Updated at end of every session and before any context compaction. New sessions should read this file (after CONTEXT.md) to resume cold.

---

lastUpdated: 2026-05-17
phase: Pre-M0 — planning only, no scaffold yet
currentTask: Project bootstrap docs (PLAN.md, CONTEXT.md, SKILLS.md, STATE.md, memory/) — complete
nextStep: Await user go-ahead, then execute M0 — `git init`, scaffold Vite+React+TS+Tailwind+shadcn+Dexie+vite-plugin-pwa, initial commit
turnsSinceCompaction: 0

inFlightFiles:
- (none — no code yet)

decisionsThisSession:
- Stack v2 cloud = Supabase (not Firebase). Reflected in PLAN.md §2 / §7 and CONTEXT.md §3.
- Added M3.5 — Amortization document import (XLSX/CSV/PDF + OCR fallback). PLAN.md §6a.
- Operational skills + persistent state model defined. SKILLS.md, STATE.md, memory/.

openQuestionsForUser:
- Approve scaffold and let me start M0?
- Supabase auth: magic-link vs Google OAuth? (can defer until v2)
- Ship sample/demo data on first launch?
- iOS: stay PWA-only or plan Capacitor wrap later?

recentDecisionsLog:
- 2026-05-16 — Swapped Firebase for Supabase per user.
- 2026-05-16 — Added amortization-doc import feature + dedicated milestone.
- 2026-05-17 — Authored CONTEXT.md, SKILLS.md, STATE.md; established compaction cadence (every 10–15 turns).
