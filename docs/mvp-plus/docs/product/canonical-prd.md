# Manchester United Lineup Builder

## Canonical Product Requirements Document

**Status:** Approved product definition  
**Version:** 1.0  
**Date:** 18 September 2026  
**Audience:** Product design, product research, and implementation through OpenAI Codex

---

## 1. Purpose of this document

This document is the canonical statement of what the MVP must do and why.

It defines:

- product scope and non-goals
- user-visible behaviour
- lifecycle states and transitions
- domain concepts and data meaning
- functional requirements
- edge cases and failure behaviour
- acceptance criteria
- constraints that implementation must preserve

It deliberately does not choose:

- application framework
- database or schema technology
- authentication provider
- fixture data provider
- hosting architecture beyond the stated deployment constraints
- internal component, service, API, or repository structure

Those decisions belong to technical planning by Codex after this PRD and its dependent specifications are complete.

---

## 2. Product definition

The product is a match-specific Manchester United lineup builder.

It lets a supporter choose the starting XI they would select for the currently active Manchester United fixture. A secondary tactical layer lets the supporter optionally assign predefined football roles to selected players.

An authenticated saved lineup contributes to an aggregated Community XI for that fixture. The product does not expose individual users or provide a social feed.

The product is intentionally narrow:

- Manchester United only
- one active fixture experience at a time
- starting XI only
- one saved lineup per authenticated user per fixture
- no public profiles or social graph
- no match results or player-performance analysis
- no monetization
- minimal ongoing administration
- minimal personal-data collection
- responsive browser experience for mobile and desktop
- zero-cost infrastructure where practical at MVP usage levels

---

## 3. Product goals

### 3.1 Primary goal

Let a supporter create a valid starting XI for Manchester United's active fixture quickly and visually.

### 3.2 Secondary goals

- Let interested users add tactical meaning through optional player roles.
- Let authenticated users keep one persistent lineup per fixture across devices.
- Show what participating supporters collectively selected through Community XI.
- Let users share a lineup as a public read-only page or a social image.
- Preserve historical submissions exactly as they existed when the fixture became locked.

### 3.3 Product acceptance outcomes

The MVP is successful as a product implementation when:

- a user can build a complete XI on both mobile and desktop
- no invalid lineup can be saved
- authentication is deferred until saving
- fixture cutoffs are applied consistently
- saved and Community lineups remain historically trustworthy
- all Community XI outputs can be reproduced from retained submission data and the documented aggregation rules
- routine fixture and player administration does not require code changes

No adoption, retention, satisfaction, or performance target is invented in this PRD without supporting evidence.

---

## 4. Product principles

### 4.1 The next match is the product

The default entry point revolves around the currently active Manchester United fixture and the primary action **Build my XI**.

The archive and Community XI are secondary destinations.

### 4.2 Lineup first, tactics second

Choosing eleven players is the main task. Roles must never be required to complete or save a lineup.

### 4.3 Match-specific by design

Every saved lineup belongs to exactly one fixture. There is no generic tactical sandbox in MVP.

### 4.4 Real football structure without artificial player restrictions

- A saved lineup contains exactly eleven unique players.
- Each player occupies one formation slot.
- Each slot contains at most one player.
- Any available player may occupy any formation slot.
- The slot, not the player's registered position, determines which tactical roles are offered.
- A player already used in the XI is removed from the available-player list.

The product intentionally allows supporters to make unconventional or out-of-position selections.

### 4.5 Automation with manual control

Fixtures should be refreshed automatically where practical. An administrator must be able to correct imported information, and an explicit manual correction must not be overwritten by a later automated refresh unless the administrator clears that override.

### 4.6 Historical integrity

Past lineups represent what users selected for that fixture. Later squad, shirt-number, availability, formation-library, or role-library changes must not alter historical meaning.

### 4.7 Product rules before implementation convenience

If an implementation choice conflicts with an explicit behaviour in this PRD, the product behaviour takes precedence unless this PRD is deliberately revised.

---

## 5. Actors and access

### 5.1 Anonymous visitor

An anonymous visitor may:

- view the active fixture
- build a complete XI
- assign optional roles
- clear or modify the working XI
- view Community XI
- view public lineup links
- export a complete working XI as a PNG
- browse the public fixture archive and historical Community XIs

An anonymous visitor may not:

