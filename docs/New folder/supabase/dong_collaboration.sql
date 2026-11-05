-- Chandboom / چندبوم — Dong collaboration and permanent usernames
-- Additive migration. Does not drop existing tables or delete existing expenses.
-- Run in Supabase SQL Editor after the project's base schema/alignment migration.

begin;
create extension if not exists pgcrypto;

-- Normalize columns used by the current frontend without overwriting existing rows.
alter table public.dong_groups add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.dong_groups add column if not exists created_by uuid references auth.users(id) on delete cascade;
alter table public.dong_groups add column if not exists is_family_mode boolean not null default false;
alter table public.dong_groups add column if not exists families jsonb not null default '[]'::jsonb;
alter table public.dong_groups add column if not exists members text[] not null default '{}';

alter table public.dong_expenses add column if not exists title text;
alter table public.dong_expenses add column if not exists participants text[] not null default '{}';
alter table public.dong_expenses add column if not exists is_itemized boolean not null default false;
alter table public.dong_expenses add column if not exists bill_items jsonb not null default '[]'::jsonb;

-- Preserve older rows where the previous schema called the expense title "description".
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='dong_expenses' and column_name='description') then
    execute 'update public.dong_expenses set title = coalesce(title, description, ''هزینه قبلی'') where title is null';
  else
    update public.dong_expenses set title = 'هزینه قبلی' where title is null;
  end if;
end $$;
update public.dong_expenses set title = 'هزینه قبلی' where title is null;
alter table public.dong_expenses alter column title set not null;

-- Minimal public profile: no email, financial data, or private account fields are exposed here.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$')
);
create index if not exists profiles_username_prefix_idx on public.profiles (lower(username) text_pattern_ops);

create or replace function public.dong_generate_username()
returns text language plpgsql security definer set search_path = public, auth as $$
declare v_candidate text; v_base text;
begin
  v_base := lower(regexp_replace(coalesce(nullif(auth.jwt()->'user_metadata'->>'username',''), nullif(auth.jwt()->'user_metadata'->>'full_name',''), 'user'), '[^a-zA-Z0-9_]', '', 'g'));
  v_base := left(coalesce(nullif(v_base,''),'user'), 12);
  loop
    v_candidate := v_base || '_' || lower(substr(encode(gen_random_bytes(5),'hex'),1,8));
    exit when not exists (select 1 from public.profiles p where p.username = v_candidate);
  end loop;
  return v_candidate;
end;
$$;

create or replace function public.dong_create_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare v_username text; v_display_name text;
begin
  v_display_name := coalesce(nullif(new.raw_user_meta_data->>'display_name',''), nullif(new.raw_user_meta_data->>'full_name',''), split_part(coalesce(new.email,''),'@',1));
  loop
    v_username := lower(regexp_replace(coalesce(nullif(new.raw_user_meta_data->>'username',''), 'user'), '[^a-zA-Z0-9_]', '', 'g'));
    v_username := left(coalesce(nullif(v_username,''),'user'), 12) || '_' || lower(substr(encode(gen_random_bytes(5),'hex'),1,8));
    exit when not exists (select 1 from public.profiles where username = v_username);
  end loop;
  insert into public.profiles(id, username, display_name) values (new.id, v_username, v_display_name)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists trg_dong_create_profile on auth.users;
create trigger trg_dong_create_profile after insert on auth.users for each row execute function public.dong_create_profile_for_auth_user();

-- Backfill profiles for existing accounts. Username is generated server-side and never reassigned.
do $$
declare r record; v_username text;
begin
  for r in select u.id, u.email, u.raw_user_meta_data from auth.users u left join public.profiles p on p.id=u.id where p.id is null loop
    loop
      v_username := left(coalesce(nullif(regexp_replace(lower(coalesce(r.raw_user_meta_data->>'username','user')), '[^a-z0-9_]', '', 'g'),''),'user'),12) || '_' || lower(substr(encode(gen_random_bytes(5),'hex'),1,8));
      exit when not exists (select 1 from public.profiles where username=v_username);
    end loop;
    insert into public.profiles(id, username, display_name) values (r.id, v_username, coalesce(nullif(r.raw_user_meta_data->>'display_name',''), nullif(r.raw_user_meta_data->>'full_name',''), split_part(coalesce(r.email,''),'@',1))) on conflict (id) do nothing;
  end loop;
end $$;

create or replace function public.dong_prevent_username_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.username is distinct from old.username then raise exception 'نام کاربری پس از ایجاد قابل تغییر نیست'; end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists trg_dong_username_immutable on public.profiles;
create trigger trg_dong_username_immutable before update on public.profiles for each row execute function public.dong_prevent_username_change();

