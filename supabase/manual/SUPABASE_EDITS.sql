-- ============================================================================
--  ویرایش‌های دستی سوپابیس چندبوم
--  آخرین بروزرسانی: ۲۰۲۶-۱۱-۰۵
-- ----------------------------------------------------------------------------
--  راهنمای اجرا (به ترتیب):
--  ۱) قبل از هر چیز از Database → Backups یک بکاپ بگیرید.
--  ۲) پیش‌نیاز: migration های 20261029، 20261030 و 20261102_security_hardening
--     قبلاً اجرا شده باشند (توابع is_admin و decrement_ai_quota به آن‌ها وابسته‌اند).
--  ۳) این فایل را در SQL Editor اجرا کنید. هر بخش idempotent است (دوباره اجرا بی‌خطر است).
--  ۴) بخش‌های ۷ (Storage) و ۸ (pg_cron) نیاز به تنظیمات داشبورد دارند؛ یادداشت‌هایشان را بخوانید.
--  ۵) بخش ۹ (MFA) را فعلاً اجرا کنید ولی فلگ را false نگه دارید تا ادمین قفل نشود.
--
--  هر بخش یک عنوان و یک بلوک تست دارد. بعد از اجرا، کوئری‌های بخش ۱۰ را بزنید.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- ۰) حذف نسخه‌های قدیمی توابع و ویو (PostgreSQL اجازه نمی‌دهد نوع خروجی یک تابع
--    موجود با CREATE OR REPLACE عوض شود). همه‌ی overloadها با این نام حذف می‌شوند.
--    توابع جدید بلافاصله بعد از این بلوک ساخته می‌شوند.
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in (
         'approve_manual_payment',
         'reject_manual_payment',
         'assert_admin_mfa_if_required',
         'ai_consume_rate_limit',
         'generate_due_reminder_notifications'
       )
  loop
    execute format('drop function if exists %s', r.sig);
  end loop;
end;
$$;

drop view if exists public.admin_ai_cost_daily;

