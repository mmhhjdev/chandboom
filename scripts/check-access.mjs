/**
 * تشخیص دسترسی سرویس‌های سایت چندبوم از شبکه‌ی فعلی شما (بدون VPN).
 * اجرا (Node 18 یا جدیدتر)، داخل پوشه‌ی پروژه:
 *   node scripts/check-access.mjs
 * خروجی: برای هر سرویس، وضعیت DNS و پاسخ HTTP یا خطای واقعی و زمان پاسخ.
 */
import dns from 'node:dns/promises';

const HOSTS = ['chandboom.ir', 'yqmhtfuwnnlzenqrhyxm.supabase.co', 'fonts.googleapis.com', 'fonts.gstatic.com', 'www.googletagmanager.com', 'github.com'];
const URLS = [
  ['سایت (GitHub Pages)', 'https://chandboom.ir/'],
  ['فایل استاتیک سایت', 'https://chandboom.ir/favicon.ico'],
  ['Supabase: سلامت Auth', 'https://yqmhtfuwnnlzenqrhyxm.supabase.co/auth/v1/health'],
  ['Supabase: REST API', 'https://yqmhtfuwnnlzenqrhyxm.supabase.co/rest/v1/'],
  ['Google Fonts (CSS)', 'https://fonts.googleapis.com/css2?family=Cairo'],
  ['Google Analytics', 'https://www.googletagmanager.com/gtag/js?id=G-TEST'],
  ['GitHub', 'https://github.com/'],
];

const TIMEOUT_MS = 10000;

async function checkDns(host) {
  try {
    const ips = await dns.resolve4(host);
    return `DNS ✓ ${ips.join(', ')}`;
  } catch (e) {
    return `DNS ✗ ${e.code || e.message}`;
  }
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = performance.now();
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal, redirect: 'manual' });
    const ms = Math.round(performance.now() - started);
    return `HTTP ${res.status} (${ms} ms)`;
  } catch (e) {
    const ms = Math.round(performance.now() - started);
    const reason = e.name === 'AbortError' ? `timeout بعد از ${ms} ms` : (e.cause?.code || e.message);
    return `✗ ${reason}`;
  } finally {
    clearTimeout(timer);
  }
}

console.log('=== DNS ===');
for (const host of HOSTS) console.log(host.padEnd(36), await checkDns(host));

console.log('\n=== HTTP ===');
for (const [label, url] of URLS) console.log(label.padEnd(24), await checkUrl(url));
console.log('\nاگر «DNS ✗» یا «timeout» دیدید، آن سرویس از شبکه‌ی شما قابل دسترسی نیست.');