-- Group id type follows the existing dong_groups.id type (UUID or legacy TEXT).
do $$
declare v_id_type text;
begin
  select format_type(a.atttypid,a.atttypmod) into v_id_type from pg_attribute a where a.attrelid='public.dong_groups'::regclass and a.attname='id' and not a.attisdropped;
  if v_id_type is null then raise exception 'public.dong_groups.id not found'; end if;
  execute format('create table if not exists public.dong_group_members (group_id %s not null references public.dong_groups(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role text not null default ''member'' check (role in (''owner'',''admin'',''member'')), joined_at timestamptz not null default now(), primary key (group_id,user_id))', v_id_type);
  execute format('create table if not exists public.dong_group_invitations (id uuid primary key default gen_random_uuid(), group_id %s not null references public.dong_groups(id) on delete cascade, inviter_id uuid not null references auth.users(id) on delete cascade, invitee_id uuid not null references auth.users(id) on delete cascade, status text not null default ''pending'' check (status in (''pending'',''accepted'',''rejected'',''cancelled'',''expired'')), created_at timestamptz not null default now(), responded_at timestamptz, check (inviter_id <> invitee_id))', v_id_type);
end $$;
create index if not exists dong_group_members_user_idx on public.dong_group_members(user_id);
create index if not exists dong_group_invitations_invitee_status_idx on public.dong_group_invitations(invitee_id,status,created_at desc);
create unique index if not exists dong_group_invitations_one_pending_idx on public.dong_group_invitations(group_id,invitee_id) where status='pending';

create table if not exists public.dong_profile_search_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  searched_at timestamptz not null default now()
);
create index if not exists dong_profile_search_limits_recent_idx on public.dong_profile_search_limits(user_id,searched_at desc);

create or replace function public.dong_search_profiles(p_query text)
returns table(id uuid, username text, display_name text)
language plpgsql security definer set search_path = public, auth as $$
declare v_query text; v_count integer;
begin
  if auth.uid() is null then raise exception 'ابتدا وارد حساب کاربری شوید'; end if;
  v_query := lower(trim(both '@' from coalesce(p_query,'')));
  if length(v_query) < 3 or length(v_query) > 24 or v_query !~ '^[a-z0-9_]+$' then raise exception 'نام کاربری معتبر نیست'; end if;
  delete from public.dong_profile_search_limits where searched_at < now() - interval '1 day';
  select count(*) into v_count from public.dong_profile_search_limits where user_id=auth.uid() and searched_at > now()-interval '1 minute';
  if v_count >= 20 then raise exception 'تعداد جست‌وجوها زیاد است؛ کمی بعد دوباره تلاش کنید'; end if;
  insert into public.dong_profile_search_limits(user_id) values(auth.uid());
  return query select p.id,p.username,p.display_name from public.profiles p where p.username like v_query || '%' and p.id <> auth.uid() order by p.username limit 10;
end $$;

create or replace function public.dong_register_group_owner(p_group_id text)
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_group_id public.dong_groups.id%type;
begin
  if auth.uid() is null then raise exception 'ابتدا وارد حساب کاربری شوید'; end if;
  select g.id into v_group_id from public.dong_groups g where g.id::text=p_group_id and (g.user_id=auth.uid() or g.created_by=auth.uid());
  if v_group_id is null then raise exception 'گروه پیدا نشد یا دسترسی ندارید'; end if;
  insert into public.dong_group_members(group_id,user_id,role) values(v_group_id,auth.uid(),'owner') on conflict(group_id,user_id) do update set role='owner';
end $$;

create or replace function public.dong_send_invitation(p_group_id text, p_username text)
returns uuid language plpgsql security definer set search_path = public, auth as $$
declare v_group_id public.dong_groups.id%type; v_invitee uuid; v_invitation uuid;
begin
  if auth.uid() is null then raise exception 'ابتدا وارد حساب کاربری شوید'; end if;
  select g.id into v_group_id from public.dong_groups g join public.dong_group_members gm on gm.group_id=g.id and gm.user_id=auth.uid() and gm.role in ('owner','admin') where g.id::text=p_group_id;
  if v_group_id is null then raise exception 'فقط مالک یا مدیر گروه می‌تواند دعوت ارسال کند'; end if;
  select p.id into v_invitee from public.profiles p where p.username=lower(trim(both '@' from p_username));
  if v_invitee is null then raise exception 'کاربر پیدا نشد'; end if;
  if v_invitee=auth.uid() then raise exception 'نمی‌توانید خودتان را دعوت کنید'; end if;
  if exists(select 1 from public.dong_group_members gm where gm.group_id=v_group_id and gm.user_id=v_invitee) then raise exception 'کاربر از قبل عضو گروه است'; end if;
  if exists(select 1 from public.dong_group_invitations i where i.group_id=v_group_id and i.invitee_id=v_invitee and i.status='pending') then raise exception 'برای این کاربر دعوت در انتظار وجود دارد'; end if;
  insert into public.dong_group_invitations(group_id,inviter_id,invitee_id) values(v_group_id,auth.uid(),v_invitee) returning id into v_invitation;
  return v_invitation;
