# Code review

Date: 11 October 2026. Scope: everything under `src/` at `main` (about 3,000 lines outside generated data), read in full, with the tests and configuration that govern it. The review looked for behaviour that is wrong for some input, state or timing, then for wasted work and missing error handling.

## Verdict

The code is in good shape. Domain logic is pure, validated at every boundary and well covered by tests; the rules in `AGENTS.md` hold (one canonical source each for the 14 formations and 25 roles, no server storage of lineups, no lineup content in analytics, server-side authorization and stale-write checks on every shared-data write). No finding lost or corrupted data.

Ten findings. Seven are fixed in this change; three are left for a decision.

## Findings

| ID | Kind | Where | Finding | Status |
|---|---|---|---|---|
| C1 | Bug | `src/server/published-content.ts` | The public content revision hashed the raw JSON file, while the backoffice waits for a hash of the parsed content. They agree only while the file's key order and defaults match the schema. After a hand edit of `content/shared.json` the backoffice would show "Publishing to the site…" indefinitely. Reproduced. | Fixed |
| C2 | Bug | `src/components/featured-fixture.tsx` | A scheduled refresh that failed (the one at the lock, or at rollover) was never retried, so on a flaky connection an XI stayed editable past the lock until the window regained focus. | Fixed: retried after 5 seconds |
| C3 | Bug | `src/domain/admin.ts` | Saving an imported fixture with a field typed back to its imported value keeps a correction equal to that value. The field still counts as corrected, so a later change from the provider is masked. | Waiting on Tomas |
| C4 | Bug | `src/components/lineup-editor.tsx` | Placing a player ran the celebration, the announcement and the `lineup_started` / `lineup_completed` events before knowing the placement was accepted. A held player who became unavailable in a background refresh produced a false "placed" and a false completed lineup. | Fixed |
| C5 | Bug | `src/components/admin-workspace.tsx` | A non-JSON error response (a platform timeout page) surfaced as "Unexpected token '<'" instead of the intended message. | Fixed |
| C6 | Bug | `src/components/lineup-editor.tsx` | A desktop drag ended only on pointer-up or Escape. A cancelled pointer, a window losing focus, or the editor being replaced mid-drag left the ghost pill and the page's dragging state behind. | Fixed |
| C7 | Waste | `src/share/share-dialog.tsx` | Each size was redrawn and re-encoded every time it was selected again, despite the "drawn once" comment, and every redraw kept another image in memory until the dialog closed. | Fixed |
| C8 | Waste | `src/components/lineup-editor.tsx` | A layout effect without dependencies measures every squad card on every render, and a drag renders on every pointer move. | Deferred |
| C9 | Gap | `src/app` | There is no `error.tsx` or `global-error.tsx`. A render exception shows the framework's bare error screen. | Fixed 12 October 2026: an error page with "Try again" and "Clear my saved XI and reload" |
| C10 | Bug | `src/components/fixture-headline.tsx` | The details row used its text as the React key, so identical competition and round text collided. | Fixed |

### Why three are open

- **C3** is a behaviour choice. Either typing the imported value back removes the correction (the provider's later changes then flow through), or a correction stays until "Clear correction" is pressed (today's behaviour, and what the screen says). The first is less surprising; the second is explicit.
- **C8** costs smoothness on slow laptops, not correctness. Narrowing the effect risks breaking the card and pill animations, which only the eye can verify. Worth doing together with any future work on the editor.
- **C9** needs a designed page: what a supporter sees when the builder crashes, and whether it offers to reset the remembered XI.

## Observations, no action taken

- **A manually featured match stays featured after it kicks off** until cleared in the backoffice, and is locked from 15 minutes in. This is documented behaviour; forgetting to clear it leaves the public page on a locked, finished match.
- **Reloading after the featured match changes** replaces the view-and-share state of the earlier XI with "Your remembered XI belongs to …", which can only be discarded. Without a reload the earlier XI stays viewable.
- **The public API response is parsed strictly.** A tab left open across a deployment that adds a response field would show "Showing the last loaded fixture information" until reloaded.
- **No signed-in backoffice journey is tested end to end.** The mocked unit tests and the preview workbench cover the logic; the OAuth round trip is covered by the manual drills on record.
- **`npm run validate` regenerates `src/data/squad.generated.ts`** before checking it, so that check cannot fail in a build; it only guards direct runs of `content:check`.
- **Docs drift:** `content/README.md` described the write endpoints as future work (corrected here). `docs/decisions/open-product-decisions.md` still carries "No domain is approved" and a September date above October decisions; that file is Tomas's to edit.

## Tests added

- `tests/unit/publication.test.ts`: the public revision equals the backoffice digest, whatever the file's layout (MVP-12).
- `tests/browser/lock.spec.ts`: a refresh that fails at the lock is retried without the visitor doing anything (MVP-07).

`npm run check` passes: 153 unit tests, 108 browser tests and 45 workbench tests.
