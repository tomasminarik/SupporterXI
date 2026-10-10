# Supporter XI — next-match starting XI builder — MVP PRD

**Version:** 2.1 — 9 October 2026 (2.0: 22 September 2026).
**Status:** Agreed scope, replacing the original MVP now preserved as MVP+. Version 2.1 records the approved product name, the redesigned visual direction, the preselected starting formation and the build order for PNG export; see [the UI redesign handoff](../design/ui-redesign-handoff.md).
**Authority:** User decisions in the project conversation take precedence. This document separates agreed behaviour from remaining narrow edge decisions.

## 1. Purpose

Supporter XI lets a Manchester United supporter view the next match, choose a formation, select their starting XI, optionally assign player roles, and export an image. No supporter registration is required.

Core loop: next fixture → formation → eleven players → optional roles → PNG export.

## 2. Agreed scope

- Manchester United only, one featured fixture for supporters at a time.
- Exactly the 14 canonical formations and 25 optional roles already specified.
- Eleven unique players; any eligible player can occupy any slot regardless of real-world position.
- Responsive browser experience with mobile, desktop and keyboard support.
- Best-effort remembering of the current working lineup in the same browser.
- PNG export only: square 1080 × 1080, portrait 1080 × 1920 and landscape 1920 × 1080 (see section 6).
- Administrator backoffice for fixtures, squad and fixture availability.
- Predefined initial squad and fixture list; future fixtures may be maintained internally but are not supporter destinations.
- football-data.org for Premier League and Champions League fixture information. Domestic cups and missing fixtures are entered manually.
- Squad, shirt numbers, active/inactive state and availability are entirely manual; no squad or injury API.
- No database. GitHub-backed content and a publishing delay are accepted.

## 3. Fixture experience

Automatically feature the earliest Scheduled fixture with a confirmed kickoff whose kickoff + 120-minute boundary has not passed. At exactly that boundary, move to the next eligible fixture. A lineup can be built and changed until 15 minutes after kickoff; from then until the next fixture takes over it is locked: it can be viewed and shared as an image, not changed. (User decision, 10 October 2026, replacing kickoff + three hours with no lock.) This is not an archive system, and there is still no cutoff before kickoff.

Provide an explicit admin override to select the featured fixture, including a fixture whose kickoff is not yet known. An override is clearly visible in admin and remains until cleared. A Postponed or Cancelled fixture is not a buildable featured fixture; a stale override to one falls back to automatic selection and is flagged in admin.

Display opponent, home/away, competition/round when known, and localized kickoff with timezone. Unknown kickoff displays “Time to be confirmed”; do not invent midnight as a confirmed time. The admin can replace or correct dates and times. If no eligible fixture or usable override exists, show a clear no-upcoming-fixture state.

Do not offer future-fixture browsing, a public match archive, or results/statistics views.

## 4. Builder

Start with 4-2-3-1 Wide preselected and its eleven slots empty, unless restoring a valid local working lineup for the same fixture. The formation is changed from a control at the pitch that opens all 14 formations. Formation selection creates eleven empty slots. No automatic player or role selection.

Selecting a player removes them from the chooser. Replacing or removing a player returns them only if eligible. Moving onto an occupied slot swaps players; moving to an empty slot vacates the origin. Roles stay attached to occupied slots; vacated slots lose their roles.

Formation changes use exact, unique equivalence-key matches only. Preserve valid roles, clear incompatible roles and release unmatched players. Preview destructive consequences before confirmation; cancelling leaves the entire working state unchanged.

Clear XI retains the formation and removes all players and roles. No server save or submission action exists.

Roles remain optional; compatibility depends only on slot role family. The chooser includes No role and canonical names/definitions/order. No duties or tactical-balance scoring. In the builder an assigned role is shown in full beneath the player's marker; role abbreviations are not used.

New selections must be active and Available for the fixture. Active players are Available by default unless manually marked Unavailable. How a later availability change affects an already-selected browser lineup requires the narrow decision in the current register; do not import MVP+ saved-submission grandfathering by assumption.

## 5. Browser memory

