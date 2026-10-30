-- ============================================================================
-- CHANDBOOM (چندبوم) — Database Migration: Add User Age and Gender
-- File: supabase/migrations/add_user_age_gender.sql
-- ============================================================================

DO $$ 
BEGIN
  -- full_name: نام و نام خانوادگی
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name') THEN
    ALTER TABLE public.users ADD COLUMN full_name TEXT;
  END IF;

  -- age: سن کاربر جهت تحلیل‌های متناسب مالی
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'age') THEN
    ALTER TABLE public.users ADD COLUMN age INTEGER;
  END IF;

  -- gender: جنسیت کاربر
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'gender') THEN
    ALTER TABLE public.users ADD COLUMN gender TEXT;
  END IF;

  -- ai_queries_reset_date: تاریخ بازنشانی خودکار سهمیه هوش مصنوعی
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'ai_queries_reset_date') THEN
    ALTER TABLE public.users ADD COLUMN ai_queries_reset_date TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + interval '30 days');
  END IF;
END $$;
