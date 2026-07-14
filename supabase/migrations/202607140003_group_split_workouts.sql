-- Phase 3: group management, exercise library, personal splits, workout recording.

-- ---------------------------------------------------------------------------
-- Exercise library
-- ---------------------------------------------------------------------------

create unique index if not exists exercises_public_name_unique
  on public.exercises (lower(name))
  where created_by is null;

insert into public.exercises (name, primary_muscle, secondary_muscles, workout_type)
select seed.name, seed.primary_muscle::public.muscle_group,
       seed.secondary_muscles::public.muscle_group[], seed.workout_type::public.workout_type
from (values
  ('Bench Press', 'chest', array['shoulders','triceps'], 'push'),
  ('Incline Dumbbell Press', 'chest', array['shoulders','triceps'], 'push'),
  ('Chest Fly', 'chest', array['shoulders'], 'push'),
  ('Overhead Press', 'shoulders', array['triceps'], 'push'),
  ('Lateral Raise', 'shoulders', array[]::text[], 'push'),
  ('Triceps Pushdown', 'triceps', array[]::text[], 'push'),
  ('Dips', 'triceps', array['chest','shoulders'], 'push'),
  ('Lat Pulldown', 'back', array['biceps'], 'pull'),
  ('Pull-Up', 'back', array['biceps'], 'pull'),
  ('Barbell Row', 'back', array['biceps','shoulders'], 'pull'),
  ('Seated Cable Row', 'back', array['biceps'], 'pull'),
  ('Face Pull', 'shoulders', array['back'], 'pull'),
  ('Barbell Curl', 'biceps', array[]::text[], 'pull'),
  ('Hammer Curl', 'biceps', array[]::text[], 'pull'),
  ('Rear Delt Fly', 'shoulders', array['back'], 'pull'),
  ('Back Squat', 'quads', array['glutes','hamstrings'], 'legs'),
  ('Leg Press', 'quads', array['glutes','hamstrings'], 'legs'),
  ('Romanian Deadlift', 'hamstrings', array['glutes','back'], 'legs'),
  ('Leg Extension', 'quads', array[]::text[], 'legs'),
  ('Leg Curl', 'hamstrings', array[]::text[], 'legs'),
  ('Hip Thrust', 'glutes', array['hamstrings'], 'legs'),
  ('Standing Calf Raise', 'calves', array[]::text[], 'legs'),
  ('Walking Lunge', 'quads', array['glutes','hamstrings'], 'legs'),
  ('Cable Crunch', 'core', array[]::text[], 'custom')
) as seed(name, primary_muscle, secondary_muscles, workout_type)
where not exists (
  select 1 from public.exercises existing
  where existing.created_by is null and lower(existing.name) = lower(seed.name)
);

-- ---------------------------------------------------------------------------
-- Group split seeding
-- ---------------------------------------------------------------------------

