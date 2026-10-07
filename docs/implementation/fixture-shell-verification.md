# Fixture shell and hosting setup — 7 October 2026

## Scope

Implements phase 2's shared-content schema, published fixture selection and public display/refresh lifecycle. No real fixture has been supplied, so published fixtures remain empty. The current whiteboard remains a separate interactive preview with no fixture eligibility assumptions.

The user approved a public `tomasminarik/SupporterXI` repository and connection to Vercel project `supporterxi` in team `Tomo` (`tomo-57ca`, Hobby). Existing authenticated CLIs were sufficient; no new login, API token, paid plan or connector was needed. Git integration is connected. Deployment links and final results are recorded in the task response.

## Content migration

Moved the supplied 36-player seed from `docs/product/initial-squad.json` into `content/shared.json`. The original record fingerprint remains `de3b2969355da0c0def5aa2535abf9705f85385d1c953f7b5e0119fb5d1820a0`. No player was added, removed, renamed or renumbered; all UUIDs are unchanged.

The shared document is the sole editable source. `content:generate` creates the public-only squad artifact consumed by the browser workbench. Build parity catches drift. Client components never import the full shared document, which may eventually contain future fixtures/provider provenance. Formation and role runtime sources remain unchanged.

Player active status, M-01 number validation and M-02 retained-player reconciliation remain open. The foundation player schema checks shape/identity only and must not serve as the final admin write validator.

## Behaviour

- `GET /api/featured-fixture` reads the bundled published content and server time. All cache headers prohibit caching; no per-visitor external call occurs.
- Automatic selection is earliest scheduled, confirmed kickoff before kickoff + three hours; exact boundary advances; stable UUID breaks time ties. No T-90 cutoff exists.
- Manual scheduled override persists, including unknown/past kickoff. Cancelled/postponed override falls back; selector retains a stale-override diagnostic for future admin integration.
- Confirmed kickoff requires an explicit offset/Z and valid calendar timestamp. Unknown kickoff is a distinct tagged object.
- Per-field manual overrides win over imported/base values, including explicit null/unknown. This is data resolution only, not an implemented importer.
- API exposes only the chosen effective fixture, schema version, content fingerprint, server timestamp and rollover timestamp. Provider identifiers, overrides, availability and future fixtures are excluded.
- Browser loads with loading/error/retry states, localizes confirmed kickoff with timezone, and refreshes on focus/visibility and a timer based on the server interval. Refresh errors preserve last loaded context with stale feedback. Requests time out after ten seconds.
- This shell has no live lineup attached, so changing its fixture cannot relabel an existing XI. Explicit builder-transition handling remains part of integration.
- Workbench works in development and `VERCEL_ENV=preview`, and returns 404 in production. No write/import/admin route has been added.

## Verification mapping

| Contract | Evidence |
| --- | --- |
| MVP-07 | `tests/unit/fixtures.test.ts`: before/at rollover, no T-90 lock, corrected kickoff, unknown kickoff, persistent/manual/stale overrides, status exclusions, stable tie ordering and DST timezone formatting |
| MVP-07 | `tests/browser/fixtures.spec.ts`: live API server timestamp/cache headers, 405 for POST, initial failure/retry, TBC, stale data after focus refresh failure and rollover with an intentionally wrong visitor clock |
| MVP-10, initial MVP-11 | Shared schema tests: unique stable IDs/provider mapping, references, strict fields, timestamp validation, per-field override precedence. No admin/import writes or concurrency gates are claimed complete |
| MVP-01/10/14 | Existing catalogue/seed parity and browser exclusions continue; generated public squad prevents full shared-content exposure |
| MVP-13 | Existing keyboard/axe checks at 320, 390, 768 and 1440px continue for entry and whiteboard |

Local checks: lint, TypeScript, build and 59 unit tests; browser suites comprise 24 production-entry/fixture checks and eight whiteboard checks. Tests use synthetic fixtures through test inputs and browser interception only, never as published data.

## Dependency update

Updated Next.js and its ESLint configuration to 16.4.0, and refreshed vulnerable sharp/source-map-js dependencies after the current audit reported security fixes. Production dependency audit reports zero vulnerabilities. Five high findings remain in the development-only ESLint → fast-glob → micromatch → braces chain, with no compatible patch offered by the audit; do not downgrade Next.js/ESLint configuration to 14.x via `audit fix --force`. Track the upstream tooling fix. Application code does not accept user-controlled glob patterns.

## Hosting / operations

`vercel.json` explicitly selects Next.js, `npm ci`, and `npm run build`. GitHub Actions runs `npm run check` on Node 24. Production and preview have no provider/import/admin write credentials. `.env*` and `.vercel/` are ignored; Vercel's local linking metadata/token are not committed. Do not paste tokens into documentation or chat.

Git pushes to main target production; work branches target preview. Preview exposes the whiteboard for review without local-server dependence. Creating a commit does not itself prove deployment success; verify the deployed commit and ready state.

Next: supply real fixture content or authorize provider integration, integrate the browser builder with fixture context, and decide M-02 before availability reconciliation/local restoration. M-01 remains required before final squad admin validation. No paid services, domain or supporter persistence is introduced.
