-- ============================================================================
--  دوستان چندبوم: فقط همین فایل را در SQL Editor اجرا کنید (مستقل از بقیه‌ی فایل).
--  اگر خطای "Could not find the function ... in the schema cache" دیدید، یعنی این بخش
--  هنوز اجرا نشده است. idempotent است.
-- ============================================================================
begin;

-- ----------------------------------------------------------------------------
-- ۱۱) دوستان: درخواست دوستی با نام کاربری، پذیرش، و فهرست دوستان
--     همه‌ی نوشتن‌ها فقط از طریق توابع امن انجام می‌شود (بدون policy نوشتن).
--     idempotent است.
-- ----------------------------------------------------------------------------
create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);
create unique index if not exists friendships_pair_uq
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status);
create index if not exists friendships_requester_idx on public.friendships (requester_id, status);

alter table public.friendships enable row level security;
drop policy if exists friendships_select_own on public.friendships;
create policy friendships_select_own on public.friendships
  for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

drop function if exists public.friends_overview();
create or replace function public.friends_overview()
returns table(friendship_id uuid, user_id uuid, username text, display_name text, state text)
language sql
stable
security definer
set search_path = public
as $$
  select f.id,
         case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end,
         p.username,
         p.display_name,
         case when f.status = 'accepted' then 'friend'
              when f.addressee_id = auth.uid() then 'incoming'
              else 'outgoing' end
    from public.friendships f
    join public.profiles p
      on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
   where auth.uid() is not null
     and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
   order by f.created_at desc;
$$;

create or replace function public.friend_send_request(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_norm text;
  v_target uuid;
  v_row public.friendships%rowtype;
  v_recent integer;
begin
  if v_me is null then raise exception 'ابتدا وارد حساب کاربری شوید'; end if;
  v_norm := lower(trim(both '@' from coalesce(p_username, '')));
  if v_norm !~ '^[a-z0-9_]{3,24}$' then raise exception 'نام کاربری معتبر نیست'; end if;

  select id into v_target from public.profiles where username = v_norm;
  if v_target is null then raise exception 'کاربری با این نام کاربری پیدا نشد'; end if;
  if v_target = v_me then raise exception 'نمی‌توانید خودتان را به دوستان اضافه کنید'; end if;

  select count(*) into v_recent from public.friendships
   where requester_id = v_me and created_at > now() - interval '1 hour';
  if v_recent >= 30 then raise exception 'تعداد درخواست‌ها در این ساعت زیاد است؛ کمی بعد دوباره تلاش کنید'; end if;

  select * into v_row from public.friendships
   where (requester_id = v_me and addressee_id = v_target)
      or (requester_id = v_target and addressee_id = v_me)
   for update;

  if found then
    if v_row.status = 'accepted' then raise exception 'این کاربر از قبل در لیست دوستان شماست'; end if;
    if v_row.requester_id = v_me then raise exception 'درخواست قبلاً ارسال شده است'; end if;
    -- The other person had already asked us: a mutual request is accepted automatically.
    update public.friendships set status = 'accepted', responded_at = now() where id = v_row.id;
    return 'accepted';
  end if;

  insert into public.friendships (requester_id, addressee_id) values (v_me, v_target);
  return 'sent';
end;
$$;

create or replace function public.friend_respond_request(p_friendship_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'ابتدا وارد حساب کاربری شوید'; end if;
  if p_accept then
    update public.friendships set status = 'accepted', responded_at = now()
     where id = p_friendship_id and addressee_id = auth.uid() and status = 'pending';
  else
    delete from public.friendships
     where id = p_friendship_id and addressee_id = auth.uid() and status = 'pending';
  end if;
  if not found then raise exception 'درخواست پیدا نشد یا دیگر در انتظار نیست'; end if;
end;
$$;

create or replace function public.friend_remove(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'ابتدا وارد حساب کاربری شوید'; end if;
  -- Removes a friend OR cancels an outgoing request. Only rows involving the caller are touched.
  delete from public.friendships
   where (requester_id = auth.uid() and addressee_id = p_user_id)
      or (addressee_id = auth.uid() and requester_id = p_user_id);
end;
$$;

revoke all on function public.friends_overview() from public, anon;
revoke all on function public.friend_send_request(text) from public, anon;
revoke all on function public.friend_respond_request(uuid, boolean) from public, anon;
revoke all on function public.friend_remove(uuid) from public, anon;
grant execute on function public.friends_overview() to authenticated;
grant execute on function public.friend_send_request(text) to authenticated;
grant execute on function public.friend_respond_request(uuid, boolean) to authenticated;
grant execute on function public.friend_remove(uuid) to authenticated;


-- ساختار جدید را بلافاصله به API اعلام کن (بدون این، ممکن است چند دقیقه خطا ادامه داشته باشد)
notify pgrst, 'reload schema';

commit;

-- تست سریع (با یک کاربر لاگین‌شده در برنامه، یا در SQL Editor با نام کاربری واقعی):
-- select * from public.friends_overview();
