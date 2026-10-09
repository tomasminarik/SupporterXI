import { describe, expect, it } from 'vitest';
import { formations, roles } from '../../src/domain/catalogues';
import { initialSquad } from '../../src/domain/squad';
import type { Draft } from '../../src/domain/draft';
import { assignRole, changeFormation, emptyLineup, placePlayer, removePlayer } from '../../src/domain/lineup';
import { fitHeadline, frame, markerBoxes, placePlayers, type Box, type Measure } from '../../src/share/layout';
import { describeSnapshot, missingPlayers, shareFileName, shareFormats, takeSnapshot, type ShareFormat } from '../../src/share/snapshot';

const players = initialSquad.map((player) => ({ ...player, selectable: true }));
const ids = players.map((player) => player.id);
const fixture: Draft['fixture'] = { id: '20000000-0000-4000-8000-000000000001', opponent: 'Tottenham Hotspur FC', venue: 'home', competition: 'Premier League', round: 'Matchday 6', status: 'scheduled', kickoff: { kind: 'confirmed', at: '2026-10-10T16:30:00Z' } };
function fullXi(formationId = '4-2-3-1-wide', picked = ids) {
  const formation = formations.find((item) => item.id === formationId)!;
  let lineup = changeFormation(emptyLineup, formation).state;
  formation.slots.forEach((slot, index) => { lineup = placePlayer(lineup, slot[0], picked[index], ids); });
  return { fixture, players, lineup };
}
// Barlow 600 capitals average a little under 0.62 of the type size; this errs on the wide side.
const measure: Measure = (text, size) => text.length * size * 0.62;
const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('MVP-08 share snapshot', () => {
  it('refuses an incomplete XI and counts what is missing', () => {
    const complete = fullXi();
    expect(missingPlayers(complete)).toBe(0);
    const ten = { ...complete, lineup: removePlayer(complete.lineup, 'st') };
    expect(missingPlayers(ten)).toBe(1);
    expect(takeSnapshot(ten)).toBeNull();
    expect(takeSnapshot({ ...complete, lineup: emptyLineup })).toBeNull();
    expect(missingPlayers({ lineup: changeFormation(emptyLineup, formations[0]).state })).toBe(11);
  });
  it('copies fixture, formation and eleven players, and never a role', () => {
    const complete = fullXi();
    const withRole = { ...complete, lineup: assignRole(complete.lineup, 'lb', 'stay-back-full-back') };
    const assigned = Object.values(withRole.lineup.slots).filter((slot) => slot?.roleId).length;
    expect(assigned).toBe(roles.some((role) => role.id === 'stay-back-full-back') ? 1 : 0);
    const snapshot = takeSnapshot(withRole, 'en-GB', 'Europe/London')!;
    expect(snapshot.players).toHaveLength(11);
    expect(snapshot.formation).toBe('4-2-3-1 Wide');
    expect(snapshot.opponent).toBe('Tottenham Hotspur FC');
    expect(snapshot.context).toEqual(['Premier League', 'Matchday 6', 'Home']);
    expect(snapshot.kickoff).toBe('Sat, 10 Oct 2026, 17:30 BST');
    const text = JSON.stringify(snapshot).toLowerCase();
    expect(text).not.toContain('role');
    for (const role of roles) expect(text).not.toContain(role.name.toLowerCase());
    expect(describeSnapshot(snapshot)).toContain('Senne Lammens');
  });
  it('is immutable and unaffected by later edits to the working XI', () => {
    const working = fullXi();
    const snapshot = takeSnapshot(working)!;
    const before = JSON.stringify(snapshot);
    working.lineup = removePlayer(working.lineup, 'gk');
    working.fixture = { ...fixture, opponent: 'Someone else' };
    working.players[0] = { ...working.players[0], name: 'Changed Name' };
    expect(JSON.stringify(snapshot)).toBe(before);
    expect(Object.isFrozen(snapshot) && Object.isFrozen(snapshot.players) && snapshot.players.every(Object.isFrozen)).toBe(true);
    expect(() => { (snapshot.players as unknown as unknown[]).push({}); }).toThrow();
  });
  it('states an unknown kickoff honestly and keeps a player who became unavailable (M-02)', () => {
    const complete = fullXi();
    const source = { ...complete, fixture: { ...fixture, round: null, venue: 'away' as const, kickoff: { kind: 'unknown' as const } }, players: players.map((player, index) => index === 0 ? { ...player, selectable: false } : player) };
    const snapshot = takeSnapshot(source)!;
    expect(snapshot.kickoff).toBe('Time to be confirmed');
    expect(snapshot.context).toEqual(['Premier League', 'Away']);
    expect(snapshot.players[0].fullName).toBe(players[0].name);
  });
  it('tells players who share a surname apart and names files plainly', () => {
    const fletchers = players.filter((player) => player.name.endsWith('Fletcher')).map((player) => player.id);
    const snapshot = takeSnapshot(fullXi('4-2-3-1-wide', [...fletchers, ...ids.filter((id) => !fletchers.includes(id))]))!;
    expect(snapshot.players.slice(0, 2).map((player) => player.name)).toEqual(['J. Fletcher', 'T. Fletcher']);
    expect(shareFileName(snapshot, 'story')).toBe('supporter-xi-v-tottenham-hotspur-fc-story.png');
    expect(shareFileName({ ...snapshot, opponent: 'FC Bayern München' }, 'feed')).toBe('supporter-xi-v-fc-bayern-munchen-feed.png');
  });
});

