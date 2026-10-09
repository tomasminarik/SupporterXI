import { catalogueVersion, type Draft, type DraftRead, validForCurrentSquad } from './draft';
import { type FeaturedResponse } from './featured-fixture';
import { startingLineup, type Lineup } from './lineup';

export type BuilderSession = {
  draft: Draft | null;
  recovery: 'invalid' | 'different-fixture' | null;
  previousOpponent: string | null;
  memory: 'available' | 'unavailable';
  restored: boolean;
};
export function freshDraft(context: FeaturedResponse, lineup: Lineup = startingLineup): Draft | null {
  if (!context.fixture) return null;
  return { schemaVersion: 1, catalogueVersion, contentRevision: context.contentRevision, fixture: context.fixture, players: context.players, lineup };
}
export function initializeSession(context: FeaturedResponse, stored: DraftRead): BuilderSession {
  const base: BuilderSession = { draft: null, recovery: null, previousOpponent: null, memory: 'available', restored: false };
  if (stored.kind === 'invalid') return { ...base, recovery: 'invalid' };
  if (stored.kind === 'valid') {
    if (stored.draft.fixture.id !== context.fixture?.id) return { ...base, recovery: 'different-fixture', previousOpponent: stored.draft.fixture.opponent };
    if (!validForCurrentSquad(stored.draft.lineup, context.players.map((p) => p.id))) return { ...base, recovery: 'invalid' };
    return { ...base, draft: freshDraft(context, stored.draft.lineup), restored: true };
  }
  return { ...base, draft: freshDraft(context), memory: stored.kind === 'unavailable' ? 'unavailable' : 'available' };
}
export type SessionAction =
  | { type: 'published'; context: FeaturedResponse }
  | { type: 'edit'; lineup: Lineup }
  | { type: 'start'; context: FeaturedResponse }
  | { type: 'memory'; ok: boolean };
export function sessionReducer(state: BuilderSession, action: SessionAction): BuilderSession {
  switch (action.type) {
    case 'published': {
      if (state.recovery) return state;
      if (!state.draft) return { ...state, draft: freshDraft(action.context) };
      if (state.draft.fixture.id !== action.context.fixture?.id) return state;
      // M-02: preserve all selections. Missing/deactivated IDs remain visible;
      // the latest public eligibility controls only new selections.
      const players = [...action.context.players];
      for (const player of state.draft.players) {
        if (!players.some((p) => p.id === player.id) && Object.values(state.draft.lineup.slots).some((slot) => slot?.playerId === player.id)) players.push({ ...player, selectable: false });
      }
      return { ...state, draft: { ...state.draft, fixture: action.context.fixture, players, contentRevision: action.context.contentRevision } };
    }
    case 'edit': return state.draft ? { ...state, draft: { ...state.draft, lineup: action.lineup } } : state;
    case 'start': return { ...state, draft: freshDraft(action.context), recovery: null, previousOpponent: null, restored: false };
    case 'memory': {
      const memory = action.ok ? 'available' : 'unavailable';
      return state.memory === memory ? state : { ...state, memory };
    }
  }
}
