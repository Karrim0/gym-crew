-- Gym Crew initial Supabase schema
-- Apply with `supabase db push` after linking a Supabase project.

create extension if not exists pgcrypto;

create type public.group_role as enum ('owner', 'admin', 'member');
create type public.weekday as enum (
  'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'
);
create type public.workout_type as enum ('push', 'pull', 'legs', 'rest', 'custom');
create type public.muscle_group as enum (
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'core'
);
create type public.workout_session_status as enum (
  'in_progress', 'completed', 'missed', 'cancelled'
);
create type public.personal_record_type as enum ('max_weight', 'max_reps', 'max_volume');
create type public.group_activity_type as enum (
  'workout_completed', 'personal_record', 'joined_group', 'streak_milestone'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.array_is_unique(values_array anyarray)
returns boolean
language sql
immutable
as $$
  select coalesce(cardinality(values_array), 0) =
         coalesce((select count(distinct value) from unnest(values_array) as item(value)), 0);
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 60),
  avatar_url text,
  additional_rest_days public.weekday[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_max_additional_rest_days
    check (cardinality(additional_rest_days) <= 2),
  constraint profiles_friday_is_not_personal_rest_day
    check (not ('friday'::public.weekday = any(additional_rest_days))),
  constraint profiles_additional_rest_days_unique
    check (public.array_is_unique(additional_rest_days))
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{8}$'),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.group_role not null default 'member',
  joined_at timestamptz not null default timezone('utc', now()),
  unique (group_id, user_id),
  -- MVP rule: one user belongs to one workout group.
  unique (user_id)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  primary_muscle public.muscle_group not null,
  secondary_muscles public.muscle_group[] not null default '{}',
  workout_type public.workout_type not null check (workout_type <> 'rest'),
  is_custom boolean not null default false,
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint exercises_custom_owner_consistency check (
    (is_custom and created_by is not null) or
    (not is_custom and created_by is null)
  )
);

create table public.split_days (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  owner_user_id uuid references public.profiles(id) on delete cascade,
  weekday public.weekday not null,
  workout_type public.workout_type not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint split_days_fixed_friday check (
    (weekday = 'friday' and workout_type = 'rest') or
    (weekday <> 'friday' and workout_type <> 'rest')
  )
);

create unique index split_days_group_weekday_unique
  on public.split_days(group_id, weekday)
  where owner_user_id is null;

create unique index split_days_personal_weekday_unique
  on public.split_days(group_id, owner_user_id, weekday)
  where owner_user_id is not null;

create table public.split_exercises (
  id uuid primary key default gen_random_uuid(),
  split_day_id uuid not null references public.split_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position integer not null check (position >= 0),
  target_sets integer not null check (target_sets between 1 and 20),
  target_reps_min integer not null check (target_reps_min between 1 and 100),
  target_reps_max integer not null check (target_reps_max between target_reps_min and 100),
  is_personal_addition boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (split_day_id, exercise_id),
  unique (split_day_id, position)
);

create table public.workout_sessions (
  id uuid primary key,
  client_id uuid not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  split_day_id uuid references public.split_days(id) on delete set null,
  scheduled_date date not null,
  status public.workout_session_status not null default 'in_progress',
  notes text not null default '',
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  started_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workout_sessions_completed_at_consistency check (
    (status = 'completed' and completed_at is not null) or
    (status <> 'completed')
  )
);

create index workout_sessions_user_date_idx
  on public.workout_sessions(user_id, scheduled_date desc);

create table public.workout_exercises (
  id uuid primary key,
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position integer not null check (position >= 0),
  is_session_only_addition boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workout_session_id, position)
);

create table public.workout_sets (
  id uuid primary key,
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number integer not null check (set_number between 1 and 100),
  weight_kg numeric(8, 2) check (weight_kg is null or weight_kg >= 0),
  reps integer check (reps is null or reps between 0 and 1000),
  is_warmup boolean not null default false,
  is_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workout_exercise_id, set_number)
);

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  record_type public.personal_record_type not null,
  value numeric(12, 2) not null check (value >= 0),
  workout_set_id uuid not null references public.workout_sets(id) on delete cascade,
  achieved_at timestamptz not null default timezone('utc', now()),
  unique (user_id, exercise_id, record_type)
);

