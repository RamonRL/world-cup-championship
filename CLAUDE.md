# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Quiniela del Mundial 2026 — a private World Cup prediction game for a friend group. Users make predictions across six categories; the scoring engine awards points as real match results come in.

## Commands

```bash
pnpm dev          # dev server with Turbopack
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint
pnpm test         # Vitest (scoring engine unit tests)
pnpm test:watch   # Vitest in watch mode

# Database
pnpm db:push      # apply schema directly (dev — no migration file)
pnpm db:generate  # generate SQL migration from schema.ts changes
pnpm db:migrate   # apply pending migrations (prod)
pnpm db:studio    # Drizzle Studio GUI
pnpm db:seed      # seed scoring rules + 12 groups + default special predictions
pnpm db:seed-fixtures    # seed match schedule
pnpm db:seed-tournament  # seed tournament structure
pnpm db:seed-squads      # seed player squads
```

Run a single test file:
```bash
pnpm test -- lib/scoring/__tests__/match.test.ts
```

## Architecture

### Route structure

The app uses three Next.js route groups:

- `app/(app)/` — authenticated user-facing pages (requires `requireUser()`). Layout includes sidebar, bottom-nav, and deadline banner.
- `app/(auth)/` — login page and logout route (Supabase magic link / OTP).
- `app/admin/` — admin-only pages (requires `requireAdmin()`). Separate sidebar.
- `app/auth/callback/` — Supabase OAuth callback route.

### Auth & roles

Auth is Supabase-based. Two server-side guard functions in `lib/auth/guards.ts`:
- `getCurrentUser()` — returns the current user or null; auto-creates the `profiles` row on first login and promotes/demotes the role based on the `ADMIN_EMAILS` env var.
- `requireUser()` — redirects to `/login` if unauthenticated or banned.
- `requireAdmin()` — calls `requireUser()` then redirects to `/dashboard?error=forbidden` if not admin.

Admin role is determined entirely by the `ADMIN_EMAILS` comma-separated env var, not by a manual DB flag. The DB `role` column is kept in sync on every login.

### Database

Single source of truth: `lib/db/schema.ts` (Drizzle schema → Postgres via Supabase).

Key tables:
- `profiles` — user identity and role
- `teams`, `groups`, `players`, `matchdays`, `matches`, `match_scorers`, `group_standings` — tournament data
- `pred_group_ranking`, `pred_bracket_slot`, `pred_tournament_top_scorer`, `pred_match_result`, `pred_match_scorer`, `pred_special` — prediction tables (one per category)
- `points_ledger` — append-style ledger with a unique constraint on `(userId, source, sourceKey)` that enables idempotent scoring
- `scoring_rules` — configurable points values (admin-editable at `/admin/reglas`)
- `special_predictions` — dynamic admin-defined questions
- `chat_messages`, `audit_log`

DB client is in `lib/db/index.ts`: a single `postgres` client cached on `globalThis` (survives Lambda warm re-use), wrapped by Drizzle with `casing: "snake_case"`.

Two connection strings are required: `DATABASE_URL` (transaction pooler, used at runtime) and `DATABASE_DIRECT_URL` (session pooler, used for migrations by Drizzle Kit).

### Scoring engine

All scoring logic lives in `lib/scoring/` as **pure functions** with no DB access, making them fully unit-tested (32 tests in `lib/scoring/__tests__/`):

- `match.ts` — score match result and per-match scorer predictions
- `group.ts` — score group ranking predictions
- `bracket.ts` — score bracket slot predictions per knockout stage
- `top-scorer.ts` — score tournament top-scorer prediction
- `special.ts` — score special predictions (dynamic type dispatch)
- `tiebreaker.ts` — ranking tiebreaker logic
- `defaults.ts` — `DEFAULT_SCORING_RULES` (source of truth for initial seeding)

**Persistence layer** (`lib/scoring/persistence.ts`): `recompute*ForAllUsers()` functions load the current rules, fetch all relevant predictions, call the pure scorers, then write to `points_ledger` using a delete-then-insert pattern scoped to stable `sourceKey` strings. These are called by admin Server Actions after entering results.

`recomputeAllScoring()` reruns every category — triggered when an admin edits scoring rules.

### Prediction visibility & deadlines

- `lib/visibility.ts` — `isPredictionPublic()` determines when another user's prediction becomes visible (after the relevant match/round starts). `isPredictionOpen()` checks the edit deadline.
- `lib/matchday-state.ts` — each matchday has a state (`waiting` | `open` | `closed`). A matchday is `waiting` until its predecessor stage finishes, `open` until its deadline, then `closed`.
- `lib/bracket-state.ts` — the bracket is `waiting` until group standings are recorded, `open` until the first R32 match, then `closed`.
- `lib/deadlines.ts` — `loadDeadlineSummary()` runs on every navigation (called from the `(app)` layout) to power the deadline banner and pending-predictions badge. Uses two aggregate queries to avoid N+1.

### Realtime

`components/realtime/realtime-refresher.tsx` — a client component that subscribes to Supabase Realtime Postgres change events and calls `router.refresh()`. Drop it into any server component to make a page live without custom diffing. Tables published for realtime: `chat_messages`, `matches`, `match_scorers` (configured in `supabase/setup.sql`).

### Images & flags

Team flags use HatScripts circle-flags CDN via FIFA 3-letter codes (`lib/flags.ts`). The `flag_url` DB column is not used on the frontend; `<TeamFlag code="MEX" />` is the canonical way to render a flag. The code-to-slug map must be updated when new teams are added.

Admin image uploads (flags, player photos, avatars) go through `lib/storage.ts` → Supabase Storage. Three public buckets: `flags`, `players`, `avatars`.

### Server Actions pattern

Each page directory that mutates data has an `actions.ts` file with `"use server"` functions. These call `requireUser()` or `requireAdmin()`, do the DB work, call the relevant `recompute*` function, and return a typed result. Client form components call them directly via `react-hook-form` + `onSubmit`.

### Path alias

`@/` resolves to the repository root (configured in `tsconfig.json` and `vitest.config.ts`).

## Key conventions

- **Schema changes**: edit `lib/db/schema.ts`, then run `pnpm db:generate` to create a migration, or `pnpm db:push` during rapid local iteration.
- **New scoring rules**: add the key and default value to `DEFAULT_SCORING_RULES` in `lib/scoring/defaults.ts`, add the corresponding pure function and test, then wire up the persistence call in `lib/scoring/persistence.ts`.
- **New special prediction types**: extend the `specialPredictionType` enum in the schema, add a branch in `lib/scoring/special.ts`, and update the dynamic form renderer in `app/(app)/predicciones/especiales/specials-form.tsx`.
- **Admin actions**: always call `requireAdmin()` at the top; write an entry to `audit_log` via `lib/admin/audit.ts`.
- **RLS**: all Drizzle queries run via the `DATABASE_URL` (postgres role), which bypasses RLS. RLS in `supabase/setup.sql` is defense-in-depth for direct DB access and required for Realtime subscriptions.
- **Supabase clients**: use `createSupabaseServerClient()` (Server Components / Actions / Route Handlers), `createSupabaseServiceClient()` (admin operations that need service-role), or `createSupabaseBrowserClient()` (Client Components).
