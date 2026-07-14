-- Phase 6: gym-first mobile experience and fully editable personal split.

alter table public.split_days
  add column if not exists display_name text;

alter table public.split_days
  drop constraint if exists split_days_display_name_length;

alter table public.split_days
  add constraint split_days_display_name_length
  check (display_name is null or char_length(trim(display_name)) between 2 and 40);

-- The app is optimized for two hard working sets by default. Existing starter
-- templates are moved to two sets; personal additions are left untouched.
update public.split_exercises
set target_sets = 2
where not is_personal_addition
  and target_sets in (3, 4);

create or replace function public.update_split_day_settings(
  target_split_day_id uuid,
  target_workout_type public.workout_type,
  target_display_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_day public.split_days;
  normalized_name text := nullif(trim(target_display_name), '');
begin
  select * into target_day
  from public.split_days
  where id = target_split_day_id;

  if target_day.id is null then
    raise exception 'Split day not found';
  end if;

  if not (
    (target_day.owner_user_id = auth.uid() and public.is_group_member(target_day.group_id))
    or
    (target_day.owner_user_id is null and public.is_group_admin(target_day.group_id))
  ) then
    raise exception 'Not allowed to edit this split day';
  end if;

  if target_day.weekday = 'friday' and target_workout_type <> 'rest' then
    raise exception 'Friday is the fixed rest day';
  end if;

  if target_day.weekday <> 'friday' and target_workout_type = 'rest' then
    raise exception 'Use personal rest days for additional rest days';
  end if;

  if normalized_name is not null and char_length(normalized_name) not between 2 and 40 then
    raise exception 'Day name must be between 2 and 40 characters';
  end if;

  update public.split_days
  set workout_type = target_workout_type,
      display_name = normalized_name
  where id = target_split_day_id;
end;
$$;

revoke all on function public.update_split_day_settings(uuid, public.workout_type, text) from public;
grant execute on function public.update_split_day_settings(uuid, public.workout_type, text) to authenticated;

-- New starter workspaces should also use two working sets.
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
    2,
    template.target_reps_min,
    template.target_reps_max,
    false
  from public.split_days day
  join (values
    ('push'::public.workout_type, 'Bench Press', 0, 6, 10),
    ('push'::public.workout_type, 'Incline Dumbbell Press', 1, 8, 12),
    ('push'::public.workout_type, 'Chest Fly', 2, 10, 15),
    ('push'::public.workout_type, 'Overhead Press', 3, 6, 10),
    ('push'::public.workout_type, 'Lateral Raise', 4, 12, 20),
    ('push'::public.workout_type, 'Triceps Pushdown', 5, 10, 15),
    ('pull'::public.workout_type, 'Lat Pulldown', 0, 8, 12),
    ('pull'::public.workout_type, 'Barbell Row', 1, 6, 10),
    ('pull'::public.workout_type, 'Seated Cable Row', 2, 8, 12),
    ('pull'::public.workout_type, 'Face Pull', 3, 12, 20),
    ('pull'::public.workout_type, 'Barbell Curl', 4, 8, 12),
    ('pull'::public.workout_type, 'Hammer Curl', 5, 10, 15),
    ('legs'::public.workout_type, 'Back Squat', 0, 6, 10),
    ('legs'::public.workout_type, 'Romanian Deadlift', 1, 6, 10),
    ('legs'::public.workout_type, 'Leg Press', 2, 8, 12),
    ('legs'::public.workout_type, 'Leg Extension', 3, 10, 15),
    ('legs'::public.workout_type, 'Leg Curl', 4, 10, 15),
    ('legs'::public.workout_type, 'Standing Calf Raise', 5, 10, 20)
  ) as template(workout_type, exercise_name, position, target_reps_min, target_reps_max)
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

-- Keep custom day names when a personal split is first created or reset.
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
    raise exception 'User does not belong to a training workspace';
  end if;

  if exists (
    select 1 from public.split_days
    where group_id = current_group_id and owner_user_id = current_user_id
  ) then
    return;
  end if;

  insert into public.split_days (
    group_id, owner_user_id, weekday, workout_type, display_name
  )
  select group_id, current_user_id, weekday, workout_type, display_name
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
