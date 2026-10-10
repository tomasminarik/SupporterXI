# Ongoing player availability — 10 October 2026

The user approved Unavailable until cleared for long-term injuries. The Availability tab has an ongoing setting independent of squad Active status, plus the existing match editor with explicit Available/Unavailable exceptions and Use default. New fixtures inherit the ongoing setting. Clearing it leaves match exceptions intact. Inactive players stay ineligible; M-02 preserves existing same-fixture browser selections.

The content reader defaults the new player boolean to false for existing schema-version-2 files. New player creation starts available. Player-detail edits and fixture imports preserve the setting. A later content write serializes the normalized field; no existing shared file was changed by this PR. Public responses retain their existing shape and expose only effective selectable state. An older code version that predates this field cannot read content after it has been written; operational rollback must preserve compatible schema/code or explicitly migrate the field and its effective availability first. No browser-memory or identity migration is needed.

The setting uses the existing authenticated content-write route, schema and optimistic revision check. No new API endpoint, database, account, analytics or automated injury source was introduced. No architecture deviation.

Verification maps to MVP-09/10/11/13 in the current verification contract. Lint, typecheck, catalogue/content checks, 127 unit/integration tests, production build, 80 production browser checks and 37 workbench/admin checks passed (7 viewport-inapplicable skips). Browser suites need local-server permissions and were run separately because both write the same test-results directory. The ongoing controls were also inspected in the isolated local preview. No real player was marked injured during verification.

The domain login issue was production configuration: ADMIN_ORIGIN and the existing GitHub OAuth app still targeted supporterxi.vercel.app. Both were moved to supporterxi.com and the accepted main version redeployed. Browser sign-in, authenticated read and a no-change save were verified at https://supporterxi.com/gaffer. This fix is live independently of the availability feature PR; see domain-launch.md.

**11 October 2026:** the two availability lists described above were replaced by one list saved in a single publication, and the public response now marks unavailable players. See [Gaffer usability verification](gaffer-usability-verification.md).
