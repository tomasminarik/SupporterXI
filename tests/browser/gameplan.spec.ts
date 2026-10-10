import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { cssTokens, groups } from '../../src/design/tokens';

test('the design system page is live, readable and kept out of search engines (MVP-13, MVP-14)', async ({ page }) => {
  const errors: string[] = [];
  const unexpectedRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:3100' || request.method() !== 'GET' || request.url().includes('/api/')) unexpectedRequests.push(`${request.method()} ${request.url()}`);
  });
  await page.goto('/gameplan');
  await expect(page.getByRole('heading', { level: 1, name: 'Gameplan' })).toBeVisible();
  await expect(page).toHaveTitle(/^Gameplan/);
  // Never indexed, whatever the rest of the site asks for (tests/unit/design-tokens.test.ts covers the source).
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex, nofollow');
  for (const title of ['Brand', 'Colour', 'Type', 'Spacing', 'Motion', 'Depth', 'States', 'Parts in use', 'Rules']) await expect(page.getByRole('heading', { level: 2, name: title, exact: true })).toBeVisible();

  // The page shows the values the site really uses. The build shortens values (#ffffff becomes #fff), so every
  // token is checked to exist and each colour is compared as the browser paints it.
  const live = await page.evaluate((names) => { const style = getComputedStyle(document.documentElement); return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()])); }, Object.keys(cssTokens));
  for (const name of Object.keys(cssTokens)) expect(live[name], name).not.toBe('');
  for (const token of groups.filter((group) => group.kind === 'colour').flatMap((group) => group.tokens)) {
    const n = parseInt(token.value.slice(1), 16);
    await expect(page.locator('.gp-swatches li', { has: page.getByText(`--sx-${token.name}`, { exact: true }) }).locator('.gp-swatch'), token.name).toHaveCSS('background-color', `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`);
  }
  for (const name of Object.keys(cssTokens)) await expect(page.getByText(name, { exact: true })).toHaveCount(1);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
  expect(unexpectedRequests).toEqual([]);
});

test('the builder does not link to the design system page', async ({ page }) => {
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: { schemaVersion: 2, contentRevision: 'a'.repeat(64), serverNow: new Date().toISOString(), nextRefreshAt: null, fixture: null, players: [] } }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'No upcoming fixture' })).toBeVisible();
  await expect(page.locator('a[href*=gameplan]')).toHaveCount(0);
});
