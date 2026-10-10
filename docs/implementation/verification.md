# Current MVP verification contract

**Updated:** 22 September 2026. Replaces the original release gates preserved under MVP+.

| ID | Required proof | Cheapest reliable level |
| --- | --- | --- |
| MVP-01 | Exactly 14 formations/11 slots each; JSON/table parity, unique IDs/keys, mirrors, coordinate ranges, order; 25 roles with exact labels/definitions/order and compatibility parity | Unit/build validation |
| MVP-02 | Start with 4-2-3-1 Wide preselected and eleven empty slots (PRD 2.1); any eligible player in any slot; no duplicate for click/tap/drag/keyboard; no automatic selection | Unit + browser |
| MVP-03 | Move, swap, replace, remove and Clear XI have prescribed player/role outcomes | Unit + browser |
| MVP-04 | Formation changes use equivalence keys only; destructive confirmation and cancellation; invalid roles clear with notice | Unit + browser |
| MVP-05 | Roles optional; No role option; exact family filtering; unknown IDs never guessed; no duty UI | Unit + browser |
| MVP-06 | Same-fixture local restoration; no silent cross-fixture carryover; malformed/version-mismatched/disabled/quota-exceeded storage handled without crashing | Unit + browser |
| MVP-07 | Automatic selection immediately before/at kickoff+120 minutes; lineups locked from kickoff+15 minutes until then (user decision, 10 October 2026), updated kickoffs, local timezone/DST, no T-90 restriction, unknown kickoff and manual override, cancelled/postponed exclusion, no fixture state | Unit + server integration + browser |
| MVP-08 | Incomplete export rejected; exact 1080×1080, 1080×1920 and 1920×1080 PNG (sizes decided 9 October 2026); required content; no roles/prohibited imagery; snapshot isolation; download and retry on supported mobile/desktop browsers | Image inspection + browser |
| MVP-09 | Anonymous/non-allowlisted callers cannot access privileged editor data or mutate via direct routes; OAuth/session/CSRF protections; secrets absent from browser bundles and logs | Server integration + browser |
| MVP-10 | Fixture/squad/availability forms validate; timezone required; stale edits rejected; stable identities; no destructive delete or formation/role CRUD; M-01/M-02 approved before dependent checks | Unit + integration + browser |
| MVP-11 | Provider fixtures map once; repeated imports idempotent; per-field overrides persist; clear-one affects only one; manual cups coexist; ambiguity flagged; errors/missing data never erase accepted content | Recorded provider fixtures + integration |
| MVP-12 | Commit success distinguished from live deployment; conflicts and build failures do not report live success; last good site remains; content rollback exercised; preview cannot write production | Integration + deployment smoke test |
| MVP-13 | Keyboard completes build/roles/export; desktop drag has alternatives; mobile requires no drag; focus/dialog/error behaviour, zoom, contrast, reduced motion and screen-reader core journey | Browser automation + manual accessibility |
| MVP-14 | No accounts, Community, public lineup links, archives, future-fixture browsing or unrequested statistics; no browser upload of lineups; provider not called per visitor | Route/network review + browser |
| MVP-15 | Manual refresh and scheduled refresh share validation; invalid scheduler credentials rejected; retries bounded; no-change import creates no commit; failed refresh preserves site; deployment attribution verified | Integration + operational smoke test |

## Role-spec applicability

Keep catalogue/chooser meaning of AR-01, AR-02, AR-03, AR-04, AR-07, AR-08 and AR-10. Replace the impossible AR-05 example with: a Stay-Back Full-Back at LB in 4-3-3 transfers to LWB in 3-4-3 Wide through `left_flank_defender`; the player stays and the incompatible role clears. Never map LCM to LDM: their keys differ.

AR-06's compatibility invariant remains, but supporter server-save/Community assertions are MVP+ only. AR-09 public lineup pages are MVP+ only. This applicability correction does not change any role or formation definition.

## Release gates

The [9 October operational checkpoint](operations-verification.md) maps publication recovery regression tests to MVP-10/12, records completed live cron/stale-write/rollback and isolated deployment-recovery drills (MVP-09/10/12/15), and maps mobile focus polish to MVP-02/06/13. The user waived the live alternate-account drill on 10 October 2026; automated non-allowlisted identity rejection remains mandatory. PNG export is built and covered by automated checks ([sharing verification](sharing-verification.md)); the user confirmed sharing and the builder on their own phones on 9 October 2026, so MVP-08 is passed.

All MVP-01–15 pass, with critical journeys exercised in a production-like deployment. No relevant blocking decision may be treated as passed through an assumed default. Add M-01 number cases and M-02 availability/restore/export cases after their approval.

Check narrow/wide mobile, tablet and desktop; document actual tested widths during UI design. Manually exercise mobile Safari and Android Chrome (done by the user, 9 October 2026). By the user's decision of the same day, a manual desktop-keyboard and screen-reader pass is optional and no longer a release gate; the automated keyboard, focus and axe checks stay mandatory. Check loading/empty/error/stale states for public fixture, restore, player chooser, export, admin editing, imports and publishing. Include real long player names and missing kickoff.

Each implementation PR identifies its current PRD requirement, MVP verification IDs, decision dependencies, and any content/local-storage migration. Old AC/AR release gates do not automatically apply. Do not defer all tests to the final phase.

The [Ant Design admin verification](admin-restyle-verification.md) maps the administration restyle to MVP-09/10/12/13/14/15.

The user moved the production backoffice to `/gaffer` on 10 October 2026. MVP-09/14 coverage in `tests/browser/admin-security.spec.ts` checks its closed unconfigured state, noindex metadata, and removal of `/admin`; `tests/unit/admin.test.ts` checks successful and failed OAuth returns to `/gaffer`. `tests/unit/site.test.ts` checks the backoffice is excluded from production crawling. The secured `/api/admin/` endpoints and OAuth callback address are unchanged.

Ongoing availability (10 October 2026) maps to MVP-09/10/11/13: `tests/unit/admin.test.ts` verifies current/future fixture eligibility, explicit match exceptions, returning to default, clearing ongoing status, inactive precedence, stable identities, legacy reads and invalid references/settings. `tests/unit/fixture-import.test.ts` verifies imports preserve the setting. Existing server tests retain authorization/CSRF/stale-write coverage. `tests/browser/admin-preview.spec.ts` exercises ongoing status, match exception, default restoration and clearing at four widths, including axe and overflow checks. Public responses expose only effective selectable state; M-02 browser retention is unchanged.
