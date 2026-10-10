import { effectiveFixture, type EffectiveFixture, type SharedContent } from './content';
import { rolloverMs, selectFeaturedFixture } from './featured-fixture';

/** How the backoffice describes one player's availability: out until cleared, or out for the listed matches. */
export type PlayerPlan = { untilCleared: boolean; out: string[] };
export type PlanMode = 'available' | 'next' | 'matches' | 'long';

/** The featured match first, then every other scheduled match that has not finished, soonest first.
    Matches without a confirmed kickoff come last. */
export function upcomingFixtures(content: SharedContent, nowMs: number): EffectiveFixture[] {
  const next = selectFeaturedFixture(content, nowMs).fixture;
  const kickoff = (fixture: EffectiveFixture) => fixture.kickoff.kind === 'confirmed' ? Date.parse(fixture.kickoff.at) : Infinity;
  const rest = content.fixtures.map(effectiveFixture)
    .filter((fixture) => fixture.id !== next?.id && fixture.status === 'scheduled' && nowMs < kickoff(fixture) + rolloverMs)
    .sort((a, b) => kickoff(a) - kickoff(b) || (a.id < b.id ? -1 : 1));
  return next ? [next, ...rest] : rest;
}

/** The saved plan for a player, limited to the matches still to come. */
export function savedPlan(content: SharedContent, playerId: string, upcoming: readonly EffectiveFixture[]): PlayerPlan {
  const ids = new Set(upcoming.map((fixture) => fixture.id));
  return {
    untilCleared: content.players.find((player) => player.id === playerId)?.unavailableUntilCleared ?? false,
    out: content.fixtureAvailability.filter((entry) => entry.playerId === playerId && entry.status === 'unavailable' && ids.has(entry.fixtureId)).map((entry) => entry.fixtureId),
  };
}

export function planMode(plan: PlayerPlan, nextId: string | undefined): PlanMode {
  if (plan.untilCleared) return 'long';
  if (!plan.out.length) return 'available';
  return plan.out.length === 1 && plan.out[0] === nextId ? 'next' : 'matches';
}

export function samePlan(a: PlayerPlan, b: PlayerPlan): boolean {
  return a.untilCleared === b.untilCleared && a.out.length === b.out.length && a.out.every((id) => b.out.includes(id));
}
