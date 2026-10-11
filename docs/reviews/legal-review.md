# Legal review (first pass)

Date: 11 October 2026. Frame: a private individual in the EU operating supporterxi.com, a free site about an English club with many UK visitors. EU law (GDPR, ePrivacy, EU trade mark law) is the main frame; UK law matters for the club's marks and for UK visitors.

**Status of this document.** It is a first-pass review by an AI assistant from primary sources and the providers' current terms. It is not legal advice and has not been checked by a lawyer. Items marked "lawyer" are the ones where a short consultation would be money well spent before the site is promoted widely or ever earns money.

**Two inputs were missing.** The `ip-legal` and `privacy-legal` plugins chosen for this review were not installed when it ran, so the trade mark register search and the structured privacy assessment they provide were not done; the sections below say where. The EU country of the operator was not confirmed, which leaves the imprint question (L5) open.

## Verdict

Nothing here is alarming, and the product decisions already taken (no crest, no kit, no photographs, no accounts, cookieless tracking, an explicit "not connected" statement) are the right ones. Three things should be done before the site is promoted:

1. **Credit football-data.org.** Its terms require a visible credit and the site shows none (L1).
2. **Publish a privacy notice.** The site processes personal data (IP addresses at the host and at PostHog, the contact mailbox) and says nothing about it (L2).
3. **Make "unofficial" visible without a click.** The statement that the site is not connected to the club sits inside a collapsed block (L3).

Wording for all three is drafted below. None of it is live; it needs Tomas's approval and, for the privacy notice, his details.

## Findings

| ID | Area | Finding | Risk | Status |
|---|---|---|---|---|
| L1 | Provider terms | football-data.org requires the credit "Football data provided by the Football-Data.org API" in a footer, about section or similar visible place. It appears nowhere on the site. | Medium: a plain breach of the provider's terms, and the provider may cancel access without notice | Wording drafted, waiting on Tomas |
| L2 | Privacy | No privacy notice. GDPR Article 13 requires one wherever personal data is collected, and the operator's identity is part of it. | Medium | Draft below, waiting on Tomas |
| L3 | Trade marks | The non-affiliation statement is inside a collapsed "What is Supporter XI?" block; the footer says only "Independent supporter project". On the page and on every share image the club's name is the largest element. | Medium | Wording drafted, waiting on Tomas |
| L4 | Trade marks | Use of "Manchester United" itself: descriptive use of a club's name to say what a fan tool is about is generally permitted in the EU and UK when it follows honest practice, meaning no crest or official look, no suggestion of endorsement and no trading on the name. The site meets those conditions today. | Low while non-commercial; rises sharply with any monetisation or merchandise | Lawyer before any revenue |
| L5 | Operator disclosure | Whether a private, free, ad-free site must publish an imprint (name and address) depends on the country. Germany and Austria are strict; many other member states require it only of commercial services. | Unknown until the country is confirmed | Waiting on Tomas |
| L6 | Product name | A web search found no product or mark named "Supporter XI". One app ("Supporters Pick") describes its aggregated lineup as a "Supporters' XI". The phrase is descriptive, which makes conflict unlikely and registration hard. No register search (EUIPO, UKIPO) was done. | Low | Register search outstanding |
| L7 | Player data | Real names, shirt numbers and a public "unavailable" flag are personal data of the players. Naming professional players in a lineup tool rests comfortably on legitimate interest. The flag gives no reason, which keeps it away from health data. | Low | Keep as is: never publish a reason |
| L8 | Fixtures and competition names | EU case law holds that football fixture lists attract neither copyright nor the database right. "Premier League" and "UEFA Champions League" are used as plain text to name the competition, with no logos. | Low | No action |
| L9 | Analytics and consent | PostHog runs without cookies or device storage, on EU servers, with IP addresses discarded (confirmed in the project settings) and no visitor profiles. That is the low-risk end of analytics. Two soft spots: regulators' broad reading of "access to the device" could reach the screen and performance values the script reads, and UK rules now exempt statistics only if visitors are told and can opt out. | Low | Covered by the notice in L2; an opt-out is optional, see below |
| L10 | Processors | Vercel (hosting, request logs) and PostHog (usage statistics) act as processors. Each needs a data processing agreement in place: Vercel's is part of its terms; PostHog's has to be requested or accepted in the account. | Low | Waiting on Tomas to confirm PostHog's |
| L11 | Licences | The 134 production packages are under permissive licences (MIT, Apache-2.0, BSD, ISC), with two exceptions that create no obligation here: the image library's LGPL binaries, which run only on the server and are not distributed, and one build-time data package under CC-BY-4.0. Both fonts are under the Open Font Licence with their licence texts published beside them. The pitch texture is generated by a script in the repository. | None found | No action |
| L12 | Repository | The repository is public and has no licence file, so by default nobody may reuse the code. That is a valid choice if intended. football-data.org forbids keeping its API key in an open repository; the key is not in the repository or its history. | Low | Decide deliberately |
| L13 | Terms of use | No terms page. For a free tool with no accounts and no user content on the server, a short disclaimer is enough and optional. | Low | Optional wording below |

