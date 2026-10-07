# Shared published content

`shared.json` is the one editable source for squad, fixtures, featured selection and fixture availability. It is compiled into a deployment; visitors never fetch GitHub or football-data.org. No supporter lineup belongs in this file.

The original 36-player seed moved here unchanged. `npm run content:generate` produces the public squad projection. `npm run validate` rejects stale projections, malformed content, duplicate IDs/provider mappings and unresolved references. Active status and final admin number validation are intentionally not implemented; do not infer them from this foundation schema.

Each fixture has an opaque UUID `id`, a `source` (`{ "kind": "manual" }` or a football-data.org source with a numeric-string `providerId`), `values`, and per-field `overrides`. Values contain opponent, home/away venue, nullable competition/round, scheduled/postponed/cancelled status, and kickoff. Confirmed kickoff uses `{ "kind": "confirmed", "at": "ISO timestamp with Z or offset" }`; unknown kickoff uses only `{ "kind": "unknown" }`. Never use a placeholder timestamp for unknown kickoff.

`overrides` wins field by field, including explicit nulls and unknown kickoff. Clearing one key resumes that field's value without clearing other corrections. Only schema and effective-value resolution exist in this slice; import/write endpoints remain future authenticated work.

`featuredFixtureId` is null for automatic selection. A scheduled override persists, including with unknown kickoff. Postponed/cancelled overrides fall back to automatic selection; the selector reports a stale override for the future admin UI. Root references must resolve.

`fixtureAvailability` entries reference fixture/player UUIDs and an explicit available/unavailable status. This slice validates references only. It does not implement player-state eligibility or M-02 reconciliation.

The public API returns only the selected effective fixture, content SHA-256 fingerprint, server time and next rollover time. The fingerprint identifies a published document; it is not a Git concurrency token. Future admin writes must check the Git blob revision and authorization independently.

No real fixture has been supplied. Keep `fixtures` empty until approved content is provided. Synthetic fixtures are restricted to tests; they must not be copied into the public document.
