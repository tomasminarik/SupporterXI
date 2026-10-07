import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import data from '../../src/data/formations.generated';
import { formations, roles, roleFamilies, rolesForFamily, isRoleCompatible } from '../../src/domain/catalogues';

const formationDoc = readFileSync('docs/product/formations.md', 'utf8');
const roleDoc = readFileSync('docs/product/player-roles.md', 'utf8');
const section = (doc: string, start: string, end: string) => doc.split(start)[1].split(end)[0];
const tableRows = (text: string) => text.split('\n').filter((line) => line.startsWith('| ')).map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim().replaceAll('`', ''))).slice(2);

describe('MVP-01: canonical formations', () => {
  it('matches the normative JSON and display table exactly', () => {
    const canonical = JSON.parse(formationDoc.match(/```json\n([\s\S]*?)\n```/)![1]);
    expect(data).toEqual(canonical);
    expect(formations.map(({ displayOrder, id, name }) => [String(displayOrder), id, name])).toEqual(tableRows(section(formationDoc, '## 4. Canonical display order', '## 5. Formation definitions')).map((row) => row.slice(0, 3)));
    expect(formations).toHaveLength(14);
    expect(new Set(formations.map((f) => f.id)).size).toBe(14);
    expect(formations.map((f) => f.displayOrder)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
  });

  for (const formation of formations) {
    it(`${formation.id}: eleven unique, mirrored, valid slots with prose-table parity`, () => {
      const prose = formationDoc.split(`- **ID:** \`${formation.id}\``)[1].split(/\n### |\n---/)[0];
      expect(formation.slots.map((slot) => slot.map(String))).toEqual(tableRows(prose));
      expect(formation.slots).toHaveLength(11);
      expect(new Set(formation.slots.map((s) => s[0])).size).toBe(11);
      expect(new Set(formation.slots.map((s) => s[5])).size).toBe(11);
      expect(formation.slots.filter((s) => s[1] === 'GK')).toHaveLength(1);
      expect(formation.slots.filter((s) => s[5] === 'goalkeeper')).toHaveLength(1);
      for (const [id, abbreviation, x, y, family] of formation.slots) {
        expect(abbreviation).toBe(id.toUpperCase());
        expect(roleFamilies).toContain(family);
        for (const coordinate of [x, y]) {
          expect(Number.isInteger(coordinate)).toBe(true);
          expect(coordinate).toBeGreaterThanOrEqual(0);
          expect(coordinate).toBeLessThanOrEqual(100);
        }
        if (id.startsWith('l')) {
          const right = formation.slots.find((s) => s[0] === `r${id.slice(1)}`);
          expect(right, `Missing mirror for ${id}`).toBeDefined();
          expect(x + right![2]).toBe(100);
          expect(y).toBe(right![3]);
        }
      }
    });
  }

  it('reused slot IDs preserve their positional meaning', () => {
    const meanings = new Map<string, string>();
    for (const f of formations) for (const [id, abbreviation, , , family, key] of f.slots) {
      const meaning = `${abbreviation}/${family}/${key}`;
      if (meanings.has(id)) expect(meaning).toBe(meanings.get(id));
      meanings.set(id, meaning);
    }
    const positions = tableRows(section(roleDoc, '### 3.2 Derived position abbreviations', '## 4. Canonical catalogue'));
    for (const f of formations) for (const slot of f.slots) {
      expect(positions.find((r) => r[0] === slot[4])![1].split(', ')).toContain(slot[1]);
    }
  });
});

describe('MVP-01: canonical roles', () => {
  it('preserves all 25 IDs, exact labels, order, definitions and families', () => {
    const rows = tableRows(section(roleDoc, '## 4. Canonical catalogue and order', '## 5. Role definitions'));
    expect(roles).toHaveLength(25);
    expect(new Set(roles.map((role) => role.id)).size).toBe(25);
    expect(roles.map((r) => [String(r.displayOrder), r.id, r.name, r.compatibleRoleFamilies.join(', ')])).toEqual(rows);
    expect(roles.map((r) => r.displayOrder)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
    for (const role of roles) {
      expect(role.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
      const definition = section(roleDoc, `#### ${role.name}\n`, '- **Distinction:**');
      expect(definition).toContain(`- **Short UI definition:** ${role.shortDefinition}\n`);
      expect(definition).toContain(`- **Complete definition:** ${role.fullDefinition}\n`);
      expect(definition.match(/- \*\*Compatible role families:\*\* (.*)/)![1].replaceAll('`', '').split(', ')).toEqual(role.compatibleRoleFamilies);
      expect(new Set(role.compatibleRoleFamilies).size).toBe(role.compatibleRoleFamilies.length);
      role.compatibleRoleFamilies.forEach((family) => expect(roleFamilies).toContain(family));
    }
  });

  it('derives every chooser from the independent normative compatibility matrix', () => {
    const rows = tableRows(section(roleDoc, '## 6. Compatibility matrix', '## 7. Deliberately excluded'));
    expect(rows.map((r) => r[0])).toEqual(roleFamilies);
    for (const family of roleFamilies) {
      const expected = rows.find((r) => r[0] === family)![1].split(', ');
      expect(rolesForFamily(family).map((r) => r.id)).toEqual(expected);
      expect(expected.length).toBeLessThanOrEqual(6);
      expect(isRoleCompatible(null, family)).toBe(true);
      expect(isRoleCompatible('invented-role', family)).toBe(false);
      expect(isRoleCompatible('False Nine', family)).toBe(false);
      for (const role of roles) expect(isRoleCompatible(role.id, family)).toBe(expected.includes(role.id));
    }
  });

  it('supports corrected AR-05 without changing equivalence keys', () => {
    const lb = formations.find((f) => f.id === '4-3-3')!.slots.find((s) => s[0] === 'lb')!;
    const lwb = formations.find((f) => f.id === '3-4-3-wide')!.slots.find((s) => s[0] === 'lwb')!;
    expect(lb[5]).toBe(lwb[5]);
    expect(isRoleCompatible('stay-back-full-back', lb[4])).toBe(true);
    expect(isRoleCompatible('stay-back-full-back', lwb[4])).toBe(false);
    const lcm = formations.find((f) => f.id === '4-3-3')!.slots.find((s) => s[0] === 'lcm')!;
    const ldm = formations.find((f) => f.id === '4-2-3-1-wide')!.slots.find((s) => s[0] === 'ldm')!;
    expect(lcm[5]).not.toBe(ldm[5]);
  });
});
