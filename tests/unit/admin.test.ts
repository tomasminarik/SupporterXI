import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { NextRequest } from 'next/server';
import raw from '../fixtures/initial-content.json';
import { contentSchema } from '../../src/domain/content';
import { applyAdminCommand, validateAdminContent } from '../../src/domain/admin';
import { adminConfig, authorizedWrite, nonce, readSession, seal, unseal, type AdminConfig } from '../../src/server/admin/security';
import { readSource, saveSource, publication } from '../../src/server/admin/github';
import { GET, POST } from '../../src/app/api/admin/content/route';
const data = contentSchema.parse(raw);
const id = '10000000-0000-4000-8000-000000000001';
const fixtureValues = { opponent: 'Synthetic FC', venue: 'home' as const, competition: null, round: null, status: 'scheduled' as const, kickoff: { kind: 'unknown' as const } };
const fixture = { id, source: { kind: 'football-data.org' as const, providerId: '123' }, values: fixtureValues, overrides: { opponent: 'Corrected FC', competition: null } };
const config: AdminConfig = { origin: 'https://example.test', clientId: 'test', clientSecret: 'not-real', secret: 'a'.repeat(48), userId: '326405858', token: 'not-real' };
const file = { sha: 'a'.repeat(40), encoding: 'base64', content: Buffer.from(JSON.stringify(data)).toString('base64') };

describe('MVP-10 admin mutations and approved M-01', () => {
  it('retains IDs on updates and creates IDs server-side', () => {
    const next = applyAdminCommand(data, { kind: 'fixture', id: null, values: fixtureValues }, () => id);
    expect(next.fixtures[0].id).toBe(id);
    expect(applyAdminCommand(next, { kind: 'fixture', id, values: { ...fixtureValues, status: 'cancelled' } }, () => 'wrong').fixtures[0]).toMatchObject({ id, values: { status: 'cancelled' } });
    expect(data.fixtures).toEqual([]);
    expect(() => applyAdminCommand(data, { kind: 'delete', id }, () => id)).toThrow();
  });
  it('preserves imports and changes only edited field overrides, including null', () => {
    const source = { ...data, fixtures: [fixture] };
    const next = applyAdminCommand(source, { kind: 'fixture', id, values: { ...fixtureValues, opponent: 'Corrected FC', round: 'Round 2' } }, () => id);
    expect(next.fixtures[0].values).toEqual(fixtureValues);
    expect(next.fixtures[0].overrides).toEqual({ opponent: 'Corrected FC', competition: null, round: 'Round 2' });
    expect(applyAdminCommand(next, { kind: 'clear-override', id, field: 'opponent' }, () => id).fixtures[0].overrides).toEqual({ competition: null, round: 'Round 2' });
  });
  it('rejects invalid number, active duplicates and unresolved references', () => {
    for (const number of [null, 0, 100, 1.5, data.players[1].shirtNumber]) expect(() => applyAdminCommand(data, { kind: 'player', id: data.players[0].id, values: { name: 'Senne Lammens', active: true, shirtNumber: number } }, () => id)).toThrow();
    const inactive = applyAdminCommand(data, { kind: 'player', id: data.players[0].id, values: { name: 'Senne Lammens', active: false, shirtNumber: null } }, () => id);
    expect(inactive.players[0]).toMatchObject({ id: data.players[0].id, active: false, shirtNumber: null });
    expect(() => applyAdminCommand(data, { kind: 'featured', id }, () => id)).toThrow();
    expect(() => applyAdminCommand(data, { kind: 'availability', fixtureId: id, playerId: data.players[0].id, status: 'unavailable' }, () => id)).toThrow();
    expect(validateAdminContent(data)).toEqual(data);
  });
  it('rejects timezone-free timestamps and client-assigned creation identity', () => {
    expect(() => applyAdminCommand(data, { kind: 'fixture', id: null, values: { ...fixtureValues, kickoff: { kind: 'confirmed', at: '2026-10-25T12:00:00' } } }, () => id)).toThrow();
    expect(() => applyAdminCommand(data, { kind: 'player', id, values: { name: 'New', active: true, shirtNumber: 99 } }, () => id)).toThrow();
  });
});

