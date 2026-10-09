# Operational readiness — 9 October 2026

PNG export remains the last feature before final release. This checkpoint covers administration and publication recovery; it does not declare the MVP released.

**Latest status:** The recovery fix is deployed. The scheduled import, live two-tab conflict and content rollback are verified. An isolated Preview build failed validation as intended and recovered after a new restoration commit. Alternate-account live OAuth rejection remains pending because the user confirmed no second account is available. Interface polish is mapped below; PNG and final device/screen-reader release checks remain.

## Production observations

Read-only checks at approximately 06:02 UTC (08:02 Europe/Stockholm):

- Fetched `origin` before editing. Local `main` and `origin/main` both pointed to `7dd6921`; existing local handoff additions were preserved.
- Vercel production deployment `dpl_4Nsj2suFzcjATboArirJ9A6PouKy` was Ready and attached to `supporterxi.vercel.app`.
- The public featured-fixture endpoint returned HTTP 200 and content digest `19e1bf5b56ade816056b1ee24b3b1cb85416fbefa0c27bfc7ba6c32b8dac2634`, matching local shared content. All 36 public player IDs matched the supplied squad. The observed fixture was Tottenham at home on 10 October at 16:30 UTC; it is a timestamped observation, not a fixed expected opponent.
- Vercel's project configuration confirmed the enabled `/api/cron/fixtures` schedule `0 6 * * *` on that production deployment. The inspected logs contained no matching cron execution. Configuration and unchanged Git history do **not** prove a successful run: an unchanged import intentionally creates no commit. Scheduled execution remains unverified.
- No production content, credentials, hosting configuration or fixtures were changed during these checks.

## Publication recovery fix and automated proof

A failed or malformed public live-content probe previously interrupted publication checking before GitHub deployment status was inspected. The checker now continues to the deployment status after that probe fails. A matching public digest is still the only evidence used to label content live; a successful deployment status alone remains pending until verified. If both status services fail, the editor remains readable and publication remains unverified.

The admin request timeout now allows the server's sequential content/status requests to finish instead of abandoning them after 20 seconds. Fixture import keeps its separate 75-second timeout.

`tests/unit/publication.test.ts` maps to:

- **MVP-12:** failed live probes (network, timeout, malformed/null JSON and HTTP failure); deployment failure reporting; no false live claim from deployment success; preview/unrelated deployments ignored; exact-commit editor reads when status services fail.
- **MVP-10/12:** an authenticated two-editor rehearsal through the actual content route with mocked upstream services. The second editor's stale write is rejected without a second PUT. A failed deployment leaves the simulated accepted public revision intact. Restoration uses a new SHA-guarded content commit and preserves the squad, fixture/provider IDs and unrelated manual correction.

This is an automated rehearsal, **not a live rollback or alternate-account sign-in drill**. No schema, catalogue, browser-memory or architecture migration is introduced.

At the initial local checkpoint, validation passed: lint, TypeScript, catalogue/content parity, production build, 102 unit/integration tests, 40 production browser checks and 12 workbench/admin browser checks. Browser coverage uses Chromium at 320, 390, 768 and 1440px, including the existing keyboard and axe checks. The fix was subsequently committed and deployed as recorded below. Shared content and generated player/catalogue data were unchanged by that fix.

## Completed live operational drills

| Contract | Evidence on 9 October 2026 |
| --- | --- |
| MVP-12 — recovery fix publication | Commit `c712b10` passed GitHub Actions run `37891971383`. Production deployment `dpl_HC5YRAMEmyPZSA3oEgCJMiwaMRqv` was Ready with the canonical alias. |
| MVP-15 — automatic scheduled import | Vercel request `rklqr-1791526171090-da5b3eeb939e` started at `2026-10-09T06:09:31.090Z` (08:09:31 Stockholm), user agent `vercel-cron/1.0`, on that production deployment; `/api/cron/fixtures` returned 200. This preceded any dashboard Run action. The configured Hobby schedule has a one-hour execution window. No empty import commit was created. |
| MVP-15 — dashboard scheduler invocation | Dashboard Run invoked `/api/cron/fixtures` on production deployment `dpl_AryqEMDcc4Ao5jGr96jxxRBcUpF1` at `2026-10-09T06:13:06.255Z`; HTTP 200, no content commit. This is separately recorded as a manual scheduler invocation. |
| MVP-10 — live two-tab stale write | Two authenticated editors loaded the same source. The first changed only the future Manchester City fixture's opponent correction from `Manchester City FC` to `Manchester City` (same factual opponent, stable fixture/provider identity). POST at `06:10:04.987Z` returned 200 and created `58e5b0a`. The stale second POST at `06:10:17.610Z` returned 409; its input stayed visible and no extra commit was made. |
| MVP-12 — changed content published | `58e5b0a` reached Ready deployment `dpl_AfA6i1VGJfxDN3z645wE8YENXfAU`; public digest `ff6d00f1d981a0eebb246a5ce610fac6d46a9bba52b6d4941c4027af8796c0a5` matched its source. Admin reported Live content verified. The featured match and all 36 player IDs remained intact. |
| MVP-12 — live content rollback | Clearing only that opponent correction created **new** commit `b62f0b9` (POST `06:11:16.063Z`, HTTP 200). Content matched the accepted pre-drill document byte-for-byte. Ready deployment `dpl_AryqEMDcc4Ao5jGr96jxxRBcUpF1` restored digest `19e1bf5b56ade816056b1ee24b3b1cb85416fbefa0c27bfc7ba6c32b8dac2634`; admin reported Live content verified. All 32 fixtures, provider mappings and 36 player IDs were preserved. No history reset occurred. |
| MVP-12 — isolated failed-deployment recovery | On `codex/deployment-recovery-drill`, `ebedaf0` changed only the content schema version to an unsupported value. Preview `supporterxi-k052xgt8f-tomo-57ca.vercel.app` failed the current-content validation test with `Invalid input: expected 2`. Production remained HTTP 200 with the accepted digest. New commit `006b473` restored accepted content and Preview `supporterxi-uuwjdmenc-tomo-57ca.vercel.app` became Ready. No invalid document was pushed to main. |
| MVP-09/12 — recovered Preview isolation | Reading the recovered Preview admin API through the authenticated Vercel CLI returned HTTP 503, `Admin integration is not configured for this deployment.` Production credentials/authority were not added to Preview. |

