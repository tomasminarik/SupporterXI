# Current MVP decision status

**Updated:** 22 September 2026.

## Agreed

The former scope is MVP+. Current MVP retains formations, roles, PNG export, browser memory and administration; excludes supporter accounts, Community XI, shareable links, archives and T-90 locking. The homepage advances at kickoff plus three hours with a manual featured-fixture override. GitHub-backed content and publishing delay are accepted. football-data.org supplies covered Premier League/Champions League fixtures; provider delay is accepted. Squad/availability and domestic cup fixtures are manual.

The original OD register is [preserved here](../mvp-plus/docs/decisions/open-product-decisions.md). OD-01 and OD-04 are deferred with Community XI, not approved. Account save-failure and commit-cutoff discussions are irrelevant to this release.

## Narrow behaviour details requiring confirmation before affected implementation

These do not block project setup, catalogue work or builder interaction design. Earlier conversation said there were no remaining blockers; this audit corrects that overstatement: removing accounts does not itself choose these player policies.

### M-01 — active-player shirt numbers (approved 8 October 2026)

**Recommendation:** Active players have unique integer numbers 1–99; allow an absent number only for Inactive players. Historical/local identity never uses a shirt number.
**Alternative:** Permit duplicate active numbers, using stable IDs/names to distinguish players.
**Approval status:** Explicitly approved on 8 October 2026. Active players require unique integer numbers 1–99. Only Inactive players may have no number. Stable UUIDs remain independent of numbers.

### M-02 — availability changes to an existing browser XI (approved 7 October 2026)

MVP+ protected a previously saved submission. Current MVP has no such submission, so that exact rule cannot be inherited.

**Recommendation:** Keep a previously selected player in the same locally remembered fixture XI when they later become inactive/unavailable; allow export, but prevent re-adding after removal. Moves/swaps preserve selection. Treat this as a browser convenience, not secure submission eligibility.
**Alternative:** Keep the player visible but require replacement before PNG export once current published data marks them ineligible.
**Approval status:** User explicitly approved the recommendation on 7 October 2026. Preserve existing same-fixture selections through inactive/unavailable changes, allow eventual PNG export, and prevent re-adding once removed. Moves/swaps retain the selection; no player is silently replaced.

## Initial squad activation — approved 7 October 2026

The user explicitly approved all 36 supplied players starting Active, with Available as the fixture default until manually changed. This does not decide M-01.

## Non-blocking recommendations

- On a featured-fixture change, keep the open XI's context until the user explicitly starts the next fixture. Do not silently carry selections across fixtures.
- The product name **Supporter XI** was approved by the user on 9 October 2026, superseding the neutral working title. Eleven Verdict is not an approved name. No domain is approved.
- UI slice 1 decisions (9 October 2026, user): automatic label placement for collisions, the single red changed to `#da362e` for AA contrast, and the proposed picking, pill-menu and formation-picker interactions. See [UI slice 1 verification](../implementation/ui-slice-1-verification.md).
- Decided by the user on 9 October 2026: export sizes are Square 1080 × 1080, Portrait 1080 × 1920 and Landscape 1920 × 1080; the image carries "Build your own XI at supporterxi.com" and no competition, venue or kickoff line. Decided 10 October 2026: lineups lock 15 minutes after kickoff and the next fixture takes over at 120 minutes (was three hours, no lock). Still open: supporterxi.com is not yet connected to the site (Codex). Also decided that day: the logo reads "Supporter XI" (disc last); the manual accessibility pass is optional; search indexing starts when the domain is connected.
- Exact responsive composition, copy, list ordering and export frame are design work; present a coherent recommendation during the UI phase.

## Technical follow-through

Architecture and selected integration mechanisms are documented separately. Free API coverage, admin GitHub authorization, deployment permissions and provider credentials require setup/testing, not additional product features. No paid plan is authorized by this record.

## Release and administration decisions — 10 October 2026

The user approved the rebuilt frontend and current PRD, requested Ant Design for administration, and waived the real alternate-account sign-in drill (no second account is needed). The single configured GitHub administrator and all server authorization/validation tests remain required. supporterxi.com was purchased through Websupport.sk; connecting that domain and preparing launch are authorized. Claude is preparing the design system in read-only mode during this implementation.

The user approved Unavailable until cleared across all matches for long-term injuries, with match-specific Available/Unavailable exceptions. Use default removes an exception. Clearing ongoing unavailability does not clear explicit match exceptions. Active status and M-02 are unchanged.
