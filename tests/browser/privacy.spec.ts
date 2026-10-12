import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// User decisions, 12 October 2026 (docs/reviews/legal-review.md): the site says it is unofficial on every
// page, credits its fixture provider and explains what happens to visitors' data.
test('MVP-13, MVP-14: every page says it is unofficial and links to the privacy notice', async ({ page }) => {
  for (const path of ['/', '/gameplan', '/no-such-page', '/privacy']) {
    await page.goto(path);
    const footer = page.getByRole('contentinfo');
    await expect(footer).toContainText('Unofficial. Not affiliated with or endorsed by Manchester United.');
    await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('MVP-14: the builder credits football-data.org as its terms require', async ({ page }) => {
  await page.goto('/');
  await page.getByText('What is Supporter XI?').click();
  await expect(page.getByText('Football data provided by the Football-Data.org API')).toBeVisible();
});

test('MVP-13, MVP-14: the privacy notice names who runs the site and what is and is not collected', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page).toHaveTitle('Privacy — Supporter XI');
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeVisible();
  for (const title of ['Your lineup stays with you', 'Visit statistics', 'Hosting', 'Email', 'Players', 'Your rights', 'No guarantees']) await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
  const main = page.getByRole('main');
  await expect(main).toContainText('Sweden');
  await expect(main).toContainText('I never record which players, formation or roles you choose.');
  await expect(main).toContainText('IMY');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('main').getByRole('link', { name: 'Back to the builder' }).click();
  await expect(page).toHaveURL('/');
});
