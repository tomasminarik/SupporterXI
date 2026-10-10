// The design system's values, mirrored from tokens.css for code that cannot read CSS variables (the
// share image is drawn on a canvas) and for the reference page at /gameplan.
// tests/unit/design-tokens.test.ts fails if this file and tokens.css disagree.
export type Token = { name: string; value: string; use: string };
export type TokenGroup = { title: string; layer: 'club' | 'product'; kind: 'colour' | 'font' | 'text' | 'space' | 'size' | 'motion' | 'shadow' | 'focus'; tokens: Token[] };

const t = (name: string, value: string, use: string): Token => ({ name, value, use });

export const groups: TokenGroup[] = [
  { title: 'Club colour', layer: 'club', kind: 'colour', tokens: [
    t('club', '#da362e', 'The one red: club name, markers, pills, squad numbers, primary buttons'),
    t('club-hover', '#c22e27', 'A club-coloured control under the pointer'),
    t('club-pressed', '#b3261e', 'Pressed controls; numbers on white'),
    t('club-unavailable', '#7a2b26', 'A picked player who has become unavailable'),
    t('club-mark', '#c42a23', 'The XI inside the logo disc'),
    t('on-club', '#ffffff', 'Text and rings on the club colour'),
  ] },
  { title: 'Surfaces', layer: 'product', kind: 'colour', tokens: [
    t('page', '#0c0e0d', 'The page'),
    t('surface', '#171a18', 'Cards, panels, sheets, dialogs, notices'),
    t('surface-hover', '#1e2220', 'A row under the pointer'),
    t('surface-active', '#222623', 'A chosen row; a previewed choice'),
    t('edge', '#2b2f2c', 'Quiet borders and dividers'),
    t('edge-strong', '#3a3e3a', 'Borders of panels that float above the page'),
    t('edge-control', '#4a4e4a', 'Border of a secondary button'),
  ] },
  { title: 'Text', layer: 'product', kind: 'colour', tokens: [
    t('text', '#f3f1ea', 'Body text'),
    t('text-soft', '#b9bcb2', 'Supporting text'),
    t('text-quiet', '#9a9d94', 'Labels, counts, footnotes'),
    t('text-disabled', '#6b6e68', 'Controls that cannot be used'),
    t('text-versus', '#8a8d86', 'The "v" in the fixture headline'),
    t('white', '#ffffff', 'Opponent name, focus ring, the selected state'),
  ] },
  { title: 'Action', layer: 'product', kind: 'colour', tokens: [
    t('action', '#f5c518', 'Sharing, and nothing else'),
    t('action-hover', '#ffd43b', 'The share button under the pointer'),
    t('on-action', '#14160f', 'Text on the action colour and on a white selected control'),
  ] },
  { title: 'Typefaces', layer: 'product', kind: 'font', tokens: [
    t('font-display', "'Big Shoulders Display', 'Arial Narrow', sans-serif", 'Weight 800, always uppercase: headline, headings, numbers'),
    t('font-body', "Barlow, 'Helvetica Neue', sans-serif", 'Weights 400, 500 and 600: everything else'),
  ] },
  { title: 'Display sizes', layer: 'product', kind: 'text', tokens: [
    t('text-display-xl', 'min(132px, max(9.2vw, min(56px, 13vw)))', 'The fixture headline; follows the window width'),
    t('text-display-l', '40px', 'Squad numbers'),
    t('text-display-m', '30px', 'Section and dialog headings'),
    t('text-display-s', '22px', 'Logo, panel headings, choices'),
  ] },
  { title: 'Body sizes', layer: 'product', kind: 'text', tokens: [
    t('text-body-l', '17px', 'Fixture details, the main action'),
    t('text-body-m', '15px', 'Default text and buttons'),
    t('text-body-s', '14px', 'Pills, panels, notes'),
    t('text-caption', '13px', 'Footnotes, definitions'),
    t('text-label', '12px', 'Uppercase labels above a group'),
  ] },
  { title: 'Spacing', layer: 'product', kind: 'space', tokens: [
    t('space-1', '4px', 'Between a label and its value'),
    t('space-2', '8px', 'Between related items'),
    t('space-3', '12px', 'Inside compact controls'),
    t('space-4', '16px', 'Inside panels; page edge on phones'),
    t('space-6', '24px', 'Between groups'),
    t('space-8', '32px', 'Page edge on desktop'),
    t('space-12', '48px', 'Between sections'),
  ] },
  { title: 'Control heights', layer: 'product', kind: 'size', tokens: [
    t('control-s', '40px', 'Compact choices inside a panel'),
    t('control-m', '44px', 'Every button and field by default'),
    t('control-l', '52px', 'The main action in a dialog or sheet'),
  ] },
  { title: 'Motion', layer: 'product', kind: 'motion', tokens: [
    t('ease-crisp', 'cubic-bezier(.2, .8, .2, 1)', 'The one curve: quick start, soft landing'),
    t('duration-quick', '.12s', 'Hover and colour changes'),
    t('duration-standard', '.22s', 'Things arriving, leaving or moving'),
    t('duration-entrance', '.36s', 'The fixture settling in when the page loads'),
  ] },
  { title: 'Shadows', layer: 'product', kind: 'shadow', tokens: [
    t('shadow-marker', '0 8px 14px rgba(0, 0, 0, .4)', 'Markers and pills on the grass'),
    t('shadow-panel', '0 18px 40px rgba(0, 0, 0, .6)', 'Menus, pickers and sheets'),
    t('shadow-dialog', '0 24px 60px rgba(0, 0, 0, .7)', 'A dialog over the page'),
  ] },
  { title: 'Focus', layer: 'product', kind: 'focus', tokens: [
    t('focus-ring', '3px solid #ffffff', 'Keyboard focus, on every control'),
    t('focus-offset', '3px', 'The gap between a control and its focus ring'),
  ] },
];

const ms = (name: string) => Math.round(parseFloat(groups.flatMap((group) => group.tokens).find((token) => token.name === name)!.value) * 1000);
/** The three speeds in milliseconds, for animations scripted in code. */
export const durations = { quick: ms('duration-quick'), standard: ms('duration-standard'), entrance: ms('duration-entrance') } as const;

/** Media queries cannot read CSS variables, so the two widths live here and in the stylesheets as numbers. */
export const breakpoints = { phone: 700, flatPitch: 900 } as const;

const all = new Map(groups.flatMap((group) => group.tokens).map((token) => [token.name, token.value]));

/** Every token as its CSS custom property, as tokens.css must declare it. */
export const cssTokens: Record<string, string> = Object.fromEntries([...all].map(([name, value]) => [`--sx-${name}`, value]));

/** A token's value by name; an unknown name is a programming error, never a silent fallback. */
export function tokenValue(name: string): string {
  const value = all.get(name);
  if (value === undefined) throw new Error(`Unknown design token: ${name}`);
  return value;
}

type Rgb = [number, number, number];
function rgb(hex: string): Rgb {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`Not a six-digit colour: ${hex}`);
  const n = parseInt(match[1], 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((channel) => { const c = channel / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** WCAG contrast ratio between two six-digit colours. */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
