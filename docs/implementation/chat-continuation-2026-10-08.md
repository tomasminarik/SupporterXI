# Chat continuation — 8 October 2026

This is the latest conversation summary. Read `AGENTS.md`, `README.md`, all active authoritative documents in the README's reading order, and this file before continuing. Older dated sections in `new-chat-handoff.md` preserve planning history and contain superseded status statements.

## Current application

- Project: `/Users/tomasminarik/SupporterXI`.
- Public GitHub repository: https://github.com/tomasminarik/SupporterXI.
- Vercel project: `supporterxi`, existing Tomo team (`tomo-57ca`).
- Production: https://supporterxi.vercel.app/.
- Production administration: https://supporterxi.vercel.app/admin.
- Preview: https://supporterxi-git-preview-tomo-57ca.vercel.app/dev/workbench and `/dev/admin`.
- Stack: Next.js 16 / React / TypeScript, GitHub-backed shared content, Vercel hosting, browser-only supporter lineups. Follow the architecture ADR; no database is needed.

The user explicitly authorized the public repository, Vercel connection, Production setup/publication, GitHub OAuth registration and football-data.org free-tier setup. Those services already exist; do not create replacements or request the same approvals again. No paid plan is authorized.

## Implemented and verified

1. Canonical runtime catalogues for all 14 formations and 25 optional roles, with parity/validation tests.
2. Original supplied 36-player squad, stable UUIDs retained. All start Active and default to Available for each fixture. External roster data has never replaced this squad.
3. Builder: formation selection, placement/removal, movement/swapping, optional roles, desktop drag, click/tap and keyboard alternatives, responsive layout.
4. Browser-local XI memory and recovery. No supporter server persistence, accounts or analytics.
5. Server-timed featured-fixture selection, kickoff + three-hour rollover, manual admin selection, explicit next-fixture transition, honest no-fixture/error/stale states.
6. Admin: GitHub OAuth allowlist, server authorization/CSRF/origin checks, fixture/squad/availability forms, validation, per-field fixture corrections, stale-write rejection, GitHub content commits and publication status checking. `/dev/admin` uses page-memory demo data only.
7. Fixture importer: football-data.org v4 Manchester United team 66 matches, Premier League and Champions League only. Fixed server endpoint and bounded date range; response-header throttling and bounded retries. Stable provider/internal identities, retained manual corrections, ambiguous manual matches reported rather than merged, no deletion from an empty feed, no player/availability imports, no empty commits.
8. Manual admin import and protected Production cron route share the importer. Daily schedule in `vercel.json`: 06:00 UTC (08:00 Stockholm on 8 October; local time changes with daylight saving).

## Latest live import and UI fix

- An authenticated refresh created GitHub commit `13345fb` with 32 real covered fixtures, changing only `content/shared.json`.
- Production returned Tottenham Hotspur at home, Premier League Matchday 6, kickoff `2026-10-10T16:30:00Z` (18:30 Stockholm), alongside all 36 supplied players. This describes the observed feed on 8 October, not a permanently fixed match.
- Admin showed `Live content verified` for commit `13345fb`; live content revision was `19e1bf5b56ade816056b1ee24b3b1cb85416fbefa0c27bfc7ba6c32b8dac2634`.
- The native refresh confirmation made success difficult to see. Commit `f1dec75` replaced it with an in-page confirmation and explicit import result.
- A fresh Production admin tab verified the new confirmation. A repeat refresh returned `0 added, 0 updated, 32 unchanged, 0 outside scope` and `Import made no content changes.`
- An older already-open admin tab did not react reliably during browser automation; a fresh tab worked. Prefer a fresh tab if an old tab remains inert after a deployment.

## Git and deployment checkpoint

- At summary preparation, local `main` and `origin/main` were clean and synchronized at `7dd6921` (`Document live fixture import and publication`).
- `6e70fe0` merged the remote admin-generated fixture commit with the refresh UI. Fetch before any future push: Production admin/cron operations can advance `main` remotely.
- `preview` and `origin/preview` remain at `f1dec75`; they do not include the subsequent real fixture content merge. Account for this intentional divergence before merging future preview work. Never overwrite the live content document with an older empty preview copy.
- Latest verified Production deployment: `supporterxi-6gmuzgsbi-tomo-57ca.vercel.app`, ID `dpl_4Nsj2suFzcjATboArirJ9A6PouKy`, status Ready, canonical Production alias attached.
- Main CI for `7dd6921` succeeded: https://github.com/tomasminarik/SupporterXI/actions/runs/37835361105.
- This continuation document and its handoff link are local documentation additions created after that checkpoint; they have not been published.

