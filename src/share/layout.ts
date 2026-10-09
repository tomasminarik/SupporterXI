import { portraitSpot } from '../components/pitch-geometry';
import { shareFormats, type ShareFormat, type SharePlayer } from './snapshot';

// Pure layout for the share image: no canvas here, so it can be checked in unit tests.
export type Measure = (text: string, size: number) => number;
export type Box = { x: number; y: number; w: number; h: number };

export const marker = { disc: 34, gap: 4, tag: 42, pad: 16, sizes: [34, 32, 30, 28, 26, 24, 22], floor: 18 } as const;
const edge = 12;
const between = 12;

/** Where things sit for each format. The story keeps clear of the top and bottom strips that
    story viewers cover with their own controls. */
export function frame(format: ShareFormat) {
  const { width, height } = shareFormats[format];
  const story = format === 'story';
  const side = 48;
  const top = story ? 210 : 50;
  const bottom = height - (story ? 210 : 44);
  return { width, height, side, top, footer: { y: bottom - 56, h: 56 }, pitchBottom: bottom - 56 - (story ? 36 : 28), headline: { max: story ? 116 : 104, min: 76 }, inner: width - side * 2 };
}

/** Breaks the opponent over as few lines as possible at one type size shared with the club's line. */
export function fitHeadline(opponent: string, width: number, sizes: { max: number; min: number }, measure: Measure): { size: number; lines: string[] } {
  const club = 'MANCHESTER UNITED';
  const words = opponent.toLocaleUpperCase('en').trim().split(/\s+/);
  const wrap = (size: number) => {
    const lines: string[] = [];
    let line = 'V';
    for (const word of words) {
      const next = `${line} ${word}`;
      if (measure(next, size) <= width || line === 'V') line = next;
      else { lines.push(line); line = word; }
    }
    return [...lines, line];
  };
  const fits = (size: number, lines: string[]) => measure(club, size) <= width && lines.every((line) => measure(line, size) <= width);
  for (let size = sizes.max; size >= sizes.min; size -= 4) {
    const lines = wrap(size);
    if (lines.length === 1 && fits(size, lines)) return { size, lines };
  }
  // Too long for one line at the smallest size: wrap, and shrink only if a single word still overflows.
  for (let size = sizes.min; size > 36; size -= 4) {
    const lines = wrap(size);
    if (fits(size, lines)) return { size, lines };
  }
  return { size: 36, lines: wrap(36) };
}

export type PlacedPlayer = SharePlayer & { cx: number; cy: number; label: string; size: number; tagWidth: number };

/** Disc centres on the pitch, then one name size for the whole team: the largest at which no name
    touches a neighbour or the edge. Only if the smallest size still fails is a single name reduced
    further, and as a last resort shortened with an ellipsis. */
export function placePlayers(players: readonly SharePlayer[], pitch: Box, canvasWidth: number, measure: Measure): PlacedPlayer[] {
  const spots = players.map((player) => {
    const spot = portraitSpot(player.x, player.y);
    return { player, cx: Math.round(pitch.x + (spot.left / 100) * pitch.w), cy: Math.round(pitch.y + (spot.top / 100) * pitch.h), label: player.name.toLocaleUpperCase('en') };
  });
  const tagTop = (cy: number) => cy + marker.disc + marker.gap;
  const room = spots.map((a) => {
    let width = 2 * (Math.min(a.cx, canvasWidth - a.cx) - edge);
    for (const b of spots) {
      if (a === b) continue;
      const dx = Math.abs(a.cx - b.cx);
      // Another name on the same line shares the gap; a disc beside this name takes its own width out of it.
      // A player directly above or below is left alone: a narrower name would not move it out of the way.
      if (dx < marker.disc * 2) continue;
      if (Math.abs(a.cy - b.cy) < marker.tag + between) width = Math.min(width, dx - between);
      if (tagTop(a.cy) < b.cy + marker.disc && tagTop(a.cy) + marker.tag > b.cy - marker.disc) width = Math.min(width, 2 * (dx - marker.disc - between));
    }
    return width;
  });
  const widthAt = (label: string, size: number) => Math.ceil(measure(label, size)) + marker.pad * 2;
  const shared = marker.sizes.find((size) => spots.every((spot, index) => widthAt(spot.label, size) <= room[index])) ?? marker.sizes[marker.sizes.length - 1];
  return spots.map((spot, index) => {
    let size: number = shared;
    let label = spot.label;
    while (size > marker.floor && widthAt(label, size) > room[index]) size -= 1;
    while (label.length > 2 && widthAt(label, size) > room[index]) label = `${label.replace(/…$/, '').slice(0, -1).trimEnd()}…`;
    return { ...spot.player, cx: spot.cx, cy: spot.cy, label, size, tagWidth: widthAt(label, size) };
  });
}

/** The rectangles a placed player covers: the number disc and the name beneath it. */
export function markerBoxes(player: PlacedPlayer): Box[] {
  return [
    { x: player.cx - marker.disc, y: player.cy - marker.disc, w: marker.disc * 2, h: marker.disc * 2 },
    { x: player.cx - player.tagWidth / 2, y: player.cy + marker.disc + marker.gap, w: player.tagWidth, h: marker.tag },
  ];
}
