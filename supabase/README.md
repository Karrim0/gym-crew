# Supabase setup

1. Install the Supabase CLI.
2. Run `supabase login`.
3. Run `supabase link --project-ref <project-ref>`.
4. Apply the migration with `supabase db push`.
5. Generate database types:

```bash
npx supabase gen types typescript \
  --project-id <project-ref> \
  --schema public \
  > src/lib/supabase/types.ts
```

6. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to
   `.env.local`.

The migration creates the profile trigger, one-group-per-user membership
rule, group creation/join RPCs, the default Saturday-to-Friday PPL schedule,
and the first RLS policies.