end $$;

create or replace function public.dong_respond_invitation(p_invitation_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_inv public.dong_group_invitations%rowtype; v_display text;
begin
  if auth.uid() is null then raise exception 'ابتدا وارد حساب کاربری شوید'; end if;
  select * into v_inv from public.dong_group_invitations where id=p_invitation_id and invitee_id=auth.uid() and status='pending' for update;
  if not found then raise exception 'دعوت معتبر یا در انتظار نیست'; end if;
  update public.dong_group_invitations set status=case when p_accept then 'accepted' else 'rejected' end, responded_at=now() where id=v_inv.id;
  if p_accept then
    insert into public.dong_group_members(group_id,user_id,role) values(v_inv.group_id,auth.uid(),'member') on conflict(group_id,user_id) do nothing;
    select coalesce(display_name,username) into v_display from public.profiles where id=auth.uid();
    -- Keep the legacy text-member list synchronized for existing expense UI.
    update public.dong_groups set members=array_append(members,v_display) where id=v_inv.group_id and not (v_display=any(members));
  end if;
end $$;

create or replace function public.dong_group_members_list(p_group_id text)
returns table(user_id uuid, username text, display_name text, role text)
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null or not exists(select 1 from public.dong_group_members gm join public.dong_groups g on g.id=gm.group_id where g.id::text=p_group_id and gm.user_id=auth.uid()) then
    raise exception 'برای مشاهده اعضای این گروه باید عضو آن باشید';
  end if;
  return query select p.id,p.username,p.display_name,gm.role from public.dong_group_members gm join public.profiles p on p.id=gm.user_id join public.dong_groups g on g.id=gm.group_id where g.id::text=p_group_id order by case gm.role when 'owner' then 0 when 'admin' then 1 else 2 end,p.username;
end $$;

create or replace function public.dong_my_pending_invitations()
returns table(id uuid, group_id text, group_name text, inviter_name text, status text, created_at timestamptz)
language sql security definer set search_path = public, auth as $$
  select i.id, i.group_id::text, g.name, coalesce(p.display_name,p.username), i.status, i.created_at
  from public.dong_group_invitations i join public.dong_groups g on g.id=i.group_id join public.profiles p on p.id=i.inviter_id
  where i.invitee_id=auth.uid() and i.status='pending' order by i.created_at desc limit 50;
$$;

-- Secure RPC-only access to membership and invitation records.
alter table public.profiles enable row level security;
alter table public.dong_group_members enable row level security;
alter table public.dong_group_invitations enable row level security;
alter table public.dong_profile_search_limits enable row level security;
drop policy if exists profiles_read_authenticated on public.profiles;
create policy profiles_read_authenticated on public.profiles for select to authenticated using (true);
drop policy if exists profiles_update_display_name on public.profiles;
create policy profiles_update_display_name on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
drop policy if exists dong_group_members_read_member on public.dong_group_members;
drop policy if exists dong_group_members_read_self on public.dong_group_members;
-- Direct table reads reveal only the caller's own membership row; group rosters use the guarded SECURITY DEFINER RPC.
create policy dong_group_members_read_self on public.dong_group_members for select to authenticated using (user_id=auth.uid());
drop policy if exists dong_group_invitations_read_recipient_or_inviter on public.dong_group_invitations;
create policy dong_group_invitations_read_recipient_or_inviter on public.dong_group_invitations for select to authenticated using (invitee_id=auth.uid() or inviter_id=auth.uid());
revoke all on public.dong_profile_search_limits from anon, authenticated;
revoke all on function public.dong_search_profiles(text) from public;
revoke all on function public.dong_register_group_owner(text) from public;
revoke all on function public.dong_send_invitation(text,text) from public;
revoke all on function public.dong_respond_invitation(uuid,boolean) from public;
revoke all on function public.dong_group_members_list(text) from public;
revoke all on function public.dong_my_pending_invitations() from public;
grant execute on function public.dong_search_profiles(text) to authenticated;
grant execute on function public.dong_register_group_owner(text) to authenticated;
grant execute on function public.dong_send_invitation(text,text) to authenticated;
grant execute on function public.dong_respond_invitation(uuid,boolean) to authenticated;
grant execute on function public.dong_group_members_list(text) to authenticated;
grant execute on function public.dong_my_pending_invitations() to authenticated;

-- Group access is limited to owner or accepted members; group expenses inherit this rule.
alter table public.dong_groups enable row level security;
alter table public.dong_expenses enable row level security;
drop policy if exists "Dong groups access" on public.dong_groups;
drop policy if exists dong_groups_select_owner on public.dong_groups;
drop policy if exists dong_groups_insert_owner on public.dong_groups;
drop policy if exists dong_groups_update_owner on public.dong_groups;
drop policy if exists dong_groups_delete_owner on public.dong_groups;
drop policy if exists dong_expenses_select_owner on public.dong_expenses;
drop policy if exists dong_expenses_insert_owner on public.dong_expenses;
drop policy if exists dong_expenses_update_owner on public.dong_expenses;
drop policy if exists dong_expenses_delete_owner on public.dong_expenses;
drop policy if exists "Dong expenses access" on public.dong_expenses;
create policy dong_groups_select_members on public.dong_groups for select to authenticated using (
  user_id=auth.uid() or created_by=auth.uid() or public.is_admin() or exists(select 1 from public.dong_group_members gm where gm.group_id=dong_groups.id and gm.user_id=auth.uid())
);
create policy dong_groups_insert_owner on public.dong_groups for insert to authenticated with check (user_id=auth.uid() or created_by=auth.uid());
create policy dong_groups_update_owner_admin on public.dong_groups for update to authenticated using (user_id=auth.uid() or created_by=auth.uid() or exists(select 1 from public.dong_group_members gm where gm.group_id=dong_groups.id and gm.user_id=auth.uid() and gm.role in ('owner','admin')) or public.is_admin()) with check (user_id=auth.uid() or created_by=auth.uid() or exists(select 1 from public.dong_group_members gm where gm.group_id=dong_groups.id and gm.user_id=auth.uid() and gm.role in ('owner','admin')) or public.is_admin());
create policy dong_groups_delete_owner on public.dong_groups for delete to authenticated using (user_id=auth.uid() or created_by=auth.uid() or public.is_admin());
create policy dong_expenses_select_members on public.dong_expenses for select to authenticated using (exists(select 1 from public.dong_groups g where g.id=dong_expenses.group_id and (g.user_id=auth.uid() or g.created_by=auth.uid() or public.is_admin() or exists(select 1 from public.dong_group_members gm where gm.group_id=g.id and gm.user_id=auth.uid()))));
create policy dong_expenses_insert_members on public.dong_expenses for insert to authenticated with check (exists(select 1 from public.dong_groups g where g.id=dong_expenses.group_id and (g.user_id=auth.uid() or g.created_by=auth.uid() or exists(select 1 from public.dong_group_members gm where gm.group_id=g.id and gm.user_id=auth.uid()))));
create policy dong_expenses_update_members on public.dong_expenses for update to authenticated using (exists(select 1 from public.dong_groups g where g.id=dong_expenses.group_id and (g.user_id=auth.uid() or g.created_by=auth.uid() or exists(select 1 from public.dong_group_members gm where gm.group_id=g.id and gm.user_id=auth.uid() and gm.role in ('owner','admin'))))) with check (exists(select 1 from public.dong_groups g where g.id=dong_expenses.group_id and (g.user_id=auth.uid() or g.created_by=auth.uid() or exists(select 1 from public.dong_group_members gm where gm.group_id=g.id and gm.user_id=auth.uid() and gm.role in ('owner','admin')))));
create policy dong_expenses_delete_members on public.dong_expenses for delete to authenticated using (exists(select 1 from public.dong_groups g where g.id=dong_expenses.group_id and (g.user_id=auth.uid() or g.created_by=auth.uid() or exists(select 1 from public.dong_group_members gm where gm.group_id=g.id and gm.user_id=auth.uid() and gm.role in ('owner','admin')))));

-- Backfill owner memberships for existing groups with a known owner.
do $$
declare r record;
begin
  for r in select id,coalesce(user_id,created_by) as owner_id from public.dong_groups where coalesce(user_id,created_by) is not null loop
    insert into public.dong_group_members(group_id,user_id,role) values(r.id,r.owner_id,'owner') on conflict(group_id,user_id) do update set role='owner';
  end loop;
end $$;

commit;
