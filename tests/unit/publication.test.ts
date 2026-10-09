import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('server-only', () => ({}));
import raw from '../fixtures/initial-content.json';
import { contentSchema, type SharedContent } from '../../src/domain/content';
import { publication, readEditor, writeSource } from '../../src/server/admin/github';
import { seal, sessionCookie } from '../../src/server/admin/security';
import { GET, POST } from '../../src/app/api/admin/content/route';

const origin = 'https://example.test';
const commit = 'c'.repeat(40);
const digest = 'd'.repeat(64);
const deployments = [{ id: 1, sha: commit, environment: 'Production' }];
const hash = (content: SharedContent) => createHash('sha256').update(JSON.stringify(content)).digest('hex');
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('MVP-12 publication when the live probe is unavailable', () => {
  it.each(['network failure', 'timeout', 'malformed JSON', 'null JSON', 'HTTP error'])('still reports a known failed deployment after %s', async (failure) => {
    const fetcher = vi.fn<typeof fetch>();
    if (failure === 'network failure') fetcher.mockRejectedValueOnce(new TypeError('Network unavailable'));
    else if (failure === 'timeout') fetcher.mockRejectedValueOnce(new DOMException('Timed out', 'TimeoutError'));
    else if (failure === 'malformed JSON') fetcher.mockResolvedValueOnce(new Response('not json'));
    else if (failure === 'null JSON') fetcher.mockResolvedValueOnce(Response.json(null));
    else fetcher.mockResolvedValueOnce(new Response('unavailable', { status: 503 }));
    fetcher.mockResolvedValueOnce(Response.json(deployments)).mockResolvedValueOnce(Response.json([{ state: 'failure' }]));
    expect(await publication(commit, digest, 'test-token', origin, fetcher)).toBe('failed');
    expect(fetcher.mock.calls[2][0]).toContain('/deployments/1/statuses');
    // The public probe never receives a repository credential.
    expect(fetcher.mock.calls[0][1]?.headers).toBeUndefined();
  });

  it('does not treat a successful deployment as proof of a matching live revision', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError('Offline'))
      .mockResolvedValueOnce(Response.json(deployments)).mockResolvedValueOnce(Response.json([{ state: 'success' }]));
    expect(await publication(commit, digest, 'test-token', origin, fetcher)).toBe('pending');
  });

  it('ignores preview and unrelated commit failures', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ contentRevision: 'old' }))
      .mockResolvedValueOnce(Response.json([{ id: 1, sha: commit, environment: 'Preview' }, { id: 2, sha: 'e'.repeat(40), environment: 'Production' }]));
    expect(await publication(commit, digest, 'test-token', origin, fetcher)).toBe('pending');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('keeps the editor readable at the exact content commit if both status services fail', async () => {
    const content = contentSchema.parse(raw);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json([{ sha: commit }]))
      .mockResolvedValueOnce(Response.json({ sha: 'a'.repeat(40), encoding: 'base64', content: Buffer.from(JSON.stringify(content)).toString('base64') }))
      .mockRejectedValueOnce(new TypeError('Offline')).mockResolvedValueOnce(new Response('', { status: 503 }));
    expect(await readEditor('test-token', origin, fetcher)).toMatchObject({ content, publication: { commit, state: 'unknown' } });
    expect(fetcher.mock.calls[1][0]).toContain(`?ref=${commit}`);
  });
});

