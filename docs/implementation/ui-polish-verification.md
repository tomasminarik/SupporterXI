# Polish after sharing: logo, phone header, labels, indexing

**Date:** 9 October 2026. Follows [sharing verification](sharing-verification.md). All items are user decisions of that day.

## Decisions (user, 9 October 2026)

- **Logo reads "Supporter XI":** the word first, the XI disc last. This closes the open logo-order question.
- **Phone checks are done.** The user tried the builder and sharing (download, share, the three sizes) on their own phones and confirmed both work. The makes and browsers were not recorded.
- **The manual accessibility pass is optional,** not a release gate. The automated checks (keyboard journeys, focus, axe WCAG 2.2 AA at four widths) remain mandatory.
- **Search engines:** the site should start being indexed once supporterxi.com is connected. Connecting the domain is Codex's task.
- **Fix the label overlaps** on the desktop pitch, and **tune the header and headline on phones.**

## Built

- **Logo.** Header and share images show "SUPPORTER" then the disc. Below 360px the header logo collapses to its disc alone (red with a white XI), as the logo rules allow, so the share button fits beside it.
- **Phone header (below 700px).** The logo is 36px tall and the share button is smaller and never wraps ("Pick 11 more to share" stays on one line down to 320px).
- **Phone headline.** The type size follows the screen width, so "MANCHESTER UNITED" always fits on one line (it broke in two at 320px, and at 390px with a short opponent). "v" always stays with the opponent's first word. Above about 430px nothing changes.
- **Phone details.** The kickoff takes its own line, so no separator is left hanging at the start of a line in the usual case.
- **Desktop labels.** Two changes. (1) Central players are spread a little wider across the pitch than the catalogue places them, as the phone pitch already did: three central midfielders were 45px apart on screen and a pill with its role needs 54px. Order and symmetry are unchanged, and players on the line between the goals do not move. (2) Label placement, after its usual pass, now also tries changing two labels together, which frees pairs that blocked each other. The landscape share image uses the same positions.
- **Indexing.** The site asks not to be indexed until a production deployment's domain is supporterxi.com (or www.supporterxi.com); then it asks to be indexed, names supporterxi.com as the one address for the builder, and its robots file keeps /admin, /api and /dev out. This is read when the site is built, so **the first deployment after the domain is connected switches it on** — a redeploy is needed if the domain is added without one. Previews and the vercel.app address never ask to be indexed. `src/domain/site.ts`. Since 10 October 2026 (live check after launch): `/gaffer`, `/gameplan` and `/dev` are kept out by a `noindex` response header set in `next.config.ts` rather than by the robots file, because a crawler that may not fetch a page never reads its noindex; the backoffice headers, which still named the old `/admin` address, cover `/gaffer` again; the vercel.app address answers `noindex`; and `/sitemap.xml` lists the builder.

## Measured (longest eleven names, longest role on every player, all 14 formations)

| Window width | Overlapping label pairs before | After |
| --- | --- | --- |
| 1440px | 5, in 4-3-3, 3-5-2 and 4-2-3-1 Narrow | 1: a 2 × 6px touch in 3-5-2 |
| 1100px | 11 | 2, both small |
| 960px | 46 | 13 |

Below the full design width the pitch shrinks while labels keep their size, so the worst case cannot be fully cleared there. Ordinary lineups, with shorter names and few roles, have far more room.

## Verification

| Contract | Evidence |
| --- | --- |
| MVP-13 desktop labels | `tests/browser/workbench.spec.ts` "desktop labels stay apart in all 14 formations" at 1440px (a touch of up to 3px is tolerated); `tests/unit/pitch-geometry.test.ts`: the spread keeps order, symmetry and the field, and gives 3-5-2's midfield three at least 54px each |
| MVP-13 phones | Existing touch-layout and overlap tests at 320, 390 and 768px pass unchanged, including no horizontal scroll and axe |
| MVP-08 | Share tests pass with the new logo; landscape positions follow the builder |
| MVP-14, indexing | `tests/unit/site.test.ts`; `tests/browser/entry.spec.ts` checks the page asks not to be indexed, names the canonical address and serves a closed robots file outside production |

`npm run check` passed: 121 unit tests, 68 production browser tests, 33 workbench browser tests (7 skipped by design), lint, typecheck and build.

## Known limits

- One 2 × 6px touch between two labels remains in 3-5-2 at 1440px in the worst case above.
- On phones, a very long competition and round can still wrap with a separator at the start of the second line.
- The mockup positions of players away from the middle line no longer apply on desktop; they moved by up to about 20px across the pitch.

## Being found (11 October 2026)

After launch the builder's page gained what a search result and a shared link need: a title that leads with what people search for, a fuller description, Open Graph and Twitter tags, a preview image and home-screen icon (`src/app/opengraph-image.png`, `src/app/apple-icon.png`, both drawn by `node scripts/generate-social-images.mjs` from the site's fonts and colours, with no crest, kit or photograph), a web manifest, a `WebApplication` description for search engines, and three plain sentences under the builder ("What is Supporter XI?"), which at the user's request (11 October 2026) are folded into one quiet line above the footer that opens when pressed. `tests/browser/entry.spec.ts` checks each of them. Registering the site with Google Search Console and Bing is done by the user, outside the code.
