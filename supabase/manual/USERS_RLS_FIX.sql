-- ============================================================================
--  رفع خطای ذخیره‌ی حساب کاربری:
--  "new row violates row-level security policy for table \"users\""
--  علت: ذخیره‌ی تنظیمات با upsert روی ردیف موجود انجام می‌شود و در دیتابیس
--  سیاست INSERT/UPDATE مطمئنی برای ردیف خود کاربر وجود ندارد.
--  idempotent است؛ بعد از بکاپ، کل فایل را در SQL Editor اجرا کنید.
-- ============================================================================
begin;

alter table public.users enable row level security;

-- ۱) کاربر فقط ردیف خودش را می‌تواند بسازد یا به‌روز کند (ادمین همه را)
drop policy if exists users_insert_own on public.users;
create policy users_insert_own on public.users
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- ۲) ساخت ردیف جدید توسط کاربر عادی: فیلدهای امنیتی همیشه پیش‌فرض می‌شوند.
--    (اشتراک، سهمیه و نقش فقط از مسیر تأیید ادمین یا تابع امن تغییر می‌کند.)
create or replace function public.lock_new_user_entitlements()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := 'user';
    new.tier := 'free';
    new.subscription_status := 'none';
    new.subscription_started_at := null;
    new.subscription_expires_at := null;
    new.is_premium := false;
    new.ai_queries_used := 0;
    new.ai_queries_limit := 0;
    new.ai_requests_left := 0;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lock_new_user_entitlements on public.users;
create trigger trg_lock_new_user_entitlements
before insert on public.users
for each row execute function public.lock_new_user_entitlements();

commit;

-- ============================================================================
-- بررسی (جدا اجرا کنید):
-- select policyname, cmd from pg_policies where tablename = 'users' order by policyname;
-- select tgname from pg_trigger where tgrelid = 'public.users'::regclass and not tgisinternal;
