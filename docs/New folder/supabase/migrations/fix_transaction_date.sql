-- ============================================================================
-- CHANDBOOM (چندبوم) — Database Migration: Fix Transaction Date
-- File: supabase/migrations/fix_transaction_date.sql
-- ============================================================================
-- راهنمای اجرای کاربر در داشبورد سوپابیس (Supabase Dashboard Instructions):
-- ۱. وارد داشبورد پروژه Supabase خود شوید (https://supabase.com/dashboard)
-- ۲. از منوی سمت چپ روی بخش "SQL Editor" کلیک کنید.
-- ۳. بر روی "New query" کلیک کرده و تمام محتوای این فایل را در کادر قرار دهید.
-- ۴. دکمه سبز رنگ "Run" را فشار دهید.
-- ۵. پیام موفقیت "Success. No rows returned" نشان‌دهنده اعمال صحیح تغییرات است.
-- ============================================================================

-- ۱. حذف مقدار پیش‌فرض DEFAULT now() از ستون تاریخ (date) در جدول تراکنش‌ها
-- این تغییر مانع از بازنویسی اجباری تاریخ‌های گذشته توسط مقدار پیش‌فرض دیتابیس می‌شود
-- و تضمین می‌کند تاریخ انتخاب‌شده توسط کاربر (حتی مربوط به ماه‌ها یا سال‌های گذشته) عیناً ثبت گردد.
ALTER TABLE public.transactions 
  ALTER COLUMN date DROP DEFAULT;

-- ۲. اطمینان از نوع داده TIMESTAMPTZ و پذیرش انواع تاریخ‌های معتبر میلادی و شمسی تبدیل‌شده
ALTER TABLE public.transactions 
  ALTER COLUMN date SET DATA TYPE TIMESTAMPTZ;

-- ۳. ایجاد ایندکس بهینه روی ترکیب شناسه کاربر و تاریخ جهت تسریع در گزارش‌گیری‌های زمانی و فیلتر تاریخ‌های گذشته
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);

-- ۴. ثبت کامنت توضیحی روی ستون تاریخ
COMMENT ON COLUMN public.transactions.date IS 'Stores transaction timestamp without default NOW() override, accurately preserving user-selected past, current, or future dates.';
