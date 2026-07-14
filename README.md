# Gym Crew

A mobile-first group workout tracker built with Next.js, TypeScript, Supabase and Tailwind CSS.

## Current status

The application currently includes working authentication, group onboarding, group roles, shared and personal PPL splits, profile editing, online workout recording, previous-performance lookup and workout history.

Offline synchronization, progress statistics, personal-record detection, streaks, charts and the body map remain planned for later phases.

## Technology

- Next.js 16 App Router
- React 19 and TypeScript strict mode
- Tailwind CSS 4
- Supabase Auth, PostgreSQL, Storage, Realtime-ready schema and RLS
- React Hook Form and Zod
- Dexie/IndexedDB scaffold for the later offline phase

## Setup

```bash
npm install
```

Copy `.env.example` to `.env.local` and provide the public Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never place a service-role or secret key in a `NEXT_PUBLIC_` variable.

Link the project and apply all migrations:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The Phase 3 migration is:

```text
supabase/migrations/202607140003_group_split_workouts.sql
```

It adds the exercise library, starter group splits, personal-split helpers, workout-session helpers, member role policies and the avatar Storage bucket.

Regenerate Supabase types after applying migrations:

```bash
npx supabase gen types typescript --linked --schema public > src/lib/supabase/types.ts
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npm run start
```

## Implemented journeys

- Register, confirm email, login, reset password and logout.
- Create a group or join one with an invite code.
- View members and copy the invite code.
- Owner can manage admin/member roles and remove non-owner members.
- Edit display name and upload an avatar.
- View and edit the group PPL split as owner/admin.
- Clone and customize a personal split.
- Keep Friday fixed as rest and choose up to two additional rest days.
- Add, remove, reorder and edit exercise targets.
- Start today's workout from the personal split.
- Record sets, weights, reps, notes and stopwatch duration.
- Add exercises for one session or permanently.
- Finish a workout and review workout history/details.

See [`docs/PHASE_3_IMPLEMENTATION.md`](docs/PHASE_3_IMPLEMENTATION.md) for the complete phase report.
