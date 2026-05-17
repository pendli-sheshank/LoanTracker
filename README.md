# LoanTracker

Progressive Web App for tracking personal, credit-card, education, and housing loans in India. Offline-first, installable, privacy-first (IndexedDB). Cloud sync via Supabase in v2.

## Docs

- [PLAN.md](PLAN.md) — full implementation plan
- [CONTEXT.md](CONTEXT.md) — locked-in decisions and invariants
- [SKILLS.md](SKILLS.md) — operational playbooks
- [STATE.md](STATE.md) — rolling session state

## Dev

```sh
npm install
npm run dev        # start dev server
npm run build      # production build
npm run typecheck
npm test
```

## Stack

Vite · React 18 · TypeScript · Tailwind · Dexie · Recharts · React Hook Form + Zod · dinero.js (paise-integer money) · vite-plugin-pwa.
