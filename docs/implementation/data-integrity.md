# MVP data integrity

**Updated:** 22 September 2026.

## Storage responsibilities

- GitHub stores versioned shared content: fixtures, provider IDs/values, manual field overrides, players, fixture availability and the featured-fixture override.
- The browser stores one best-effort working XI. There is no remote supporter identity, lineup table, database or Community input.
- Formation and role configuration each have one canonical runtime source with automated document parity checks. Generated server/client artifacts are not independently maintained catalogues.

## Shared content validation

Use stable internal IDs independent of names, shirt numbers, kickoff timestamps and provider identifiers. Maintain a unique provider-to-fixture mapping. References must resolve; imported and effective data must follow the same schema. Confirmed kickoffs are timezone-aware instants; unknown and postponed times must not masquerade as confirmed ones. Keep last-known timestamps as administrative context when appropriate.

Admin and import mutations require server authorization, schema validation and optimistic concurrency against the Git content revision. Publish related fields atomically in one Git change. Build-time validation is an additional gate, not a replacement for server write validation. Reject invalid or conflicting updates without partially changing shared content.

M-01 was approved on 8 October 2026: Active players require unique integer shirt numbers 1–99; only Inactive players may omit a number. See the decision register.

## Imports

Use football-data.org only for supported United Premier League/Champions League fixtures. Store the provider's stable ID and provenance. Repeated imports are idempotent. Only non-overridden fields change; clearing an override resumes the latest accepted imported value if available. Unknown/ambiguous identity is flagged for admin resolution, never merged by opponent/date guesses. Provider errors, malformed payloads or missing records never erase accepted content. Absence from a feed does not imply cancellation.

Manual cup fixtures retain identity. If they later appear in a feed, require explicit reconciliation before linking. Requests never originate from each supporter browser. Keep the API token server-side and redact logs.

## Browser integrity and export

Validate canonical formation/slot membership, eleven unique players for export, and compatible optional roles. Browser data is untrusted, including restored JSON. Render names as text, not markup; never execute content from files or drafts. Approved M-02 retains existing same-fixture selections through availability changes and allows eventual export, but blocks re-addition after removal.

An export uses one coherent snapshot, including labels and fixture context, so edits during rendering do not mix versions. There is no requirement for historical server snapshots or immutable public pages. Git content history is operational recovery, not a supporter archive.

## Recovery

Keep deployable previous content revisions and document restoration through Git. Private secrets do not belong in content or exported files. Failed validation/deployment retains the previous live site. Restoring content must not accidentally restore leaked/revoked credentials or clear unrelated manual corrections.
