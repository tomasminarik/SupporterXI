# Starting XI builder — implementation handoff

**Updated:** 8 October 2026. **Stage:** Builder, administration and fixture import implemented; PNG and final release checks remain.

The current MVP is a next-match lineup builder with optional roles, browser-local memory, PNG export, and an administrator backoffice. There are no supporter accounts, Community XI, public lineup links, archives, or T-90 lock.

Starting in a new chat? Read the [implementation handoff](docs/implementation/new-chat-handoff.md) for current state, seed data, remaining decisions and the first implementation slice, then follow the authoritative reading order below.

## Read in this order

1. [Current PRD](docs/product/canonical-prd.md): approved scope and behaviour.
2. [Formations](docs/product/formations.md): normative 14-formation catalogue.
3. [Player roles](docs/product/player-roles.md): normative 25-role catalogue. Current PRD overrides references to MVP+ accounts, saved submissions and public links.
4. [Application behaviour](docs/implementation/application-behaviour.md).
5. [Data integrity](docs/implementation/data-integrity.md).
6. [Architecture decision](docs/decisions/001-mvp-architecture.md).
7. [Implementation plan](docs/implementation/implementation-plan.md).
8. [Verification](docs/implementation/verification.md).
9. [Decision status](docs/decisions/open-product-decisions.md).

Product behaviour takes precedence over technical convenience. Architecture details are recorded separately from the PRD. Recommendations explicitly marked for confirmation are not prior product approval.

## MVP+ preservation

[The original documentation](docs/mvp-plus/README.md) is preserved byte-for-byte under `docs/mvp-plus/`, including its original directory layout, catalogues, instructions and unresolved decisions. It is research/history for a possible later product, not authority for this MVP and not a promise to implement it next. Do not apply its release gates to current work.

The active formation and role catalogues retain their original taxonomy. The role document has an explicit applicability note; its impossible AR-05 example is superseded by the current verification contract without changing equivalence keys.

## Naming and setup

The [initial squad](docs/product/initial-squad.md) contains 36 numbered players transcribed from the user's screenshots. Its linked JSON is the seed source; it does not change the formation/role catalogue or decide pending admin validation policies.

The working title is neutral. No final brand or domain has been approved. `docs/research/naming.md` was missing at the audit and remains unavailable; do not fabricate it or treat Eleven Verdict as approved.

The public repository is [tomasminarik/SupporterXI](https://github.com/tomasminarik/SupporterXI), connected to Vercel project `supporterxi` in the existing Tomo team. Production admin sign-in, content publication and the live featured-fixture response are verified. The football-data.org token is configured in Vercel Production, and the importer has published 32 Premier League/Champions League fixtures. A rollback drill and observation of the first scheduled run remain. Provider credentials must never be committed.


## Local development

Use Node 24 (`nvm use` if you have nvm), or another version supported by `package.json`.

```sh
npm ci
npm run dev
```

Open [the homepage](http://localhost:3000/) to build an XI for the currently published fixture. Open the [interactive whiteboard](http://localhost:3000/dev/workbench) to try all 14 formations, place the supplied players, assign optional roles, and move/swap/clear the XI. The whiteboard uses clearly synthetic match contexts and separate browser memory. Try reloading, toggling availability, and simulating the next fixture. No credentials are required for either public page.

For a production preview: `npm run build`, then `npm start`.

## Checks and data ownership

```sh
npx playwright install chromium
npm run check
```

`check` runs lint, TypeScript, catalogue parity and unit tests, a production build, then Chromium browser/accessibility checks at four widths for both the production entry and local workbench. Production browser checks use port 3100; workbench checks start a development server on port 3101. Stop `npm run dev` before running the checks because Next.js permits only one development server for this directory. On Linux, use `npx playwright install --with-deps chromium`.

- Edit normative catalogue documents, then run `npm run catalogues:generate`. Do not edit `src/data/*.generated.ts`; build validation rejects stale outputs and specification/table discrepancies.
- `content/shared.json` is the single shared-content source. The original 36 squad records were moved here without changing IDs, names or numbers. Run `npm run content:generate` after player edits; `src/data/squad.generated.ts` is a generated public-only projection, never an independently edited roster. All 36 players start Active as approved; fixture availability defaults to Available.
- M-01 was approved on 8 October: Active players require unique integer numbers 1–99; only Inactive players may lack a number. M-02 is approved: existing selections survive availability changes, while removed ineligible players cannot be re-added.
- GitHub Actions runs validation and browser checks; Vercel builds from the connected repository. Verify deployment success separately from commit/push success.

See [foundation verification](docs/implementation/foundation-verification.md) for test mapping, limitations and the next slice.

`npm run test:workbench` verifies the development preview separately. `/dev/workbench` is enabled locally and on Vercel Preview deployments; it returns 404 on production deployments and local `npm start`.

Fixture content and rollover verification are documented in [fixture-shell verification](docs/implementation/fixture-shell-verification.md). The initial real fixture import and its publication are documented in [import verification](docs/implementation/import-verification.md).

See [browser-memory verification](docs/implementation/browser-memory-verification.md) for fixture integration, storage recovery and approved availability behavior. The admin backoffice and fixture import are implemented. [Operational readiness](docs/implementation/operations-verification.md) records the latest production observations, recovery checks and remaining live drills. PNG export remains the last feature, immediately before final release checks.

## Administration

Try the [admin form preview](http://localhost:3000/dev/admin) locally or on a Vercel Preview deployment. Its edits stay in page memory. Production [`/admin`](https://supporterxi.vercel.app/admin) now uses the configured GitHub administrator account. See [admin setup and verification](docs/implementation/admin-verification.md) for secure configuration, limitations and checks.

The fixture import route and admin refresh action are described in [import verification](docs/implementation/import-verification.md). Production has the provider token; an authorized refresh reports its import counts and checks publication. The public entry uses the published fixtures, with an honest no-fixture state if no future fixture qualifies.
