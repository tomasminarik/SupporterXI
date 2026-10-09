import { describe, expect, it } from 'vitest';
import { formations } from '../../src/domain/catalogues';
import { initialSquad } from '../../src/domain/squad';
import { fieldPercent, markerLabel, placeLabels, portraitSpot, projectSlot, shortName, shortNames } from '../../src/components/pitch-geometry';

describe('MVP-13 desktop pitch presentation (UI redesign handoff)', () => {
  it('projects catalogue coordinates to the agreed mockup positions along the middle of the pitch', () => {
    // Points read from docs/design/reference/full-xi-pills.dc.html (4-2-3-1 Wide). Players on the line
    // between the goals are where the mockup put them (it nudged the forwards by hand, up to 8px).
    const expected: Record<string, [number, number]> = { gk: [210, 565], cam: [736, 565], st: [907, 565] };
    for (const [id, , x, y] of formations[0].slots) {
      if (!expected[id]) continue;
      const point = projectSlot(x, y);
      const tolerance = id === 'gk' ? 2 : 8.5;
      expect(Math.abs(point.x - expected[id][0])).toBeLessThanOrEqual(tolerance);
      expect(Math.abs(point.y - expected[id][1])).toBeLessThanOrEqual(tolerance);
    }
  });
  it('spreads central players across the pitch for their labels, keeping order, symmetry and the field', () => {
    // Decided 9 October 2026 to end label overlaps: a pill with its role is 54px tall, and the catalogue
    // puts three central players about 45px apart on screen.
    for (const formation of formations) {
      for (const [id, , x, y] of formation.slots) {
        const { top } = fieldPercent(x, y);
        expect(top, `${formation.name} ${id}`).toBeGreaterThan(6);
        expect(top, `${formation.name} ${id}`).toBeLessThan(94);
        expect(fieldPercent(100 - x, y).top).toBeCloseTo(100 - top, 6);
      }
      for (const a of formation.slots) for (const b of formation.slots) if (a[2] < b[2]) expect(fieldPercent(a[2], a[3]).top).toBeLessThan(fieldPercent(b[2], b[3]).top);
    }
    const midfield = formations.find((item) => item.id === '3-5-2')!.slots.filter((slot) => ['lcm', 'cm', 'rcm'].includes(slot[0])).map((slot) => projectSlot(slot[2], slot[3]).y);
    expect(midfield[1] - midfield[0]).toBeGreaterThanOrEqual(54);
    expect(midfield[2] - midfield[1]).toBeGreaterThanOrEqual(54);
  });
  it('labels paired central positions by line only', () => {
    expect(['LCB', 'RCB', 'CB', 'LDM', 'LCM', 'RAM', 'LST', 'CAM', 'CDM', 'LB', 'RWB', 'LW', 'RM', 'GK'].map(markerLabel)).toEqual(['CB', 'CB', 'CB', 'DM', 'CM', 'AM', 'ST', 'CAM', 'CDM', 'LB', 'RWB', 'LW', 'RM', 'GK']);
  });
  it('shortens names to surnames, keeping particles and single names, and separates shared surnames', () => {
    expect(['Matthijs de Ligt', 'Amad', 'Benjamin Šeško', 'Lisandro Martínez'].map(shortName)).toEqual(['de Ligt', 'Amad', 'Šeško', 'Martínez']);
    const names = shortNames(initialSquad);
    const fletchers = initialSquad.filter((player) => player.name.endsWith('Fletcher')).map((player) => names.get(player.id));
    expect(fletchers).toEqual(['J. Fletcher', 'T. Fletcher']);
    expect(new Set(names.values()).size).toBe(initialSquad.length);
  });
  it('keeps the agreed placement when there is room and flips labels when neighbours collide', () => {
    const spaced = placeLabels([{ id: 'a', x: 100, y: 100, pill: 120, tag: 140 }, { id: 'b', x: 400, y: 100, pill: 120, tag: 140 }]);
    expect([...spaced.values()]).toEqual([{ side: 'right', tag: 'below' }, { side: 'right', tag: 'below' }]);
    // A goalkeeper level with a centre-back 120px ahead extends the other way.
    const level = placeLabels([{ id: 'gk', x: 210, y: 565, pill: 130, tag: 150 }, { id: 'cb', x: 330, y: 565, pill: 120, tag: 140 }]);
    expect(level.get('gk')?.side).toBe('left');
    expect(level.get('cb')).toEqual({ side: 'right', tag: 'below' });
    // A tag over a pill just below flips above.
    const stacked = placeLabels([{ id: 'top', x: 500, y: 300, pill: 120, tag: 140 }, { id: 'low', x: 520, y: 340, pill: 120, tag: 0 }]);
    expect(stacked.get('top')?.tag).toBe('above');
  });
});

describe('MVP-13 mobile portrait pitch (UI slice 3)', () => {
  it('keeps every position on the pitch, mirrored, and in the catalogue\'s order from left to right and back to front', () => {
    for (const formation of formations) {
      for (const [id, , x, y] of formation.slots) {
        const spot = portraitSpot(x, y);
        expect(spot.left, `${formation.name} ${id}`).toBeGreaterThanOrEqual(9);
        expect(spot.left, `${formation.name} ${id}`).toBeLessThanOrEqual(91);
        expect(spot.top, `${formation.name} ${id}`).toBeGreaterThan(8);
        expect(spot.top, `${formation.name} ${id}`).toBeLessThan(92);
        expect(portraitSpot(100 - x, y).left).toBeCloseTo(100 - spot.left, 1);
      }
      for (const a of formation.slots) for (const b of formation.slots) {
        if (a[2] < b[2]) expect(portraitSpot(a[2], a[3]).left).toBeLessThan(portraitSpot(b[2], b[3]).left);
        if (a[3] < b[3]) expect(portraitSpot(a[2], a[3]).top).toBeGreaterThan(portraitSpot(b[2], b[3]).top);
      }
    }
  });
  it('gives players side by side room for a name: at least 16% of the pitch width apart in every formation', () => {
    for (const formation of formations) for (const a of formation.slots) for (const b of formation.slots) {
      if (a === b || Math.abs(a[3] - b[3]) > 6) continue;
      expect(Math.abs(portraitSpot(a[2], a[3]).left - portraitSpot(b[2], b[3]).left), `${formation.name} ${a[0]}/${b[0]}`).toBeGreaterThanOrEqual(16);
    }
  });
});