describe('MVP-09 session and request security', () => {
  it('authenticates only untampered, unexpired, allowlisted sessions bound to origin', () => {
    const now = Date.now(); const session = { kind: 'session', userId: config.userId, csrf: nonce(), exp: now + 1000 };
    const cookie = seal(session, config);
    expect(readSession(cookie, config, now)?.userId).toBe(config.userId);
    expect(readSession(cookie, config, now + 1000)).toBeNull();
    expect(readSession(cookie, { ...config, userId: '1' }, now)).toBeNull();
    expect(readSession(cookie, { ...config, origin: 'https://other.test' }, now)).toBeNull();
    expect(unseal(cookie.slice(0, 20) + 'X' + cookie.slice(21), config)).toBeNull();
    expect(readSession(seal({ ...session, kind: 'oauth' }, config), config, now)).toBeNull();
  });
  it('requires exact same-origin and CSRF token on writes', () => {
    const headers = new Headers({ origin: config.origin, 'x-csrf-token': 'test', 'content-type': 'application/json' });
    expect(authorizedWrite(headers, config, 'test')).toBe(true);
    expect(authorizedWrite(headers, config, 'different')).toBe(false);
    headers.set('origin', 'https://evil.test'); expect(authorizedWrite(headers, config, 'test')).toBe(false);
  });
  it('disables preview authority even when credentials were accidentally supplied', () => {
    const env = { VERCEL_ENV: 'production', ADMIN_ORIGIN: config.origin, GITHUB_OAUTH_CLIENT_ID: config.clientId, GITHUB_OAUTH_CLIENT_SECRET: config.clientSecret, ADMIN_SESSION_SECRET: config.secret, ADMIN_GITHUB_USER_ID: config.userId, GITHUB_CONTENT_TOKEN: config.token };
    expect(adminConfig(env)).toEqual(config);
    expect(adminConfig({ ...env, VERCEL_ENV: 'preview' })).toBeNull();
    expect(adminConfig({ ...env, ADMIN_ORIGIN: 'http://example.test' })).toBeNull();
    expect(adminConfig({ ...env, ADMIN_SESSION_SECRET: 'short' })).toBeNull();
  });
  it('denies direct anonymous API reads and writes before upstream access', async () => {
    vi.stubEnv('VERCEL_ENV', 'production'); vi.stubEnv('ADMIN_ORIGIN', config.origin); vi.stubEnv('GITHUB_OAUTH_CLIENT_ID', config.clientId); vi.stubEnv('GITHUB_OAUTH_CLIENT_SECRET', config.clientSecret); vi.stubEnv('ADMIN_SESSION_SECRET', config.secret); vi.stubEnv('ADMIN_GITHUB_USER_ID', config.userId); vi.stubEnv('GITHUB_CONTENT_TOKEN', config.token);
    try {
      expect((await GET(new NextRequest(`${config.origin}/api/admin/content`))).status).toBe(401);
      expect((await POST(new NextRequest(`${config.origin}/api/admin/content`, { method: 'POST', body: '{}' }))).status).toBe(401);
      const cookie = seal({ kind: 'session', userId: config.userId, csrf: nonce(), exp: Date.now() + 1000 }, config);
      expect((await POST(new NextRequest(`${config.origin}/api/admin/content`, { method: 'POST', headers: { cookie: `__Host-xi-admin=${cookie}` }, body: '{}' }))).status).toBe(403);
    } finally { vi.unstubAllEnvs(); }
  });
});

