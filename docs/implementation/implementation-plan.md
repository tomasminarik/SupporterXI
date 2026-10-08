# Final MVP implementation plan and next steps

**Date:** 22 September 2026.
**Status:** Agreed product direction with documented engineering recommendations. Documentation only; no application has been created.

## Outcome

Deliver a responsive Manchester United next-match XI builder: formation, eleven players, optional roles, browser memory and PNG export. Operate it through a small admin backoffice with file-backed fixtures/squad/availability and football-data.org fixture refreshes. No database or supporter account system.

**Handoff update:** The [initial squad](../product/initial-squad.md) now supplies 36 numbered players with stable IDs. No initial fixture data has been supplied. See the [new-chat handoff](new-chat-handoff.md) for the current starting point and recommended first slice.

## Agreed decisions

| Area | Decision |
| --- | --- |
| Product focus | One featured/next match for supporters; internal fixture list allowed |
| Formations and roles | Retain existing 14 formations and 25 optional roles |
| Sharing | Feed/story PNG only; roles excluded from image; no shared lineup links |
| Memory | Best-effort local browser state, no identity or device sync |
| Timing | Remove T-90 cutoff; homepage advances at kickoff+3h; manual override |
| Administration | Keep fixtures, squad and fixture availability forms |
| Data | GitHub-backed files, publishing delay accepted, no database |
| Provider | football-data.org for PL/Champions League; delayed schedules accepted |
| Manual work | Domestic cups, missing fixtures, squad and availability |
| Deferred | Original product retained as MVP+; branding provisional |

## Architecture

Follow [ADR 001](../decisions/001-mvp-architecture.md): one Next.js/TypeScript application on Vercel; browser builder/export; server admin and fixture-selection routes; GitHub content and admin identity; daily/manual provider refresh. Original Supabase/email/account architecture is superseded.

## Updated execution order — 8 October 2026

User requested PNG export as the last implementation feature before release. Execute the original phases in order 1 → 2 → 3 → 5 (backoffice) → 6 (imports) → 4 (PNG) → 7 (release checks). M-01 and M-02 are now approved; consult the current decision register. The numbered table below preserves phase identities, not the newly requested order.

## Ordered phases

| Phase | Deliverable | Verification / exit condition | Dependency |
| --- | --- | --- | --- |
| 0 — Handoff (this task) | Preserve MVP+; update PRD, instructions, architecture, decisions and verification | Document links and archived originals checked; active scope consistently excludes MVP+ | Complete with this documentation delivery |
| 1 — Foundation | Initialize Git/GitHub when implementation is authorized; minimal application, pinned dependencies, CI/build and test harness; derive catalogues | MVP-01 and initial MVP-14; no unchecked catalogue duplication | No unresolved product detail blocks this |
| 2 — Shared content and fixture shell | Seed approved manual squad/fixtures; stable IDs, server featured-fixture selection, timezone/TBC/no-fixture states | MVP-07; schema/unit cases; no rollover rebuild dependency | User supplies initial factual content or authorizes its preparation |
| 3 — Builder and roles | Responsive pitch and chooser, click/tap/keyboard/desktop drag, move/swap/clear/formation changes, local memory | MVP-02–06, MVP-13 incrementally; basic flow usable on mobile | Catalogue ready; M-02 before availability reconciliation |
| 4 — PNG sharing | Both templates, immutable render snapshot, local assets, downloads/error handling | MVP-08; role exclusion and mobile file delivery verified | Complete builder; M-02 for changed-availability export behaviour |
| 5 — Backoffice and publishing | GitHub admin login, forms, overrides, shared-content validation/concurrency and deployment status | MVP-09–10, MVP-12; admin recovery and unauthorized calls tested | GitHub/Vercel setup; M-01 before final number validation |
| 6 — Fixture imports | Test free key on covered United competitions; manual refresh, identity reconciliation, override preservation, daily protected refresh | MVP-11, MVP-15; provider failure and repeated imports proven | Working manual admin/publication; credentials available |
| 7 — Release readiness | End-to-end checks, responsive/accessibility QA, neutral or approved branding, operational guide and rollback exercise | All MVP-01–15; no affected blocking decision open; production-like smoke test | Previous phases complete; domain/brand only if selected |

Each phase is a small reviewable slice with its own tests. Provider integration does not block builder or manual-admin implementation. Manual operation remains possible if the free provider is temporarily unavailable.

## What can proceed independently

Catalogue generation/parity, project/test setup, interaction design, builder operations and export layout work are independent of credentials and Community decisions. Shared content modelling and admin form shells can progress while OAuth is configured. No API-key or brand prerequisite should block local development.

## Remaining narrow confirmations

See [decision status](../decisions/open-product-decisions.md). The previous discussion overstated that every edge rule was settled. Active-shirt-number policy (M-01) was never explicitly approved, and unavailable-player treatment must be adapted from saved submissions to browser-only state (M-02). Recommendations are supplied; stop only the affected validation/reconciliation work until confirmed.

The corrected AR-05 test follows existing canonical keys and requires no taxonomy redesign. Fixture transition presentation is an explicit recommendation, not a claim of prior approval.

## Next actions

1. Confirm M-01 and M-02 before their affected slices; use the recommendations if explicitly approved.
2. Start phase 1 only on authorization to implement. This task authorizes documentation, not application setup or deployment.
3. During setup, connect the user's GitHub/Vercel accounts, configure restricted admin OAuth and obtain a free football-data.org token through secure settings. Never ask for secrets in committed files.
4. Establish the initial squad/fixture content and test the provider's actual free coverage before relying on it.
5. Review the builder at mobile and desktop sizes before polishing the full interface; then complete admin/import integration and release verification.

## Operating the finished MVP

The administrator edits players, numbers and availability manually; maintains cup fixtures; corrects imported fields or clears overrides; and can feature a particular match. Content changes publish after validation/deployment. Imports preserve manual corrections. A failed import or deployment keeps the last good public content available. There are no supporter accounts or stored supporter submissions to manage.
