-- ============================================================================
-- Chandboom: security hardening (2026-11-02)
-- Apply AFTER 20261029, 20261030 and 20261102_profile_dong_ai_alignment.sql.
--
-- Goals:
--  1. Every public table has RLS enabled. Tables without RLS are readable and
--     writable through the public anon/authenticated API keys.
--  2. Users see only their own rows; admins (public.is_admin()) see everything.
--  3. Catalogue tables (plans) are public-read, admin-write.
--  4. Refund AI quota when the model call fails, through a trusted function.
--
-- Client write audit (src/**): the app writes only to profiles (display_name),
-- users (upsert/update, protected by trg_protect_user_entitlements), tickets,
-- ticket_messages, subscription_orders, manual_payments, transactions,
-- financial_goals, reminders, notifications and dong_* tables. Nothing writes to
-- subscriptions, user_subscriptions, plans, subscription_plans, ai_usage_logs,
-- admin_audit_logs or rls_policies_backup from the browser, so those become
-- read-only (or admin-only) here.
-- ============================================================================
begin;

-- ---------------------------------------------------------------------------
-- 1. Catalogue tables: public read of ACTIVE plans, admin manages them.
-- ---------------------------------------------------------------------------
alter table public.plans enable row level security;
drop policy if exists plans_public_read on public.plans;
create policy plans_public_read on public.plans
  for select to anon, authenticated using (is_active = true);
drop policy if exists plans_admin_manage on public.plans;
create policy plans_admin_manage on public.plans
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.subscription_plans enable row level security;
drop policy if exists subscription_plans_public_read on public.subscription_plans;
create policy subscription_plans_public_read on public.subscription_plans
  for select to anon, authenticated using (is_active = true);
drop policy if exists subscription_plans_admin_manage on public.subscription_plans;
create policy subscription_plans_admin_manage on public.subscription_plans
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Subscription history: owner reads own rows; only admins write.
-- ---------------------------------------------------------------------------
alter table public.subscriptions enable row level security;
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists subscriptions_admin_write on public.subscriptions;
create policy subscriptions_admin_write on public.subscriptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.user_subscriptions enable row level security;
drop policy if exists user_subscriptions_select_own on public.user_subscriptions;
create policy user_subscriptions_select_own on public.user_subscriptions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists user_subscriptions_admin_write on public.user_subscriptions;
create policy user_subscriptions_admin_write on public.user_subscriptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. AI usage logs: user reads own; the edge function (service role) writes.
-- ---------------------------------------------------------------------------
alter table public.ai_usage_logs enable row level security;
drop policy if exists ai_usage_logs_select_own on public.ai_usage_logs;
create policy ai_usage_logs_select_own on public.ai_usage_logs
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Admin audit trail: admins read; nobody from the browser writes.
-- ---------------------------------------------------------------------------
alter table public.admin_audit_logs enable row level security;
drop policy if exists admin_audit_logs_admin_read on public.admin_audit_logs;
create policy admin_audit_logs_admin_read on public.admin_audit_logs
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Support messages: a message is visible only to the ticket owner and admins.
--    Senders may only post as themselves, and only inside their own ticket.
-- ---------------------------------------------------------------------------
alter table public.ticket_messages enable row level security;
drop policy if exists ticket_messages_select_owner_or_admin on public.ticket_messages;
create policy ticket_messages_select_owner_or_admin on public.ticket_messages
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.tickets t where t.id = ticket_messages.ticket_id and t.user_id = auth.uid())
  );
drop policy if exists ticket_messages_insert_owner_or_admin on public.ticket_messages;
create policy ticket_messages_insert_owner_or_admin on public.ticket_messages
  for insert to authenticated with check (
    sender_id = auth.uid() and (
      public.is_admin()
      or exists (select 1 from public.tickets t where t.id = ticket_messages.ticket_id and t.user_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Old backup table: it must never be reachable through the API.
--    RLS on with no policies = nobody except the service role can read it.
--    Prefer dropping it after you have verified the backup elsewhere.
-- ---------------------------------------------------------------------------
alter table public.rls_policies_backup enable row level security;
revoke all on public.rls_policies_backup from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Dong search rate-limit table: owner-only (RPC uses SECURITY DEFINER).
-- ---------------------------------------------------------------------------
alter table public.dong_profile_search_limits enable row level security;
drop policy if exists dong_profile_search_limits_own on public.dong_profile_search_limits;
create policy dong_profile_search_limits_own on public.dong_profile_search_limits
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 8. Refund one AI quota unit after a failed model call (called by the edge
--    function with the USER's JWT, so auth.uid() must match the user).
-- ---------------------------------------------------------------------------
create or replace function public.refund_ai_quota(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized';
  end if;
  perform set_config('app.allow_entitlement_update', 'true', true);
  update public.users
     set ai_requests_left = least(coalesce(ai_queries_limit, 0), coalesce(ai_requests_left, 0) + 1),
         ai_queries_used  = greatest(0, coalesce(ai_queries_used, 0) - 1),
         updated_at       = now()
   where id = p_user_id;
end;
$$;

revoke all on function public.refund_ai_quota(uuid) from public;
grant execute on function public.refund_ai_quota(uuid) to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Verification (run manually in SQL Editor; every row should show rowsecurity = true
-- except rls_policies_backup which should also be true with no policies):
--
-- select tablename, rowsecurity
--   from pg_tables where schemaname = 'public' order by tablename;
--
-- Anonymous read test (should return 0 rows for private tables):
--   set role anon; select count(*) from public.ticket_messages; reset role;
-- ---------------------------------------------------------------------------
