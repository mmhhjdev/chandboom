-- Chandboom profile + Dong identity alignment migration
begin;

-- Keep the Dong-facing display name synchronized with the canonical account name.
update public.profiles p
set display_name = coalesce(nullif(trim(u.full_name), ''), p.display_name, p.username)
from public.users u
where u.id = p.id
  and nullif(trim(u.full_name), '') is not null
  and p.display_name is distinct from trim(u.full_name);

create or replace function public.sync_dong_profile_display_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.full_name is distinct from old.full_name and nullif(trim(new.full_name), '') is not null then
    update public.profiles
       set display_name = trim(new.full_name)
     where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_dong_profile_display_name on public.users;
create trigger trg_sync_dong_profile_display_name
after update of full_name on public.users
for each row execute function public.sync_dong_profile_display_name();

-- Existing profiles are created by the auth trigger. Allow each signed-in user
-- to update only their own display_name; username remains immutable.
alter table public.profiles enable row level security;
drop policy if exists profiles_update_display_name on public.profiles;
create policy profiles_update_display_name
on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

commit;
