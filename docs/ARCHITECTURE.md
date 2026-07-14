# Architecture

This document explains how the codebase is organized and why, so future
work lands in the right place instead of accumulating in generic folders.

## High-level layout

```text
src/
├── app/            Routes only (App Router). No business logic.
├── components/     Shared, feature-agnostic UI.
├── features/       Feature-based modules — the bulk of app-specific code.
├── lib/            Framework/infrastructure code: Supabase, offline, PWA,
│                   validation primitives, dates, calculations, low-level
│                   utils.
├── hooks/          Small, cross-cutting hooks used by more than one feature.
├── contexts/       The three app-wide React contexts (see "State
│                   boundaries" below) — nothing else.
├── services/       Cross-feature services (currently: Supabase Realtime).
├── types/          Centralized domain types (`domain.ts`).
├── constants/      Domain/business constants (schedule, split, navigation,
│                   sync states).
├── config/         App-wide metadata (name, description).
└── middleware.ts   (superseded by `proxy.ts`, see below)
```

## Route groups

- `(auth)` — login / register / forgot-password. Wrapped in `AuthShell`.
- `(onboarding)` — first-run flow: create or join a group. Also wrapped in
  `AuthShell`.
- `(dashboard)` — everything behind authentication. Wrapped in `AppShell`
  (sidebar on desktop, bottom nav on mobile).
- `app/auth/callback` — a real (non-grouped) route: the Supabase
  email/OAuth redirect target. Deliberately outside `(auth)` since it's a
  route handler, not a page.
- `app/api/*` — route handlers (`health`, `sync`).

Route groups never contain business logic — each `page.tsx` is a thin shell
that composes components from `features/*`.

## `proxy.ts` vs `middleware.ts`

Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts` (same
job — intercept requests before routing — different name, and it now runs
on the Node.js runtime instead of defaulting to Edge). This project uses
`src/proxy.ts`, which delegates to `lib/supabase/middleware.ts` for the
actual session-refresh logic. That helper file keeps the name
`middleware.ts` since its responsibility (refreshing the Supabase session
cookie) didn't change — only the top-level file convention that calls it
did.

## Feature modules (`features/*`)

Each feature owns only the folders it needs:

```text
feature-name/
├── components/   UI specific to this feature
├── hooks/        Feature-scoped React hooks
├── services/     Data-fetching / mutation functions (often Supabase calls)
├── schemas/      Zod schemas for this feature's forms/inputs
├── types/        Types specific to this feature (not shared domain types)
├── utils/        Small pure helpers specific to this feature
└── index.ts      Public API — the ONLY thing other features should import
```

**Boundary rule:** other features (and `app/*` pages) import from a
feature's `index.ts`, never from `features/x/components/Y` directly. This
keeps internal refactors inside a feature from breaking unrelated code.
Note that `index.ts` barrels intentionally do **not** re-export `services/`
— service functions are implementation detail that should be reached
through a feature's hooks (or called directly from Server Components/route
handlers within the same feature), not called ad hoc from other features or
directly from UI in other features.

### Feature list and responsibility

| Feature | Responsibility |
| --- | --- |
| `auth` | Login/register/forgot-password forms, Supabase Auth wrappers, session hook |
| `onboarding` | First-run create-group / join-group forms |
| `dashboard` | Today's-workout summary, recent group activity |
| `groups` | Group entity: members, invite code, create/join services |
| `splits` | Weekly split (group + personal), rest-day selection, reordering |
| `exercises` | Exercise library lookup and selection |
| `workouts` | Active workout recording: sets, notes, stopwatch, finishing |
| `progress` | Adherence, streak, volume, exercise-progress summaries |
| `personal-records` | PR list and cards |
| `body-map` | Muscle-activity visualization |
| `streaks` | Streak fetching + milestone detection |
| `profile` | Display name / avatar editing |

## `lib/` vs `constants/` vs `features/*/utils`

Three places can look similar — here's the actual split:

- **`src/constants/`** — domain/business constants a product manager would
  recognize: the weekly PPL split, rest-day rules, navigation items, sync
  state labels.
- **`src/lib/constants/`** — low-level, infrastructure-facing constants
  (Dexie DB name, sync interval, service worker URL). Nothing here is
  business-meaningful on its own.
- **`src/lib/calculations/`** — pure, reusable domain math shared by more
  than one feature (volume, adherence, streak, PR comparison, "what's
  scheduled today"). Fetches nothing — always takes already-loaded data in,
  computed data out.
- **`src/lib/utils/`** — generic, non-domain helpers (`cn`, id generation,
  `NotImplementedError`, number/duration formatting).
- **`features/*/utils/`** — pure helpers specific enough to one feature
  that promoting them to `lib/` would be premature (e.g. building an empty
  `WorkoutSession` skeleton, reordering split exercises).

If you're unsure where something goes: if it needs data fetching, it's a
feature `service`. If it's pure and used by 2+ features, it's `lib`. If
it's pure and feature-specific, it's `features/x/utils`.

## Client vs server components

- Default to Server Components. Add `"use client"` only when a file uses
  React state/effects/context, browser APIs, or event handlers.
- `lib/supabase/server.ts` is `server-only` — it will fail to compile if
  accidentally imported into a Client Component.
- `lib/supabase/client.ts` is safe for Client Components; it only ever
  holds the public anon key.
- Never import `lib/supabase/server.ts` (or anything that transitively
  imports it) from a file that also has `"use client"` at the top.

## State boundaries

Only three app-wide contexts exist, all under `src/contexts/` and provided
via `components/providers/`:

1. **Session** (`SupabaseProvider`) — the current authenticated user.
2. **Network** (`NetworkProvider`) — online/offline status and sync state.
3. **Stopwatch** (`StopwatchProvider`) — active-workout timer, scoped to
   `app/(dashboard)/workout/active/layout.tsx` only (not global).

Everything else is server data, fetched through feature `services/` and
`hooks/`, or local component state. Resist the urge to add a fourth global
context — see `docs/DEVELOPMENT_GUIDE.md` for the reasoning.

## Naming conventions

- PascalCase for components and types.
- camelCase for functions/variables.
- kebab-case for route folders and non-component file names
  (`use-network-status.ts`, `workout-session.service.ts`).
- Named exports everywhere except pages/layouts/route handlers, where
  Next.js requires a default export.
- Import alias: `@/*` → `src/*`.
