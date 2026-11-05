-- Chandboom entitlement alignment: VIP = 500 AI requests per calendar month.
-- Apply with Supabase migrations before deploying the matching Edge Function.
begin;

update public.users
set ai_queries_limit = case tier when 'vip' then 500 when 'pro' then 150 when 'bronze' then 50 else 0 end,
    ai_requests_left = greatest(0, (case tier when 'vip' then 500 when 'pro' then 150 when 'bronze' then 50 else 0 end) - coalesce(ai_queries_used,0)),
    updated_at = now()
where tier in ('vip','pro','bronze');

create or replace function public.decrement_ai_quota(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user public.users;
  v_limit integer;
  v_left integer;
  v_now timestamptz := now();
  v_period_start timestamptz := date_trunc('month', now());
  v_reset_quota boolean := false;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'not authorized'; end if;
  perform set_config('app.allow_entitlement_update', 'true', true);
  select * into v_user from public.users where id = p_user_id for update;
  if not found then raise exception 'user profile not found'; end if;
  if v_user.tier = 'free' or v_user.subscription_status <> 'active'
     or (v_user.subscription_expires_at is not null and v_user.subscription_expires_at <= v_now) then
    return jsonb_build_object('allowed', false, 'remaining_queries', 0, 'error', 'اشتراک فعال دارای دسترسی هوش مصنوعی لازم است.');
  end if;
  v_limit := case v_user.tier when 'bronze' then 50 when 'pro' then 150 when 'vip' then 500 else 0 end;
  if v_limit = 0 then return jsonb_build_object('allowed', false, 'remaining_queries', 0, 'error', 'پلن کاربری برای دسترسی به هوش مصنوعی معتبر نیست.'); end if;
  if v_user.ai_queries_reset_date is null or v_user.ai_queries_reset_date < v_period_start then
    v_reset_quota := true; v_left := v_limit;
    update public.users set ai_queries_used = 0, ai_requests_left = v_limit, ai_queries_limit = v_limit,
      ai_queries_reset_date = v_period_start, is_premium = true, updated_at = v_now where id = p_user_id;
  else
    v_left := least(v_limit, coalesce(v_user.ai_requests_left, greatest(0, v_limit - v_user.ai_queries_used)));
  end if;
  if v_left <= 0 then
    update public.users set ai_queries_limit = v_limit, ai_requests_left = 0 where id = p_user_id;
    return jsonb_build_object('allowed', false, 'remaining_queries', 0, 'error', 'سهمیه هوش مصنوعی این ماه تمام شده است.');
  end if;
  update public.users set ai_requests_left = v_left - 1, ai_queries_used = case when v_reset_quota then 1 else ai_queries_used + 1 end,
    ai_queries_limit = v_limit, is_premium = true, updated_at = v_now where id = p_user_id;
  return jsonb_build_object('allowed', true, 'remaining_queries', v_left - 1);
end; $$;
revoke all on function public.decrement_ai_quota(uuid) from public;
grant execute on function public.decrement_ai_quota(uuid) to authenticated;
commit;
