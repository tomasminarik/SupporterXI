import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const formationButton = (page: Page) => page.locator('.sx-formation');
const dialog = (page: Page) => page.getByRole('dialog');
const role = (page: Page) => page.getByRole('combobox', { name: 'Role', exact: true });
async function chooseFormation(page: Page, name: string) {
  await formationButton(page).click();
  await dialog(page).getByRole('button', { name, exact: true }).click();
}

test('MVP-01–05, 13: inspect and edit a real in-memory XI', async ({ page }) => {
  await page.goto('/dev/workbench');
  await expect(page.getByText('Preview only', { exact: false })).toBeVisible();
  await expect(formationButton(page)).toHaveText('4-2-3-1 Wide');
  await expect(page.getByRole('button', { name: /: Empty$/ })).toHaveCount(11);
  await formationButton(page).click();
  await expect(dialog(page).locator('.sx-formation-option')).toHaveCount(14);
  await expect(dialog(page).getByRole('button', { pressed: true })).toHaveText(/4-2-3-1 Wide/);
  await dialog(page).getByRole('button', { name: '4-3-3', exact: true }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(page.getByRole('button', { name: /: Empty$/ })).toHaveCount(11);

  await page.getByRole('button', { name: 'LB: Empty', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pick your full-back' })).toBeVisible();
  await page.getByRole('button', { name: '2 Diogo Dalot' }).click();
  await page.getByRole('button', { name: 'LB: Diogo Dalot', exact: true }).click();
  await role(page).selectOption('stay-back-full-back');
  await expect(page.getByText('Holds a deeper flank position to protect against transitions.', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '2 Diogo Dalot' })).toHaveCount(0);
  await page.keyboard.press('Escape');

  // A destructive change previews its consequences; keeping the formation changes nothing.
  await chooseFormation(page, '3-4-3 Wide');
  await expect(dialog(page)).toContainText('Roles cleared: Diogo Dalot (Stay-Back Full-Back)');
  await dialog(page).getByRole('button', { name: 'Keep 4-3-3' }).click();
  await page.keyboard.press('Escape');
  await expect(formationButton(page)).toHaveText('4-3-3');
  await expect(page.getByRole('button', { name: 'LB: Diogo Dalot, Stay-Back Full-Back', exact: true })).toBeVisible();
  await chooseFormation(page, '3-4-3 Wide');
  await dialog(page).getByRole('button', { name: 'Change to 3-4-3 Wide' }).click();
  await expect(formationButton(page)).toHaveText('3-4-3 Wide');

  await page.getByRole('button', { name: 'LWB: Diogo Dalot', exact: true }).click();
  await expect(role(page)).toHaveValue('');
  await expect(role(page).locator('option')).toHaveText(['No role', 'Overlapping Full-Back', 'Inverted Full-Back']);
  await role(page).selectOption('inverted-full-back');
  await page.getByRole('combobox', { name: 'Move or swap to', exact: true }).selectOption('st');
  await expect(page.getByRole('button', { name: 'LWB: Empty', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ST: Diogo Dalot', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ST: Diogo Dalot', exact: true }).click();
  await expect(role(page)).toHaveValue('');
  await role(page).selectOption('false-nine');
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
  const roles = role(page);
  await roles.focus(); await expect(roles).toBeFocused(); await roles.press('t'); await roles.press('Tab');
  await expect(roles).toHaveValue('traditional-goalkeeper');
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
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
});
