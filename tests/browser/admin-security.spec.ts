import { expect, test } from '@playwright/test';
test('MVP-09/14: unconfigured administration fails closed', async ({ page, request }) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Administration is not connected yet.' })).toBeVisible();
  for (const path of ['/api/admin/content', '/api/admin/publish', '/api/admin/auth/login', '/api/admin/auth/callback']) {
    const result = await request.get(path);
    expect([401, 503]).toContain(result.status());
    expect(await result.text()).not.toContain('fixtureAvailability');
    expect(result.headers()['cache-control']).toContain('no-store');
  }
  for (const path of ['/api/admin/content', '/api/admin/auth/logout']) expect([401, 503]).toContain((await request.post(path, { data: {} })).status());
  expect((await request.get('/dev/admin')).status()).toBe(404);
});
