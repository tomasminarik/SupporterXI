# Data integrity and Community XI contract

**Status:** Implementation supplement to the approved PRD  
**Purpose:** Define persistence meaning and deterministic calculations without prescribing a database or API design.

## 1. Stable identity

Use stable, opaque identity for users, fixtures, players, saved submissions, formations, roles, and public lineup links.

- Names, labels, shirt numbers, kickoff values, and external-provider identifiers are not internal identity.
- A saved submission is uniquely owned by one user and one fixture.
- Enforce at most one canonical saved submission per user and fixture with a server-side uniqueness guarantee.
- A public lineup identifier remains attached to that canonical submission across replacements and fixture rescheduling.
- External fixture identifiers may assist import matching but cannot replace an internal fixture identity.

## 2. Canonical versus working data

A browser working lineup is not a submission and never contributes to Community XI.

A successful first save or replacement must commit one complete valid lineup atomically. Any failure leaves the prior canonical submission and Community input unchanged. There is no partial save of formation, players, or roles.

The saved submission records:

- owner and fixture identity
- formation ID and historical formation label
- exactly eleven slot assignments keyed by canonical slot ID
- player identity plus historical name and shirt-number display values for every assignment
- role ID or `null` plus a historical role label when a role is present
- creation timestamp retained across replacements
- most recent successful save timestamp updated on replacement

Historical display must be reconstructable without current mutable player, formation, or role labels. Current records may provide links and validation context, but they cannot be the sole source of historical copy.

## 3. Save validation

Validate in one authoritative operation immediately before commit:

1. requester is authenticated;
2. fixture exists, is Scheduled, is active, and is before T-90 by server time;
3. formation ID is canonical and active in the approved catalogue;
4. submitted slot set exactly equals the formation's eleven slot IDs;
5. every slot has one player and players are unique;
6. each new player selection is active and Available for the fixture;
7. an ineligible player is accepted only under the grandfathering rule for that user's prior canonical submission;
8. each role is `null` or a known canonical role compatible with the slot's `roleFamily`;
9. the request is committed as a complete first save or complete replacement;
10. a replacement cannot produce a second Community contribution.

Never trust client-provided labels, coordinates, role compatibility, lifecycle state, owner identity, percentages, or Community totals.

## 4. Grandfathered player eligibility

For a replacement submission, define `grandfatheredPlayerIds` as the player IDs in the user's immediately previous canonical saved submission for the same fixture.

A currently inactive or Unavailable player may remain anywhere in the replacement XI only if their ID is in that set. This permits safe formation changes, moves, and swaps. It does not permit re-adding the player through the available-player chooser after they have been removed from the working XI.

For a first save there is no grandfathered set. Every player must be currently active and Available.

## 5. Fixture lifecycle data

- Store kickoff as an unambiguous instant when the fixture is Scheduled.
- Compute Editable, Locked, and Archived from schedule status, kickoff, server time, and active-fixture selection. Do not trust a stored client lifecycle label.
- Postponed and Cancelled block writes regardless of an old kickoff value.
- A kickoff or status change invalidates cached action state immediately.
- Reopening a fixture keeps its internal identity, saved submissions, public URLs, and original submission creation times.
- When reopened, Community XI derives again from current canonical submissions and freezes again at the new T-90 boundary.

The meaning of kickoff storage for a Postponed fixture without a replacement time is still open. See `open-product-decisions.md`.

## 6. Import and manual overrides

Track provenance and override state per imported fixture field, not only per fixture.

- An accepted import may update only fields without a manual override.
- A manual edit marks that field overridden even when its new value happens to equal the imported value.
- Clearing an override resumes the latest accepted imported value when available.
- Import failure never clears a field, fixture, manual value, or override marker.
- One refresh must not create a duplicate fixture merely because a mutable field such as kickoff, round, or opponent spelling changed.
- If automated matching cannot identify a fixture confidently, surface it for admin resolution rather than merging or duplicating silently.
- A manually created fixture that later appears in the provider feed requires explicit reconciliation unless the technical plan can prove stable identity safely.

Provider choice, refresh scheduling, matching implementation, and reconciliation UI belong to later architecture and admin design.

## 7. Community XI input set

For a fixture, the input is the current canonical saved submission for each user who has one. Later squad or availability changes do not invalidate an already saved submission.

Exclude:

- anonymous working lineups
- incomplete or failed saves
- superseded replacement content
- submissions for another fixture
- structurally corrupt submissions that fail the saved-lineup invariants

Corrupt data must be observable to administrators or operators. It must not be silently repaired into a different tactical choice.

## 8. Community XI calculation

The approved portion of the algorithm is:

1. Count canonical submissions by formation ID.
2. Choose the formation with the largest count.
3. Break a formation tie by the `displayOrder` in `formations.md`.
4. Restrict slot voting to submissions using that winning formation.
5. For each slot, count assignments by player ID.
6. For a tied slot count, prefer the player with the greater number of selections anywhere in all canonical submissions for the fixture. A player contributes at most one to that total per submission because saved lineups contain unique players.
7. If still tied, prefer the lower historical shirt number selected under OD-04.
8. If still tied, compare the historical player names selected under OD-04 alphabetically using one documented locale-insensitive normalization.
9. If still tied after identical normalized names, use stable player ID as the final technical tie-break so output remains reproducible.
10. Calculate a displayed slot percentage as `slot votes for selected player / submissions using winning formation`.

Retain integer numerator and denominator as the source values. Percentage rounding and visual formatting are presentation choices and must not alter ranking.

Report:

- total canonical submissions for the fixture across all formations
- canonical submissions using the winning formation
- winning formation
- selected player and numerator/denominator for each slot

The calculation is deterministic only after the duplicate-player and historical tie-value decisions in `open-product-decisions.md` are approved. The current independent slot winners can select one player for multiple slots, and one player can have more than one saved display snapshot within the fixture window.

## 9. Live, frozen, and rebuilt results

- During Editable, a successful first save or replacement makes a new Community result available from the complete post-commit input set.
- During Locked and Archived, the result is read-only and must be reproducible from retained canonical submissions and historical snapshots.
- A stored aggregate is a cache or historical snapshot, not the source of truth for future analysis.
- If a fixture reopens, any frozen marker no longer controls display. Recalculate from the same current canonical submissions.
- If a calculation fails, do not label an older result as current. User lineup reads and writes remain independent when their own requirements are satisfied.

## 10. Catalogue integrity

Formation and role data are application-owned canonical configuration in MVP.

- Validate the formation JSON exactly as required by `formations.md`.
- Validate role IDs, order, definitions, and compatibility against `player-roles.md`.
- Generate runtime data from the canonical source or enforce automated parity. Do not maintain two unchecked copies.
- A catalogue change must not mutate historical display.
- Unknown IDs must never map by label similarity, coordinate proximity, or another heuristic.
- A structurally valid historical lineup with complete snapshots remains renderable when its current player or catalogue record is absent.
- If required historical snapshot data is missing or structurally inconsistent, fail the affected lineup or aggregate safely and expose an operational error. Do not substitute current labels or fabricate tactical data.

## 11. Administrative integrity

- Fixture, player, and override writes require authenticated admin authorization on the server.
- Player deactivation and fixture cancellation preserve all referenced submissions and snapshots.
- Do not hard-delete fixtures or players through MVP administration.
- Prevent stale admin writes from silently replacing newer accepted changes.
- Record enough timestamps and provenance to diagnose import versus manual changes.
- Treat fixture times as timezone-aware instants through import, editing, lifecycle evaluation, and display.

Active-player shirt-number uniqueness remains an open product rule. See `open-product-decisions.md`.