- save or submit a lineup
- contribute to Community XI
- access a personal archive
- access administration

### 5.2 Authenticated user

An authenticated user has all anonymous capabilities and may also:

- save one lineup per fixture
- replace that lineup while the fixture is editable
- access their personal archive
- access their most recent previous lineup from the active fixture experience
- generate and share a stable public URL for a saved lineup

Authentication must not create a broader account experience. MVP has no username, avatar, biography, public profile, followers, or profile customization.

### 5.3 Administrator

The administrator may:

- manage fixtures and their schedule status
- create and correct fixtures manually
- manage players
- activate or deactivate players
- manage fixture-specific availability
- inspect imported information and manual overrides

Formation and role CRUD are not part of the MVP admin interface.

---

## 6. Domain concepts and data semantics

This section defines what product data means. It does not prescribe database structure.

### 6.1 Fixture

A fixture represents one scheduled Manchester United match.

Required product data:

- opponent
- kickoff timestamp
- schedule status

Preferred when available:

- home or away designation
- competition
- matchweek or competition round

No result, score, final whistle time, or official starting XI is required.

### 6.2 Fixture schedule status

A fixture has one of these schedule statuses:

- **Scheduled:** a valid kickoff timestamp exists and normal lifecycle rules apply.
- **Postponed:** no confirmed replacement kickoff currently exists. The fixture is not editable and is not the active fixture.
- **Cancelled:** the match will not be played. The fixture is not editable and is not the active fixture.

When a postponed fixture receives a new kickoff timestamp and becomes Scheduled again, its lifecycle is recalculated from that timestamp.

### 6.3 Active fixture

The active fixture is the earliest Scheduled fixture whose archive threshold has not passed.

Only the active fixture may accept new or replacement submissions.

Future fixtures may exist in the system but are not lineup-building destinations in MVP.

If there is no active fixture, the landing experience shows a clear no-upcoming-fixture state and retains access to archives.

### 6.4 Player

A player represents a person who may be selected in a lineup.

Required public data:

- name
- shirt number
- active or inactive squad state

MVP does not require player-position eligibility, photographs, nationality, age, statistics, or biography.

### 6.5 Squad state

- **Active:** eligible to be made available for current and future fixtures.
- **Inactive:** cannot be newly selected but remains present in historical and already saved lineups.

### 6.6 Fixture availability

For a specific fixture, every active player is either:

- **Available**
- **Unavailable**

Active players are Available by default unless the administrator marks them Unavailable.

No injury category, reason, or expected-return date is stored or displayed.

### 6.7 Formation

A formation is a predefined tactical structure supplied by the canonical formation specification.

Every formation definition must provide:

- stable formation identifier
- human-readable name
- exactly eleven slot definitions
- visual pitch coordinates for every slot
- positional identity for every slot
- supported role identifiers for every slot
- deterministic slot-equivalence information used when changing formation
- deterministic display order used for tie resolution

The intended library contains approximately 10 to 15 researched formations. The final number is defined by the formation specification, not by this PRD.

### 6.8 Formation slot

A formation slot is one predefined position on the pitch.

It determines:

- where its player marker appears
- its positional label
- which optional roles are valid
- whether it is equivalent to a slot in another formation

It does not restrict which available player can occupy it.

### 6.9 Player role

A player role is an optional predefined tactical description associated with an occupied slot.

Roles:

- come from the canonical role specification
- are valid only for supported slot types
- are never selected by default
- are never required for saving
- do not have attack, support, or defend duties
- cannot be created by normal users

### 6.10 Working lineup

A working lineup is the current editable state in the user's browser.

It may be incomplete and may differ from the user's last saved lineup until Save succeeds.

A working lineup does not contribute to Community XI.

### 6.11 Saved lineup

A saved lineup is the authenticated user's current submission for one fixture.

It contains:

- fixture reference
- formation reference and historical formation label
- exactly eleven slot assignments
- one unique player per slot
- historical player name and shirt-number values sufficient to preserve display integrity
- optional valid role per occupied slot
- created timestamp
- most recent successful save timestamp
- authenticated owner reference

Saving again before lock replaces the content of the same submission. MVP does not expose earlier versions.

A saved lineup cannot be withdrawn or deleted by the user. It can only be replaced while the fixture is editable.

### 6.12 Community XI

