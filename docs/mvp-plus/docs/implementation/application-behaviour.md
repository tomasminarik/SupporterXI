# Application behaviour contract

**Status:** Implementation supplement to the approved PRD  
**Purpose:** Make approved behaviour testable without selecting architecture or visual design.

This document adds operational detail only. If it conflicts with the PRD, the PRD wins and the conflict must be reported.

## 1. Time and fixture action state

All comparisons use the authoritative fixture instant and server time.

For a Scheduled fixture with kickoff `K` and current time `N`:

| Condition | Lifecycle | Submission action |
| --- | --- | --- |
| `N < K - 90 minutes` and fixture is active | Editable | First save and replacement allowed |
| `K - 90 minutes <= N < K + 180 minutes` | Locked | Save and replacement rejected |
| `N >= K + 180 minutes` | Archived | Save and replacement rejected |
| Status is Postponed or Cancelled | No timed lifecycle | Save and replacement rejected |
| Scheduled but not the active fixture | Computed lifecycle may be pre-lock | Save and replacement rejected because only the active fixture accepts submissions |

Boundary instants are inclusive on the later state. A request accepted before the boundary may succeed. A request received or committed at or after the boundary must fail atomically.

The active fixture is recalculated from current authoritative fixture data. It is the earliest Scheduled fixture whose archive threshold has not passed. A Locked fixture remains the primary experience until its archive threshold. When fixture ordering changes, a previously active fixture can stop accepting saves even if its kickoff remains more than 90 minutes away.

Archive membership is derived from current state rather than being an irreversible flag. If a kickoff correction moves an Archived fixture back into the future, the same fixture and saved submissions reopen only when it is both Editable and active.

## 2. Landing states

| State | Required behaviour |
| --- | --- |
| Loading | Show a neutral fixture-loading state. Do not render placeholder opponent or kickoff data as real. |
| Active Editable | Show fixture context and `Build my XI` as the primary action. Community XI is secondary. |
| Active Locked | Show the locked fixture as primary, make saved and Community views read-only, and explain that submissions are closed. |
| No active fixture | State that no upcoming fixture is available and keep public and personal archive access where applicable. |
| Fixture load failed with previously accepted data | Continue with the last accepted schedule and avoid implying that a refresh just succeeded. |
| Fixture load failed without usable data | Show an error with retry. Do not invent a fixture. |

For an authenticated user, the most recent prior saved lineup is a secondary landing action only when one exists. Its absence requires no empty card.

## 3. Builder state

### 3.1 Entry

- Start with no formation, no players, and no roles unless loading a saved lineup or an implementation chooses to restore an unsaved local working lineup.
- Loading an existing saved lineup creates a working copy. Editing the working copy does not alter the saved submission until Save succeeds.
- A formation creates exactly eleven empty slots. No player or role is chosen automatically.
- An incomplete lineup remains editable. Save and final PNG export stay unavailable.

### 3.2 Slot operations

| Operation | Player result | Role result |
| --- | --- | --- |
| Put an available player in an empty slot | Slot becomes occupied; player leaves available list | Existing empty-slot role must be `null` |
| Replace an occupied slot from the available list | New player occupies slot; former player returns if eligible | Valid role stays attached to the occupied slot |
| Move a selected player to an empty slot | Destination receives player; origin becomes empty | Destination keeps its own valid role if any; origin role clears because empty slots cannot hold roles |
| Move a selected player onto an occupied slot | Players swap slots | Roles stay with their original slots |
| Remove a player | Slot becomes empty; player returns only if currently eligible | Slot role clears |
| Clear XI | All slots empty; formation retained | All roles clear |

A duplicate placement must be prevented during the operation, not discovered only at Save.

If an operation encounters invalid stored role data, do not guess a replacement role. Follow the safe invalid-data behaviour in `data-integrity-and-community.md`.

### 3.3 Formation change

Compute the result before mutating the working lineup.

- Transfer a player only when source and destination each contain the same `equivalenceKey` exactly once.
- Do not use coordinate proximity, registered player position, or role similarity as fallback matching.
- Preserve a role only when it remains valid for the destination `roleFamily`.
- Return unmatched players to the available list only if they are currently selectable. Otherwise remove them from the working XI without placing them in the selectable list.
- If any player will be unassigned or any role cleared, show the consequences before confirmation.
- Cancelling the confirmation leaves formation, players, and roles unchanged.
- Confirmation applies the complete change once. It must not leave an intermediate mixed formation state.

### 3.4 Availability changes while open

The UI may show the state it loaded, but Save always revalidates current authoritative eligibility.

A currently unavailable or inactive player is grandfathered only when that same player belongs to the user's canonical saved submission for the same fixture and remains selected in the new working XI. Moving or swapping that player without removing them does not end grandfathering. Once removed, they cannot be newly selected while ineligible.

## 4. Authentication and saving

### 4.1 Anonymous save transition

1. Preserve the complete working lineup in the current browser session.
2. Start authentication.
3. On cancellation or failure, return to the unchanged working lineup and create no submission.
4. On success, reload the authoritative user, fixture, saved-submission, player, formation, and role state.
5. If no prior submission exists and validation passes, save.
6. If a prior submission exists, show the saved lineup versus replacement choice. Do not overwrite silently.
7. Confirming replacement revalidates again and performs one atomic replacement.
8. Cancelling replacement leaves the canonical saved submission unchanged and keeps the new working lineup in the current session where possible.

