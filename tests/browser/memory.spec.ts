import { expect, test, type Page } from '@playwright/test';
import { initialSquad } from '../../src/domain/squad';
const key = 'starting-xi:working:v1';
const makeContext = () => ({ schemaVersion: 2, contentRevision: 'a'.repeat(64), serverNow: new Date().toISOString(), nextRefreshAt: null, players: initialSquad.map(({ id, name, shirtNumber }) => ({ id, name, shirtNumber, selectable: true })), fixture: { id: '10000000-0000-4000-8000-000000000001', opponent: 'Synthetic A', venue: 'home', competition: null, round: null, status: 'scheduled', kickoff: { kind: 'unknown' } } });
const formationButton = (page: Page) => page.locator('.sx-formation');
async function chooseFormation(page: Page, name: string) {
  await formationButton(page).click();
  await page.getByRole('group', { name: 'Choose a formation' }).getByRole('button', { name, exact: true }).click();
}

test('MVP-02: the live builder starts on 4-2-3-1 Wide with eleven empty positions', async ({ page }) => {
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: makeContext() }));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Manchester United\s+v\s+Synthetic A/);
  await expect(formationButton(page)).toHaveText('4-2-3-1 Wide');
  await expect(page.getByRole('button', { name: /: Empty$/ })).toHaveCount(11);
  await expect(page.locator('.sx-pill')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Share your XI' })).toBeDisabled();
});

test('MVP-06/07: restore, availability, and explicit fixture transition', async ({ page }) => {
  let context = makeContext();
  const writes: string[] = [];
  page.on('request', (request) => { if (request.method() !== 'GET') writes.push(request.url()); });
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: context }));
  await page.goto('/');
  await chooseFormation(page, '4-3-3');
  await expect(formationButton(page)).toHaveText('4-3-3');
  await page.getByRole('button', { name: 'GK: Empty', exact: true }).click();
  await page.getByRole('button', { name: '1 Senne Lammens', exact: true }).click();
  await page.getByRole('button', { name: 'GK: Senne Lammens', exact: true }).click();
  await page.getByRole('radio', { name: 'Traditional Goalkeeper', exact: true }).check();
  await page.reload();
  await expect(page.getByRole('button', { name: 'GK: Senne Lammens, Traditional Goalkeeper', exact: true })).toBeVisible();
  await expect(page.locator('.sx-memory')).toContainText('Restored from this browser.');
  context.players[0].selectable = false;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByText('Some selected players are now unavailable.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'GK: Senne Lammens, Traditional Goalkeeper, unavailable', exact: true }).click();
  await page.getByRole('button', { name: 'Remove player', exact: true }).click();
  await expect(page.getByRole('button', { name: '1 Senne Lammens', exact: true })).toHaveCount(0);
  context = { ...context, fixture: { ...context.fixture, id: '10000000-0000-4000-8000-000000000002', opponent: 'Synthetic B' } };
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByText('The featured match is now Synthetic B.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Synthetic A');
  // The confirmation is part of the page: no browser dialog, and keeping or Escape changes nothing.
  page.on('dialog', () => { throw new Error('unexpected browser dialog'); });
  await page.getByRole('button', { name: 'Start new fixture' }).click();
  await expect(page.getByText('Start Synthetic B with an empty XI?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keep this XI' })).toBeFocused();
  await page.getByRole('button', { name: 'Keep this XI' }).click();
  await expect(page.getByRole('button', { name: 'Start new fixture' })).toBeFocused();
  await expect(formationButton(page)).toHaveText('4-3-3');
  await page.getByRole('button', { name: 'Start new fixture' }).click();
  await expect(page.getByRole('button', { name: 'Keep this XI' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByText('The featured match is now Synthetic B.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Synthetic A');
  await page.getByRole('button', { name: 'Start new fixture' }).click();
  await page.getByRole('button', { name: 'Start with an empty XI' }).click();
  await expect(formationButton(page)).toHaveText('4-2-3-1 Wide');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Synthetic B');
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([key]);
});

test('MVP-06: corrupt memory requires explicit reset', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{broken'), key);
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: makeContext() }));
  await page.goto('/');
  await expect(page.getByRole('status').filter({ hasText: 'This browser’s lineup could not be restored.' })).toHaveAttribute('data-tone', 'problem');
  await expect(formationButton(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset and start this fixture' }).click();
  await expect(formationButton(page)).toHaveText('4-2-3-1 Wide');
});

test('MVP-06: storage failure leaves editing usable', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); }; });
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: makeContext() }));
  await page.goto('/');
  await expect(page.getByRole('status').filter({ hasText: 'Browser memory is unavailable.' })).toHaveAttribute('data-tone', 'attention');
  await expect(page.locator('.sx-memory')).toHaveCount(0);
  await chooseFormation(page, '4-3-3');
  await page.getByRole('button', { name: 'GK: Empty', exact: true }).click();
  await page.getByRole('button', { name: '1 Senne Lammens', exact: true }).click();
  await expect(page.getByRole('button', { name: 'GK: Senne Lammens', exact: true })).toBeVisible();
});
