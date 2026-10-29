-- Chandboom / چندبوم — additive Supabase alignment patch
-- Run this in Supabase SQL Editor AFTER the existing schemasql.sql has been applied.
-- This patch does NOT drop tables or delete application data.

begin;

create extension if not exists pgcrypto;

-- 1) Align user profile fields with the frontend.
alter table public.users
  add column if not exists age integer,
  add column if not exists gender text,
  add column if not exists is_premium boolean not null default false,
  add column if not exists ai_requests_left integer,
  add column if not exists ai_queries_used integer not null default 0,
  add column if not exists ai_queries_limit integer,
  add column if not exists ai_queries_reset_date timestamptz;

alter table public.users drop constraint if exists users_tier_check;
alter table public.users add constraint users_tier_check
  check (tier in ('free', 'bronze', 'pro', 'vip'));

alter table public.users drop constraint if exists users_gender_check;
alter table public.users add constraint users_gender_check
  check (gender is null or gender in ('مرد', 'زن', 'سایر'));

alter table public.users drop constraint if exists users_age_check;
alter table public.users add constraint users_age_check
  check (age is null or age between 1 and 120);

alter table public.users drop constraint if exists users_ai_requests_left_check;
alter table public.users add constraint users_ai_requests_left_check
  check (ai_requests_left is null or ai_requests_left >= 0);

alter table public.users drop constraint if exists users_ai_queries_used_check;
alter table public.users add constraint users_ai_queries_used_check
  check (ai_queries_used >= 0);

alter table public.users drop constraint if exists users_ai_queries_limit_check;
alter table public.users add constraint users_ai_queries_limit_check
  check (ai_queries_limit is null or ai_queries_limit >= 0);

-- Keep the stored premium flag consistent with subscription state without trusting the client.
update public.users
set is_premium = (tier <> 'free' and subscription_status = 'active'
  and (subscription_expires_at is null or subscription_expires_at > now()));

-- Give existing users a sensible quota default without granting AI to the free tier.
update public.users
set ai_queries_limit = case tier when 'bronze' then 30 when 'pro' then 100 when 'vip' then 250 else 0 end
where ai_queries_limit is null;
update public.users
set ai_requests_left = greatest(0, ai_queries_limit - ai_queries_used)
where ai_requests_left is null;

-- Prevent users from granting themselves admin/premium access or increasing AI quota.
create or replace function public.protect_user_entitlements()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin()
     and current_setting('app.allow_entitlement_update', true) is distinct from 'true' then
    if new.role is distinct from old.role
       or new.tier is distinct from old.tier
       or new.subscription_status is distinct from old.subscription_status
       or new.subscription_started_at is distinct from old.subscription_started_at
       or new.subscription_expires_at is distinct from old.subscription_expires_at
       or new.is_premium is distinct from old.is_premium
       or new.ai_requests_left is distinct from old.ai_requests_left
       or new.ai_queries_used is distinct from old.ai_queries_used
       or new.ai_queries_limit is distinct from old.ai_queries_limit
       or new.ai_queries_reset_date is distinct from old.ai_queries_reset_date then
      raise exception 'subscription and AI quota fields can only be changed by trusted server functions or administrators';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_protect_user_entitlements on public.users;
create trigger trg_protect_user_entitlements
before update on public.users
for each row execute function public.protect_user_entitlements();

-- 2) Financial goals, used by the dashboard and AI actions.
create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  target_amount numeric not null check (target_amount > 0),
  current_amount numeric not null default 0 check (current_amount >= 0),
  deadline timestamptz not null,
  category text not null default 'پس‌انداز و سرمایه‌گذاری',
  status text not null default 'in_progress' check (status in ('in_progress', 'achieved', 'paused')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_financial_goals_user_created
  on public.financial_goals(user_id, created_at desc);
alter table public.financial_goals enable row level security;
drop policy if exists financial_goals_select_own on public.financial_goals;
drop policy if exists financial_goals_insert_own on public.financial_goals;
drop policy if exists financial_goals_update_own on public.financial_goals;
drop policy if exists financial_goals_delete_own on public.financial_goals;
drop policy if exists "Goals user access" on public.financial_goals;
create policy financial_goals_select_own on public.financial_goals
  for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy financial_goals_insert_own on public.financial_goals
  for insert to authenticated with check (auth.uid() = user_id);
create policy financial_goals_update_own on public.financial_goals
  for update to authenticated using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());
