import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { catalogueVersion, draftKey } from '../../src/domain/draft';
import { formations } from '../../src/domain/catalogues';
import { initialSquad } from '../../src/domain/squad';

// User decision, 10 October 2026: a match locks 15 minutes after kickoff and the next one opens at 120.
const players = initialSquad.map(({ id, name, shirtNumber }) => ({ id, name, shirtNumber, selectable: true }));
const fixture = { id: '10000000-0000-4000-8000-000000000001', opponent: 'Synthetic A', venue: 'home', competition: null, round: null, status: 'scheduled', kickoff: { kind: 'confirmed', at: '2026-10-25T12:00:00Z' } };
const open = { schemaVersion: 2, contentRevision: 'a'.repeat(64), serverNow: '2026-10-25T12:14:59.700Z', nextRefreshAt: '2026-10-25T12:15:00.000Z', locked: false, players, fixture };
const locked = { ...open, serverNow: '2026-10-25T12:15:00.000Z', nextRefreshAt: '2026-10-25T14:00:00.000Z', locked: true };
const slots = formations[0].slots.map((slot) => slot[0]);
const draft = (count: number) => ({ schemaVersion: 1, catalogueVersion, contentRevision: open.contentRevision, fixture, players,
  lineup: { formationId: formations[0].id, slots: Object.fromEntries(slots.map((slot, index) => [slot, index < count ? { playerId: players[index].id, roleId: null } : null])) } });
async function remember(page: Page, count: number) {
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [draftKey, JSON.stringify(draft(count))]);
}

test('MVP-07: the XI locks by itself 15 minutes after kickoff, using server time', async ({ page }) => {
  let current: typeof open = open;
  let requests = 0;
  await page.route('**/api/featured-fixture', (route) => { requests++; return route.fulfill({ json: current }); });
  await remember(page, 10);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pick your XI' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pick 1 more to share' })).toBeVisible();
  current = locked;
  // No reload and no click: the page asks again at the moment the server said the lock comes.
  const notice = page.getByRole('status').filter({ hasText: 'This match has kicked off. Your XI is locked.' });
  await expect(notice).toBeVisible();
  await expect(notice.locator('time')).toHaveAttribute('datetime', '2026-10-25T14:00:00.000Z');
  expect(requests).toBeGreaterThanOrEqual(2);
  await expect(page.locator('.sx-squad')).toHaveCount(0);
  await expect(page.locator('.sx-pill')).toHaveCount(10);
  // An XI that was not finished in time cannot be completed or shared.
  await expect(page.getByRole('button', { name: 'Share your XI' })).toBeDisabled();
  await expect(page.getByRole('button', { name: /more to share/ })).toHaveCount(0);
});

test('MVP-07, 08, 13: a locked XI can be read and shared but not changed', async ({ page }) => {
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: locked }));
  await remember(page, 11);
  await page.goto('/');
  await expect(page.getByText('This match has kicked off. Your XI is locked.')).toBeVisible();
  const before = await page.evaluate((key) => localStorage.getItem(key), draftKey);
  const formation = page.locator('.sx-formation');
  await expect(formation).toBeDisabled();
  await expect(formation).toHaveAccessibleName('Formation: 4-2-3-1 Wide');
  // Every position is still announced; pressing one opens nothing.
  const keeper = page.getByRole('button', { name: 'GK: Senne Lammens', exact: true });
  await expect(keeper).toHaveAttribute('aria-disabled', 'true');
  // Playwright refuses to click a disabled control, so the click is forced as a mouse would make it.
  await keeper.click({ force: true });
  await expect(page.locator('.sx-menu')).toHaveCount(0);
  await keeper.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.sx-menu')).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'This XI is locked: the match has kicked off.' })).toHaveCount(1);
  await expect(page.locator('.sx-squad, .sx-card')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Clear XI|Remove player/ })).toHaveCount(0);
  if (test.info().project.name === 'desktop') {
    // A drag with the mouse moves nothing.
    const from = (await keeper.boundingBox())!;
    const to = (await page.locator('#slot-st').boundingBox())!;
    await page.mouse.move(from.x + 10, from.y + 10);
    await page.mouse.down();
    await page.mouse.move(to.x + 10, to.y + 10, { steps: 8 });
    await expect(page.locator('.sx-ghost')).toHaveCount(0);
    await page.mouse.up();
  }
  expect(await page.evaluate((key) => localStorage.getItem(key), draftKey)).toBe(before);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // Sharing still works.
  await page.getByRole('button', { name: 'Share your XI' }).click();
  await expect(page.getByRole('dialog', { name: 'Share your XI' }).getByRole('img', { name: /^Preview of your image/ })).toBeVisible();
});

test('MVP-07: when the next match takes over, the open XI stays locked and a new one can be started', async ({ page }) => {
  let current: object = locked;
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: current }));
  await remember(page, 11);
  await page.goto('/');
  await expect(page.getByText('This match has kicked off. Your XI is locked.')).toBeVisible();
  current = { ...open, serverNow: '2026-10-25T14:00:00.000Z', nextRefreshAt: '2026-10-28T18:15:00.000Z', fixture: { ...fixture, id: '10000000-0000-4000-8000-000000000002', opponent: 'Synthetic B', kickoff: { kind: 'confirmed', at: '2026-10-28T18:00:00Z' } } };
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByText('The featured match is now Synthetic B.')).toBeVisible();
  await expect(page.getByText('Your open XI belongs to the earlier match and can no longer be changed.')).toBeVisible();
  await expect(page.locator('.sx-formation')).toBeDisabled();
  await expect(page.locator('.sx-squad')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start new fixture' }).click();
  await page.getByRole('button', { name: 'Start with an empty XI' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Synthetic B');
  await expect(page.locator('.sx-formation')).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'Pick your XI' })).toBeVisible();
  await expect(page.getByRole('button', { name: /: Empty$/ })).toHaveCount(11);
});
