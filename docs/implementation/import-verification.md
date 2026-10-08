# Fixture import — 8 October 2026

The code supports an administrator-triggered refresh and a separate protected scheduler route. Both call the same operation. The provider token is configured as a Production-only Vercel Secret. The daily Vercel Cron schedule is 06:00 UTC; live execution and a content-changing publication still require verification.

The operation requests Manchester United team 66 matches from football-data.org v4 within seven days before to 180 days after the current UTC date. Only Premier League (`PL`) and Champions League (`CL`) entries with a valid United team ID and Scheduled, Timed, Postponed or Cancelled status are accepted. It reads no squad, scores, lineups or imagery. The endpoint is fixed server-side; the token is a Production-only server secret. Provider failures or malformed data make no content edit. Short rate-limit resets from the provider response header and transient server errors get at most two bounded retries; longer resets stop without further calls. An empty feed does not delete fixtures or imply cancellations.

Reconciliation uses the provider match ID as its sole identity key. It never overwrites manual fixture values or per-field corrections, changes internal IDs, or touches players/availability. A plausible collision with a manual fixture is reported and skipped for human review, without guessing that the records are identical. Import writes use the same validated single-file GitHub path and expected blob SHA as the admin editor. Unchanged imports make no commit. The admin reports added/updated/unchanged/skipped counts and potential duplicates, then checks publication separately.

The free tier currently lists both competitions as covered, and one read-only call with the new account returned matches from both on 8 October 2026. Schedules can still be delayed. The provider's [v4 team matches documentation](https://docs.football-data.org/general/v4/team.html) defines date filters and list shape; its [quickstart](https://www.football-data.org/documentation/quickstart) documents the `X-Auth-Token` header. [Current coverage](https://www.football-data.org/coverage) lists the two competitions in the free tier.

## Verification mapping

- MVP-11: `tests/fixtures/football-data-v4.json` contains two sanitized records captured from the actual free v4 team feed on 8 October 2026 (no token or unrelated fields). `tests/unit/fixture-import.test.ts` covers their mapping, filtering, stable provider/internal identities, idempotence, imported base updates, retained overrides, manual cup coexistence, ambiguity reporting, empty feeds, duplicate IDs and invalid kickoffs.
- MVP-12: the import uses the existing SHA-guarded GitHub publication path; tests verify a single content-file PUT and no empty commit.
- MVP-15: tests cover fixed/bounded provider requests, throttling retry, provider failure before any write, anonymous/manual/cron denial, preview isolation, and equivalent manual/scheduler no-change operations.

The remaining live step is an authenticated manual refresh, followed by commit/deployment attribution, live content digest and rollback checks. Keep `FOOTBALL_DATA_TOKEN` and a strong `CRON_SECRET` as Production-only Vercel Secrets. Do not publish synthetic test fixtures. PNG export remains the last feature before release checks.
