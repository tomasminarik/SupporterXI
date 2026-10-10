import { describe, expect, it } from 'vitest';
import raw from '../fixtures/initial-content.json';
import { contentSchema, effectiveFixture, type Fixture, type SharedContent } from '../../src/domain/content';
import { selectFeaturedFixture, featuredResponse, featuredResponseSchema, formatClock, formatKickoff, lockMs, rolloverMs } from '../../src/domain/featured-fixture';

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
  it.each([-90 * 60_000, -1, 0, 120 * 60_000 - 1])('keeps fixture through kickoff and before rollover: %d', (offset) => {
    expect(selectFeaturedFixture(content(), now + offset).fixture?.id).toBe(firstId);
  });
  it('advances at exactly 120 minutes after kickoff without a rebuild (user decision, 10 October 2026)', () => {
    expect(rolloverMs).toBe(120 * 60_000);
    const data = content([fixture(), fixture(secondId, '2026-10-28T18:00:00Z')]);
    expect(selectFeaturedFixture(data, now + rolloverMs - 1).fixture?.id).toBe(firstId);
    expect(selectFeaturedFixture(data, now + rolloverMs)).toMatchObject({ fixture: { id: secondId }, locked: false, nextRefreshAt: '2026-10-28T18:15:00.000Z' });
    expect(selectFeaturedFixture(content(), now + rolloverMs).fixture).toBeNull();
  });
  it('locks the match from exactly 15 minutes after kickoff until the next one takes over', () => {
    expect(lockMs).toBe(15 * 60_000);
    // Open before and through kickoff; the page is told when the lock comes.
    for (const offset of [-90 * 60_000, 0, lockMs - 1]) expect(selectFeaturedFixture(content(), now + offset)).toMatchObject({ locked: false, nextRefreshAt: '2026-10-25T12:15:00.000Z' });
    // Locked from the boundary; the page is told when the next match opens.
    for (const offset of [lockMs, 60 * 60_000, rolloverMs - 1]) expect(selectFeaturedFixture(content(), now + offset)).toMatchObject({ fixture: { id: firstId }, locked: true, nextRefreshAt: '2026-10-25T14:00:00.000Z' });
    expect(featuredResponse(content(), 'a'.repeat(64), now + lockMs).locked).toBe(true);
    expect(featuredResponse(content([]), 'a'.repeat(64), now)).toMatchObject({ fixture: null, locked: false });
  });
  it('locks a manually featured match with a known kickoff and never one without', () => {
    expect(selectFeaturedFixture(content([fixture()], firstId), now)).toMatchObject({ locked: false, nextRefreshAt: '2026-10-25T12:15:00.000Z' });
    // A manual selection stays featured until cleared, so it stays locked and nothing is scheduled.
    expect(selectFeaturedFixture(content([fixture()], firstId), now + 99 * 86400_000)).toMatchObject({ fixture: { id: firstId }, locked: true, nextRefreshAt: null });
    const unknown = fixture(); unknown.values.kickoff = { kind: 'unknown' };
    expect(selectFeaturedFixture(content([unknown], unknown.id), now)).toMatchObject({ locked: false, nextRefreshAt: null });
  });
  it('reads responses from before the lock existed as unlocked, and formats the reopening time locally', () => {
    const { locked: _locked, ...older } = featuredResponse(content(), 'a'.repeat(64), now);
    void _locked;
    expect(featuredResponseSchema.parse(older).locked).toBe(false);
    expect(formatClock('2026-10-25T14:00:00.000Z', 'en-GB', 'Europe/Stockholm')).toBe('15:00');
  });
  it('sorts by instant then stable ID, independent of input order and offset spelling', () => {
    expect(selectFeaturedFixture(content([fixture(secondId, '2026-10-25T14:00:00+02:00'), fixture()]), now).fixture?.id).toBe(firstId);
  });
  it('uses corrected effective kickoff for rollover', () => {
    const f = fixture(); f.overrides.kickoff = { kind: 'confirmed', at: '2026-10-25T15:00:00Z' };
    const result = selectFeaturedFixture(content([f]), now + 3 * 60 * 60_000);
    expect(result.fixture?.id).toBe(firstId); expect(result.nextRefreshAt).toBe('2026-10-25T15:15:00.000Z'); expect(result.locked).toBe(false);
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
    expect(result.nextRefreshAt).toBe('2026-10-25T12:15:00.000Z');
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
