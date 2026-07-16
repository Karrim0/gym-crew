-- Gym Crew v1.4: personal plan setup, fully custom day identity,
-- week-specific schedules, daily consistency streaks and fair crew adherence.

-- ---------------------------------------------------------------------------
-- Profile setup state
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists split_setup_method text,
  add column if not exists split_setup_completed_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_split_setup_method_check;

alter table public.profiles
  add constraint profiles_split_setup_method_check
  check (split_setup_method is null or split_setup_method in ('manual', 'starter', 'imported'));

-- Existing members already have a working split. Do not force them through setup.
update public.profiles
set split_setup_method = coalesce(split_setup_method, 'manual'),
    split_setup_completed_at = coalesce(split_setup_completed_at, timezone('utc', now()));

-- ---------------------------------------------------------------------------
-- Split-day identity and presentation
-- ---------------------------------------------------------------------------

alter table public.split_days
  add column if not exists focus_label text,
  add column if not exists icon_key text not null default 'dumbbell',
  add column if not exists color_key text not null default 'indigo',
  add column if not exists day_notes text not null default '';

update public.split_days
set display_name = coalesce(
      nullif(trim(display_name), ''),
      case workout_type
        when 'push' then 'Push day'
        when 'pull' then 'Pull day'
        when 'legs' then 'Leg day'
        when 'rest' then 'Recovery'
        else 'Training day'
      end
    ),
    focus_label = coalesce(
      nullif(trim(focus_label), ''),
      case workout_type
        when 'push' then 'Push'
        when 'pull' then 'Pull'
        when 'legs' then 'Legs'
        when 'rest' then 'Recovery'
        else 'Custom'
      end
    );

alter table public.split_days
  drop constraint if exists split_days_focus_label_length,
  drop constraint if exists split_days_icon_key_check,
  drop constraint if exists split_days_color_key_check,
  drop constraint if exists split_days_notes_length;

alter table public.split_days
  add constraint split_days_focus_label_length
    check (focus_label is null or char_length(trim(focus_label)) between 2 and 32),
  add constraint split_days_icon_key_check
    check (icon_key in ('dumbbell', 'zap', 'target', 'flame', 'shield', 'heart', 'moon', 'activity')),
  add constraint split_days_color_key_check
    check (color_key in ('indigo', 'blue', 'emerald', 'amber', 'rose', 'violet')),
  add constraint split_days_notes_length
    check (char_length(day_notes) <= 240);

create or replace function public.weekday_index(target_weekday public.weekday)
returns integer
language sql
immutable
set search_path = public
as $$
  select case target_weekday
    when 'saturday' then 0
    when 'sunday' then 1
    when 'monday' then 2
    when 'tuesday' then 3
    when 'wednesday' then 4
    when 'thursday' then 5
    when 'friday' then 6
  end;
$$;

create or replace function public.weekday_from_index(target_index integer)
returns public.weekday
language sql
immutable
set search_path = public
as $$
  select case ((target_index % 7) + 7) % 7
    when 0 then 'saturday'::public.weekday
    when 1 then 'sunday'::public.weekday
    when 2 then 'monday'::public.weekday
    when 3 then 'tuesday'::public.weekday
    when 4 then 'wednesday'::public.weekday
    when 5 then 'thursday'::public.weekday
    when 6 then 'friday'::public.weekday
  end;
$$;

create or replace function public.training_week_start(target_date date)
returns date
language sql
immutable
set search_path = public
as $$
  select target_date - (((extract(dow from target_date)::integer + 1) % 7));
$$;

create or replace function public.assert_base_schedule_has_no_three_rest_days(
  target_group_id uuid,
  target_owner_user_id uuid,
  changed_split_day_id uuid,
  changed_workout_type public.workout_type
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  window_start integer;
  window_step integer;
  checked_weekday public.weekday;
  checked_type public.workout_type;
  rest_count integer;
begin
  for window_start in 0..6 loop
    rest_count := 0;
    for window_step in 0..2 loop
      checked_weekday := public.weekday_from_index(window_start + window_step);
      select case when day.id = changed_split_day_id then changed_workout_type else day.workout_type end
      into checked_type
      from public.split_days day
      where day.group_id = target_group_id
        and day.owner_user_id is not distinct from target_owner_user_id
        and day.weekday = checked_weekday;

      if checked_type = 'rest' then
        rest_count := rest_count + 1;
      end if;
    end loop;

    if rest_count = 3 then
      raise exception 'Your plan cannot contain more than two consecutive rest days';
    end if;
  end loop;
end;
$$;


revoke all on function public.weekday_index(public.weekday) from public;
revoke all on function public.weekday_from_index(integer) from public;
revoke all on function public.training_week_start(date) from public;
revoke all on function public.assert_base_schedule_has_no_three_rest_days(uuid, uuid, uuid, public.workout_type) from public;

-- ---------------------------------------------------------------------------
-- Date-specific weekly schedule snapshots
-- ---------------------------------------------------------------------------

create table if not exists public.weekly_schedule_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  schedule_date date not null,
  source_split_day_id uuid references public.split_days(id) on delete set null,
  workout_type public.workout_type not null,
  display_name text not null check (char_length(trim(display_name)) between 2 and 40),
  focus_label text not null check (char_length(trim(focus_label)) between 2 and 32),
  icon_key text not null default 'dumbbell'
    check (icon_key in ('dumbbell', 'zap', 'target', 'flame', 'shield', 'heart', 'moon', 'activity')),
  color_key text not null default 'indigo'
    check (color_key in ('indigo', 'blue', 'emerald', 'amber', 'rose', 'violet')),
  day_notes text not null default '' check (char_length(day_notes) <= 240),
  is_customized boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, schedule_date)
);

