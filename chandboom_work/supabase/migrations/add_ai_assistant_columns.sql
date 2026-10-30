-- ============================================================================
-- CHANDBOOM (چندبوم) — Database Migration: AI Assistant & Subscription Columns
-- File: supabase/migrations/add_ai_assistant_columns.sql
-- ============================================================================
-- راهنمای اجرای کاربر در داشبورد سوپابیس (Supabase Dashboard Instructions):
-- ۱. وارد داشبورد پروژه Supabase خود شوید (https://supabase.com/dashboard)
-- ۲. از منوی سمت چپ به بخش "SQL Editor" بروید.
-- ۳. بر روی دکمه "New query" کلیک کرده و تمام خطوط این فایل را کپی و جای‌گذاری کنید.
-- ۴. دکمه سبز "Run" را فشار دهید تا مایگریشن اجرا شود.
-- ۵. این اسکریپت فیلدهای هوش مصنوعی و اشتراک را بدون تداخل با داده‌های موجود به جدول users اضافه می‌کند
--    و جدول رهگیری مصرف هوش مصنوعی (ai_usage_logs) را به همراه سیاست‌های امنیتی RLS می‌سازد.
-- ============================================================================

-- ۱. افزودن ستون‌های مورد نیاز اشتراک و هوش مصنوعی به جدول کاربران (users)
DO $$ 
BEGIN
  -- subscription_status: وضعیت اشتراک کاربر (none, pending, active, expired, canceled)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'subscription_status') THEN
    ALTER TABLE public.users ADD COLUMN subscription_status TEXT DEFAULT 'none';
  END IF;

  -- subscription_tier: سطح اشتراک (free, pro, enterprise)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'subscription_tier') THEN
    ALTER TABLE public.users ADD COLUMN subscription_tier TEXT DEFAULT 'free';
  END IF;

  -- ai_queries_used: تعداد پرامپت‌های مصرف‌شده هوش مصنوعی در ماه جاری
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'ai_queries_used') THEN
    ALTER TABLE public.users ADD COLUMN ai_queries_used INTEGER DEFAULT 0;
  END IF;

  -- ai_queries_limit: سقف مجاز پرسش‌های ماهانه (به عنوان مثال ۱۰۰ پرسش برای کاربران پرو)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'ai_queries_limit') THEN
    ALTER TABLE public.users ADD COLUMN ai_queries_limit INTEGER DEFAULT 100;
  END IF;

  -- ai_reset_date: تاریخ بازنشانی خودکار سهمیه ماهانه هوش مصنوعی
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'ai_reset_date') THEN
    ALTER TABLE public.users ADD COLUMN ai_reset_date TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + interval '30 days');
  END IF;
END $$;

-- ۲. ایجاد جدول لاگ‌های مصرف هوش مصنوعی جهت مانیتورینگ سهمیه و امنیت
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  query_category TEXT DEFAULT 'general',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ایندکس بهینه برای محاسبه سریع سهمیه کاربر در هر ماه
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_date ON public.ai_usage_logs(user_id, created_at DESC);

-- ۳. فعال‌سازی امنیت سطح سطر (RLS) روی جدول لاگ‌های مصرف هوش مصنوعی
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- سیاست امنیتی: هر کاربر فقط می‌تواند لاگ‌های مصرف هوش مصنوعی خود را مشاهده کند
DROP POLICY IF EXISTS "Users can view their own AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Users can view their own AI usage logs"
  ON public.ai_usage_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- سیاست امنیتی: فقط توابع سیستمی و Edge Functions با دسترسی service_role می‌توانند لاگ جدید ثبت کنند
DROP POLICY IF EXISTS "Service role can insert AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Service role can insert AI usage logs"
  ON public.ai_usage_logs
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

-- ۴. کامنت‌های توضیحی جهت مستندسازی کامل دیتابیس
COMMENT ON COLUMN public.users.subscription_status IS 'Current subscription status: none, pending, active, expired, canceled';
COMMENT ON COLUMN public.users.subscription_tier IS 'Tier of subscription: free, pro, enterprise';
COMMENT ON COLUMN public.users.ai_queries_used IS 'Counter of AI queries consumed in the active billing cycle';
COMMENT ON COLUMN public.users.ai_queries_limit IS 'Maximum allowed queries for the user per month';
COMMENT ON TABLE public.ai_usage_logs IS 'Audit and rate-limiting log for AI Assistant requests';
