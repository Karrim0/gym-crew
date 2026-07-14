-- Phase 4 + 5: solo-first onboarding, offline-safe workout IDs, and personal progress records.

-- ---------------------------------------------------------------------------
-- Solo training workspace
-- ---------------------------------------------------------------------------

alter table public.groups
  add column if not exists is_personal boolean not null default false;

create unique index if not exists groups_one_personal_workspace_per_owner
  on public.groups(created_by)
  where is_personal;

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
    raise exception 'User already belongs to a training workspace';
  end if;

  insert into public.groups (name, invite_code, created_by, is_personal)
  values (trim(group_name), public.generate_group_invite_code(), current_user_id, false)
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
  perform public.ensure_personal_split();
  return new_group;
end;
$$;

create or replace function public.create_solo_workspace()
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group public.groups;
  current_user_id uuid := auth.uid();
  athlete_name text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select groups.* into new_group
  from public.group_members
  join public.groups on groups.id = group_members.group_id
  where group_members.user_id = current_user_id
  limit 1;

  if new_group.id is not null then
    return new_group;
  end if;

  select coalesce(nullif(trim(display_name), ''), 'My') into athlete_name
  from public.profiles where id = current_user_id;

  insert into public.groups (name, invite_code, created_by, is_personal)
  values (left(athlete_name || '''s Training', 80), public.generate_group_invite_code(), current_user_id, true)
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
  perform public.ensure_personal_split();
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
    raise exception 'User already belongs to a training workspace';
  end if;

  select * into selected_group
  from public.groups
  where invite_code = upper(trim(raw_invite_code))
    and not is_personal;

  if selected_group.id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (selected_group.id, current_user_id, 'member');

  insert into public.group_activity (group_id, user_id, activity_type, message)
  values (selected_group.id, current_user_id, 'joined_group', 'Joined the group');

  perform public.ensure_personal_split();
  return selected_group;
end;
$$;

revoke all on function public.create_solo_workspace() from public;
grant execute on function public.create_solo_workspace() to authenticated;

-- ---------------------------------------------------------------------------
-- Personal record context and automatic detection
-- ---------------------------------------------------------------------------

alter table public.personal_records
  add column if not exists weight_kg numeric(8, 2),
  add column if not exists reps integer;

create or replace function public.refresh_personal_records_for_session(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session public.workout_sessions;
  target_exercise_id uuid;
  best_set_id uuid;
  best_weight numeric(8, 2);
  best_reps integer;
  best_value numeric;
  best_achieved_at timestamptz;
begin
  select * into target_session
  from public.workout_sessions
  where id = target_session_id and status = 'completed';

  if target_session.id is null then
    return;
  end if;

  -- Recalculate each exercise in the completed session across the athlete's
  -- entire completed history. This keeps records correct even when an older
  -- completed set is edited or deleted later.
  for target_exercise_id in
    select distinct workout_exercises.exercise_id
    from public.workout_exercises
    where workout_exercises.workout_session_id = target_session.id
  loop
    best_set_id := null;
    best_weight := null;
    best_reps := null;
    best_value := null;
    best_achieved_at := null;

    select
      workout_sets.id,
      workout_sets.weight_kg,
      workout_sets.reps,
      workout_sets.weight_kg,
      coalesce(workout_sessions.completed_at, workout_sets.updated_at)
    into best_set_id, best_weight, best_reps, best_value, best_achieved_at
    from public.workout_sets
    join public.workout_exercises
      on workout_exercises.id = workout_sets.workout_exercise_id
    join public.workout_sessions
      on workout_sessions.id = workout_exercises.workout_session_id
    where workout_sessions.user_id = target_session.user_id
      and workout_sessions.status = 'completed'
      and workout_exercises.exercise_id = target_exercise_id
      and workout_sets.is_completed
      and not workout_sets.is_warmup
      and workout_sets.weight_kg is not null
    order by workout_sets.weight_kg desc,
             workout_sets.reps desc nulls last,
             workout_sets.updated_at desc
    limit 1;

    if best_set_id is null then
      delete from public.personal_records
      where user_id = target_session.user_id
        and exercise_id = target_exercise_id
        and record_type = 'max_weight';
    else
      insert into public.personal_records (
        user_id, exercise_id, record_type, value, workout_set_id,
        achieved_at, weight_kg, reps
      ) values (
        target_session.user_id, target_exercise_id, 'max_weight', best_value,
        best_set_id, best_achieved_at, best_weight, best_reps
      )
      on conflict (user_id, exercise_id, record_type) do update
      set value = excluded.value,
          workout_set_id = excluded.workout_set_id,
          achieved_at = excluded.achieved_at,
          weight_kg = excluded.weight_kg,
          reps = excluded.reps;
    end if;

    best_set_id := null;
    best_weight := null;
    best_reps := null;
    best_value := null;
    best_achieved_at := null;

    select
      workout_sets.id,
      workout_sets.weight_kg,
      workout_sets.reps,
      workout_sets.reps,
      coalesce(workout_sessions.completed_at, workout_sets.updated_at)
    into best_set_id, best_weight, best_reps, best_value, best_achieved_at
    from public.workout_sets
    join public.workout_exercises
      on workout_exercises.id = workout_sets.workout_exercise_id
    join public.workout_sessions
      on workout_sessions.id = workout_exercises.workout_session_id
    where workout_sessions.user_id = target_session.user_id
      and workout_sessions.status = 'completed'
      and workout_exercises.exercise_id = target_exercise_id
      and workout_sets.is_completed
      and not workout_sets.is_warmup
      and workout_sets.reps is not null
    order by workout_sets.reps desc,
             workout_sets.weight_kg desc nulls last,
             workout_sets.updated_at desc
    limit 1;

    if best_set_id is null then
      delete from public.personal_records
      where user_id = target_session.user_id
        and exercise_id = target_exercise_id
        and record_type = 'max_reps';
    else
      insert into public.personal_records (
        user_id, exercise_id, record_type, value, workout_set_id,
        achieved_at, weight_kg, reps
      ) values (
        target_session.user_id, target_exercise_id, 'max_reps', best_value,
        best_set_id, best_achieved_at, best_weight, best_reps
      )
      on conflict (user_id, exercise_id, record_type) do update
      set value = excluded.value,
          workout_set_id = excluded.workout_set_id,
          achieved_at = excluded.achieved_at,
          weight_kg = excluded.weight_kg,
          reps = excluded.reps;
    end if;

    best_set_id := null;
    best_weight := null;
    best_reps := null;
    best_value := null;
    best_achieved_at := null;

    select
      workout_sets.id,
      workout_sets.weight_kg,
      workout_sets.reps,
      workout_sets.weight_kg * workout_sets.reps,
      coalesce(workout_sessions.completed_at, workout_sets.updated_at)
    into best_set_id, best_weight, best_reps, best_value, best_achieved_at
    from public.workout_sets
    join public.workout_exercises
      on workout_exercises.id = workout_sets.workout_exercise_id
    join public.workout_sessions
      on workout_sessions.id = workout_exercises.workout_session_id
    where workout_sessions.user_id = target_session.user_id
      and workout_sessions.status = 'completed'
      and workout_exercises.exercise_id = target_exercise_id
      and workout_sets.is_completed
      and not workout_sets.is_warmup
      and workout_sets.weight_kg is not null
      and workout_sets.reps is not null
    order by (workout_sets.weight_kg * workout_sets.reps) desc,
             workout_sets.weight_kg desc,
             workout_sets.updated_at desc
    limit 1;

    if best_set_id is null then
      delete from public.personal_records
      where user_id = target_session.user_id
        and exercise_id = target_exercise_id
        and record_type = 'max_volume';
    else
      insert into public.personal_records (
        user_id, exercise_id, record_type, value, workout_set_id,
        achieved_at, weight_kg, reps
      ) values (
        target_session.user_id, target_exercise_id, 'max_volume', best_value,
        best_set_id, best_achieved_at, best_weight, best_reps
      )
      on conflict (user_id, exercise_id, record_type) do update
      set value = excluded.value,
          workout_set_id = excluded.workout_set_id,
          achieved_at = excluded.achieved_at,
          weight_kg = excluded.weight_kg,
          reps = excluded.reps;
    end if;
  end loop;
end;
$$;

create or replace function public.handle_completed_session_personal_records()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and (
    tg_op = 'INSERT' or old.status is distinct from 'completed'
  ) then
    perform public.refresh_personal_records_for_session(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists workout_session_personal_records_on_insert on public.workout_sessions;
create trigger workout_session_personal_records_on_insert
after insert on public.workout_sessions
for each row execute function public.handle_completed_session_personal_records();

drop trigger if exists workout_session_personal_records_on_update on public.workout_sessions;
create trigger workout_session_personal_records_on_update
after update of status on public.workout_sessions
for each row execute function public.handle_completed_session_personal_records();

create or replace function public.handle_completed_set_personal_records()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_session_id uuid;
  parent_status public.workout_session_status;
  target_workout_exercise_id uuid;
begin
  if tg_op = 'DELETE' then
    target_workout_exercise_id := old.workout_exercise_id;
  else
    target_workout_exercise_id := new.workout_exercise_id;
  end if;

  select session.id, session.status
  into parent_session_id, parent_status
  from public.workout_exercises exercise
  join public.workout_sessions session on session.id = exercise.workout_session_id
  where exercise.id = target_workout_exercise_id;

  if parent_status = 'completed' then
    perform public.refresh_personal_records_for_session(parent_session_id);
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists workout_set_personal_records_on_insert on public.workout_sets;
create trigger workout_set_personal_records_on_insert
after insert on public.workout_sets
for each row execute function public.handle_completed_set_personal_records();

drop trigger if exists workout_set_personal_records_on_update on public.workout_sets;
create trigger workout_set_personal_records_on_update
after update of weight_kg, reps, is_completed, is_warmup on public.workout_sets
for each row execute function public.handle_completed_set_personal_records();

drop trigger if exists workout_set_personal_records_on_delete on public.workout_sets;
create trigger workout_set_personal_records_on_delete
after delete on public.workout_sets
for each row execute function public.handle_completed_set_personal_records();

-- Backfill records for workouts completed before this migration.
do $$
declare
  completed_session record;
begin
  for completed_session in
    select id from public.workout_sessions where status = 'completed'
  loop
    perform public.refresh_personal_records_for_session(completed_session.id);
  end loop;
end;
$$;

revoke all on function public.refresh_personal_records_for_session(uuid) from public;
revoke all on function public.refresh_personal_records_for_session(uuid) from authenticated;