create index if not exists weekly_schedule_days_user_date_idx
  on public.weekly_schedule_days(user_id, schedule_date);

alter table public.weekly_schedule_days enable row level security;

drop policy if exists weekly_schedule_days_owner_all on public.weekly_schedule_days;
create policy weekly_schedule_days_owner_all on public.weekly_schedule_days
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and public.is_group_member(group_id));

drop trigger if exists weekly_schedule_days_set_updated_at on public.weekly_schedule_days;
create trigger weekly_schedule_days_set_updated_at
before update on public.weekly_schedule_days
for each row execute function public.set_updated_at();

-- New members inherit the crew plan's complete identity, not only its old
-- Push/Pull/Legs category. Their personal copy can then diverge safely.
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
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select group_id into current_group_id
  from public.group_members where user_id = current_user_id;
  if current_group_id is null then raise exception 'User does not belong to a training workspace'; end if;

  if exists (
    select 1 from public.split_days
    where group_id = current_group_id and owner_user_id = current_user_id
  ) then
    return;
  end if;

  insert into public.split_days (
    group_id, owner_user_id, weekday, workout_type, display_name,
    focus_label, icon_key, color_key, day_notes
  )
  select
    group_id, current_user_id, weekday, workout_type, display_name,
    focus_label, icon_key, color_key, day_notes
  from public.split_days
  where group_id = current_group_id and owner_user_id is null
  order by public.weekday_index(weekday);

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

-- Resetting the repeating plan also clears materialized future weeks. Without
-- this, week cards could keep stale names and source IDs after the old days are
-- deleted and recreated.
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
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select group_id into current_group_id
  from public.group_members where user_id = current_user_id;
  if current_group_id is null then raise exception 'User does not belong to a training workspace'; end if;

  delete from public.weekly_schedule_days
  where user_id = current_user_id
    and schedule_date >= public.training_week_start(current_date);

  delete from public.split_days
  where group_id = current_group_id and owner_user_id = current_user_id;

  perform public.ensure_personal_split();
end;
$$;

revoke all on function public.ensure_personal_split() from public;
revoke all on function public.reset_personal_split_to_group() from public;
grant execute on function public.ensure_personal_split() to authenticated;
grant execute on function public.reset_personal_split_to_group() to authenticated;

-- Replace the old 3-argument RPC with a complete day-customization RPC.
drop function if exists public.update_split_day_settings(uuid, public.workout_type, text);

