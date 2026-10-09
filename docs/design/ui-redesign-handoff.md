# UI redesign handoff

**Prepared:** 9 October 2026, at the end of the design conversation.
**Purpose:** Start implementing the agreed redesign in a new chat without depending on that conversation.
**Status:** Design agreed for the desktop main page and the logo. Slice 1 is implemented; see [UI slice 1 verification](../implementation/ui-slice-1-verification.md). The red is now `#da362e` (contrast). The docs listed under "Documentation already updated" are edited but not committed.

## 1. What was decided

The user rejected the existing interface as generic and asked for something easy to use and not generic. A first light "whiteboard" sketch was dropped. The agreed direction is below; each point was confirmed by the user on the design canvas.

### Page

- Dark page (`#0c0e0d`), desktop first.
- Header: logo on the left, a yellow **Share your XI** button on the right (`#f5c518`, dark text `#14160f`). The user removed the "0 / 11" counter from the header.
- Fixture headline, very large and bold, uppercase, on two lines: **Manchester United** in red, **v** in grey (`#8a8d86`), opponent in white. Must wrap gracefully for long opponent names.
- One line of fixture details under it: competition / round / Home or Away / kickoff.
- One red everywhere: `#e0372f` (headline, markers, logo, squad numbers, corner flags).
- Type: Big Shoulders Display 800 for the headline, numbers and headings; Barlow 400/500/600 for everything else. These were chosen in the mockup and accepted; self-host them in the build.

### Pitch (desktop)

- Realistic grass pitch in perspective, seen from the touchline at the halfway line, slightly lower than a TV camera. Full pitch, team attacks left to right, so the team's left flank is the far side.
- A slab of turf with a soil edge at the front, mowing stripes in both directions, worn goalmouths, goals with nets, corner flags, a soft shadow under the slab, and the far half fading into the dark background.
- The user chose the pitch as rendered in the mockup's "Textured" setting: a generated blade-level grass image (`reference/turf.jpg`) with stripe overlays. This is a generated texture, not a photograph. A real 3D engine was explicitly allowed if needed, but the CSS version was accepted.
- Formation control: a single dropdown button showing the formation name, centred about 60px above the far touchline. No previous/next arrows. It opens a picker for all 14 formations; a thumbnail grid of mini-pitches was proposed and not objected to, but never drawn.
- The builder starts on 4-2-3-1 Wide with eleven empty positions (PRD 2.1).

### Position markers

- Empty position: a round red marker with a white ring and the position abbreviation. The user's own sketch used short labels (CB, CB instead of LCB, RCB).
- Filled position: a horizontal red pill, white 2px ring, 32px tall. A white disc on the left holds the shirt number; the surname follows in uppercase. The disc sits on the player's spot and the pill extends to the right.
- Role: shown in full directly under the pill, on a dark 72%-opaque tag. No role, no tag. Abbreviation badges and a separate "Your XI" strip were both tried and rejected.
- Markers are the same size everywhere; they do not shrink with distance.
- Each pill has a long soft shadow on the grass beneath it.
- Pills are centred on the player's spot, so the central players sit on the line between the two goals.

### Squad row

- Full-width row below the pitch. Each card: shirt number large in red, surname only.
- A heading that names what you are doing ("Pick your striker", "Your XI is complete"), a count, and a search field.
- 36 players do not fit in one row; the mockup scrolls sideways. Wrapping to several rows is the alternative and was not decided.

### Logo and name

- The approved product name is **Supporter XI** (9 October 2026). No domain is approved.
- Logo: the player pill. A white disc with "XI", then the word "Supporter" in Big Shoulders Display 800 uppercase, on red with a white ring (a dark ring on light backgrounds).
- The XI is drawn as three plain strokes, not set in a font, so it stays sharp and is centred by geometry.
- Full pill only at 32px tall and above. Below 32px use only the collapsed form: a red disc with white XI. At 32px and below the strokes are about 30% thicker; at 24px and 16px the white ring is dropped.
- Open: disc first reads "XI Supporter"; disc last reads "Supporter XI". The mockup header uses disc first. The user saw both and did not choose.

