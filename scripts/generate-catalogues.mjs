import { readFileSync, writeFileSync } from 'node:fs';

// Documentation owns the catalogues. Generated files are the only runtime sources.
const formationsDoc = readFileSync('docs/product/formations.md', 'utf8');
const rolesDoc = readFileSync('docs/product/player-roles.md', 'utf8');
const formationBlocks = [...formationsDoc.matchAll(/```json\n([\s\S]*?)\n```/g)];
if (formationBlocks.length !== 1) throw new Error('Expected one canonical formation JSON block');
const formations = JSON.parse(formationBlocks[0][1]);
const catalogue = rolesDoc.split('## 4. Canonical catalogue and order')[1].split('## 5. Role definitions')[0];
const rows = [...catalogue.matchAll(/^\| (\d+) \| `([^`]+)` \| ([^|]+) \| ([^|]+) \|$/gm)];
const definitions = rolesDoc.split('## 5. Role definitions')[1].split('## 6. Compatibility matrix')[0];
const roles = rows.map(([, order, id, name, families]) => {
  const section = definitions.split(`- **ID:** \`${id}\``)[1]?.split(/\n####? /)[0];
  const field = (label) => {
    const value = section?.split(`- **${label}:** `)[1]?.split('\n')[0];
    if (!value) throw new Error(`Missing ${label} for ${id}`);
    return value;
  };
  return { id, name: name.trim(), shortDefinition: field('Short UI definition'), fullDefinition: field('Complete definition'), compatibleRoleFamilies: families.trim().split(', '), displayOrder: Number(order) };
});
if (formations.formations.length !== 14 || roles.length !== 25) throw new Error('Unexpected catalogue size');
for (const [name, value] of [['formations', formations], ['roles', { schemaVersion: 1, roles }]]) {
  const path = `src/data/${name}.generated.ts`;
  const output = `// Generated from docs/product/${name === 'roles' ? 'player-roles' : name}.md. Do not edit.\nexport default ${JSON.stringify(value, null, 2)} as const;\n`;
  if (process.argv.includes('--check')) {
    if (readFileSync(path, 'utf8') !== output) throw new Error(`${path} is stale; run npm run catalogues:generate`);
  } else writeFileSync(path, output);
}
