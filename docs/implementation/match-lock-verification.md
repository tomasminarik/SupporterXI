# Match lock and the 120-minute switch

**Date:** 10 October 2026. **Decision (user):** "a sort of locked state of the game starting 15 minutes after kick-off time and ending 120 minutes after kick-off time. After 120 minutes it should switch to the next game." This replaces the earlier rule (the next match took over at kickoff plus three hours, and nothing was ever locked). It was prompted by the Tottenham match still being editable, and still featured, after full time.

## Rule

| Time from kickoff | What supporters get |
| --- | --- |
| Before, and up to 15 minutes after | Build and change the XI as before |
| From 15 minutes to 120 minutes | The same match, locked: the XI can be read and shared as an image, not changed |
| From 120 minutes | The next eligible match, open |

Times come from the server, never the visitor's clock. The lock arrives without a reload: the page is told when to ask again.

## Interpretation (Claude's, for the user to correct)

- **Locked means view and share.** A complete XI can still be downloaded or shared. An XI that was not finished cannot be completed, so its share button is disabled.
- **What is switched off:** picking, replacing, moving, removing, roles, Clear XI and the formation chooser. The squad list is hidden. Each position is still announced to screen readers and says it is locked when pressed.
- **A notice** under the match details: "This match has kicked off. Your XI is locked. You can still share it. The next match opens at 20:30." (the visitor's local time).
- **An XI left open when the next match takes over** stays locked; "Start new fixture" begins the new one. Before, such an XI could still be edited.
- **A manually featured match** (admin override) with a known kickoff locks at 15 minutes and stays locked until the override is cleared, because an override never rolls over by itself. One without a kickoff never locks.
- There is still no cutoff before kickoff and no server record of lineups: the lock is a state of the page, not a submission deadline that is enforced anywhere.

## Built

- `src/domain/featured-fixture.ts`: `lockMs` (15 minutes), `rolloverMs` (120 minutes), a `locked` flag in the featured-fixture response, and `nextRefreshAt` pointing at the lock first and the rollover after.
- `src/components/fixture-builder.tsx` and `lineup-editor.tsx`: the read-only builder and the notice. `src/share/share-button.tsx`: the disabled state for an unfinished locked XI.
- The local workbench has a "Simulate kick-off plus 15 minutes" button.

## Verification

| Contract | Evidence |
| --- | --- |
| MVP-07 selection | `tests/unit/fixtures.test.ts`: featured through kickoff and to one millisecond before 120 minutes, switched at exactly 120; corrected kickoffs; overrides |
| MVP-07 lock | Same file: unlocked to one millisecond before 15 minutes, locked from exactly 15 to the rollover; the refresh moment; overrides with and without a kickoff; older responses read as unlocked |
| MVP-07 in the browser | `tests/browser/lock.spec.ts` at 320, 390, 768 and 1440px: the page locks by itself at the moment the server named; positions, formation and drag do nothing and browser memory is unchanged; the next match takes over and a new XI can be started |
| MVP-08 | Same file: a complete locked XI still opens the share dialog; an unfinished one cannot be shared |
| MVP-13 | Same file: axe WCAG 2.2 AA on the locked page, no horizontal scroll, positions still named for assistive technology |

`npm run check` passed: 124 unit tests, 80 production browser tests, 33 workbench browser tests (7 skipped by design), lint, typecheck and build.

## For Codex (admin files were not touched)

The admin screen still says "Automatic selection uses kickoff plus three hours." It should say 120 minutes and mention the lock at 15 minutes.
