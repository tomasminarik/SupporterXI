import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('MVP-07 empty state, Supporter XI name, initial MVP-13/14', async ({ page }) => {
  const errors: string[] = [];
  const unexpectedRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:3100' || request.method() !== 'GET') unexpectedRequests.push(`${request.method()} ${request.url()}`);
  });
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: { schemaVersion: 2, contentRevision: 'a'.repeat(64), serverNow: new Date().toISOString(), nextRefreshAt: null, fixture: null, players: [] } }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'No upcoming fixture' })).toBeVisible();
  await expect(page.getByText('No eligible match is currently published.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: /export|save|sign in|build/i })).toHaveCount(0);
  await expect(page.locator('time, form, img')).toHaveCount(0);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page.getByRole('img', { name: 'Supporter XI' })).toBeVisible();
  await expect(page).toHaveTitle(/^Supporter XI/);
  // Search engines are kept out until supporterxi.com is the production domain (tests/unit/site.test.ts).
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://supporterxi.com');
  expect(await (await page.request.get('/robots.txt')).text()).toMatch(/Disallow: \/\s*$/m);
  await expect(page.getByRole('region', { name: 'Lineup pitch' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  expect(unexpectedRequests).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `test-results/entry-${test.info().project.name}.png`, fullPage: true });
});

test('MVP-14: excluded supporter destinations have no routes', async ({ request }) => {
  for (const route of ['/login', '/community', '/archive', '/fixtures', '/lineups/example', '/dev/workbench']) {
    expect((await request.get(route)).status()).toBe(404);
  }
});

test('the footer gives a contact address that is not written in the page source', async ({ page }) => {
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: { schemaVersion: 2, contentRevision: 'a'.repeat(64), serverNow: new Date().toISOString(), nextRefreshAt: null, fixture: null, players: [] } }));
  for (const path of ['/', '/gameplan', '/no-such-page']) {
    // What a harvester reading the raw page gets: no address and no mailto link.
    const source = await (await page.request.get(path)).text();
    expect(source, path).not.toMatch(/dugout@|mailto:/i);
    expect(source, path).toContain('dugout at supporterxi.com');
    await page.goto(path);
    const link = page.getByRole('contentinfo').getByRole('link', { name: 'dugout@supporterxi.com' });
    await expect(link).toHaveAttribute('href', 'mailto:dugout@supporterxi.com');
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(24);
    // It is the footer's only link: /gameplan is public but nothing links to it (user decision, 10 October 2026).
    await expect(page.getByRole('contentinfo').getByRole('link')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect((await new AxeBuilder({ page }).include('footer').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
});
