# Fixture builder and browser memory — 8 October 2026

Integrates the existing editor into the public featured-fixture lifecycle. With no published fixture, the homepage remains honest and does not offer a fictional match. The preview workbench has synthetic matches, an availability toggle and its own storage key.

## Approved decisions and migration

M-02 and all 36 initial Active flags were explicitly approved by the user. Existing same-fixture selections survive inactive/unavailable changes, including restore and moves; removal blocks re-addition. Structural completeness intentionally ignores current eligibility for eventual PNG export. PNG rendering is not implemented in this slice. M-01 remains open; this is not final admin number validation.

`content/shared.json` advances to schema 2, adding `active: true` to each supplied player. UUID/name/number fingerprint is unchanged. Public fixture response schema 2 includes only current-fixture player eligibility, not internal availability records or future fixtures. With no fixture, its player array is empty. The generated static squad projection remains schema 1.

Browser draft schema 1 includes catalogue version, fixture snapshot, roster snapshot, content revision, formation, positions and roles. Keys are `starting-xi:working:v1` and `starting-xi:preview-working:v1`. There is one working XI per key, no archive or person identifier. Validation rejects malformed/version-incompatible data, unknown players, duplicate selections and invalid slots/roles. An explicit reset recovers invalid or different-fixture memory; blocked storage and quota errors leave editing usable with a warning.

The open XI retains its original fixture when the featured match changes. Starting the new fixture requires explicit confirmation and clears selections. Same-fixture corrections update context without losing selections. No lineup data is uploaded.

## Verification mapping

- MVP-01–05: catalogue, lineup and workbench tests continue to verify all formations/roles, move/swap/replacement/removal, destructive confirmation and keyboard alternatives.
- MVP-06: `tests/unit/draft.test.ts` checks serialization, schema/catalogue mismatch, corrupt records, storage failures, restoration and cross-fixture transitions. `tests/browser/memory.spec.ts` checks actual reload, role retention, reset and quota fallback.
- MVP-07: existing selector/refresh tests plus browser transition cancellation/confirmation preserve match identity through rollover.
- MVP-10 / M-02: unit and browser tests cover approved activation/default availability, retained unavailable selections, no re-addition, and completeness for eventual export. Admin form/auth/write validation remains later work.
- MVP-13: existing keyboard and axe checks at 320/390/768/1440px continue on the shared editor. Browser memory journeys run at all four widths. Manual screen-reader and mobile Safari release checks remain outstanding.
- MVP-14: browser checks assert no lineup upload, one browser-local key and unchanged excluded routes.

Verified: lint, TypeScript, production build, 69 unit tests, 36 public browser tests and eight workbench browser/accessibility tests pass. Run `npm run check`. No architecture deviation, real fixture seed, new remote service, supporter persistence or analytics was introduced. Next: PNG export, then authenticated backoffice and provider imports.
