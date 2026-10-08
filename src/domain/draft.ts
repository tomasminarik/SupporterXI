import { z } from 'zod';
import { formations, isRoleCompatible } from './catalogues';
import { fixtureValuesSchema } from './content';
import { publicPlayerSchema } from './featured-fixture';
import { type Lineup } from './lineup';

export const draftKey = 'starting-xi:working:v1';
export const previewDraftKey = 'starting-xi:preview-working:v1';
export const catalogueVersion = 'formations-1_roles-1.2';
const assignmentSchema = z.strictObject({ playerId: z.uuid(), roleId: z.string().nullable() });
export const lineupSchema = z.strictObject({
  formationId: z.string().nullable(),
  slots: z.record(z.string(), assignmentSchema.nullable()),
}).superRefine((state, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  const formation = formations.find((item) => item.id === state.formationId);
  if (!formation) {
    if (state.formationId !== null || Object.keys(state.slots).length) fail('Unknown formation or slots without formation');
    return;
  }
  const expected = formation.slots.map((slot) => slot[0]);
  if (Object.keys(state.slots).length !== 11 || expected.some((id) => !Object.hasOwn(state.slots, id))) fail('Invalid slot set');
  const selected = new Set<string>();
  for (const slot of formation.slots) {
    const entry = state.slots[slot[0]];
    if (!entry) continue;
    if (selected.has(entry.playerId)) fail('Duplicate player');
    selected.add(entry.playerId);
    if (!isRoleCompatible(entry.roleId, slot[4])) fail('Unknown or incompatible role');
  }
});

export const draftSchema = z.strictObject({
  schemaVersion: z.literal(1),
  catalogueVersion: z.literal(catalogueVersion),
  contentRevision: z.string().regex(/^[a-f0-9]{64}$/),
  fixture: fixtureValuesSchema.extend({ id: z.uuid() }),
  players: z.array(publicPlayerSchema),
  lineup: lineupSchema,
}).superRefine((draft, ctx) => {
  const known = new Set(draft.players.map((player) => player.id));
  if (known.size !== draft.players.length || Object.values(draft.lineup.slots).some((slot) => slot && !known.has(slot.playerId))) ctx.addIssue({ code: 'custom', message: 'Unknown or duplicated player identity' });
});
export type Draft = z.infer<typeof draftSchema>;
export type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type DraftRead = { kind: 'empty' } | { kind: 'valid'; draft: Draft } | { kind: 'invalid' } | { kind: 'unavailable' };

export function readDraft(getStorage: () => StoragePort, key = draftKey): DraftRead {
  let text: string | null;
  try { text = getStorage().getItem(key); } catch { return { kind: 'unavailable' }; }
  if (text === null) return { kind: 'empty' };
  try {
    if (text.length > 100_000) return { kind: 'invalid' };
    const result = draftSchema.safeParse(JSON.parse(text));
    return result.success ? { kind: 'valid', draft: result.data } : { kind: 'invalid' };
  } catch { return { kind: 'invalid' }; }
}
export function writeDraft(getStorage: () => StoragePort, draft: Draft, key = draftKey): boolean {
  try { getStorage().setItem(key, JSON.stringify(draftSchema.parse(draft))); return true; } catch { return false; }
}
export function discardDraft(getStorage: () => StoragePort, key = draftKey): boolean {
  try { getStorage().removeItem(key); return true; } catch { return false; }
}
export function validForCurrentSquad(lineup: Lineup, playerIds: readonly string[]): boolean {
  return lineupSchema.safeParse(lineup).success && Object.values(lineup.slots).every((slot) => !slot || playerIds.includes(slot.playerId));
}
// M-02: completeness is structural, not re-checked against changed availability.
export function isCompleteLineup(lineup: Lineup, playerIds: readonly string[]): boolean {
  return validForCurrentSquad(lineup, playerIds) && Object.values(lineup.slots).filter(Boolean).length === 11;
}
