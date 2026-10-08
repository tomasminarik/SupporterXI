# New-chat implementation handoff

**Prepared:** 22 September 2026.
**Project directory:** `/Users/tomasminarik/SupporterXI`
**Purpose:** Start implementation in a new chat without depending on the previous conversation.

## Local implementation update — 22 September 2026

The first slice below is now implemented locally. The original planning snapshot in sections 3 and 7 describes the starting point, not the present filesystem. Read [foundation verification](foundation-verification.md) and the README local-development instructions before continuing. Next: phase 2 fixture content and server selection; no factual fixture seed or credentials have been supplied. M-01 and M-02 remain open. No remote services or publishing have occurred.

## Fixture-shell update — 7 October 2026

The original squad JSON has been moved to `content/shared.json` with all 36 records unchanged. Read [fixture-shell verification](fixture-shell-verification.md) for current schema, API, refresh and deployment status. M-01/M-02 remain open. The earlier sections record planning history.

## Browser-builder update — 8 October 2026

The live fixture shell now integrates the builder and validated browser-local memory. M-02 and initial activation of all 36 players are approved; M-01 remains open. See [browser-memory verification](browser-memory-verification.md). Historical status statements below describe earlier phases. No real fixtures are seeded; the workbench uses explicitly synthetic contexts. User deferred PNG export until after backoffice/imports, immediately before release checks.

## Administration update — 8 October 2026

Admin forms, server authorization, GitHub content writes and publication checking are implemented. M-01 is approved. Production OAuth credentials and repository-scoped content access are configured. Real OAuth, authenticated read and no-change save were verified on the production domain. A content-changing write, deployment attribution and rollback drill remain for real fixture content. Read [admin verification](admin-verification.md).

## Fixture import update — 8 October 2026

The importer, manual refresh action and protected scheduler route are implemented with recorded provider-response tests. The provider token is configured as a Production-only secret, and the daily schedule is prepared for deployment. Read [import verification](import-verification.md). No real fixture has been imported or published yet.

## 1. Start here

Read `AGENTS.md`, `README.md`, and every active document in the README's reading order completely. Also read `docs/product/initial-squad.md` and `content/shared.json`. This handoff summarizes context; it does not replace the specifications.

The original larger product has been preserved in `docs/mvp-plus/`. Do not implement that version, apply its account/Community release gates, or interpret archived instructions as current authority.

## 2. Agreed product

- Manchester United next-match starting-XI builder, with one featured fixture for supporters.
- Exactly 14 formations and 25 optional player roles from the canonical catalogues.
- Eleven unique players; any eligible player may occupy any slot.
- Mobile tap, desktop click/drag and keyboard alternatives.
- Best-effort browser-local memory, without identifying the person or syncing devices.
- PNG only: 1080 × 1350 feed and 1080 × 1920 story. Roles remain in the builder and are excluded from exports.
- No supporter accounts, database, Community XI, shared lineup links, archives, T-90 cutoff, substitutes, team instructions or extra analytics.
- Homepage advances at kickoff + three hours, with a manual admin featured-fixture override. Unknown kickoff is shown as time to be confirmed.
- Keep the admin backoffice for fixtures, squad and fixture availability. Supporters do not sign in; the administrator does.
- GitHub-backed shared-content files and a short delay while publishing are accepted.
- Use football-data.org for covered Premier League and Champions League fixtures/times/changes. Its free schedule delay has no verified maximum; the user accepts that. Keep manual corrections authoritative.
- Domestic cups and missing fixtures are manual. Squad and availability are fully manual; do not add a squad or injury API.

## 3. What already exists

The repository directory contains documentation and initial squad seed data only. At handoff time there is no application, dependency installation, initialized Git repository, remote, deployment or configured provider integration. Inspect again before assuming nothing has changed.

The current PRD, behaviour contract, data integrity contract, architecture record, implementation plan and verification contract are written. The original nine documents were preserved before the scope rewrite. Do not regenerate the catalogue from football research or change its definitions.

### Squad

`content/shared.json` contains 36 players with stable UUIDs, names and shirt numbers. Use this as the seed source; retain IDs when moving it into the runtime content layout. Do not maintain a second independently edited roster.

It was transcribed from seven user screenshots, which are the requested squad source, not a claim about the actual contemporary United roster. Do not replace or "correct" its personnel using current football news or API results. The original screenshots are not needed to continue.

