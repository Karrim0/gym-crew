-- Gym Crew v1.1 critical fixes
-- 1. Safe deletion of a user's own completed workout session.
-- 2. Rebuild personal records after the deleted session is removed.
-- 3. Avoid creating misleading group-feed events during that rebuild.

create or replace function public.log_personal_record_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
  should_share boolean;
begin
  if current_setting('gym_crew.suppress_group_activity', true) = 'on' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.value is not distinct from new.value
      and old.workout_set_id is not distinct from new.workout_set_id then
      return new;
    end if;
  end if;

  select group_id into target_group_id
  from public.group_members
  where user_id = new.user_id;

  select share_personal_records into should_share
  from public.profiles
  where id = new.user_id;

  if target_group_id is not null and coalesce(should_share, true) then
    insert into public.group_activity (
      group_id, user_id, activity_type, message, metadata
    ) values (
      target_group_id,
      new.user_id,
      'personal_record',
      'Set a new personal record',
      jsonb_build_object(
        'exercise_id', new.exercise_id,
        'record_type', new.record_type,
        'value', new.value,
        'weight_kg', new.weight_kg,
        'reps', new.reps,
        'workout_set_id', new.workout_set_id
      )
    );
  end if;

  return new;
end;
$$;

create or replace function public.recalculate_personal_records_for_exercise(
  target_user_id uuid,
  target_exercise_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  best_set_id uuid;
  best_weight numeric(8, 2);
  best_reps integer;
  best_value numeric;
  best_achieved_at timestamptz;
begin
  -- Maximum weight
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
  where workout_sessions.user_id = target_user_id
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
    where user_id = target_user_id
      and exercise_id = target_exercise_id
      and record_type = 'max_weight';
  else
    insert into public.personal_records (
      user_id, exercise_id, record_type, value, workout_set_id,
      achieved_at, weight_kg, reps
    ) values (
      target_user_id, target_exercise_id, 'max_weight', best_value,
      best_set_id, best_achieved_at, best_weight, best_reps
    )
    on conflict (user_id, exercise_id, record_type) do update
    set value = excluded.value,
        workout_set_id = excluded.workout_set_id,
        achieved_at = excluded.achieved_at,
        weight_kg = excluded.weight_kg,
        reps = excluded.reps;
  end if;

  -- Maximum reps
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
  where workout_sessions.user_id = target_user_id
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
    where user_id = target_user_id
      and exercise_id = target_exercise_id
      and record_type = 'max_reps';
  else
    insert into public.personal_records (
      user_id, exercise_id, record_type, value, workout_set_id,
      achieved_at, weight_kg, reps
    ) values (
      target_user_id, target_exercise_id, 'max_reps', best_value,
      best_set_id, best_achieved_at, best_weight, best_reps
    )
    on conflict (user_id, exercise_id, record_type) do update
    set value = excluded.value,
        workout_set_id = excluded.workout_set_id,
        achieved_at = excluded.achieved_at,
        weight_kg = excluded.weight_kg,
        reps = excluded.reps;
  end if;

  -- Best single-set volume
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
  where workout_sessions.user_id = target_user_id
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
    where user_id = target_user_id
      and exercise_id = target_exercise_id
      and record_type = 'max_volume';
  else
    insert into public.personal_records (
      user_id, exercise_id, record_type, value, workout_set_id,
      achieved_at, weight_kg, reps
    ) values (
      target_user_id, target_exercise_id, 'max_volume', best_value,
      best_set_id, best_achieved_at, best_weight, best_reps
    )
    on conflict (user_id, exercise_id, record_type) do update
    set value = excluded.value,
        workout_set_id = excluded.workout_set_id,
        achieved_at = excluded.achieved_at,
        weight_kg = excluded.weight_kg,
        reps = excluded.reps;
  end if;
end;
$$;

create or replace function public.delete_own_workout_session(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  session_owner_id uuid;
  affected_exercise_ids uuid[];
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select user_id into session_owner_id
  from public.workout_sessions
  where id = target_session_id;

  if session_owner_id is null then
    return;
  end if;

  if session_owner_id <> current_user_id then
    raise exception 'You can only delete your own workout sessions';
  end if;

  select array_agg(distinct exercise_id)
  into affected_exercise_ids
  from public.workout_exercises
  where workout_session_id = target_session_id;

  -- Remove feed entries that directly reference the deleted workout or one of
  -- its sets before the cascading delete removes those set ids.
  delete from public.group_activity
  where user_id = current_user_id
    and (
      metadata ->> 'workout_session_id' = target_session_id::text
      or metadata ->> 'workout_set_id' in (
        select workout_sets.id::text
        from public.workout_sets
        join public.workout_exercises
          on workout_exercises.id = workout_sets.workout_exercise_id
        where workout_exercises.workout_session_id = target_session_id
      )
    );

  perform set_config('gym_crew.suppress_group_activity', 'on', true);
  delete from public.workout_sessions where id = target_session_id;

  if affected_exercise_ids is not null then
    for i in 1..array_length(affected_exercise_ids, 1) loop
      perform public.recalculate_personal_records_for_exercise(
        current_user_id,
        affected_exercise_ids[i]
      );
    end loop;
  end if;

  perform set_config('gym_crew.suppress_group_activity', 'off', true);
end;
$$;

revoke all on function public.recalculate_personal_records_for_exercise(uuid, uuid) from public;
revoke all on function public.recalculate_personal_records_for_exercise(uuid, uuid) from authenticated;
revoke all on function public.delete_own_workout_session(uuid) from public;
grant execute on function public.delete_own_workout_session(uuid) to authenticated;
