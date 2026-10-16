-- Chandboom: safe dong_groups ownership + families migration
-- Run in Supabase SQL Editor after confirming public.users exists.
-- This migration preserves existing group rows and does not assign legacy rows to a random user.

ALTER TABLE public.dong_groups
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.dong_groups
  ADD COLUMN IF NOT EXISTS families jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Keep defaults predictable for existing rows and future inserts.
ALTER TABLE public.dong_groups
  ALTER COLUMN families SET DEFAULT '[]'::jsonb;

-- Remove permissive legacy policies before creating owner-scoped policies.
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dong_groups'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.dong_groups', p.policyname);
  END LOOP;
END $$;

ALTER TABLE public.dong_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY dong_groups_select_own
  ON public.dong_groups
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY dong_groups_insert_own
  ON public.dong_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY dong_groups_update_own
  ON public.dong_groups
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY dong_groups_delete_own
  ON public.dong_groups
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_dong_groups_user_created
  ON public.dong_groups (user_id, created_at DESC);

-- Legacy rows with user_id IS NULL are intentionally not visible under the new RLS policies.
-- Assign each such row to its actual owner before making user_id NOT NULL, if legacy rows exist.
