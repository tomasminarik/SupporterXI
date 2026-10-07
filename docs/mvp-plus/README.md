# Implementation documentation

This documentation set prepares the lineup-builder MVP for implementation without selecting a technical architecture.

## Authority and precedence

Codex must use the documents in this order when requirements appear to conflict:

1. `canonical-prd.md` defines product scope, actors, lifecycle, and user-visible behaviour.
2. `formations.md` defines the formation catalogue and its normative machine-readable data.
3. `player-roles.md` defines the role catalogue, compatibility, labels, and descriptions.
4. `application-behaviour.md` makes existing product decisions operational across pages, states, authentication, responsive interaction, sharing, and administration.
5. `data-integrity-and-community.md` defines persistence invariants, transaction boundaries, snapshots, fixture processing, and the Community XI calculation contract.
6. `verification.md` defines the minimum behaviour that must be proved before the MVP is accepted.
7. `open-product-decisions.md` records unresolved choices. It cannot override an approved source.
8. `naming.md` is research and a recommendation, not an approved brand decision.

`project-context.md` is superseded by `canonical-prd.md`. Keep it as research history if useful, but do not use it to resolve a conflict or implement excluded scope.

## How Codex should use this set

Before writing application code, Codex must:

1. Read the three canonical product files completely.
2. Read the implementation supplements and open-decision register.
3. Stop and ask for a product decision if the planned work intersects a blocking open decision.
4. Propose the technical architecture separately, explaining material choices in plain language.
5. Produce an implementation plan that maps each slice to requirements and verification cases.
6. Derive runtime formation and role data from one canonical source each, with parity tests.
7. Implement server-side validation for every persisted invariant. Client validation alone is insufficient.
8. Keep changes narrow. Do not add future ideas, dashboards, analytics, social features, or admin CRUD that the PRD excludes.

Routine technical choices are delegated to Codex only after product behaviour is fixed. Frameworks, database technology, authentication provider, fixture provider, hosting details, internal APIs, and repository structure are not selected here.

## Required repository placement

Place these files in the repository:

```text
README.md
AGENTS.md
docs/product/canonical-prd.md
docs/product/formations.md
docs/product/player-roles.md
docs/research/naming.md
docs/implementation/application-behaviour.md
docs/implementation/data-integrity-and-community.md
docs/implementation/verification.md
docs/decisions/open-product-decisions.md
```

The repository's normal developer README may later include setup and run commands. Until architecture is approved, this file is the implementation handoff index.
