import { z } from 'zod';

const label = z.string().trim().min(1).max(200);
export const kickoffSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('unknown') }),
  z.strictObject({ kind: z.literal('confirmed'), at: z.iso.datetime({ offset: true }).refine((value) => Number.isFinite(Date.parse(value)), 'Invalid instant') }),
]);
export const fixtureValuesSchema = z.strictObject({
  opponent: label,
  venue: z.enum(['home', 'away']),
  competition: label.nullable(),
  round: label.nullable(),
  status: z.enum(['scheduled', 'postponed', 'cancelled']),
  kickoff: kickoffSchema,
});
export const fixtureSchema = z.strictObject({
  id: z.uuid(),
  source: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('manual') }),
    z.strictObject({ kind: z.literal('football-data.org'), providerId: z.string().regex(/^\d+$/) }),
  ]),
  values: fixtureValuesSchema,
  overrides: fixtureValuesSchema.partial(),
});
// Active state approved on 7 October 2026. M-01 approved on 8 October 2026; admin writes enforce number policy.
// This remains a content-read schema, not an admin write authorization boundary.
const playerSchema = z.strictObject({ id: z.uuid(), name: label, shirtNumber: z.number().int().nullable(), active: z.boolean(), unavailableUntilCleared: z.boolean().default(false) });
export const contentSchema = z.strictObject({
  schemaVersion: z.literal(2),
  players: z.array(playerSchema),
  fixtures: z.array(fixtureSchema),
  featuredFixtureId: z.uuid().nullable(),
  fixtureAvailability: z.array(z.strictObject({ fixtureId: z.uuid(), playerId: z.uuid(), status: z.enum(['available', 'unavailable']) })),
}).superRefine((content, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  const playerIds = new Set(content.players.map((p) => p.id));
  const fixtureIds = new Set(content.fixtures.map((f) => f.id));
  if (playerIds.size !== content.players.length) fail('Duplicate player identity');
  if (fixtureIds.size !== content.fixtures.length) fail('Duplicate fixture identity');
  const providerIds = content.fixtures.flatMap((f) => f.source.kind === 'football-data.org' ? [f.source.providerId] : []);
  if (new Set(providerIds).size !== providerIds.length) fail('Duplicate provider mapping');
  if (content.featuredFixtureId && !fixtureIds.has(content.featuredFixtureId)) fail('Featured fixture reference does not resolve');
  const availabilityKeys = new Set<string>();
  for (const entry of content.fixtureAvailability) {
    if (!fixtureIds.has(entry.fixtureId) || !playerIds.has(entry.playerId)) fail('Availability reference does not resolve');
    const key = `${entry.fixtureId}/${entry.playerId}`;
    if (availabilityKeys.has(key)) fail('Duplicate fixture availability');
    availabilityKeys.add(key);
  }
});
export type SharedContent = z.infer<typeof contentSchema>;
export type Fixture = z.infer<typeof fixtureSchema>;
export type EffectiveFixture = z.infer<typeof fixtureValuesSchema> & { id: string };

export function playerAvailability(content: SharedContent, playerId: string, fixtureId: string): 'available' | 'unavailable' {
  const override = content.fixtureAvailability.find((entry) => entry.playerId === playerId && entry.fixtureId === fixtureId);
  return override?.status ?? (content.players.find((player) => player.id === playerId)?.unavailableUntilCleared ? 'unavailable' : 'available');
}

export function effectiveFixture(fixture: Fixture): EffectiveFixture {
  // Merge per field, so an explicit null/unknown correction stays authoritative.
  return { ...fixtureValuesSchema.parse({ ...fixture.values, ...fixture.overrides }), id: fixture.id };
}