## 2. Not designed yet

Design these in code and show each one running before moving on.

1. Picking a player for a position: click a position then a player, or a player then a position; drag on desktop. Click and keyboard alternatives are mandatory.
2. The menu on a filled pill: set role (with definitions), move or swap, remove.
3. The formation picker and the confirmation when a formation change would drop players or roles (currently a native `confirm`).
4. Hover, focus, selected and unavailable-player states.
5. The notices the current page shows: browser memory, featured fixture changed, restore failed, loading, no fixture, fetch failed.
6. Label collisions in other formations. In a back five the players are about 45px apart on screen and a pill plus role is about 54px tall. Options discussed: spread the formation over more of the pitch's depth, raise the camera, or flip a tag to the other side when there is no room. Check all 14 formations.
7. Mobile: a bird's-eye portrait pitch was agreed in principle; nothing is drawn.
8. The share image (PNG export). Codex builds it after the UI work. Portrait formats use a bird's-eye portrait pitch; a landscape format uses the landscape pitch and its dimensions are undecided.
9. The admin screens, which still have the old light look.

## 3. Resources

### Design canvas

https://claude.ai/artifact/PoGUDmzspsdyNcwbmh8yJD (private to the user; read it with the Artifact tool's `read` action, with a file `path`).

| Artboard file | What it is | Status |
| --- | --- | --- |
| `project/Pills.dc.html` | Full XI, pills with roles, final pitch, yellow share button, logo in header | **The agreed page** |
| `project/LogoFinal.dc.html` | Logo at all sizes, light and dark, both orders | **The agreed logo** |
| `project/Main.dc.html` | Empty state with round markers and three older example labels | Reference for empty markers only |
| `project/FullXI.dc.html` | Circles with side labels | Rejected |
| `project/Option1.dc.html`, `project/Option4.dc.html` | Roles in a strip; role badges | Rejected |
| `project/Logo.dc.html`, `project/LogoSmall.dc.html` | Five logo directions; size tests | Superseded |

### Copies in this repository

`docs/design/reference/` holds the sources as they were at handoff:

- `full-xi-pills.dc.html`: the agreed page. Every colour, size and position is in its inline styles.
- `logo.dc.html`: the agreed logo, including the two XI stroke definitions.
- `empty-state.dc.html`: the empty state.
- `turf.jpg`: the grass texture (1740 × 1140, about 700 KB). `turf.py` regenerates it (Python with Pillow and NumPy).

The `.dc.html` files are mockup markup for the design tool. They are a specification to read, not code to copy into the app.

### Pitch geometry used in the mockup

- Pitch plane 1160 × 760 px, containing a 1100 × 692 field (inset 30px left and right, 34px top and bottom). Field markings are drawn in a 1050 × 680 viewBox (a 105 × 68 m pitch at 10 units per metre).
- The plane is rotated `rotateX(52deg)` about its bottom edge, inside a container with `perspective: 1500px` and `perspective-origin: 50% 100%`.
- Formation coordinates from the catalogue (x across 0–100, y forward 0–100) map to the field as `left% = 3 + y × 0.94` and `top% = 4 + x × 0.92`.
- Markers are not inside the 3D plane, because they must stay flat and one size. They sit in a flat overlay of the same 1160 × 760 box, at the projected point. For a field point at plane coordinates (px, py): `d = 760 − py`, `s = 1500 / (1500 + d × sin 52°)`, `screenX = 580 + (px − 580) × s`, `screenY = 760 − d × cos 52° × s`.
- Shadows are inside the plane so they foreshorten with the grass.

### Research

Mobbin references that informed the direction: FotMob, theScore, DAZN and MLS lineup screens (pitch as hero, large markers); Premier League Fantasy and F1 Fantasy team creation (empty "+" slots, compact event header); sweetgreen's bowl builder and airline seat maps (pick a spot, choose from a list); Substack and Perplexity share-image dialogs (preview, ratio toggle, one download button).

## 4. What the implementation must respect