create function public.update_split_day_settings(
  target_split_day_id uuid,
  target_workout_type public.workout_type,
  target_display_name text,
  target_focus_label text,
  target_icon_key text,
  target_color_key text,
  target_day_notes text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_day public.split_days;
  normalized_name text := nullif(trim(target_display_name), '');
  normalized_focus text := nullif(trim(target_focus_label), '');
  normalized_icon text := coalesce(nullif(trim(target_icon_key), ''), 'dumbbell');
  normalized_color text := coalesce(nullif(trim(target_color_key), ''), 'indigo');
  normalized_notes text := trim(coalesce(target_day_notes, ''));
  current_week_start date := public.training_week_start(current_date);
begin
  select * into target_day from public.split_days where id = target_split_day_id;
  if target_day.id is null then raise exception 'Split day not found'; end if;

  if not (
    (target_day.owner_user_id = auth.uid() and public.is_group_member(target_day.group_id))
    or
    (target_day.owner_user_id is null and public.is_group_admin(target_day.group_id))
  ) then
    raise exception 'Not allowed to edit this split day';
  end if;

  if normalized_name is null or char_length(normalized_name) not between 2 and 40 then
    raise exception 'Day name must be between 2 and 40 characters';
  end if;
  if normalized_focus is null or char_length(normalized_focus) not between 2 and 32 then
    raise exception 'Focus label must be between 2 and 32 characters';
  end if;
  if normalized_icon not in ('dumbbell', 'zap', 'target', 'flame', 'shield', 'heart', 'moon', 'activity') then
    raise exception 'Unsupported day icon';
  end if;
  if normalized_color not in ('indigo', 'blue', 'emerald', 'amber', 'rose', 'violet') then
    raise exception 'Unsupported day color';
  end if;
  if char_length(normalized_notes) > 240 then raise exception 'Day notes are too long'; end if;

  perform public.assert_base_schedule_has_no_three_rest_days(
    target_day.group_id,
    target_day.owner_user_id,
    target_day.id,
    target_workout_type
  );

  update public.split_days
  set workout_type = target_workout_type,
      display_name = normalized_name,
      focus_label = normalized_focus,
      icon_key = normalized_icon,
      color_key = normalized_color,
      day_notes = normalized_notes
  where id = target_split_day_id;

  -- Keep already materialized future weeks in sync unless the athlete customized
  -- that particular date.
  update public.weekly_schedule_days weekly
  set workout_type = target_workout_type,
      display_name = normalized_name,
      focus_label = normalized_focus,
      icon_key = normalized_icon,
      color_key = normalized_color,
      day_notes = normalized_notes
  where weekly.source_split_day_id = target_split_day_id
    and weekly.schedule_date >= current_week_start
    and not weekly.is_customized;
end;
$$;

revoke all on function public.update_split_day_settings(uuid, public.workout_type, text, text, text, text, text) from public;
grant execute on function public.update_split_day_settings(uuid, public.workout_type, text, text, text, text, text) to authenticated;


create or replace function public.ensure_week_schedule(target_anchor_date date default current_date)
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_group_id uuid;
  week_start date := public.training_week_start(target_anchor_date);
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select group_id into current_group_id from public.group_members where user_id = current_user_id;
  if current_group_id is null then raise exception 'User does not belong to a training workspace'; end if;

  perform public.ensure_personal_split();

  insert into public.weekly_schedule_days (
    user_id, group_id, schedule_date, source_split_day_id, workout_type,
    display_name, focus_label, icon_key, color_key, day_notes, is_customized
  )
  select
    current_user_id,
    current_group_id,
    week_start + public.weekday_index(day.weekday),
    day.id,
    day.workout_type,
    coalesce(nullif(trim(day.display_name), ''), initcap(day.workout_type::text) || ' day'),
    coalesce(nullif(trim(day.focus_label), ''), initcap(day.workout_type::text)),
    day.icon_key,
    day.color_key,
    day.day_notes,
    false
  from public.split_days day
  where day.group_id = current_group_id
    and day.owner_user_id = current_user_id
  on conflict (user_id, schedule_date) do nothing;

  return week_start;
end;
$$;

create or replace function public.assert_week_schedule_has_no_three_rest_days(
  target_user_id uuid,
  changed_date date,
  changed_workout_type public.workout_type
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  window_start date;
  window_step integer;
  checked_type public.workout_type;
  rest_count integer;
begin
  for window_start in select generate_series(changed_date - 2, changed_date, interval '1 day')::date loop
    rest_count := 0;
    for window_step in 0..2 loop
      select case
        when weekly.schedule_date = changed_date then changed_workout_type
        else weekly.workout_type
      end
      into checked_type
      from public.weekly_schedule_days weekly
      where weekly.user_id = target_user_id
        and weekly.schedule_date = window_start + window_step;

      if checked_type = 'rest' then rest_count := rest_count + 1; end if;
    end loop;

    if rest_count = 3 then
      raise exception 'Your plan cannot contain more than two consecutive rest days';
    end if;
  end loop;
end;
$$;

create or replace function public.update_week_schedule_day(
  target_schedule_date date,
  target_source_split_day_id uuid,
  target_workout_type public.workout_type,
  target_display_name text,
  target_focus_label text,
  target_icon_key text,
  target_color_key text,
  target_day_notes text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_group_id uuid;
  source_day public.split_days;
  normalized_name text := nullif(trim(target_display_name), '');
  normalized_focus text := nullif(trim(target_focus_label), '');
  normalized_notes text := trim(coalesce(target_day_notes, ''));
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select group_id into current_group_id from public.group_members where user_id = current_user_id;
  if current_group_id is null then raise exception 'User does not belong to a training workspace'; end if;

  -- Materialize adjacent weeks too so the two-consecutive-rest rule is checked
  -- correctly across Saturday/Friday boundaries.
  perform public.ensure_week_schedule(target_schedule_date - 7);
  perform public.ensure_week_schedule(target_schedule_date);
  perform public.ensure_week_schedule(target_schedule_date + 7);

  select * into source_day from public.split_days where id = target_source_split_day_id;
  if source_day.id is null or source_day.owner_user_id <> current_user_id or source_day.group_id <> current_group_id then
    raise exception 'Choose a workout from your own split';
  end if;

  if normalized_name is null or char_length(normalized_name) not between 2 and 40 then
    raise exception 'Day name must be between 2 and 40 characters';
  end if;
  if normalized_focus is null or char_length(normalized_focus) not between 2 and 32 then
    raise exception 'Focus label must be between 2 and 32 characters';
  end if;
  if target_icon_key not in ('dumbbell', 'zap', 'target', 'flame', 'shield', 'heart', 'moon', 'activity') then
    raise exception 'Unsupported day icon';
  end if;
  if target_color_key not in ('indigo', 'blue', 'emerald', 'amber', 'rose', 'violet') then
    raise exception 'Unsupported day color';
  end if;
  if char_length(normalized_notes) > 240 then raise exception 'Day notes are too long'; end if;

  perform public.assert_week_schedule_has_no_three_rest_days(
    current_user_id,
    target_schedule_date,
    target_workout_type
  );

  update public.weekly_schedule_days
  set source_split_day_id = target_source_split_day_id,
      workout_type = target_workout_type,
      display_name = normalized_name,
      focus_label = normalized_focus,
      icon_key = target_icon_key,
      color_key = target_color_key,
      day_notes = normalized_notes,
      is_customized = true
  where user_id = current_user_id and schedule_date = target_schedule_date;
end;
$$;

create or replace function public.reset_week_schedule(target_anchor_date date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  week_start date := public.training_week_start(target_anchor_date);
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  delete from public.weekly_schedule_days
  where user_id = current_user_id and schedule_date between week_start and week_start + 6;
  perform public.ensure_week_schedule(target_anchor_date);
end;
$$;

revoke all on function public.assert_week_schedule_has_no_three_rest_days(uuid, date, public.workout_type) from public;
revoke all on function public.ensure_week_schedule(date) from public;
revoke all on function public.update_week_schedule_day(date, uuid, public.workout_type, text, text, text, text, text) from public;
revoke all on function public.reset_week_schedule(date) from public;
grant execute on function public.ensure_week_schedule(date) to authenticated;
grant execute on function public.update_week_schedule_day(date, uuid, public.workout_type, text, text, text, text, text) to authenticated;
grant execute on function public.reset_week_schedule(date) to authenticated;

-- ---------------------------------------------------------------------------
-- Starter templates and imported plans
-- ---------------------------------------------------------------------------

create or replace function public.set_personal_day(
  target_user_id uuid,
  target_group_id uuid,
  target_weekday public.weekday,
  target_workout_type public.workout_type,
  target_display_name text,
  target_focus_label text,
  target_icon_key text,
  target_color_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_day_id uuid;
begin
  update public.split_days
  set workout_type = target_workout_type,
      display_name = target_display_name,
      focus_label = target_focus_label,
      icon_key = target_icon_key,
      color_key = target_color_key,
      day_notes = ''
  where group_id = target_group_id and owner_user_id = target_user_id and weekday = target_weekday
  returning id into target_day_id;
  return target_day_id;
end;
$$;

create or replace function public.add_template_exercise(
  target_split_day_id uuid,
  target_exercise_name text,
  target_position integer,
  target_sets integer,
  target_reps_min integer,
  target_reps_max integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_exercise_id uuid;
begin
  select id into target_exercise_id
  from public.exercises
  where created_by is null and lower(name) = lower(target_exercise_name)
  limit 1;

  if target_exercise_id is not null then
    insert into public.split_exercises (
      split_day_id, exercise_id, position, target_sets,
      target_reps_min, target_reps_max, is_personal_addition
    ) values (
      target_split_day_id, target_exercise_id, target_position, target_sets,
      target_reps_min, target_reps_max, false
    ) on conflict (split_day_id, exercise_id) do nothing;
  end if;
end;
$$;

create or replace function public.apply_split_template(target_template_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_group_id uuid;
  sat uuid; sun uuid; mon uuid; tue uuid; wed uuid; thu uuid; fri uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select group_id into current_group_id from public.group_members where user_id = current_user_id;
  if current_group_id is null then raise exception 'User does not belong to a training workspace'; end if;
  if target_template_key not in ('manual', 'full_body_3', 'upper_lower_4', 'ppl_ul_5', 'ppl_6') then
    raise exception 'Unknown starter plan';
  end if;

  perform public.ensure_personal_split();
  delete from public.split_exercises exercise
  using public.split_days day
  where exercise.split_day_id = day.id and day.owner_user_id = current_user_id;

  if target_template_key = 'manual' then
    sat := public.set_personal_day(current_user_id, current_group_id, 'saturday', 'custom', 'Saturday training', 'Custom', 'dumbbell', 'indigo');
    sun := public.set_personal_day(current_user_id, current_group_id, 'sunday', 'custom', 'Sunday training', 'Custom', 'dumbbell', 'blue');
    mon := public.set_personal_day(current_user_id, current_group_id, 'monday', 'custom', 'Monday training', 'Custom', 'dumbbell', 'emerald');
    tue := public.set_personal_day(current_user_id, current_group_id, 'tuesday', 'custom', 'Tuesday training', 'Custom', 'dumbbell', 'amber');
    wed := public.set_personal_day(current_user_id, current_group_id, 'wednesday', 'custom', 'Wednesday training', 'Custom', 'dumbbell', 'violet');
    thu := public.set_personal_day(current_user_id, current_group_id, 'thursday', 'custom', 'Thursday training', 'Custom', 'dumbbell', 'rose');
    fri := public.set_personal_day(current_user_id, current_group_id, 'friday', 'custom', 'Friday training', 'Custom', 'dumbbell', 'indigo');
  elsif target_template_key = 'full_body_3' then
    sat := public.set_personal_day(current_user_id, current_group_id, 'saturday', 'custom', 'Full body A', 'Full body', 'activity', 'indigo');
    sun := public.set_personal_day(current_user_id, current_group_id, 'sunday', 'rest', 'Recovery', 'Recovery', 'moon', 'blue');
    mon := public.set_personal_day(current_user_id, current_group_id, 'monday', 'custom', 'Full body B', 'Full body', 'activity', 'violet');
    tue := public.set_personal_day(current_user_id, current_group_id, 'tuesday', 'rest', 'Recovery', 'Recovery', 'moon', 'blue');
    wed := public.set_personal_day(current_user_id, current_group_id, 'wednesday', 'custom', 'Full body C', 'Full body', 'activity', 'emerald');
    thu := public.set_personal_day(current_user_id, current_group_id, 'thursday', 'rest', 'Recovery', 'Recovery', 'moon', 'blue');
    fri := public.set_personal_day(current_user_id, current_group_id, 'friday', 'rest', 'Recovery', 'Recovery', 'moon', 'blue');

    perform public.add_template_exercise(sat, 'Back Squat', 0, 2, 6, 10);
    perform public.add_template_exercise(sat, 'Bench Press', 1, 2, 6, 10);
    perform public.add_template_exercise(sat, 'Lat Pulldown', 2, 2, 8, 12);
    perform public.add_template_exercise(sat, 'Romanian Deadlift', 3, 2, 8, 12);
    perform public.add_template_exercise(mon, 'Leg Press', 0, 2, 8, 12);
    perform public.add_template_exercise(mon, 'Overhead Press', 1, 2, 6, 10);
    perform public.add_template_exercise(mon, 'Seated Cable Row', 2, 2, 8, 12);
    perform public.add_template_exercise(mon, 'Leg Curl', 3, 2, 10, 15);
    perform public.add_template_exercise(wed, 'Back Squat', 0, 2, 8, 12);
    perform public.add_template_exercise(wed, 'Incline Dumbbell Press', 1, 2, 8, 12);
    perform public.add_template_exercise(wed, 'Barbell Row', 2, 2, 6, 10);
    perform public.add_template_exercise(wed, 'Standing Calf Raise', 3, 2, 10, 20);
  elsif target_template_key = 'upper_lower_4' then
    sat := public.set_personal_day(current_user_id, current_group_id, 'saturday', 'custom', 'Upper A', 'Upper body', 'dumbbell', 'indigo');
    sun := public.set_personal_day(current_user_id, current_group_id, 'sunday', 'custom', 'Lower A', 'Lower body', 'activity', 'emerald');
    mon := public.set_personal_day(current_user_id, current_group_id, 'monday', 'rest', 'Recovery', 'Recovery', 'moon', 'blue');
    tue := public.set_personal_day(current_user_id, current_group_id, 'tuesday', 'custom', 'Upper B', 'Upper body', 'dumbbell', 'violet');
    wed := public.set_personal_day(current_user_id, current_group_id, 'wednesday', 'custom', 'Lower B', 'Lower body', 'activity', 'amber');
    thu := public.set_personal_day(current_user_id, current_group_id, 'thursday', 'rest', 'Recovery', 'Recovery', 'moon', 'blue');
    fri := public.set_personal_day(current_user_id, current_group_id, 'friday', 'rest', 'Recovery', 'Recovery', 'moon', 'blue');

    perform public.add_template_exercise(sat, 'Bench Press', 0, 2, 6, 10);
    perform public.add_template_exercise(sat, 'Barbell Row', 1, 2, 6, 10);
    perform public.add_template_exercise(sat, 'Overhead Press', 2, 2, 8, 12);
    perform public.add_template_exercise(sat, 'Lat Pulldown', 3, 2, 8, 12);
    perform public.add_template_exercise(sun, 'Back Squat', 0, 2, 6, 10);
    perform public.add_template_exercise(sun, 'Romanian Deadlift', 1, 2, 8, 12);
    perform public.add_template_exercise(sun, 'Leg Extension', 2, 2, 10, 15);
    perform public.add_template_exercise(tue, 'Incline Dumbbell Press', 0, 2, 8, 12);
    perform public.add_template_exercise(tue, 'Seated Cable Row', 1, 2, 8, 12);
    perform public.add_template_exercise(tue, 'Lateral Raise', 2, 2, 12, 20);
    perform public.add_template_exercise(tue, 'Hammer Curl', 3, 2, 10, 15);
    perform public.add_template_exercise(wed, 'Leg Press', 0, 2, 8, 12);
    perform public.add_template_exercise(wed, 'Leg Curl', 1, 2, 10, 15);
    perform public.add_template_exercise(wed, 'Standing Calf Raise', 2, 2, 10, 20);
  elsif target_template_key = 'ppl_ul_5' then
    sat := public.set_personal_day(current_user_id, current_group_id, 'saturday', 'push', 'Push', 'Chest, shoulders & triceps', 'zap', 'indigo');
    sun := public.set_personal_day(current_user_id, current_group_id, 'sunday', 'pull', 'Pull', 'Back & biceps', 'target', 'blue');
    mon := public.set_personal_day(current_user_id, current_group_id, 'monday', 'legs', 'Legs', 'Lower body', 'activity', 'emerald');
    tue := public.set_personal_day(current_user_id, current_group_id, 'tuesday', 'rest', 'Recovery', 'Recovery', 'moon', 'blue');
    wed := public.set_personal_day(current_user_id, current_group_id, 'wednesday', 'custom', 'Upper', 'Upper body', 'dumbbell', 'violet');
    thu := public.set_personal_day(current_user_id, current_group_id, 'thursday', 'custom', 'Lower', 'Lower body', 'activity', 'amber');
    fri := public.set_personal_day(current_user_id, current_group_id, 'friday', 'rest', 'Recovery', 'Recovery', 'moon', 'blue');
    perform public.seed_group_split(current_group_id);
    -- Copy the standard P/P/L movements from the shared split into matching personal days.
    insert into public.split_exercises (split_day_id, exercise_id, position, target_sets, target_reps_min, target_reps_max, is_personal_addition)
    select personal.id, shared_ex.exercise_id, shared_ex.position, shared_ex.target_sets, shared_ex.target_reps_min, shared_ex.target_reps_max, false
    from public.split_days shared
    join public.split_exercises shared_ex on shared_ex.split_day_id = shared.id
    join public.split_days personal on personal.group_id = shared.group_id and personal.owner_user_id = current_user_id and personal.workout_type = shared.workout_type
    where shared.group_id = current_group_id and shared.owner_user_id is null and shared.workout_type in ('push','pull','legs')
    on conflict (split_day_id, exercise_id) do nothing;
    perform public.add_template_exercise(wed, 'Bench Press', 0, 2, 6, 10);
    perform public.add_template_exercise(wed, 'Seated Cable Row', 1, 2, 8, 12);
    perform public.add_template_exercise(wed, 'Overhead Press', 2, 2, 8, 12);
    perform public.add_template_exercise(thu, 'Back Squat', 0, 2, 6, 10);
    perform public.add_template_exercise(thu, 'Romanian Deadlift', 1, 2, 8, 12);
    perform public.add_template_exercise(thu, 'Leg Press', 2, 2, 10, 15);
  else
    sat := public.set_personal_day(current_user_id, current_group_id, 'saturday', 'push', 'Push A', 'Chest, shoulders & triceps', 'zap', 'indigo');
    sun := public.set_personal_day(current_user_id, current_group_id, 'sunday', 'pull', 'Pull A', 'Back & biceps', 'target', 'blue');
    mon := public.set_personal_day(current_user_id, current_group_id, 'monday', 'legs', 'Legs A', 'Lower body', 'activity', 'emerald');
    tue := public.set_personal_day(current_user_id, current_group_id, 'tuesday', 'push', 'Push B', 'Chest, shoulders & triceps', 'zap', 'violet');
    wed := public.set_personal_day(current_user_id, current_group_id, 'wednesday', 'pull', 'Pull B', 'Back & biceps', 'target', 'amber');
    thu := public.set_personal_day(current_user_id, current_group_id, 'thursday', 'legs', 'Legs B', 'Lower body', 'activity', 'rose');
    fri := public.set_personal_day(current_user_id, current_group_id, 'friday', 'rest', 'Recovery', 'Recovery', 'moon', 'blue');
    perform public.seed_group_split(current_group_id);
    insert into public.split_exercises (split_day_id, exercise_id, position, target_sets, target_reps_min, target_reps_max, is_personal_addition)
    select personal.id, shared_ex.exercise_id, shared_ex.position, shared_ex.target_sets, shared_ex.target_reps_min, shared_ex.target_reps_max, false
    from public.split_days shared
    join public.split_exercises shared_ex on shared_ex.split_day_id = shared.id
    join public.split_days personal on personal.group_id = shared.group_id and personal.owner_user_id = current_user_id and personal.workout_type = shared.workout_type
    where shared.group_id = current_group_id and shared.owner_user_id is null and shared.workout_type in ('push','pull','legs')
    on conflict (split_day_id, exercise_id) do nothing;
  end if;

  delete from public.weekly_schedule_days where user_id = current_user_id and schedule_date >= public.training_week_start(current_date);
  update public.profiles
  set split_setup_method = case when target_template_key = 'manual' then 'manual' else 'starter' end,
      split_setup_completed_at = timezone('utc', now())
  where id = current_user_id;
end;
$$;

create or replace function public.apply_imported_split(target_plan jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_group_id uuid;
  day_json jsonb;
  exercise_json jsonb;
  target_day public.split_days;
  target_exercise_id uuid;
  target_weekday public.weekday;
  target_workout_type public.workout_type;
  position_index integer;
  imported_weekdays public.weekday[] := '{}';
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select group_id into current_group_id from public.group_members where user_id = current_user_id;
  if current_group_id is null then raise exception 'User does not belong to a training workspace'; end if;
  if jsonb_typeof(target_plan->'days') <> 'array' then raise exception 'Imported plan must contain days'; end if;

  perform public.ensure_personal_split();
  delete from public.split_exercises exercise
  using public.split_days day
  where exercise.split_day_id = day.id and day.owner_user_id = current_user_id;

  -- Start from recovery days; imported days then replace them.
  update public.split_days
  set workout_type = 'rest', display_name = 'Recovery', focus_label = 'Recovery', icon_key = 'moon', color_key = 'blue', day_notes = ''
  where group_id = current_group_id and owner_user_id = current_user_id;

  for day_json in select * from jsonb_array_elements(target_plan->'days') loop
    target_weekday := (day_json->>'weekday')::public.weekday;
    if target_weekday = any(imported_weekdays) then raise exception 'A weekday appears more than once'; end if;
    imported_weekdays := array_append(imported_weekdays, target_weekday);
    target_workout_type := coalesce((day_json->>'workoutType')::public.workout_type, 'custom');

    update public.split_days
    set workout_type = target_workout_type,
        display_name = left(coalesce(nullif(trim(day_json->>'title'), ''), initcap(target_workout_type::text) || ' day'), 40),
        focus_label = left(coalesce(nullif(trim(day_json->>'focus'), ''), initcap(target_workout_type::text)), 32),
        icon_key = case when day_json->>'iconKey' in ('dumbbell','zap','target','flame','shield','heart','moon','activity') then day_json->>'iconKey' else case when target_workout_type = 'rest' then 'moon' else 'dumbbell' end end,
        color_key = case when day_json->>'colorKey' in ('indigo','blue','emerald','amber','rose','violet') then day_json->>'colorKey' else 'indigo' end,
        day_notes = left(coalesce(day_json->>'notes', ''), 240)
    where group_id = current_group_id and owner_user_id = current_user_id and weekday = target_weekday
    returning * into target_day;

    if target_workout_type <> 'rest' and jsonb_typeof(day_json->'exercises') = 'array' then
      position_index := 0;
      for exercise_json in select * from jsonb_array_elements(day_json->'exercises') loop
        select id into target_exercise_id
        from public.exercises
        where (created_by is null or created_by = current_user_id)
          and lower(name) = lower(trim(exercise_json->>'name'))
        order by created_by nulls first
        limit 1;

        if target_exercise_id is null then
          insert into public.exercises (
            name, primary_muscle, secondary_muscles, workout_type, is_custom, created_by
          ) values (
            left(trim(exercise_json->>'name'), 100),
            coalesce((exercise_json->>'primaryMuscle')::public.muscle_group, 'core'),
            '{}', 'custom', true, current_user_id
          ) returning id into target_exercise_id;
        end if;

        insert into public.split_exercises (
          split_day_id, exercise_id, position, target_sets,
          target_reps_min, target_reps_max, is_personal_addition
        ) values (
          target_day.id,
          target_exercise_id,
          position_index,
          greatest(1, least(20, coalesce((exercise_json->>'sets')::integer, 2))),
          greatest(1, least(100, coalesce((exercise_json->>'repsMin')::integer, 8))),
          greatest(
            greatest(1, least(100, coalesce((exercise_json->>'repsMin')::integer, 8))),
            least(100, coalesce((exercise_json->>'repsMax')::integer, coalesce((exercise_json->>'repsMin')::integer, 12)))
          ),
          true
        ) on conflict (split_day_id, exercise_id) do nothing;
        position_index := position_index + 1;
      end loop;
    end if;
  end loop;

  -- Validate the complete repeating week after import.
  perform public.assert_base_schedule_has_no_three_rest_days(
    current_group_id,
    current_user_id,
    (select id from public.split_days where group_id = current_group_id and owner_user_id = current_user_id limit 1),
    (select workout_type from public.split_days where group_id = current_group_id and owner_user_id = current_user_id limit 1)
  );

  delete from public.weekly_schedule_days where user_id = current_user_id and schedule_date >= public.training_week_start(current_date);
  update public.profiles
  set split_setup_method = 'imported', split_setup_completed_at = timezone('utc', now())
  where id = current_user_id;
end;
$$;

revoke all on function public.set_personal_day(uuid, uuid, public.weekday, public.workout_type, text, text, text, text) from public;
revoke all on function public.add_template_exercise(uuid, text, integer, integer, integer, integer) from public;
revoke all on function public.apply_split_template(text) from public;
revoke all on function public.apply_imported_split(jsonb) from public;
grant execute on function public.apply_split_template(text) to authenticated;
grant execute on function public.apply_imported_split(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Daily consistency streak and weekly crew fairness
-- ---------------------------------------------------------------------------

create or replace function public.get_daily_consistency_streak()
returns table (current_streak_days integer, longest_streak_days integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  first_date date;
  cursor_date date;
  effective_type public.workout_type;
  completed boolean;
  successful boolean;
  running integer := 0;
  longest integer := 0;
  current_value integer := 0;
  current_broken boolean := false;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select min(scheduled_date) into first_date
  from public.workout_sessions
  where user_id = current_user_id and status = 'completed';

  if first_date is null then
    return query select 0, 0;
    return;
  end if;

  for cursor_date in select generate_series(first_date, current_date, interval '1 day')::date loop
    select coalesce(weekly.workout_type, base.workout_type)
    into effective_type
    from public.split_days base
    left join public.weekly_schedule_days weekly
      on weekly.user_id = current_user_id and weekly.schedule_date = cursor_date
    where base.owner_user_id = current_user_id
      and base.weekday = case extract(dow from cursor_date)::integer
        when 0 then 'sunday'::public.weekday when 1 then 'monday'::public.weekday
        when 2 then 'tuesday'::public.weekday when 3 then 'wednesday'::public.weekday
        when 4 then 'thursday'::public.weekday when 5 then 'friday'::public.weekday
        when 6 then 'saturday'::public.weekday end
    limit 1;

    select exists (
      select 1 from public.workout_sessions session
      where session.user_id = current_user_id
        and session.status = 'completed'
        and session.scheduled_date = cursor_date
    ) into completed;

    successful := effective_type = 'rest' or completed;
    -- Today's planned workout is still open and should not break the streak.
    if cursor_date = current_date and effective_type <> 'rest' and not completed then
      continue;
    end if;

    if successful then
      running := running + 1;
      longest := greatest(longest, running);
    else
      running := 0;
    end if;
  end loop;

  -- Walk backwards to calculate the currently active daily streak.
  cursor_date := current_date;
  while cursor_date >= first_date and not current_broken loop
    select coalesce(weekly.workout_type, base.workout_type)
    into effective_type
    from public.split_days base
    left join public.weekly_schedule_days weekly
      on weekly.user_id = current_user_id and weekly.schedule_date = cursor_date
    where base.owner_user_id = current_user_id
      and base.weekday = case extract(dow from cursor_date)::integer
        when 0 then 'sunday'::public.weekday when 1 then 'monday'::public.weekday
        when 2 then 'tuesday'::public.weekday when 3 then 'wednesday'::public.weekday
        when 4 then 'thursday'::public.weekday when 5 then 'friday'::public.weekday
        when 6 then 'saturday'::public.weekday end
    limit 1;

    select exists (
      select 1 from public.workout_sessions session
      where session.user_id = current_user_id
        and session.status = 'completed'
        and session.scheduled_date = cursor_date
    ) into completed;

    if cursor_date = current_date and effective_type <> 'rest' and not completed then
      cursor_date := cursor_date - 1;
      continue;
    end if;

    if effective_type = 'rest' or completed then
      current_value := current_value + 1;
      cursor_date := cursor_date - 1;
    else
      current_broken := true;
    end if;
  end loop;

  return query select current_value, longest;
end;
$$;

create or replace function public.get_group_member_weekly_stats(target_group_id uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  role public.group_role,
  sessions_this_week integer,
  scheduled_this_week integer,
  adherence_percent numeric,
  personal_records_count integer,
  last_workout_at timestamptz,
  share_workout_summary boolean,
  share_personal_records boolean,
  share_weights boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  week_start date := public.training_week_start(current_date);
begin
  if not public.is_group_member(target_group_id) then raise exception 'Not a member of this group'; end if;

  return query
  with member_base as (
    select member.user_id, member.role, profile.display_name, profile.avatar_url,
      profile.share_workout_summary, profile.share_personal_records, profile.share_weights
    from public.group_members member
    join public.profiles profile on profile.id = member.user_id
    where member.group_id = target_group_id
  ),
  calendar as (
    select member.user_id, day::date as schedule_date
    from member_base member
    cross join generate_series(week_start, current_date, interval '1 day') day
  ),
  effective_schedule as (
    select calendar.user_id, calendar.schedule_date,
      coalesce(weekly.workout_type, base.workout_type) as workout_type
    from calendar
    join public.split_days base
      on base.group_id = target_group_id
      and base.owner_user_id = calendar.user_id
      and base.weekday = case extract(dow from calendar.schedule_date)::integer
        when 0 then 'sunday'::public.weekday when 1 then 'monday'::public.weekday
        when 2 then 'tuesday'::public.weekday when 3 then 'wednesday'::public.weekday
        when 4 then 'thursday'::public.weekday when 5 then 'friday'::public.weekday
        when 6 then 'saturday'::public.weekday end
    left join public.weekly_schedule_days weekly
      on weekly.user_id = calendar.user_id and weekly.schedule_date = calendar.schedule_date
  ),
  scheduled as (
    select user_id, count(*)::integer as scheduled_count
    from effective_schedule where workout_type <> 'rest' group by user_id
  ),
  completed as (
    select schedule.user_id,
      count(distinct session.scheduled_date)::integer as session_count,
      max(coalesce(session.completed_at, session.updated_at)) as last_workout
    from effective_schedule schedule
    join public.workout_sessions session
      on session.user_id = schedule.user_id
      and session.group_id = target_group_id
      and session.status = 'completed'
      and session.scheduled_date = schedule.schedule_date
    where schedule.workout_type <> 'rest'
    group by schedule.user_id
  ),
  records as (
    select record.user_id, count(*)::integer as record_count
    from public.personal_records record
    join public.group_members member on member.user_id = record.user_id and member.group_id = target_group_id
    group by record.user_id
  )
  select member.user_id, member.display_name, member.avatar_url, member.role,
    case when member.share_workout_summary then coalesce(completed.session_count, 0) else null end,
    case when member.share_workout_summary then coalesce(scheduled.scheduled_count, 0) else null end,
    case when not member.share_workout_summary or coalesce(scheduled.scheduled_count, 0) = 0 then null
      else least(100, round(coalesce(completed.session_count, 0)::numeric / scheduled.scheduled_count::numeric * 100, 1)) end,
    case when member.share_personal_records then coalesce(records.record_count, 0) else null end,
    case when member.share_workout_summary then completed.last_workout else null end,
    member.share_workout_summary, member.share_personal_records, member.share_weights
  from member_base member
  left join scheduled on scheduled.user_id = member.user_id
  left join completed on completed.user_id = member.user_id
  left join records on records.user_id = member.user_id
  order by adherence_percent desc nulls last, sessions_this_week desc nulls last, display_name;
end;
$$;

revoke all on function public.get_daily_consistency_streak() from public;
grant execute on function public.get_daily_consistency_streak() to authenticated;
