# supporterxi.com launch — 10 October 2026

The user owns supporterxi.com at Websupport.sk and authorized connecting it to the existing Vercel `supporterxi` project in the Tomo team. Domain ownership is verified in Vercel. Website DNS changes are saved in Websupport. Vercel verifies both domain configurations. The root serves the application over HTTPS; www serves a permanent HTTPS 308 redirect to supporterxi.com.

## DNS records requested by Vercel

Keep Websupport's nameservers. Change only the website records; preserve unrelated mail/TXT records. At the initial read both root and www resolved to Websupport's parking IP, 37.9.175.133. Re-read current records before editing.

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 216.198.79.1 |
| A | @ | 64.29.17.1 |
| CNAME | www | 2bd5115ef1edd59d.vercel-dns-017.com. |

These are this project's Vercel recommendations observed on 10 October 2026, not generic values to reuse for another project. Remove conflicting root/www parking records and inspect IPv6 before switching. Recheck with `vercel domains verify` for both names.

## DNS changes applied

On 10 October 2026, in the authenticated Websupport interface for supporterxi.com (service 16514364):

- Replaced the root parking A record with 216.198.79.1 and added 64.29.17.1, TTL 600.
- Removed the www parking A record and the root/www parking AAAA records (2a00:4b40:aaaa:2001::5).
- Created the www CNAME above, TTL 600. Websupport displays the saved target without the final dot.
- Preserved wildcard, mail, TXT, admin subdomain, nameserver and other existing records. No other domain was changed.

`vercel domains verify` returned `configured_correctly` for both domains, with both expected root addresses and the www CNAME. Root HTTPS returned HTTP 200 and the browser loaded the fixture, pitch and squad. Anonymous admin content requests returned the sign-in rejection. `/robots.txt` still disallows indexing until a new production deployment. www initially returned a certificate name mismatch; `vercel certs issue www.supporterxi.com` succeeded, and a direct HTTPS check at 216.198.79.1 then returned HTTP 308 with Location https://supporterxi.com/. PR #14 remained open at this check. OAuth settings and Production ADMIN_ORIGIN have not yet been migrated.

## Cutover verification

1. Verify DNS and HTTPS for the root, plus www's redirect to the root. Confirm the domain serves a Ready production deployment and the correct public content digest/player identities.
2. Set the existing GitHub OAuth application's homepage to `https://supporterxi.com` and callback to `https://supporterxi.com/api/admin/auth/callback`. Do not broaden account access or register a second administrator.
3. Change Vercel Production `ADMIN_ORIGIN` to `https://supporterxi.com`, preserving all other secrets and keeping Preview without authority. Deploy the accepted source again so this value and `VERCEL_PROJECT_PRODUCTION_URL` are current.
4. Verify login at `/gaffer`, authenticated editor read and a no-change save on the new domain. Sessions are bound to the origin; sign in again after migration. Verify anonymous admin API rejection. Retain the working old address until new-domain admin login succeeds.
5. Verify search metadata and `/robots.txt`: indexing must become enabled only for production with the purchased domain, while `/gaffer`, `/api/` and `/dev/` remain excluded. Preview remains noindex.
6. Verify an XI can be built/shared on the root domain. Preserve the existing published fixture data and protected daily import. Keep the content-token renewal due before 7 November 2026 on the operational checklist.

The manual device tests and operational recovery drills are already recorded in the existing verification documents. The user waived the second-account drill; do not call that drill passed. Remaining domain and deployment steps must be verified before declaring launch complete.
