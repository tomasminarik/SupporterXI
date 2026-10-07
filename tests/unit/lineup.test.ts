import { describe, expect, it } from 'vitest';
import { formations } from '../../src/domain/catalogues';
import { initialSquad } from '../../src/domain/squad';
import { assignRole, changeFormation, clearLineup, emptyLineup, movePlayer, placePlayer, removePlayer } from '../../src/domain/lineup';
const four = formations.find((f) => f.id === '4-3-3')!;
const three = formations.find((f) => f.id === '3-4-3-wide')!;
const ids = initialSquad.map((p) => p.id);
const base = () => changeFormation(emptyLineup, four).state;

describe('MVP-02–05: in-memory whiteboard mechanics, eligibility supplied by caller', () => {
  it('starts without a shape or automatic player/role selections', () => {
    expect(emptyLineup).toEqual({ formationId: null, slots: {} });
    expect(Object.values(base().slots)).toEqual(Array(11).fill(null));
  });
  it('allows any selectable player in any slot, but rejects duplicates and unknown identities/slots', () => {
    for (const slot of four.slots) expect(placePlayer(base(), slot[0], ids[0], ids).slots[slot[0]]?.playerId).toBe(ids[0]);
    const state = placePlayer(base(), 'st', ids[0], ids);
    expect(placePlayer(state, 'gk', ids[0], ids)).toBe(state);
    expect(placePlayer(state, 'gk', 'unknown', ids)).toBe(state);
    expect(placePlayer(state, 'fake', ids[1], ids)).toBe(state);
  });
  it('replacement retains the slot role; removal clears it and releases the player', () => {
    const state = assignRole(placePlayer(base(), 'st', ids[0], ids), 'st', 'false-nine');
    const replaced = placePlayer(state, 'st', ids[1], ids);
    expect(replaced.slots.st).toEqual({ playerId: ids[1], roleId: 'false-nine' });
    expect(placePlayer(replaced, 'gk', ids[0], ids).slots.gk?.playerId).toBe(ids[0]);
    expect(removePlayer(replaced, 'st').slots.st).toBeNull();
  });
  it('moves into an empty slot without carrying the role', () => {
    const state = assignRole(placePlayer(base(), 'lb', ids[0], ids), 'lb', 'stay-back-full-back');
    const moved = movePlayer(state, 'lb', 'st');
    expect(moved.slots.lb).toBeNull();
    expect(moved.slots.st).toEqual({ playerId: ids[0], roleId: null });
  });
  it('swaps only players, leaving compatible roles on their occupied slots', () => {
    const left = assignRole(placePlayer(base(), 'lb', ids[0], ids), 'lb', 'stay-back-full-back');
    const state = assignRole(placePlayer(left, 'st', ids[1], ids), 'st', 'false-nine');
    const swapped = movePlayer(state, 'lb', 'st');
    expect(swapped.slots.lb).toEqual({ playerId: ids[1], roleId: 'stay-back-full-back' });
    expect(swapped.slots.st).toEqual({ playerId: ids[0], roleId: 'false-nine' });
    expect(movePlayer(state, 'bad', 'st')).toBe(state);
    expect(movePlayer(state, 'lb', 'bad')).toBe(state);
  });
  it('rejects unknown/incompatible roles and roles on empty slots; null removes roles', () => {
    const state = placePlayer(base(), 'st', ids[0], ids);
    for (const role of ['invented', 'inside-forward']) expect(assignRole(state, 'st', role)).toBe(state);
    expect(assignRole(state, 'gk', 'traditional-goalkeeper')).toBe(state);
    expect(assignRole(assignRole(state, 'st', 'false-nine'), 'st', null).slots.st?.roleId).toBeNull();
  });
  it('corrected AR-05: proposes LB → LWB, retaining player and clearing incompatible role without mutating source', () => {
    const state = assignRole(placePlayer(base(), 'lb', ids[0], ids), 'lb', 'stay-back-full-back');
    const before = structuredClone(state);
    const proposal = changeFormation(state, three);
    expect(proposal.state.slots.lwb).toEqual({ playerId: ids[0], roleId: null });
    expect(proposal.clearedRoles).toBe(1);
    expect(proposal.releasedPlayers).toBe(0);
    expect(state).toEqual(before);
  });
  it('preserves compatible roles and reports unmatched players without proximity guesses', () => {
    let state = assignRole(placePlayer(base(), 'lb', ids[0], ids), 'lb', 'inverted-full-back');
    state = placePlayer(state, 'cdm', ids[1], ids);
    const proposal = changeFormation(state, three);
    expect(proposal.state.slots.lwb?.roleId).toBe('inverted-full-back');
    expect(proposal.releasedPlayers).toBe(1);
    expect(Object.values(proposal.state.slots).some((s) => s?.playerId === ids[1])).toBe(false);
  });
  it('clears players and roles while retaining the formation', () => {
    expect(clearLineup(assignRole(placePlayer(base(), 'st', ids[0], ids), 'st', 'false-nine'))).toEqual(base());
  });
});
