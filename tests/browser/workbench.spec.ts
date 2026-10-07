import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('MVP-01–05, 13: inspect and edit a real in-memory XI', async ({ page }) => {
  await page.goto('/dev/workbench');
  await expect(page.getByText('Preview only', { exact: false })).toBeVisible();
  const formation = page.getByRole('combobox', { name: 'Formation', exact: true });
  await expect(formation).toHaveValue('');
  await expect(formation.locator('option')).toHaveCount(15);
  await formation.selectOption('4-3-3');
  await expect(page.getByRole('button', { name: /: Empty/ })).toHaveCount(11);
  await page.getByRole('button', { name: 'LB: Empty', exact: true }).click();
  await page.getByRole('button', { name: '2 Diogo Dalot' }).click();
  await page.getByRole('combobox', { name: 'Optional role', exact: true }).selectOption('stay-back-full-back');
  await expect(page.getByText('Holds a deeper flank position to protect against transitions.', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '2 Diogo Dalot' })).toHaveCount(0);
  page.once('dialog', (dialog) => dialog.dismiss());
  await formation.selectOption('3-4-3-wide');
  await expect(formation).toHaveValue('4-3-3');
  await expect(page.getByRole('button', { name: 'LB: Diogo Dalot, Stay-Back Full-Back', exact: true })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await formation.selectOption('3-4-3-wide');
  await page.getByRole('button', { name: 'LWB: Diogo Dalot', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Optional role', exact: true })).toHaveValue('');
  await expect(page.getByRole('combobox', { name: 'Optional role', exact: true }).locator('option')).toHaveText(['No role', 'Overlapping Full-Back', 'Inverted Full-Back']);
  await page.getByRole('combobox', { name: 'Optional role', exact: true }).selectOption('inverted-full-back');
  await page.getByRole('combobox', { name: 'Move or swap to', exact: true }).selectOption('st');
  await expect(page.getByRole('button', { name: 'LWB: Empty', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ST: Diogo Dalot', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Optional role', exact: true })).toHaveValue('');
  await page.getByRole('combobox', { name: 'Optional role', exact: true }).selectOption('false-nine');
  await page.getByRole('button', { name: '8 Bruno Fernandes' }).click();
  await expect(page.getByRole('button', { name: 'ST: Bruno Fernandes, False Nine', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  if (test.info().project.name === 'desktop') {
    await page.getByRole('button', { name: 'ST: Bruno Fernandes, False Nine', exact: true }).dragTo(page.getByRole('button', { name: 'GK: Empty', exact: true }));
    await expect(page.getByRole('button', { name: 'GK: Bruno Fernandes', exact: true })).toBeVisible();
  }
  while (await page.getByRole('button', { name: /: Empty/ }).count()) {
    await page.getByRole('button', { name: /: Empty/ }).first().click();
    await page.locator('.lab-player-list button').first().click();
  }
  await expect(page.locator('.lab-tally')).toHaveText('11 / 11');
  await page.screenshot({ path: `test-results/workbench-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Clear XI', exact: true }).click();
  await expect(formation).toHaveValue('3-4-3-wide');
  await expect(page.getByRole('button', { name: /: Empty/ })).toHaveCount(11);
  await page.reload();
  await expect(formation).toHaveValue('');
});

test('MVP-13: keyboard placement, roles and remove', async ({ page }) => {
  await page.goto('/dev/workbench');
  await page.getByRole('combobox', { name: 'Formation', exact: true }).selectOption('4-3-3');
  const slot = page.getByRole('button', { name: 'GK: Empty', exact: true });
  await slot.focus(); await page.keyboard.press('Enter');
  const player = page.getByRole('button', { name: '1 Senne Lammens' });
  await player.focus(); await page.keyboard.press('Enter');
  const roles = page.getByRole('combobox', { name: 'Optional role', exact: true });
  await roles.focus(); await expect(roles).toBeFocused(); await roles.press('t'); await roles.press('Tab');
  await expect(roles).toHaveValue('traditional-goalkeeper');
  await page.getByRole('button', { name: 'Remove player', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(slot).toBeVisible();
});
