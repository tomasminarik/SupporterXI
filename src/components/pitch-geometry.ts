import type { RoleFamily } from '../domain/catalogues';

// Presentation geometry for the desktop perspective pitch. Values come from the
// agreed mockup (docs/design/ui-redesign-handoff.md, "Pitch geometry").
export const plane = { width: 1160, height: 760, insetX: 30, insetY: 34, tilt: 52, perspective: 1500 } as const;
const field = { width: plane.width - plane.insetX * 2, height: plane.height - plane.insetY * 2 };
const radians = (plane.tilt * Math.PI) / 180;

/** Catalogue coordinates (x across 0–100 from the left touchline, y forward 0–100) as percentages of the field. */
export function fieldPercent(x: number, y: number) {
  return { left: 3 + y * 0.94, top: 4 + x * 0.92 };
}

/** Projects a catalogue coordinate onto the flat overlay that sits over the tilted plane. */
export function projectSlot(x: number, y: number) {
  const { left, top } = fieldPercent(x, y);
  const px = plane.insetX + (left / 100) * field.width;
  const py = plane.insetY + (top / 100) * field.height;
  const depth = plane.height - py;
  const scale = plane.perspective / (plane.perspective + depth * Math.sin(radians));
  return {
    x: Math.round((plane.width / 2 + (px - plane.width / 2) * scale) * 10) / 10,
    y: Math.round((plane.height - depth * Math.cos(radians) * scale) * 10) / 10,
  };
}

// The user's sketch labels central pairs by line only (CB, CB rather than LCB, RCB).
const pairedCentral = new Set(['CB', 'DM', 'CM', 'AM', 'ST']);
export function markerLabel(abbreviation: string): string {
  const rest = abbreviation.slice(1);
  return /^[LR]/.test(abbreviation) && pairedCentral.has(rest) ? rest : abbreviation;
}

// No short-name field exists yet. Use the final word, keeping lower-case
// particles ("de Ligt"); single-word names such as "Amad" stay whole.
const particles = new Set(['de', 'da', 'di', 'do', 'dos', 'das', 'van', 'von', 'der', 'den', 'le', 'la', 'del', 'ten', 'ter']);
export function shortName(name: string): string {
  const words = name.trim().split(/\s+/);
  let start = words.length - 1;
  while (start > 1 && particles.has(words[start - 1])) start--;
  return words.slice(start).join(' ');
}

/** Short names for a squad; players sharing a surname get an initial ("J. Fletcher"). */
export function shortNames(players: readonly { id: string; name: string }[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const player of players) counts.set(shortName(player.name), (counts.get(shortName(player.name)) ?? 0) + 1);
  return new Map(players.map((player) => {
    const short = shortName(player.name);
    const first = player.name.trim().split(/\s+/)[0];
    return [player.id, (counts.get(short) ?? 0) > 1 && first !== short ? `${first[0]}. ${short}` : short];
  }));
}

// Label placement: the disc stays on the player's spot. By default the pill
// extends right and the role tag sits underneath; when that would collide, the
// tag flips above and/or the pill extends left. Greedy, in slot order.
export type Placement = { side: 'right' | 'left'; tag: 'below' | 'above' };
export type LabelBox = { id: string; x: number; y: number; pill: number; tag: number } | { id: string; x: number; y: number; radius: number };
type Rect = { l: number; r: number; t: number; b: number };
const options: Placement[] = [{ side: 'right', tag: 'below' }, { side: 'right', tag: 'above' }, { side: 'left', tag: 'below' }, { side: 'left', tag: 'above' }];
function rectsFor(box: LabelBox, placement: Placement): Rect[] {
  if ('radius' in box) return [{ l: box.x - box.radius, r: box.x + box.radius, t: box.y - box.radius, b: box.y + box.radius }];
  const pill = placement.side === 'right' ? { l: box.x - 17, r: box.x - 17 + box.pill } : { l: box.x + 17 - box.pill, r: box.x + 17 };
  const rects = [{ ...pill, t: box.y - 16, b: box.y + 16 }];
  if (box.tag) {
    const tag = placement.side === 'right' ? { l: box.x - 9, r: box.x - 9 + box.tag } : { l: box.x + 9 - box.tag, r: box.x + 9 };
    rects.push({ ...tag, ...(placement.tag === 'below' ? { t: box.y + 18, b: box.y + 38 } : { t: box.y - 38, b: box.y - 18 }) });
  }
  return rects;
}
const gap = 3;
const overlap = (a: Rect, b: Rect) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l) + gap) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t) + gap);
export function placeLabels(boxes: readonly LabelBox[]): Map<string, Placement> {
  // Every spot is fixed: discs and empty markers are obstacles from the start.
  const fixed = boxes.map((box) => ({ id: box.id, rect: 'radius' in box ? rectsFor(box, options[0])[0] : { l: box.x - 17, r: box.x + 17, t: box.y - 16, b: box.y + 16 } }));
  const pills = boxes.filter((box) => !('radius' in box));
  const result = new Map<string, Placement>();
  const costOf = (box: LabelBox, option: Placement) => {
    const others = [...fixed, ...pills.flatMap((other) => other.id !== box.id && result.has(other.id) ? rectsFor(other, result.get(other.id)!).map((rect) => ({ id: other.id, rect })) : [])];
    return rectsFor(box, option).reduce((sum, rect) => sum + others.reduce((inner, other) => other.id === box.id ? inner : inner + overlap(rect, other.rect), 0), 0);
  };
  // A greedy pass in slot order, then two passes where each label reconsiders
  // with all of its neighbours placed. The default placement wins ties.
  for (let pass = 0; pass < 3; pass++) {
    for (const box of pills) {
      let best = options[0];
      let bestCost = Infinity;
      for (const option of options) {
        const cost = costOf(box, option);
        if (cost < bestCost) { best = option; bestCost = cost; }
      }
      result.set(box.id, best);
    }
  }
  return result;
}

const familyNouns: Record<RoleFamily, string> = {
  goalkeeper: 'goalkeeper', centre_back: 'centre-back', full_back: 'full-back', wing_back: 'wing-back',
  defensive_midfielder: 'defensive midfielder', central_midfielder: 'central midfielder', wide_midfielder: 'wide midfielder',
  attacking_midfielder: 'attacking midfielder', wide_forward: 'winger', striker: 'striker',
};
export const positionNoun = (family: RoleFamily) => familyNouns[family];
