# Open product decisions

**Status:** Requires product review before affected implementation  
**Rule:** These are genuine gaps or contradictions in the approved material. Codex must not choose silently.

## Blocking decisions

### OD-01: Community XI can contain the same player twice

**Why unresolved:** The approved method chooses each slot independently. A versatile player can lead the vote in two slots, producing a duplicate even though a lineup must contain eleven unique players and the PRD calls the result coherent.

**Recommended decision:** Select the unique-player assignment across the eleven slots that maximizes total slot votes within the winning formation. Resolve equal total scores through a documented deterministic comparison based on the existing player tie hierarchy and canonical slot order. This best represents the strongest overall Community XI without making an arbitrary early slot consume a player.

**Leading alternative:** Process slots in canonical slot order, choose the normal winner not already used, and fall back to the next ranked unused player. It is easier to explain and implement, but slot order can materially change the XI and privileges earlier defensive slots.

**Needed approval:** Choose the recommended global assignment or the sequential alternative, including its final tie rule.

### OD-02: Kickoff meaning for a Postponed fixture

**Why unresolved:** The PRD says fixture kickoff is required, while Postponed means no confirmed replacement kickoff currently exists. It also refers to the original time passing without making the fixture historical.

**Recommended decision:** Preserve the last known kickoff for audit and display context, but treat the current scheduled kickoff as absent while status is Postponed. A new confirmed time restores Scheduled status and becomes the authoritative kickoff.

**Leading alternative:** Keep one kickoff field populated and rely on Postponed status to disable lifecycle calculations. This is simpler but makes it harder to distinguish an obsolete time from a confirmed future time.

**Needed approval:** Confirm whether a postponed public and personal view may display the last known kickoff, labelled as postponed.

### OD-03: Shirt-number validation for active players

**Why unresolved:** Shirt number is required, but the documents do not say whether active players must have unique numbers, what range is valid, or how to handle a newly added player without an assigned first-team number.

**Recommended decision:** Require an integer from 1 to 99 and uniqueness among Active players, while permitting an administrator to create the player as Inactive until a number is assigned. Historical duplicates remain valid after later number changes.

**Leading alternative:** Allow duplicate active numbers and rely on names plus stable identity. This supports uncertain or temporary squad information but weakens list clarity and the Community tie-break.

**Needed approval:** Confirm number range, active-squad uniqueness, and whether an unnumbered player can be Active.

### OD-04: Historical player value used for a Community tie

**Why unresolved:** Community ties use historical shirt number and player name, but the same player can have different saved snapshots across current submissions if an administrator corrects their name or number during the fixture window. The approved documents do not define which snapshot represents that candidate.

**Recommended decision:** For each candidate player, use the display snapshot from the most recently saved current submission for that fixture that contains the player. If two qualifying saves have the same timestamp, resolve the source record by stable submission ID. This remains reproducible from retained canonical submissions and allows a correction to become the representative value.

**Leading alternative:** Use the current player record during Editable and freeze its values at T-90. This is easier to understand operationally, but historical Community output then depends on a separate freeze snapshot rather than submission data alone.

**Needed approval:** Choose the source of shirt number and name for Community tie-breaking and display.

## Decisions that block branding, not core behaviour

### OD-05: Product name and domain

`naming.md` recommends Eleven Verdict, but its status is a recommended shortlist rather than an approved choice. Domain availability was a point-in-time check and does not reserve the domain.

**Recommended decision:** Approve Eleven Verdict only after rechecking the domain and completing an appropriate trademark review before public launch. Until then, use a neutral working title in code and avoid coupling identifiers to a brand name.

## Design decisions required before final UI acceptance

These do not change product scope and may be resolved during interaction design rather than in the architecture proposal:

- responsive breakpoints and the exact mobile, tablet, and desktop composition;
- player-list organization and ordering;
- visual treatment of player markers, selected slots, roles, and cleared-role notices;
- percentage rounding and formatting, while retaining exact numerator and denominator;
- export visual frame and approved product branding;
- empty-state and error copy;
- the exact authentication entry pattern after Save is chosen.

Codex may propose one recommended design for each, but must not treat an implementation default as prior product approval.

## Technical decisions deliberately deferred

These are not missing product requirements. They belong to the later architecture proposal:

- application framework and repository structure;
- database and schema technology;
- authentication provider and session implementation;
- admin authorization mechanism;
- fixture-data provider and refresh scheduler;
- fixture matching and reconciliation implementation;
- hosting, observability, cache, background-job, and image-rendering technology;
- optional persistence of unsaved working state across reloads.

Each technical choice must preserve the documented behaviour, historical integrity, minimal personal data, Vercel compatibility, low recurring cost, and maintainability by one non-engineer using Codex.

## Resolved during documentation audit

The following were ambiguous in prose but are resolved by combining existing approved rules:

- Exact lifecycle boundaries use the later state at T-90 and T+180.
- A Scheduled fixture that is not active cannot accept saves even when it is earlier than T-90.
- Clear XI changes only the working copy and never withdraws a saved submission.
- Roles remain attached to occupied slots on replacement and swap; roles clear when a slot becomes empty.
- A previously saved unavailable player remains grandfathered through safe moves, swaps, and formation preservation, but cannot be re-added after removal.
- Cancelled fixtures are not shown as completed public archive matches, while personal submissions and stable public links remain viewable.
- Historical role labels must be snapshotted just like formation and player display values.
- A public lineup URL is stable and automatically associated with a saved submission rather than creating a second publishable object.
- Fixtures and players have no destructive admin delete action in MVP.