-- ----------------------------------------------------------------------------
-- ۱) تأیید پرداخت کارت‌به‌کارت به‌صورت اتمیک
--    قبلاً کلاینت سه نوشتن جدا انجام می‌داد؛ اگر وسطش قطع می‌شد، پرداخت تأیید
--    می‌شد ولی اشتراک فعال نمی‌شد (یا برعکس). این تابع همه را در یک تراکنش انجام می‌دهد.
--    تکرار تأیید یک پرداخت خطا می‌دهد (idempotent و امن در برابر دابل‌کلیک).
-- ----------------------------------------------------------------------------
create or replace function public.assert_admin_mfa_if_required()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_required boolean;
begin
  select coalesce((value)::text = 'true', false) into v_required
    from public.app_config where key = 'require_admin_mfa';
  if coalesce(v_required, false) and coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then
    raise exception 'برای این عملیات تأیید دو مرحله‌ای (MFA) لازم است' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.approve_manual_payment(p_payment_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_pay        public.manual_payments%rowtype;
  v_tier       text;
  v_quota      integer;
  v_days       integer;
  v_months     integer;
  v_current    timestamptz;
  v_expires    timestamptz;
  v_admin_email text;
begin
  if not public.is_admin() then
    raise exception 'دسترسی غیرمجاز: فقط مدیر' using errcode = '42501';
  end if;
  perform public.assert_admin_mfa_if_required();

  select * into v_pay from public.manual_payments where id = p_payment_id for update;
  if not found then
    raise exception 'پرداخت پیدا نشد';
  end if;
  if v_pay.status = 'approved' then
    raise exception 'این پرداخت قبلاً تأیید شده است';
  end if;
  if v_pay.status <> 'pending' then
    raise exception 'وضعیت پرداخت قابل تأیید نیست: %', v_pay.status;
  end if;

  v_tier  := case when v_pay.plan_id like 'vip%' then 'vip'
                  when v_pay.plan_id like 'bronze%' then 'bronze'
                  else 'pro' end;
  v_quota := case v_tier when 'vip' then 500 when 'bronze' then 50 else 150 end;
  v_days  := coalesce(
               (select duration_days from public.plans where id = v_pay.plan_id),
               case when v_pay.plan_id like '%-3m' then 90 else 30 end);
  v_months := greatest(1, round(v_days / 30.0)::integer);

  -- تمدید از روی انقضای فعلی اگر هنوز فعال است، وگرنه از همین لحظه.
  select subscription_expires_at into v_current from public.users where id = v_pay.user_id for update;
  v_expires := greatest(coalesce(v_current, now()), now()) + make_interval(days => v_days);

  perform set_config('app.allow_entitlement_update', 'true', true);
  update public.users
     set tier = v_tier,
         subscription_status = 'active',
         is_premium = true,
         subscription_started_at = coalesce(subscription_started_at, now()),
         subscription_expires_at = v_expires,
         ai_requests_left = v_quota,
         ai_queries_limit = v_quota,
         ai_queries_used = 0,
         ai_queries_reset_date = now() + interval '30 days',
         updated_at = now()
   where id = v_pay.user_id;
  if not found then
    raise exception 'کاربر این پرداخت پیدا نشد';
  end if;

  select email into v_admin_email from auth.users where id = auth.uid();

  update public.manual_payments
     set status = 'approved',
         admin_notes = coalesce(p_note, 'پرداخت تایید شد و اشتراک فعال گردید.'),
         reviewed_at = now(),
         reviewed_by = v_admin_email
   where id = p_payment_id;

  -- سابقه‌ی اشتراک (برای گزارش‌ها و تاریخچه کاربر)
  insert into public.subscriptions (user_id, plan_id, plan_name, tier, amount, duration_months,
                                    started_at, expires_at, status, payment_id, metadata)
  values (v_pay.user_id, v_pay.plan_id, v_pay.plan_name, v_tier, v_pay.amount, v_months,
          now(), v_expires, 'active', p_payment_id,
          jsonb_build_object('approved_by', v_admin_email));

  update public.subscription_orders
     set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
   where user_id = v_pay.user_id and plan_id = v_pay.plan_id and status = 'pending';

  insert into public.admin_audit_logs (admin_user_id, action, target_type, target_id, payload)
  values (auth.uid(), 'approve_manual_payment', 'manual_payment', p_payment_id,
          jsonb_build_object('user_id', v_pay.user_id, 'plan_id', v_pay.plan_id,
                             'tier', v_tier, 'expires_at', v_expires));
end;
$$;

create or replace function public.reject_manual_payment(p_payment_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_pay public.manual_payments%rowtype;
  v_admin_email text;
begin
  if not public.is_admin() then
    raise exception 'دسترسی غیرمجاز: فقط مدیر' using errcode = '42501';
  end if;
  perform public.assert_admin_mfa_if_required();

  select * into v_pay from public.manual_payments where id = p_payment_id for update;
  if not found then
    raise exception 'پرداخت پیدا نشد';
  end if;
  if v_pay.status <> 'pending' then
    raise exception 'وضعیت پرداخت قابل رد نیست: %', v_pay.status;
  end if;

  select email into v_admin_email from auth.users where id = auth.uid();

  -- پرداخت در حالت pending هنوز اشتراکی فعال نکرده، پس دسترسی کاربر تغییر نمی‌کند.
  update public.manual_payments
     set status = 'rejected',
         admin_notes = coalesce(p_note, 'اطلاعات واریزی مطابقت نداشت یا نامعتبر بود.'),
         reviewed_at = now(),
         reviewed_by = v_admin_email
   where id = p_payment_id;

  update public.subscription_orders
     set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now(),
         reject_reason = coalesce(p_note, 'اطلاعات واریزی مطابقت نداشت یا نامعتبر بود.')
   where user_id = v_pay.user_id and plan_id = v_pay.plan_id and status = 'pending';

  insert into public.admin_audit_logs (admin_user_id, action, target_type, target_id, payload)
  values (auth.uid(), 'reject_manual_payment', 'manual_payment', p_payment_id,
          jsonb_build_object('user_id', v_pay.user_id, 'plan_id', v_pay.plan_id));
end;
$$;

revoke all on function public.approve_manual_payment(uuid, text) from public, anon;
revoke all on function public.reject_manual_payment(uuid, text) from public, anon;
grant execute on function public.approve_manual_payment(uuid, text) to authenticated;
grant execute on function public.reject_manual_payment(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- ۲) محدودیت نرخ دستیار AI (هر کاربر، پنجره‌ی زمانی ثابت)
--    فقط Edge Function (service role) به این جدول دسترسی دارد.
-- ----------------------------------------------------------------------------
create table if not exists public.ai_rate_limits (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  hits         integer     not null default 0 check (hits >= 0),
  primary key (user_id, window_start)
);
alter table public.ai_rate_limits enable row level security;   -- بدون policy = فقط service role

create or replace function public.ai_consume_rate_limit(p_user_id uuid, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_hits   integer;
begin
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.ai_rate_limits (user_id, window_start, hits)
  values (p_user_id, v_window, 1)
  on conflict (user_id, window_start)
  do update set hits = public.ai_rate_limits.hits + 1
  returning hits into v_hits;

  -- پاک‌سازی سبک: رکوردهای قدیمی‌تر از یک روز
  delete from public.ai_rate_limits where window_start < now() - interval '1 day';
  return v_hits <= p_limit;
end;
$$;

revoke all on function public.ai_consume_rate_limit(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.ai_consume_rate_limit(uuid, integer, integer) to service_role;

-- ----------------------------------------------------------------------------
-- ۳) حسابداری دقیق هزینه‌ی AI (gpt-4o-mini)
--    ستون‌های جدید برای پایش هزینه؛ Edge Function اگر این ستون‌ها نباشند هم کار می‌کند.
-- ----------------------------------------------------------------------------
alter table public.ai_usage_logs add column if not exists model text;
alter table public.ai_usage_logs add column if not exists prompt_tokens integer not null default 0;
alter table public.ai_usage_logs add column if not exists completion_tokens integer not null default 0;
alter table public.ai_usage_logs add column if not exists cached_prompt_tokens integer not null default 0;
alter table public.ai_usage_logs add column if not exists est_cost_micro_usd integer not null default 0;
create index if not exists idx_ai_usage_logs_user_created on public.ai_usage_logs (user_id, created_at desc);
create index if not exists idx_ai_usage_logs_created on public.ai_usage_logs (created_at desc);

-- گزارش روزانه‌ی هزینه برای ادمین (از طریق SQL Editor یا پنل ادمین)
create or replace view public.admin_ai_cost_daily
with (security_invoker = true) as
select date_trunc('day', created_at) as day,
       count(*)                       as requests,
       sum(prompt_tokens)             as prompt_tokens,
       sum(completion_tokens)         as completion_tokens,
       sum(cached_prompt_tokens)      as cached_prompt_tokens,
       sum(est_cost_micro_usd)        as est_cost_micro_usd
  from public.ai_usage_logs
 group by 1
 order by 1 desc;

-- ----------------------------------------------------------------------------
-- ۴) ثبت رسید پرداخت در Storage خصوصی
--    ⚠️ کلاینت باید فایل را در مسیر «<user_id>/<filename>» آپلود کند.
--    اگر فعلاً آپلود در bucket دیگری یا عمومی است، بعد از بررسی CheckoutModal منتقل کنید.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do update set public = false;

drop policy if exists receipts_insert_own on storage.objects;
create policy receipts_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists receipts_select_own_or_admin on storage.objects;
create policy receipts_select_own_or_admin on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-receipts'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ----------------------------------------------------------------------------
-- ۵) یادآورهای سررسید: ایجاد خودکار اعلان (شبانه با pg_cron)
-- ----------------------------------------------------------------------------
create or replace function public.generate_due_reminder_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.notifications (user_id, type, title, message, amount, priority, status)
  select r.user_id,
         'reminder',
         'یادآور: ' || r.title,
         'سررسید ' || to_char(r.due_date at time zone 'UTC', 'YYYY-MM-DD') || ' نزدیک یا گذشته است.',
         r.amount,
         case when r.due_date < now() then 'urgent' else 'normal' end,
         'pending'
    from public.reminders r
   where r.is_paid = false
     and r.due_date <= now() + interval '1 day'
     and not exists (
       select 1 from public.notifications n
        where n.user_id = r.user_id
          and n.type = 'reminder'
          and n.title = 'یادآور: ' || r.title
          and n.created_at > now() - interval '1 day'
     );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.generate_due_reminder_notifications() from public, anon, authenticated;

-- زمان‌بندی (۰۵:۰۰ UTC هر روز). اگر pg_cron فعال نباشد فقط یادداشت می‌شود.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'chandboom-reminders') then
      perform cron.unschedule('chandboom-reminders');
    end if;
    perform cron.schedule('chandboom-reminders', '0 5 * * *',
                          'select public.generate_due_reminder_notifications();');
  else
    raise notice 'pg_cron فعال نیست. از Database → Extensions آن را فعال کنید و این بخش را دوباره اجرا کنید.';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- ۶) پیکربندی برنامه (فلگ‌ها)
