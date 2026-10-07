# MVP application behaviour

**Updated:** 22 September 2026. Supplements the current PRD only.

## Fixture selection and changes

- A read-only server endpoint selects the featured fixture using server time and the current published content revision. Do not cache the response across the next rollover boundary.
- Without a valid override: Scheduled + confirmed kickoff + current time earlier than kickoff plus three hours; order by kickoff, then stable fixture ID.
- A valid override selects a Scheduled fixture, including unknown kickoff; it persists until cleared. Admin identifies that automatic selection is overridden.
- Unknown kickoff is never inferred from a placeholder time. Admin supplies an explicit timezone/offset for confirmed timestamps.
- On browser focus and at the known rollover boundary, refresh featured-fixture context. This is a presentation refresh, not a save cutoff.
- Recommended transition: inform an open builder that the featured match changed and let the user explicitly start the next match. Do not relabel the existing XI or silently discard work. An already-open XI may still export its captured match context; it creates no archive or destination for selecting old matches.
- Refresh failures keep already loaded content with honest stale/error feedback. Initial failure without data shows retry; no invented fixture.

## Builder operations

| Action | Players | Roles |
| --- | --- | --- |
| Place | Eligible unused player fills empty slot | No default role |
| Replace | Former occupant released if eligible | Valid slot role retained |
| Move to empty | Origin empty, destination occupied | Origin clears; destination has no inherited role |
| Swap | Occupants exchange slots | Roles remain with slots |
| Remove | Player released if eligible | Slot role clears |
| Clear | All slots empty; formation retained | All roles clear |

Formation changes compute an entire proposed state from canonical equivalence keys before mutation. Warn about dropped players/roles; cancellation preserves state. Invalid roles never map to similar labels. New selections respect published availability; retained-player behaviour after availability edits is pending M-02.

## Local memory

Use a versioned localStorage record for the current working XI, keyed to stable fixture identity, with content/catalogue versions and enough context to detect a fixture change. Persist after edits when possible. Catch disabled storage, quota errors and malformed data; the builder still works in memory.

Validate restored slot sets, unique player IDs and compatible role IDs. Do not infer unknown records by similar names. Offer reset/recovery for an unreadable draft. No background server upload, tracking identity, draft history or synchronization.

An incomplete XI can be remembered. Export requires completeness. Cross-tab synchronization is not promised; avoid claiming multi-device or multi-tab canonical saves.

## PNG export

Capture an immutable in-memory snapshot when export starts. Await local font/assets before rendering. Generate exactly the selected dimensions and a real PNG. Exclude role names and role indicators. Export failure preserves the working XI and offers retry. Test browser download on mobile Safari and Android Chrome; system sharing is optional.

## Admin

Server authorization protects editor reads and writes. Keep entered form values on failures. Publish includes shared-data validation and a content-revision check; stale edits request reload/reconciliation rather than overwriting newer values.

Show imported value, manual override and effective value per fixture field. Clearing one override must not clear others; preview the value that will resume. Show last successful import and failure details privately. Do not display provider secrets.

Saving a Git commit is not proof that public content is live. Show deployment pending/completed/failed; a failed build leaves the preceding public revision in service.

## Required states

Loading, empty, success, retryable failure, invalid input and stale content must be exercised for fixture loading, builder restore, player chooser, export, admin forms, import and publishing. No fictitious placeholder opponents or players. Dialogs manage focus and restore it on close; dynamic errors and changes are announced to assistive technology.
