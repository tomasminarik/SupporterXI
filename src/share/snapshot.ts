import { formations } from '../domain/catalogues';
import { isCompleteLineup, type Draft } from '../domain/draft';
import { shortNames } from '../components/pitch-geometry';

// The share image (PRD 6, MVP-08). Sizes are exact output pixels.
export const shareFormats = {
  square: { width: 1080, height: 1080, label: 'Square', shape: '1:1' },
  portrait: { width: 1080, height: 1920, label: 'Portrait', shape: '9:16' },
  landscape: { width: 1920, height: 1080, label: 'Landscape', shape: '16:9' },
} as const;
export type ShareFormat = keyof typeof shareFormats;
/** Printed on every image at the user's direction (9 October 2026). */
export const shareAddress = 'supporterxi.com';

export type SharePlayer = Readonly<{ slot: string; x: number; y: number; number: number | null; name: string; fullName: string }>;
/** Everything the image shows, copied out of the working XI. Roles are deliberately absent. */
export type ShareSnapshot = Readonly<{ fixtureId: string; opponent: string; formation: string; players: readonly SharePlayer[] }>;

type Source = Pick<Draft, 'fixture' | 'players' | 'lineup'>;

/** How many players are still needed before the XI can be shared. */
export function missingPlayers(source: Pick<Draft, 'lineup'>): number {
  return 11 - Object.values(source.lineup.slots).filter(Boolean).length;
}

/** An immutable copy of a complete XI, or null when the XI cannot be exported. Later edits to the
    working XI never reach a snapshot. M-02: a selected player who became unavailable is included. */
export function takeSnapshot(source: Source): ShareSnapshot | null {
  const formation = formations.find((item) => item.id === source.lineup.formationId);
  if (!formation || !isCompleteLineup(source.lineup, source.players.map((player) => player.id))) return null;
  const names = shortNames(source.players);
  const players = formation.slots.map(([slot, , x, y]) => {
    const player = source.players.find((item) => item.id === source.lineup.slots[slot]!.playerId)!;
    return Object.freeze({ slot, x, y, number: player.shirtNumber, name: names.get(player.id) ?? player.name, fullName: player.name });
  });
  // The match is named by its headline only; competition, venue and kickoff are left off the image.
  return Object.freeze({
    fixtureId: source.fixture.id,
    opponent: source.fixture.opponent,
    formation: formation.name,
    players: Object.freeze(players),
  });
}

/** A file name such as supporter-xi-v-tottenham-hotspur-fc-portrait.png. */
export function shareFileName(snapshot: ShareSnapshot, format: ShareFormat): string {
  const opponent = snapshot.opponent.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `supporter-xi-v-${opponent || 'opponent'}-${format}.png`;
}

/** What the image shows, in words, for people who cannot see the preview. */
export function describeSnapshot(snapshot: ShareSnapshot): string {
  return `Manchester United v ${snapshot.opponent}, ${snapshot.formation}: ${snapshot.players.map((player) => player.fullName).join(', ')}.`;
}
