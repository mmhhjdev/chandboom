# Patch مجله و مقالات چندبوم

این بسته برای ساختار Vite + React Router پروژه چندبوم آماده شده است. فایل‌های داخل `src/` را با مسیرهای هم‌نام پروژه ادغام/جایگزین کنید و پوشه `public/assets/articles` را در `public/assets/articles` پروژه کپی کنید. اگر فایل `public/sitemap.xml` در پروژه‌تان متفاوت است، فقط URLهای `/articles` و هفت URL مقاله را به sitemap فعلی اضافه کنید و فایل را کورکورانه جایگزین نکنید.

## فایل‌های تغییر یافته
- `src/App.tsx`: اضافه شدن مسیرهای `/articles` و `/articles/:slug`
- `src/pages/BlogPage.tsx`: صفحه فهرست مقالات
- `src/pages/ArticlePage.tsx`: صفحه اختصاصی هر مقاله با SEO metadata و Article JSON-LD
- `src/data/articles.ts`: محتوای ۷ مقاله
- `src/components/SEOLayout.tsx`: لینک مجله در منو و فوتر
- `src/components/LandingPage.tsx`: دکمه مشاهده همه مقالات در بخش فعلی بلاگ
- `public/assets/articles/*.svg`: هفت تصویر شاخص برداری اختصاصی
- `public/sitemap.xml`: مسیرهای مقالات (در صورت ادغام با sitemap فعلی)

## بررسی
پس از ادغام در پوشه اصلی پروژه اجرا کنید: `npm.cmd run lint` سپس `npm.cmd run build`. این پچ در محیط نصب‌شده پروژه شما اجرا نشده؛ اگر خطایی گرفتید متن کامل خطا را بفرستید. برای انتشار مستقیم، تنظیمات هاست باید مسیرهای React Router را به `index.html` برگرداند.
