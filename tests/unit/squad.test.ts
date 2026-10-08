import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import content from '../fixtures/initial-content.json';
import published from '../../content/shared.json';
import { validateAdminContent } from '../../src/domain/admin';
const seed = { schemaVersion: 1, players: content.players.map(({ id, name, shirtNumber }) => ({ id, name, shirtNumber })) };
import { initialSquad, validateSquadSeed } from '../../src/domain/squad';

describe('MVP-10: supplied seed integrity (not admin policy)', () => {
  it('preserves all 36 supplied identities, names and numbers', () => {
    const initialSquad = validateSquadSeed(seed);
    expect(initialSquad).toEqual(seed.players);
    expect(initialSquad).toHaveLength(36);
    expect(new Set(initialSquad.map((p) => p.id)).size).toBe(36);
    // Fingerprint the original records, including every UUID; deliberate migration only.
    expect(createHash('sha256').update(JSON.stringify(seed.players)).digest('hex')).toBe('de3b2969355da0c0def5aa2535abf9705f85385d1c953f7b5e0119fb5d1820a0');
    const review = readFileSync('docs/product/initial-squad.md', 'utf8');
    for (const player of initialSquad) expect(review).toContain(`| ${player.shirtNumber} | ${player.name} |`);
    expect(initialSquad.map((p) => p.shirtNumber)).toEqual(initialSquad.map((p) => p.shirtNumber).toSorted((a, b) => (a ?? 0) - (b ?? 0)));
    expect(new Set(initialSquad.map((p) => p.shirtNumber)).size).toBe(36);
    expect(initialSquad.every((p) => !('active' in p) && !('availability' in p))).toBe(true);
  });
  it('validates current published content and its generated projection independently of the historical seed', () => {
    expect(validateAdminContent(published)).toBeDefined();
    expect(initialSquad).toEqual(published.players.map(({ id, name, shirtNumber }) => ({ id, name, shirtNumber })));
    for (const player of seed.players) expect(published.players.some((p) => p.id === player.id)).toBe(true);
  });
  it.each([
    null, {}, { ...seed, schemaVersion: 2 }, { ...seed, players: {} },
    { ...seed, players: [seed.players[0], seed.players[0]] },
    ...[{ id: 'bad' }, { name: ' ' }, { shirtNumber: 1.5 }, { shirtNumber: '1' }].map((change) => ({ ...seed, players: [{ ...seed.players[0], ...change }] }))
  ])('rejects malformed or duplicate-identity seed: %j', (input) => {
    expect(() => validateSquadSeed(input)).toThrow();
  });
  it('keeps projection shape validation separate from admin number policy', () => {
    const players = [ { ...seed.players[0], shirtNumber: 100 }, { ...seed.players[1], shirtNumber: 100 } ];
    expect(validateSquadSeed({ schemaVersion: 1, players })).toEqual(players);
  });
});