describe('MVP-10/12 mocked operational recovery rehearsal', () => {
  it('rejects the stale second editor, retains live content after a failed deployment, and restores through a new guarded commit', async () => {
    const fixtureId = '10000000-0000-4000-8000-000000000001';
    const accepted = contentSchema.parse({ ...raw, fixtures: [{ id: fixtureId, source: { kind: 'football-data.org', providerId: '123' }, values: {
      opponent: 'Synthetic FC', venue: 'home', competition: 'Premier League', round: 'Matchday 1', status: 'scheduled', kickoff: { kind: 'unknown' },
    }, overrides: { competition: 'Manual correction' } }] });
    let source = structuredClone(accepted);
    let revision = 'a'.repeat(40);
    let latestCommit = 'b'.repeat(40);
    let writes = 0;
    const config = { origin, clientId: 'test', clientSecret: 'test-secret', secret: 's'.repeat(48), userId: '123', token: 'test-token' };
    const env = { VERCEL_ENV: 'production', ADMIN_ORIGIN: origin, GITHUB_OAUTH_CLIENT_ID: config.clientId, GITHUB_OAUTH_CLIENT_SECRET: config.clientSecret, ADMIN_SESSION_SECRET: config.secret, ADMIN_GITHUB_USER_ID: config.userId, GITHUB_CONTENT_TOKEN: config.token };
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    const csrf = 'test-csrf'.repeat(4);
    const cookie = seal({ kind: 'session', userId: config.userId, csrf, exp: Date.now() + 60_000 }, config);
    const request = (body?: unknown) => new NextRequest(`${origin}/api/admin/content`, { method: body ? 'POST' : 'GET', headers: { cookie: `${sessionCookie}=${cookie}`, origin, 'content-type': 'application/json', 'x-csrf-token': csrf }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      if (url === `${origin}/api/featured-fixture`) return Response.json({ contentRevision: hash(accepted) });
      if (url.includes('/commits?')) return Response.json([{ sha: latestCommit }]);
      if (url.includes('/deployments?')) return Response.json([{ id: 1, sha: latestCommit, environment: 'Production' }]);
      if (url.includes('/deployments/1/statuses')) return Response.json([{ state: 'failure' }]);
      if (url.includes('/contents/content/shared.json')) {
        if (init?.method === 'PUT') {
          const body = JSON.parse(String(init.body));
          expect(body).toMatchObject({ branch: 'main', sha: revision });
          source = contentSchema.parse(JSON.parse(Buffer.from(body.content, 'base64').toString('utf8')));
          writes++;
          revision = createHash('sha1').update(JSON.stringify(source)).digest('hex');
          latestCommit = createHash('sha1').update(`commit-${writes}`).digest('hex');
          return Response.json({ content: { sha: revision }, commit: { sha: latestCommit } });
        }
        return Response.json({ sha: revision, encoding: 'base64', content: Buffer.from(JSON.stringify(source)).toString('base64') });
      }
      throw new Error(`Unexpected test request: ${url}`);
    });
    vi.stubGlobal('fetch', fetcher);
    const firstResponse = await GET(request());
    const secondResponse = await GET(request());
    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    const firstEditor = await firstResponse.json();
    const secondEditor = await secondResponse.json();
    expect(firstEditor.publication.state).toBe('live');
    const command = { kind: 'fixture', id: fixtureId, values: { ...accepted.fixtures[0].values, ...accepted.fixtures[0].overrides, round: 'Matchday 2' } };
    const savedResponse = await POST(request({ revision: firstEditor.revision, command }));
    expect(savedResponse.status).toBe(200);
    const saved = await savedResponse.json();
    expect(saved.commit).not.toBeNull();
    const stale = await POST(request({ revision: secondEditor.revision, command: { ...command, values: { ...command.values, round: 'Stale change' } } }));
    expect(stale.status).toBe(409);
    expect(writes).toBe(1);
    expect(source.fixtures[0].overrides).toEqual({ competition: 'Manual correction', round: 'Matchday 2' });
    expect(await publication(saved.commit, saved.digest, config.token, origin, fetcher)).toBe('failed');
    expect((await (await GET(request())).json()).publication.state).toBe('failed');
    // Operational rollback uses the latest blob SHA and a new commit, never a reset.
    const restored = await writeSource({ revision, content: source }, accepted, config.token, 'Restore accepted content', fetcher);
    expect(writes).toBe(2);
    expect(restored.commit).not.toBe(saved.commit);
    expect(source).toEqual(accepted);
    expect(source.players.map((p) => p.id)).toEqual(accepted.players.map((p) => p.id));
    expect(source.fixtures[0].source).toEqual(accepted.fixtures[0].source);
    expect(await publication(restored.commit!, restored.digest!, config.token, origin, fetcher)).toBe('live');
  });
});
