# MVP verification contract

**Status:** Required before release  
**Purpose:** Define behaviour to prove independently of framework and architecture.

Tests may be unit, integration, end-to-end, accessibility, or visual tests. The architecture plan should place each case at the cheapest reliable level while retaining at least one end-to-end path for each critical journey.

## 1. Release gates

The MVP is not ready until:

- all PRD acceptance scenarios AC-01 through AC-27 pass;
- all role scenarios AR-01 through AR-10 pass;
- formation catalogue validation passes;
- all critical cases below pass;
- blocking open decisions that affect the implemented slice are approved and recorded;
- mobile, desktop, keyboard, authentication, admin authorization, and historical snapshot behaviour have been exercised in production-like builds.

## 2. Critical automated cases

### Fixture and time

- At one instant before T-90, Save is eligible; exactly at T-90, it is rejected.
- Exactly before T+180 the fixture is Locked; exactly at T+180 it is Archived.
- Client clock changes do not alter server save eligibility.
- A Locked or Archived fixture moved sufficiently into the future reopens with the same identity and submissions.
- A Scheduled fixture made Postponed or Cancelled immediately rejects saves.
- A fixture that is Editable by time but not active rejects saves.
- Active-fixture ordering updates correctly after kickoff, status, or fixture-order changes.

### Builder operations

- Duplicate players are prevented for tap, click, drag, keyboard, swap, and replacement flows.
- Move to empty, swap occupied slots, replace, remove, and Clear XI produce the player and role outcomes in `application-behaviour.md`.
- Every formation change uses equivalence keys only and confirms destructive effects before mutation.
- Cancelling a formation change preserves the complete prior working state.
- Roles remain optional and incompatible roles clear without cancelling a valid player operation.
- A complete XI works on a narrow mobile viewport without drag.
- A keyboard-only user can select formation, place eleven players, edit roles, save, and export.

### Saving and authentication

- Anonymous working state survives successful, failed, and cancelled authentication within the current flow.
- Authentication revealing an existing submission never overwrites it before explicit confirmation.
- First save and replacement each create exactly one canonical contribution.
- Simulated failure at every persistence boundary creates no partial submission and keeps the earlier canonical state.
- Competing sessions result in one canonical saved submission and one Community contribution.
- Session expiry preserves the working lineup and requires authentication again.
- A save crossing T-90 fails atomically.

### Availability

- A newly ineligible player blocks a first save and is identified.
- A player from the prior canonical submission remains valid after becoming unavailable or inactive.
- Moving or swapping that player retains grandfathering.
- Removing that player prevents re-selection while ineligible.
- Another user without that player in their own prior submission cannot use the grandfathering exception.

### Community XI

- Formation counts and display-order ties are deterministic.
- Only winning-formation submissions feed slot counts and percentage denominators.
- Total player selection used in slot ties includes all canonical fixture submissions and counts each player at most once per submission.
- After OD-04 is approved, shirt number, normalized name, and stable ID tie-breaks use the approved historical value source and are deterministic.
- Replacement removes every old vote and adds every new vote once.
- Zero submissions produces no fabricated formation or players.
- Calculation failure never blocks personal lineup access.
- Locked and Archived results remain stable under current squad and catalogue label changes.
- Duplicate-player prevention in the aggregate is tested after OD-01 is approved.

### History, public links, and export

- Current player name, number, active state, formation label, and role-label edits do not mutate historical display.
- A public URL keeps the same identity after replacement and rescheduling.
- Public pages expose no owner identity or other owner submissions.
- Unknown public IDs return not found without information leakage.
- Both PNG dimensions are exact, contain the required content, exclude roles, and exclude prohibited imagery.
- Export failure does not save or mutate a lineup.

### Admin and import

- Non-admin users cannot read or write admin data even when calling endpoints directly.
- Every fixture field override survives conflicting imports until explicitly cleared.
- Clearing one override does not clear unrelated overrides.
- Import failure preserves all accepted data.
- An ambiguous import match does not merge or duplicate silently.
- Fixture time input, storage, lifecycle evaluation, and local display remain correct across timezone and daylight-saving boundaries.
- Deactivation and cancellation preserve referenced submissions.
- No formation or role CRUD route or action exists.

## 3. Required UI state checks

Verify loading, empty, success, retryable error, non-retryable error, and stale-data handling for:

- landing fixture
- builder initialization
- available-player list
- Save and authentication
- Community XI
- personal archive
- public fixture archive
- public lineup page
- PNG export
- admin fixture list and form
- admin player list and form
- fixture availability
- fixture import status

Do not use skeleton content that can be mistaken for real opponents, players, totals, or percentages.

## 4. Accessibility and responsive checks

- Test at representative narrow mobile, wide mobile, tablet, laptop, and desktop widths selected during interaction design.
- Test zoom and text enlargement without losing core actions.
- Verify focus order, visible focus, dialog focus containment, focus restoration, and error announcements.
- Verify state meaning without colour and with reduced motion.
- Verify touch targets and scroll behaviour around the pitch, player chooser, role chooser, confirmations, and sticky actions.
- Run automated WCAG checks, then manually test the complete core loop with keyboard and at least one screen reader.

Exact breakpoints and visual regression references must be added after interaction design is approved. Their absence must not weaken the fixed behaviour above.

## 5. Traceability

Every implementation pull request should identify:

- product requirement or invariant implemented;
- verification cases added or changed;
- any open decision it depends on;
- whether canonical formation or role data changed;
- whether historical compatibility or a migration is required.
