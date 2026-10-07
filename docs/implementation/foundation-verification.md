# Local foundation slice — 22 September 2026

## Delivered

- Local Git initialized on `main`, with no remote configured. No commit or deployment created.
- One Next.js 16.3.5 / React 19.3.0 / TypeScript application, exact dependency versions and npm lockfile. Node 24 recommended; this run used Node 26.0.0 and npm 11.12.1.
- ESLint, Vitest, Playwright and axe checks; a future GitHub CI workflow runs the same checks with Node 24. The workflow has not run remotely.
- One generated runtime source for each catalogue. `scripts/generate-catalogues.mjs` extracts the normative formation JSON and role definitions. Tests independently compare tables, definitions and the role compatibility matrix. Builds reject stale generated files.
- The original squad JSON is imported directly, without changing any of the 36 IDs, names or numbers. A frozen seed adapter validates structure and identity. It is not the future admin validator; active state and fixture availability remain unspecified.
- Responsive entry screen with an honest no-fixture state, original decorative pitch and keyboard-accessible squad disclosure. No invented fixtures, external assets or selectable formation. Neutral working title.

This follows ADR 001 with no material architecture deviation. The direct seed import deliberately avoids a second roster before the atomic shared-content document is introduced in phase 2.

## Verification performed

All passed locally:

| Contract | Evidence | Scope |
| --- | --- | --- |
| MVP-01 | `tests/unit/catalogues.test.ts`, `catalogues:check` | 14 formations; normative JSON and slot/display table parity; 11 unique slots each; unique equivalence keys; mirrors, coordinates, role families and consistent slot meaning; 25 exact role IDs/names/definitions/order; independent compatibility matrix parity |
| MVP-10 (seed only) | `tests/unit/squad.test.ts` | Original 36-record identity fingerprint; review-table parity; supplied unique integer numbers and order; rejection of malformed data/duplicate IDs; no assumption of active state or pending admin number policy |
| MVP-07 (empty state only) | `tests/browser/entry.spec.ts` | No fixture is invented; no kickoff, build or export action |
| MVP-13 (entry screen only) | Same browser test, axe, screenshot inspection | Keyboard skip link and squad disclosure; 36 readable names; no horizontal overflow; zero axe violations at 320, 390, 768 and 1440px; desktop/narrow-mobile screenshots visually inspected |
| MVP-14 (initial) | Same browser test and route/build review | Only `/` and framework not-found page; excluded routes return 404; no external requests or non-GET requests during the entry journey; no local/session storage; no forms, photos, accounts or lineup upload |

30 unit tests and 8 browser tests passed. Lint, TypeScript and production build passed. Installation audit reported zero known dependency vulnerabilities. Browser tests ran against the production build using Chromium; viewport sizes are not claims of testing real mobile Safari or Android Chrome. A screen-reader pass, real-device checks and full builder accessibility remain later release work. Local sandbox restrictions required permission to download dependencies/browsers and start the loopback test server; verification then succeeded.

Commands: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:browser`. `npm run check` combines them. Browser screenshots and traces go into ignored `test-results/`.

Package setup checked the npm registry and [Next.js installation guidance](https://nextjs.org/docs/app/getting-started/installation). Runtime versions are recorded in `package.json` and `package-lock.json`.

## Remaining scope / next slice

M-01 and M-02 are still open and unchanged. No number-range policy, availability reconciliation or export eligibility policy was adopted. No browser lineup state/storage migration exists yet.

Next: phase 2 shared-content schema and read-only featured-fixture endpoint using server time, tested with explicitly synthetic test fixtures. Cover unknown kickoff, manual override and kickoff-plus-three-hours rollover; keep public content empty until real fixture data is provided or an import is authorized. Move the supplied roster into the eventual single shared-content source only with an explicit identity-preserving migration and updated source documentation.

Builder, local memory, PNG export, authenticated admin writes/publishing and imports remain subsequent slices. None of their release gates are claimed as complete. No credentials are needed to preview this foundation.


## Interactive review follow-up — 23 September 2026

The user found the empty homepage insufficient to review. A development-only `/dev/workbench` now exposes the catalogue and squad through a functional in-memory whiteboard. The homepage links to it in development; the route returns 404 in production. No synthetic or real fixture is invented. The supplied squad is selectable solely for this labelled preview, without asserting active state or fixture eligibility. M-01/M-02 remain untouched.

Reusable pure operations in `src/domain/lineup.ts` handle place/replace/remove, clear, move/swap, optional compatible roles and an immutable formation-change proposal. Destructive changes use native confirmation; cancelling preserves the entire state. The UI supports click/tap, keyboard and desktop dragging. Roles stay with occupied slots, and the canonical LB-to-LWB example clears an incompatible role. Full definitions remain in the canonical data; the preview offers short role definitions and full selected-player names in the position panel.

Added verification: `tests/unit/lineup.test.ts` covers MVP-02–05 mechanics (nine tests); `tests/browser/workbench.spec.ts` covers placement, duplicate exclusion, replacement, confirmation/cancellation, role filtering/clearing, moving, a full XI, clear/reset, desktop drag, keyboard operation and axe at the same four widths. This tests local mechanics only, not the eventual fixture eligibility, persistence or PNG journey. Full-XI screenshots were reviewed, and the narrow layout was adjusted to prevent marker/name collisions; long labels truncate on the pitch while their complete names remain in the panel and accessible button labels.

The workbench test server must run after the normal development server is stopped. Production entry checks additionally verify that the workbench is unavailable in production. `npm run check` includes both suites. The previous foundation result is a historical baseline; follow-up results: 39 unit tests and 16 browser tests passed, alongside lint, TypeScript and production build.

Local storage, fixture integration and PNG remain unimplemented. This preview resets on reload, offers no export/save, and creates no supporter server writes. No remote services or publishing occurred.
