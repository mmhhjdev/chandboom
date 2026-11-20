-- ============================================================================
--  سهمیه‌ی جدید هوش مصنوعی (ماهانه):
--    رایگان ۱۰  |  برنز ۵۰  |  پرو ۲۵۰  |  VIP ۵۰۰
--  - تابع decrement_ai_quota جایگزین نسخه‌ی قبلی می‌شود (قرارداد خروجی حفظ شده).
--  - کاربر رایگان هم دسترسی دارد (قبلاً رد می‌شد).
--  - اشتراک منقضی‌شده یا غیرفعال، به سهمیه‌ی رایگان برمی‌گردد.
--  - بک‌فیل: سهمیه‌ی کاربران موجود طبق پلن فعلی‌شان تنظیم می‌شود.
--  idempotent است؛ بعد از بکاپ اجرا کنید.
-- ============================================================================
begin;

create or replace function public.decrement_ai_quota(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users;
  v_tier text;
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

  -- پلن مؤثر: فقط اشتراک فعال و معتبر، وگرنه رایگان
  v_tier := case
    when v_user.tier in ('bronze', 'pro', 'vip')
         and v_user.subscription_status = 'active'
         and (v_user.subscription_expires_at is null or v_user.subscription_expires_at > v_now)
    then v_user.tier
    else 'free'
  end;
  v_limit := case v_tier when 'vip' then 500 when 'pro' then 250 when 'bronze' then 50 else 10 end;

  if v_user.ai_queries_reset_date is null or v_user.ai_queries_reset_date < v_period_start then
    v_reset_quota := true;
    v_left := v_limit;
    update public.users
       set ai_queries_used = 0,
           ai_requests_left = v_limit,
           ai_queries_limit = v_limit,
           ai_queries_reset_date = v_period_start,
           is_premium = (v_tier <> 'free'),
           updated_at = v_now
     where id = p_user_id;
  else
    v_left := least(v_limit, coalesce(v_user.ai_requests_left, greatest(0, v_limit - v_user.ai_queries_used)));
  end if;

  if v_left <= 0 then
    update public.users set ai_queries_limit = v_limit, ai_requests_left = 0 where id = p_user_id;
    return jsonb_build_object('allowed', false, 'remaining_queries', 0,
                              'error', 'سهمیه هوش مصنوعی این ماه تمام شده است.');
  end if;

  update public.users
     set ai_requests_left = v_left - 1,
         ai_queries_used = case when v_reset_quota then 1 else ai_queries_used + 1 end,
         ai_queries_limit = v_limit,
         updated_at = v_now
   where id = p_user_id;

  return jsonb_build_object('allowed', true, 'remaining_queries', v_left - 1);
end;
$$;

-- بک‌فیل: سهمیه‌ی کاربران موجود طبق پلن مؤثرشان
select set_config('app.allow_entitlement_update', 'true', true);
with calc as (
  select id,
         case when tier in ('bronze', 'pro', 'vip')
                and subscription_status = 'active'
                and (subscription_expires_at is null or subscription_expires_at > now())
              then tier else 'free' end as eff,
         coalesce(ai_queries_used, 0) as used
    from public.users
)
update public.users u
   set ai_queries_limit = (case c.eff when 'vip' then 500 when 'pro' then 250 when 'bronze' then 50 else 10 end),
       ai_requests_left = greatest(0, (case c.eff when 'vip' then 500 when 'pro' then 250 when 'bronze' then 50 else 10 end) - c.used)
  from calc c
 where u.id = c.id;

commit;

-- بررسی:
-- select tier, ai_queries_limit, count(*) from public.users group by 1,2 order by 1,2;
