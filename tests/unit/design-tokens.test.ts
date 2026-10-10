import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrast, cssTokens, groups, tokenValue } from '../../src/design/tokens';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const squash = (value: string) => value.replace(/\s+/g, ' ').trim();

describe('design tokens have one set of values', () => {
  const css = read('src/design/tokens.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const declared = [...css.matchAll(/(--sx-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, squash(value)] as const);

  it('declares every token once', () => {
    const names = declared.map(([name]) => name);
    expect(new Set(names).size).toBe(names.length);
    expect(Object.keys(cssTokens).length).toBe(groups.flatMap((group) => group.tokens).length);
  });
  it('tokens.css and tokens.ts agree', () => {
    expect(Object.fromEntries(declared)).toEqual(Object.fromEntries(Object.entries(cssTokens).map(([name, value]) => [name, squash(value)])));
  });
  it('keeps the club colour in the club block only', () => {
    const [clubBlock, ...rest] = css.split('}');
    for (const token of groups.filter((group) => group.layer === 'club').flatMap((group) => group.tokens)) {
      expect(clubBlock).toContain(`--sx-${token.name}:`);
      expect(rest.join('}')).not.toContain(`--sx-${token.name}:`);
    }
  });
  it('rejects an unknown token name', () => {
    expect(() => tokenValue('no-such-token')).toThrow();
  });
});

describe('token colours keep text readable (MVP-13 contrast)', () => {
  const aa = 4.5;
  it('text on the club colour passes AA in every shade, so a new club colour cannot silently fail', () => {
    for (const shade of ['club', 'club-hover', 'club-pressed', 'club-unavailable']) expect(contrast(tokenValue('on-club'), tokenValue(shade)), shade).toBeGreaterThanOrEqual(aa);
    expect(contrast('#ffffff', '#e0372f')).toBeLessThan(aa); // the red that was replaced
  });
  it('text levels pass AA on the page and on a surface', () => {
    for (const level of ['text', 'text-soft', 'text-quiet', 'white']) for (const ground of ['page', 'surface', 'surface-active']) expect(contrast(tokenValue(level), tokenValue(ground)), `${level} on ${ground}`).toBeGreaterThanOrEqual(aa);
  });
  it('the action colour and the selected state pass AA', () => {
    expect(contrast(tokenValue('on-action'), tokenValue('action'))).toBeGreaterThanOrEqual(aa);
    expect(contrast(tokenValue('on-action'), tokenValue('action-hover'))).toBeGreaterThanOrEqual(aa);
    expect(contrast(tokenValue('on-action'), tokenValue('white'))).toBeGreaterThanOrEqual(aa);
    expect(contrast(tokenValue('club-pressed'), tokenValue('white'))).toBeGreaterThanOrEqual(aa);
  });
  it('the club colour is used on the page only as large type or as a shape', () => {
    expect(contrast(tokenValue('club'), tokenValue('page'))).toBeGreaterThanOrEqual(3);
    expect(contrast(tokenValue('club'), tokenValue('surface'))).toBeGreaterThanOrEqual(3);
  });
});

describe('/gameplan stays out of search engines (user decision, 10 October 2026)', () => {
  it('asks not to be indexed whatever the rest of the site does', () => {
    const page = read('src/app/gameplan/page.tsx');
    expect(page).toContain('robots: { index: false, follow: false }');
    expect(page).not.toContain('isIndexable');
  });
});

describe('the public stylesheets take their values from the tokens', () => {
  // The pitch is one illustration with its own paint (grass, soil, lines, goal frames); it is outside the system.
  const pitch = ['.sx-plane', '.sx-lines', '.sx-furniture', '.sx-flat-circle'];
  const sheets = ['src/app/globals.css', 'src/components/lineup-editor.css', 'src/share/share.css', 'src/app/gameplan/gameplan.css', 'src/app/not-found.css'];
  const rules = sheets.flatMap((path) => read(path).replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((line) => !line.startsWith('@font-face')).map((line) => ({ path, line: line.trim() })));

  it('names no colour by hand outside the pitch', () => {
    const offenders = rules.filter(({ line }) => /#[0-9a-f]{3,8}\b/i.test(line) && !pitch.some((selector) => line.startsWith(selector)));
    expect(offenders).toEqual([]);
  });
  it('uses only the three speeds and the one curve', () => {
    // Delays, the loading pulse and the spinner are not transitions between states and keep their own timing.
    const timed = rules.flatMap(({ path, line }) => [...line.matchAll(/(?:animation|transition): ([^;]+);/g)].map(([, value]) => ({ path, value })));
    const offenders = timed.filter(({ value }) => !/sx-pulse|sx-spin|nf-/.test(value) && !/var\(--sx-duration-|var\(--gp-speed\)|none/.test(value));
    expect(offenders).toEqual([]);
    expect(rules.filter(({ line }) => line.includes('cubic-bezier'))).toEqual([]);
  });
  it('has no private names for token values', () => {
    expect(rules.filter(({ line }) => /var\(--(bg|surface|edge|edge-strong|text|soft|quiet|red|red-hover|red-deep|yellow|on-yellow|display|body|paper|ink)\)/.test(line))).toEqual([]);
  });
});
