# Codex instructions

Read `README.md` and all documents it marks authoritative before implementation.

- Preserve the approved MVP scope. Do not add attractive but unrequested features.
- Treat product behaviour as authoritative over implementation convenience.
- Do not resolve entries marked blocking in `docs/decisions/open-product-decisions.md` through code assumptions.
- Keep formation and role definitions in one canonical runtime source each. Add automated parity and validation tests.
- Enforce save eligibility, lifecycle boundaries, ownership, uniqueness, availability, role compatibility, and admin authorization on the server.
- Use server-authoritative time for fixture actions. Never trust a client clock for save eligibility.
- Make first saves and replacement saves atomic with their Community XI effect.
- Preserve stable identifiers and historical display snapshots. Never rebuild history from mutable current labels alone.
- Dragging must have tap or click and keyboard alternatives. Mobile drag and drop is optional.
- Do not introduce formation CRUD, role CRUD, user profiles, substitutes, team instructions, role aggregation, or extra analytics in MVP.
- Propose architecture in a separate decision record before selecting frameworks, providers, storage, or hosting details.
- Every completed implementation slice must include tests mapped to `docs/implementation/verification.md`.
