# Gaffer usability — 11 October 2026

Requested by the user on 11 October 2026: a tidier sign-in page, fewer publications for availability changes, a clearer way to mark a player out for the next match or for longer, and unavailable players shown on the public squad list instead of vanishing.

## What changed

- **Sign-in.** Signed out, `/gaffer` is one centred card: name, one line of explanation, the GitHub button, and any sign-in failure as an alert inside the card. A deployment without the admin connection shows the same card with "Not connected on this deployment". `/dev/admin?view=sign-in` and `?view=sign-in-failed` show the card locally, because the real one needs production credentials.
- **Availability.** The two lists of dropdowns are replaced by one list of active players. Each row has three choices (Available, Out next match, Out until cleared) and "Pick matches…" for a chosen set of coming matches, such as a suspension. The row says in words what is set. Players who are out are listed first. Inactive players are not listed; they are managed in Squad.
- **One save for many players.** Choices are collected on the page and nothing is written until "Save and publish". That sends one `availability-plan` command, which becomes one commit and one deployment however many players changed. Rows that differ from what is saved are marked "Not saved"; Discard drops them.
- **Publication status.** After a save the page checks every 12 seconds (for up to 8 minutes) whether the change is live and says so; "Check now" remains. The storage is unchanged: a change is still a commit to `content/shared.json` followed by a deployment, as ADR 001 describes.
- **Public squad list.** A squad player who is out for the featured match is listed after everyone who can be picked, as a disabled card with a dashed edge and the word "Unavailable". A player who is Inactive is still not listed. M-02 is unchanged: a player already in an XI stays there.
- Availability is the first tab, since it is the weekly job. The page heading is "Gaffer".

## Data and compatibility

- New admin command `availability-plan`: for each listed player it sets `unavailableUntilCleared` and replaces that player's match entries with "unavailable" for the listed fixtures. It uses the existing content route, authorization, CSRF check, schema validation and revision check. The earlier `ongoing-availability` and `availability` commands still exist and are still tested; the page no longer sends them.
- Saving a player through the new list replaces all of that player's match entries. An "available for this one match" exception to a long-term absence can no longer be set from the page; one that is already saved is shown in the row ("except vs …") and kept until that player is edited. Entries for matches that have finished are dropped when the player is next edited.
- The content file's schema is unchanged. No content was edited by this change.
- The public featured-fixture response gains `unavailable` on each player (true for an active player who is out for the match). Browser lineups remembered before the field existed still load; it reads as false. A browser tab left open across the deployment rejects the new field and shows "Showing the last loaded fixture information" until it is reloaded.
- No new service, database or account. No architecture deviation.

## Verification mapping

- **MVP-10:** `tests/unit/admin.test.ts` covers the plan command (several players in one write, replacement of match entries, untouched players, duplicate/unknown references and unknown players rejected, an empty plan rejected) and the upcoming-match and plan helpers in `src/domain/availability-plan.ts`.
- **MVP-06/07:** `tests/unit/admin.test.ts` checks `selectable`/`unavailable` for available, out and inactive players; `tests/unit/draft.test.ts` checks that an older remembered lineup still reads. `tests/browser/workbench.spec.ts` checks the disabled card is last, named "…, unavailable", cannot be picked, and returns when the player is available again, at four widths.
- **MVP-10/13:** `tests/browser/admin-preview.spec.ts` covers out next match, out until cleared, picked matches, undoing a change, one save for several players, discard, an inactive player not being listed, and axe/overflow checks with unsaved changes showing; plus the sign-in card (alert, link, axe, overflow) at four widths.
- **MVP-09/14:** `tests/browser/admin-security.spec.ts` still checks that an unconfigured deployment fails closed; the preview still makes no network writes.

Not verified locally: real GitHub sign-in and a real publish from the new page, which need production credentials. Check both after deployment.