Community XI is an aggregate derived only from current valid authenticated saved lineups for one fixture.

It is not a collection of public user lineups and exposes no owner identity.

### 6.13 Historical snapshot

When a fixture enters Locked state, the product must preserve enough fixture, formation, slot, player, role, lineup, and Community XI data to reproduce what users saw at that point.

If the same fixture later becomes Editable because its kickoff changes, its aggregate becomes live again and may change through replacement submissions. It freezes again at the new T-90 boundary.

### 6.14 Retained data for future analysis

The MVP must retain the canonical saved-submission data required to derive future statistics, including:

- selected formation
- player assigned to each slot
- optional role assigned to each slot
- submission creation and update timestamps
- fixture and lifecycle references

The MVP does not need to expose every statistic that can be derived from this data. Retention of source data must not create new user-facing analytics scope or duplicate speculative aggregate datasets.

---

## 7. Global product invariants

The following rules must always hold:

1. A saved lineup belongs to exactly one user and one fixture.
2. A user has at most one saved lineup for a fixture.
3. A saved lineup contains exactly eleven occupied formation slots.
4. A player appears at most once in a saved lineup.
5. Every saved role is valid for its slot.
6. Roles may be absent from any or all slots.
7. Anonymous working lineups never contribute to Community XI.
8. A successful replacement save updates Community XI using only the newest saved state.
9. Player or squad changes never remove a player from an already saved lineup.
10. Historical displays do not depend on mutable current player or formation labels alone.
11. Server-authoritative fixture time determines whether saving is allowed.
12. A manual administrative fixture correction takes precedence over imported values until explicitly cleared.
13. Public lineup pages never expose the lineup owner's identity.

---

## 8. Fixture lifecycle

Lifecycle applies only to Scheduled fixtures.

### 8.1 Editable

**Period:** From the time the fixture becomes the active fixture until 90 minutes before scheduled kickoff.

Permitted behaviour:

- build a working lineup
- save a first submission
- replace an existing submission
- change players or formation
- assign, replace, or remove roles
- view Community XI
- export an image
- share a saved lineup URL

The user may not withdraw a saved submission.

### 8.2 Locked

**Period:** From 90 minutes before scheduled kickoff until 180 minutes after scheduled kickoff.

Behaviour:

- new submissions are rejected
- replacement submissions are rejected
- saved lineups are read-only
- Community XI is read-only
- public links remain available
- image export remains available
- the locked fixture remains the primary fixture experience

### 8.3 Archived

**Period:** Beginning 180 minutes after scheduled kickoff.

Behaviour:

- the fixture moves to archive
- personal saved lineups remain permanently viewable
- Community XI remains permanently viewable
- public lineup links remain available
- the next Scheduled fixture becomes active

The product does not need to know whether the match actually finished.

### 8.4 Kickoff changes and lifecycle recalculation

Whenever an administrator or accepted import changes the kickoff timestamp, the product recalculates the lifecycle from the new timestamp.

Therefore:

- a Locked or Archived fixture may return to Editable if its new kickoff is sufficiently far in the future
- the same saved submissions remain associated with the same fixture
- those submissions become editable again
- Community XI resumes live recalculation
- the fixture locks again at 90 minutes before its new kickoff
- the fixture archives again at 180 minutes after its new kickoff

Users are not notified of the change in MVP.

### 8.5 Postponed without a new kickoff

When a fixture becomes Postponed without a confirmed kickoff:

- it is removed from the active-fixture position
- no new or replacement submission is accepted
- existing submissions are preserved as read-only
- it does not become historical merely because the original kickoff time passes
- another Scheduled fixture may become active

When a new kickoff is assigned, the same fixture returns to Scheduled and its lifecycle is recalculated.

### 8.6 Cancelled fixture

When a fixture becomes Cancelled:

- it is removed from the active-fixture position
- no new or replacement submission is accepted
- existing submissions remain viewable as read-only with cancelled status
- it does not contribute an entry presented as a completed historical match

---

## 9. Core experience requirements

### 9.1 Landing experience

The landing experience must prioritize:

1. active fixture context
2. **Build my XI**
3. Community XI
4. the authenticated user's most recent previous lineup
5. archive access

Required fixture context when available:

- Manchester United and opponent
- home or away orientation
- competition or round when known
- localized kickoff date and time
- explicit timezone abbreviation
- current lifecycle state when it affects available actions

