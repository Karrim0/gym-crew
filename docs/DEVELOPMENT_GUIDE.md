# Development guide

## Commands

```bash
npm install       # install dependencies
npm run dev       # start the dev server at http://localhost:3000
npm run build     # production build (also runs the TypeScript check)
npm run start     # serve the production build (after `npm run build`)
npm run lint      # ESLint (flat config, eslint-config-next)
npx tsc --noEmit  # TypeScript check on its own, without a full build
```

The app runs with **no environment variables set** — `npm run dev` and
`npm run build` both work out of the box. Without Supabase configured,
`src/proxy.ts` skips session refresh/route protection (logging one console
warning) instead of crashing every request. See "Connecting Supabase"
below to turn that back on.

## Connecting Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your
   project's API settings.
3. Create the schema described in `docs/DATABASE_PLAN.md`.
4. Generate real database types to replace the placeholder in
   `src/lib/supabase/types.ts`:
   ```bash
   npx supabase gen types typescript --project-id <project-id> --schema public > src/lib/supabase/types.ts
   ```
5. Restart `npm run dev` — route protection in `src/proxy.ts` activates
   automatically once both env vars are present.

## Where to add new code

Before adding a file, check `docs/ARCHITECTURE.md` — in particular the
`lib/` vs `constants/` vs `features/*/utils` section, since that's the
most common place new code lands in the wrong spot. Quick version:

- New page → `app/(dashboard)/.../page.tsx`, kept thin, importing from a
  feature's `index.ts`.
- New feature-specific UI, hook, service, schema, type, or pure helper →
  the matching subfolder inside `features/<feature-name>/`, then re-export
  it from that feature's `index.ts` if other features or `app/*` need it.
- New cross-feature pure domain calculation (used by 2+ features) →
  `lib/calculations/`.
- New generic (non-domain) helper → `lib/utils/`.
- New business constant → `src/constants/`. New low-level/infra constant →
  `src/lib/constants/`.
- New Supabase table interaction → a feature's `services/` file, calling
  `createClient()` from `lib/supabase/client.ts` (Client Components) or
  `createClient()` from `lib/supabase/server.ts` (Server Components/route
  handlers — never import this from a `"use client"` file, it will fail to
  compile thanks to the `server-only` guard).

## Rules for client vs. server components

- Everything is a Server Component by default. Only add `"use client"`
  when the file needs React state/effects/context, browser-only APIs
  (`window`, `navigator`, IndexedDB), or event handlers.
- Keep `"use client"` boundaries as low in the tree as practical — e.g.
  `WorkoutSessionHeader` stays a Server Component and only the interactive
  pieces around it (`Stopwatch`, `AddSetButton`) are client components.
- Never import `lib/supabase/server.ts` into a client-marked file. It's
  wrapped in `server-only` specifically so this fails at compile time
  instead of leaking session-handling code (or, later, a service-role key)
  into the browser bundle.

## Adding a placeholder vs. implementing for real

Not every unfinished function should silently return fake data. Follow the
pattern already used throughout `lib/offline`, `lib/calculations`, and
every feature's `services/`:

```ts
export async function fetchGroupById(groupId: UUID): Promise<WorkoutGroup | null> {
  void groupId;
  throw new NotImplementedError("fetchGroupById");
}
```

`NotImplementedError` (from `lib/utils/errors.ts`) makes "not built yet"
loud and unmistakable, instead of a caller mistaking an empty/default
return value for a real (but empty) result. Implement the real body
in-place when you build the feature — don't add a second function.

## Adding a new global context

Resist it. The project intentionally has exactly three app-wide contexts
(`SessionContext`, `NetworkContext`, `StopwatchContext` — see
`docs/ARCHITECTURE.md` → "State boundaries"). Before adding a fourth, ask:

- Can this be feature-local state instead (`useState` inside the one
  screen that needs it)?
- Can this be derived from data already fetched via a feature `service` /
  `hook`, rather than duplicated into global state?

If the answer to both is no, it probably belongs in a feature-scoped
context (like `StopwatchProvider`, which is mounted only in
`app/(dashboard)/workout/active/layout.tsx`, not globally) rather than a
new app-wide one.

## Linting and type-checking

`npm run build` already runs the TypeScript check as part of the Next.js
build. Run `npx tsc --noEmit` on its own for a faster feedback loop while
iterating, and `npm run lint` before committing — both are expected to
pass cleanly with zero errors and zero warnings on this codebase.