The failure drill exercises an actual Preview build and preserves production; it does not claim a deliberately failed Production deployment. Production failure reporting remains covered by the server integration tests. The temporary recovery branch ends with valid accepted content and must not be merged into main.

## Interface polish and verification mapping

- **MVP-02/13:** On layouts up to 800px, choosing a pitch position focuses the updated position-panel heading and brings the chooser into view. It does not open the mobile keyboard. Placement/removal return focus to the pitch; re-selecting an occupied position returns to its edit panel. Desktop retains pitch focus.
- **MVP-06/13:** A restored formation starts with guidance to choose a position, rather than incorrectly asking the user to choose a formation again.
- **MVP-02/13:** The chooser distinguishes a search with no matches from having no eligible unselected players.
- **MVP-12:** Checking publication clears the obsolete save notice so verified live content is not accompanied by an old “publication pending” message.
- `tests/browser/workbench.spec.ts` verifies keyboard focus order, visible mobile panel, focus return, repeat selection, search feedback and axe at 320/390/768/1440px. Four new browser cases bring coverage to 40 production and 16 workbench/admin checks; 102 unit/integration tests remain.

The final local `npm run check` passed after the polish: lint, TypeScript, catalogue/content parity, 102 unit/integration tests, production build, 40 production and 16 workbench/admin browser checks. Mobile screenshots were inspected to confirm the chooser itself is visible after position selection. Shared content, catalogue data and browser draft schema remain unchanged.

Dependency review during the drill: `npm audit --omit=dev` reported zero vulnerabilities. Full audit reported the `braces` stack-exhaustion advisory through the development-only Next.js lint dependency chain (five affected package entries). Its suggested automatic remedy downgrades the framework lint configuration; no forced downgrade was applied. Recheck the available compatible remedy during final release review.

## Recovery procedure and remaining release checks

1. The first scheduled run is verified above. For future operations, inspect the enabled cron's request logs after its scheduled window. Record execution time, production deployment and response status. Correlate any content-changing run with its content commit and Ready deployment; do not require a commit from a no-change import. Never log the scheduler credential or call the route without authorization merely to simulate a scheduled run.
2. Exercise rejection with a real non-allowlisted account when one is available. Do not create an account solely for this drill. Unit tests already cover the identity rejection, but are not live OAuth evidence.
3. The live two-tab and rollback drills are verified above. When repeating a two-tab drill, open fresh authenticated admin tabs at the same revision. Make an intended valid edit in one tab; attempt a different edit from the stale tab. Confirm rejection, preserved form input and no second content commit. Reload explicitly before reconciling.
4. Before rollback, fetch current `main` again and capture both its commit and `content/shared.json` blob SHA. Identify an accepted recovery revision that includes the real fixtures. Review every difference, especially players, provider mappings, availability, featured selection and manual corrections. A pre-import empty snapshot is not an acceptable whole-file rollback target.
5. Restore only the intended content changes on top of the latest source, retaining unrelated intervening admin/import changes. Validate the candidate with the current shared-content/admin schemas and existing tests. Use a **new commit** with the latest expected content SHA; abort and re-review on a conflict. Never reset or force-push history. Never publish synthetic fixtures to exercise recovery.
6. Verify the restoration commit's production deployment separately from the content digest. Verify the canonical alias, public digest and player/fixture identities afterward. A previously live identical digest proves the content is available, but does not prove a new deployment completed. Record the actual commit/deployment/digest as drill evidence.
7. Confirm failed-publication preservation in an isolated production-like rehearsal; avoid deliberately breaking the public release. Record any remaining limitation honestly.

Keep the repository-scoped content token renewal due before its recorded 7 November 2026 expiry on the operational checklist. Credentials remain in service settings, not this document.

After operational preparation, implement both PNG sizes and then run the full MVP-01–15 release checks, including actual mobile Safari, Android Chrome and a screen-reader journey.