Kickoff must display in the viewer's local timezone. The source timestamp must remain unambiguous so two viewers may see different local times for the same fixture without changing its identity or cutoff.

### 9.2 Starting a lineup

- A user starts with no selected formation unless reopening an existing saved or locally retained working lineup.
- The user must select a formation before placing players.
- Selecting a formation creates eleven empty slots.
- No player is selected automatically.
- No role is selected automatically.

### 9.3 Selecting players

Desktop requirements:

- drag an available player into an empty slot
- select an empty slot and choose a player without requiring drag
- select an occupied slot to replace, move, or remove its player

Mobile requirements:

- tap a slot and select an available player
- tap an occupied slot to replace, move, or remove its player
- drag and drop may be supported but is not an MVP acceptance requirement

Shared behaviour:

- any available player may occupy any slot
- selecting a player removes that player from the available list
- removing a player returns that player to the available list if still selectable
- replacing a player returns the former occupant to the available list if still selectable
- the same player cannot occupy two slots

### 9.4 Moving and replacing players

- Moving a player to an empty slot vacates the original slot.
- Moving a player onto an occupied slot swaps the two players.
- A role remains attached to its slot, not automatically to the player moving away from it.
- If a role is invalid after a swap or replacement, that role is cleared.
- The interface must make any cleared role apparent without blocking the player move.

### 9.5 Changing formation

Changing formation must use deterministic safe preservation:

1. Players in slots marked equivalent by the formation specification remain selected in the equivalent destination slots.
2. Roles remain only when valid for the destination slot.
3. Invalid roles are cleared.
4. Players from slots with no safe equivalent return to the available-player list.
5. The product must not guess a new destination for unmatched players.
6. The product must not select any new player.

The user should see a concise explanation before confirming a formation change when it will unassign one or more selected players or clear one or more roles.

### 9.6 Clear XI

Clear XI removes all players and roles from the working lineup while retaining the selected formation.

If the user already has a saved lineup:

- Clear XI does not delete or withdraw that saved submission
- the saved lineup remains unchanged until another complete lineup is successfully saved
- the interface must make this distinction clear

### 9.7 Roles

- Roles are accessible only for occupied slots.
- The role chooser shows only roles valid for that slot.
- The user may assign, replace, or remove a role.
- Removing a player also removes that working slot's role.
- A complete XI with no roles is fully valid.

---

## 10. Availability and squad changes

### 10.1 New selection

Unavailable or inactive players cannot be newly added to a working lineup.

### 10.2 Previously saved selection

If a player becomes Unavailable or Inactive after a user saved them:

- the player remains in that saved lineup
- the player remains in the user's loaded working lineup
- the product does not notify the user
- the product does not replace the player
- the saved lineup remains valid

If the user removes that player, the player cannot be selected again while still Unavailable or Inactive.

### 10.3 Availability changing during an unsaved session

Before saving, the product must revalidate current player eligibility.

If a player became Unavailable or Inactive after being added but was never part of that user's previously saved submission:

- saving is rejected
- the affected player is identified
- the user must replace that player

If the player was already preserved in the user's previous saved submission, the grandfathering rule in section 10.2 applies.

---

## 11. Saving and authentication

### 11.1 Save eligibility

Save is available only when:

- the fixture is the active fixture
- the fixture is Editable according to server-authoritative time
- a formation is selected
- all eleven slots are occupied
- all eleven players are unique
- every new player selection is currently eligible
- every assigned role is valid for its slot

### 11.2 Anonymous save flow

The required flow is:

1. User builds a complete XI anonymously.
2. User chooses Save lineup.
3. Product requests authentication.
4. The working lineup survives successful authentication.
5. Product revalidates fixture state and lineup validity.
6. If valid, the submission is saved.

If authentication is cancelled or fails, the working lineup remains available in the current session where practical and no submission is created.

### 11.3 Existing-submission collision after authentication

If authentication reveals that the user already has a saved lineup for the fixture:

- the existing lineup must not be replaced silently
- the product explains that only one saved lineup is allowed
- the user may confirm replacement with the newly built lineup or cancel and retain the existing submission

### 11.4 Replacement save

Saving a valid lineup when the user already has a submission replaces that submission atomically.

After success:

- the personal lineup shows the replacement
- Community XI uses only the replacement
- the prior saved content is not exposed as a separate version

### 11.5 Cutoff during authentication or saving

If the fixture reaches T-90 before the save is accepted:

- the save is rejected
- no partial submission is created
- no Community XI contribution is made or changed
- the user sees that the fixture has locked
- the working lineup may remain visible locally but is read-only and cannot be submitted

### 11.6 Concurrent edits

If the same user saves the same fixture from more than one session while Editable, the last successfully accepted complete save becomes the single canonical submission.

The product must never count both versions in Community XI.

### 11.7 Save failure

On network or service failure:

- the product must not claim success
- the previous saved submission remains canonical
- the current working lineup remains available for retry where practical
- the user receives a clear retryable or non-retryable error state

---

## 12. Community XI

### 12.1 Eligibility

Only the current valid saved submission from each authenticated user contributes.

Anonymous lineups, incomplete working lineups, and failed saves do not contribute.

### 12.2 Aggregation method

Community XI is calculated formation first.

1. Count valid saved submissions by formation.
2. Select the formation with the highest submission count.
3. Consider only submissions using that selected formation.
4. For each formation slot, count the players assigned to that slot.
5. Select the most frequently assigned player for each slot.
6. Calculate each displayed player's slot-selection percentage using only submissions with the selected formation as the denominator.

This produces a coherent eleven-player lineup using one formation.

### 12.3 Tie handling

Tie handling must be deterministic and reproducible.

Formation ties are resolved by the canonical formation display order.

Player ties within a slot are resolved in this order:

1. higher total selection count across all valid submissions for the fixture
2. lower historical shirt number
3. alphabetical player name

The UI does not need to explain tie resolution unless it presents misleading precision.

### 12.4 Live and frozen behaviour

While Editable:

- Community XI recalculates after every successful first save or replacement save
- Community XI may change as new submissions arrive

While Locked or Archived:

- Community XI is read-only and stable

If a kickoff change returns the fixture to Editable, Community XI resumes recalculation and freezes again at the new T-90 boundary.

### 12.5 MVP Community display

The MVP Community XI displays:

- selected formation
- eleven selected players in formation slots
- selection percentage for each displayed player within that formation and slot
- total number of valid saved submissions for the fixture
- number of submissions using the selected formation, so the percentage denominator is understandable

Community role aggregation is excluded from MVP.

### 12.6 Empty and low-volume states

- With zero submissions, show a clear empty state and do not fabricate a lineup.
- With one or more submissions, Community XI may be shown with the actual submission count.
- No minimum privacy threshold is required because no contributor identity is exposed.

---

## 13. Personal archive

Authenticated users have a simple chronological archive of their saved submissions.

Each entry should identify:

- fixture date
- opponent
- home or away context when known
- formation
- fixture status when postponed or cancelled

Archived submissions are read-only unless a kickoff change returns that fixture to Editable.

The archive has no folders, tags, search requirement, comments, notes, or alternative versions.

The most recent previous saved lineup must also be reachable from the active-fixture experience without first opening the complete archive.

---

## 14. Public lineup links

Every saved lineup has a stable public read-only URL.

The public page displays:

- fixture context
- formation
- eleven selected players
- optional player roles
- current fixture status when relevant
- **Build your XI** acquisition action

The page must not expose:

- owner name
- email address
- profile
- other lineups by the same owner
- edit controls for visitors

While Editable, replacing the saved lineup updates what the stable URL displays.

While Locked or Archived, the URL displays the preserved read-only lineup.

If a rescheduled kickoff reopens the fixture and the user later replaces the lineup, the same URL displays the new canonical saved state.

---

## 15. Image export

### 15.1 Eligibility

A complete valid working or saved lineup may be exported, including by an anonymous user.

An incomplete lineup cannot be exported as a final sharing image.

### 15.2 Required formats

- Feed portrait: 1080 × 1350 pixels, 4:5
- Story: 1080 × 1920 pixels, 9:16
- PNG output

No square or landscape format is required for MVP.

### 15.3 Required content

- fixture context
- formation
- players
- football pitch
- product branding where appropriate

Player roles are intentionally excluded from exported images. Full tactical detail remains available through the saved lineup's public URL.

The export must not contain official club crests, licensed kit reproductions, or player photographs.

---

## 16. Fixture import and correction