Authentication method, provider, and session technology remain architecture decisions.

### 4.2 Save outcomes

| Outcome | Required UI result |
| --- | --- |
| Success | Mark the working state as saved only after authoritative confirmation; update the stable public-link destination and Community data. |
| Retryable service or network failure | Keep the working XI, keep the prior saved submission canonical, show retry. |
| Fixture locked, postponed, cancelled, or no longer active | Keep the XI visible read-only, explain the new fixture state, and do not retry automatically. |
| Player newly ineligible | Identify each affected player and return to editing. |
| Invalid or retired formation or role | Reject without partial persistence and explain that the lineup must be corrected or reloaded. |
| Authentication expired | Preserve the working XI and request authentication again. |

Concurrent browser sessions use last successfully accepted complete save. The response shown by an older session must not imply that it remains canonical after a later accepted save.

## 5. Community XI states

| State | Required behaviour |
| --- | --- |
| Loading | Use a dedicated loading state, not eleven placeholder players that resemble results. |
| Zero submissions | Show a clear empty state, total `0`, and no formation or fabricated players. |
| One or more submissions | Show the winning formation, XI, slot percentages, total fixture submissions, and submissions using the winning formation. |
| Calculation unavailable, no prior result | Show an error and retry without blocking the user's own lineup. |
| Calculation unavailable, prior result exists | It may show the last confirmed result only when clearly labelled as not refreshed. |
| Locked or Archived | Read-only and stable. |
| Reopened after schedule change | Return to live recalculation from the same canonical submissions. |

The unresolved duplicate-player outcome is documented in `open-product-decisions.md`. Do not ship Community XI selection until that rule is approved.

## 6. Archive and public lineup states

- The public fixture archive contains fixtures whose current lifecycle is Archived. Cancelled fixtures must not be presented as completed matches.
- A user's personal archive includes their preserved submissions, including Postponed or Cancelled status where relevant.
- If a historical fixture reopens, its saved lineup becomes editable only when that fixture is active and before T-90.
- An empty personal archive shows a simple empty state and a route back to the active fixture.
- Archive and public-link load failures show retry without substituting current mutable player data.
- An unknown public lineup identifier shows not found and no owner information.
- A stable public lineup URL exists for every saved submission and reflects its current canonical replacement content.
- Public pages never expose owner identity, account metadata, edit controls, or links to the owner's other submissions.

## 7. Sharing and export

### 7.1 Public URL

- URL sharing is available only for a successfully saved lineup.
- Copying or system-sharing the URL does not create a second lineup or immutable version.
- Replacing the lineup updates the content behind the same URL.
- If sharing fails, keep the URL available for manual copy where the platform permits.

### 7.2 PNG export

- Export reads one complete validated working or saved lineup snapshot at the moment export begins.
- Required outputs are exactly 1080 x 1350 and 1080 x 1920 PNG.
- Roles are absent from the image even when present in the lineup.
- The image contains fixture context, formation, players, pitch, and approved product branding only.
- No club crest, licensed kit, or player photograph may enter the rendered image.
- Export failure shows retry and does not modify or save the lineup.
- Download and platform share are delivery choices. At least one way to obtain the PNG is required in supported browsers.

## 8. Responsive and accessible interaction

No exact breakpoints or final layout composition are approved. Codex may propose them during interaction design, but the following behaviour is fixed:

- Mobile must support tap slot, choose player, replace, move, remove, assign role, change formation, clear, save, view Community XI, share, and export without drag.
- Desktop must support both drag placement and a non-drag select flow.
- Keyboard users must be able to complete the whole core loop, including moving and replacing players.
- A selected slot must remain identifiable when the player chooser or role chooser opens.
- Narrow layouts may move player and role controls into sheets or panels, but the pitch and eleven slots remain the same conceptual model.
- No essential state is hover-only or colour-only.
- Focus returns to a sensible control after closing a chooser or confirmation.
- Dynamic notices for cleared roles, save errors, and lifecycle changes must be available to assistive technology.
- Reduced motion must not hide state transitions or required feedback.

## 9. Administration behaviour

- Admin routes require server-side authorization. Hiding links is not authorization.
- Fixture and player lists each need loading, empty, error, and successful states.
- Create and edit forms retain entered values after validation or service failure.
- Kickoff entry must include an explicit timezone or offset and store an unambiguous instant. Never accept an unlabelled local time.
- Imported values and manually overridden values must be visually distinguishable per field.
- Clearing an override requires confirmation of the imported value that will resume, when one exists.
- An import failure preserves all accepted fixture and override data and is visible to the administrator without producing a public failure banner.
- Players and fixtures have no MVP delete action. Players are deactivated; fixtures use Scheduled, Postponed, or Cancelled status.
- Formation and role CRUD must not appear.
- Fixture availability exposes only Available and Unavailable for active players.
- Admin writes that fail or conflict must not display success or silently overwrite a more recent accepted change.
