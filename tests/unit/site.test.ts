import { describe, expect, it } from 'vitest';
import { isIndexable, publicHost } from '../../src/domain/site';

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
});
