-- Fix group invite-code generation and create missing profiles
-- for users registered before the profile trigger was working correctly.

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
    candidate := upper(
      substr(
        replace(gen_random_uuid()::text, '-', ''),
        1,
        8
      )
    );

    exit when not exists (
      select 1
      from public.groups
      where invite_code = candidate
    );
  end loop;

  return candidate;
end;
$$;


create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_display_name text;
begin
  resolved_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Athlete'
  );

  if char_length(resolved_display_name) < 2 then
    resolved_display_name := 'Athlete';
  end if;

  insert into public.profiles (
    id,
    display_name
  )
  values (
    new.id,
    resolved_display_name
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


-- Create profiles for existing Auth users that do not have a profile yet.

insert into public.profiles (
  id,
  display_name
)
select
  auth_user.id,
  case
    when char_length(
      coalesce(
        nullif(trim(auth_user.raw_user_meta_data ->> 'display_name'), ''),
        nullif(split_part(coalesce(auth_user.email, ''), '@', 1), ''),
        'Athlete'
      )
    ) >= 2
    then coalesce(
      nullif(trim(auth_user.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(auth_user.email, ''), '@', 1), ''),
      'Athlete'
    )
    else 'Athlete'
  end
from auth.users as auth_user
left join public.profiles as profile
  on profile.id = auth_user.id
where profile.id is null
on conflict (id) do nothing;