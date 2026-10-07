# ADR 001 — File-backed next-match MVP

**Date:** 22 September 2026.
**Status:** Implementation recommendation based on the agreed database-free direction. No services provisioned. Supersedes the earlier conversational Supabase proposal, which belonged to MVP+.

## Decision

Use one Next.js + TypeScript application on Vercel, with GitHub as code and content storage. Serve the builder primarily in the browser. Use small server routes for featured-fixture selection, admin authorization/content writes and fixture import. No database, Supabase, supporter authentication, transactional email provider, image storage or analytics service.

This is mostly static delivery with a small authenticated administrative backend, not a claim that administration can be entirely static.

## Administration

Recommend a narrow custom backoffice in the same application: Fixtures, Squad and fixture Availability. Reuse accessible form/dialog components. Authenticate the single administrator with GitHub OAuth and a server-configured immutable GitHub user-ID allowlist. Authorization must check identity on every privileged route. Use secure server-validated sessions and an OAuth state check; tokens remain server-side or encrypted in secure session cookies, never in browser localStorage or public content. No user/account database is needed.

Use the GitHub API to read/update one small shared-content document initially, with revision checks to prevent stale overwrites. A single-file atomic update simplifies concurrent imports and edits. The public deployment compiles that content into a validated artifact; the admin reads the latest source revision. Production only advances after a successful deployment. Do not expose repository editing beyond the allowed content path.

A Git-backed CMS such as Decap was explored, not selected. It can supply generic forms, but custom override handling, import reconciliation and publish status still need integration. A small purpose-specific backoffice keeps this workflow in one application. Re-evaluate only if an implementation spike shows substantially lower maintenance with an existing editor; preserve all authorization/validation requirements either way.

## Fixtures and import

The featured-fixture read route uses current server time and published content. This avoids needing a rebuild at exactly kickoff plus three hours. Use a non-stale response and refresh the browser at the boundary/on focus. No per-visitor calls to the provider.

Provide an admin Refresh fixtures action first. Add one approximately daily protected Vercel Cron refresh through the same import operation. The scheduler credential authorizes only the import route; it never substitutes for general admin access. Use a narrowly scoped GitHub integration credential for automated content writes. Verify commit attribution/deployment permission on the selected Vercel plan during setup; do not assume any bot-authored commit deploys.

Imports update only changed, non-overridden fields and produce no empty commits. An ambiguous match is surfaced for manual resolution. All callers use the same schema/concurrency checks. Exponential backoff and bounded requests avoid exhausting quotas. Manual refresh and editing remain available if a scheduled run fails.

## Browser and export

React working state plus best-effort versioned localStorage. SVG/HTML pitch with canonical coordinates and accessible controls. Browser Canvas PNG rendering uses bundled fonts and original local assets, avoiding remote-image export failures and server image costs. Validate real-browser downloads and both exact output sizes.

## Tests and development

One repository/package, npm lockfile, TypeScript checking, unit tests (Vitest), browser tests (Playwright) and automated accessibility checks. Verify current compatible stable package versions when setup begins. GitHub pull requests run validation/build/tests. Vercel preview deployments use test content and no production write or import credentials. Keep the production admin callback restricted to its configured origin.

## Costs and trade-offs

No recurring paid service is required by this design at small personal, non-commercial usage. This is not a promise of unlimited free hosting: API, GitHub and Vercel quotas/eligibility still apply. Do not automatically upgrade a plan. Domain registration, if chosen, is separate and not yet authorized.

File publishing means edits appear after a build/deployment, which the user accepts. Git provides change history and rollback, but is not a high-frequency database; suitable for one admin and occasional imports. Next.js gives one deployment for public UI and server routes at the cost of framework maintenance. GitHub-backed authentication avoids maintaining passwords but requires initial OAuth/permission setup.

## Evidence consulted during planning

- [Vercel Git deployment](https://vercel.com/docs/git)
- [Vercel Hobby eligibility](https://vercel.com/docs/plans/hobby)
- [Vercel daily Cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Decap GitHub backend](https://decapcms.org/docs/github-backend/)
- [football-data.org free pricing](https://www.football-data.org/pricing)
- [football-data.org coverage](https://www.football-data.org/coverage)

Free provider schedule delay has no verified maximum in reviewed documentation; accepted by the user. Check current provider terms/required attribution at integration. Do not import unrelated scores, statistics, squads or imagery just because the API exposes them.
