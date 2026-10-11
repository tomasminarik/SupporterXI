# Security review

Date: 11 October 2026. Scope: the repository at `main`, the live site at supporterxi.com (non-destructive probing), the Vercel project settings (read-only), the GitHub repository settings visible through the API, and all 89 commits of git history.

## Verdict

The backoffice is hard to take over. Sign-in is GitHub OAuth for one allowlisted account, with state and PKCE; the session is an encrypted, origin-bound, two-hour cookie; every write needs the session, the exact origin and a CSRF token; and every admin and cron route refused anonymous, forged and cross-origin requests when probed live. No secret was ever committed.

The review found one real leak (S1) and a set of missing defences. Everything that could be fixed in code is fixed and live. What remains is on the accounts behind the site, which only Tomas can check.

**The front door is the GitHub account.** Whoever controls it can sign in to the backoffice, push to `main` and read nothing more than that, but that is everything. The account checklist at the end matters more than any remaining code finding.

## Findings

| ID | Severity | Finding | Status |
|---|---|---|---|
| S1 | Medium | The `/sxi` analytics rewrite forwarded every request header to PostHog, including the backoffice session cookie whenever a signed-in administrator opened a public page. | Fixed, [PR 27](https://github.com/tomasminarik/SupporterXI/pull/27) |
| S2 | Medium | `main` has no branch protection or ruleset. A force-push or branch deletion is possible with any credential that can write to the repository. | Waiting on Tomas |
| S3 | Medium | Public pages sent no content security policy, frame protection, `nosniff`, referrer policy or permissions policy. | Fixed, [PR 28](https://github.com/tomasminarik/SupporterXI/pull/28) |
| S4 | Low | A session cannot be revoked. Signing out deletes the cookie in the browser; a copy of it stays valid until its two-hour expiry. | Accepted, see below |
| S5 | Low | Admin writes accepted `Sec-Fetch-Site: same-site`, so that check passed for a request from a sibling subdomain. Origin and CSRF-token checks still blocked it. | Fixed, [PR 29](https://github.com/tomasminarik/SupporterXI/pull/29) |
| S6 | Low | No rate limiting on the sign-in, admin or cron routes. | Deferred, see below |
| S7 | Low | Player, opponent, competition and round names accepted control characters and Unicode direction-override marks, from the backoffice and from the fixture provider. These reach the page, the share image and the repository. | Fixed, PR 29 |
| S8 | Info | The JSON-LD block did not escape `<`. Its content is static today. | Fixed, PR 28 |
| S9 | Low | Dependabot alerts and security updates are off; `npm audit` reports 5 high-severity advisories, all in the ESLint toolchain (`braces`, `micromatch`, `fast-glob`), none in code that ships. | Waiting on Tomas |
| S10 | Low | CI actions were pinned by tag, which the action's owner can move. | Fixed in this change (pinned by commit) |
| S11 | Info | Responses advertised `X-Powered-By: Next.js`. | Fixed, PR 28 |
| S12 | Info | A player name in a remembered lineup had no length limit. | Fixed, PR 29 |
| S13 | Info | The Vercel project has one deployment-protection bypass secret ("automation bypass"). | Waiting on Tomas |
| S14 | Info | `GITHUB_CONTENT_TOKEN` expires on 7 November 2026. Backoffice saves and the daily fixture import stop working when it does. | Waiting on Tomas |
| S15 | Info | HSTS is sent without `includeSubDomains` or `preload`. | Left as is, see below |
| S16 | Info | `/dev/admin` is reachable on preview deployments and shows the squad. Previews require a Vercel login and the squad is public. | No action |

### S1 in detail

Next.js rewrites to another host pass the incoming headers through. The session cookie is scoped to the whole site (the `__Host-` prefix requires it), so the browser attached it to every tracking request. Confirmed against a local echo server: before the fix the upstream received `Cookie` and `Authorization`; after it, neither.

`src/proxy.ts` now forwards the tracking requests itself, removes both headers, and builds the destination on a fixed PostHog host so no path can redirect it elsewhere.

Exposure: tracking went live on 10 October 2026, so any session cookie forwarded since then has already expired or will within two hours of its sign-in. Whether PostHog records request headers is not known. To be certain, change `ADMIN_SESSION_SECRET` in Vercel and redeploy; that invalidates every session ever issued.

### S3 in detail

Every response now carries a policy that allows scripts, styles, images, fonts and connections from the site's own address only, forbids plugins and framing, and restricts form targets. Inline scripts and styles remain allowed because Next.js and Ant Design emit them; removing that needs per-request nonces, which would make every page render on demand. The policy therefore limits where injected markup could load code from or send data to, but does not by itself stop an inline script. React escapes all rendered text and there is no raw-HTML rendering of data, so no injection path exists today.

### S4, S6, S15: why these were left

- **S4.** Revocation needs server-side session storage, which the architecture record rules out. The two-hour lifetime and the secret rotation above are the controls.
- **S6.** There is no password to guess: sign-in is delegated to GitHub, the cron secret is at least 32 characters, and each route does little work before rejecting a caller. A Vercel firewall rate limit on `/api/admin/*` and `/api/cron/*` would be a reasonable extra; it is an account setting.
- **S15.** `includeSubDomains` would force HTTPS on every present and future subdomain of supporterxi.com. Safe if none will ever serve plain HTTP; that is Tomas's call.

## What was checked and held

- **OAuth:** state compared in constant time, PKCE S256, flow cookie sealed and limited to ten minutes, allowlisted numeric ID, both cookies cleared on every callback, the access token discarded. No redirect parameter exists, so no open redirect.
- **Session:** AES-256-GCM with the origin as associated data; tampered, truncated and expired cookies are refused. The key is a SHA-256 of the secret, which is sound for a random secret of 32 characters or more.
- **Host confusion:** sign-in on the `vercel.app` alias answers 403; a forged `X-Forwarded-Host` does not change the callback address.
- **Writes:** 16 KB body limit, strict schemas, server-generated identifiers, revision check against the current file, no delete command.
- **Cron:** bearer secret compared in constant time; anonymous and wrong-secret calls answer 401; POST answers 405.
- **Import:** fixed provider URL, no redirects followed, 1.5 MB limit, schema validation, provider bodies never echoed.
- **Analytics:** only listed events and properties leave the browser; no cookie or stored identifier; nothing sent from `/gaffer`, `/dev` or `/api`.
- **Vercel:** all nine environment variables exist for Production only, secrets are stored as sensitive, previews require a Vercel login, the team has one member.
- **GitHub:** the repository is public by design, has one collaborator, no deploy keys, no webhooks and no Actions secrets; workflow tokens are read-only; secret scanning and push protection are on.
- **History:** no token, key or secret value in any commit; only `.env.example` was ever added.

## Not covered

- GitHub and Vercel account settings (two-factor, recovery, sessions, authorised apps) are not visible to this review.
- The Vercel firewall configuration was not read.
- The built-in `/security-review` skill reviews a branch diff, so it was not used for a whole-tree review.
- No load, brute-force or denial-of-service testing.

## For Tomas

1. **GitHub account:** confirm two-factor sign-in with a passkey or authenticator app (not SMS), store the recovery codes offline, and review active sessions, authorised OAuth apps and personal access tokens.
2. **Protect `main`:** add a ruleset that blocks force-pushes and deletion. Do not require pull requests there without a bypass: the backoffice commits content straight to `main`.
3. **Content token:** replace `GITHUB_CONTENT_TOKEN` before 7 November 2026. Confirm it is limited to this repository with Contents read/write and Deployments read.
4. **Dependabot:** turn on alerts and security updates in the repository's security settings.
5. **Vercel:** confirm two-factor sign-in; delete the automation bypass secret under Deployment Protection unless something uses it.
6. **OAuth app:** confirm its only callback address is `https://supporterxi.com/api/admin/auth/callback`.
7. **Optional:** rotate `ADMIN_SESSION_SECRET` once (see S1); add a firewall rate limit on `/api/admin/*` and `/api/cron/*`.
