# Sharing — "Share your XI" (PNG export)

**Date:** 9 October 2026. **Source:** [sharing handoff](../design/sharing-handoff.md), PRD section 6, MVP-08.
**Status:** First round built and shown to the user as a proposal. **Not approved yet and not merged.** The open points are listed under "Waiting for the user".

## Proposed and built

- **The button.** "Share your XI" in the header is now live. With fewer than eleven players it is an outlined button that says what is missing ("Pick 3 more to share") and, when pressed, moves to the next empty position; it never opens an export. With eleven it is the solid yellow button. With no lineup at all (loading, no fixture, a lineup that could not be restored) it stays disabled.
- **The flow.** Pressing it opens a dialog: a preview of the real image on the left; on the right the size choice (Feed 4:5, Story 9:16), one yellow "Download image" button, and "Share…" only where the browser can hand an image file to other apps. Below 900px the same content is a sheet fixed to the bottom of the screen, like the squad and role sheets. Escape, the cross or a click outside closes it and focus returns to the button.
- **The image.** Dark page; the fixture headline in Big Shoulders Display with the club in red, "v" in grey and the opponent in white; one line of details (competition / round / Home or Away / kickoff in the visitor's time zone, or "Time to be confirmed"); a bird's-eye portrait pitch with the original grass texture; each player as the shirt number in a white disc with the short name on a red tag beneath; the formation name bottom left and the Supporter XI mark bottom right. No roles, crests, photographs, kits or web address.
- **Story safe areas.** The 1080 × 1920 image keeps about 210px clear at the top and bottom, where story viewers put their own controls.
- **Long content.** The headline uses one size for both lines and shrinks to fit a long opponent, then wraps if it must. The details move the kickoff to a second line when one is not enough. Names share one size per image: the largest at which none touches a neighbour; a name is only shortened with an ellipsis as a last resort, which no real squad name needs in any formation. Players sharing a surname get an initial, as in the builder.
- **States.** "Drawing your image…" while fonts and the texture load; if that fails, "The image could not be made. Your XI is unchanged." with "Try again". The download button is disabled until an image exists.
- **M-02.** A selected player who later became unavailable is drawn like any other.

## How it is made (architecture record: browser canvas)

The image is drawn on a canvas from a frozen copy of the XI taken when the button is pressed (`src/share/snapshot.ts`), not captured from the page. That gives exact pixel sizes, needs no new dependency and avoids the trouble page-capture libraries have on mobile Safari; the cost is that the pitch and markers are drawn a second time (`src/share/render.ts`, positions from `portraitSpot`). Fonts and the texture are awaited first; a missing font is a failure rather than a fallback typeface. The PNG is encoded in one step with `toDataURL`: `canvas.toBlob` stalled intermittently in Chromium during testing. Nothing is uploaded and no request leaves the site.

## Verification

| Contract | Evidence |
| --- | --- |
| MVP-08 incomplete rejected | `tests/unit/share.test.ts` (no snapshot for ten players or none); `tests/browser/share.spec.ts` "an incomplete XI cannot be exported" at 320, 390, 768 and 1440px |
| MVP-08 exact PNG sizes | Browser test downloads both files, checks the PNG signature and reads 1080 × 1350 and 1080 × 1920 from the file header |
| MVP-08 required content, no roles | Snapshot test: fixture, formation, eleven players, and no role text even when a role is assigned; browser test reads the image back (page colour at the corner, grass on the pitch, red and white markers) and checks the dialog and its description never name a role |
| MVP-08 snapshot isolation | Snapshot is frozen and unchanged by later edits (unit); the published squad and opponent change under an open dialog and the next image still shows the original (browser) |
| MVP-08 download and retry | Download by keyboard and by click; a blocked texture shows the failure, "Try again" recovers, the XI and browser memory are unchanged |
| MVP-08 long content | Unit: all 14 formations in both sizes with the eleven longest names — nothing overlaps, nothing leaves the image, nothing is cut; headline fitting and wrapping |
| MVP-13 | Opened, operated and closed by keyboard; focus moves to the dialog title and returns to the button; axe WCAG 2.2 AA on the dialog |
| MVP-14 | No request leaves the origin and no non-GET request is made while sharing |

`npm run check` passed: 117 unit tests, 68 production browser tests, 32 workbench browser tests (4 skipped by design), lint, typecheck and build.

## Waiting for the user

1. Approval of the button wording and behaviour, the dialog, and the two portrait images.
2. Landscape size (open product decision): not built.
3. Whether the opponent keeps the provider's spelling on the image ("Tottenham Hotspur FC"), as it does on the page (still open in the UI redesign handoff).

## Not done yet

- Landscape format.
- Manual checks on a real iPhone (Safari) and Android Chrome, including "Share…" and saving to Photos.
- MVP-08 is not marked passed in [verification](verification.md) until the above are settled.
