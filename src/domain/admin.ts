import { z } from 'zod';
import { contentSchema, fixtureValuesSchema, type SharedContent } from './content';

const playerFields = z.strictObject({ name: z.string().trim().min(1).max(200), shirtNumber: z.number().int().min(1).max(99).nullable(), active: z.boolean() }).refine((p) => !p.active || p.shirtNumber !== null, 'Active players need a number');
export const adminCommandSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('fixture'), id: z.uuid().nullable(), values: fixtureValuesSchema }),
  z.strictObject({ kind: z.literal('clear-override'), id: z.uuid(), field: fixtureValuesSchema.keyof() }),
  z.strictObject({ kind: z.literal('featured'), id: z.uuid().nullable() }),
  z.strictObject({ kind: z.literal('player'), id: z.uuid().nullable(), values: playerFields }),
  z.strictObject({ kind: z.literal('availability'), fixtureId: z.uuid(), playerId: z.uuid(), status: z.enum(['available', 'unavailable']) }),
]);
export type AdminCommand = z.infer<typeof adminCommandSchema>;
export const adminRequestSchema = z.strictObject({ revision: z.string().regex(/^[a-f0-9]{40}$/), command: adminCommandSchema });
export function validateAdminContent(input: unknown): SharedContent {
  const content = contentSchema.parse(input);
  const numbers = new Set<number>();
  for (const player of content.players) {
    playerFields.parse({ name: player.name, shirtNumber: player.shirtNumber, active: player.active });
    if (player.active) {
      if (numbers.has(player.shirtNumber!)) throw new Error('Active shirt numbers must be unique');
      numbers.add(player.shirtNumber!);
    }
  }
  return content;
}
export function applyAdminCommand(current: SharedContent, input: unknown, newId: () => string): SharedContent {
  const command = adminCommandSchema.parse(input);
  const next = structuredClone(current);
  switch (command.kind) {
    case 'fixture': {
      if (!command.id) next.fixtures.push({ id: newId(), source: { kind: 'manual' }, values: command.values, overrides: {} });
      else {
        const fixture = next.fixtures.find((f) => f.id === command.id);
        if (!fixture) throw new Error('Fixture no longer exists');
        if (fixture.source.kind === 'manual') fixture.values = command.values;
        else {
          // Only edited effective fields become corrections. Unchanged fields stay importable.
          const keys = Object.keys(command.values) as (keyof typeof command.values)[];
          for (const key of keys) if (JSON.stringify(command.values[key]) !== JSON.stringify(Object.hasOwn(fixture.overrides, key) ? fixture.overrides[key] : fixture.values[key])) Object.assign(fixture.overrides, { [key]: command.values[key] });
        }
      }
      break;
    }
    case 'clear-override': {
      const fixture = next.fixtures.find((f) => f.id === command.id);
      if (!fixture) throw new Error('Fixture no longer exists');
      delete fixture.overrides[command.field]; break;
    }
    case 'featured': next.featuredFixtureId = command.id; break;
    case 'player': {
      if (!command.id) next.players.push({ id: newId(), ...command.values });
      else {
        const player = next.players.find((p) => p.id === command.id);
        if (!player) throw new Error('Player no longer exists');
        Object.assign(player, command.values);
      }
      break;
    }
    case 'availability': {
      next.fixtureAvailability = next.fixtureAvailability.filter((a) => a.fixtureId !== command.fixtureId || a.playerId !== command.playerId);
      next.fixtureAvailability.push({ fixtureId: command.fixtureId, playerId: command.playerId, status: command.status }); break;
    }
  }
  return validateAdminContent(next);
}
