import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { contentSchema, type SharedContent } from '../../domain/content';
import { adminRequestSchema, applyAdminCommand } from '../../domain/admin';

const repo = 'https://api.github.com/repos/tomasminarik/SupporterXI';
const path = '/contents/content/shared.json';
export class AdminError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function github(url: string, token: string, init: RequestInit = {}, fetcher = fetch) {
  const response = await fetcher(url, { ...init, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(12_000), headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2026-03-10', ...init.headers } });
  if (!response.ok) throw new AdminError(response.status === 409 || response.status === 422 ? 409 : 502, response.status === 409 || response.status === 422 ? 'Content changed. Reload and review before retrying.' : 'GitHub is unavailable or the integration lacks permission. Your edits are still here.');
  return response.json();
}
const fileSchema = z.object({ sha: z.string().regex(/^[a-f0-9]{40}$/), encoding: z.literal('base64'), content: z.string().max(1_400_000) });
export async function readSource(token: string, fetcher = fetch, ref = 'main') {
  const file = fileSchema.parse(await github(`${repo}${path}?ref=${encodeURIComponent(ref)}`, token, {}, fetcher));
  const content = contentSchema.parse(JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')));
  return { revision: file.sha, content };
}
export async function saveSource(input: unknown, token: string, fetcher = fetch) {
  const request = adminRequestSchema.parse(input);
  const source = await readSource(token, fetcher);
  if (source.revision !== request.revision) throw new AdminError(409, 'Content changed. Reload and review before retrying.');
  const next = applyAdminCommand(source.content, request.command, randomUUID);
  return writeSource(source, next, token, `Update shared content: ${request.command.kind}`, fetcher);
}
export async function writeSource(source: { revision: string; content: SharedContent }, next: SharedContent, token: string, message: string, fetcher = fetch) {
  contentSchema.parse(next);
  if (JSON.stringify(next) === JSON.stringify(source.content)) return { revision: source.revision, content: next, commit: null, digest: null };
  const result = z.object({ content: z.object({ sha: z.string() }), commit: z.object({ sha: z.string() }) }).parse(await github(`${repo}${path}`, token, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, branch: 'main', sha: source.revision, content: Buffer.from(JSON.stringify(next, null, 2) + '\n').toString('base64'), committer: { name: 'Tomo', email: '326405858+tomasminarik@users.noreply.github.com' } }),
  }, fetcher));
  return { revision: result.content.sha, content: next, commit: result.commit.sha, digest: createHash('sha256').update(JSON.stringify(next)).digest('hex') };
}
export async function publication(commit: string, digest: string, token: string, origin: string, fetcher = fetch) {
  // The public endpoint reports bundled content, so a matching digest proves it is live.
  const live = await fetcher(`${origin}/api/featured-fixture`, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10_000) });
  if (live.ok && (await live.json()).contentRevision === digest) return 'live' as const;
  const deployments = z.array(z.object({ id: z.number(), sha: z.string(), environment: z.string() })).parse(await github(`${repo}/deployments?sha=${commit}&per_page=100`, token, {}, fetcher));
  const production = deployments.find((item) => item.sha === commit && item.environment.toLowerCase() === 'production');
  if (production) {
    const statuses = z.array(z.object({ state: z.string() })).parse(await github(`${repo}/deployments/${production.id}/statuses?per_page=1`, token, {}, fetcher));
    if (['failure', 'error'].includes(statuses[0]?.state)) return 'failed' as const;
  }
  return 'pending' as const;
}

export async function readEditor(token: string, origin: string, fetcher = fetch) {
  const commits = z.array(z.object({ sha: z.string().regex(/^[a-f0-9]{40}$/) })).min(1).parse(await github(`${repo}/commits?sha=main&path=content/shared.json&per_page=1`, token, {}, fetcher));
  const commit = commits[0].sha;
  const source = await readSource(token, fetcher, commit);
  const digest = createHash('sha256').update(JSON.stringify(source.content)).digest('hex');
  let state: string = 'unknown';
  try { state = await publication(commit, digest, token, origin, fetcher); } catch { /* Content remains editable when deployment status is unavailable. */ }
  return { ...source, publication: { commit, digest, state } };
}