create table public.group_activity (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type public.group_activity_type not null,
  message text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index group_activity_group_created_idx
  on public.group_activity(group_id, created_at desc);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger groups_set_updated_at before update on public.groups
for each row execute function public.set_updated_at();
create trigger exercises_set_updated_at before update on public.exercises
for each row execute function public.set_updated_at();
create trigger split_days_set_updated_at before update on public.split_days
for each row execute function public.set_updated_at();
create trigger split_exercises_set_updated_at before update on public.split_exercises
for each row execute function public.set_updated_at();
create trigger workout_sessions_set_updated_at before update on public.workout_sessions
for each row execute function public.set_updated_at();
create trigger workout_exercises_set_updated_at before update on public.workout_exercises
for each row execute function public.set_updated_at();
create trigger workout_sets_set_updated_at before update on public.workout_sets
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Athlete'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.current_user_group_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select group_id from public.group_members where user_id = auth.uid() limit 1;
$$;

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_group_owner(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.shares_group_with(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = auth.uid() and theirs.user_id = other_user_id
  );
$$;

create or replace function public.validate_personal_split_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.owner_user_id is not null and not exists (
    select 1 from public.group_members
    where group_id = new.group_id and user_id = new.owner_user_id
  ) then
    raise exception 'Personal split owner must be a member of the group';
  end if;
  return new;
end;
$$;

create trigger split_days_validate_owner
before insert or update on public.split_days
for each row execute function public.validate_personal_split_owner();

create or replace function public.generate_group_invite_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (select 1 from public.groups where invite_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.create_group_with_owner(group_name text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group public.groups;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if exists (select 1 from public.group_members where user_id = current_user_id) then
    raise exception 'User already belongs to a group';
  end if;

  insert into public.groups (name, invite_code, created_by)
  values (trim(group_name), public.generate_group_invite_code(), current_user_id)
  returning * into new_group;

  insert into public.group_members (group_id, user_id, role)
  values (new_group.id, current_user_id, 'owner');

  insert into public.split_days (group_id, owner_user_id, weekday, workout_type)
  values
    (new_group.id, null, 'saturday', 'push'),
    (new_group.id, null, 'sunday', 'pull'),
    (new_group.id, null, 'monday', 'legs'),
    (new_group.id, null, 'tuesday', 'push'),
    (new_group.id, null, 'wednesday', 'pull'),
    (new_group.id, null, 'thursday', 'legs'),
    (new_group.id, null, 'friday', 'rest');

  return new_group;
end;
$$;

create or replace function public.join_group_by_invite_code(raw_invite_code text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_group public.groups;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if exists (select 1 from public.group_members where user_id = current_user_id) then
    raise exception 'User already belongs to a group';
  end if;

  select * into selected_group
  from public.groups
  where invite_code = upper(trim(raw_invite_code));

  if selected_group.id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (selected_group.id, current_user_id, 'member');

  insert into public.group_activity (group_id, user_id, activity_type, message)
  values (selected_group.id, current_user_id, 'joined_group', 'Joined the group');

  return selected_group;
end;
$$;

create or replace function public.log_completed_workout_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and (
    tg_op = 'INSERT' or old.status is distinct from 'completed'
  ) then
    insert into public.group_activity (group_id, user_id, activity_type, message, metadata)
    values (
      new.group_id,
      new.user_id,
      'workout_completed',
      'Completed a workout',
      jsonb_build_object('workout_session_id', new.id, 'scheduled_date', new.scheduled_date)
    );
  end if;
  return new;
end;
$$;

create trigger workout_session_completed_on_insert
after insert on public.workout_sessions
for each row execute function public.log_completed_workout_activity();

create trigger workout_session_completed_on_update
after update of status on public.workout_sessions
for each row execute function public.log_completed_workout_activity();

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.exercises enable row level security;
alter table public.split_days enable row level security;
alter table public.split_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.personal_records enable row level security;
alter table public.group_activity enable row level security;

create policy profiles_select_group_members on public.profiles
for select to authenticated
using (id = auth.uid() or public.shares_group_with(id));
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy groups_select_members on public.groups
for select to authenticated using (public.is_group_member(id));
create policy groups_update_owner on public.groups
for update to authenticated using (public.is_group_owner(id)) with check (public.is_group_owner(id));
create policy groups_delete_owner on public.groups
for delete to authenticated using (public.is_group_owner(id));

create policy group_members_select_members on public.group_members
for select to authenticated using (public.is_group_member(group_id));
create policy group_members_delete_self_or_owner on public.group_members
for delete to authenticated
using (
  (user_id = auth.uid() and role <> 'owner') or
  (public.is_group_owner(group_id) and user_id <> auth.uid() and role <> 'owner')
);

create policy exercises_select_visible on public.exercises
for select to authenticated
using (created_by is null or created_by = auth.uid() or public.shares_group_with(created_by));
create policy exercises_insert_own_custom on public.exercises
for insert to authenticated
with check (is_custom and created_by = auth.uid());
create policy exercises_update_own_custom on public.exercises
for update to authenticated
using (is_custom and created_by = auth.uid())
with check (is_custom and created_by = auth.uid());
create policy exercises_delete_own_custom on public.exercises
for delete to authenticated using (is_custom and created_by = auth.uid());

create policy split_days_select_effective on public.split_days
for select to authenticated
using (public.is_group_member(group_id) and (owner_user_id is null or owner_user_id = auth.uid()));
create policy split_days_insert_authorized on public.split_days
for insert to authenticated
with check (
  (owner_user_id = auth.uid() and public.is_group_member(group_id)) or
  (owner_user_id is null and public.is_group_admin(group_id))
);
create policy split_days_update_authorized on public.split_days
for update to authenticated
using (
  (owner_user_id = auth.uid() and public.is_group_member(group_id)) or
  (owner_user_id is null and public.is_group_admin(group_id))
)
with check (
  (owner_user_id = auth.uid() and public.is_group_member(group_id)) or
  (owner_user_id is null and public.is_group_admin(group_id))
);
create policy split_days_delete_authorized on public.split_days
for delete to authenticated
using (
  (owner_user_id = auth.uid() and public.is_group_member(group_id)) or
  (owner_user_id is null and public.is_group_admin(group_id))
);

create policy split_exercises_select_visible on public.split_exercises
for select to authenticated
using (exists (
  select 1 from public.split_days sd
  where sd.id = split_day_id
    and public.is_group_member(sd.group_id)
    and (sd.owner_user_id is null or sd.owner_user_id = auth.uid())
));
create policy split_exercises_insert_authorized on public.split_exercises
for insert to authenticated
with check (exists (
  select 1 from public.split_days sd
  where sd.id = split_day_id
    and ((sd.owner_user_id = auth.uid() and public.is_group_member(sd.group_id))
      or (sd.owner_user_id is null and public.is_group_admin(sd.group_id)))
));
create policy split_exercises_update_authorized on public.split_exercises
for update to authenticated
using (exists (
  select 1 from public.split_days sd
  where sd.id = split_day_id
    and ((sd.owner_user_id = auth.uid() and public.is_group_member(sd.group_id))
      or (sd.owner_user_id is null and public.is_group_admin(sd.group_id)))
))
with check (exists (
  select 1 from public.split_days sd
  where sd.id = split_day_id
    and ((sd.owner_user_id = auth.uid() and public.is_group_member(sd.group_id))
      or (sd.owner_user_id is null and public.is_group_admin(sd.group_id)))
));
create policy split_exercises_delete_authorized on public.split_exercises
for delete to authenticated
using (exists (
  select 1 from public.split_days sd
  where sd.id = split_day_id
    and ((sd.owner_user_id = auth.uid() and public.is_group_member(sd.group_id))
      or (sd.owner_user_id is null and public.is_group_admin(sd.group_id)))
));

create policy workout_sessions_owner_all on public.workout_sessions
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and public.is_group_member(group_id));

create policy workout_exercises_owner_all on public.workout_exercises
for all to authenticated
using (exists (
  select 1 from public.workout_sessions ws
  where ws.id = workout_session_id and ws.user_id = auth.uid()
))
with check (exists (
  select 1 from public.workout_sessions ws
  where ws.id = workout_session_id and ws.user_id = auth.uid()
));

create policy workout_sets_owner_all on public.workout_sets
for all to authenticated
using (exists (
  select 1 from public.workout_exercises we
  join public.workout_sessions ws on ws.id = we.workout_session_id
  where we.id = workout_exercise_id and ws.user_id = auth.uid()
))
with check (exists (
  select 1 from public.workout_exercises we
  join public.workout_sessions ws on ws.id = we.workout_session_id
  where we.id = workout_exercise_id and ws.user_id = auth.uid()
));

create policy personal_records_owner_all on public.personal_records
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy group_activity_select_members on public.group_activity
for select to authenticated using (public.is_group_member(group_id));

revoke all on function public.create_group_with_owner(text) from public;
revoke all on function public.join_group_by_invite_code(text) from public;
grant execute on function public.create_group_with_owner(text) to authenticated;
grant execute on function public.join_group_by_invite_code(text) to authenticated;


-- Helper functions are implementation details for RLS. Authenticated users
-- need them through policies; anonymous users do not.
revoke execute on function public.current_user_group_id() from public;
revoke execute on function public.is_group_member(uuid) from public;
revoke execute on function public.is_group_admin(uuid) from public;
revoke execute on function public.is_group_owner(uuid) from public;
revoke execute on function public.shares_group_with(uuid) from public;
grant execute on function public.current_user_group_id() to authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_admin(uuid) to authenticated;
grant execute on function public.is_group_owner(uuid) to authenticated;
grant execute on function public.shares_group_with(uuid) to authenticated;