- `AGENTS.md` and the authoritative documents in `README.md` still govern scope. The redesign changes presentation, not product rules, except where PRD 2.1 says otherwise.
- Domain logic is separate from the interface and should stay untouched: `src/domain/*` (lineup operations, formation changes, browser memory, featured fixture). The interface lives in `src/app/page.tsx`, `src/app/globals.css`, `src/components/featured-fixture.tsx`, `fixture-builder.tsx`, `lineup-editor.tsx`, `lineup-editor.css`, and the admin files.
- One change to behaviour is needed outside the styling: the builder must start on 4-2-3-1 Wide instead of no formation (`emptyLineup` in `src/domain/lineup.ts` and the code that creates a fresh draft). Restored drafts keep their own formation.
- The Playwright and axe tests in `tests/browser/` assert on visible copy, headings, roles and the empty starting state. They will need updating with the interface; `npm run check` must pass at the end of each slice. Every slice needs tests mapped to `docs/implementation/verification.md`.
- Accessibility requirements are unchanged: keyboard for every core action, visible focus, non-colour states, reduced motion, WCAG 2.2 AA. Red text on the dark page and white on red were chosen to pass contrast; recheck in the build.
- `main` receives content commits from the production admin and the daily fixture import. Fetch before starting, work on a branch, and never overwrite `content/shared.json` with an older copy.
- Codex builds PNG export only after this UI work is finished. Do not start it.
- The squad has no position data, so the squad row cannot be grouped by position.
- Players' surnames are not stored separately. The mockup shortened names by hand ("de Ligt", "Amad"); the build needs a rule or a field for the short name.

## 5. Documentation already updated (uncommitted)

- `docs/product/canonical-prd.md`: version 2.1 with the name, the preselected formation, role display, export notes and the new visual direction.
- `docs/implementation/verification.md`: MVP-02 now expects the preselected formation.
- `docs/decisions/open-product-decisions.md`: name approved; landscape export size listed as undecided.
- `README.md`: name approved; pointer to this handoff.

Still saying "Starting XI": the app itself (`src/app/layout.tsx`, `page.tsx`, admin pages), `package.json` and older dated handoff documents. Rename the app as part of the first slice; leave dated history as it is.

## 6. Suggested slices

1. **Desktop main page.** Dark page, logo, headline, perspective pitch with the real texture, empty markers, pills with roles, squad row, formation switching, starting on 4-2-3-1. Wired to the existing domain logic. Verified in all 14 formations with screenshots.
2. **Interactions.** Picking, role menu, move and swap, remove, formation picker and its confirmation, notices and error states, keyboard and focus.
3. **Mobile.** Bird's-eye portrait pitch and the tap flow.
4. **Admin.** Bring the admin screens into the new look.

Then Codex builds the share image, followed by release checks.

## 7. Starting prompt for the new chat

```text
We are implementing the agreed UI redesign of Supporter XI in this repository. The design was done in an earlier chat; nothing in the interface code has been changed yet.

Before writing any code, read AGENTS.md, README.md and the documents it marks authoritative, then read docs/design/ui-redesign-handoff.md in full and the reference files in docs/design/reference/. The agreed page is full-xi-pills.dc.html and the agreed logo is logo.dc.html; treat them as the specification. The design canvas is at https://claude.ai/artifact/PoGUDmzspsdyNcwbmh8yJD if you need the live version.

Then:
1. Fetch and check that main is up to date, and create a branch for this work. There are uncommitted documentation changes from the design chat (PRD 2.1, verification, decisions, README, docs/design); keep them and include them in the first commit when I ask you to commit.
2. Build slice 1 from the handoff: the desktop main page, wired to the existing domain logic in src/domain, starting on 4-2-3-1 Wide, with the app renamed to Supporter XI.
3. Run the app locally and check your work with screenshots in all 14 formations before showing me. Tell me where pills or role tags collide and what you recommend.
4. Update the browser tests that the new interface breaks and get npm run check passing.

Do not start PNG export; Codex builds that after the UI work. Do not change product scope. Where the handoff lists something as not designed yet, propose it, show it running, and wait for my decision before moving to the next slice. Ask me before committing or pushing.
```