### 16.1 Automated refresh

The system should refresh fixture information approximately once every 24 hours using a suitable free source where feasible.

Refresh should detect:

- new fixtures
- changed kickoff timestamps
- postponed fixtures
- rescheduled fixtures
- cancelled fixtures when supplied
- newly confirmed cup fixtures
- progression into future cup rounds

### 16.2 Manual override precedence

The administrator may manually correct any imported fixture field.

Once manually overridden:

- that field must retain the administrator's value during later imports
- unrelated non-overridden fields may continue updating
- the administrator may explicitly clear the override to resume imported updates

### 16.3 Import failure

If refresh fails:

- existing fixture data remains available
- existing manual data is not removed
- the public product continues using the last accepted schedule
- the administrator can still create or correct fixtures manually

The MVP does not require a public import-error message.

---

## 17. Administration requirements

Administration exists in the same product and codebase, for example at `/admin`, with access restricted to the administrator.

### 17.1 Fixtures

The administrator can:

- view fixtures
- create a fixture
- edit opponent
- edit kickoff timestamp
- edit schedule status
- edit home or away designation
- edit competition
- edit matchweek or round
- view which fields are imported or manually overridden
- clear a manual override

### 17.2 Players

The administrator can:

- create a player
- edit player name
- edit shirt number
- activate a player
- deactivate a player

Historical lineups must continue using their preserved historical display values.

### 17.3 Availability

For each relevant fixture, the administrator can mark every active player Available or Unavailable.

No reason is required or displayed.

### 17.4 Formation and role definitions

Formation and role CRUD are excluded from the MVP admin interface.

The application consumes the canonical formation and role specifications. The technical plan may choose how those definitions are represented and updated.

### 17.5 Admin design

The admin interface prioritizes clarity and speed over bespoke visual identity. It may use an established open-source component system.

The consumer interface must not inherit an enterprise-dashboard visual style merely because the admin interface uses one.

---

## 18. Design and interaction requirements

### 18.1 Direction

The consumer product should feel closer to a tactical whiteboard than a fantasy-football product.

Required characteristics:

- full top-down football pitch
- red as the dominant identity colour
- original player markers, abstract tokens, or original SVG shirts
- strong hierarchy around the active fixture
- low navigation complexity
- restrained visual system
- high-quality mobile and desktop layouts

Football Manager may inform tactical expectations but must not be visually imitated.

### 18.2 Player representation

Do not use:

- player photographs
- official player imagery
- official Manchester United crest
- licensed kit imagery or reproductions

### 18.3 Responsive behaviour

The complete core loop must work in modern mobile and desktop browsers.

The conceptual interaction remains consistent across devices, but gestures do not need to be identical.

### 18.4 Accessibility

- Dragging must never be the only way to place or move a player.
- Core actions must be keyboard-operable on desktop.
- Focus, selected, unavailable, error, and locked states must not rely on colour alone.
- Text and controls should target WCAG 2.2 AA contrast and interaction expectations.
- Motion must not be required to understand state changes.

---

## 19. Error and boundary behaviour

### 19.1 No active fixture

Show that no upcoming fixture is currently available. Do not show a broken or invented fixture. Keep archive access available.

### 19.2 Fixture changes while builder is open

Before saving, re-read authoritative fixture state and kickoff.

If the fixture remains Editable, use its updated context. If it has locked, been postponed, or been cancelled, reject the save and explain the new state.

### 19.3 Duplicate player attempt

Prevent the same player from being placed twice. Do not defer this validation until Save.

### 19.4 Incomplete lineup

An incomplete working lineup may remain on screen, but Save and final image export are unavailable.

### 19.5 Invalid role after change

Clear the invalid role, preserve the valid player move or formation change, and inform the user non-blockingly.

### 19.6 Community calculation failure

Do not show stale data as newly calculated without indication. Preserve the user's ability to view and manage their own lineup independently of Community XI availability.

### 19.7 Refresh or reload

For authenticated users, the last successfully saved lineup is canonical after reload.

Preservation of anonymous or unsaved working state across reloads is desirable but is not required for MVP correctness.

---

## 20. Acceptance scenarios

### AC-01: Anonymous user builds a lineup

**Given** the active fixture is Editable  
**When** an anonymous user selects a formation and assigns eleven unique available players  
**Then** the product shows a complete valid working XI without requiring authentication or roles.

