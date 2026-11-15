-- ============================================================================
--  اصلاحات دیتابیس برای جریان خرید و تأیید اشتراک طلایی
--  idempotent است؛ کل فایل را در SQL Editor اجرا کنید (بعد از بکاپ).
--  پیش‌نیاز: supabase/manual/SUPABASE_EDITS.sql (توابع approve/reject و bucket) اجرا شده باشد.
-- ============================================================================
begin;

-- ---------------------------------------------------------------------------
-- ۱) ردیف‌های پلن‌ها (کلید خارجی subscription_orders.plan_id به plans.id است)
--    قیمت‌ها و مدت‌ها عیناً از src/data/initialData.ts گرفته شده‌اند.
-- ---------------------------------------------------------------------------
insert into public.plans (id, code, title, name, name_fa, price_toman, duration_days, features, is_active)
values
  ('bronze-1m', 'bronze-1m', 'Bronze 1 Month', 'Bronze 1 Month', 'اشتراک ۱ ماهه برنزی',  35000, 30, '[]'::jsonb, true),
  ('pro-1m',    'pro-1m',    'Pro 1 Month',    'Pro 1 Month',    'اشتراک ۱ ماهه طلایی (پرو)', 80000, 30, '[]'::jsonb, true),
  ('vip-1m',    'vip-1m',    'VIP 1 Month',    'VIP 1 Month',    'اشتراک ۱ ماهه وی‌آی‌پی (VIP)', 120000, 30, '[]'::jsonb, true),
  ('bronze-3m', 'bronze-3m', 'Bronze 3 Months','Bronze 3 Months','اشتراک ۳ ماهه برنزی', 90000, 90, '[]'::jsonb, true),
  ('pro-3m',    'pro-3m',    'Pro 3 Months',   'Pro 3 Months',   'اشتراک ۳ ماهه طلایی (پرو)', 210000, 90, '[]'::jsonb, true),
  ('vip-3m',    'vip-3m',    'VIP 3 Months',   'VIP 3 Months',   'اشتراک ۳ ماهه وی‌آی‌پی (VIP)', 300000, 90, '[]'::jsonb, true)
on conflict (id) do update
  set code = excluded.code,
      title = excluded.title,
      name = excluded.name,
      name_fa = excluded.name_fa,
      price_toman = excluded.price_toman,
      duration_days = excluded.duration_days,
      is_active = excluded.is_active,
      updated_at = now();

-- ---------------------------------------------------------------------------
-- ۲) بررسی: تابع‌های تأیید/رد و سیاست‌های فیش باید وجود داشته باشند
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'approve_manual_payment') then
    raise exception 'approve_manual_payment وجود ندارد: ابتدا supabase/manual/SUPABASE_EDITS.sql را اجرا کنید';
  end if;
  if not exists (select 1 from pg_proc where proname = 'reject_manual_payment') then
    raise exception 'reject_manual_payment وجود ندارد: ابتدا supabase/manual/SUPABASE_EDITS.sql را اجرا کنید';
  end if;
  if exists (select 1 from storage.buckets where id = 'payment-receipts' and public = true) then
    raise notice 'bucket payment-receipts عمومی است؛ توصیه می‌شود خصوصی باشد (نمایش فیش با signed URL انجام می‌شود).';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- ۳) تصمیم تجاری لازم: سهمیه‌ی AI
--    وعده‌ی فروش (initialData): برنز ۳۰ / پرو ۱۰۰ / VIP ۲۵۰ (ماهانه) و VIP سه‌ماهه ۵۰۰
--    تابع تأیید فعلی: برنز ۵۰ / پرو ۱۵۰ / VIP ۵۰۰ (ثابت)
--    قبل از اجرا یکی را انتخاب کنید و در approve_manual_payment و initialData یکسان کنید.
-- ---------------------------------------------------------------------------

commit;

-- ============================================================================
-- ۴) بررسی‌های سریع (جدا از تراکنش بالا اجرا کنید)
-- ============================================================================
-- select id, price_toman, duration_days from public.plans order by id;
-- select proname from pg_proc where proname in ('approve_manual_payment','reject_manual_payment');
-- select id, public from storage.buckets where id = 'payment-receipts';
-- select policyname from pg_policies where tablename = 'objects' and policyname like 'receipts_%';