create policy financial_goals_delete_own on public.financial_goals
  for delete to authenticated using (auth.uid() = user_id or public.is_admin());

-- 3) Make plan catalog IDs match the plan IDs used by the frontend checkout.
-- Existing plan rows are updated by ID; no user orders are removed.
insert into public.plans (id, code, title, name, name_fa, price_toman, duration_days, features, is_active)
values
 ('bronze-1m','bronze-1m','Bronze 1 Month','Bronze 1 Month','اشتراک ۱ ماهه برنزی',35000,30,
  '["۳۰ درخواست هوش مصنوعی در ماه","ثبت صوتی تراکنش","گروه دنگ و یادآور","پشتیبانی تیکتی"]'::jsonb,true),
 ('pro-1m','pro-1m','Pro 1 Month','Pro 1 Month','اشتراک ۱ ماهه طلایی (پرو)',80000,30,
  '["۱۰۰ درخواست هوش مصنوعی در ماه","تحلیل بودجه","ثبت هوشمند تراکنش","مدیریت دنگ"]'::jsonb,true),
 ('vip-1m','vip-1m','VIP 1 Month','VIP 1 Month','اشتراک ۱ ماهه VIP',120000,30,
  '["۲۵۰ درخواست هوش مصنوعی در ماه","تحلیل پیشرفته","اولویت پشتیبانی"]'::jsonb,true),
 ('bronze-3m','bronze-3m','Bronze 3 Months','Bronze 3 Months','اشتراک ۳ ماهه برنزی',90000,90,
  '["۳۰ درخواست هوش مصنوعی در ماه","ثبت صوتی تراکنش","گروه دنگ و یادآور","پشتیبانی تیکتی"]'::jsonb,true),
 ('pro-3m','pro-3m','Pro 3 Months','Pro 3 Months','اشتراک ۳ ماهه طلایی (پرو)',210000,90,
  '["۱۰۰ درخواست هوش مصنوعی در ماه","تحلیل بودجه","ثبت هوشمند تراکنش","مدیریت دنگ"]'::jsonb,true),
 ('vip-3m','vip-3m','VIP 3 Months','VIP 3 Months','اشتراک ۳ ماهه VIP',300000,90,
  '["۵۰۰ درخواست هوش مصنوعی در ماه","تحلیل پیشرفته","اولویت پشتیبانی"]'::jsonb,true)
on conflict (id) do update set
  code = excluded.code, title = excluded.title, name = excluded.name,
  name_fa = excluded.name_fa, price_toman = excluded.price_toman,
  duration_days = excluded.duration_days, features = excluded.features,
  is_active = excluded.is_active, updated_at = now();

alter table public.subscriptions drop constraint if exists subscriptions_tier_check;
alter table public.subscriptions add constraint subscriptions_tier_check
  check (tier in ('free', 'bronze', 'pro', 'vip'));

-- 4) Add group ownership so RLS can isolate each user's groups.
alter table public.dong_groups
  add column if not exists user_id uuid references public.users(id) on delete cascade;
create index if not exists idx_dong_groups_user_created
  on public.dong_groups(user_id, created_at desc);

alter table public.dong_groups enable row level security;
alter table public.dong_expenses enable row level security;
drop policy if exists dong_groups_authenticated_all on public.dong_groups;
drop policy if exists dong_expenses_authenticated_all on public.dong_expenses;
drop policy if exists dong_groups_select_owner on public.dong_groups;
drop policy if exists dong_groups_insert_owner on public.dong_groups;
drop policy if exists dong_groups_update_owner on public.dong_groups;
drop policy if exists dong_groups_delete_owner on public.dong_groups;
drop policy if exists dong_expenses_select_owner on public.dong_expenses;
drop policy if exists dong_expenses_insert_owner on public.dong_expenses;
drop policy if exists dong_expenses_update_owner on public.dong_expenses;
drop policy if exists dong_expenses_delete_owner on public.dong_expenses;
create policy dong_groups_select_owner on public.dong_groups
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy dong_groups_insert_owner on public.dong_groups
  for insert to authenticated with check (user_id = auth.uid());
