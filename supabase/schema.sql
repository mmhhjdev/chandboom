-- ============================================================================
-- CHANDBOOM (چندبوم) — Production Database Schema & RLS Security Hardening
-- ============================================================================
-- This script configures Row Level Security (RLS), security definer helper functions,
-- escalation prevention triggers, and granular table access policies for Chandboom.
-- Safe to execute idempotently in the Supabase SQL Editor.
-- ============================================================================

-- 1. Create Core Tables (if not already existing)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  full_name TEXT,
  age INTEGER,
  gender TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'bronze', 'pro', 'vip')),
  subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('none', 'trial', 'active', 'expired', 'pending_approval')),
  subscription_expires_at TIMESTAMPTZ,
  ai_queries_used INTEGER DEFAULT 0,
  ai_queries_limit INTEGER DEFAULT 100,
  ai_queries_reset_date TIMESTAMPTZ,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.manual_payments (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  tracking_code TEXT NOT NULL,
  receipt_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  account TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.financial_goals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline TIMESTAMPTZ,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reminders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  status TEXT DEFAULT 'unread',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT DEFAULT 'normal',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dong_groups (
  id TEXT PRIMARY KEY,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  participants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dong_expenses (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES public.dong_groups(id) ON DELETE CASCADE,
  payer TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Two-Factor OTP storage (strictly server-side)
CREATE TABLE IF NOT EXISTS public.admin_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INT DEFAULT 0,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Helper Security Functions (SECURITY DEFINER)
-- ----------------------------------------------------------------------------

-- Check whether the current calling auth user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Prevent non-admin users from escalating their own role, tier, or subscription status
CREATE OR REPLACE FUNCTION public.prevent_user_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If executed by an ordinary user (not service_role and not admin)
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    -- Check if user attempts to alter protected security columns
    IF (NEW.role IS DISTINCT FROM OLD.role) OR
       (NEW.tier IS DISTINCT FROM OLD.tier) OR
       (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status) OR
       (NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at) THEN
      RAISE EXCEPTION 'دسترسی غیرمجاز: ارتقای سطح کاربری یا اشتراک فقط توسط مدیریت امکان‌پذیر است.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS trg_prevent_user_privilege_escalation ON public.users;
CREATE TRIGGER trg_prevent_user_privilege_escalation
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_privilege_escalation();

-- 3. Enable Row Level Security (RLS) on ALL tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dong_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dong_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_otps ENABLE ROW LEVEL SECURITY;

-- 4. Granular RLS Policies
-- ----------------------------------------------------------------------------

-- --- USERS TABLE POLICIES ---
DROP POLICY IF EXISTS "Users can read own profile or admin reads all" ON public.users;
CREATE POLICY "Users can read own profile or admin reads all"
ON public.users FOR SELECT
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile on signup" ON public.users;
CREATE POLICY "Users can insert own profile on signup"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile non-privileged fields" ON public.users;
CREATE POLICY "Users can update own profile non-privileged fields"
ON public.users FOR UPDATE
USING (auth.uid() = id OR public.is_admin());

-- --- MANUAL PAYMENTS TABLE POLICIES ---
DROP POLICY IF EXISTS "Users can read own payments, admin reads all" ON public.manual_payments;
CREATE POLICY "Users can read own payments, admin reads all"
ON public.manual_payments FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can submit pending manual payments" ON public.manual_payments;
CREATE POLICY "Users can submit pending manual payments"
ON public.manual_payments FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Only admin can update manual payments" ON public.manual_payments;
CREATE POLICY "Only admin can update manual payments"
ON public.manual_payments FOR UPDATE
USING (public.is_admin());

-- --- SUBSCRIPTION ORDERS TABLE POLICIES ---
DROP POLICY IF EXISTS "Users can read own orders, admin reads all" ON public.subscription_orders;
CREATE POLICY "Users can read own orders, admin reads all"
ON public.subscription_orders FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own subscription orders" ON public.subscription_orders;
CREATE POLICY "Users can insert own subscription orders"
ON public.subscription_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only admin can update subscription orders" ON public.subscription_orders;
CREATE POLICY "Only admin can update subscription orders"
ON public.subscription_orders FOR UPDATE
USING (public.is_admin());

-- --- TRANSACTIONS TABLE POLICIES ---
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions"
ON public.transactions FOR ALL
USING (auth.uid() = user_id OR public.is_admin());

-- --- FINANCIAL GOALS POLICIES ---
DROP POLICY IF EXISTS "Users can manage own goals" ON public.financial_goals;
CREATE POLICY "Users can manage own goals"
ON public.financial_goals FOR ALL
USING (auth.uid() = user_id);

-- --- REMINDERS POLICIES ---
DROP POLICY IF EXISTS "Users can manage own reminders" ON public.reminders;
CREATE POLICY "Users can manage own reminders"
ON public.reminders FOR ALL
USING (auth.uid() = user_id);

-- --- NOTIFICATIONS POLICIES ---
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications"
ON public.notifications FOR ALL
USING (auth.uid() = user_id OR public.is_admin());

-- --- TICKETS POLICIES ---
DROP POLICY IF EXISTS "Users can read own tickets, admin reads all" ON public.tickets;
CREATE POLICY "Users can read own tickets, admin reads all"
ON public.tickets FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can create own tickets" ON public.tickets;
CREATE POLICY "Users can create own tickets"
ON public.tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tickets or admin updates" ON public.tickets;
CREATE POLICY "Users can update own tickets or admin updates"
ON public.tickets FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin());

-- --- DONG POLICIES ---
DROP POLICY IF EXISTS "Dong groups access" ON public.dong_groups;
CREATE POLICY "Dong groups access"
ON public.dong_groups FOR ALL
USING (auth.uid() = created_by OR public.is_admin());

DROP POLICY IF EXISTS "Dong expenses access" ON public.dong_expenses;
CREATE POLICY "Dong expenses access"
ON public.dong_expenses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dong_groups
    WHERE id = dong_expenses.group_id
    AND (created_by = auth.uid() OR public.is_admin())
  )
);

-- --- ADMIN OTPs TABLE POLICIES ---
-- No public or ordinary user access whatsoever. Only accessible by service_role (Edge Functions)
DROP POLICY IF EXISTS "Deny all public access to admin_otps" ON public.admin_otps;
CREATE POLICY "Deny all public access to admin_otps"
ON public.admin_otps FOR ALL
USING (FALSE);
