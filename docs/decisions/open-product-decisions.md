# Current MVP decision status

**Updated:** 22 September 2026.

## Agreed

The former scope is MVP+. Current MVP retains formations, roles, PNG export, browser memory and administration; excludes supporter accounts, Community XI, shareable links, archives and T-90 locking. The homepage advances at kickoff plus three hours with a manual featured-fixture override. GitHub-backed content and publishing delay are accepted. football-data.org supplies covered Premier League/Champions League fixtures; provider delay is accepted. Squad/availability and domestic cup fixtures are manual.

The original OD register is [preserved here](../mvp-plus/docs/decisions/open-product-decisions.md). OD-01 and OD-04 are deferred with Community XI, not approved. Account save-failure and commit-cutoff discussions are irrelevant to this release.

## Narrow behaviour details requiring confirmation before affected implementation

These do not block project setup, catalogue work or builder interaction design. Earlier conversation said there were no remaining blockers; this audit corrects that overstatement: removing accounts does not itself choose these player policies.

### M-01 — active-player shirt numbers (carried from OD-03)

**Recommendation:** Active players have unique integer numbers 1–99; allow an absent number only for Inactive players. Historical/local identity never uses a shirt number.
**Alternative:** Permit duplicate active numbers, using stable IDs/names to distinguish players.
**Approval status:** Not explicitly selected in the conversation. Blocks final player-form validation, not the catalogue or editor shell.

### M-02 — availability changes to an existing browser XI

MVP+ protected a previously saved submission. Current MVP has no such submission, so that exact rule cannot be inherited.

**Recommendation:** Keep a previously selected player in the same locally remembered fixture XI when they later become inactive/unavailable; allow export, but prevent re-adding after removal. Moves/swaps preserve selection. Treat this as a browser convenience, not secure submission eligibility.
**Alternative:** Keep the player visible but require replacement before PNG export once current published data marks them ineligible.
**Approval status:** New edge rule needing confirmation before availability reconciliation and related export validation. No player should be silently replaced.

## Non-blocking recommendations

- On a featured-fixture change, keep the open XI's context until the user explicitly starts the next fixture. Do not silently carry selections across fixtures.
- Use only a neutral working title until branding is approved. Naming research is missing; Eleven Verdict is not an approved name.
- Exact responsive composition, copy, list ordering and export frame are design work; present a coherent recommendation during the UI phase.

## Technical follow-through

Architecture and selected integration mechanisms are documented separately. Free API coverage, admin GitHub authorization, deployment permissions and provider credentials require setup/testing, not additional product features. No paid plan is authorized by this record.
