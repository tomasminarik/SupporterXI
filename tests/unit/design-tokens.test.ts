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