describe('MVP-08 share image layout', () => {
  it('uses the two approved portrait sizes', () => {
    expect(shareFormats.feed).toMatchObject({ width: 1080, height: 1350 });
    expect(shareFormats.story).toMatchObject({ width: 1080, height: 1920 });
  });
  it('keeps every number and name apart and inside the image, in all 14 formations with the longest names', () => {
    const longest = [...players].sort((a, b) => b.name.split(' ').at(-1)!.length - a.name.split(' ').at(-1)!.length).slice(0, 11).map((player) => player.id);
    for (const format of Object.keys(shareFormats) as ShareFormat[]) {
      const f = frame(format);
      // The lowest the pitch can start: a headline with two lines of details above it.
      const top = f.top + (format === 'story' ? 320 : 310);
      const pitch = { x: f.side, y: top, w: f.inner, h: f.pitchBottom - top };
      for (const formation of formations) {
        const placed = placePlayers(takeSnapshot(fullXi(formation.id, longest))!.players, pitch, f.width, measure);
        const where = `${format} ${formation.name}`;
        for (const player of placed) {
          expect(player.label, where).not.toContain('…');
          expect(player.size, where).toBeGreaterThanOrEqual(18);
          for (const box of markerBoxes(player)) {
            expect(box.x, where).toBeGreaterThanOrEqual(0);
            expect(box.x + box.w, where).toBeLessThanOrEqual(f.width);
            expect(box.y + box.h, where).toBeLessThanOrEqual(f.pitchBottom);
          }
        }
        for (const [index, a] of placed.entries()) for (const b of placed.slice(index + 1)) {
          for (const first of markerBoxes(a)) for (const second of markerBoxes(b)) expect(overlap(first, second), `${where}: ${a.label} / ${b.label}`).toBe(false);
        }
      }
    }
  });
  it('fits the headline: one line when it can, wrapped when it cannot', () => {
    const wide: Measure = (text, size) => text.length * size * 0.43;
    const short = fitHeadline('Chelsea FC', 984, { max: 104, min: 76 }, wide);
    expect(short).toEqual({ size: 104, lines: ['V CHELSEA FC'] });
    const long = fitHeadline('Wolverhampton Wanderers FC', 984, { max: 104, min: 76 }, wide);
    expect(long.lines).toEqual(['V WOLVERHAMPTON WANDERERS FC']);
    expect(long.size).toBeLessThan(104);
    const longest = fitHeadline('Borussia Verein für Leibesübungen Mönchengladbach', 984, { max: 104, min: 76 }, wide);
    expect(longest.lines.length).toBeGreaterThan(1);
    expect(longest.lines.join(' ')).toBe('V BORUSSIA VEREIN FÜR LEIBESÜBUNGEN MÖNCHENGLADBACH');
    for (const line of longest.lines) expect(wide(line, longest.size)).toBeLessThanOrEqual(984);
  });
});
