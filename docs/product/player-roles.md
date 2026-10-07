> **Current MVP applicability (22 September 2026):** The 25-role taxonomy, definitions, order and compatibility remain canonical. References below to accounts, server-saved supporter lineups, Community XI and public lineup pages apply only to the preserved MVP+ scope. Current behaviour and acceptance mapping are in `docs/product/canonical-prd.md` and `docs/implementation/verification.md`. AR-05 uses an impossible LCM-to-LDM equivalence; the current verification contract supplies the valid LB-to-LWB example without changing this catalogue. The `project-context.md` dependency is superseded by the current PRD.

# Manchester United Lineup Builder

## Canonical Player-Role Specification

**Status:** Canonical product dependency  
**Version:** 1.2  
**Date:** 18 September 2026  
**Depends on:** `canonical-prd.md`, `formations.md`, `project-context.md`  
**Audience:** Product design, football research, and implementation through OpenAI Codex

---

## 1. Purpose

This document defines the complete MVP player-role library for the Manchester United Lineup Builder.

The library contains **25 optional roles**. It is an original product taxonomy built from widely used football language, not a reproduction of Football Manager's role-and-duty system. It describes the main behaviour a supporter expects from a player in a position. It does not simulate instructions, ability, mentality, or every phase of play.

Role identifiers, names, display order, definitions, and compatibility mappings are normative. A saved lineup stores a role identifier or `null` for each occupied slot.

---

## 2. Product model

### 2.1 Roles are optional annotations

- No role is selected by default.
- `null` means **No role specified**. It is not a role named “Default”, “Standard”, or “Balanced”.
- A lineup with eleven players and no roles is complete and valid.
- A role never changes which player may occupy a slot.
- A role never changes formation coordinates.
- A role carries no Attack, Support, or Defend duty.
- The application does not judge whether the eleven selected roles form a balanced tactic.
- Roles appear on the builder, saved personal lineup, and public lineup page.
- Roles do not appear in MVP image exports or Community XI aggregation.

The role should answer one compact question:

> What is this player's main tactical behaviour in this position?

It should not attempt to answer every question about the player.

### 2.2 Inclusion rule

A role deserves a separate option only when all of the following are true:

1. a knowledgeable supporter can recognise the behaviour without specialist game knowledge;
2. it produces a meaningful difference in movement, space occupied, or primary contribution;
3. it can be explained in one short UI sentence;
4. it is useful in at least one canonical positional family;
5. it is not merely a quality label, a formation position, or an Attack/Support/Defend duty in disguise.

Two labels are merged when their differences depend mainly on frequency, intensity, team instructions, or very fine movement details. This is why the catalogue is much smaller than a management simulation's.

### 2.3 Research basis

The taxonomy uses common modern concepts but deliberately redraws their boundaries for this product:

- FIFA's technical analysis treats the sweeper-keeper as a specialised relationship with a higher defensive line and separately highlights the goalkeeper's growing role as a build-up player. Those behaviours sit alongside the goalkeeper's fundamental goal-protection work, supporting three clear goalkeeper emphases rather than one combined “modern goalkeeper” label. [FIFA Training Centre, goalkeeper distribution and the sweeper-keeper](https://www.fifatrainingcentre.com/en/fwc2022/fifa-insight/fifa-insight-ep03.php)
- FIFA also distinguishes advanced goalkeeper starting positions and the goalkeeper's connection with the defensive line. [FIFA Training Centre, goalkeeper starting positions](https://www.fifatrainingcentre.com/en/fwc2022/fifa-insight/fifa-insight-ep05.php)
- Inverted full-backs move into central spaces in possession, while traditional overlaps continue outside a wide teammate. Coaches' Voice notes that wing-backs can also invert, which justifies compatibility with both flank-defender families. [Coaches' Voice, inverted full-backs](https://learning.coachesvoice.com/cv/inverted-full-backs-guardiola-cancelo-trent-alexander-arnold-lahm-football-tactics/)
- Wing-back is fundamentally a **position** in a back-five structure, not automatically a separate behaviour. The canonical formation already encodes that position, so this role library does not add a generic “Wing-Back” role. [Coaches' Voice, wing-backs](https://learning.coachesvoice.com/cv/wing-backs-football-tactics-explained-conte-tuchel/)
- Modern No. 8s can connect play, run through inside channels, press, and defend. That breadth supports separating a two-way Box-to-Box role from a more creative Creative No. 8, without reproducing narrower foreign-language or simulation labels. [Coaches' Voice, the number eight](https://learning.coachesvoice.com/cv/number-8-football-tactics-henderson-kroos-modric-iniesta/)
- Modern No. 10s may primarily create between the lines or threaten goal with runs beyond the striker. Those are distinct enough for two attacking-midfield roles. [Coaches' Voice, the number 10](https://learning.coachesvoice.com/cv/number-10-football-tactics-explained-bruno-fernandes-ozil-dybala-muller/)
- A target player provides a direct outlet against pressure, while supporting runners exploit the second ball or lay-off. This remains a recognisable forward behaviour in modern elite football. [FIFA Training Centre, target man and counter-pressing](https://www.fifatrainingcentre.com/en/fwc2022/fifa-insight/fifa-insight-ep01.php)
- With two strikers, complementary behaviours matter more than labels such as “left striker” and “right striker”. The same role catalogue therefore serves lone strikers and striker pairs. [Coaches' Voice, two up front](https://learning.coachesvoice.com/cv/two-up-front-football-tactics-explained-simeone-conte-atletico-juventus/)

These sources establish concepts, not a ready-made taxonomy. Names and boundaries below are product decisions.

---

## 3. Compatibility model

### 3.1 Canonical role families

Compatibility uses the ten `roleFamily` values defined in `formations.md`:

`goalkeeper`, `centre_back`, `full_back`, `wing_back`, `defensive_midfielder`, `central_midfielder`, `wide_midfielder`, `attacking_midfielder`, `wide_forward`, `striker`.

Every role must map to one or more complete role families. MVP has no exceptions for a specific formation, side, or individual slot. For example, a role compatible with `centre_back` is available at LCB, CB, and RCB.

This whole-family rule keeps validation deterministic and prevents hidden special cases. It also means the MVP excludes roles such as Wide Centre-Back that would be valid for an outside centre-back in a back three but misleading for the central player.

### 3.2 Derived position abbreviations

| Role family | Compatible position abbreviations |
| --- | --- |
| `goalkeeper` | GK |
| `centre_back` | LCB, CB, RCB |
| `full_back` | LB, RB |
| `wing_back` | LWB, RWB |
| `defensive_midfielder` | LDM, CDM, RDM |
| `central_midfielder` | LCM, CM, RCM |
| `wide_midfielder` | LM, RM |
| `attacking_midfielder` | LAM, CAM, RAM |
| `wide_forward` | LW, RW |
| `striker` | LST, ST, RST |

Position abbreviations are derived for documentation and UI testing. Runtime compatibility must use `roleFamily`, not compare abbreviation strings.

---

## 4. Canonical catalogue and order

The following order is normative within each role family. The role picker shows only the roles compatible with its slot and preserves this order.

| Order | ID | UI name | Compatible role families |
| ---: | --- | --- | --- |
| 1 | `traditional-goalkeeper` | Traditional Goalkeeper | goalkeeper |
| 2 | `build-up-goalkeeper` | Build-Up Goalkeeper | goalkeeper |
| 3 | `sweeper-keeper` | Sweeper-Keeper | goalkeeper |
| 4 | `ball-playing-defender` | Ball-Playing Defender | centre_back |
| 5 | `front-foot-defender` | Front-Foot Defender | centre_back |
| 6 | `covering-defender` | Covering Defender | centre_back |
| 7 | `overlapping-full-back` | Overlapping Full-Back | full_back, wing_back |
| 8 | `inverted-full-back` | Inverted Full-Back | full_back, wing_back |
| 9 | `stay-back-full-back` | Stay-Back Full-Back | full_back |
| 10 | `holding-midfielder` | Holding Midfielder | defensive_midfielder, central_midfielder |
| 11 | `deep-playmaker` | Deep Playmaker | defensive_midfielder, central_midfielder |
| 12 | `ball-winner` | Ball Winner | defensive_midfielder, central_midfielder |
| 13 | `box-to-box-midfielder` | Box-to-Box Midfielder | central_midfielder |
| 14 | `creative-number-eight` | Creative No. 8 | central_midfielder |
| 15 | `touchline-winger` | Touchline Winger | wide_midfielder, wide_forward |
| 16 | `inside-forward` | Inside Forward | wide_midfielder, wide_forward |
| 17 | `wide-playmaker` | Wide Playmaker | wide_midfielder, wide_forward |
| 18 | `creative-number-ten` | Creative No. 10 | attacking_midfielder |
| 19 | `goalscoring-number-ten` | Goalscoring No. 10 | attacking_midfielder |
| 20 | `target-forward` | Target Forward | striker |
| 21 | `link-forward` | Link Forward | striker |
| 22 | `false-nine` | False Nine | striker |
| 23 | `penalty-box-striker` | Penalty-Box Striker | striker |
| 24 | `channel-runner` | Channel Runner | striker |
| 25 | `pressing-forward` | Pressing Forward | striker |

Maximum visible choices for any slot family: **six**. This is intentionally suitable for a compact bottom sheet, popover, or modal list.

---

## 5. Role definitions

### 5.1 Goalkeeper roles

#### Traditional Goalkeeper

- **ID:** `traditional-goalkeeper`
- **Short UI definition:** Holds a deeper position, protects the box, and distributes with lower risk.
- **Complete definition:** Stays closer to goal and primarily operates in and around the penalty area, focusing on saves, crosses, one-against-ones, and command of the box. The player leaves the area when necessary and still participates in possession, but usually offers less aggressively in build-up and favours safer distribution.
- **Compatible role families:** `goalkeeper`
- **Compatible positions:** GK
- **Distinction:** Unlike Build-Up Goalkeeper, the primary identity is preventing goals rather than starting attacks. Unlike Sweeper-Keeper, the player generally protects the space in and around the penalty area rather than operating high behind the defensive line.
- **Terminology and ambiguity:** “Conventional Goalkeeper” and “Line Goalkeeper” are possible alternatives but are less familiar in UK supporter language. Traditional describes relatively conservative open-play involvement, not an outdated player or poor technical ability. Shot-stopping belongs in the definition but is not the role name because every goalkeeper must stop shots.
- **Decision:** **Include.** Without it, the goalkeeper chooser offers only proactive build-up and sweeping specialisms, with no way to express a more conventional open-play role.

#### Build-Up Goalkeeper

- **ID:** `build-up-goalkeeper`
- **Short UI definition:** Joins build-up and starts attacks with controlled distribution.
- **Complete definition:** Offers as a passing option behind the defence, receives under pressure, and chooses short, line-breaking, clipped, or longer distribution to help the team progress. The role is about possession and distribution, not how far the goalkeeper advances when defending space.
- **Compatible role families:** `goalkeeper`
- **Compatible positions:** GK
- **Distinction:** Unlike Sweeper-Keeper, the defining behaviour is involvement on the ball. A goalkeeper may do both in reality, but the product asks for the user's primary tactical emphasis.
- **Terminology and ambiguity:** “Ball-playing goalkeeper” is a common alternative, but Build-Up Goalkeeper is clearer and avoids importing the defender label. This role does not imply reckless short passing on every restart.
- **Decision:** **Include.** Modern goalkeeper distribution is tactically important and independent enough from sweeping to deserve expression.

#### Sweeper-Keeper

- **ID:** `sweeper-keeper`
- **Short UI definition:** Holds a high starting position and attacks space behind the defence.
- **Complete definition:** Positions proactively behind the defensive line, reads through balls early, leaves the penalty area when needed, and clears, controls, or passes before an attacker can exploit the space.
- **Compatible role families:** `goalkeeper`
- **Compatible positions:** GK
- **Distinction:** Unlike Build-Up Goalkeeper, this is primarily an out-of-possession positioning and space-defending role.
- **Terminology and ambiguity:** This is established football terminology, not Football Manager-specific. It does not mean the goalkeeper is literally a libero or that they must dribble into midfield.
- **Decision:** **Include.** The higher starting position creates an obvious tactical distinction visible to supporters.

### 5.2 Centre-back roles

#### Ball-Playing Defender

- **ID:** `ball-playing-defender`
- **Short UI definition:** Progresses possession with confident passing or carries from defence.
- **Complete definition:** Remains a centre-back defensively but takes responsibility for starting attacks, breaking lines, switching play, or carrying forward when space opens.
- **Compatible role families:** `centre_back`
- **Compatible positions:** LCB, CB, RCB
- **Distinction:** Front-Foot Defender describes aggressive defensive engagement; Covering Defender describes depth and recovery. Ball-Playing Defender is defined by possession work.
- **Terminology and ambiguity:** “Ball-playing centre-back” is equally valid. The shorter established label fits the UI. It does not imply freedom to abandon defensive position or attempt only risky passes.
- **Decision:** **Include.** It is a widely understood modern distinction with clear build-up consequences.

#### Front-Foot Defender

- **ID:** `front-foot-defender`
- **Short UI definition:** Steps out early to challenge attackers and intercept forward passes.
- **Complete definition:** Defends proactively by leaving the line when the trigger is right, engaging receivers before they can turn, contesting duels, and intercepting passes into the forward line.
- **Compatible role families:** `centre_back`
- **Compatible positions:** LCB, CB, RCB
- **Distinction:** Unlike Covering Defender, this role closes space in front rather than preserving depth behind. Unlike Ball-Playing Defender, it is defined without the ball.
- **Terminology and ambiguity:** “Stopper” is a common alternative but is strongly associated with older man-marking systems and game taxonomies. Front-Foot Defender communicates the behaviour more directly. It does not require permanent man-marking.
- **Decision:** **Include.** Stepping out versus covering is a fundamental, supporter-visible defensive choice.

#### Covering Defender

- **ID:** `covering-defender`
- **Short UI definition:** Protects depth and recovers behind more aggressive defenders.
- **Complete definition:** Holds or drops from the line when necessary, scans for runs in behind, provides insurance behind teammates, and uses positioning and recovery pace to defend exposed space.
- **Compatible role families:** `centre_back`
- **Compatible positions:** LCB, CB, RCB
- **Distinction:** It is the natural counterpart to Front-Foot Defender. Its priority is protecting space behind rather than attacking the first duel.
- **Terminology and ambiguity:** “Cover defender” and “covering centre-back” are common alternatives. This is not the historical sweeper/libero, because the player remains part of the centre-back line.
- **Decision:** **Include.** It enables a meaningful centre-back partnership without adding marking and line-management micro-roles.

### 5.3 Full-back and wing-back roles

#### Overlapping Full-Back

- **ID:** `overlapping-full-back`
- **Short UI definition:** Advances outside the wide teammate to provide width and crossing.
- **Complete definition:** Moves forward along the flank, usually around the outside of a winger or attacking midfielder, to stretch the defence, receive beyond the opponent, and cross or cut back from advanced areas.
- **Compatible role families:** `full_back`, `wing_back`
- **Compatible positions:** LB, RB, LWB, RWB
- **Distinction:** Unlike Inverted Full-Back, the movement is outside and wide. Unlike Stay-Back Full-Back, the player regularly advances beyond the ball or wide teammate.
- **Terminology and ambiguity:** A wing-back often provides width by position alone, but this role explicitly states an outside overlap relative to the nearest attacker. “Attacking full-back” was rejected because it describes intent but not movement.
- **Decision:** **Include.** The overlap is one of the clearest and most familiar flank behaviours.

#### Inverted Full-Back

- **ID:** `inverted-full-back`
- **Short UI definition:** Moves into central midfield during build-up and possession.
- **Complete definition:** Leaves the touchline to occupy central or inside-channel spaces when the team has the ball, adding a midfield passing option, supporting progression, and improving central protection after turnovers.
- **Compatible role families:** `full_back`, `wing_back`
- **Compatible positions:** LB, RB, LWB, RWB
- **Distinction:** Unlike Overlapping Full-Back, this player narrows rather than running outside. It is not a Holding Midfielder because the starting formation position remains on the flank.
- **Terminology and ambiguity:** “Inverted wing-back” may be used when selected at LWB or RWB. The UI keeps one familiar name across both families. Inverted does not mean merely playing a left-footer on the right or vice versa.
- **Decision:** **Include.** It is a defining modern positional rotation and materially changes central occupation.

#### Stay-Back Full-Back

- **ID:** `stay-back-full-back`
- **Short UI definition:** Holds a deeper flank position to protect against transitions.
- **Complete definition:** Advances selectively, prioritises the defensive line and rest defence, and remains available to stop counters or circulate possession behind more attacking teammates.
- **Compatible role families:** `full_back`
- **Compatible positions:** LB, RB
- **Distinction:** Unlike Overlapping Full-Back, the player does not routinely run beyond the wide attacker. Unlike Inverted Full-Back, they remain primarily in the defensive flank rather than joining central midfield.
- **Terminology and ambiguity:** “Defensive full-back” is a common alternative but can sound like an ability judgement. Stay-Back describes the movement. This role is excluded from wing-back slots because a permanently deep wing-back contradicts the reference position strongly enough that the user should choose the canonical 5-3-2 formation instead.
- **Decision:** **Include.** It captures asymmetric back-four structures and cautious full-back use without adding duties.

### 5.4 Defensive and central midfield roles

#### Holding Midfielder

- **ID:** `holding-midfielder`
- **Short UI definition:** Stays behind the ball, screens the defence, and protects central space.
- **Complete definition:** Maintains positional discipline in front of the back line or behind more advanced midfielders, blocks central access, supports circulation, and provides cover when teammates move forward.
- **Compatible role families:** `defensive_midfielder`, `central_midfielder`
- **Compatible positions:** LDM, CDM, RDM, LCM, CM, RCM
- **Distinction:** Unlike Ball Winner, the priority is protecting space rather than chasing duels. Unlike Deep Playmaker, distribution is secondary to structure and screening.
- **Terminology and ambiguity:** “No. 6”, “anchor”, and “screening midfielder” overlap. No. 6 can also describe a build-up organiser, while anchor is associated with existing game taxonomies. Holding Midfielder is the clearest umbrella term. It is available at CM so a user can express one deeper member of a nominal midfield pair.
- **Decision:** **Include.** Positional protection is distinct from both ball-winning and playmaking.

#### Deep Playmaker

- **ID:** `deep-playmaker`
- **Short UI definition:** Dictates build-up from deep with progressive passing and switches.
- **Complete definition:** Drops or holds in deeper midfield spaces to receive from defenders, resist pressure, set the tempo, break lines, and move the point of attack with a broad passing range.
- **Compatible role families:** `defensive_midfielder`, `central_midfielder`
- **Compatible positions:** LDM, CDM, RDM, LCM, CM, RCM
- **Distinction:** Unlike Holding Midfielder, progression and control on the ball are the primary identity. Unlike Creative No. 8, the player operates mainly behind rather than close to the forward line.
- **Terminology and ambiguity:** “Deep-lying playmaker” is the established longer label. Deep Playmaker is an intentional compact UI form, not a new concept. “Regista” is excluded as less universally understood in UK supporter language and more specific in some tactical traditions.
- **Decision:** **Include.** Deep orchestration is one of the most recognisable midfield behaviours.

#### Ball Winner

- **ID:** `ball-winner`
- **Short UI definition:** Presses, tackles, and contests duels to regain possession in midfield.
- **Complete definition:** Actively closes opponents, jumps toward loose or receiving players, competes in tackles and second balls, and aims to disrupt opposition possession before it develops.
- **Compatible role families:** `defensive_midfielder`, `central_midfielder`
- **Compatible positions:** LDM, CDM, RDM, LCM, CM, RCM
- **Distinction:** Unlike Holding Midfielder, this role leaves its base position more readily to engage. Unlike Box-to-Box Midfielder, its defining contribution is regaining the ball, not repeated involvement in both penalty areas.
- **Terminology and ambiguity:** “Ball-winning midfielder” is the established full term. Ball Winner is shorter and avoids repeating the slot's position. It does not mean the player has no possession responsibility.
- **Decision:** **Include.** Proactive ball recovery is distinct enough from positional screening to matter tactically.

#### Box-to-Box Midfielder

- **ID:** `box-to-box-midfielder`
- **Short UI definition:** Covers ground to support both attacks and defensive phases.
- **Complete definition:** Moves through central areas across phases, carries or passes forward, arrives in and around the opposition box, recovers quickly, tracks runners, and helps defend near their own box.
- **Compatible role families:** `central_midfielder`
- **Compatible positions:** LCM, CM, RCM
- **Distinction:** Unlike Ball Winner, it is defined by two-way range rather than regaining possession. Unlike Creative No. 8, it balances attacking and defensive ground coverage rather than prioritising creation between the lines.
- **Terminology and ambiguity:** This is established general football language. It describes vertical range, not simply high stamina. It is excluded from defensive-midfield slots because the canonical reference position is too deep for “box to box” to remain a clear instruction.
- **Decision:** **Include.** The two-way runner remains a familiar and useful midfield archetype.

#### Creative No. 8

- **ID:** `creative-number-eight`
- **Short UI definition:** Creates from the inside channels and supports attacks ahead of midfield.
- **Complete definition:** Operates as an advanced central midfielder, receives between or beside opposition lines, combines in tight areas, supplies runners, and moves into the inside channels to create chances.
- **Compatible role families:** `central_midfielder`
- **Compatible positions:** LCM, CM, RCM
- **Distinction:** Unlike Deep Playmaker, this player creates from higher positions. Unlike Box-to-Box Midfielder, creativity and inside-channel occupation are more important than covering both boxes.
- **Terminology and ambiguity:** “Advanced playmaker” is strongly associated with game taxonomies, while “mezzala” carries narrower Italian and side-of-a-three implications. Creative No. 8 uses current UK language without claiming every No. 8 behaves identically. It may include forward runs but is not defined as a goalscorer.
- **Decision:** **Include.** It captures the modern advanced creator while deliberately merging mezzala, advanced playmaker, and attacking No. 8 subtypes.

### 5.5 Wide roles

#### Touchline Winger

- **ID:** `touchline-winger`
- **Short UI definition:** Holds the width, attacks outside, and delivers from the flank.
- **Complete definition:** Starts and remains wide to stretch the defence, receives near the touchline, attacks the outside of the full-back, and creates through crosses, cut-backs, or passes from the flank.
- **Compatible role families:** `wide_midfielder`, `wide_forward`
- **Compatible positions:** LM, RM, LW, RW
- **Distinction:** Unlike Inside Forward, the player preserves width rather than moving toward goal as the main behaviour. Unlike Wide Playmaker, they threaten through outside movement more than orchestration.
- **Terminology and ambiguity:** “Traditional winger” and “out-and-out winger” are alternatives. Touchline Winger is more descriptive and does not imply an outdated playing style. The role does not require the player to stay on the line at every moment.
- **Decision:** **Include.** Width outside the opponent is the clearest counterpoint to an inside-moving wide player.

#### Inside Forward

- **ID:** `inside-forward`
- **Short UI definition:** Moves infield from a wide start to combine, run beyond, or threaten goal.
- **Complete definition:** Begins from a wide position but attacks the half-space and central areas, with or without the ball, to combine near the striker, make diagonal runs, create shooting opportunities, and open the flank for another player.
- **Compatible role families:** `wide_midfielder`, `wide_forward`
- **Compatible positions:** LM, RM, LW, RW
- **Distinction:** Unlike Touchline Winger, the player gives up some natural width to threaten inside. Unlike Wide Playmaker, the role includes off-ball runs and direct goal threat rather than primarily seeking the ball to create.
- **Terminology and ambiguity:** In everyday analysis, “inside forward”, “inverted winger”, and “inverted forward” often overlap. Some game systems separate them by whether the movement happens mainly on or off the ball. That difference is too subtle for this product, so all are intentionally merged into Inside Forward. It does not require an opposite-footed player.
- **Decision:** **Include as the merged inside-moving wide role.** A separate Inverted Winger does not deserve an MVP option.

#### Wide Playmaker

- **ID:** `wide-playmaker`
- **Short UI definition:** Starts wide but roams to receive and create for teammates.
- **Complete definition:** Uses a wide starting position to escape central congestion, then moves toward inside channels or varied pockets to get on the ball, combine, switch play, and supply runners rather than primarily attacking the outside or the goal.
- **Compatible role families:** `wide_midfielder`, `wide_forward`
- **Compatible positions:** LM, RM, LW, RW
- **Distinction:** Unlike Touchline Winger, the player is not tied to providing width. Unlike Inside Forward, creation and ball access matter more than direct scoring runs.
- **Terminology and ambiguity:** This role can resemble a No. 10 drifting wide, but compatibility remains limited to genuine wide starting slots. “Free role” is rejected because it gives no useful behavioural information.
- **Decision:** **Include.** It supports recognisable creators selected from the flank and remains distinct from both outside and goal-focused wide movement.

### 5.6 Attacking-midfield roles

#### Creative No. 10

- **ID:** `creative-number-ten`
- **Short UI definition:** Finds space between the lines and creates chances for others.
- **Complete definition:** Receives between midfield and defence, turns in tight spaces, connects midfield to attack, and uses combinations, through balls, switches, dribbles, or disguised passes to release teammates.
- **Compatible role families:** `attacking_midfielder`
- **Compatible positions:** LAM, CAM, RAM
- **Distinction:** Unlike Goalscoring No. 10, the player's first identity is chance creation rather than runs beyond the striker and penalty-area occupation.
- **Terminology and ambiguity:** “Classic No. 10”, “playmaker”, and “enganche” overlap. Creative No. 10 is clearer for a modern UK audience. At LAM or RAM it means a creator in the inside channel, not a touchline winger.
- **Decision:** **Include.** It captures the clearest creative interpretation of all canonical attacking-midfield slots.

#### Goalscoring No. 10

- **ID:** `goalscoring-number-ten`
- **Short UI definition:** Attacks the box and runs beyond the striker from between the lines.
- **Complete definition:** Starts underneath or beside the forward line, finds gaps around the striker, makes well-timed runs beyond, attacks crosses and second balls, and prioritises arriving in scoring positions.
- **Compatible role families:** `attacking_midfielder`
- **Compatible positions:** LAM, CAM, RAM
- **Distinction:** Unlike Creative No. 10, it is defined by off-ball movement and goal threat. Unlike an Inside Forward, it begins in a narrow attacking-midfield slot rather than moving inside from a wide slot.
- **Terminology and ambiguity:** “Shadow striker”, “second striker”, and the German term “Raumdeuter” partially overlap but carry different histories or game-specific expectations. Goalscoring No. 10 states the behaviour without borrowing a proprietary-feeling label. It may still create chances and press.
- **Decision:** **Include.** The Özil-like creator and Müller-like space attacker are meaningfully different supporter choices.

### 5.7 Striker roles

#### Target Forward

- **ID:** `target-forward`
- **Short UI definition:** Provides a direct outlet, contests service, and brings others into play.
- **Complete definition:** Occupies centre-backs, receives direct passes with pressure behind, competes aerially or physically, protects the ball, and lays it off for runners before attacking the box.
- **Compatible role families:** `striker`
- **Compatible positions:** LST, ST, RST
- **Distinction:** Unlike Link Forward, this role is specifically an outlet for direct service and physical contests. Unlike Penalty-Box Striker, it contributes before the final action.
- **Terminology and ambiguity:** “Target man” remains common, including in FIFA analysis, but Target Forward is gender-neutral and already well understood. Size helps but is not the definition; timing, body use, and secure lay-offs also matter.
- **Decision:** **Include.** Direct outlet play is tactically distinct and relevant to both lone strikers and pairs.

#### Link Forward

- **ID:** `link-forward`
- **Short UI definition:** Drops toward the ball to connect midfield with nearby attackers.
- **Complete definition:** Checks into space in front of the centre-backs, receives to feet, protects or redirects possession, combines with midfielders and wide attackers, and then supports the next phase of the attack.
- **Compatible role families:** `striker`
- **Compatible positions:** LST, ST, RST
- **Distinction:** Unlike Target Forward, the role does not depend on direct or aerial service. Unlike False Nine, dropping to connect play does not necessarily vacate the forward line or attempt to reshape the opposition defence.
- **Terminology and ambiguity:** “Deep-lying forward”, “support striker”, and “hold-up striker” overlap. Link Forward is shorter, plain-language, and avoids implying a duty. Hold-up play may be part of it, but combination play is the defining behaviour.
- **Decision:** **Include.** Many forwards link play without functioning as true false nines or target players.

#### False Nine

- **ID:** `false-nine`
- **Short UI definition:** Leaves the front line to create and pull centre-backs out of shape.
- **Complete definition:** Begins as the central striker but repeatedly drops into midfield or No. 10 spaces, seeking the ball and deliberately vacating the highest central lane so teammates can run through or beyond the defence.
- **Compatible role families:** `striker`
- **Compatible positions:** LST, ST, RST
- **Distinction:** Unlike Link Forward, the defining purpose is to leave and distort the opposition's last line, not simply connect passes. Unlike Creative No. 10, the reference formation position is striker.
- **Terminology and ambiguity:** This is established tactical language. A forward who occasionally drops short is not automatically a false nine. In a striker pair the role is unusual but still intelligible, so no pair-specific restriction is added.
- **Decision:** **Include.** It is a distinctive modern concept that knowledgeable supporters expect.

#### Penalty-Box Striker

- **ID:** `penalty-box-striker`
- **Short UI definition:** Stays close to goal and focuses on finding space to finish chances.
- **Complete definition:** Occupies central defenders near the box, makes short movements on their blind side, anticipates rebounds and cut-backs, and prioritises the final touch over involvement in deeper build-up.
- **Compatible role families:** `striker`
- **Compatible positions:** LST, ST, RST
- **Distinction:** Unlike Channel Runner, movement is concentrated around scoring zones rather than long runs into wider or deeper space. Unlike Target or Link Forward, receiving and connecting outside the box is secondary.
- **Terminology and ambiguity:** “Poacher” is familiar but can sound like an ability or personality label. Penalty-Box Striker describes the tactical occupation more precisely. It does not mean the player never presses or leaves the box.
- **Decision:** **Include.** A finishing specialist is a clear archetype not represented by the other forward roles.

#### Channel Runner

- **ID:** `channel-runner`
- **Short UI definition:** Threatens in behind and runs between or outside centre-backs.
- **Complete definition:** Stretches the back line with repeated runs beyond it, attacks gaps between centre-back and full-back, drifts into channels to receive forward passes, and creates depth for teammates.
- **Compatible role families:** `striker`
- **Compatible positions:** LST, ST, RST
- **Distinction:** Unlike Penalty-Box Striker, this role threatens space before the ball reaches the box. Unlike Pressing Forward, its defining running is attacking rather than defensive.
- **Terminology and ambiguity:** “Advanced forward” is vague and heavily associated with game terminology. “Runs the channels” is familiar UK football language and states the behaviour. Channel Runner may operate centrally as well as toward the flanks.
- **Decision:** **Include.** Running beyond and into channels creates a clear structural contrast with dropping forwards.

#### Pressing Forward

- **ID:** `pressing-forward`
- **Short UI definition:** Leads pressure on defenders and forces rushed build-up decisions.
- **Complete definition:** Initiates or supports the press from the front, closes centre-backs and goalkeepers, uses curved runs and cover shadows to block easy passes, and reacts quickly after possession is lost.
- **Compatible role families:** `striker`
- **Compatible positions:** LST, ST, RST
- **Distinction:** Unlike Channel Runner, the defining movement happens when the opposition has or has just won the ball. Unlike Ball Winner, the pressing starts from the forward line rather than midfield.
- **Terminology and ambiguity:** “Defensive forward” understates the proactive nature of the role. Pressing Forward does not specify a high team press and does not guarantee the rest of the XI will press with them.
- **Decision:** **Include.** Front-line pressing is central to modern tactical discussion and cannot be inferred from another striker role.

---

## 6. Compatibility matrix

This matrix is normative and offers an implementation test fixture.

| Role family | Allowed role IDs in display order |
| --- | --- |
| `goalkeeper` | `traditional-goalkeeper`, `build-up-goalkeeper`, `sweeper-keeper` |
| `centre_back` | `ball-playing-defender`, `front-foot-defender`, `covering-defender` |
| `full_back` | `overlapping-full-back`, `inverted-full-back`, `stay-back-full-back` |
| `wing_back` | `overlapping-full-back`, `inverted-full-back` |
| `defensive_midfielder` | `holding-midfielder`, `deep-playmaker`, `ball-winner` |
| `central_midfielder` | `holding-midfielder`, `deep-playmaker`, `ball-winner`, `box-to-box-midfielder`, `creative-number-eight` |
| `wide_midfielder` | `touchline-winger`, `inside-forward`, `wide-playmaker` |
| `attacking_midfielder` | `creative-number-ten`, `goalscoring-number-ten` |
| `wide_forward` | `touchline-winger`, `inside-forward`, `wide-playmaker` |
| `striker` | `target-forward`, `link-forward`, `false-nine`, `penalty-box-striker`, `channel-runner`, `pressing-forward` |

---

## 7. Deliberately excluded or merged roles

These exclusions are part of the taxonomy and should prevent future implementation from casually expanding it.

| Candidate | Decision | Reason |
| --- | --- | --- |
| Shot-Stopping Goalkeeper | Merge into Traditional Goalkeeper | Shot-stopping is an ability and fundamental responsibility shared by all goalkeepers. Traditional Goalkeeper instead describes the player's more conservative involvement in open play. |
| Complete Goalkeeper | Exclude | A quality bundle rather than one tactical behaviour. It would overlap both goalkeeper roles. |
| Libero / Sweeper | Exclude | Rare as a distinct outfield position in the canonical formations and not equivalent to a modern covering centre-back. |
| Wide Centre-Back | Exclude from MVP | Meaningful for LCB/RCB in a back three, but invalid for a central CB. It conflicts with whole-family compatibility and would require slot-context rules. |
| No-Nonsense Defender | Exclude | Primarily a limitation or style judgement, not a modern positional behaviour the product needs. |
| Overlapping Centre-Back | Exclude | A narrower version of Wide Centre-Back and too system-dependent for MVP. |
| Attacking Wing-Back | Exclude | Wing-back height is already encoded by the formation slot; “attacking” would reintroduce a duty without specifying movement. |
| Complete Wing-Back | Exclude | A broad ability bundle with no single distinguishing behaviour. |
| Underlapping Full-Back | Merge | Underlaps are real, but often one movement within overlaps or rotations. A permanent separate role is too fine-grained beside Inverted and Overlapping Full-Back. |
| Anchor | Merge into Holding Midfielder | The practical difference is too subtle without duties and team instructions. |
| Half-Back | Exclude | Dropping between centre-backs is meaningful but system-dependent, less familiar, and close to a team build-up instruction. Reconsider after team instructions exist. |
| Regista | Merge into Deep Playmaker | Specialist terminology with inconsistent defensive and freedom implications in English usage. |
| Roaming Playmaker | Exclude | Roaming is underspecified and overlaps Deep Playmaker, Creative No. 8, and Wide Playmaker depending on starting position. |
| Carrilero | Exclude | Less familiar UK terminology and highly specific to lateral shuttling in narrow midfields. |
| Mezzala | Merge into Creative No. 8 | Valuable coaching term, but its side-of-a-three and wide-channel nuance is too formation-specific for the MVP compatibility model. |
| Destroyer | Merge into Ball Winner | Vivid but imprecise, overly aggressive language. |
| Advanced Playmaker | Split by starting family | Deep Playmaker, Creative No. 8, Creative No. 10, and Wide Playmaker state where the creator operates. One advanced label would blur those distinctions. |
| Inverted Winger | Merge into Inside Forward | The on-ball versus off-ball distinction used by some games is too subtle for this product and inconsistent in general supporter language. |
| Raumdeuter | Merge into Goalscoring No. 10 | Specialist foreign-language term strongly associated with one player and difficult to define compactly without overlap. |
| Shadow Striker | Merge into Goalscoring No. 10 | Describes essentially the same box-attacking behaviour for the granularity required here. |
| Second Striker | Exclude as a role | Primarily describes the relationship or position behind/beside another striker. Link Forward or Goalscoring No. 10 expresses the intended behaviour. |
| Trequartista / Enganche | Merge into Creative No. 10 | Historically meaningful but less accessible, and the defensive-freedom distinctions would effectively reintroduce duties. |
| Advanced Forward | Exclude | Too generic. Channel Runner and Penalty-Box Striker provide clearer behaviours. |
| Poacher | Rename as Penalty-Box Striker | Familiar but implies instinct or quality more than position and movement. |
| Deep-Lying Forward | Rename and simplify as Link Forward | Link Forward is more compact and avoids inheriting simulation-specific duty expectations. |
| Complete Forward | Exclude | A claim that the player does everything, so it provides little tactical information. |
| Pressing Target / Mobile Target | Exclude | Composite roles can be expressed only by choosing a primary behaviour; the MVP does not support multiple roles per player. |

---

## 8. UI requirements

### 8.1 Entry and selection

- The role control is shown only for an occupied slot.
- Opening it shows a clear **No role** option followed by valid roles in canonical order.
- Each row shows the UI name and short definition.
- The complete definition may appear behind an information affordance, not in the default compact list.
- Selecting a role closes or confirms the chooser using the platform's established pattern.
- The user can replace a role directly or remove it by selecting **No role**.

### 8.2 Compact display

- On-pitch display should use the full UI name when space permits.
- Do not introduce unexplained initialisms such as BPD, DLP, or IF in the MVP.
- If mobile space is insufficient, show a role indicator on the player marker and the full role name in the selected-slot panel.
- Short definitions are supporting copy, not saved user content.

### 8.3 Validation and clearing

- A selected role is valid when its `compatibleRoleFamilies` contains the current slot's `roleFamily`.
- If a player moves but the slot stays the same, the role stays attached to the slot, as required by the PRD.
- If a formation change or player swap results in an invalid role, clear it to `null`, preserve the valid player operation, and notify the user non-blockingly.
- The server must validate compatibility on save using the same canonical data.
- Unknown or retired role IDs must never silently map to another role.

---

## 9. Data contract

Each role record must contain:

```ts
type RoleFamily =
  | "goalkeeper"
  | "centre_back"
  | "full_back"
  | "wing_back"
  | "defensive_midfielder"
  | "central_midfielder"
  | "wide_midfielder"
  | "attacking_midfielder"
  | "wide_forward"
  | "striker";

type PlayerRole = {
  id: string;
  name: string;
  shortDefinition: string;
  fullDefinition: string;
  compatibleRoleFamilies: RoleFamily[];
  displayOrder: number;
};
```

Normative constraints:

- `id` is the stable lowercase kebab-case value in section 4.
- `name` is the exact UI name in section 4.
- `shortDefinition` is the exact short UI definition in section 5.
- `fullDefinition` is the exact complete definition in section 5.
- `compatibleRoleFamilies` must match sections 4 to 6.
- `displayOrder` is the global order in section 4.
- Role definitions are application-owned seed/configuration data, not admin-managed records in MVP.
- A lineup slot stores `roleId: string | null`.
- Historical saved lineups should preserve the role ID and a display snapshot if the chosen persistence design already snapshots other lineup labels. Later copy edits must not make an old role unreadable.

---

## 10. Acceptance scenarios

### AR-01: Role is optional

**Given** all eleven slots contain unique eligible players  
**When** no role has been selected  
**Then** the lineup remains valid and can be saved.

### AR-02: Chooser is filtered by slot family

**Given** an occupied LW slot whose role family is `wide_forward`  
**When** the user opens the role chooser  
**Then** it shows No role, Touchline Winger, Inside Forward, and Wide Playmaker in that order  
**And** it shows no other roles.

### AR-03: Shared roles appear in every compatible family

**Given** an occupied LWB slot  
**When** the user opens the role chooser  
**Then** Overlapping Full-Back and Inverted Full-Back are available  
**And** Stay-Back Full-Back is not available.

### AR-04: Role remains attached to the slot on player swap

**Given** a slot has a player and a valid role  
**When** that player is swapped with another player  
**Then** the role remains on the original slot  
**And** the newly occupying player inherits that slot annotation.

### AR-05: Invalid role clears after formation change

**Given** a player in an LCM slot has Box-to-Box Midfielder  
**When** a confirmed formation change safely maps the player into an LDM slot  
**Then** the player remains selected  
**And** the incompatible role is cleared to `null`  
**And** the user is informed non-blockingly.

### AR-06: Server rejects incompatible data

**Given** a client submits `false-nine` for a CAM slot  
**When** the server validates the lineup  
**Then** saving is rejected as invalid role compatibility  
**And** no partial Community XI update occurs.

### AR-07: No duties exist

**Given** any role chooser  
**When** the user reviews or selects a role  
**Then** no Attack, Support, Defend, mentality, intensity, or similar duty control is presented or stored.

### AR-08: Role is absent from image export

**Given** a complete lineup contains assigned roles  
**When** the user exports a Feed or Story PNG  
**Then** no role name or role indicator appears in the exported image.

### AR-09: Public lineup retains roles

**Given** a saved lineup contains assigned roles  
**When** its public URL is viewed  
**Then** each assigned role is shown with its player  
**And** slots with `null` show no placeholder role label.

### AR-10: Unknown role is not guessed

**Given** stored or submitted data contains an unrecognised role ID  
**When** the lineup is validated or rendered  
**Then** the system does not map it to a similar current role  
**And** follows the product's safe invalid-data handling rather than displaying misleading tactics.

---

## 11. Governance

This is the canonical MVP role set. Product code, validation, fixtures, and UI copy must derive from one data source representing this document.

Adding a role requires evidence that it passes the inclusion rule, remains compatible with whole role families, and does not raise any family above a reasonable compact chooser size. Renaming a role requires preserving its stable ID. Splitting a role requires a migration decision for historical data and is not a copy-only change.

Future team instructions may justify reconsidering Half-Back, Wide Centre-Back, underlaps, or more detailed pressing behaviours. They must not be added to the MVP catalogue pre-emptively.
