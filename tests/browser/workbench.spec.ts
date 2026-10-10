import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { formations, rolesForFamily } from '../../src/domain/catalogues';
import { catalogueVersion, previewDraftKey } from '../../src/domain/draft';
import { initialSquad } from '../../src/domain/squad';

const formationButton = (page: Page) => page.locator('.sx-formation');
const picker = (page: Page) => page.getByRole('group', { name: 'Choose a formation' });
const role = (page: Page, name: string) => page.getByRole('radio', { name, exact: true });
// With motion on, wait for entrance animations to end before measuring positions or contrast.
const settled = (page: Page) => expect.poll(() => page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0);
async function chooseFormation(page: Page, name: string) {
  await formationButton(page).click();
  await picker(page).getByRole('button', { name, exact: true }).click();
}

test('MVP-01–05, 13: inspect and edit a real in-memory XI', async ({ page }) => {
  await page.goto('/dev/workbench');
  await expect(page.getByText('Preview only', { exact: false })).toBeVisible();
  await expect(formationButton(page)).toHaveText('4-2-3-1 Wide');
  await expect(page.getByRole('button', { name: /: Empty$/ })).toHaveCount(11);
  await formationButton(page).click();
  await expect(picker(page).locator('.sx-chip')).toHaveCount(14);
  await expect(picker(page).getByRole('button', { pressed: true })).toHaveText(/4-2-3-1 Wide/);
  await picker(page).getByRole('button', { name: '4-3-3', exact: true }).click();
  await expect(picker(page)).toBeHidden();
  await expect(formationButton(page)).toHaveText('4-3-3');
  await expect(page.getByRole('button', { name: /: Empty$/ })).toHaveCount(11);

  await page.getByRole('button', { name: 'LB: Empty', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pick your full-back' })).toBeVisible();
  // Selected is shown by inversion, not by an outline that could be mistaken for focus.
  await expect(page.getByRole('button', { name: 'LB: Empty', exact: true })).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: '2 Diogo Dalot' }).click();
  await page.getByRole('button', { name: 'LB: Diogo Dalot', exact: true }).click();
  await role(page, 'Stay-Back Full-Back').check();
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await expect(page.getByText('Holds a deeper flank position to protect against transitions.', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '2 Diogo Dalot' })).toHaveCount(0);
  await page.keyboard.press('Escape');

  // Hovering previews a formation on the real pitch with its consequences; Escape keeps the XI unchanged.
  await formationButton(page).click();
  await picker(page).getByRole('button', { name: '3-4-3 Wide', exact: true }).hover();
  await expect(picker(page)).toContainText('Roles cleared: Diogo Dalot (Stay-Back Full-Back)');
  await expect(formationButton(page)).toHaveText('3-4-3 Wide');
  await expect(page.getByRole('button', { name: 'LWB: Diogo Dalot', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(picker(page)).toBeHidden();
  await expect(formationButton(page)).toHaveText('4-3-3');
  await expect(page.getByRole('button', { name: 'LB: Diogo Dalot, Stay-Back Full-Back', exact: true })).toBeVisible();
  await chooseFormation(page, '3-4-3 Wide');
  await expect(picker(page)).toBeHidden();
  await expect(formationButton(page)).toHaveText('3-4-3 Wide');

  await page.getByRole('button', { name: 'LWB: Diogo Dalot', exact: true }).click();
  await expect(role(page, 'No role')).toBeChecked();
  await expect(page.locator('.sx-option-name')).toHaveText(['No role', 'Overlapping Full-Back', 'Inverted Full-Back']);
  await role(page, 'Inverted Full-Back').check();
  await expect(page.getByRole('button', { name: 'LWB: Diogo Dalot, Inverted Full-Back', exact: true })).toBeVisible();
  // Moving is by dragging on desktop; elsewhere a player is removed and placed again. Either way the role stays behind.
  if (test.info().project.name === 'desktop') {
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'LWB: Diogo Dalot, Inverted Full-Back', exact: true }).dragTo(page.getByRole('button', { name: 'ST: Empty', exact: true }));
  } else {
    await page.getByRole('button', { name: 'Remove player', exact: true }).click();
    await page.getByRole('button', { name: 'ST: Empty', exact: true }).click();
    await page.getByRole('button', { name: '2 Diogo Dalot' }).click();
  }
  await expect(page.getByRole('button', { name: 'LWB: Empty', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ST: Diogo Dalot', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ST: Diogo Dalot', exact: true }).click();
  await expect(role(page, 'No role')).toBeChecked();
  await role(page, 'False Nine').check();
  await expect(page.getByRole('heading', { name: 'Replace Dalot' })).toBeVisible();
  await page.getByRole('button', { name: '8 Bruno Fernandes' }).click();
  await expect(page.getByRole('button', { name: 'ST: Bruno Fernandes, False Nine', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  if (test.info().project.name === 'desktop') {
    await page.getByRole('button', { name: 'ST: Bruno Fernandes, False Nine', exact: true }).dragTo(page.getByRole('button', { name: 'GK: Empty', exact: true }));
    await expect(page.getByRole('button', { name: 'GK: Bruno Fernandes', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '30 Benjamin Šeško' }).dragTo(page.getByRole('button', { name: 'ST: Empty', exact: true }));
    await expect(page.getByRole('button', { name: 'ST: Benjamin Šeško', exact: true })).toBeVisible();
    // A card dropped near a position, not exactly on it, still lands there.
    await page.getByRole('searchbox', { name: 'Search players' }).fill('Ugarte');
    await page.getByRole('button', { name: '25 Manuel Ugarte' }).scrollIntoViewIfNeeded();
    const card = (await page.getByRole('button', { name: '25 Manuel Ugarte' }).boundingBox())!;
    const lwb = (await page.getByRole('button', { name: 'LWB: Empty', exact: true }).boundingBox())!;
    await page.mouse.move(card.x + card.width / 2, card.y + card.height / 2);
    await page.mouse.down();
    await page.mouse.move(lwb.x + lwb.width / 2 + 25, lwb.y + lwb.height / 2 + 20, { steps: 8 });
    await expect(page.getByRole('button', { name: 'LWB: Empty', exact: true })).toHaveAttribute('data-drop', 'true');
    await page.mouse.up();
    await expect(page.getByRole('button', { name: 'LWB: Manuel Ugarte', exact: true })).toBeVisible();
    // Escape cancels a drag in progress.
    await page.getByRole('searchbox', { name: 'Search players' }).fill('Mainoo');
    const other = (await page.getByRole('button', { name: '37 Kobbie Mainoo' }).boundingBox())!;
    const rwb = (await page.getByRole('button', { name: 'RWB: Empty', exact: true }).boundingBox())!;
    await page.mouse.move(other.x + other.width / 2, other.y + other.height / 2);
    await page.mouse.down();
    await page.mouse.move(rwb.x + rwb.width / 2, rwb.y + rwb.height / 2, { steps: 8 });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await expect(page.getByRole('button', { name: 'RWB: Empty', exact: true })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Search players' }).fill('');
  }
  // Player first, then position.
  await page.getByRole('button', { name: '9 Marcus Rashford' }).click();
  await expect(page.getByRole('heading', { name: 'Place Rashford' })).toBeVisible();
  await page.getByRole('button', { name: /: Empty$/ }).first().click();
  await expect(page.getByRole('button', { name: /: Marcus Rashford$/ })).toHaveCount(1);
  while (await page.getByRole('button', { name: /: Empty$/ }).count()) {
    await page.getByRole('button', { name: /: Empty$/ }).first().click();
    await page.locator('.sx-card').first().click();
  }
  await expect(page.getByRole('heading', { name: 'Your XI is complete' })).toBeVisible();
  await page.screenshot({ path: `test-results/workbench-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Clear XI', exact: true }).click();
  await expect(formationButton(page)).toHaveText('3-4-3 Wide');
  await expect(page.getByRole('button', { name: /: Empty$/ })).toHaveCount(11);
  await page.reload();
  await expect(formationButton(page)).toHaveText('3-4-3 Wide');
});

test('MVP-13: keyboard placement, roles and remove', async ({ page }) => {
  await page.goto('/dev/workbench');
  const slot = page.getByRole('button', { name: 'GK: Empty', exact: true });
  await slot.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Pick your goalkeeper', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('searchbox', { name: 'Search players' })).toBeFocused();
  await page.keyboard.type('Lammens');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '1 Senne Lammens' })).toBeFocused();
  await page.keyboard.press('Enter');
  const filled = page.getByRole('button', { name: 'GK: Senne Lammens', exact: true });
  await expect(filled).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'GK · Senne Lammens' })).toBeFocused();
  // Tab passes the close button and lands on the role list; the arrow keys choose.
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  await expect(role(page, 'No role')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(role(page, 'Traditional Goalkeeper')).toBeChecked();
  await expect(role(page, 'Traditional Goalkeeper')).toHaveAccessibleDescription('Holds a deeper position, protects the box, and distributes with lower risk.');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'GK: Senne Lammens, Traditional Goalkeeper', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  // The menu takes focus a frame after opening; wait for it before moving on.
  await expect(page.getByRole('heading', { name: 'GK · Senne Lammens' })).toBeFocused();
  await page.getByRole('button', { name: 'Remove player', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(slot).toBeVisible();
  await expect(slot).toBeFocused();
  // Escape also cancels a pending position.
  await page.keyboard.press('Enter');
  await expect(slot).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(slot).toHaveAttribute('aria-pressed', 'false');
});

test('MVP-13: selecting a position leads to the squad and placement returns focus to the pitch', async ({ page }) => {
  await page.goto('/dev/workbench');
  const slot = page.getByRole('button', { name: 'LB: Empty', exact: true });
  await slot.click();
  const heading = page.getByRole('heading', { name: 'Pick your full-back', exact: true });
  await expect(heading).toBeFocused();
  await settled(page);
  const bounds = await page.getByRole('button', { name: '2 Diogo Dalot' }).boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.screenshot({ path: `test-results/position-selected-${test.info().project.name}.png` });
  await page.getByRole('button', { name: '2 Diogo Dalot' }).click();
  const filled = page.getByRole('button', { name: 'LB: Diogo Dalot', exact: true });
  await expect(filled).toBeFocused();
  await filled.click();
  await expect(page.getByRole('heading', { name: 'LB · Diogo Dalot', exact: true })).toBeFocused();
  await page.getByRole('searchbox', { name: 'Search players' }).fill('not-a-player');
  await expect(page.getByText('No players match your search.', { exact: true })).toBeVisible();
  await settled(page);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
});

test('MVP-04/13: the formation picker works from the keyboard and previews before committing', async ({ page }) => {
  await page.goto('/dev/workbench');
  await page.getByRole('button', { name: 'GK: Empty', exact: true }).click();
  await page.getByRole('button', { name: '1 Senne Lammens' }).click();
  // Placement returns focus to the pitch a frame later; wait before moving on.
  await expect(page.getByRole('button', { name: 'GK: Senne Lammens', exact: true })).toBeFocused();
  await formationButton(page).focus();
  await page.keyboard.press('Enter');
  await expect(picker(page).getByRole('button', { pressed: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(picker(page).getByRole('button', { name: '4-3-3', exact: true })).toBeFocused();
  await expect(picker(page)).toContainText('Everyone keeps their place.');
  await expect(formationButton(page)).toHaveText('4-3-3');
  await page.keyboard.press('Enter');
  await expect(picker(page)).toBeHidden();
  await expect(formationButton(page)).toBeFocused();
  await expect(formationButton(page)).toHaveText('4-3-3');
  await expect(page.getByRole('button', { name: 'GK: Senne Lammens', exact: true })).toBeVisible();
  await settled(page);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
});

// Counts the inert copies that play a leaving animation, and reads which CSS animations apply.
async function watchGhosts(page: Page) {
  await page.evaluate(() => {
    const state = window as unknown as { ghosts: number };
    state.ghosts = 0;
    new MutationObserver((records) => { for (const record of records) for (const node of record.addedNodes) if (node instanceof Element && node.classList.contains('sx-ghost-out')) state.ghosts++; }).observe(document.body, { childList: true, subtree: true });
  });
}
const ghosts = (page: Page) => page.evaluate(() => (window as unknown as { ghosts: number }).ghosts);
const animationOf = (page: Page, selector: string) => page.locator(selector).first().evaluate((element) => getComputedStyle(element).animationName);
async function placeAndRemove(page: Page) {
  await page.goto('/dev/workbench');
  await watchGhosts(page);
  await page.getByRole('button', { name: 'GK: Empty', exact: true }).click();
  await page.getByRole('button', { name: '1 Senne Lammens' }).click();
  const pill = page.getByRole('button', { name: 'GK: Senne Lammens', exact: true });
  await expect(pill).toBeFocused();
  const names = { pill: await animationOf(page, '.sx-pill-body'), empty: await animationOf(page, '.sx-empty'), pitch: await animationOf(page, '.sx-pitch') };
  await pill.click();
  await expect(page.getByRole('heading', { name: 'GK · Senne Lammens' })).toBeFocused();
  const menu = await animationOf(page, '.sx-menu');
  await page.getByRole('button', { name: 'Remove player', exact: true }).click();
  await expect(page.getByRole('button', { name: 'GK: Empty', exact: true })).toBeFocused();
  return { ...names, menu };
}

test.describe('with motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });
  test('MVP-13: players land, leave and menus grow, and the copies that animate out are inert and removed', async ({ page }) => {
    expect(await placeAndRemove(page)).toEqual({ pill: 'sx-land', empty: 'sx-pop', pitch: 'sx-rise', menu: 'sx-grow' });
    // One copy for the squad card that was picked, one for the pill that left.
    expect(await ghosts(page)).toBe(2);
    await expect(page.locator('.sx-ghost-out')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '1 Senne Lammens' })).toHaveCount(1);
  });
});

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('MVP-13: reduced motion switches every animation off', async ({ page }) => {
    expect(await placeAndRemove(page)).toEqual({ pill: 'none', empty: 'none', pitch: 'none', menu: 'none' });
    expect(await ghosts(page)).toBe(0);
  });
});

// Below 900px: a portrait pitch, and sheets fixed to the bottom of the screen for picking, roles and formations.
test.describe('touch layout', () => {
  test.use({ hasTouch: true });
  test.beforeEach(() => { test.skip(test.info().project.name === 'desktop', 'The touch layout applies below 900px'); });
  const slot = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

  test('MVP-02–05, 13: build, set a role, move, swap, replace and change formation by tapping', async ({ page }) => {
    await page.goto('/dev/workbench');
    await slot(page, 'LB: Empty').tap();
    const sheet = page.locator('.sx-squad.sx-sheet');
    await expect(sheet).toHaveCSS('position', 'fixed');
    await expect(sheet.getByRole('heading', { name: 'Pick your full-back' })).toBeVisible();
    // The chosen position stays visible above the sheet.
    await expect.poll(async () => (await slot(page, 'LB: Empty').boundingBox())!.y + 44 <= (await sheet.boundingBox())!.y).toBe(true);
    await sheet.getByRole('button', { name: '2 Diogo Dalot' }).tap();
    await expect(sheet).toHaveCount(0);

    await slot(page, 'LB: Diogo Dalot').tap();
    await expect(page.locator('.sx-menu')).toHaveCSS('position', 'fixed');
    await role(page, 'Stay-Back Full-Back').check();
    await page.getByRole('button', { name: 'Move', exact: true }).tap();
    await expect(page.getByText('Move Dalot')).toBeVisible();
    await slot(page, 'RB: Empty').tap();
    // Move to empty: the origin's role clears and the destination inherits none.
    await expect(slot(page, 'RB: Diogo Dalot')).toBeVisible();
    await expect(slot(page, 'LB: Empty')).toBeVisible();

    await slot(page, 'LB: Empty').tap();
    await sheet.getByRole('button', { name: '3 Noussair Mazraoui' }).tap();
    await slot(page, 'LB: Noussair Mazraoui').tap();
    await role(page, 'Inverted Full-Back').check();
    await page.getByRole('button', { name: 'Move', exact: true }).tap();
    await slot(page, 'RB: Diogo Dalot').tap();
    // Swap: roles stay with the positions.
    await expect(slot(page, 'LB: Diogo Dalot, Inverted Full-Back')).toBeVisible();
    await expect(slot(page, 'RB: Noussair Mazraoui')).toBeVisible();

    await slot(page, 'RB: Noussair Mazraoui').tap();
    await page.getByRole('button', { name: 'Move', exact: true }).tap();
    await page.getByRole('button', { name: 'Cancel', exact: true }).tap();
    await expect(slot(page, 'RB: Noussair Mazraoui')).toBeFocused();

    await slot(page, 'RB: Noussair Mazraoui').tap();
    await page.getByRole('button', { name: 'Replace', exact: true }).tap();
    await expect(sheet.getByRole('heading', { name: 'Replace Mazraoui' })).toBeVisible();
    await sheet.getByRole('button', { name: '5 Harry Maguire' }).tap();
    await expect(slot(page, 'RB: Harry Maguire')).toBeVisible();

    // A formation that costs nothing applies on the first tap.
    await formationButton(page).tap();
    await expect(picker(page)).toHaveCSS('position', 'fixed');
    await picker(page).getByRole('button', { name: '4-3-3', exact: true }).tap();
    await expect(picker(page)).toBeHidden();
    await expect(formationButton(page)).toHaveText('4-3-3');
    await expect(slot(page, 'LB: Diogo Dalot, Inverted Full-Back')).toBeVisible();
    // One that would clear a role is previewed and must be confirmed; keeping changes nothing.
    await slot(page, 'LB: Diogo Dalot, Inverted Full-Back').tap();
    await role(page, 'Stay-Back Full-Back').check();
    await page.locator('.sx-menu .sx-close').tap();
    await formationButton(page).tap();
    await picker(page).getByRole('button', { name: '3-4-3 Wide', exact: true }).tap();
    await expect(picker(page)).toContainText('Roles cleared: Diogo Dalot (Stay-Back Full-Back)');
    await picker(page).getByRole('button', { name: 'Keep 4-3-3' }).tap();
    await expect(picker(page)).not.toContainText('Roles cleared');
    await expect(formationButton(page)).toHaveText('4-3-3');
    await picker(page).getByRole('button', { name: '3-4-3 Wide', exact: true }).tap();
    await picker(page).getByRole('button', { name: 'Use 3-4-3 Wide' }).tap();
    await expect(formationButton(page)).toHaveText('3-4-3 Wide');
    await expect(slot(page, 'LWB: Diogo Dalot')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  });

  test('MVP-13: with the longest role on every player, no labels overlap in the tightest formations', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile', 'Measured at 390px');
    test.slow();
    for (const formation of ['5-3-2', '3-5-2', '4-2-3-1 Narrow', '4-4-2 Diamond']) {
      await page.goto('/dev/workbench');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await formationButton(page).tap();
      await picker(page).getByRole('button', { name: formation, exact: true }).tap();
      await expect(formationButton(page)).toHaveText(formation);
      while (await page.locator('.sx-empty').count()) {
        await page.locator('.sx-empty').first().tap();
        await page.locator('.sx-sheet .sx-card').first().tap();
      }
      for (const pill of await page.locator('.sx-pill').all()) {
        await pill.tap();
        const names = await page.locator('.sx-option-name').allTextContents();
        await page.locator('.sx-option input').nth(names.indexOf([...names].sort((a, b) => b.length - a.length)[0])).check();
        await page.locator('.sx-menu .sx-close').tap();
      }
      const result = await page.evaluate(() => {
        const parts = [...document.querySelectorAll<HTMLElement>('.sx-marker')].flatMap((marker) => [...marker.querySelectorAll('.sx-no, .sx-name, .sx-role')].map((element) => ({ id: marker.dataset.slot!, box: element.getBoundingClientRect() })));
        const pitch = document.querySelector('.sx-overlay')!.getBoundingClientRect();
        const hits: string[] = [];
        for (const a of parts) for (const b of parts) if (a.id < b.id && Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left) > 1 && Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top) > 1) hits.push(`${a.id}/${b.id}`);
        return { hits, outside: parts.filter((part) => part.box.left < pitch.left || part.box.right > pitch.right || part.box.bottom > pitch.bottom).map((part) => part.id) };
      });
      expect(result, formation).toEqual({ hits: [], outside: [] });
    }
  });
});

test('MVP-13: desktop labels stay apart in all 14 formations with the longest names and the longest role on every player', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'Measured at 1440px, the full design width');
  test.slow();
  const players = initialSquad.map((player) => ({ ...player, selectable: true }));
  const surname = (name: string) => name.split(' ').at(-1)!;
  const longest = [...players].sort((a, b) => surname(b.name).length - surname(a.name).length).slice(0, 11);
  const fixture = { id: '20000000-0000-4000-8000-000000000001', opponent: 'Preview opponent A (synthetic)', venue: 'home', competition: 'Development example', round: null, status: 'scheduled', kickoff: { kind: 'unknown' } };
  // Seed before hydration: writing after navigation races the builder's initial memory effect.
  const stagingKey = 'test:formation-draft';
  await page.addInitScript(({ key, staging }) => {
    const draft = sessionStorage.getItem(staging);
    if (draft) localStorage.setItem(key, draft);
  }, { key: previewDraftKey, staging: stagingKey });
  await page.goto('/dev/workbench');
  for (const formation of formations) {
    const slots = Object.fromEntries(formation.slots.map((slot, index) => [slot[0], { playerId: longest[index].id, roleId: [...rolesForFamily(slot[4])].sort((a, b) => b.name.length - a.name.length)[0].id }]));
    const draft = { schemaVersion: 1, catalogueVersion, contentRevision: 'a'.repeat(64), fixture, players, lineup: { formationId: formation.id, slots } };
    await page.evaluate(([key, value]) => sessionStorage.setItem(key, value), [stagingKey, JSON.stringify(draft)]);
    await page.reload();
    await expect(formationButton(page)).toHaveText(formation.name);
    await expect(page.locator('.sx-pill .sx-role')).toHaveCount(11);
    // Placement settles a frame after the labels are measured. A touch of up to 3px is not counted as an overlap.
    await expect.poll(() => page.evaluate(() => {
      const parts = [...document.querySelectorAll<HTMLElement>('.sx-marker')].flatMap((marker) => [...marker.querySelectorAll('.sx-pill-body, .sx-role')].map((element) => ({ id: marker.dataset.slot!, box: element.getBoundingClientRect() })));
      const hits: string[] = [];
      for (const a of parts) for (const b of parts) if (a.id < b.id && Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left) > 3 && Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top) > 3) hits.push(`${a.id}/${b.id}`);
      return hits;
    }), { message: formation.name }).toEqual([]);
  }
});

test('MVP-07/13: a player who is out for the match stays listed last and cannot be picked', async ({ page }) => {
  await page.goto('/dev/workbench');
  const cards = page.locator('.sx-cards [data-card] button');
  await expect(cards).toHaveCount(36);
  await expect(cards.first()).toHaveAttribute('aria-label', '1 Senne Lammens');
  await page.getByRole('button', { name: 'Toggle Senne Lammens availability', exact: true }).click();
  await expect(cards).toHaveCount(36);
  await expect(cards.first()).toHaveAttribute('aria-label', '2 Diogo Dalot');
  await expect(cards.last()).toHaveAttribute('aria-label', '1 Senne Lammens, unavailable');
  await expect(cards.last()).toBeDisabled();
  await expect(cards.last()).toContainText('Unavailable');
  await expect(page.locator('.sx-count-total')).toHaveText('35 players not picked');
  // Opening a position (the sheet on a phone) still offers only the players who can be picked.
  await page.getByRole('button', { name: 'GK: Empty', exact: true }).click();
  await expect(cards.last()).toBeVisible();
  await cards.last().click({ force: true });
  await expect(page.getByRole('button', { name: 'GK: Empty', exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Toggle Senne Lammens availability', exact: true }).click();
  await expect(cards.first()).toHaveAttribute('aria-label', '1 Senne Lammens');
  await expect(cards.first()).toBeEnabled();
});
