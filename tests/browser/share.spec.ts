import { expect, test, type Download, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { catalogueVersion, draftKey } from '../../src/domain/draft';
import { formations } from '../../src/domain/catalogues';
import { initialSquad } from '../../src/domain/squad';

const players = initialSquad.map(({ id, name, shirtNumber }) => ({ id, name, shirtNumber, selectable: true }));
const fixture = { id: '10000000-0000-4000-8000-000000000001', opponent: 'Synthetic A', venue: 'home', competition: null, round: null, status: 'scheduled', kickoff: { kind: 'unknown' } };
const context = { schemaVersion: 2, contentRevision: 'a'.repeat(64), serverNow: '2026-10-09T12:00:00.000Z', nextRefreshAt: null, players, fixture };
const slots = formations[0].slots.map((slot) => slot[0]);
/** A remembered XI with `count` players placed, the first of them with a role. */
function draft(count: number) {
  return { schemaVersion: 1, catalogueVersion, contentRevision: context.contentRevision, fixture, players,
    lineup: { formationId: formations[0].id, slots: Object.fromEntries(slots.map((slot, index) => [slot, index < count ? { playerId: players[index].id, roleId: slot === 'lb' ? 'stay-back-full-back' : null } : null])) } };
}
async function open(page: Page, count: number) {
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: context }));
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [draftKey, JSON.stringify(draft(count))]);
  await page.goto('/');
  await expect(page.locator('.sx-pill')).toHaveCount(count);
}
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Share your XI' });
const preview = (page: Page) => dialog(page).getByRole('img', { name: /^Preview of your image/ });
async function pngSize(download: Download) {
  const bytes = await readFile(await download.path());
  expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(bytes.subarray(12, 16).toString('latin1')).toBe('IHDR');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test('MVP-08: an incomplete XI cannot be exported and says what is missing', async ({ page }) => {
  await open(page, 10);
  const button = page.getByRole('button', { name: 'Pick 1 more to share' });
  await expect(button).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share your XI' })).toHaveCount(0);
  await button.click();
  await expect(dialog(page)).toHaveCount(0);
  // It leads to the position that still needs a player.
  await expect(page.getByRole('button', { name: 'ST: Empty', exact: true })).toBeFocused();
});

test('MVP-08, 13, 14: all three PNGs download at their exact size, by keyboard, without leaving the browser', async ({ page, baseURL }) => {
  const elsewhere: string[] = [];
  const writes: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith(baseURL!) && !/^(blob|data):/.test(request.url())) elsewhere.push(request.url());
    if (request.method() !== 'GET') writes.push(request.url());
  });
  await open(page, 11);
  const share = page.getByRole('button', { name: 'Share your XI' });
  await share.focus();
  await page.keyboard.press('Enter');
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).getByRole('heading', { name: 'Share your XI' })).toBeFocused();
  await expect(preview(page)).toBeVisible();
  // The preview names the match, formation and players; roles appear nowhere in the dialog.
  await expect(preview(page)).toHaveAttribute('alt', /Manchester United v Synthetic A, 4-2-3-1 Wide: Senne Lammens, Diogo Dalot/);
  await expect(dialog(page)).not.toContainText('Stay-Back Full-Back');
  expect(await preview(page).getAttribute('alt')).not.toContain('Stay-Back');
  expect((await new AxeBuilder({ page }).include('dialog').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);

  await expect(dialog(page).getByRole('radio', { name: /Square/ })).toBeChecked();
  const downloadButton = dialog(page).getByRole('button', { name: 'Download image' });
  await downloadButton.focus();
  const [square] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')]);
  expect(square.suggestedFilename()).toBe('supporter-xi-v-synthetic-a-square.png');
  expect(await pngSize(square)).toEqual({ width: 1080, height: 1080 });
  await expect(dialog(page).getByRole('status').filter({ hasText: 'Download started' })).toBeVisible();

  await dialog(page).getByRole('radio', { name: /Square/ }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(dialog(page).getByRole('radio', { name: /Landscape/ })).toBeChecked();
  await expect(preview(page)).toHaveJSProperty('naturalWidth', 1920);
  const [landscape] = await Promise.all([page.waitForEvent('download'), downloadButton.click()]);
  expect(landscape.suggestedFilename()).toBe('supporter-xi-v-synthetic-a-landscape.png');
  expect(await pngSize(landscape)).toEqual({ width: 1920, height: 1080 });
  // Landscape shows the desktop pitch: grass in the middle, the dark page beside the far touchline.
  const wide = await preview(page).evaluate((image: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    const at = (x: number, y: number) => [...ctx.getImageData(x, y, 1, 1).data.slice(0, 3)];
    return { grass: at(700, 760), beside: at(60, 300) };
  });
  expect(wide.grass[1]).toBeGreaterThan(wide.grass[0] + 20);
  expect(wide.beside).toEqual([12, 14, 13]);

  await dialog(page).getByRole('radio', { name: /Landscape/ }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(dialog(page).getByRole('radio', { name: /Portrait/ })).toBeChecked();
  await expect(preview(page)).toHaveJSProperty('naturalHeight', 1920);
  const [story] = await Promise.all([page.waitForEvent('download'), downloadButton.click()]);
  expect(story.suggestedFilename()).toBe('supporter-xi-v-synthetic-a-portrait.png');
  expect(await pngSize(story)).toEqual({ width: 1080, height: 1920 });

  // The picture itself: the dark page at the corner, grass in the middle of the pitch, white and red on a player.
  const colours = await preview(page).evaluate(async (image: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    const at = (x: number, y: number) => [...ctx.getImageData(x, y, 1, 1).data.slice(0, 3)];
    const all = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let red = 0; let white = 0; let yellow = 0;
    for (let index = 0; index < all.length; index += 4) {
      if (all[index] === 218 && all[index + 1] === 54 && all[index + 2] === 46) red++;
      if (all[index] === 255 && all[index + 1] === 255 && all[index + 2] === 255) white++;
      if (all[index] === 245 && all[index + 1] === 197 && all[index + 2] === 24) yellow++;
    }
    return { corner: at(4, 4), grass: at(300, 1000), red, white, yellow };
  });
  expect(colours.corner).toEqual([12, 14, 13]);
  expect(colours.grass[1]).toBeGreaterThan(colours.grass[0] + 20);
  expect(colours.grass[1]).toBeGreaterThan(colours.grass[2] + 20);
  expect(colours.red).toBeGreaterThan(20_000);
  expect(colours.white).toBeGreaterThan(20_000);
  // The address in the footer is the only yellow on the image.
  expect(colours.yellow).toBeGreaterThan(1_500);

  // Escape closes, focus returns to the button, and the XI is as it was.
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toHaveCount(0);
  await expect(share).toBeFocused();
  await expect(page.locator('.sx-pill')).toHaveCount(11);
  expect(elsewhere).toEqual([]);
  expect(writes).toEqual([]);
});

test('MVP-08: a failed export keeps the XI and can be retried', async ({ page }) => {
  let blocked = true;
  await page.route('**/turf.webp', (route) => blocked ? route.abort() : route.continue());
  await open(page, 11);
  await page.getByRole('button', { name: 'Share your XI' }).click();
  await expect(dialog(page).getByRole('alert')).toContainText('The image could not be made.');
  await expect(dialog(page).getByRole('alert')).toContainText('Your XI is unchanged.');
  await expect(dialog(page).getByRole('button', { name: 'Download image' })).toBeDisabled();
  blocked = false;
  await dialog(page).getByRole('button', { name: 'Try again' }).click();
  await expect(preview(page)).toBeVisible();
  await expect(dialog(page).getByRole('button', { name: 'Download image' })).toBeEnabled();
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('.sx-pill')).toHaveCount(11);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).lineup.slots.st !== null, draftKey)).toBe(true);
});

test('MVP-08: the image is drawn from the XI as it was when sharing started', async ({ page }) => {
  await open(page, 11);
  await page.getByRole('button', { name: 'Share your XI' }).click();
  await expect(preview(page)).toBeVisible();
  const before = await preview(page).getAttribute('alt');
  // The published squad changes underneath the open dialog; the snapshot does not follow it.
  await page.unroute('**/api/featured-fixture');
  await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: { ...context, fixture: { ...fixture, opponent: 'Renamed' }, players: players.map((player, index) => index === 0 ? { ...player, name: 'Changed Name' } : player) } }));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Renamed');
  await dialog(page).getByRole('radio', { name: /Portrait/ }).check();
  await expect(preview(page)).toHaveJSProperty('naturalHeight', 1920);
  expect(await preview(page).getAttribute('alt')).toBe(before);
  const [story] = await Promise.all([page.waitForEvent('download'), dialog(page).getByRole('button', { name: 'Download image' }).click()]);
  expect(story.suggestedFilename()).toBe('supporter-xi-v-synthetic-a-portrait.png');
});