-- ----------------------------------------------------------------------------
create table if not exists public.app_config (
  key        text primary key,
  value      jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;   -- بدون policy: فقط SQL Editor / service role
insert into public.app_config (key, value) values ('require_admin_mfa', 'false'::jsonb)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- ۷) MFA ادمین (اختیاری، بعد از فعال‌سازی TOTP برای حساب ادمین)
--    مراحل: Authentication → Multi-factor → TOTP را روشن کنید؛ ادمین با اپ
--    Authenticator ثبت‌نام کند؛ سپس این خط را اجرا کنید:
--      update public.app_config set value = 'true'::jsonb where key = 'require_admin_mfa';
--    تا قبل از آن، فلگ false است تا قفل نشوید.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- ۸) پاک‌سازی جدول‌های مرده (فقط بعد از بکاپ و تأیید)
--    جدول admin_otps بی‌استفاده است؛ احراز هویت ادمین با Supabase Auth انجام می‌شود.
--    rls_policies_backup را بعد از اطمینان از بکاپ بیرونی حذف کنید.
-- ----------------------------------------------------------------------------
-- drop table if exists public.admin_otps;
-- drop table if exists public.rls_policies_backup;

commit;

-- ============================================================================
--  ۹) کوئری‌های تست (جدا از تراکنش بالا اجرا کنید)
-- ============================================================================

-- الف) همه‌ی جدول‌های public باید RLS روشن داشته باشند:
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;

-- ب) توابع جدید وجود داشته باشند:
-- select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and proname in
--  ('approve_manual_payment','reject_manual_payment','ai_consume_rate_limit','generate_due_reminder_notifications');

-- ج) دسترسی anon نباید به پیام‌های پشتیبانی و اشتراک‌ها دسترسی داشته باشد (۰ ردیف):
-- set role anon;
-- select count(*) from public.ticket_messages;
-- select count(*) from public.subscriptions;
-- reset role;

-- د) محدودیت نرخ: ۲۱ بار صدا زدن با یک کاربر باید آخرین بار false بدهد (با service role اجرا کنید):
-- select public.ai_consume_rate_limit('00000000-0000-0000-0000-000000000000'::uuid, 20, 60);

-- ه) هزینه‌ی امروز:
-- select * from public.admin_ai_cost_daily limit 7;
