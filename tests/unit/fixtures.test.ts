import { describe, expect, it } from 'vitest';
import raw from '../../content/shared.json';
import { contentSchema, effectiveFixture, type Fixture, type SharedContent } from '../../src/domain/content';
import { selectFeaturedFixture, featuredResponse, formatKickoff } from '../../src/domain/featured-fixture';

// Entirely synthetic opponents/times. Never included in published content.
const firstId = '10000000-0000-4000-8000-000000000001';
const secondId = '10000000-0000-4000-8000-000000000002';
const now = Date.parse('2026-10-25T12:00:00Z');
function fixture(id = firstId, at = '2026-10-25T12:00:00Z'): Fixture {
  return { id, source: { kind: 'manual' }, values: { opponent: 'Synthetic Test FC', venue: 'home', competition: 'Test Competition', round: null, status: 'scheduled', kickoff: { kind: 'confirmed', at } }, overrides: {} };
}
function content(fixtures: Fixture[] = [fixture()], featuredFixtureId: string | null = null): SharedContent {
  return contentSchema.parse({ ...raw, fixtures, featuredFixtureId });
}

describe('MVP-07: server fixture selection', () => {
  it.each([-90 * 60_000, -1, 0, 3 * 60 * 60_000 - 1])('keeps fixture through kickoff and before rollover: %d', (offset) => {
    expect(selectFeaturedFixture(content(), now + offset).fixture?.id).toBe(firstId);
  });
  it('advances at the exact three-hour boundary without a rebuild', () => {
    const data = content([fixture(), fixture(secondId, '2026-10-28T18:00:00Z')]);
    expect(selectFeaturedFixture(data, now + 3 * 60 * 60_000).fixture?.id).toBe(secondId);
    expect(selectFeaturedFixture(content(), now + 3 * 60 * 60_000).fixture).toBeNull();
  });
  it('sorts by instant then stable ID, independent of input order and offset spelling', () => {
    expect(selectFeaturedFixture(content([fixture(secondId, '2026-10-25T14:00:00+02:00'), fixture()]), now).fixture?.id).toBe(firstId);
  });
  it('uses corrected effective kickoff for rollover', () => {
    const f = fixture(); f.overrides.kickoff = { kind: 'confirmed', at: '2026-10-25T15:00:00Z' };
    const result = selectFeaturedFixture(content([f]), now + 3 * 60 * 60_000);
    expect(result.fixture?.id).toBe(firstId); expect(result.nextRefreshAt).toBe('2026-10-25T18:00:00.000Z');
  });
  it('skips unknown kickoffs automatically but permits a persistent scheduled override', () => {
    const f = fixture(); f.values.kickoff = { kind: 'unknown' };
    expect(selectFeaturedFixture(content([f]), now).fixture).toBeNull();
    expect(selectFeaturedFixture(content([f], f.id), now)).toMatchObject({ fixture: { id: f.id }, nextRefreshAt: null, staleOverride: false });
    expect(selectFeaturedFixture(content([fixture()], firstId), now + 99 * 86400_000).fixture?.id).toBe(firstId);
  });
  it.each(['postponed', 'cancelled'] as const)('excludes %s and flags stale override while falling back', (status) => {
    const f = fixture(); f.overrides.status = status;
    expect(selectFeaturedFixture(content([f, fixture(secondId)], firstId), now)).toMatchObject({ fixture: { id: secondId }, staleOverride: true });
    expect(selectFeaturedFixture(content([f]), now).fixture).toBeNull();
  });
  it('returns only selected public data, server time and revision', () => {
    const result = featuredResponse(content(), 'a'.repeat(64), now);
    expect(result.serverNow).toBe('2026-10-25T12:00:00.000Z');
    expect(result.nextRefreshAt).toBe('2026-10-25T15:00:00.000Z');
    expect(Object.keys(result.fixture!)).not.toContain('source');
    expect(Object.keys(result)).not.toContain('fixtures');
  });
  it('handles empty content and rejects invalid clocks', () => {
    expect(selectFeaturedFixture(content([]), now).fixture).toBeNull();
    expect(() => selectFeaturedFixture(content(), NaN)).toThrow();
  });
  it('formats the local timezone across a DST change', () => {
    const options = ['en-GB', 'Europe/Stockholm'] as const;
    expect(formatKickoff('2026-10-25T00:30:00Z', ...options)).toContain('02:30');
    expect(formatKickoff('2026-10-25T01:30:00Z', ...options)).toContain('02:30');
    expect(formatKickoff('2026-10-25T00:30:00Z', ...options)).not.toBe(formatKickoff('2026-10-25T01:30:00Z', ...options));
  });
});

describe('MVP-10/11 initial shared-content integrity', () => {
  it('validates the published document and keeps real fixtures empty', () => {
    expect(contentSchema.parse(raw).players).toHaveLength(36);
    expect(raw.fixtures).toEqual([]);
  });
  it('preserves per-field corrections including explicit unknown/null values', () => {
    const f = fixture(); f.overrides = { opponent: 'Corrected Synthetic FC', kickoff: { kind: 'unknown' }, competition: null };
    f.values.opponent = 'New Provider Name';
    expect(effectiveFixture(f)).toMatchObject({ id: firstId, opponent: 'Corrected Synthetic FC', kickoff: { kind: 'unknown' }, competition: null });
    delete f.overrides.opponent;
    expect(effectiveFixture(f)).toMatchObject({ opponent: 'New Provider Name', kickoff: { kind: 'unknown' } });
  });
  it.each(['2026-10-25T12:00:00', '2026-02-30T12:00:00Z', 'nonsense'])('rejects invalid/offset-free kickoff %s', (at) => {
    expect(() => content([fixture(firstId, at)])).toThrow();
  });
  it('rejects duplicated identities, provider mappings and dangling references', () => {
    expect(() => content([fixture(), fixture()])).toThrow();
    const first = fixture(); first.source = { kind: 'football-data.org', providerId: '123' };
    const second = fixture(secondId); second.source = first.source;
    expect(() => content([first, second])).toThrow();
    expect(() => content([], firstId)).toThrow();
    expect(() => contentSchema.parse({ ...raw, players: [raw.players[0], raw.players[0]] })).toThrow();
    expect(() => contentSchema.parse({ ...content(), fixtureAvailability: [{ fixtureId: firstId, playerId: secondId, status: 'unavailable' }] })).toThrow();
  });
  it('does not accept unknown source fields or masquerade unknown kickoff as a confirmed instant', () => {
    expect(() => contentSchema.parse({ ...content(), fixtures: [{ ...fixture(), values: { ...fixture().values, kickoff: { kind: 'unknown', at: '2026-10-25T00:00:00Z' } } }] })).toThrow();
    expect(() => contentSchema.parse({ ...raw, apiToken: 'not-allowed' })).toThrow();
  });
});
