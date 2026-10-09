import { formations } from '../domain/catalogues';
import { isCompleteLineup, type Draft } from '../domain/draft';
import { formatKickoff } from '../domain/featured-fixture';
import { shortNames } from '../components/pitch-geometry';

// The share image (PRD 6, MVP-08). Sizes are exact output pixels.
export const shareFormats = {
  feed: { width: 1080, height: 1350, label: 'Feed', shape: '4:5' },
  story: { width: 1080, height: 1920, label: 'Story', shape: '9:16' },
} as const;
export type ShareFormat = keyof typeof shareFormats;

export type SharePlayer = Readonly<{ slot: string; x: number; y: number; number: number | null; name: string; fullName: string }>;
/** Everything the image shows, copied out of the working XI. Roles are deliberately absent. */
export type ShareSnapshot = Readonly<{ fixtureId: string; opponent: string; context: readonly string[]; kickoff: string; formation: string; players: readonly SharePlayer[] }>;

type Source = Pick<Draft, 'fixture' | 'players' | 'lineup'>;

/** How many players are still needed before the XI can be shared. */
export function missingPlayers(source: Pick<Draft, 'lineup'>): number {
  return 11 - Object.values(source.lineup.slots).filter(Boolean).length;
}

/** An immutable copy of a complete XI, or null when the XI cannot be exported. Later edits to the
    working XI never reach a snapshot. M-02: a selected player who became unavailable is included. */
export function takeSnapshot(source: Source, locale = 'en-GB', timeZone?: string): ShareSnapshot | null {
  const formation = formations.find((item) => item.id === source.lineup.formationId);
  if (!formation || !isCompleteLineup(source.lineup, source.players.map((player) => player.id))) return null;
  const names = shortNames(source.players);
  const players = formation.slots.map(([slot, , x, y]) => {
    const player = source.players.find((item) => item.id === source.lineup.slots[slot]!.playerId)!;
    return Object.freeze({ slot, x, y, number: player.shirtNumber, name: names.get(player.id) ?? player.name, fullName: player.name });
  });
  const { fixture } = source;
  return Object.freeze({
    fixtureId: fixture.id,
    opponent: fixture.opponent,
    context: Object.freeze([fixture.competition, fixture.round, fixture.venue === 'home' ? 'Home' : 'Away'].filter((part): part is string => Boolean(part))),
    kickoff: fixture.kickoff.kind === 'confirmed' ? formatKickoff(fixture.kickoff.at, locale, timeZone) : 'Time to be confirmed',
    formation: formation.name,
    players: Object.freeze(players),
  });
}

/** A file name such as supporter-xi-v-tottenham-hotspur-fc-story.png. */
export function shareFileName(snapshot: ShareSnapshot, format: ShareFormat): string {
  const opponent = snapshot.opponent.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `supporter-xi-v-${opponent || 'opponent'}-${format}.png`;
}

/** What the image shows, in words, for people who cannot see the preview. */
export function describeSnapshot(snapshot: ShareSnapshot): string {
  return `Manchester United v ${snapshot.opponent}, ${snapshot.formation}: ${snapshot.players.map((player) => player.fullName).join(', ')}.`;
}
