# Supporter XI design system

**Agreed:** 10 October 2026 (user). **Live reference:** [supporterxi.com/gameplan](https://supporterxi.com/gameplan), drawn from the same values the site uses.

## Why

The redesign of 9–10 October 2026 is agreed and live, but its values were scattered: the same colours typed by hand in the stylesheets and the share-image renderer, 16 animation speeds, 13 text sizes, 9 shadows and 27 spacing values. The system names the values once so later work starts from shared parts.

## Decisions (user, 10 October 2026)

- **Two layers.** Future work is most likely more Supporter XI screens and/or the same product for other clubs. The *club layer* holds what would change for another club (the club colour and its shades, the text colour on it). The *product layer* holds everything else. Nothing outside the club layer names a red. No club switcher is built.
- **Code plus a live page.** The reference is published at `/gameplan` on the live site.
- **`/gameplan` is never indexed by search engines; the rest of the site is.** The page carries its own `noindex`. It is deliberately not in the robots file's disallow list: a crawler blocked there never reads the `noindex`. It is not linked from the builder (a default, not a user decision).
- **The admin stays separate.** `/gaffer` keeps Ant Design and its own copy of the colours. Accepted cost: a brand colour change is made in two places.

## What is in it

Colour roles, two typefaces and a size scale, a spacing scale and control heights, one motion curve with three speeds, three shadows, the focus ring, one grammar for interaction states, the logo rules, and the rules of use. `/gameplan` lists every value with its job.

## What is not, and why

- **The pitch** (turf, perspective, markings, label placement): one illustration, not a reusable part. Its own paint colours stay in its stylesheet and in `src/share/render.ts`.
- **A light theme, charts, tables, navigation, forms beyond search:** no screen uses them.
- **A separate package, Storybook, Tailwind or a component kit for the public site:** one small app; plain CSS variables and a few React components match the code as written.
- **Share-image layouts:** compositions; only their colours and type come from the system.

## Where it lives

- `src/design/tokens.css`: the values, as `--sx-*` CSS variables, club layer first.
- `src/design/tokens.ts`: the same values for code that cannot read CSS (the share image's canvas, `motion.ts`) and for `/gameplan`, plus a contrast helper.
- `src/app/gameplan/`: the reference page.

## Steps

1. **Done (this change).** Tokens; the builder's existing short variable names (`--bg`, `--red`, …) now point at them; the share image and the motion helper read them; first version of `/gameplan` (foundations, states, the parts already shared). No intended change to how the builder looks.
2. Replace the remaining hand-typed values in `globals.css`, `lineup-editor.css` and `share.css` with tokens; fold near-duplicate sizes, speeds and shadows onto the scales; remove the unused light theme from the page base. Compared by screenshot before and after; intended differences listed for the user.
3. Lift repeated patterns into components (button, option list, selectable tile, panel, bottom sheet, dialog, player pill) and add them to `/gameplan`. Move the club's name into the club layer.
4. Finish `/gameplan` and the rules.

## Verification (step 1)

| Contract | Evidence |
| --- | --- |
| One source of values | `tests/unit/design-tokens.test.ts`: `tokens.css` and `tokens.ts` agree, each token is declared once, club tokens sit only in the club block; `tests/browser/gameplan.spec.ts`: every token exists in the built site and every colour paints as documented |
| MVP-13 contrast | `tests/unit/design-tokens.test.ts`: white on every club shade, each text level on page and surfaces, and text on the action colour pass AA (4.5:1); the replaced red `#e0372f` is shown to fail |
| MVP-13 keyboard, zoom, axe | `tests/browser/gameplan.spec.ts` at 320, 390, 768 and 1440px: skip link, no horizontal scroll, axe WCAG 2.2 AA |
| MVP-14 no tracking, indexing | `tests/browser/gameplan.spec.ts`: the page makes no API or third-party request and asks not to be indexed; the builder does not link to it. `tests/unit/design-tokens.test.ts`: the page's `noindex` does not depend on the site-wide setting. `tests/unit/site.test.ts` (unchanged): the rest of the site's indexing |
| Builder and share image unchanged | Existing unit and browser suites pass unchanged |

## Pages built from it

- **The 404 page** (`src/app/not-found.tsx`, 10 October 2026, user direction): an outline pitch set up in a "4-0-4", built only from tokens. The midfield three appear, drift off, and the line "Like our midfield, this page has gone missing." takes their place. The animation plays once (about 2.5 seconds) and is off under reduced motion, where the page simply shows its resting state. The line is a joke at the club's expense, chosen by the user; it is club-specific copy and would be rewritten for another club. Evidence: `tests/browser/not-found.spec.ts` at 320, 390, 768 and 1440px, with and without motion: 404 status, `noindex`, the way back, no overlap, no horizontal scroll, no API or third-party request, axe WCAG 2.2 AA (MVP-13, MVP-14).
