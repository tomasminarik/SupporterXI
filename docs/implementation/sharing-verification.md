# Sharing — "Share your XI" (PNG export)

**Date:** 9 October 2026. **Source:** [sharing handoff](../design/sharing-handoff.md), PRD section 6, MVP-08.
**Status:** Built with the user's decisions of 9 October 2026 applied. Checks on real phones remain.

## Decisions (user, 9 October 2026)

- **Three sizes.** Square 1:1 at 1080 × 1080, Portrait 9:16 at 1080 × 1920 and Landscape 16:9 at 1920 × 1080. Square replaces the earlier 4:5 feed size (1080 × 1350), which is no longer produced. This settles the open landscape decision.
- **No match details on the image.** The line with competition, round, Home or Away and kickoff is dropped. The headline alone names the match.
- **An address on the image.** "Build your own XI at supporterxi.com" sits bottom centre, with the address prominent. The user asked for this explicitly; earlier documents said no address may be printed without asking.
- **Button wording:** "Pick 3 more to share" while the XI is incomplete.
- **Opponent names** stay as the provider spells them ("Tottenham Hotspur FC").

## Built

- **The button.** With fewer than eleven players it is an outlined button that says what is missing ("Pick 3 more to share") and, when pressed, moves to the next empty position; it never opens an export. With eleven it is the solid yellow "Share your XI". With no lineup at all it stays disabled.
- **The flow.** A dialog with a preview of the real image, the size choice, one yellow "Download image" button, and "Share…" only where the browser can hand an image file to other apps. Below 900px it is a sheet fixed to the bottom of the screen. Escape, the cross or a click outside closes it and focus returns to the button.
- **Square and Portrait.** Dark page; the headline with the club in red, "v" in grey and the opponent in white; a bird's-eye pitch with the original grass texture; each player as the shirt number in a white disc with the short name on a red tag beneath. Portrait keeps about 210px clear at the top and bottom, where story viewers put their own controls. The square image draws its markers slightly smaller.
- **Landscape.** The desktop builder's pitch: the same turf slab tilted away from the viewer (same angle and perspective), with soil edge, goals and corner flags, and each player as the builder's pill. The builder's own rule decides which pills extend to the left. The fixture is on one line when it fits and on two when the opponent is long.
- **Footer on every size.** The formation on the left, "Build your own XI at SUPPORTERXI.COM" in the middle (the address in yellow), the Supporter XI mark on the right.
- **Never on the image:** roles, crests, photographs, kits.
- **Long content.** The headline shrinks to fit a long opponent, then wraps. Names share one size per image, the largest at which none touches a neighbour; no real squad name needs cutting in any formation.
- **States.** "Drawing your image…"; on failure "The image could not be made. Your XI is unchanged." with "Try again". The download button is disabled until an image exists.
- **M-02.** A selected player who later became unavailable is drawn like any other.

## How it is made (architecture record: browser canvas)

The image is drawn on a canvas from a frozen copy of the XI taken when the button is pressed (`src/share/snapshot.ts`), not captured from the page. That gives exact pixel sizes and needs no new dependency; the cost is that the pitches and markers are drawn a second time (`src/share/render.ts`, positions from `portraitSpot` and `projectSlot`). Canvas has no 3D, so the landscape slab is drawn flat and then tilted one row of pixels at a time with the builder's own projection. Fonts and the texture are awaited first; a missing font is a failure, not a fallback typeface. The PNG is encoded in one step with `toDataURL`: `canvas.toBlob` stalled intermittently in Chromium during testing. Nothing is uploaded and no request leaves the site.

## Verification

| Contract | Evidence |
| --- | --- |
| MVP-08 incomplete rejected | `tests/unit/share.test.ts` (no snapshot for ten players or none); `tests/browser/share.spec.ts` "an incomplete XI cannot be exported" at 320, 390, 768 and 1440px |
| MVP-08 exact PNG sizes | Browser test downloads all three files, checks the PNG signature and reads 1080 × 1080, 1080 × 1920 and 1920 × 1080 from the file header |
| MVP-08 required content, no roles | Snapshot test: opponent, formation and eleven players only, and no role text even when a role is assigned; browser test reads the images back (page colour, grass, red and white markers, the yellow address) and checks the dialog and its description never name a role |
| MVP-08 snapshot isolation | Snapshot is frozen and unchanged by later edits (unit); the published squad and opponent change under an open dialog and the next image still shows the original (browser) |
| MVP-08 download and retry | Download by keyboard and by click; a blocked texture shows the failure, "Try again" recovers, the XI and browser memory are unchanged |
| MVP-08 long content | Unit: all 14 formations with the eleven longest names. Square and Portrait: nothing overlaps, leaves the image or is cut. Landscape: every pill inside the image and clear of headline and footer. Headline fitting and wrapping |
| MVP-13 | Opened, operated and closed by keyboard; focus moves to the dialog title and returns to the button; axe WCAG 2.2 AA on the dialog |
| MVP-14 | No request leaves the origin and no non-GET request is made while sharing |

`npm run check` passed: 118 unit tests, 68 production browser tests, 32 workbench browser tests (4 skipped by design), lint, typecheck and build.

## Known limits

- **supporterxi.com does not show the site yet.** On 9 October 2026 the domain was registered but still showed its registrar's holding page, and it is not connected to the Vercel project. Until it is, the address printed on every image leads nowhere useful.
- In landscape, pills can still touch in the builder's known tight cases (longest names in 3-5-2, 4-4-2 Diamond and 4-2-3-1 Narrow), exactly as on the desktop pitch.
- In the square image a back five with the longest surnames fits, but the names are small.

## Not done yet

- Manual checks on a real iPhone (Safari) and Android Chrome, including "Share…" and saving to Photos. MVP-08 is not marked fully passed in [verification](verification.md) until then.
