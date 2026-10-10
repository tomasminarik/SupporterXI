# Codex instructions

Read README.md and every active document it marks authoritative before implementation.

- Implement the current MVP only. `docs/mvp-plus/` preserves the former scope and is not an instruction to build it.
- Preserve the 14 formations and 25 optional roles. Use one canonical runtime source each with parity and validation tests.
- No supporter accounts, database, saved submissions, Community XI, shared lineup URLs, archives, T-90 cutoff, or future-fixture browsing.
- Retain the admin backoffice; enforce authorization and validation on the server for every shared-data write.
- Supporter lineups live only in the browser. Do not create server persistence for them, and never send lineup content (players, formation, roles) to analytics.
- Keep fixture/player identities stable. Protect manual fixture overrides from imports and reject stale administrative writes.
- Use published fixture data and server time for automatic featured-fixture selection. A lineup locks 15 minutes after kickoff (view and share only) and the featured fixture changes 120 minutes after kickoff (user decision, 10 October 2026). There is no cutoff before kickoff.
- Desktop dragging must have click and keyboard alternatives. Mobile drag and drop is optional.
- PNG exports exclude roles, official crests, licensed kits and player photographs.
- Squad and availability are managed manually. Only fixture imports use football-data.org.
- Do not introduce substitutes, formation/role CRUD, profiles, tactical team instructions, or analytics beyond the cookieless usage tracking in docs/implementation/analytics.md (user decision, 10 October 2026).
- Follow the separate architecture decision record; explain material deviations before adopting them.
- Do not silently resolve affected blocking items in docs/decisions/open-product-decisions.md.
- Every implementation slice includes tests mapped to docs/implementation/verification.md.
