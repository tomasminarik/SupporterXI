# UI redesign — motion

**Date:** 9 October 2026. **Decision (user):** all seven animations below, "quick and crisp". Requested after slice 2 and before the mobile slice.

## Delivered

Durations are 140–260ms with one easing (`cubic-bezier(.2, .8, .2, 1)`); the page arrival is the only longer sequence (about one second in total).

1. **Landing.** A placed player drops onto the pitch and settles; the shadow fades in beneath. The picked squad card shrinks away and the row slides to close the gap.
2. **Leaving.** A removed or replaced player lifts and fades; the empty marker pops back. Clear XI does this as a ripple from the goalkeeper forward.
3. **Move and swap.** After a drop, the moved pill glides from the cursor to its position, and a swapped player glides the other way.
4. **Role tag.** Slides out from under the pill when set and lifts away when removed.
5. **Menus and notices.** The pill menu and formation panel grow in; a notice slides down and the pitch makes room. Notices do not animate out.
6. **Arrival.** The opponent line and details fade in (the club line is identical in every state and stays still), the pitch rises, and the markers appear in a wave from the goalkeeper forward.
7. **XI complete.** When the eleventh player lands, a pulse runs through the eleven pills and the heading changes.

## How it is built

- CSS animations in `src/components/lineup-editor.css` and `src/app/globals.css` for anything that appears. They use the individual `translate` and `scale` properties so they never fight the transforms that position markers.
- `src/components/motion.ts` for what CSS cannot do: `ghostOut` leaves an inert, `aria-hidden` copy of an element that has already left and animates the copy away; `glideFrom` plays an element from its previous position. Squad cards slide with the same first-last-invert technique.
- Reduced motion: the existing global rule switches off every CSS animation and transition, and the scripted helpers return early. Nothing is hidden or delayed in that mode.
- No behaviour, content or local-storage change. Focus handling is unchanged; the copies that animate out cannot be focused or read.

## Verification

| Contract | Evidence |
| --- | --- |
| MVP-13 | `tests/browser/workbench.spec.ts`: with motion, the landing, pop, pitch and menu animations apply and the animated copies are inert and removed; with reduced motion every animation is `none` and no copy is created |
| MVP-02–07, 13 | The existing browser suites run with reduced motion by default (`contextOptions.reducedMotion` in both Playwright configurations), so axe measures settled colours. `MOTION=1 npm run test:browser` and `MOTION=1 npm run test:workbench` run them with animations on: every interaction test passes; the only failures are axe contrast readings taken mid-fade, which is why reduced motion is the default for the suites |

`npm run check` passed: 107 unit tests, 52 production browser tests, 28 workbench browser tests, lint, typecheck and build.
