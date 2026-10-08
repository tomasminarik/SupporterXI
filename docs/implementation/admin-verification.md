# Administration and publishing — 8 October 2026

## Implemented scope

`/admin` supports single-admin GitHub OAuth, fixture and squad forms, per-fixture availability, featured override, per-field imported-value/correction display and explicit override clearing. No destructive delete or catalogue CRUD exists. `/dev/admin` is a clearly labelled in-memory form preview enabled only locally and on Vercel Preview; it never writes GitHub.

M-01 was approved on 8 October: Active shirt numbers are unique integers 1–99; Inactive players may omit a number. Existing IDs and the supplied 36 records remain unchanged. Player number schemas now accept null for inactive records; browser snapshots remain version 1 because this is a backward-compatible field expansion. Selected unavailable/inactive players still follow approved M-02.

All privileged API reads and writes authenticate the immutable configured GitHub ID using an encrypted two-hour, Secure/HttpOnly/SameSite=Lax host cookie. OAuth uses state, S256 PKCE, an exact configured callback origin and an expiring encrypted flow cookie. Identity-only OAuth tokens are discarded after the user lookup. Writes require same-origin JSON, a session-bound CSRF token, bounded bodies, schema validation and the expected Git blob SHA. Preview deployments refuse authority even if credentials are accidentally present. Admin pages reject framing and do not send referrers.

The server can update only `content/shared.json` on `tomasminarik/SupporterXI:main`. Typed commands preserve identities/provider provenance and prevent arbitrary file or repository edits. Existing imports are immutable base values; only edited fields become corrections. Clearing one correction leaves the others. GitHub's SHA check also protects the race after the initial revision read. No-change operations make no commit.

A successful write reports a commit and pending publication. Check publication verifies the production endpoint's content digest before reporting live, and examines production deployment failures. Pending is retained when deployment cannot yet be verified. Integration errors preserve input values. Reload latest content explicitly warns that unsaved form edits will be discarded. Reload also retrieves the last content commit and verifies its publication. The content is read at that exact commit to avoid mixing revisions; a later main-branch edit is rejected at save time. An unavailable status service does not prevent reading the editor.

Builds regenerate the public squad projection before validation, so an atomic admin content edit does not require a second generated-file commit. Historical seed/fingerprint assertions now use `tests/fixtures/initial-content.json`, an immutable test fixture, while a separate test validates current published content and preserves all original IDs. It is not another editable runtime roster.

## Production setup and remaining live checks

Production credentials were provisioned on 8 October 2026. The OAuth app is registered, a repository-scoped token expires 7 November 2026, and six Production-only Vercel settings are configured. Preview remains without credentials. Live OAuth, authorized content read and a no-change save succeeded. The first save exposed a multi-instance clock-tolerance bug; the tested fix was deployed and the same no-change save then returned “No content changes to publish.” A real content-changing write and rollback drill remain outstanding.

1. Registered an OAuth app on the existing GitHub account, with homepage `https://supporterxi.vercel.app` and exact callback `https://supporterxi.vercel.app/api/admin/auth/callback`. Keep wildcard matching and device flow disabled. Token expiry may remain enabled. Registration succeeded on 8 October 2026.
2. Configured the six names in `.env.example` in Vercel **Production only**. Use a fresh cryptographically random session secret of at least 32 characters. Do not paste secrets into chat, source control or logs.
3. Created a fine-grained GitHub token scoped only to `tomasminarik/SupporterXI`, Contents read/write and Deployments read, with an appropriate expiry. This is separate from the identity OAuth app. Never reuse the development CLI's broad credential in the deployed app. Repository permissions are the provider boundary; the server further fixes the exact content path and branch.
4. Deployed the reviewed code to main/production. Authenticated as GitHub ID `326405858`, verified a live content read and a no-change save with no commit. Anonymous API reads return 401. A real content-changing write, alternate-account rejection, attribution/build/live-digest verification remain operational checks. No fictional fixture should be published as live data.
5. Exercise two-tab stale-write rejection, failed deployment preservation, and content rollback before release. Restore only the content document from an accepted revision in a new commit, regenerate locally when checking it, then verify the replacement deployment; never force-reset repository history.

OAuth follows [GitHub's web application flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps). Atomic content updates use the [GitHub Contents API](https://docs.github.com/en/rest/repos/contents). No architecture deviation or new paid service is introduced. Automated import credentials remain later work.

## Verification mapping

- MVP-09: `tests/unit/admin.test.ts` verifies OAuth state/PKCE, non-allowlisted identity rejection, tampering, expiry, origin binding, CSRF, direct unauthorized routes and preview credential isolation. `tests/browser/admin-security.spec.ts` verifies closed unconfigured routes and hidden production preview. Real OAuth completed, and the token permissions were verified on GitHub. Alternate-account and real content-changing writes remain to check.
- MVP-10: unit tests validate M-01, stable creation/edit identities, no delete command, reference integrity, timezone requirements, per-field corrections, SHA conflicts and no empty commits.
- MVP-12: mocked GitHub tests verify atomic content-only write, stale conflict, pending/failed/live distinctions. A real publication and rollback drill remain pending setup.
- MVP-13: `tests/browser/admin-preview.spec.ts` exercises form failures without lost input, creation, featured selection, deactivation with no number and availability; axe and overflow checks at 320/390/768/1440px.
- MVP-14: preview form tests assert no network writes; no supporter storage or analytics added.

Verified locally: lint, TypeScript, production build, 83 unit/integration tests, 40 production browser checks and 12 workbench/admin preview checks pass. Run `npm run check`. Next: fixture imports/real content, then a real admin publication/rollback drill, then PNG, then final release verification. PNG remains deliberately unimplemented.