create or replace function public.seed_group_split(target_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.split_exercises (
    split_day_id, exercise_id, position,
    target_sets, target_reps_min, target_reps_max, is_personal_addition
  )
  select
    day.id,
    exercise.id,
    template.position,
    template.target_sets,
    template.target_reps_min,
    template.target_reps_max,
    false
  from public.split_days day
  join (values
    ('push'::public.workout_type, 'Bench Press', 0, 4, 6, 10),
    ('push'::public.workout_type, 'Incline Dumbbell Press', 1, 3, 8, 12),
    ('push'::public.workout_type, 'Chest Fly', 2, 3, 10, 15),
    ('push'::public.workout_type, 'Overhead Press', 3, 3, 6, 10),
    ('push'::public.workout_type, 'Lateral Raise', 4, 3, 12, 20),
    ('push'::public.workout_type, 'Triceps Pushdown', 5, 3, 10, 15),
    ('pull'::public.workout_type, 'Lat Pulldown', 0, 4, 8, 12),
    ('pull'::public.workout_type, 'Barbell Row', 1, 4, 6, 10),
    ('pull'::public.workout_type, 'Seated Cable Row', 2, 3, 8, 12),
    ('pull'::public.workout_type, 'Face Pull', 3, 3, 12, 20),
    ('pull'::public.workout_type, 'Barbell Curl', 4, 3, 8, 12),
    ('pull'::public.workout_type, 'Hammer Curl', 5, 3, 10, 15),
    ('legs'::public.workout_type, 'Back Squat', 0, 4, 6, 10),
    ('legs'::public.workout_type, 'Romanian Deadlift', 1, 4, 6, 10),
    ('legs'::public.workout_type, 'Leg Press', 2, 3, 8, 12),
    ('legs'::public.workout_type, 'Leg Extension', 3, 3, 10, 15),
    ('legs'::public.workout_type, 'Leg Curl', 4, 3, 10, 15),
    ('legs'::public.workout_type, 'Standing Calf Raise', 5, 4, 10, 20)
  ) as template(workout_type, exercise_name, position, target_sets, target_reps_min, target_reps_max)
    on template.workout_type = day.workout_type
  join public.exercises exercise
    on exercise.created_by is null and lower(exercise.name) = lower(template.exercise_name)
  where day.group_id = target_group_id
    and day.owner_user_id is null
    and not exists (
      select 1 from public.split_exercises existing
      where existing.split_day_id = day.id
    );
end;
$$;

-- Seed existing groups that were created before this migration.
do $$
declare
  group_record record;
begin
  for group_record in select id from public.groups loop
    perform public.seed_group_split(group_record.id);
  end loop;
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

  perform public.seed_group_split(new_group.id);
  return new_group;
end;
$$;

-- ---------------------------------------------------------------------------
-- Personal split lifecycle
-- ---------------------------------------------------------------------------

create or replace function public.ensure_personal_split()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_group_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select group_id into current_group_id
  from public.group_members where user_id = current_user_id;

  if current_group_id is null then
    raise exception 'User does not belong to a group';
  end if;

  if exists (
    select 1 from public.split_days
    where group_id = current_group_id and owner_user_id = current_user_id
  ) then
    return;
  end if;

  insert into public.split_days (group_id, owner_user_id, weekday, workout_type)
  select group_id, current_user_id, weekday, workout_type
  from public.split_days
  where group_id = current_group_id and owner_user_id is null
  order by created_at;

  insert into public.split_exercises (
    split_day_id, exercise_id, position,
    target_sets, target_reps_min, target_reps_max, is_personal_addition
  )
  select
    personal_day.id,
    group_exercise.exercise_id,
    group_exercise.position,
    group_exercise.target_sets,
    group_exercise.target_reps_min,
    group_exercise.target_reps_max,
    false
  from public.split_days group_day
  join public.split_days personal_day
    on personal_day.group_id = group_day.group_id
    and personal_day.owner_user_id = current_user_id
    and personal_day.weekday = group_day.weekday
  join public.split_exercises group_exercise
    on group_exercise.split_day_id = group_day.id
  where group_day.group_id = current_group_id
    and group_day.owner_user_id is null;
end;
$$;

create or replace function public.reset_personal_split_to_group()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_group_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select group_id into current_group_id
  from public.group_members where user_id = current_user_id;

  if current_group_id is null then
    raise exception 'User does not belong to a group';
  end if;

  delete from public.split_days
  where group_id = current_group_id and owner_user_id = current_user_id;

  perform public.ensure_personal_split();
end;
$$;

create or replace function public.move_split_exercise(
  target_split_exercise_id uuid,
  direction integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.split_exercises;
  adjacent_row public.split_exercises;
  split_owner uuid;
  split_group uuid;
  temporary_position integer := 1000000;
begin
  if direction not in (-1, 1) then
    raise exception 'Direction must be -1 or 1';
  end if;

  select * into current_row from public.split_exercises where id = target_split_exercise_id;
  if current_row.id is null then raise exception 'Split exercise not found'; end if;

  select owner_user_id, group_id into split_owner, split_group
  from public.split_days where id = current_row.split_day_id;

  if not (
    (split_owner = auth.uid() and public.is_group_member(split_group)) or
    (split_owner is null and public.is_group_admin(split_group))
  ) then
    raise exception 'Not allowed to edit this split';
  end if;

  select * into adjacent_row
  from public.split_exercises
  where split_day_id = current_row.split_day_id
    and position = current_row.position + direction;

  if adjacent_row.id is null then return; end if;

  update public.split_exercises set position = temporary_position where id = current_row.id;
  update public.split_exercises set position = current_row.position where id = adjacent_row.id;
  update public.split_exercises set position = adjacent_row.position where id = current_row.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Group member roles
-- ---------------------------------------------------------------------------

drop policy if exists group_members_update_owner on public.group_members;
create policy group_members_update_owner on public.group_members
for update to authenticated
using (public.is_group_owner(group_id) and user_id <> auth.uid() and role <> 'owner')
with check (public.is_group_owner(group_id) and user_id <> auth.uid() and role in ('admin', 'member'));

-- ---------------------------------------------------------------------------
-- Workout session creation helpers
-- ---------------------------------------------------------------------------

create or replace function public.start_workout_from_split(
  target_split_day_id uuid,
  target_scheduled_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  split_row public.split_days;
  session_id uuid;
  exercise_row record;
  workout_exercise_id uuid;
  existing_session_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select * into split_row from public.split_days where id = target_split_day_id;
  if split_row.id is null then raise exception 'Split day not found'; end if;
  if split_row.workout_type = 'rest' then raise exception 'Cannot start a rest day'; end if;
  if not public.is_group_member(split_row.group_id) then raise exception 'Not a group member'; end if;
  if split_row.owner_user_id is not null and split_row.owner_user_id <> current_user_id then
    raise exception 'Cannot start another member''s split';
  end if;

  select id into existing_session_id
  from public.workout_sessions
  where user_id = current_user_id and status = 'in_progress'
  order by started_at desc limit 1;

  if existing_session_id is not null then return existing_session_id; end if;

  session_id := gen_random_uuid();
  insert into public.workout_sessions (
    id, client_id, user_id, group_id, split_day_id,
    scheduled_date, status, started_at
  ) values (
    session_id, gen_random_uuid(), current_user_id, split_row.group_id,
    split_row.id, target_scheduled_date, 'in_progress', timezone('utc', now())
  );

  for exercise_row in
    select * from public.split_exercises
    where split_day_id = split_row.id order by position
  loop
    workout_exercise_id := gen_random_uuid();
    insert into public.workout_exercises (
      id, workout_session_id, exercise_id, position,
      is_session_only_addition, notes
    ) values (
      workout_exercise_id, session_id, exercise_row.exercise_id,
      exercise_row.position, false, ''
    );

    insert into public.workout_sets (
      id, workout_exercise_id, set_number, is_completed
    )
    select gen_random_uuid(), workout_exercise_id, number, false
    from generate_series(1, exercise_row.target_sets) as number;
  end loop;

  return session_id;
end;
$$;

create or replace function public.add_workout_exercise(
  target_session_id uuid,
  target_exercise_id uuid,
  target_set_count integer default 3,
  session_only boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  workout_exercise_id uuid := gen_random_uuid();
  next_position integer;
begin
  if target_set_count < 1 or target_set_count > 20 then
    raise exception 'Set count must be between 1 and 20';
  end if;

  if not exists (
    select 1 from public.workout_sessions
    where id = target_session_id and user_id = current_user_id and status = 'in_progress'
  ) then
    raise exception 'Active workout not found';
  end if;

  select coalesce(max(position), -1) + 1 into next_position
  from public.workout_exercises where workout_session_id = target_session_id;

  insert into public.workout_exercises (
    id, workout_session_id, exercise_id, position,
    is_session_only_addition, notes
  ) values (
    workout_exercise_id, target_session_id, target_exercise_id,
    next_position, session_only, ''
  );

  insert into public.workout_sets (id, workout_exercise_id, set_number, is_completed)
  select gen_random_uuid(), workout_exercise_id, number, false
  from generate_series(1, target_set_count) as number;

  return workout_exercise_id;
end;
$$;

create or replace function public.add_workout_set(target_workout_exercise_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  set_id uuid := gen_random_uuid();
  next_number integer;
begin
  if not exists (
    select 1
    from public.workout_exercises exercise
    join public.workout_sessions session on session.id = exercise.workout_session_id
    where exercise.id = target_workout_exercise_id
      and session.user_id = auth.uid()
      and session.status = 'in_progress'
  ) then
    raise exception 'Active workout exercise not found';
  end if;

  select coalesce(max(set_number), 0) + 1 into next_number
  from public.workout_sets where workout_exercise_id = target_workout_exercise_id;

  insert into public.workout_sets (id, workout_exercise_id, set_number, is_completed)
  values (set_id, target_workout_exercise_id, next_number, false);

  return set_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Avatar storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
for select using (bucket_id = 'avatars');

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
