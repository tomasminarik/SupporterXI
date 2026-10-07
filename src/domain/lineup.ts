import { formations, isRoleCompatible, type Formation } from './catalogues';

export type Assignment = Readonly<{ playerId: string; roleId: string | null }>;
export type Lineup = Readonly<{ formationId: string | null; slots: Readonly<Record<string, Assignment | null>> }>;
export const emptyLineup: Lineup = { formationId: null, slots: {} };
export const formationFor = (state: Lineup) => formations.find((f) => f.id === state.formationId);

export function changeFormation(state: Lineup, target: Formation) {
  const source = formationFor(state);
  let clearedRoles = 0;
  const slots: Record<string, Assignment | null> = {};
  for (const destination of target.slots) {
    const matches = source?.slots.filter((slot) => slot[5] === destination[5]) ?? [];
    const previous = matches.length === 1 ? state.slots[matches[0][0]] : null;
    if (previous) {
      const compatible = isRoleCompatible(previous.roleId, destination[4]);
      if (!compatible && previous.roleId) clearedRoles++;
      slots[destination[0]] = { ...previous, roleId: compatible ? previous.roleId : null };
    } else slots[destination[0]] = null;
  }
  const retained = new Set(Object.values(slots).flatMap((slot) => slot ? [slot.playerId] : []));
  const releasedPlayers = Object.values(state.slots).filter((slot) => slot && !retained.has(slot.playerId)).length;
  return { state: { formationId: target.id, slots } as Lineup, releasedPlayers, clearedRoles };
}

// The caller supplies selectable identities. The workbench uses seed IDs only;
// a future live builder must supply fixture eligibility after content integration.
export function placePlayer(state: Lineup, slotId: string, playerId: string, selectableIds: readonly string[]): Lineup {
  if (!(slotId in state.slots) || !selectableIds.includes(playerId) || Object.values(state.slots).some((slot) => slot?.playerId === playerId)) return state;
  return { ...state, slots: { ...state.slots, [slotId]: { playerId, roleId: state.slots[slotId]?.roleId ?? null } } };
}
export function removePlayer(state: Lineup, slotId: string): Lineup {
  if (!(slotId in state.slots)) return state;
  return { ...state, slots: { ...state.slots, [slotId]: null } };
}
export function clearLineup(state: Lineup): Lineup {
  return { ...state, slots: Object.fromEntries(Object.keys(state.slots).map((id) => [id, null])) };
}
export function movePlayer(state: Lineup, from: string, to: string): Lineup {
  const source = state.slots[from];
  if (!source || !(to in state.slots) || from === to) return state;
  const destination = state.slots[to];
  return { ...state, slots: { ...state.slots,
    [from]: destination ? { playerId: destination.playerId, roleId: source.roleId } : null,
    [to]: { playerId: source.playerId, roleId: destination?.roleId ?? null },
  } };
}
export function assignRole(state: Lineup, slotId: string, roleId: string | null): Lineup {
  const slot = formationFor(state)?.slots.find((s) => s[0] === slotId);
  const assignment = state.slots[slotId];
  if (!slot || !assignment || !isRoleCompatible(roleId, slot[4])) return state;
  return { ...state, slots: { ...state.slots, [slotId]: { ...assignment, roleId } } };
}