## Decisions and scope to retain

- M-01 approved: Active players need unique integer shirt numbers 1–99; only Inactive players may omit a number. IDs never derive from numbers.
- M-02 approved: keep existing same-fixture selections through inactivity/unavailability changes, permit eventual PNG export, prevent re-adding after removal; moves/swaps retain selection.
- PNG export is deliberately unimplemented. The user instructed: **leave PNG as the last feature immediately before final release**.
- Current MVP only. No supporter accounts, database, Community XI, saved submissions, shared lineup URLs, archives, future-fixture browsing, T-90 cutoff, substitutes, formation/role CRUD, player profiles, tactical instructions or extra analytics.
- Squad, availability and uncovered cup fixtures are manually managed. Only fixtures use football-data.org.
- Neutral working title only. Final branding/domain remain unapproved.

## Credentials and operational constraints

Production OAuth, administrator allowlist/session settings and repository-scoped write access are already provisioned. `FOOTBALL_DATA_TOKEN` and `CRON_SECRET` are Production-only Vercel Secrets. Preview deployments refuse shared-data authority and lack Production credentials. Do not print secrets, copy them into this summary, commit them, or ask the user to paste them into chat. The provider token was previously supplied in chat; never repeat its value. The fine-grained GitHub content token was recorded as expiring 7 November 2026; check renewal before that date.

The GitHub server write path is restricted to `content/shared.json` on this repository's `main`. Preserve SHA-based concurrency checks and verify deployment separately from commit success. Content rollback uses a new commit restoring an accepted content revision, never a history reset. Preserve needed production fixture content while editing application code.

## Verification checkpoint

On the combined live-content/UI state: lint, TypeScript, catalogue/content checks, production build, 93 unit/integration tests, 40 production browser checks and 12 workbench/admin checks passed. Main CI passed and Vercel was Ready. The recorded provider test fixture contains sanitized real response fields, no token.

Read `import-verification.md`, `admin-verification.md`, `browser-memory-verification.md`, and the central `verification.md` for test mapping and limitations. Remaining operational checks include observing the first scheduled cron execution, a content rollback drill, and live alternate-account rejection/two-tab stale-write/failed-publication behavior. Automated tests cover these protections; do not describe unperformed live drills as complete.

## Clear next steps

1. Read the required documents, inspect local changes, fetch remote branches and reconcile any newer admin/cron content commit before editing. Start from the current live-content state.
2. Follow the user's requested editing direction in the new chat. No specific visual redesign was approved at this handoff; request missing design intent only when it affects the work. Use the existing production builder for review and `/dev/workbench` for synthetic availability/fixture scenarios.
3. Check whether the scheduled import has run since this checkpoint. Inspect the deployed cron configuration/logs without exposing its secret. Do not create a new recurring automation unless requested.
4. Before release, complete the remaining operational admin/publication checks. Plan rollback so it does not remove real public fixtures unnecessarily; verify restoration and live content digest afterward.
5. Once other editing/features and operational preparation are complete, implement PNG export per the PRD: 1080 × 1350 feed and 1080 × 1920 story. Exclude roles, official crests, licensed kits and player photographs; preserve approved M-02 behavior. Add tests mapped to the verification contract and verify the rendered downloads.
6. Run final MVP acceptance/accessibility/responsive/security checks and verify the deployment. Keep scope restricted to the current MVP.

## Local preview and checks

Use Node 24 (or the supported version in `package.json`), `npm ci`, then `npm run dev`. Open http://localhost:3000/ for the real published fixture snapshot; http://localhost:3000/dev/workbench and `/dev/admin` are synthetic local previews. No Production credentials are required for public/local demo pages.

Run `npm run check` with the development server stopped. Browser tests bind ports 3100 and 3101; the sandbox may require escalation for localhost listeners. Next.js can regenerate `next-env.d.ts` with development paths during workbench tests; avoid committing that incidental path change. Production preview is `npm run build` followed by `npm start`.
