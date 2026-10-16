# اصلاح دسترسی سوپریوزر چندبوم

- ورود ادمین حالا علاوه بر Auth metadata، نقش را از `public.users` نیز می‌خواند.
- دو ایمیل مدیر ارشد تعیین‌شده در کد UI و Edge Functionهای مدیریتی allowlist شده‌اند.
- نقش‌های `admin`, `superuser`, `super_admin`, `super-admin` در بررسی دسترسی پشتیبانی می‌شوند.
- برای اعمال سیاست دیتابیس روی Supabase واقعی، فایل `supabase/migrations/20261016_fix_superuser_admin_access.sql` را در SQL Editor اجرا کنید.
- Edge Functionهای `admin-otp`, `admin-review-order`, و `admin-manage-user` را دوباره deploy کنید تا تغییرات سرور فعال شوند.
- بررسی بیلد کامل و تست ورود واقعی با پروژه Supabase انجام نشده است.
