import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { NextRequest } from 'next/server';
import raw from '../fixtures/initial-content.json';
import { contentSchema } from '../../src/domain/content';
import { reconcileFixtures } from '../../src/domain/fixture-import';
import { fetchFixtures, providerWindow, refreshFixtures } from '../../src/server/fixture-import';
import { GET as cron } from '../../src/app/api/cron/fixtures/route';
import { POST as manual } from '../../src/app/api/admin/import/route';
import { nonce, seal, type AdminConfig } from '../../src/server/admin/security';

const seed = contentSchema.parse(raw);
const fixtureId = '10000000-0000-4000-8000-000000000001';
const match = {
  id: 456, competition: { code: 'PL', name: 'Premier League' },
  homeTeam: { id: 66, name: 'Manchester United FC' }, awayTeam: { id: 67, name: 'Synthetic FC' },
  status: 'SCHEDULED', utcDate: '2026-11-01T15:00:00Z', matchday: 10, stage: 'REGULAR_SEASON',
};
const sourceFile = (content = seed) => ({ sha: 'a'.repeat(40), encoding: 'base64', content: Buffer.from(JSON.stringify(content)).toString('base64') });
const config: AdminConfig = { origin: 'https://example.test', clientId: 'test', clientSecret: 'not-real', secret: 'a'.repeat(48), userId: '326405858', token: 'not-real' };

describe('MVP-11 fixture reconciliation', () => {
  it('imports only United PL/CL schedules and preserves stable IDs and all manual data', () => {
    const manualFixture = { id: '10000000-0000-4000-8000-000000000002', source: { kind: 'manual' as const }, values: { opponent: 'Cup FC', venue: 'away' as const, competition: 'FA Cup', round: null, status: 'scheduled' as const, kickoff: { kind: 'unknown' as const } }, overrides: {} };
    const source = { ...seed, fixtures: [manualFixture] };
    const feed = { matches: [match, { ...match, id: 457, competition: { code: 'CL', name: 'Champions League' }, homeTeam: { id: 68, name: 'Other FC' }, awayTeam: match.homeTeam }, { ...match, id: 458, competition: { code: 'FAC', name: 'FA Cup' } }, { ...match, id: 459, homeTeam: { id: 1, name: 'Other FC' }, awayTeam: { id: 2, name: 'Another FC' } }, { ...match, id: 460, status: 'FINISHED' }] };
    let sequence = 0;
    const first = reconcileFixtures(source, feed, () => sequence++ ? '10000000-0000-4000-8000-000000000003' : fixtureId);
    expect(first.report).toMatchObject({ received: 5, eligible: 2, added: 2, skipped: 3 });
    expect(first.content.fixtures[0]).toEqual(manualFixture);
    expect(first.content.fixtures[1]).toMatchObject({ id: fixtureId, source: { providerId: '456' }, values: { opponent: 'Synthetic FC', venue: 'home', round: 'Matchday 10' } });
    expect(first.content.players).toEqual(seed.players);
    expect(first.content.fixtureAvailability).toEqual([]);
    const second = reconcileFixtures(first.content, feed, () => { throw new Error('idempotent import must not create IDs'); });
    expect(second.report).toMatchObject({ added: 0, updated: 0, unchanged: 2 });
    expect(second.content).toEqual(first.content);
  });
  it('updates imported base fields but keeps manual overrides and referenced identities', () => {
    const first = reconcileFixtures(seed, { matches: [match] }, () => fixtureId).content;
    first.fixtures[0].overrides = { opponent: 'Corrected FC', kickoff: { kind: 'unknown' } };
    first.fixtureAvailability = [{ fixtureId, playerId: seed.players[0].id, status: 'unavailable' }];
    const second = reconcileFixtures(first, { matches: [{ ...match, utcDate: '2026-11-02T18:00:00Z', awayTeam: { id: 67, name: 'New provider spelling' } }] }, () => 'wrong');
    expect(second.report.updated).toBe(1);
    expect(second.content.fixtures[0]).toMatchObject({ id: fixtureId, values: { opponent: 'New provider spelling', kickoff: { at: '2026-11-02T18:00:00Z' } }, overrides: { opponent: 'Corrected FC', kickoff: { kind: 'unknown' } } });
    expect(second.content.fixtureAvailability).toEqual(first.fixtureAvailability);
    expect(first.fixtures[0].values.opponent).toBe('Synthetic FC');
  });
  it('flags possible manual duplicates without guessing an identity or merging', () => {
    const manualFixture = { id: fixtureId, source: { kind: 'manual' as const }, values: { opponent: 'Synthetic FC', venue: 'home' as const, competition: 'Premier League', round: null, status: 'scheduled' as const, kickoff: { kind: 'confirmed' as const, at: '2026-11-02T15:00:00Z' } }, overrides: {} };
    const result = reconcileFixtures({ ...seed, fixtures: [manualFixture] }, { matches: [match] }, () => '10000000-0000-4000-8000-000000000003');
    expect(result.report.ambiguous).toEqual(['456']);
    expect(result.content.fixtures).toEqual([manualFixture]);
  });
  it('never clears accepted fixtures on empty feed, rejects duplicate IDs and malformed kickoff', () => {
    const first = reconcileFixtures(seed, { matches: [match] }, () => fixtureId).content;
    expect(reconcileFixtures(first, { matches: [] }, () => 'wrong').content).toEqual(first);
    expect(() => reconcileFixtures(first, { matches: [match, match] }, () => 'wrong')).toThrow('Duplicate provider match');
    expect(() => reconcileFixtures(first, { matches: [{ ...match, utcDate: 'not-a-date' }] }, () => 'wrong')).toThrow('Invalid kickoff');
    const invalidPlayers = structuredClone(first);
    invalidPlayers.players[0].shirtNumber = invalidPlayers.players[1].shirtNumber;
    expect(() => reconcileFixtures(invalidPlayers, { matches: [] }, () => 'wrong')).toThrow('Active shirt numbers must be unique');
  });
});

