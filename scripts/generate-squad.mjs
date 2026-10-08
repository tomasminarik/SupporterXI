import { readFileSync, writeFileSync } from 'node:fs';
const content = JSON.parse(readFileSync('content/shared.json', 'utf8'));
const path = 'src/data/squad.generated.ts';
const output = `// Generated from content/shared.json. Do not edit. No fixture/admin fields.\nexport default ${JSON.stringify({ schemaVersion: 1, players: content.players.map(({ id, name, shirtNumber }) => ({ id, name, shirtNumber })) }, null, 2)};\n`;
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8') !== output) throw new Error('Squad artifact stale: run npm run content:generate');
} else writeFileSync(path, output);