describe('MVP-10/12 Git publication boundary', () => {
  it('reads only the configured content path and rejects stale revisions without PUT', async () => {
    const fetcher = vi.fn(async () => Response.json(file));
    expect((await readSource(config.token, fetcher)).content).toEqual(data);
    await expect(saveSource({ revision: 'b'.repeat(40), command: { kind: 'player', id: null, values: { name: 'Synthetic', shirtNumber: 99, active: true } } }, config.token, fetcher)).rejects.toMatchObject({ status: 409 });
    expect(fetcher.mock.calls.every((args) => (args as unknown[]).length > 0)).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('makes one atomic content commit with an expected SHA and does not claim it is live', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json(file)).mockResolvedValueOnce(Response.json({ content: { sha: 'b'.repeat(40) }, commit: { sha: 'c'.repeat(40) } }));
    const result = await saveSource({ revision: file.sha, command: { kind: 'fixture', id: null, values: fixtureValues } }, config.token, fetcher);
    expect(result.commit).toBe('c'.repeat(40)); expect(result.digest).toHaveLength(64);
    const body = JSON.parse(String(fetcher.mock.calls[1][1]?.body));
    expect(body).toMatchObject({ branch: 'main', sha: file.sha });
    expect(fetcher.mock.calls[1][0]).toBe('https://api.github.com/repos/tomasminarik/SupporterXI/contents/content/shared.json');
    expect(result).not.toHaveProperty('live');
  });
  it('does not create empty commits; propagates a concurrent GitHub conflict', async () => {
    const unchanged = vi.fn<typeof fetch>().mockResolvedValue(Response.json(file));
    expect((await saveSource({ revision: file.sha, command: { kind: 'featured', id: null } }, config.token, unchanged)).commit).toBeNull();
    expect(unchanged).toHaveBeenCalledTimes(1);
    const conflict = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json(file)).mockResolvedValueOnce(Response.json({}, { status: 409 }));
    await expect(saveSource({ revision: file.sha, command: { kind: 'fixture', id: null, values: fixtureValues } }, config.token, conflict)).rejects.toMatchObject({ status: 409 });
  });
  it('verifies public revision, otherwise distinguishes failure from pending', async () => {
    const digest = 'a'.repeat(64); const commit = 'c'.repeat(40);
    expect(await publication(commit, digest, config.token, config.origin, vi.fn<typeof fetch>().mockResolvedValue(Response.json({ contentRevision: digest })))).toBe('live');
    const pending = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ contentRevision: 'old' })).mockResolvedValueOnce(Response.json([]));
    expect(await publication(commit, digest, config.token, config.origin, pending)).toBe('pending');
    const failed = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ contentRevision: 'old' })).mockResolvedValueOnce(Response.json([{ id: 1, sha: commit, environment: 'Production' }])).mockResolvedValueOnce(Response.json([{ state: 'failure' }]));
    expect(await publication(commit, digest, config.token, config.origin, failed)).toBe('failed');
  });
});

describe('MVP-09 OAuth state, PKCE and identity allowlist', () => {
  it('rejects missing/mismatched state before network access, and admits only the configured GitHub ID', async () => {
    const { GET: callback } = await import('../../src/app/api/admin/auth/callback/route');
    const { GET: login } = await import('../../src/app/api/admin/auth/login/route');
    const { flowCookie, pkceChallenge } = await import('../../src/server/admin/security');
    const env = { VERCEL_ENV: 'production', ADMIN_ORIGIN: config.origin, GITHUB_OAUTH_CLIENT_ID: config.clientId, GITHUB_OAUTH_CLIENT_SECRET: config.clientSecret, ADMIN_SESSION_SECRET: config.secret, ADMIN_GITHUB_USER_ID: config.userId, GITHUB_CONTENT_TOKEN: config.token };
    for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
    const fetcher = vi.fn<typeof fetch>(); vi.stubGlobal('fetch', fetcher);
    try {
      const start = await login(new NextRequest(`${config.origin}/api/admin/auth/login`));
      const flow = unseal(start.cookies.get(flowCookie)!.value, config) as { state: string; verifier: string };
      const location = new URL(start.headers.get('location')!);
      expect(location.origin).toBe('https://github.com');
      expect(location.searchParams.get('code_challenge')).toBe(pkceChallenge(flow.verifier));
      expect(start.cookies.get(flowCookie)).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax' });
      const request = (state: string) => new NextRequest(`${config.origin}/api/admin/auth/callback?code=example&state=${state}`, { headers: { cookie: `${flowCookie}=${start.cookies.get(flowCookie)!.value}` } });
      expect((await callback(request('bad'))).headers.get('location')).toContain('auth=failed');
      expect(fetcher).not.toHaveBeenCalled();
      fetcher.mockResolvedValueOnce(Response.json({ access_token: 'fake-user-token', token_type: 'bearer' })).mockResolvedValueOnce(Response.json({ id: 1 }));
      expect((await callback(request(flow.state))).headers.get('location')).toContain('auth=failed');
      fetcher.mockResolvedValueOnce(Response.json({ access_token: 'fake-user-token', token_type: 'bearer' })).mockResolvedValueOnce(Response.json({ id: Number(config.userId) }));
      const success = await callback(request(flow.state));
      expect(success.headers.get('location')).toBe(`${config.origin}/admin`);
      const cookie = success.cookies.get('__Host-xi-admin')!;
      expect(readSession(cookie.value, config)?.userId).toBe(config.userId);
      expect(JSON.stringify(unseal(cookie.value, config))).not.toContain('fake-user-token');
      expect(cookie).toMatchObject({ httpOnly: true, secure: true, maxAge: 7200 });
      expect(success.cookies.get(flowCookie)?.maxAge).toBe(0);
    } finally { vi.unstubAllGlobals(); vi.unstubAllEnvs(); }
  });
});
