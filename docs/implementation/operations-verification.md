# Operational readiness — 9 October 2026

PNG export remains the last feature before final release. This checkpoint covers administration and publication recovery; it does not declare the MVP released.

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

Local validation passed: lint, TypeScript, catalogue/content parity, production build, 102 unit/integration tests, 40 production browser checks and 12 workbench/admin browser checks. Browser coverage uses Chromium at 320, 390, 768 and 1440px, including the existing keyboard and axe checks. The fix is local and has not been committed or deployed. Shared content and generated player/catalogue data are unchanged.

## Remaining live checks and recovery procedure

1. Inspect the enabled cron's request logs after its scheduled window. Record execution time, production deployment and response status. Correlate any content-changing run with its content commit and Ready deployment; do not require a commit from a no-change import. Never log the scheduler credential or call the route without authorization merely to simulate a scheduled run.
2. Exercise rejection with a real non-allowlisted account when one is available. Do not create an account solely for this drill. Unit tests already cover the identity rejection, but are not live OAuth evidence.
3. For a two-tab content drill, open fresh authenticated admin tabs at the same revision. Make an intended valid edit in one tab; attempt a different edit from the stale tab. Confirm rejection, preserved form input and no second content commit. Reload explicitly before reconciling.
4. Before rollback, fetch current `main` again and capture both its commit and `content/shared.json` blob SHA. Identify an accepted recovery revision that includes the real fixtures. Review every difference, especially players, provider mappings, availability, featured selection and manual corrections. A pre-import empty snapshot is not an acceptable whole-file rollback target.
5. Restore only the intended content changes on top of the latest source, retaining unrelated intervening admin/import changes. Validate the candidate with the current shared-content/admin schemas and existing tests. Use a **new commit** with the latest expected content SHA; abort and re-review on a conflict. Never reset or force-push history. Never publish synthetic fixtures to exercise recovery.
6. Verify the restoration commit's production deployment separately from the content digest. Verify the canonical alias, public digest and player/fixture identities afterward. A previously live identical digest proves the content is available, but does not prove a new deployment completed. Record the actual commit/deployment/digest as drill evidence.
7. Confirm failed-publication preservation in an isolated production-like rehearsal; avoid deliberately breaking the public release. Record any remaining limitation honestly.

Keep the repository-scoped content token renewal due before its recorded 7 November 2026 expiry on the operational checklist. Credentials remain in service settings, not this document.

After operational preparation, implement both PNG sizes and then run the full MVP-01–15 release checks, including actual mobile Safari, Android Chrome and a screen-reader journey.
