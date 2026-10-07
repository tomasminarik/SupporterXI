import { z } from 'zod';
import { effectiveFixture, fixtureValuesSchema, type SharedContent } from './content';

export const featuredResponseSchema = z.strictObject({
  schemaVersion: z.literal(1),
  contentRevision: z.string().regex(/^[a-f0-9]{64}$/),
  serverNow: z.iso.datetime(),
  nextRefreshAt: z.iso.datetime().nullable(),
  fixture: fixtureValuesSchema.extend({ id: z.uuid() }).nullable(),
});
export type FeaturedResponse = z.infer<typeof featuredResponseSchema>;
export const rolloverMs = 3 * 60 * 60 * 1000;

export function selectFeaturedFixture(content: SharedContent, nowMs: number) {
  if (!Number.isFinite(nowMs)) throw new Error('Invalid server time');
  const fixtures = content.fixtures.map(effectiveFixture);
  const override = fixtures.find((f) => f.id === content.featuredFixtureId);
  if (override?.status === 'scheduled') return { fixture: override, nextRefreshAt: null, staleOverride: false };
  const selected = fixtures.filter((fixture) => fixture.status === 'scheduled' && fixture.kickoff.kind === 'confirmed' && nowMs < Date.parse(fixture.kickoff.at) + rolloverMs)
    .sort((a, b) => {
      const aTime = a.kickoff.kind === 'confirmed' ? Date.parse(a.kickoff.at) : 0;
      const bTime = b.kickoff.kind === 'confirmed' ? Date.parse(b.kickoff.at) : 0;
      return aTime - bTime || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    })[0] ?? null;
  return {
    fixture: selected,
    nextRefreshAt: selected?.kickoff.kind === 'confirmed' ? new Date(Date.parse(selected.kickoff.at) + rolloverMs).toISOString() : null,
    staleOverride: content.featuredFixtureId !== null,
  };
}

export function featuredResponse(content: SharedContent, revision: string, nowMs: number): FeaturedResponse {
  const { fixture, nextRefreshAt } = selectFeaturedFixture(content, nowMs);
  return { schemaVersion: 1, contentRevision: revision, serverNow: new Date(nowMs).toISOString(), nextRefreshAt, fixture };
}

export function formatKickoff(at: string, locale?: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short', timeZone }).format(new Date(at));
}