The user instructed: exclude players without numbers and remove middle names. Patrick Chinazaekpere Dorgu is stored as Patrick Dorgu. Preserve Matthijs de Ligt, Amad, and accents in Šeško, Martínez and León. Six unnumbered cards were excluded. No photos, crests or kit artwork were extracted for use.

No fixture seed has been supplied. Do not invent a real next opponent or kickoff. Use the honest empty state initially; clearly synthetic fixtures belong only in tests/development previews.

### Verification already performed

- Documentation link checks and preservation of original catalogue content.
- Catalogue structure checks: 14 formations and 25 roles.
- Squad JSON: 36 records, unique UUIDs/numbers, integer numbers, sorted order and matching review table.

These were read-only/ad-hoc data checks, not an existing automated application test suite. Build the required tests during implementation.

## 4. Architecture direction

Read `docs/decisions/001-mvp-architecture.md`. The agreed direction is database-free and GitHub-backed; specific engineering mechanisms in that ADR are recommendations, not already provisioned services.

Recommended stack: one Next.js/TypeScript application on Vercel, browser state and PNG rendering, small server routes for fixture selection and authenticated admin/import writes, GitHub OAuth for the administrator, and GitHub content changes with revision/concurrency checks. Manual refresh first, then approximately daily protected fixture imports. No Supabase, supporter authentication or email delivery service.

Select current compatible package versions when setup begins. Keep one package/lockfile and a small codebase. Use the relevant available frontend/accessibility skills when doing actual UI work. Do not install unrelated plugins or introduce services for future MVP+ features.

## 5. Open details — do not block unrelated progress

Two narrow product rules are documented in `docs/decisions/open-product-decisions.md` and have not been explicitly approved:

- **M-01:** recommended active-player numbers are unique integers 1–99, with an absent number allowed only for Inactive players. The user's screenshot filtering approves this seed's inclusion rule, not the entire future admin validation policy. Ask only before the affected validation work.
- **M-02:** recommended browser behaviour retains an already-selected player after they become unavailable, allows export and prevents re-adding after removal. No browser-only grandfathering/export policy was approved yet. Ask before implementing that reconciliation; continue the unaffected builder work.

Brand/domain is not approved. Use a neutral working title. Missing naming research must not block implementation or be fabricated. Do not treat the directory name SupporterXI or the earlier Eleven Verdict recommendation as approved public branding.

The original role test AR-05 wrongly mapped LCM to LDM. Follow the current verification mapping: LB with Stay-Back Full-Back → LWB preserves the player through its equivalence key and clears the incompatible role. No catalogue mutation is required.

## 6. Recommended first implementation slice

Start with phase 1 of `implementation-plan.md`:

1. Inspect current files, then initialize local Git if absent and scaffold the minimal application without replacing existing documentation.
2. Establish TypeScript, a reproducible lockfile, build/lint/type checks and the test harness.
3. Derive canonical formation and role runtime data, with meaningful parity/validation tests against the source specifications.
4. Validate and integrate the provided squad seed while preserving identities and avoiding assumptions about M-01/M-02.
5. Provide a minimal local entry screen with a genuine no-fixture state. Do not display fictional fixture data as live content.
6. Run the relevant checks and report the working local result, file changes and next slice. Map verification to MVP-01 and initial MVP-14, plus seed checks from MVP-10.

This is a useful complete first slice without external credentials. Then proceed in the documented order: fixture shell → builder/roles/local memory → PNG → backoffice/publishing → imports → release QA.

Every implementation slice includes its own relevant verification. Do not defer catalogue, role, accessibility or integrity checks to release day.

## 7. External setup — later, when needed

- GitHub repository destination and the administrator's GitHub identity.
- Vercel project connection and production/preview environment configuration.
- GitHub OAuth credentials and narrowly scoped content-write permissions.
- A free football-data.org account/API token, stored in secure environment settings.
- Initial real fixture content, either supplied manually or obtained through the authorized provider integration.

Do not request all credentials before local development. Never put secrets in chat examples, public bundles, committed data or logs. Use placeholders in environment examples. Do not create remote repositories, connect accounts, publish deployments, buy domains or upgrade plans merely because they appear on this checklist; obtain the user's concrete authorization at the relevant step.

## 8. Communication

The user wants a small, understandable product and does not want recurring paid infrastructure or unnecessary decisions. Recommend routine engineering details responsibly. Do not reopen settled scope. Surface real blockers narrowly and keep working on independent tasks. Explain changes and test results in plain language.

This preparation task did not start implementation. The user's prompt in the new chat supplies implementation authorization and may narrow or extend the first slice.