### AC-02: Any player may occupy any slot

**Given** an available player and an empty formation slot  
**When** the user selects that player for the slot  
**Then** the placement succeeds regardless of the player's conventional real-world position.

### AC-03: Duplicate selection is prevented

**Given** a player already occupies a slot  
**When** the user attempts to add the same player to another slot  
**Then** the second placement is prevented.

### AC-04: Mobile placement requires no dragging

**Given** a user is on a mobile browser  
**When** they tap an empty slot  
**Then** they can choose and place a player without using drag and drop.

### AC-05: Formation change preserves only safe matches

**Given** a partially or fully populated working XI  
**When** the user confirms a formation change  
**Then** equivalent slots retain their players, unmatched players return to the available list, valid roles remain, and invalid roles are cleared.

### AC-06: Clear XI does not withdraw a submission

**Given** an authenticated user has a saved lineup  
**When** they use Clear XI  
**Then** the working lineup is cleared but the saved lineup and its Community XI contribution remain unchanged.

### AC-07: Authentication is deferred

**Given** an anonymous user has built a complete valid XI  
**When** they choose Save lineup  
**Then** authentication is requested and the working lineup is retained through successful authentication.

### AC-08: First successful save

**Given** an authenticated user has no submission for an Editable fixture  
**When** a complete valid XI is successfully saved  
**Then** one submission is created, appears in the user's experience, and contributes once to Community XI.

### AC-09: Replacement save

**Given** an authenticated user already has a saved lineup for an Editable fixture  
**When** they successfully save a different complete valid XI  
**Then** the previous content is replaced and only the replacement contributes to Community XI.

### AC-10: Existing submission discovered after authentication

**Given** a signed-out user builds a lineup and authentication reveals an existing saved submission  
**When** the authentication flow completes  
**Then** the product asks whether to replace the existing submission and does not overwrite it without confirmation.

### AC-11: Saved lineup cannot be withdrawn

**Given** a user has a saved lineup  
**When** they look for ways to change it while Editable  
**Then** they may replace it but cannot delete or withdraw the submission.

### AC-12: Cutoff enforcement

**Given** the authoritative time is at or after T-90  
**When** a user attempts a first or replacement save  
**Then** the save is rejected and Community XI remains unchanged.

### AC-13: Saved unavailable player is preserved

**Given** a player was Available when a lineup was saved and later becomes Unavailable  
**When** the user views that saved lineup  
**Then** the player remains selected and the lineup remains valid.

### AC-14: Removed unavailable player cannot return

**Given** a saved player is now Unavailable and the fixture is Editable  
**When** the user removes that player  
**Then** the player cannot be selected again while Unavailable.

### AC-15: Unsaved newly unavailable player blocks save

**Given** a player added only to the current working lineup becomes Unavailable before Save  
**When** the user attempts to save  
**Then** the save is rejected and the affected player is identified for replacement.

### AC-16: Community formation selection

**Given** valid saved submissions use multiple formations  
**When** Community XI is calculated  
**Then** the formation with the greatest number of submissions is selected using the documented tie rule.

### AC-17: Community slot selection

**Given** the Community formation has been selected  
**When** each slot is calculated  
**Then** only submissions using that formation contribute to that slot's player and percentage.

### AC-18: Community replacement consistency

**Given** a user's saved lineup contributes to Community XI  
**When** the user successfully replaces it  
**Then** the old selections stop contributing and the replacement selections contribute exactly once.

### AC-19: Community lock

**Given** a fixture reaches T-90  
**When** Community XI is displayed  
**Then** it is read-only and stable until a kickoff change explicitly returns the fixture to Editable.

### AC-20: Kickoff is rescheduled after lock

**Given** a Locked fixture receives a new kickoff more than 90 minutes in the future  
**When** the new timestamp is accepted  
**Then** the same fixture becomes Editable, existing submissions become editable, and Community XI resumes recalculation.

### AC-21: Postponed without new time

**Given** a fixture becomes Postponed without a replacement kickoff  
**When** the landing experience is loaded  
**Then** that fixture is not active, its existing submissions are preserved read-only, and the next Scheduled fixture may become active.

### AC-22: Local timezone display

**Given** two visitors in different timezones view the same fixture  
**When** its kickoff is displayed  
**Then** each sees the correct local date and time with a timezone abbreviation while both refer to the same fixture timestamp.