create policy dong_groups_update_owner on public.dong_groups
  for update to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy dong_groups_delete_owner on public.dong_groups
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());
create policy dong_expenses_select_owner on public.dong_expenses
  for select to authenticated using (
    exists (select 1 from public.dong_groups g where g.id = group_id and (g.user_id = auth.uid() or public.is_admin()))
  );
create policy dong_expenses_insert_owner on public.dong_expenses
  for insert to authenticated with check (
    exists (select 1 from public.dong_groups g where g.id = group_id and (g.user_id = auth.uid() or public.is_admin()))
  );
create policy dong_expenses_update_owner on public.dong_expenses
  for update to authenticated using (
    exists (select 1 from public.dong_groups g where g.id = group_id and (g.user_id = auth.uid() or public.is_admin()))
  ) with check (
    exists (select 1 from public.dong_groups g where g.id = group_id and (g.user_id = auth.uid() or public.is_admin()))
  );
create policy dong_expenses_delete_owner on public.dong_expenses
  for delete to authenticated using (
    exists (select 1 from public.dong_groups g where g.id = group_id and (g.user_id = auth.uid() or public.is_admin()))
  );

-- 5) Ticket policies: authenticated users can only create/read their own tickets;
-- admins can review all tickets and respond. Messages stay in tickets.messages JSONB.
alter table public.tickets enable row level security;
drop policy if exists tickets_own_select on public.tickets;
drop policy if exists tickets_own_insert on public.tickets;
drop policy if exists tickets_own_update on public.tickets;
drop policy if exists tickets_admin_select on public.tickets;
drop policy if exists tickets_admin_update on public.tickets;
drop policy if exists "Tickets user access" on public.tickets;
create policy tickets_own_select on public.tickets
  for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy tickets_own_insert on public.tickets
  for insert to authenticated with check (auth.uid() = user_id);
create policy tickets_own_update on public.tickets
  for update to authenticated using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Ensure both existing approval flows activate the tier represented by the selected plan.
-- The legacy approval RPCs set a generic pro/vip tier; these triggers normalize it from the actual plan ID.
create or replace function public.sync_subscription_tier_from_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id text;
  v_user_id uuid;
  v_tier text;
  v_limit integer;
begin
  if tg_table_name = 'subscriptions' then
    v_user_id := new.user_id;
    select mp.plan_id into v_plan_id from public.manual_payments mp where mp.id = new.payment_id;
  else
    v_user_id := new.user_id;
    v_plan_id := new.plan_id;
  end if;

  if v_plan_id is null then return new; end if;
  v_tier := case
    when v_plan_id like 'bronze-%' then 'bronze'
    when v_plan_id like 'vip-%' then 'vip'
    when v_plan_id like 'pro-%' then 'pro'
    else null
  end;
  if v_tier is null then return new; end if;

  v_limit := case
    when v_plan_id = 'vip-3m' then 500
    when v_tier = 'vip' then 250
    when v_tier = 'pro' then 100
    when v_tier = 'bronze' then 30
    else 0
  end;

  if tg_table_name = 'subscriptions' then
    update public.subscriptions set tier = v_tier where id = new.id;
  end if;

  update public.users set tier = v_tier, subscription_status = 'active', is_premium = true,
    ai_queries_limit = v_limit, ai_requests_left = v_limit, ai_queries_used = 0,
    ai_queries_reset_date = date_trunc('month', now()), updated_at = now()
  where id = v_user_id;
  return new;
end;
$$;

drop trigger if exists trg_sync_manual_subscription_tier on public.subscriptions;
create trigger trg_sync_manual_subscription_tier
after insert on public.subscriptions
for each row execute function public.sync_subscription_tier_from_plan();

drop trigger if exists trg_sync_order_subscription_tier on public.user_subscriptions;
create trigger trg_sync_order_subscription_tier
after insert on public.user_subscriptions
for each row execute function public.sync_subscription_tier_from_plan();