describe('MVP-11/15 import boundary', () => {
  it('uses a bounded team-specific request and retries provider throttling', async () => {
    expect(providerWindow(new Date('2026-10-08T12:00:00Z'))).toContain('/v4/teams/66/matches?dateFrom=2026-10-01&dateTo=2027-04-06&limit=500');
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('', { status: 429 })).mockResolvedValueOnce(Response.json({ matches: [match] }));
    expect(await fetchFixtures('fake-key', fetcher, new Date('2026-10-08T12:00:00Z'))).toEqual({ matches: [match] });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({ 'X-Auth-Token': 'fake-key' });
  });
  it('validates before one atomic GitHub PUT, with no commit on repeated import', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ matches: [match] })).mockResolvedValueOnce(Response.json(sourceFile())).mockResolvedValueOnce(Response.json({ content: { sha: 'b'.repeat(40) }, commit: { sha: 'c'.repeat(40) } }));
    const result = await refreshFixtures('content-token', 'provider-token', fetcher, new Date('2026-10-08T12:00:00Z'), () => fixtureId);
    expect(result.report.added).toBe(1);
    expect(result.commit).toBe('c'.repeat(40));
    const put = fetcher.mock.calls[2];
    expect(put[0]).toBe('https://api.github.com/repos/tomasminarik/SupporterXI/contents/content/shared.json');
    const body = JSON.parse(String(put[1]?.body));
    expect(body).toMatchObject({ branch: 'main', sha: 'a'.repeat(40) });
    const stored = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
    expect(stored.players).toEqual(seed.players);
    expect(stored.fixtures[0].source.providerId).toBe('456');
    const repeat = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ matches: [match] })).mockResolvedValueOnce(Response.json(sourceFile(result.content)));
    expect((await refreshFixtures('content-token', 'provider-token', repeat, new Date('2026-10-08T12:00:00Z'))).commit).toBeNull();
    expect(repeat).toHaveBeenCalledTimes(2);
  });
  it('keeps accepted content unchanged when provider fails or payload is invalid', async () => {
    const failed = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 401 }));
    await expect(refreshFixtures('content-token', 'provider-token', failed)).rejects.toMatchObject({ status: 502 });
    expect(failed).toHaveBeenCalledTimes(1);
    const invalid = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ matches: [{ ...match, utcDate: 'bad' }] })).mockResolvedValueOnce(Response.json(sourceFile()));
    await expect(refreshFixtures('content-token', 'provider-token', invalid)).rejects.toMatchObject({ status: 502 });
    expect(invalid).toHaveBeenCalledTimes(2);
  });
  it('rejects anonymous/manual and invalid scheduled requests before upstream access', async () => {
    const env = { VERCEL_ENV: 'production', ADMIN_ORIGIN: config.origin, GITHUB_OAUTH_CLIENT_ID: config.clientId, GITHUB_OAUTH_CLIENT_SECRET: config.clientSecret, ADMIN_SESSION_SECRET: config.secret, ADMIN_GITHUB_USER_ID: config.userId, GITHUB_CONTENT_TOKEN: config.token, FOOTBALL_DATA_TOKEN: 'fake-key', CRON_SECRET: 'b'.repeat(48) };
    for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
    const fetcher = vi.fn<typeof fetch>(); vi.stubGlobal('fetch', fetcher);
    try {
      expect((await manual(new NextRequest(`${config.origin}/api/admin/import`, { method: 'POST' }))).status).toBe(401);
      const cookie = seal({ kind: 'session', userId: config.userId, csrf: nonce(), exp: Date.now() + 1000 }, config);
      expect((await manual(new NextRequest(`${config.origin}/api/admin/import`, { method: 'POST', headers: { cookie: `__Host-xi-admin=${cookie}` } }))).status).toBe(403);
      expect((await cron(new NextRequest(`${config.origin}/api/cron/fixtures`))).status).toBe(401);
      expect((await cron(new NextRequest(`${config.origin}/api/cron/fixtures`, { headers: { authorization: 'Bearer wrong' } }))).status).toBe(401);
      vi.stubEnv('VERCEL_ENV', 'preview');
      expect((await cron(new NextRequest(`${config.origin}/api/cron/fixtures`, { headers: { authorization: `Bearer ${env.CRON_SECRET}` } }))).status).toBe(401);
      expect(fetcher).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); vi.unstubAllEnvs(); }
  });
  it('uses the same no-change operation for authenticated manual and scheduled refresh', async () => {
    const env = { VERCEL_ENV: 'production', ADMIN_ORIGIN: config.origin, GITHUB_OAUTH_CLIENT_ID: config.clientId, GITHUB_OAUTH_CLIENT_SECRET: config.clientSecret, ADMIN_SESSION_SECRET: config.secret, ADMIN_GITHUB_USER_ID: config.userId, GITHUB_CONTENT_TOKEN: config.token, FOOTBALL_DATA_TOKEN: 'fake-key', CRON_SECRET: 'b'.repeat(48) };
    for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url) => String(url).startsWith('https://api.football-data.org/') ? Response.json({ matches: [] }) : Response.json(sourceFile()));
    vi.stubGlobal('fetch', fetcher);
    try {
      const csrf = nonce();
      const cookie = seal({ kind: 'session', userId: config.userId, csrf, exp: Date.now() + 60_000 }, config);
      const manualResponse = await manual(new NextRequest(`${config.origin}/api/admin/import`, { method: 'POST', headers: { cookie: `__Host-xi-admin=${cookie}`, origin: config.origin, 'content-type': 'application/json', 'x-csrf-token': csrf }, body: '{}' }));
      expect(manualResponse.status).toBe(200);
      expect((await manualResponse.json()).commit).toBeNull();
      const cronResponse = await cron(new NextRequest(`${config.origin}/api/cron/fixtures`, { headers: { authorization: `Bearer ${env.CRON_SECRET}` } }));
      expect(cronResponse.status).toBe(200);
      expect((await cronResponse.json()).commit).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(4);
      expect(fetcher.mock.calls.filter(([url]) => String(url).startsWith('https://api.football-data.org/'))).toHaveLength(2);
    } finally { vi.unstubAllGlobals(); vi.unstubAllEnvs(); }
  });
});