### AC-23: Public lineup privacy

**Given** a visitor opens a public lineup URL  
**When** the page renders  
**Then** it shows fixture, formation, players, and optional roles without revealing owner identity or edit controls.

### AC-24: Anonymous image export

**Given** an anonymous user has a complete valid working lineup  
**When** they choose either required export format  
**Then** a PNG is produced without requiring authentication and without player roles.

### AC-25: Manual override survives import

**Given** an administrator manually overrides a fixture field  
**When** a later fixture import provides a different value for that field  
**Then** the manual value remains until the administrator explicitly clears the override.

### AC-26: Historical player data survives squad edits

**Given** a player's name, shirt number, or squad state changes after a fixture locks  
**When** an historical lineup is viewed  
**Then** it retains the display meaning captured for that fixture.

### AC-27: Save failure is not false success

**Given** a save request fails  
**When** the product reports the outcome  
**Then** it does not show a saved state, the earlier canonical submission remains unchanged, and retry is offered when appropriate.

---

## 21. Explicit MVP exclusions

The following are out of scope:

- substitutes
- multiple saved lineups for one user and fixture
- drafts or private unpublished saved versions
- user withdrawal or deletion of an individual saved lineup
- official Manchester United starting XI
- match results or scores
- player performance data or ratings
- post-match analysis
- comments
- public user profiles
- public feed
- likes or reactions
- following or social graph
- custom tactical roles
- wholesale Football Manager role replication
- attack, support, or defend duties
- team-level tactical instructions
- mentality or width settings
- in-possession and out-of-possession shapes
- custom formation creation by users
- formation or role management in the MVP admin interface
- player photographs
- official club logos
- licensed kit reproductions
- notifications
- availability reasons or return dates
- automatic player replacement
- Community role aggregation
- user-facing advanced historical analytics
- mandatory mobile drag and drop
- native mobile apps
- monetization

---

## 22. Future ideas retained without MVP commitment

- team tactical instructions
- My XI versus Community XI comparison
- official starting XI import
- My XI versus Actual XI comparison
- Community XI versus Actual XI comparison
- richer Community statistics derived from retained submission data
- role aggregation
- additional export formats
- historical analysis across fixtures

These ideas must not add MVP UI, administration, or architecture complexity beyond retaining the canonical source data already required by this PRD.

---

## 23. Technical and operational constraints

Implementation must optimize for:

- Vercel compatibility
- GitHub-based development workflow
- minimal recurring cost
- free infrastructure tiers where reasonable
- maintainability by one non-engineer working through Codex
- simple architecture over theoretical scalability
- responsive browser delivery
- straightforward manual administration
- minimal personal-data storage
- ability to support additional users without immediate architectural replacement

Codex must explain major architectural choices and meaningful trade-offs in plain language. It may make routine implementation decisions autonomously.

---

## 24. Required dependent specifications

Implementation depends on two separate canonical research outputs.

### 24.1 Formation specification

Must define:

- final curated formation library
- stable identifiers and naming
- eleven slots per formation
- positional labels and abbreviations
- visual coordinates
- slot equivalence for formation changes
- supported role categories per slot
- deterministic formation display order
- machine-readable representation

### 24.2 Player-role specification

Must define:

- original role taxonomy
- concise UI labels
- plain-language definitions
- compatible formation-slot types
- overlap and redundancy decisions
- machine-readable representation

Neither specification may silently change the product decisions in this PRD.

---

## 25. Handoff boundary for Codex

Before implementation, Codex should:

1. Read this PRD and the two dependent specifications.
2. Identify any remaining contradiction rather than resolving it silently.
3. Propose technical architecture and explain major trade-offs.
4. Translate requirements and acceptance scenarios into an implementation plan.
5. Define verification for lifecycle boundaries, data integrity, Community XI aggregation, authentication transitions, responsive interactions, and historical snapshots.

Codex must not reopen explicit product decisions merely because another implementation would be easier.

---

## 26. MVP core loop

Select the active fixture  
→ Select a formation  
→ Build a starting XI  
→ Optionally assign roles  
→ Save and authenticate when required  
→ Share an image or public URL  
→ Explore Community XI  
→ Fixture locks at T-90  
→ Fixture becomes historical at T+180