Remember working state on this browser where storage is available. This does not identify a person, sync devices, create an account, or promise permanent storage. Browser clearing/private browsing may prevent restoration.

Do not carry a lineup silently into a different fixture. Recommended detail: retain only the current working fixture locally and offer a clear transition when the featured fixture changes; see application behaviour. Local state must be versioned and validated, never trusted merely because it was previously stored.

## 6. Sharing

Export one complete, structurally valid XI as PNG. Incomplete lineups cannot produce a final sharing image. Include the fixture (Manchester United v opponent), formation, players and pitch. By the user's decision of 9 October 2026 the image does not print competition, round, venue or kickoff, and it carries the line "Build your own XI at supporterxi.com". Roles remain in the builder but are excluded from every PNG format, as in the original approved export requirement.

Sizes decided by the user on 9 October 2026: Square 1080 × 1080 and Portrait 1080 × 1920 use a bird's-eye pitch; Landscape 1920 × 1080 uses the landscape pitch of the desktop builder. The earlier 4:5 size (1080 × 1350) was replaced by Square. The entry point in the builder is labelled "Share your XI".

PNG export is built only after the UI redesign is finished.

No shareable lineup URLs, URL-encoded lineups, URL shortener, uploaded image storage or personalized link previews. Download is the baseline; native file sharing may be used where supported without being the only delivery method.

Use original visual assets. No club crests, player photographs or licensed kit reproductions. The approved product name is **Supporter XI** (approved 9 October 2026), with the pill logo recorded in the UI redesign handoff. The user had supporterxi.com printed on the share image (9 October 2026); the domain is not yet connected to the site.

## 7. Administration and imports

Only the administrator signs in. Supporters never do.

Admin can create/edit fixtures; set status, opponent, home/away, competition, round and confirmed or unknown kickoff; select/clear the featured override; create/edit/deactivate/reactivate players; and mark fixture availability. No destructive player/fixture delete, formation CRUD or role CRUD.

Fixture import updates eligible non-overridden fields. Explicit manual corrections remain until explicitly cleared, even if an import disagrees. Imports preserve internal identities and never guess ambiguous fixture matches. Manual cup fixtures coexist with imported fixtures.

The free provider's schedule delay has no verified published maximum. The user accepts this limitation. Failed or delayed imports preserve the last accepted content; manual correction remains available. The site must not require a working API response for each visitor.

Publishing is asynchronous: saving content is distinct from a successful public deployment. Admin must show pending, successful and failed publishing states accurately. A short publishing delay is accepted.

## 8. Visual/accessibility direction

The 9 October 2026 redesign replaces the earlier tactical-whiteboard, top-down direction. Details, measurements and reference files are in [the UI redesign handoff](../design/ui-redesign-handoff.md).

- Dark page. The fixture is the dominant element: a large, bold headline with Manchester United in red, "v" in grey and the opponent in white, and smaller fixture details beneath it.
- Desktop: a realistic grass pitch shown in perspective from the touchline at the halfway line, full pitch, with the team attacking left to right.
- Empty positions are red markers on the pitch. A filled position is a red pill with the shirt number and surname, the same size everywhere on the pitch, with the role in full beneath it.
- The squad is a full-width row below the pitch, showing shirt number and surname.
- One red is used throughout; the share action is yellow.
- Mobile: a bird's-eye portrait pitch. The mobile layout is not yet designed.

Desktop supports drag and click placement; mobile supports the complete loop through tapping; keyboard supports all core operations. Visible focus, meaningful non-colour states, clear error announcements, reduced motion and WCAG 2.2 AA targets remain.

## 9. Explicit exclusions / MVP+

Accounts, persistent user submissions, cross-device sync, Community XI, voting/aggregation, public lineup links, personal/public archives, T-90 locking, notifications, results, official XIs, statistics, substitutes, profiles/social features, team instructions and monetization are excluded.

Retaining old MVP+ documentation does not authorize speculative architecture or UI for these features.

## 10. Acceptance

The current verification contract defines MVP-01 through MVP-15. The former AC-01–27 and AR tests remain in the preserved MVP+ set; only the explicit catalogue/role applicability mapping in current verification governs this release.
