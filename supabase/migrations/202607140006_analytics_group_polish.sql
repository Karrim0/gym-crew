-- Phase 7: personal analytics, body-map support, and group social polish.

-- ---------------------------------------------------------------------------
-- Privacy and group split versioning
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists share_workout_summary boolean not null default true,
  add column if not exists share_personal_records boolean not null default true,
  add column if not exists share_weights boolean not null default false;

alter table public.groups
  add column if not exists split_version integer not null default 1,
  add column if not exists split_updated_at timestamptz not null default now();

alter table public.group_members
  add column if not exists seen_split_version integer not null default 1;

update public.group_members member
set seen_split_version = groups.split_version
from public.groups groups
where groups.id = member.group_id;

create or replace function public.set_new_member_split_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select split_version into new.seen_split_version
  from public.groups
  where id = new.group_id;
  return new;
end;
$$;

drop trigger if exists group_member_set_split_version on public.group_members;
create trigger group_member_set_split_version
before insert on public.group_members
for each row execute function public.set_new_member_split_version();

create or replace function public.bump_group_split_version(target_group_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
begin
  update public.groups
  set split_version = split_version + 1,
      split_updated_at = now()
  where id = target_group_id
  returning split_version into next_version;

  if auth.uid() is not null then
    update public.group_members
    set seen_split_version = next_version
    where group_id = target_group_id
      and user_id = auth.uid();
  end if;

  return next_version;
end;
$$;

create or replace function public.handle_group_split_day_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  source_day public.split_days;
begin
  if tg_op = 'DELETE' then
    source_day := old;
  else
    source_day := new;
  end if;
  if source_day.owner_user_id is null then
    perform public.bump_group_split_version(source_day.group_id);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists group_split_day_version_on_insert on public.split_days;
create trigger group_split_day_version_on_insert
after insert on public.split_days
for each row execute function public.handle_group_split_day_change();

drop trigger if exists group_split_day_version_on_update on public.split_days;
create trigger group_split_day_version_on_update
after update of workout_type, display_name on public.split_days
for each row
when (old.workout_type is distinct from new.workout_type or old.display_name is distinct from new.display_name)
execute function public.handle_group_split_day_change();

drop trigger if exists group_split_day_version_on_delete on public.split_days;
create trigger group_split_day_version_on_delete
after delete on public.split_days
for each row execute function public.handle_group_split_day_change();

create or replace function public.handle_group_split_exercise_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  source_exercise public.split_exercises;
  source_day public.split_days;
begin
  if tg_op = 'DELETE' then
    source_exercise := old;
  else
    source_exercise := new;
  end if;
  select * into source_day
  from public.split_days
  where id = source_exercise.split_day_id;

  if source_day.id is not null and source_day.owner_user_id is null then
    perform public.bump_group_split_version(source_day.group_id);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists group_split_exercise_version_on_insert on public.split_exercises;
create trigger group_split_exercise_version_on_insert
after insert on public.split_exercises
for each row execute function public.handle_group_split_exercise_change();

drop trigger if exists group_split_exercise_version_on_update on public.split_exercises;
create trigger group_split_exercise_version_on_update
after update of exercise_id, position, target_sets, target_reps_min, target_reps_max on public.split_exercises
for each row execute function public.handle_group_split_exercise_change();

drop trigger if exists group_split_exercise_version_on_delete on public.split_exercises;
create trigger group_split_exercise_version_on_delete
after delete on public.split_exercises
for each row execute function public.handle_group_split_exercise_change();

create or replace function public.acknowledge_group_split_version(target_group_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_version integer;
begin
  if not public.is_group_member(target_group_id) then
    raise exception 'Not a member of this group';
  end if;

  select split_version into current_version
  from public.groups
  where id = target_group_id;

  update public.group_members
  set seen_split_version = current_version
  where group_id = target_group_id
    and user_id = auth.uid();

  return current_version;
end;
$$;

revoke all on function public.acknowledge_group_split_version(uuid) from public;
grant execute on function public.acknowledge_group_split_version(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Privacy-aware group activity
-- ---------------------------------------------------------------------------

create or replace function public.log_completed_workout_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  should_share boolean;
begin
  if new.status = 'completed' and (
    tg_op = 'INSERT' or old.status is distinct from 'completed'
  ) then
    select share_workout_summary into should_share
    from public.profiles
    where id = new.user_id;

    if coalesce(should_share, true) then
      insert into public.group_activity (group_id, user_id, activity_type, message, metadata)
      values (
        new.group_id,
        new.user_id,
        'workout_completed',
        'Completed a workout',
        jsonb_build_object(
          'workout_session_id', new.id,
          'scheduled_date', new.scheduled_date,
          'duration_seconds', new.duration_seconds
        )
      );
    end if;
  end if;
  return new;
end;
$$;

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

drop trigger if exists personal_record_group_activity_on_insert on public.personal_records;
create trigger personal_record_group_activity_on_insert
after insert on public.personal_records
for each row execute function public.log_personal_record_activity();

drop trigger if exists personal_record_group_activity_on_update on public.personal_records;
create trigger personal_record_group_activity_on_update
after update of value, workout_set_id on public.personal_records
for each row execute function public.log_personal_record_activity();

-- ---------------------------------------------------------------------------
-- Privacy-safe weekly member summaries
-- ---------------------------------------------------------------------------

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
  week_start date := (date_trunc('week', current_date + interval '2 days') - interval '2 days')::date;
begin
  if not public.is_group_member(target_group_id) then
    raise exception 'Not a member of this group';
  end if;

  return query
  with member_base as (
    select
      member.user_id,
      member.role,
      profile.display_name,
      profile.avatar_url,
      profile.additional_rest_days,
      profile.share_workout_summary,
      profile.share_personal_records,
      profile.share_weights
    from public.group_members member
    join public.profiles profile on profile.id = member.user_id
    where member.group_id = target_group_id
  ),
  scheduled as (
    select
      member.user_id,
      count(*)::integer as scheduled_count
    from member_base member
    join public.split_days day
      on day.group_id = target_group_id
      and day.owner_user_id = member.user_id
      and day.workout_type <> 'rest'
    where not (day.weekday = any(member.additional_rest_days))
      and (
        week_start + case day.weekday
          when 'saturday' then 0
          when 'sunday' then 1
          when 'monday' then 2
          when 'tuesday' then 3
          when 'wednesday' then 4
          when 'thursday' then 5
          when 'friday' then 6
        end
      ) <= current_date
    group by member.user_id
  ),
  completed as (
    select
      session.user_id,
      count(distinct session.scheduled_date)::integer as session_count,
      max(coalesce(session.completed_at, session.updated_at)) as last_workout
    from public.workout_sessions session
    where session.group_id = target_group_id
      and session.status = 'completed'
      and session.scheduled_date between week_start and current_date
    group by session.user_id
  ),
  records as (
    select record.user_id, count(*)::integer as record_count
    from public.personal_records record
    join public.group_members member
      on member.user_id = record.user_id
      and member.group_id = target_group_id
    group by record.user_id
  )
  select
    member.user_id,
    member.display_name,
    member.avatar_url,
    member.role,
    case when member.share_workout_summary then coalesce(completed.session_count, 0) else null end,
    case when member.share_workout_summary then coalesce(scheduled.scheduled_count, 0) else null end,
    case
      when not member.share_workout_summary then null
      when coalesce(scheduled.scheduled_count, 0) = 0 then null
      else least(
        100,
        round((coalesce(completed.session_count, 0)::numeric / scheduled.scheduled_count::numeric) * 100, 1)
      )
    end,
    case when member.share_personal_records then coalesce(records.record_count, 0) else null end,
    case when member.share_workout_summary then completed.last_workout else null end,
    member.share_workout_summary,
    member.share_personal_records,
    member.share_weights
  from member_base member
  left join scheduled on scheduled.user_id = member.user_id
  left join completed on completed.user_id = member.user_id
  left join records on records.user_id = member.user_id
  order by
    case
      when member.share_workout_summary and coalesce(scheduled.scheduled_count, 0) > 0
      then least(100, coalesce(completed.session_count, 0)::numeric / scheduled.scheduled_count::numeric * 100)
      else -1
    end desc,
    coalesce(completed.session_count, 0) desc,
    member.display_name;
end;
$$;

revoke all on function public.get_group_member_weekly_stats(uuid) from public;
grant execute on function public.get_group_member_weekly_stats(uuid) to authenticated;

-- Helper functions are not directly callable by clients.
revoke all on function public.bump_group_split_version(uuid) from public;
revoke all on function public.bump_group_split_version(uuid) from authenticated;
