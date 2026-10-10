import { describe, expect, it, vi } from 'vitest';
import { isIndexable, publicHost } from '../../src/domain/site';
import robots from '../../src/app/robots';
import sitemap from '../../src/app/sitemap';

describe('search indexing follows the public domain (user decision, 9 October 2026)', () => {
  it('stays out of search results until the production domain is the public address', () => {
    expect(isIndexable({})).toBe(false);
    expect(isIndexable({ VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'supporterxi.vercel.app' })).toBe(false);
    expect(isIndexable({ VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: publicHost })).toBe(false);
    expect(isIndexable({ VERCEL_ENV: 'development', VERCEL_PROJECT_PRODUCTION_URL: publicHost })).toBe(false);
  });
  it('asks to be indexed once the domain is connected', () => {
    expect(isIndexable({ VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'supporterxi.com' })).toBe(true);
    expect(isIndexable({ VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'www.supporterxi.com' })).toBe(true);
  });
  it('offers only the builder once production indexing is enabled', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', publicHost);
    try {
      // The backoffice is kept out by a noindex header, not listed here (tests/browser/admin-security.spec.ts).
      expect(robots().rules).toEqual({ userAgent: '*', allow: '/', disallow: ['/api/', '/dev/', '/sxi/'] });
      expect(robots().sitemap).toBe('https://supporterxi.com/sitemap.xml');
      expect(sitemap().map((entry) => entry.url)).toEqual(['https://supporterxi.com']);
    } finally { vi.unstubAllEnvs(); }
  });
  it('offers no pages outside production', () => {
    expect(sitemap()).toEqual([]);
  });
});
