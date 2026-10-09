# UI redesign slice 1 — desktop main page

**Date:** 9 October 2026. **Source:** [UI redesign handoff](../design/ui-redesign-handoff.md), reference `full-xi-pills.dc.html` and `logo.dc.html`.

## Delivered

- Dark Supporter XI page: pill logo (disc first), disabled "Share your XI" button (PNG export not built), fixture headline, fixture details, perspective pitch with the generated turf texture, goals, flags and pill shadows, squad row with search and Clear XI.
- The builder starts on 4-2-3-1 Wide with eleven empty positions (PRD 2.1); restored drafts keep their own formation. `src/domain/lineup.ts` exports `startingLineup`; other domain rules are unchanged.
- Renamed to Supporter XI (page metadata, admin title, package name, favicon). The browser-memory key `starting-xi:working:v1` is unchanged so remembered lineups survive.
- Fonts (Big Shoulders Display 800, Barlow 400/500/600, OFL) and `public/turf.webp` are self-hosted; no external requests.
- Proposals for "not designed yet" items, shown to and approved by the user on 9 October 2026: picking in either order plus drag and keyboard; a pill menu beside the pill (role with definitions, move/swap, remove; replacement from the squad row); a formation picker with mini-pitch thumbnails and an in-dialog confirmation listing players leaving and roles cleared; unavailable pills with a dashed ring and an "Unavailable" tag.
- Below 900px a flat bird's-eye pitch stands in until the mobile slice.

## Decisions recorded (user, 9 October 2026)

- **Label collisions:** automatic placement is approved. The disc stays on the player's spot; when a label would collide, the role tag moves above the pill and/or the pill extends left. Worst case (longest names and roles at 1440px): 11 of 14 formations clean; small remaining overlaps in 3-5-2 (central midfield tag), 4-4-2 Diamond (3px) and 4-2-3-1 Narrow. With no roles: no overlaps in any formation.
- **Red:** `#e0372f` measured 4.41:1 under white 14px text (AA needs 4.5:1). The single red is now `#da362e` (4.62:1); hover darkens to `#c22e27`.
- **Short names:** surname with particles ("de Ligt"), single names whole ("Amad"); shared surnames get an initial ("J. Fletcher", "T. Fletcher"). A short-name field is not added.

## Verification

| Contract | Evidence |
| --- | --- |
| MVP-02 | `tests/unit/lineup.test.ts`, `tests/unit/draft.test.ts` (preselected formation, restored formation kept); `tests/browser/memory.spec.ts` (live builder starts on 4-2-3-1 Wide, 11 empty) |
| MVP-03–05 | `tests/browser/workbench.spec.ts`: place in both orders, drag (desktop), move/swap, replace, remove, Clear XI, roles and family filtering, destructive formation preview with cancel |
| MVP-06/07 | `tests/browser/memory.spec.ts`, `tests/browser/fixtures.spec.ts`: restore, unavailable players kept, fixture transition, corrupt and blocked storage, stale/failed fixture states |
| MVP-13 | Keyboard placement, roles, Escape and focus return; axe WCAG 2.2 AA at 320/390/768/1440px; `tests/unit/pitch-geometry.test.ts` (projection matches the mockup, labels, short names, collision placement) |
| MVP-14 | `tests/browser/entry.spec.ts`: no external or non-GET requests, excluded routes 404 |

`npm run check` passed: 107 unit tests, 44 production browser tests, 16 workbench browser tests, lint, typecheck and build. All 14 formations were screenshotted at 1440px and 1100px with automated overlap measurement.

## Open

- Logo order (disc first or last) is still undecided; disc first is used.
- "Start new fixture" still uses the browser's confirmation box.
- Mobile layout (slice 3) and admin restyle (slice 4) are not started. PNG export is not started.
