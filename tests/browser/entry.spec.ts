import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('MVP-07 empty state, MVP-10 seed, initial MVP-13/14', async ({ page }) => {
  const errors: string[] = [];
  const unexpectedRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:3100' || request.method() !== 'GET') unexpectedRequests.push(`${request.method()} ${request.url()}`);
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'No upcoming fixture' })).toBeVisible();
  await expect(page.getByText('No eligible match is currently published.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: /export|save|sign in|build/i })).toHaveCount(0);
  await expect(page.locator('time, form, img')).toHaveCount(0);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('summary')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listitem')).toHaveCount(36);
  for (const name of ['Matthijs de Ligt', 'Patrick Dorgu', 'Amad', 'Benjamin Šeško', 'Lisandro Martínez', 'Diego León']) await expect(page.getByText(name, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  await page.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Senne Lammens')).not.toBeVisible();
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
