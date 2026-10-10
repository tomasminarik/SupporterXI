import { describe, expect, it } from 'vitest';
import raw from '../fixtures/initial-content.json';
import { contentSchema } from '../../src/domain/content';
import { featuredResponse } from '../../src/domain/featured-fixture';
import { formations } from '../../src/domain/catalogues';
import { changeFormation, emptyLineup, placePlayer, removePlayer, movePlayer, startingLineup } from '../../src/domain/lineup';
import { draftSchema, readDraft, writeDraft, isCompleteLineup } from '../../src/domain/draft';
import { freshDraft, initializeSession, sessionReducer } from '../../src/domain/builder-session';

const id = '10000000-0000-4000-8000-000000000001';
const content = contentSchema.parse({ ...raw, featuredFixtureId: id, fixtures: [{ id, source: { kind: 'manual' }, overrides: {}, values: { opponent: 'Synthetic FC', venue: 'home', competition: null, round: null, status: 'scheduled', kickoff: { kind: 'unknown' } } }] });
const context = featuredResponse(content, 'a'.repeat(64), Date.now());
const formation = formations.find((f) => f.id === '4-3-3')!;
const base = changeFormation(emptyLineup, formation).state;
const lineup = placePlayer(base, 'gk', raw.players[0].id, context.players.map((p) => p.id));
const draft = freshDraft(context, lineup)!;

describe('MVP-06 browser memory and M-02 eligibility', () => {
  it('activates the approved seed and defaults to available', () => {
    expect(context.players).toHaveLength(36);
    expect(context.players.every((p) => p.selectable)).toBe(true);
    const changed = structuredClone(content);
    changed.players[0].active = false;
    changed.fixtureAvailability = [{ fixtureId: id, playerId: changed.players[1].id, status: 'unavailable' }];
    expect(featuredResponse(changed, 'b'.repeat(64), Date.now()).players.slice(0, 3).map((p) => p.selectable)).toEqual([false, false, true]);
    expect(featuredResponse(contentSchema.parse(raw), 'a'.repeat(64), Date.now()).players).toEqual([]);
  });
  it('round trips the complete validated local snapshot', () => {
    let value: string | null = null;
    const storage = { getItem: () => value, setItem: (_: string, next: string) => { value = next; }, removeItem: () => { value = null; } };
    expect(readDraft(() => storage)).toEqual({ kind: 'empty' });
    expect(writeDraft(() => storage, draft)).toBe(true);
    expect(readDraft(() => storage)).toEqual({ kind: 'valid', draft });
  });
  it('still reads a lineup remembered before players carried the unavailable flag', () => {
    const older = JSON.stringify({ ...draft, players: draft.players.map(({ id, name, shirtNumber, selectable }) => ({ id, name, shirtNumber, selectable })) });
    const read = readDraft(() => ({ getItem: () => older, setItem: () => {}, removeItem: () => {} }));
    expect(read.kind === 'valid' && read.draft.players.every((p) => p.unavailable === false)).toBe(true);
  });
  it('handles blocked reads and quota failures without crashing', () => {
    const blocked = () => { throw new Error('blocked'); };
    expect(readDraft(blocked)).toEqual({ kind: 'unavailable' });
    expect(writeDraft(blocked, draft)).toBe(false);
  });
  it.each(['{', JSON.stringify({ ...draft, schemaVersion: 99 }), JSON.stringify({ ...draft, catalogueVersion: 'old' })])('rejects malformed/version-incompatible memory', (value) => {
    expect(readDraft(() => ({ getItem: () => value, setItem() {}, removeItem() {} }))).toEqual({ kind: 'invalid' });
  });
  it('rejects unknown players, duplicate selections, invalid roles and missing slots', () => {
    const copies = Array.from({ length: 4 }, () => structuredClone(draft));
    copies[0].lineup.slots.gk!.playerId = id;
    copies[1].lineup.slots.lb = copies[1].lineup.slots.gk;
    copies[2].lineup.slots.gk!.roleId = 'false-nine';
    delete copies[3].lineup.slots.lb;
    for (const copy of copies) expect(draftSchema.safeParse(copy).success).toBe(false);
  });
  it('retains ineligible players on restore and refresh; removal prevents re-addition', () => {
    const unavailable = { ...context, players: context.players.map((p) => ({ ...p, selectable: false })) };
    const restored = initializeSession(unavailable, { kind: 'valid', draft });
    expect(restored.draft?.lineup).toEqual(lineup);
    const refreshed = sessionReducer(initializeSession(context, { kind: 'valid', draft }), { type: 'published', context: unavailable });
    expect(refreshed.draft?.players.every((p) => !p.selectable)).toBe(true);
    expect(movePlayer(refreshed.draft!.lineup, 'gk', 'st').slots.st?.playerId).toBe(raw.players[0].id);
    const removed = removePlayer(refreshed.draft!.lineup, 'gk');
    expect(placePlayer(removed, 'gk', raw.players[0].id, [])).toBe(removed);
    let full = base;
    formation.slots.forEach((slot, i) => { full = placePlayer(full, slot[0], raw.players[i].id, context.players.map((p) => p.id)); });
    expect(isCompleteLineup(full, unavailable.players.map((p) => p.id))).toBe(true);
  });
  it('MVP-02: a fresh draft starts on 4-2-3-1 Wide with eleven empty slots; a restored draft keeps its formation', () => {
    const fresh = initializeSession(context, { kind: 'empty' });
    expect(fresh.draft?.lineup.formationId).toBe('4-2-3-1-wide');
    expect(Object.values(fresh.draft!.lineup.slots)).toEqual(Array(11).fill(null));
    expect(Object.keys(fresh.draft!.lineup.slots)).toEqual(formations[0].slots.map((slot) => slot[0]));
    expect(initializeSession(context, { kind: 'valid', draft }).draft?.lineup.formationId).toBe('4-3-3');
    const legacy = { ...draft, lineup: emptyLineup };
    expect(initializeSession(context, { kind: 'valid', draft: legacy }).draft?.lineup).toEqual(emptyLineup);
  });
  it('keeps an open old fixture snapshot and starts the new fixture only explicitly', () => {
    const next = { ...context, fixture: { ...context.fixture!, id: '10000000-0000-4000-8000-000000000002', opponent: 'Next synthetic FC' } };
    const state = initializeSession(context, { kind: 'valid', draft });
    expect(sessionReducer(state, { type: 'published', context: next })).toBe(state);
    expect(initializeSession(next, { kind: 'valid', draft }).recovery).toBe('different-fixture');
    expect(sessionReducer(state, { type: 'start', context: next }).draft?.lineup).toEqual(startingLineup);
    expect(sessionReducer(state, { type: 'published', context: { ...context, fixture: null, players: [] } })).toBe(state);
  });
  it('updates same-fixture corrections without discarding the XI', () => {
    const corrected = { ...context, fixture: { ...context.fixture!, opponent: 'Corrected synthetic FC' } };
    const result = sessionReducer(initializeSession(context, { kind: 'valid', draft }), { type: 'published', context: corrected });
    expect(result.draft?.fixture.opponent).toBe('Corrected synthetic FC');
    expect(result.draft?.lineup).toEqual(lineup);
  });
});
