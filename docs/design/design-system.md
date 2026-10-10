# Supporter XI design system

**Agreed:** 10 October 2026 (user). **Live reference:** [supporterxi.com/gameplan](https://supporterxi.com/gameplan), drawn from the same values the site uses.

## Why

The redesign of 9–10 October 2026 is agreed and live, but its values were scattered: the same colours typed by hand in the stylesheets and the share-image renderer, 16 animation speeds, 13 text sizes, 9 shadows and 27 spacing values. The system names the values once so later work starts from shared parts.

## Decisions (user, 10 October 2026)

- **Two layers.** Future work is most likely more Supporter XI screens and/or the same product for other clubs. The *club layer* holds what would change for another club (the club colour and its shades, the text colour on it). The *product layer* holds everything else. Nothing outside the club layer names a red. No club switcher is built.
- **Code plus a live page.** The reference is published at `/gameplan` on the live site.
- **`/gameplan` is never indexed by search engines; the rest of the site is.** The page carries its own `noindex`. It is deliberately not in the robots file's disallow list: a crawler blocked there never reads the `noindex`. It is public but nothing links to it (user decision, 10 October 2026).
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
2. **Done (10 October 2026).** The three public stylesheets take their colours, typefaces, on-scale text sizes, control heights, speeds, curve, shadows and focus ring from the tokens; the builder's private variable names (`--bg`, `--red`, …) and the old light theme are gone. Done in two passes: first one-for-one replacements, checked pixel-identical on 44 screenshots (all 14 formations, empty, picking, menu, formation picker, search, share dialog in three sizes, locked, no fixture, failed, changed fixture, `/gameplan`, the 404 page; desktop and phone); then the folds listed below, each reviewed against the same screenshots.

   **Intended visible differences (all slight):**
   - Speeds: 13 different durations became three. Menus and the formation picker open in .12s (was .14s); cards and the share dialog in .12s (was .16s); landing pills, role tags, notices and headings in .22s (were .18–.26s); markers glide to a previewed formation in .22s (was .28s); the pitch and squad arrive in .36s (were .45s and .4s).
   - Shadows: pills, markers and phone number discs share one shadow; the pill menu, formation picker, dragged pill and share preview share one.
   - Text: squad card names and the text of a blocking notice are 15px (were 16px); a blocking notice's title is 30px (was 32px); the hint beside "Remove player" is 13px (was 12.5px).
   - Share dialog: the secondary button is 44px tall on desktop (was 48px).
   - Colours folded onto a neighbour a shade away: the "/" between fixture details, role-tag text, the loading bar, a locked empty position, and the small print on a selected share size.
   - The page base is dark everywhere, so browser scrollbars and form controls are drawn dark (also on `/gaffer`; nothing else about the admin changes).

   **Left as they are, on purpose:**
   - The pitch: its paint, its marker and label sizes (8.5–14px, tuned so labels fit in all 14 formations), the role tag's 12.5px, and the small shadow under a phone name label.
   - Spacing. The spacing scale is for new work; moving existing gaps onto it would shift the pitch and the labels placed on it for no visible gain.
   - A few sizes with layout tied to them: the formation button (48px tall, 24px type), formation chips (19px), phone headings (26px), the mobile logo (20px).
   - Delays, the loading pulse and the spinner.
   - Durations written in code (`motion.ts`, `lineup-editor.tsx`), which move with step 3.

   A unit test now fails if a hand-typed colour, an off-scale speed or a private variable name returns to these stylesheets.
3. **Done (10 October 2026).** The shared parts live in `src/design/` and the builder, the share dialog and `/gameplan` all use the same ones:
   - `button.tsx`: `Button` (primary, secondary, quiet, action) and `CloseButton`.
   - `option-list.tsx`: `OptionList`, used for a player's role.
   - `tile.tsx`: `Tile`, used for squad cards and formations; the image sizes in the share dialog use its class on a radio label. One rule now says what "chosen" looks like.
   - `player-pill.tsx`: `PillBody` and `RoleTag`.
   - `notice.tsx`, `brand.tsx`, `motion.ts`: moved here unchanged.
   - `components.css`: the styles of all of the above, plus two classes without a component: `.sx-label` and `.sx-panel` (the player menu, the formation picker and the share dialog). It loads before every other stylesheet so a screen can adjust a part for its own layout.
   - `club.ts`: the club's name, beside its colours. The headline, the page title and the share image read it. The 404 joke stays club-specific copy.
   - `tokens.ts` exports the three speeds in milliseconds; animations scripted in code use them (were 140, 160, 180, 200 and 420 ms).

   The components render the same markup and class names as before, so nothing was restyled. Checked on the same 44 screenshots: all identical except the share dialog's close button, which now draws the same cross as the player menu instead of a "×" character.

   Not made into components, on purpose: sheets and dialogs. Each has its own focus handling and positioning (`<dialog>` for sharing, a positioned group for the player menu); they share the panel's look through `.sx-panel` and the phone sheet rule in `lineup-editor.css`. A shared component is worth making when a third one is needed.
4. **Done with step 3.** `/gameplan` shows every component with live examples (tiles can be pressed, the option list chosen) and the rules of use.

## Still open

- A named stacking order (the stylesheets use seven raw `z-index` values).
- Spacing in the existing screens is still written by hand (see step 2).

## Verification (step 1)

| Contract | Evidence |
| --- | --- |
| One source of values | `tests/unit/design-tokens.test.ts`: `tokens.css` and `tokens.ts` agree, each token is declared once, club tokens sit only in the club block; `tests/browser/gameplan.spec.ts`: every token exists in the built site and every colour paints as documented |
| MVP-13 contrast | `tests/unit/design-tokens.test.ts`: white on every club shade, each text level on page and surfaces, and text on the action colour pass AA (4.5:1); the replaced red `#e0372f` is shown to fail |
| MVP-13 keyboard, zoom, axe | `tests/browser/gameplan.spec.ts` at 320, 390, 768 and 1440px: skip link, no horizontal scroll, axe WCAG 2.2 AA |
| MVP-14 no tracking, indexing | `tests/browser/gameplan.spec.ts`: the page makes no API or third-party request and asks not to be indexed; the builder does not link to it. `tests/unit/design-tokens.test.ts`: the page's `noindex` does not depend on the site-wide setting. `tests/unit/site.test.ts` (unchanged): the rest of the site's indexing |
| Builder and share image unchanged | Existing unit and browser suites pass unchanged |
| Step 3: one set of parts | `tests/browser/gameplan.spec.ts`: the components on the page are pressed and chosen by mouse and keyboard; every existing builder, share, lock and memory test passes unchanged against the same components (MVP-03, 05, 08, 13) |
| Step 2: values come from tokens | `tests/unit/design-tokens.test.ts` "the public stylesheets take their values from the tokens"; existing browser suites (including label overlap in all 14 formations and axe at four widths) pass unchanged, with and without motion |

## Pages built from it

- **The 404 page** (`src/app/not-found.tsx`, 10 October 2026, user direction): an outline pitch set up in a "4-0-4", built only from tokens. The midfield three appear, drift off, and the line "Like our midfield, this page has gone missing." takes their place. The animation plays once (about 2.5 seconds) and is off under reduced motion, where the page simply shows its resting state. The line is a joke at the club's expense, chosen by the user; it is club-specific copy and would be rewritten for another club. Evidence: `tests/browser/not-found.spec.ts` at 320, 390, 768 and 1440px, with and without motion: 404 status, `noindex`, the way back, no overlap, no horizontal scroll, no API or third-party request, axe WCAG 2.2 AA (MVP-13, MVP-14).

- **The footer** (`src/components/site-footer.tsx`, 10 October 2026, user request): one shared footer on the builder, `/gameplan` and the 404 page, with the contact address `dugout` at the site's domain and nothing else added. To cut address harvesting, the address is not in the page source: it is put together in the browser, and without scripts it reads "dugout at supporterxi.com". Evidence: `tests/browser/entry.spec.ts` "the footer gives a contact address that is not written in the page source".
