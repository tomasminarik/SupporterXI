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

test('MVP-09: every page limits what it may load and refuses to be framed', async ({ page, request }) => {
  const blocked: string[] = [];
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (event) => console.error(`CSP ${location.pathname} ${event.violatedDirective} ${event.blockedURI} ${event.sourceFile}:${event.lineNumber}:${event.columnNumber}`)));
  page.on('console', (message) => { if (message.type() === 'error' && /CSP|Content Security Policy/.test(message.text())) blocked.push(message.text()); });
  for (const path of ['/', '/gameplan', '/gaffer', '/no-such-page']) {
    const response = await page.goto(path);
    const headers = response!.headers();
    expect(headers).toMatchObject({ 'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff', 'permissions-policy': expect.stringContaining('camera=()') });
    expect(headers['referrer-policy']).toBe(path === '/gaffer' ? 'no-referrer' : 'strict-origin-when-cross-origin');
    expect(headers['x-powered-by']).toBeUndefined();
    const policy = headers['content-security-policy'];
    for (const rule of ["default-src 'self'", "connect-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"]) expect(policy).toContain(rule);
    expect(policy).not.toMatch(/https?:|\*/);
    await page.waitForLoadState('networkidle');
  }
  expect((await request.get('/api/featured-fixture')).headers()['x-content-type-options']).toBe('nosniff');
  expect(blocked).toEqual([]);
});
