# UI redesign slice 2 — interactions

**Date:** 9 October 2026. **Source:** [UI redesign handoff](../design/ui-redesign-handoff.md), section 7 "Left in slice 2".

## Delivered so far

- **Notices (approved by the user, 9 October 2026).** One notice bar under the fixture details (`src/components/notice.tsx`): a round mark, a bold line, a quieter line and an optional button. Three tones, each with its own glyph so tone never depends on colour: information (white "i"), attention (yellow "!"), problem (red cross). Loading, fetch-failed and no-fixture states keep the headline's shape, with "Manchester United" in red and the state in white; while loading a pulsing bar stands where the opponent will be and no opponent is invented. A lineup that cannot be restored, or that belongs to another fixture, replaces the builder with a larger centred panel. Browser memory is a quiet line under the squad when it works and an attention notice above the pitch when it does not.
- **Pill menu (approved by the user, 9 October 2026).** The role is a pickable list (radio group) with each definition under its name and "No role" first; the select and the "Role definitions" disclosure are gone. Long lists scroll between the fixed title and the footer. The footer holds "Remove player" and the replace hint.
- **Start new fixture confirmation (live since pull request 5).** The browser's `confirm` is gone. Pressing "Start new fixture" turns the notice itself into the question, naming the new opponent, with "Keep this XI" (focused first) and "Start with an empty XI". Keeping or pressing Escape changes nothing and returns focus to the button.
- **State consistency pass.** One grammar across markers, pills, squad cards and formation chips: hover is one step (red darkens; dark surfaces get a light border); selected inverts to white with red; a dashed white outline marks where a player can go (every position, filled or empty, while a player is held, and the nearest position during a drag); a solid white outline is keyboard focus only, now including the search field; unavailable stays a dashed ring plus a written tag. The translucent "selected" outlines that resembled focus are gone.
- **Mobile stand-in patches (user request).** Full-width formation button; "N players not picked" hidden below 900px; markers kept inside the pitch; a player is a number disc with the name and the role stacked beneath it. This is still the temporary pitch, not the mobile design (slice 3). Role tags can still touch where three players sit close together.

## Decision recorded (user, 9 October 2026)

- **The "Move or swap to" dropdown is removed** and nothing replaces it; dragging a pill still moves and swaps. Dragging is mouse-only, so keyboard and touch users remove a player and place them again. For a move to an empty position the outcome is identical (application behaviour: the origin's role clears and the destination inherits none). For a swap, one of the two positions loses its role. This is a known gap against the AGENTS.md rule that desktop dragging has click and keyboard alternatives, accepted by the user; revisit it in the mobile slice.

## Verification

| Contract | Evidence |
| --- | --- |
| MVP-03 | `tests/browser/workbench.spec.ts`: move by drag on desktop, remove and place again elsewhere; replace, remove, Clear XI unchanged |
| MVP-05 | `tests/browser/workbench.spec.ts`: role list shows exactly "No role" plus the family's roles in order; no select remains |
| MVP-06 | `tests/browser/memory.spec.ts`: restored line, restore-failed panel (problem tone), memory-unavailable notice (attention tone) |
| MVP-06/07 | `tests/browser/memory.spec.ts`: fixture transition confirmed in the page with no browser dialog; keeping and Escape leave the XI and its match unchanged |
| MVP-07 | `tests/browser/fixtures.spec.ts`: loading headline without an opponent, fetch-failed alert with retry, stale alert |
| MVP-13 | `tests/browser/workbench.spec.ts`: keyboard reaches the role list, arrow keys choose, each role exposes its definition as its description; axe WCAG 2.2 AA at 320/390/768/1440px |

`npm run check` passed: 107 unit tests, 52 production browser tests, 20 workbench browser tests, lint, typecheck and build.

## Left in slice 2

Nothing. Next is slice 3 (mobile): the bird's-eye portrait pitch and the tap flow, including a way to move or swap without dragging.
