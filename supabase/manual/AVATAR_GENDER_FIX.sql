-- ============================================================================
--  اصلاح آواتار کاربران زن که قبلاً آواتار پیش‌فرض آقا برایشان ذخیره شده بود.
--  فقط ردیف‌های با gender = 'زن' و آواتار پیش‌فرض آقا (یا خالی) را تغییر می‌دهد.
--  آواتارهای دلخواه کاربر (فایل آپلودی) دست‌نخورده می‌مانند.
--  idempotent است؛ بعد از بکاپ اجرا کنید.
-- ============================================================================
begin;

update public.users
   set avatar_url = '/icons3d/vip/avatar-female-256.png',
       updated_at = now()
 where gender = 'زن'
   and (
        avatar_url is null
     or avatar_url = '/icons3d/vip/avatar-male-256.png'
     or avatar_url like '%bgGradMale%'
   );

commit;

-- بررسی:
-- select count(*) filter (where avatar_url like '%avatar-female%') as female_avatar,
--        count(*) filter (where avatar_url like '%avatar-male%' or avatar_url like '%bgGradMale%') as male_avatar
--   from public.users where gender = 'زن';
