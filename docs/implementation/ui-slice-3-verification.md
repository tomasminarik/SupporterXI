# UI redesign slice 3 — mobile (first round, awaiting the user's decision)

**Date:** 9 October 2026. **Source:** [UI redesign handoff](../design/ui-redesign-handoff.md): "bird's-eye portrait pitch and the tap flow"; nothing was drawn. Applies below 900px. The desktop layout is unchanged.

## Proposed and built

- **Portrait pitch.** Bird's-eye, attacking upwards, drawn taller than a real pitch (100:185; 100:215 below 360px) so every line of a formation has room for labels. It is not to scale: `portraitSpot` in `src/components/pitch-geometry.ts` spreads central players a little wider than the catalogue and sets the goalkeeper slightly deeper. Order left to right and back to front is always the catalogue's.
- **Player marker.** The shirt number in a white disc on the spot, the short name on a red tag beneath, the full role beneath that on up to two lines (PRD 4: role in full, no abbreviations). Names of eight letters or more are set slightly smaller instead of being cut.
- **Picking.** Tapping an empty position opens the squad as a sheet fixed to the bottom of the screen (heading, search, a grid of players); the page scrolls so the chosen position stays visible above it. Tapping a player places them and closes the sheet. The squad row also stays in the page under the pitch.
- **A player's sheet.** Tapping a placed player opens the role list with definitions as a bottom sheet, with Replace, Move and Remove player.
- **Move and swap by tapping.** "Move" closes the sheet, marks every other position with the dashed target outline and shows a bar with Cancel; tapping an empty position moves, an occupied one swaps. This restores move and swap for touch, where dragging does not exist. The buttons do not appear in the desktop menu, which the user asked to keep free of a move control.
- **Formations.** The picker is a bottom sheet with the 14 formations in three columns and the top of the pitch visible above it. A tap applies a formation that costs nothing; one that would drop players or clear roles is previewed on the pitch with its consequences and "Keep" / "Use" buttons (PRD 4, MVP-04). Mouse and keyboard behaviour is unchanged.

## Measured

With all eleven placed and the longest role on every player: no label overlaps and nothing outside the pitch in any of the 14 formations at 390px. At 320px the only remaining contact is in 5-3-2 (the central defender's role against the goalkeeper's disc).

## Decisions for the user

- Whether Move belongs in the touch sheet (it was removed from the desktop menu on 9 October).
- Whether the squad row should remain in the page under the pitch on phones, now that the sheet does the picking.

## Verification

| Contract | Evidence |
| --- | --- |
| MVP-02–05 | `tests/browser/workbench.spec.ts` "touch layout", at 320, 390 and 768px with touch: pick from the sheet, role, move to empty (role clears), swap (roles stay with positions), cancel, replace, formation applied at once when free and confirmed when it clears a role |
| MVP-13 | Same test: sheets are fixed, the chosen position stays visible, focus returns after Cancel, axe WCAG 2.2 AA, no horizontal scroll. "no labels overlap in the tightest formations" measures 5-3-2, 3-5-2, 4-2-3-1 Narrow and 4-4-2 Diamond at 390px. `tests/unit/pitch-geometry.test.ts`: every position on the pitch, mirrored, in catalogue order, and at least 16% of the width apart side by side. Existing keyboard tests pass at all widths |

`npm run check` passed: 109 unit tests, 52 production browser tests, 32 workbench browser tests (4 skipped by design: touch tests on desktop, the overlap measurement off 390px), lint, typecheck and build.

## Not done yet

- Manual checks on a real iPhone (Safari) and Android Chrome.
- Header and headline sizing on phones were left as they are.
- Touch dragging (optional per AGENTS.md) is not built.
