import { expect, test } from '@playwright/test';
test('MVP-09/14: unconfigured administration fails closed', async ({ page, request }) => {
  const response = await page.goto('/gaffer');
  expect(response?.headers()).toMatchObject({ 'x-frame-options': 'DENY', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff' });
  expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  await expect(page.getByRole('heading', { name: 'Not connected on this deployment' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  expect((await request.get('/admin')).status()).toBe(404);
  for (const path of ['/api/admin/content', '/api/admin/publish', '/api/admin/auth/login', '/api/admin/auth/callback']) {
    const result = await request.get(path);
    expect([401, 503]).toContain(result.status());
    expect(await result.text()).not.toContain('fixtureAvailability');
    expect(result.headers()['cache-control']).toContain('no-store');
    expect(result.headers()['x-robots-tag']).toBe('noindex, nofollow');
  }
  for (const path of ['/api/admin/content', '/api/admin/auth/logout']) expect([401, 503]).toContain((await request.post(path, { data: {} })).status());
  expect((await request.get('/dev/admin')).status()).toBe(404);
});
