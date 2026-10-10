# Usage tracking — 10 October 2026

The user decided on 10 October 2026, after launch, to measure how the site is used. This replaces the earlier "no analytics service" line in the architecture record and narrows the lineup rule in `AGENTS.md` to: lineup content is never sent.

## What it is

- **Service:** PostHog Cloud EU, project `Supporter XI` (301323) in the organization TM. It is separate from the `Portfolio` project, with its own key, settings and dashboards. Both share the free allowance of 1 million events a month.
- **Cookieless:** `cookieless_mode: 'always'` with in-memory persistence. No cookie, local storage or session storage is written, so there is no consent banner. PostHog counts visitors with a salted hash that changes every day, so a visitor cannot be followed from one day to the next. Returning-visitor and retention figures are therefore not available.
- **No people, no recordings:** no person profiles, autocapture, session replay, heatmaps, surveys, feature flags or error capture. IP addresses are discarded by the project.
- **Production only:** tracking starts only when `NEXT_PUBLIC_POSTHOG_KEY` is set, which it is in Vercel Production alone. Local runs, the checks and previews send nothing. It never starts on `/gaffer`, `/dev` or `/api`.
- **Own domain:** requests go to `/sxi/*` on supporterxi.com and are passed on to PostHog's EU servers by a rewrite in `next.config.ts`.

## What is sent

| Event | When | Properties |
| --- | --- | --- |
| `$pageview`, `$pageleave`, `$web_vitals` | automatically | page address, referrer, campaign tags, device, country |
| `lineup_started` | the first player is placed on an empty pitch | none |
| `lineup_completed` | the eleventh player is placed | none |
| `share_opened` | "Share your XI" is pressed | `fixture` (the public fixture id) |
| `share_image_saved` | the image is downloaded or shared | `fixture`, `size`, `method` |
| `share_failed` | the image could not be drawn | `fixture`, `size` |
| `contact_clicked` | the footer address is pressed | none |
| `not_found_seen` | the 404 page is shown | none |

Every event also carries `site: supporterxi`.

## What is never sent

Players, shirt numbers, the formation, roles, or anything else from a supporter's lineup. This is enforced in code, not only by convention: `allow` in `src/analytics/analytics.ts` runs before anything leaves the browser, drops any event that is not in the table and removes any property that is not listed for it. `track` only accepts the listed events and properties at compile time. To add an event, add it to `events` there, to this table and to `tests/unit/analytics.test.ts`.

## Verification

- `tests/unit/analytics.test.ts`: the event list, the property filter, the cookieless options, and where tracking is off.
- The existing browser checks still assert that the builder makes no unexpected requests and writes no storage besides the lineup; they run without a key.
- Live, after a deployment: build an XI and download an image on supporterxi.com; confirm requests go to `/sxi/`, no cookie or storage key from PostHog exists, no request body contains a player or formation, nothing is sent from `/gaffer`, and the events appear in project 301323 and not in `Portfolio`.
