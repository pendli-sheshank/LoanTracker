# SKILLS.md

Operational playbooks for the LoanTracker project. When a session matches one of these scenarios, follow the playbook rather than improvising.

---

## Skill 1 — Bug Fixing

**Trigger:** user reports incorrect behavior, a crash, a failing test, or "X is wrong."

**Playbook**
1. **Reproduce first.** Get exact inputs, expected vs actual, environment (device, browser, online/offline). If you cannot reproduce, say so and ask for repro steps — do not guess-fix.
2. **Locate, do not assume.** Grep for the symptom (error string, label, function name). Read the surrounding code before forming a hypothesis.
3. **Find root cause, not just the symptom.** Ask "why does this happen?" at least twice. A try/catch that swallows the error is rarely the right fix.
4. **Money & date sanity check.** If the bug touches calculations, confirm:
   - All math is in integer paise (no `Number` arithmetic on rupees).
   - Dates use ISO strings and `date-fns` — no `new Date(string)` parsing of `dd/MM/yyyy`.
   - Timezone is not shifting due dates.
5. **Write a failing test before the fix.** Unit test for logic bugs, Playwright for UI regressions. Commit test + fix together so the regression is gated.
6. **Check blast radius.** Grep for other callers of the changed function. A reducing-balance bug likely affects amortization, prepay simulator, *and* import validation.
7. **Verify offline.** If the bug touched anything network-adjacent, test with DevTools offline mode.
8. **Update STATE.md.** Note the fix briefly. If the root cause was non-obvious, save a `feedback` memory so the same trap is avoided later.

**Do not**
- Add `try/catch` that hides the error.
- Bump a dependency to "see if it fixes it."
- Fix the symptom in the UI when the bug is in the domain layer.

---

## Skill 2 — Testing

**Trigger:** new feature merged, refactor, "add tests for X," pre-release QA.

**Layers**
- **Unit (Vitest):** pure functions in `src/domain/**` — EMI calc, amortization, prepay simulator, suggestion rules, tax calcs, import parsers, column mapper. Aim for high coverage here; this is where bugs cost the most.
- **Component (RTL):** forms (loan create, mapping UI), critical screens (Dashboard, Loan Detail).
- **E2E (Playwright):** golden paths — add loan, log payment, run prepay scenario, import XLSX schedule end-to-end, install PWA, offline mode.

**Required test cases — non-negotiable**
- EMI formula: cross-check against published lender schedules (HDFC sample, SBI sample) row-by-row.
- Amortization: opening − principal = closing, every row.
- Prepay: total interest after prepay < total interest without prepay.
- Import: each supported format has a fixture file in `tests/fixtures/` and a parse-and-validate test.
- Tax: 24(b) cap at ₹2L self-occupied; 80E unlimited; 80C ₹1.5L shared.
- Indian number parsing: `1,23,456.78` parses to `12345678` paise.
- Floating-rate segmentation: rate change at month N → row N+1 uses new rate.

**Workflow**
1. Run `npm test` before any commit touching `src/domain/**`.
2. Before declaring a task done, run unit + E2E suites. Report pass/fail counts.
3. For UI claims, **actually open the dev server and click through** — type-checking is not feature-checking.
4. New fixture files for import tests: store original (sanitized) bank statements when permissible, otherwise synthesized look-alikes.

**Do not**
- Mock the IndexedDB layer in domain unit tests — use `fake-indexeddb`.
- Mark a feature done because tests pass on happy path — explicitly test error paths.

---

## Skill 3 — Context-Window Reduction (every 10–15 chats)

**Trigger:** every 10–15 chat turns within a session, OR when the conversation feels noisy, OR before a long task that will need fresh headroom.

**Why:** long sessions accumulate read file contents, tool outputs, and exploratory dead-ends that crowd out the signal. Compacting keeps the assistant sharp and reduces cost.

**Playbook**
1. **Count.** Track turns since last compaction in STATE.md (`turnsSinceCompaction`). When it hits 10, begin watching for a natural break; by 15, compact regardless.
2. **Snapshot what matters.** Before compacting, write to STATE.md:
   - Current task (one line) and the immediate next step.
   - Any decisions made this session that aren't in PLAN.md or CONTEXT.md yet.
   - Files actively being edited (paths only, not contents).
   - Open questions awaiting user input.
3. **Promote durable learnings to memory.** Anything that should outlive this session — user preferences, surprising gotchas, non-obvious project facts — write into the `memory/` system per the auto-memory protocol in the system prompt.
4. **Promote stable decisions to CONTEXT.md / PLAN.md.** If a decision is now locked in, move it from chat into the right doc so future sessions don't have to re-derive it.
5. **Compact.** Use `/compact` (or `/clear` followed by re-bootstrapping from CONTEXT.md + STATE.md if a full reset is wanted).
6. **Reset the counter.** Set `turnsSinceCompaction: 0` in STATE.md.

**Heuristics for what to evict first**
- Raw file reads of files already summarized.
- Failed tool-call output and its retries.
- Exploratory greps that led nowhere.
- Long planning discussions whose conclusion is now in PLAN.md.

**Keep**
- The current task and its acceptance criteria.
- Recent user feedback / corrections.
- The latest version of files being actively edited.

**Do not**
- Compact mid-edit (finish the current change first).
- Compact without first updating STATE.md and memory — otherwise context is lost, not compacted.

---

## Skill 4 — Persistent State Save (run before every session end / compaction)

**Trigger:** end of session, before `/compact`, before `/clear`, or any time a meaningful decision or task transition happens.

**Playbook**
1. **Update STATE.md** with:
   - `lastUpdated` (ISO date).
   - `phase` (e.g. "M2 — Amortization").
   - `currentTask` (one sentence).
   - `nextStep` (one sentence the next session can act on cold).
   - `inFlightFiles` (paths only).
   - `decisionsThisSession` (bullets — moved to CONTEXT.md/PLAN.md once stable).
   - `openQuestionsForUser` (bullets).
   - `turnsSinceCompaction` (integer).
2. **Update memory/** for anything that should survive across all future sessions (user preferences, validated approaches, non-obvious project facts). Follow the auto-memory protocol — file per memory + entry in `MEMORY.md`.
3. **Update CONTEXT.md** only when a locked-in decision changes (rare).
4. **Update PLAN.md** when scope, milestones, or architecture shifts.

**Restoration on next session:** new session reads CONTEXT.md → STATE.md → memory/MEMORY.md and resumes from `nextStep` with zero re-explanation needed.

---

## Skill priority when multiple apply

1. Bug fixing in progress → finish it before compaction.
2. State save → always before compaction.
3. Compaction → at the scheduled cadence.
4. Testing → after any feature/bug change, before declaring done.