## Detail

### L1: football-data.org

The provider's terms (last updated 1 June 2018, on its About page) also say that a subscription covers one application on one domain, that the data may not be referenced after cancelling, and that club logos and photographs are not licensed by it. The site complies with all of these. The terms say nothing about commercial use of the free tier.

Imported fixtures are stored in `content/shared.json` in a public repository. The terms do not address that. Fixture facts are not protected (L8), so the exposure is contractual and small.

### L3 and L4: the club's name

What keeps descriptive use lawful is that an ordinary visitor would not think the club made or approved the site. The points in the site's favour: its own name and domain do not contain the club's name; there is no crest, kit, photograph or official typography; it is free and carries no advertising; it says it is independent.

What weakens it: the statement is hidden by default; the page's largest text is the club's name in a red close to the club's; the share image, which travels without the page, carries the club's name and the site's address and no "unofficial" wording.

What would change the assessment: advertising, sponsorship, affiliate links, paid features, merchandise, a crest or kit, or putting the club's name in a domain, app name or social handle. Any of those is the moment for a lawyer. Clubs do act against sites that look official or distribute their logos.

### L9: analytics

The lineup draft kept in the browser is exempt from consent because the visitor asked for it to be remembered, and the page already says so next to the builder.

The tracking stores nothing on the device, which takes it outside the classic cookie rule. An opt-out would close the remaining gap for UK visitors. The lightest version respects the browser's Global Privacy Control signal and adds one sentence to the notice. This is a product decision under `AGENTS.md`, so it is not implemented.

### UK visitors

The site plainly addresses people in the UK, so UK data protection law applies alongside the GDPR. One notice can serve both. UK law asks overseas operators to appoint a UK representative unless processing is occasional and low-risk; a hobby site with anonymised statistics is very likely within that exception. Lawyer, only if the site grows.

## Proposed wording (not live)

**Footer, always visible** (replaces "Independent supporter project"):

> Unofficial. Not affiliated with or endorsed by Manchester United.

**About block, added as a last line:**

> Fixture information: Football data provided by the Football-Data.org API.

**Share image:** consider the word "Unofficial" in the footer strip beside the site address. This changes an approved design, so it is a suggestion only.

**Privacy notice** (a short page linked from the footer; the bracketed parts are Tomas's to fill in):

> **Privacy**
>
> Supporter XI is run by [full name], [country]. Contact: dugout@supporterxi.com.
>
> **Your lineup stays with you.** The team you build is saved in your browser so it is still there when you come back. It is never sent to us. Clearing your browser data removes it.
>
> **Visit statistics.** We count visits and a few actions, such as opening the share dialog, to see whether the site is used. We use PostHog, on servers in the EU. No cookies are set, nothing is stored on your device, your IP address is not kept, and no profile of you is built. We never record which players, formation or roles you choose. We do this on the basis of our legitimate interest in knowing how the site is used.
>
> **Hosting.** The site is hosted by Vercel, which processes technical request data, including IP addresses, to deliver the site and keep it secure. Vercel is a US company and may process this data outside the EU under approved transfer safeguards.
>
> **Email.** If you write to us, we use your message and address only to reply.
>
> **Players.** The squad list shows professional players' names and shirt numbers, taken from public information. If you are a player or act for one and want something corrected, write to us.
>
> **Your rights.** You can ask what data we hold about you, ask for it to be corrected or deleted, and object to its use. Because we keep no data that identifies visitors, there will usually be nothing to find. You can complain to the data protection authority in your country[, or in [country]: [authority]].
>
> Last updated [date].

**Optional disclaimer** (same page or the About block):

> Supporter XI is provided as it is, free of charge. Fixture and squad information may be out of date or wrong; check official sources.

## For Tomas

1. Confirm the country you run the site from. That settles the imprint question and the authority named in the notice.
2. Approve or change the three pieces of wording; I will then build the footer line, the About line and the privacy page.
3. In PostHog, confirm a data processing agreement is in place for the organisation.
4. Decide whether you want an analytics opt-out.
5. Decide whether the repository should carry a licence or stay all-rights-reserved.
6. Enable the two legal plugins if you want the register search for "Supporter XI" and a structured privacy assessment added to this review.
7. Before any step towards revenue, talk to a lawyer about the club's marks.

## Sources

- football-data.org terms, About page: https://www.football-data.org/about
- football-data.org plans: https://www.football-data.org/pricing
- PostHog GDPR guidance: https://posthog.com/docs/privacy/gdpr-compliance
- PostHog project settings for project 301323, read on 11 October 2026 (`anonymize_ips: true`, cookieless server hash on, recordings off)
- Manchester United website terms: https://www.manutd.com/en/help/website-terms-of-use
- Football Manager fan-site dispute: https://www.worldipreview.com/news/judge-rejects-man-utd-s-football-manager-fan-site-claims-19746
- Court of Justice of the EU, Football Dataco v Yahoo! UK (C-604/10) and Fixtures Marketing (C-46/02, C-338/02, C-444/02), cited from memory and not re-read for this review
