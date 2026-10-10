import { z } from 'zod';
import { effectiveFixture, fixtureValuesSchema, playerAvailability, type SharedContent } from './content';

export const publicPlayerSchema = z.strictObject({ id: z.uuid(), name: z.string().min(1), shirtNumber: z.number().int().nullable(), selectable: z.boolean() });
export type PublicPlayer = z.infer<typeof publicPlayerSchema>;

export const featuredResponseSchema = z.strictObject({
  schemaVersion: z.literal(2),
  contentRevision: z.string().regex(/^[a-f0-9]{64}$/),
  serverNow: z.iso.datetime(),
  nextRefreshAt: z.iso.datetime().nullable(),
  // True once the featured match is 15 minutes old: its lineups can no longer be changed.
  locked: z.boolean().default(false),
  players: z.array(publicPlayerSchema),
  fixture: fixtureValuesSchema.extend({ id: z.uuid() }).nullable(),
});
export type FeaturedResponse = z.infer<typeof featuredResponseSchema>;
// User decision, 10 October 2026: a lineup can be changed until 15 minutes after kickoff, and the next
// match takes over 120 minutes after kickoff (before, kickoff plus three hours with no lock).
export const lockMs = 15 * 60 * 1000;
export const rolloverMs = 120 * 60 * 1000;

export function selectFeaturedFixture(content: SharedContent, nowMs: number) {
  if (!Number.isFinite(nowMs)) throw new Error('Invalid server time');
  const fixtures = content.fixtures.map(effectiveFixture);
  const kickoffOf = (fixture: (typeof fixtures)[number] | null | undefined) => fixture?.kickoff.kind === 'confirmed' ? Date.parse(fixture.kickoff.at) : null;
  // Before the lock the page needs to hear about it; after it, about the next match taking over.
  const timing = (fixture: (typeof fixtures)[number] | null, rollsOver: boolean) => {
    const kickoff = kickoffOf(fixture);
    if (kickoff === null) return { locked: false, nextRefreshAt: null };
    const locked = nowMs >= kickoff + lockMs;
    const next = locked ? (rollsOver ? kickoff + rolloverMs : null) : kickoff + lockMs;
    return { locked, nextRefreshAt: next === null ? null : new Date(next).toISOString() };
  };
  // A manual selection stays featured until cleared; with a known kickoff it locks like any other match.
  const override = fixtures.find((f) => f.id === content.featuredFixtureId);
  if (override?.status === 'scheduled') return { fixture: override, ...timing(override, false), staleOverride: false };
  const selected = fixtures.filter((fixture) => fixture.status === 'scheduled' && fixture.kickoff.kind === 'confirmed' && nowMs < Date.parse(fixture.kickoff.at) + rolloverMs)
    .sort((a, b) => {
      const aTime = kickoffOf(a) ?? 0;
      const bTime = kickoffOf(b) ?? 0;
      return aTime - bTime || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    })[0] ?? null;
  return { fixture: selected, ...timing(selected, true), staleOverride: content.featuredFixtureId !== null };
}

export function featuredResponse(content: SharedContent, revision: string, nowMs: number): FeaturedResponse {
  const { fixture, nextRefreshAt, locked } = selectFeaturedFixture(content, nowMs);
  const players = fixture ? content.players.map(({ id, name, shirtNumber, active }) => ({ id, name, shirtNumber, selectable: active && playerAvailability(content, id, fixture.id) === 'available' })) : [];
  return { schemaVersion: 2, contentRevision: revision, serverNow: new Date(nowMs).toISOString(), nextRefreshAt, locked, fixture, players };
}

export function formatKickoff(at: string, locale?: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short', timeZone }).format(new Date(at));
}

/** A clock time in the visitor's own time zone, for "the next match opens at 20:30". */
export function formatClock(at: string, locale?: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone }).format(new Date(at));
}
