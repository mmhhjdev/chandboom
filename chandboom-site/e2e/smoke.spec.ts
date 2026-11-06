import { test, expect, type Page } from '@playwright/test';

/** Collects uncaught JS errors. A blank screen or a crash on load shows up here. */
function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

test.describe('SEO and document shell', () => {
  test('home page is Persian RTL with canonical and CSP meta', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://chandboom.ir/');
    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
  });

  test('pricing page has its own canonical and title', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://chandboom.ir/pricing');
    await expect(page).toHaveTitle(/تعرفه/);
  });

  test('sitemap lists the public pages', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('https://chandboom.ir/pricing');
    expect(body).toContain('https://chandboom.ir/articles/simple-monthly-budget');
    expect(body).not.toContain('/dashboard');
  });
});

test.describe('app boot', () => {
  test('home renders React content without uncaught errors', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15_000 });
    expect(errors).toEqual([]);
  });

  test('a deep-linked article hydrates the app (asset paths are absolute)', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/articles/simple-monthly-budget');
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15_000 });
    expect(errors).toEqual([]);
  });
});

test.describe('cookie consent', () => {
  test('banner appears and "only essential" hides it', async ({ page }) => {
    await page.goto('/');
    const banner = page.getByRole('dialog', { name: 'تنظیمات کوکی' });
    await expect(banner).toBeVisible({ timeout: 10_000 });
    await banner.getByRole('button', { name: 'فقط ضروری' }).click();
    await expect(banner).toHaveCount(0);
  });

  test('google analytics script is NOT loaded before consent', async ({ page }) => {
    const gtagRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('googletagmanager.com')) gtagRequests.push(req.url());
    });
    await page.goto('/');
    await page.waitForTimeout(1500);
    expect(gtagRequests).toEqual([]);
  });
});
