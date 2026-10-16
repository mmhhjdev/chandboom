-- Chandboom: allow the two configured superuser email accounts through public.is_admin().
-- Review the email allowlist before applying to your production project.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
        AND lower(coalesce(role, '')) IN ('admin', 'superuser', 'super_admin', 'super-admin')
    )
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN (
      'seyedmahanhejrati@gmail.com',
      'mahan.hejrati91@gmail.com'
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
