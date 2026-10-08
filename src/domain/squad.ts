import seed from '../data/squad.generated';

export type SeedPlayer = Readonly<{ id: string; name: string; shirtNumber: number | null }>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Public projection shape validation. M-01 is enforced by the server admin validator.
// Active state and fixture availability are intentionally not inferred here.
export function validateSquadSeed(input: unknown): readonly SeedPlayer[] {
  if (!input || typeof input !== 'object' || !('schemaVersion' in input) || input.schemaVersion !== 1 || !('players' in input) || !Array.isArray(input.players)) {
    throw new Error('Unsupported squad seed');
  }
  const ids = new Set<string>();
  const players: SeedPlayer[] = input.players.map((player: unknown) => {
    if (!player || typeof player !== 'object' || !('id' in player) || typeof player.id !== 'string' || !uuid.test(player.id) || ids.has(player.id) || !('name' in player) || typeof player.name !== 'string' || !player.name.trim() || !('shirtNumber' in player) || (player.shirtNumber !== null && (typeof player.shirtNumber !== 'number' || !Number.isInteger(player.shirtNumber)))) {
      throw new Error('Invalid squad seed player or duplicate identity');
    }
    ids.add(player.id);
    return Object.freeze({ id: player.id, name: player.name, shirtNumber: player.shirtNumber });
  });
  return Object.freeze(players);
}

// Consume the generated public projection; shared-content parity is checked at build time.
export const initialSquad = validateSquadSeed(seed);
