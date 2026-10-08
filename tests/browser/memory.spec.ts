import { expect, test } from '@playwright/test';
import { initialSquad } from '../../src/domain/squad';
const key = 'starting-xi:working:v1';
const makeContext = () => ({ schemaVersion: 2, contentRevision: 'a'.repeat(64), serverNow: new Date().toISOString(), nextRefreshAt: null, players: initialSquad.map(({ id, name, shirtNumber }) => ({ id, name, shirtNumber, selectable: true })), fixture: { id: '10000000-0000-4000-8000-000000000001', opponent: 'Synthetic A', venue: 'home', competition: null, round: null, status: 'scheduled', kickoff: { kind: 'unknown' } } });

test('MVP-06/07: restore, availability, and explicit fixture transition', async ({ page }) => {
  let context = makeContext();
  const writes: string[] = [];
  page.on('request', (request) => { if (request.method() !== 'GET') writes.push(request.url()); });
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: context }));
  await page.goto('/');
  const formation = page.getByRole('combobox', { name: 'Formation', exact: true });
  await formation.selectOption('4-3-3');
  await page.getByRole('button', { name: 'GK: Empty', exact: true }).click();
  await page.getByRole('button', { name: '1 Senne Lammens', exact: true }).click();
  await page.getByRole('combobox', { name: 'Optional role', exact: true }).selectOption('traditional-goalkeeper');
  await page.reload();
  await expect(page.getByRole('button', { name: 'GK: Senne Lammens, Traditional Goalkeeper', exact: true })).toBeVisible();
  context.players[0].selectable = false;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('.lab-availability')).toBeVisible();
  await page.getByRole('button', { name: 'GK: Senne Lammens, Traditional Goalkeeper', exact: true }).click();
  await page.getByRole('button', { name: 'Remove player', exact: true }).click();
  await expect(page.getByRole('button', { name: '1 Senne Lammens', exact: true })).toHaveCount(0);
  context = { ...context, fixture: { ...context.fixture, id: '10000000-0000-4000-8000-000000000002', opponent: 'Synthetic B' } };
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('.session-context')).toContainText('Synthetic A');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Start new fixture' }).click();
  await expect(formation).toHaveValue('4-3-3');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Start new fixture' }).click();
  await expect(formation).toHaveValue('');
  await expect(page.locator('.session-context')).toContainText('Synthetic B');
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([key]);
});

test('MVP-06: corrupt memory requires explicit reset', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{broken'), key);
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: makeContext() }));
  await page.goto('/');
  await expect(page.getByText('This browser’s lineup could not be restored.')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Formation', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset and start this fixture' }).click();
  await expect(page.getByRole('combobox', { name: 'Formation', exact: true })).toHaveValue('');
});

test('MVP-06: storage failure leaves editing usable', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); }; });
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: makeContext() }));
  await page.goto('/');
  await expect(page.getByText('Browser memory is unavailable.', { exact: false })).toBeVisible();
  await page.getByRole('combobox', { name: 'Formation', exact: true }).selectOption('4-3-3');
  await page.getByRole('button', { name: 'GK: Empty', exact: true }).click();
  await page.getByRole('button', { name: '1 Senne Lammens', exact: true }).click();
  await expect(page.getByRole('button', { name: 'GK: Senne Lammens', exact: true })).toBeVisible();
});