-- The legacy sync RPC must not allow a user to grant themselves a paid tier.
create or replace function public.sync_user_subscription(
  p_user_id uuid,
  p_tier text,
  p_duration_months integer
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_current_expiry timestamptz;
  v_start timestamptz;
  v_expiry timestamptz;
  v_user public.users;
begin
  if not public.is_admin() then
    raise exception 'not authorized: subscriptions can only be activated by an administrator or trusted approval flow';
  end if;
  if p_tier not in ('bronze', 'pro', 'vip') or p_duration_months < 1 or p_duration_months > 24 then
    raise exception 'invalid subscription tier or duration';
  end if;
  perform set_config('app.allow_entitlement_update', 'true', true);
  select subscription_expires_at into v_current_expiry
  from public.users where id = p_user_id for update;
  if not found then raise exception 'user not found'; end if;
  v_start := case when v_current_expiry is not null and v_current_expiry > v_now then v_current_expiry else v_now end;
  v_expiry := v_start + make_interval(months => p_duration_months);
  update public.users set tier = p_tier, subscription_status = 'active', is_premium = true,
    subscription_started_at = case when v_current_expiry is not null and v_current_expiry > v_now then subscription_started_at else v_now end,
    subscription_expires_at = v_expiry,
    ai_queries_limit = case p_tier when 'bronze' then 30 when 'pro' then 100 when 'vip' then 250 end,
    ai_requests_left = case p_tier when 'bronze' then 30 when 'pro' then 100 when 'vip' then 250 end,
    ai_queries_used = 0, ai_queries_reset_date = date_trunc('month', v_now), updated_at = v_now
  where id = p_user_id returning * into v_user;
  return v_user;
end;
$$;
revoke all on function public.sync_user_subscription(uuid,text,integer) from public;
grant execute on function public.sync_user_subscription(uuid,text,integer) to authenticated;

-- 6) Atomically consume AI quota on the server; clients must not decrement it directly.
create or replace function public.decrement_ai_quota(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users;
  v_limit integer;
  v_left integer;
  v_now timestamptz := now();
  v_period_start timestamptz := date_trunc('month', now());
  v_reset_quota boolean := false;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized';
  end if;

  -- This flag is transaction-local and is set only inside this trusted RPC.
  perform set_config('app.allow_entitlement_update', 'true', true);

  select * into v_user from public.users where id = p_user_id for update;
  if not found then raise exception 'user profile not found'; end if;

  if v_user.tier = 'free' or v_user.subscription_status <> 'active'
     or (v_user.subscription_expires_at is not null and v_user.subscription_expires_at <= v_now) then
    return jsonb_build_object('allowed', false, 'remaining_queries', 0, 'error', 'اشتراک فعال دارای دسترسی هوش مصنوعی لازم است.');
  end if;

  v_limit := coalesce(v_user.ai_queries_limit,
    case v_user.tier when 'bronze' then 30 when 'pro' then 100 when 'vip' then 250 else 0 end);

  if v_user.ai_queries_reset_date is null or v_user.ai_queries_reset_date < v_period_start then
    v_reset_quota := true;
    v_left := v_limit;
    update public.users set ai_queries_used = 0, ai_requests_left = v_limit,
      ai_queries_limit = v_limit, ai_queries_reset_date = v_period_start,
      is_premium = true, updated_at = v_now where id = p_user_id;
  else
    v_left := coalesce(v_user.ai_requests_left, greatest(0, v_limit - v_user.ai_queries_used));
  end if;

  if v_left <= 0 then
    return jsonb_build_object('allowed', false, 'remaining_queries', 0, 'error', 'سهمیه هوش مصنوعی این ماه تمام شده است.');
  end if;

  update public.users set ai_requests_left = v_left - 1,
    ai_queries_used = case when v_reset_quota then 1 else ai_queries_used + 1 end,
    ai_queries_limit = v_limit, is_premium = true, updated_at = v_now
  where id = p_user_id;

  return jsonb_build_object('allowed', true, 'remaining_queries', v_left - 1);
end;
$$;
revoke all on function public.decrement_ai_quota(uuid) from public;
grant execute on function public.decrement_ai_quota(uuid) to authenticated;

commit;

-- Legacy dong_groups rows without user_id are intentionally not assigned to a random user.
-- An administrator can review/reassign them after applying this patch.
