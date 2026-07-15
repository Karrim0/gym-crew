-- Gym Crew v1.2: flexible weekly schedules and safer active workout handling.
-- Rest days now live directly on split_days. No weekday is forced to rest.

-- Remove the legacy rule before migrating non-Friday rest days.
-- The old constraint only allowed Friday to be rest and blocked this data migration.
alter table public.split_days
  drop constraint if exists split_days_fixed_friday;

-- Migrate legacy additional rest-day choices into each member's personal split
-- before clearing the compatibility column.
update public.split_days day
set workout_type = 'rest'
from public.profiles profile
where day.owner_user_id = profile.id
  and day.weekday = any(profile.additional_rest_days)
  and day.workout_type <> 'rest';

update public.profiles
set additional_rest_days = '{}';

alter table public.profiles
  drop constraint if exists profiles_max_additional_rest_days,
  drop constraint if exists profiles_friday_is_not_personal_rest_day,
  drop constraint if exists profiles_additional_rest_days_unique;

comment on column public.profiles.additional_rest_days is
  'Deprecated compatibility field. Rest days are stored as split_days.workout_type = rest.';

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

-- Resolve any historical duplicate active sessions before enforcing the rule.
with ranked_active as (
  select id,
         row_number() over (partition by user_id order by started_at desc, updated_at desc) as row_number
  from public.workout_sessions
  where status = 'in_progress'
)
update public.workout_sessions session
set status = 'cancelled',
    updated_at = timezone('utc', now())
from ranked_active ranked
where session.id = ranked.id
  and ranked.row_number > 1;

create unique index if not exists workout_sessions_one_active_per_user
  on public.workout_sessions(user_id)
  where status = 'in_progress';

-- Weekly crew stats now derive scheduled days from each personal split only.
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
    where (
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
    join public.split_days planned_day
      on planned_day.group_id = target_group_id
      and planned_day.owner_user_id = session.user_id
      and planned_day.workout_type <> 'rest'
      and planned_day.weekday = case extract(dow from session.scheduled_date)::integer
        when 0 then 'sunday'::public.weekday
        when 1 then 'monday'::public.weekday
        when 2 then 'tuesday'::public.weekday
        when 3 then 'wednesday'::public.weekday
        when 4 then 'thursday'::public.weekday
        when 5 then 'friday'::public.weekday
        when 6 then 'saturday'::public.weekday
      end
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
      else least(100, round((coalesce(completed.session_count, 0)::numeric / scheduled.scheduled_count::numeric) * 100, 1))
    end,
    case when member.share_personal_records then coalesce(records.record_count, 0) else null end,
    case when member.share_workout_summary then completed.last_workout else null end,
    member.share_workout_summary,
    member.share_personal_records,
    member.share_weights
  from member_base member
  left join scheduled on scheduled.user_id = member.user_id
  left join completed on completed.user_id = member.user_id
  left join records on records.user_id = member.user_id;
end;
$$;
