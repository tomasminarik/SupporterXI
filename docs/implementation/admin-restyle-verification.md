# Ant Design administration — 10 October 2026

The admin uses Ant Design 6 with a route-scoped dark theme, Supporter XI typography, responsive fixture cards, searchable fixture/player selectors, squad forms, availability controls, publication feedback and confirmation dialogs. Ant Design's Next.js registry renders initial styles on the admin routes only. The public builder and Claude's design-system work are separate.

The fixture panel explains the approved kickoff +15-minute lock and +120-minute rollover. Reload, fixture refresh and clearing an imported correction use focus-managed Ant Design dialogs. Clearing a correction shows the exact imported value that will resume. The existing commands, identity preservation, server authentication/CSRF/schema validation, SHA checks and publication verification remain in place. There is no content or browser-memory migration and no architecture deviation.

The user waived the live alternate-account OAuth drill on 10 October; no second account is required for launch. Automated rejection of anonymous/non-allowlisted identities remains mandatory. This waiver is not evidence that another real account was tested.

## Verification mapping

- **MVP-09/10/12/15:** Existing admin, publication and import unit/integration tests cover authorization, stale writes, provider/manual correction rules and pending/live/failed publication. No privileged server route changes.
- **MVP-10/13:** `tests/browser/admin-preview.spec.ts` covers invalid timezone and duplicate number failures with preserved input, manual fixture creation/editing, featured selection, deactivation without a number, availability and keyboard fixture selection/save at 320/390/768/1440px.
- **MVP-13:** Both fixture and availability views have axe/overflow checks; an open dropdown is also audited. Dropdown virtualization is disabled for this small catalogue; option lists are explicitly named. Selected text retains full opacity while open, since Ant Design's default 25% dimming fails contrast. Admin motion is disabled to avoid opacity traps when the shared reduced-motion rule suppresses animation completion.
- **MVP-14:** The preview records requests and rejects any non-GET network writes. Its edits remain in page memory and reset on reload. No supporter persistence or analytics is added.

Run `npm run check`. Desktop/mobile fixture and availability screenshots are written to `test-results/admin-*.png`. Actual deployment status is recorded separately from local verification.

## Local result

`npm run check` passed on 10 October 2026: lint, TypeScript, catalogue/content validation, 124 unit/integration tests, production build, 80 production browser checks and 37 workbench/admin checks (7 viewport-inapplicable cases skipped). Fixture and availability screenshots were inspected at desktop and narrow-mobile widths. `npm audit --omit=dev` reported zero production vulnerabilities. The pre-existing development-only lint-chain advisory remains recorded in operational readiness.

The existing all-formations desktop test had a hydration race: it injected localStorage after navigation while the builder's initialization could still overwrite it. Its staged test draft now enters localStorage before hydration, preserving the original assertions and product behaviour. The final full run passed that check.

The admin sign-in link uses the configured origin, allowing the existing authorized login address to work during domain cutover. The domain launch record describes the pending DNS/callback/environment verification.

## Backoffice address — 10 October 2026

At the user's request, the production page and its Ant Design layout now live at `/gaffer`. Successful and failed OAuth flows return there, as does sign-out. `/admin` no longer serves a page. The secured API endpoints and registered OAuth callback remain under `/api/admin/`; moving the page does not require changing the OAuth callback path. `/gaffer` keeps noindex metadata and is excluded by production robots rules. Tests are mapped in the current verification contract (MVP-09/14).

Route-change validation passed: lint, typecheck, catalogue/content checks, 125 unit/integration tests, production build, 80 production browser checks and 37 workbench/admin checks (7 viewport-inapplicable skips). Browser suites required local-server permissions. Stale generated development route types were removed after renaming the route; no source workaround was needed.
