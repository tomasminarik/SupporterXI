import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const motion of ['reduce', 'no-preference'] as const) {
  test(`an unknown address shows the 4-0-4 page and a way back (MVP-13, MVP-14; motion ${motion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: motion });
    const errors: string[] = [];
    const unexpectedRequests: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== 'http://127.0.0.1:3100' || request.method() !== 'GET' || request.url().includes('/api/')) unexpectedRequests.push(`${request.method()} ${request.url()}`);
    });
    const response = await page.goto('/no-such-page');
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(/^Page not found/);
    await expect(page.locator('meta[name=robots]').first()).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('heading', { level: 1, name: '404: page not found' })).toBeVisible();
    await expect(page.getByRole('img', { name: /4-0-4: a goalkeeper, four defenders, four forwards and nobody in midfield/ })).toBeVisible();
    await expect(page.locator('.nf-player')).toHaveCount(9);

    // The animation plays once and settles: the midfield is gone and the line stands in its place.
    const joke = page.getByText('Like our midfield, this page has gone missing.');
    await expect(joke).toBeVisible();
    await expect(joke).toHaveCSS('opacity', '1');
    for (const ghost of await page.locator('.nf-missing').all()) await expect(ghost).toHaveCSS('opacity', '0');
    await expect.poll(() => page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0);

    // Nothing overlaps: every player stays clear of the line, inside the pitch.
    const overlaps = await page.evaluate(() => {
      const box = (element: Element) => element.getBoundingClientRect();
      const line = box(document.querySelector('.nf-joke')!);
      const pitch = box(document.querySelector('.nf-pitch')!);
      return [...document.querySelectorAll('.nf-player')].map(box).filter((b) => (b.left < line.right && b.right > line.left && b.top < line.bottom && b.bottom > line.top) || b.left < pitch.left || b.right > pitch.right || b.top < pitch.top || b.bottom > pitch.bottom).length;
    });
    expect(overlaps).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);

    await page.route('**/api/featured-fixture', (route) => route.fulfill({ json: { schemaVersion: 2, contentRevision: 'a'.repeat(64), serverNow: new Date().toISOString(), nextRefreshAt: null, fixture: null, players: [] } }));
    expect(unexpectedRequests).toEqual([]);
    await page.getByRole('link', { name: 'Back to the builder' }).click();
    await expect(page).toHaveURL('/');
    expect(errors).toEqual([]);
  });
}
