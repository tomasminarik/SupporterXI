import { expect, test } from '@playwright/test';

const now = '2026-10-25T14:59:59.800Z';
const response = (opponent = 'Synthetic Preview FC', unknown = false, boundary = false) => ({
  schemaVersion: 2, players: [], contentRevision: 'a'.repeat(64), serverNow: now,
  nextRefreshAt: boundary ? '2026-10-25T15:00:00.000Z' : null,
  fixture: { id: '10000000-0000-4000-8000-000000000001', opponent, venue: 'away', competition: 'Synthetic Cup', round: 'Test round', status: 'scheduled', kickoff: unknown ? { kind: 'unknown' } : { kind: 'confirmed', at: '2026-10-25T12:00:00Z' } },
});

test('MVP-07: endpoint is fresh, read-only, server-timed and excludes internal content', async ({ request }) => {
  const before = Date.now();
  const result = await request.get('/api/featured-fixture');
  expect(result.status()).toBe(200);
  expect(result.headers()['cache-control']).toContain('no-store');
  const data = await result.json();
  expect(data.schemaVersion).toBe(2);
  expect(Array.isArray(data.players)).toBe(true);
  expect(Date.parse(data.serverNow)).toBeGreaterThanOrEqual(before);
  expect(Date.parse(data.serverNow)).toBeLessThanOrEqual(Date.now());
  expect(Object.keys(data).sort()).toEqual(['schemaVersion', 'contentRevision', 'serverNow', 'nextRefreshAt', 'locked', 'fixture', 'players'].sort());
  expect((await request.post('/api/featured-fixture', { data: {} })).status()).toBe(405);
});

test('MVP-07: initial error offers retry; unknown kickoff stays honest', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/featured-fixture', (route) => ++attempts === 1 ? route.fulfill({ status: 503 }) : route.fulfill({ json: response('Synthetic Preview FC', true) }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Fixture unavailable' })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'We couldn’t load the next fixture.' })).toHaveAttribute('data-tone', 'problem');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('Time to be confirmed').first()).toBeVisible();
  await expect(page.locator('time')).toHaveCount(0);
});

test('MVP-07: loading names the state without inventing an opponent', async ({ page }) => {
  await page.route('**/api/featured-fixture', () => {});
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Manchester United Loading next fixture…', exact: true })).toBeVisible();
  await expect(page.locator('main [aria-busy=true]')).toBeVisible();
  await expect(page.locator('.sx-formation')).toHaveCount(0);
});

test('MVP-07: focus refresh failure retains last data with stale feedback', async ({ page }) => {
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: response() }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Synthetic Preview FC/ })).toBeVisible();
  await expect(page.locator('time')).toHaveAttribute('datetime', '2026-10-25T12:00:00Z');
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ status: 500 }));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('alert').filter({ hasText: 'may be out of date' })).toHaveAttribute('data-tone', 'attention');
  await expect(page.getByRole('heading', { name: /Synthetic Preview FC/ })).toBeVisible();
});

test('MVP-07: rollover uses server interval despite a wrong browser clock', async ({ page }) => {
  await page.clock.install({ time: new Date('2035-01-01T00:00:00Z') });
  let calls = 0;
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: ++calls === 1 ? response('First Synthetic FC', false, true) : response('Second Synthetic FC') }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /First Synthetic FC/ })).toBeVisible();
  await page.clock.fastForward(201);
  await expect(page.getByRole('heading', { name: /Second Synthetic FC/ })).toBeVisible();
});

test.describe('kickoff language', () => {
  test.use({ locale: 'sk-SK', timezoneId: 'Europe/Bratislava' });
  test('MVP-07: kickoff is written in English, in the visitor’s own time zone', async ({ page }) => {
    await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: response() }));
    await page.goto('/');
    await expect(page.locator('time')).toHaveText('Sun, 25 Oct 2026, 13:00 CET');
  });
});
