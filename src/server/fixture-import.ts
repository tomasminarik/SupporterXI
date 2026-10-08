import 'server-only';
import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';
import { reconcileFixtures } from '../domain/fixture-import';
import { AdminError, readSource, writeSource } from './admin/github';

const providerUrl = 'https://api.football-data.org/v4/teams/66/matches';
export function providerWindow(now: Date) {
  const from = new Date(now); from.setUTCDate(from.getUTCDate() - 7);
  const to = new Date(now); to.setUTCDate(to.getUTCDate() + 180);
  const url = new URL(providerUrl);
  url.searchParams.set('dateFrom', from.toISOString().slice(0, 10));
  url.searchParams.set('dateTo', to.toISOString().slice(0, 10));
  url.searchParams.set('limit', '500');
  return url.toString();
}
export async function fetchFixtures(providerToken: string, fetcher = fetch, now = new Date()) {
  if (!providerToken) throw new AdminError(503, 'Fixture import is not configured.');
  for (let attempt = 0; attempt < 3; attempt++) {
    let response: Response;
    try {
      response = await fetcher(providerWindow(now), { headers: { 'X-Auth-Token': providerToken, Accept: 'application/json' }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12_000) });
    } catch { throw new AdminError(502, 'Fixture provider is unavailable. Accepted content is unchanged.'); }
    if (response.status === 429) {
      // The v4 reset header is seconds until quota renewal. Avoid repeated calls
      // when the provider asks us to wait longer than a short request can afford.
      const resetHeader = response.headers.get('x-requestcounter-reset') ?? response.headers.get('retry-after');
      const reset = resetHeader === null ? NaN : Number(resetHeader);
      if (!Number.isFinite(reset) || reset < 0 || reset > 2 || attempt === 2) throw new AdminError(429, 'Fixture provider rate limit reached. Retry after its request counter resets; accepted content is unchanged.');
      await new Promise((resolve) => setTimeout(resolve, reset * 1000 + 100));
      continue;
    }
    if (response.status >= 500 && attempt < 2) { await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt)); continue; }
    if (!response.ok) throw new AdminError(502, 'Fixture provider rejected the request. Accepted content is unchanged.');
    const body = await response.text();
    if (body.length > 1_500_000) throw new AdminError(502, 'Fixture provider response is too large. Accepted content is unchanged.');
    try { return JSON.parse(body) as unknown; } catch { throw new AdminError(502, 'Fixture provider returned invalid data. Accepted content is unchanged.'); }
  }
  throw new AdminError(502, 'Fixture provider is unavailable. Accepted content is unchanged.');
}
export async function refreshFixtures(contentToken: string, providerToken: string, fetcher = fetch, now = new Date(), newId = randomUUID) {
  const payload = await fetchFixtures(providerToken, fetcher, now);
  const source = await readSource(contentToken, fetcher);
  let result: ReturnType<typeof reconcileFixtures>;
  try { result = reconcileFixtures(source.content, payload, newId); }
  catch (error) { if (error instanceof ZodError || error instanceof Error) throw new AdminError(502, 'Fixture provider data could not be validated. Accepted content is unchanged.'); throw error; }
  const { content, report } = result;
  const saved = await writeSource(source, content, contentToken, 'Import Manchester United PL/CL fixtures', fetcher);
  return { ...saved, report };
}
