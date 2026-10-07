# Manchester United Lineup Builder

## Canonical Formation Specification

**Status:** Canonical product dependency  
**Version:** 1.0  
**Date:** 18 September 2026  
**Depends on:** `canonical-prd.md`  
**Audience:** Product design, football research, and implementation through OpenAI Codex

---

## 1. Purpose

This document defines the complete MVP formation library for the Manchester United Lineup Builder.

It is deliberately a curated team-sheet taxonomy, not a catalogue of every shape used in football. It gives supporters enough range to express a recognisably different starting XI while keeping formation selection understandable and Community XI aggregation meaningful.

The canonical library contains **14 formations**. Formation identifiers, display order, slot identifiers, abbreviations, role families, coordinates, and equivalence keys are normative.

The explanatory football descriptions and alternative names help people understand the choices. They must not be interpreted as team instructions or as restrictions on which player can occupy a slot.

---

## 2. Research basis and classification decisions

Current UK coaching and competition sources describe a formation as a starting or reference structure rather than a complete tactical system. A team may build, press, attack, and defend in different shapes during the same match. The application therefore captures the supporter’s chosen **reference lineup shape**, not separate in-possession and out-of-possession structures.

The taxonomy follows these findings:

- The standard 4-2-3-1 has a back four, double pivot, three attacking midfielders, and one centre-forward. The wide attacking midfielders can move inside, but that movement is a role behaviour rather than automatically a different formation. [Coaches’ Voice, 4-2-3-1](https://learning.coachesvoice.com/cv/the-4-2-3-1-football-tactics-pochettino-guardiola-flick-southgate/)
- The common 4-3-3 uses a single pivot, two more advanced central midfielders, two wide attackers, and one centre-forward. Winger versus inside-forward behaviour belongs to player roles because either can begin from the same wide-forward slot. [Coaches’ Voice, 4-3-3](https://learning.coachesvoice.com/cv/4-3-3-football-tactics-explained-formation-liverpool-klopp-barcelona-guardiola/)
- A flat 4-4-2 and a 4-4-2 diamond have materially different midfield structures. The Premier League’s UK terminology describes the diamond as one pivot, two No 8s, and one No 10 behind two centre-forwards. [Premier League, 4-4-2](https://www.premierleague.com/en/news/4243787) and [Premier League, 4-4-2 diamond](https://www.premierleague.com/en/news/4243786)
- “3-4-3” is used as an umbrella label for both a genuinely wide front three and a narrow pair of No 10s behind a striker. UK tactical coverage also calls the latter 3-4-2-1. Those two front-line arrangements are visually and tactically meaningful enough to be separate options here. [Premier League, 3-4-3](https://www.premierleague.com/en/news/4244194)
- A modern 3-5-2 normally uses proactive wing-backs, three central midfielders, and two strikers. Wing-back height can change the character of the system, but moment-to-moment movement is not a new formation. [Coaches’ Voice, 3-5-2](https://learning.coachesvoice.com/cv/3-5-2-formation-conte-mourinho-guardiola/)
- Coaches explicitly warn that one numerical formation can press or build as another shape. This supports keeping the formation library tied to reference positions and leaving behaviours to the role specification. [Coaches’ Voice, Conor Hourihane](https://learning.coachesvoice.com/cv/conor-hourihane-barnsley/)

### Inclusion rule

A formation receives a separate option only when a supporter would reasonably expect at least one of these to change on the static pitch:

1. the number of recognised defensive, midfield, or forward lines;
2. the width or depth of two or more starting slots;
3. the presence of a single pivot, double pivot, No 10, second striker, or extra centre-back;
4. the choice between genuinely wide forwards and narrow attacking midfielders.

A variation does **not** receive a separate option when the difference is primarily:

- a player instruction or role;
- an attacking, defending, or pressing phase;
- a small coordinate adjustment with unchanged positional identities;
- a different name for the same eleven reference positions.

---

## 3. Coordinate and naming system

### 3.1 Pitch coordinates

Every slot uses normalized integer coordinates:

- `x = 0` is the left touchline from Manchester United’s attacking perspective.
- `x = 100` is the right touchline.
- `y = 0` is Manchester United’s own goal line.
- `y = 100` is the opposition goal line.
- The team attacks towards increasing `y`.

Coordinates are **conceptual layout anchors**, not measured tactical data. They provide deterministic rendering and relative separation. A renderer may add equal padding around the pitch but must preserve the relative order, symmetry, and formation-specific differences.

For a screen coordinate system whose origin is top-left, render vertical position as `topPercent = 100 - y`.

### 3.2 Abbreviation rules

The specification uses familiar UK football abbreviations consistently:

| Abbreviation | Meaning |
| --- | --- |
| GK | Goalkeeper |
| LB / RB | Left / right-back |
| LCB / CB / RCB | Left / central / right centre-back |
| LWB / RWB | Left / right wing-back |
| CDM | Central defensive midfielder; the single pivot |
| LDM / RDM | Left / right defensive midfielder in a double pivot |
| LM / RM | Left / right midfielder |
| LCM / CM / RCM | Left / central / right central midfielder |
| LAM / CAM / RAM | Left / central / right attacking midfielder |
| LW / RW | Left / right wide forward |
| LST / ST / RST | Left / central / right striker |

The side always precedes the position, for example `LCM`, never `CML`.

### 3.3 Role families

`roleFamily` is a compatibility boundary for the separate player-role specification. It is not a role itself.

Allowed values are:

`goalkeeper`, `centre_back`, `full_back`, `wing_back`, `defensive_midfielder`, `central_midfielder`, `wide_midfielder`, `attacking_midfielder`, `wide_forward`, and `striker`.

The role specification must map every role identifier to one or more of these families. The application derives supported role identifiers from that mapping. Formation data must not duplicate or independently redefine the role catalogue.

### 3.4 Slot equivalence

Each slot has one `equivalenceKey`. On formation change, a player is retained only when the destination formation contains exactly one slot with the same key.

This is intentionally conservative:

- a left-back and a left wing-back share `left_flank_defender`, so the player can safely remain on the same defensive flank;
- a left centre-back in a back four and left centre-back in a back three share `left_centre_back`;
- a lone striker shares `centre_striker` across lone-striker formations;
- a striker in a pair does not automatically become the lone striker because choosing left or right would be arbitrary;
- a player in one side of a double pivot does not automatically become the single pivot;
- a wide midfielder does not automatically become a wide forward;
- a narrow attacking midfielder does not automatically become a winger.

If two source slots could plausibly map to one destination slot, neither maps unless their keys are already unique and equal. No proximity-based fallback is allowed.

---

## 4. Canonical display order

This order is normative. It controls the formation picker and resolves Community XI formation ties.

| Order | ID | Canonical name | Separate option? |
| ---: | --- | --- | --- |
| 1 | `4-2-3-1-wide` | 4-2-3-1 Wide | Yes |
| 2 | `4-3-3` | 4-3-3 | Yes |
| 3 | `3-4-2-1` | 3-4-2-1 | Yes |
| 4 | `3-5-2` | 3-5-2 | Yes |
| 5 | `4-4-2-flat` | 4-4-2 Flat | Yes |
| 6 | `4-1-4-1` | 4-1-4-1 | Yes |
| 7 | `4-4-1-1` | 4-4-1-1 | Yes |
| 8 | `4-4-2-diamond` | 4-4-2 Diamond | Yes |
| 9 | `4-2-2-2` | 4-2-2-2 | Yes |
| 10 | `3-4-3-wide` | 3-4-3 Wide | Yes |
| 11 | `3-4-1-2` | 3-4-1-2 | Yes |
| 12 | `4-2-3-1-narrow` | 4-2-3-1 Narrow | Yes |
| 13 | `4-2-4` | 4-2-4 | Yes |
| 14 | `5-3-2` | 5-3-2 | Yes |

Display order prioritizes broadly recognisable modern shapes, gives prominent placement to the 3-4-2-1 relevant to recent Manchester United tactical discussion, and leaves specialist or deliberately aggressive/defensive variants lower in the picker. It is not a claim about tactical quality.

---

## 5. Formation definitions

Slot tables are ordered from goalkeeper toward the opposition goal, then from left to right within a line. That sequence is the canonical `slotOrder`.

### 5.1 4-2-3-1 Wide

- **ID:** `4-2-3-1-wide`
- **Alternative names:** 4-2-3-1; 4-2-3-1 with wingers; 4-2-1-3, when the wide players are described as a forward line
- **Concept:** Back four, double pivot, one central No 10, two genuine wide forwards, and one striker.
- **Distinction:** The LW and RW begin wider and slightly higher than the narrow LAM and RAM in `4-2-3-1-narrow`. It differs from `4-3-3` through the double pivot plus CAM rather than a single pivot plus two No 8s.
- **Decision:** **Include separately.** This is the default interpretation in this product and one of the most familiar modern team-sheet shapes.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lb` | LB | 14 | 25 | full_back | `left_flank_defender` |
| `lcb` | LCB | 38 | 22 | centre_back | `left_centre_back` |
| `rcb` | RCB | 62 | 22 | centre_back | `right_centre_back` |
| `rb` | RB | 86 | 25 | full_back | `right_flank_defender` |
| `ldm` | LDM | 39 | 45 | defensive_midfielder | `left_double_pivot` |
| `rdm` | RDM | 61 | 45 | defensive_midfielder | `right_double_pivot` |
| `lw` | LW | 16 | 72 | wide_forward | `left_wide_forward` |
| `cam` | CAM | 50 | 68 | attacking_midfielder | `central_attacking_midfielder` |
| `rw` | RW | 84 | 72 | wide_forward | `right_wide_forward` |
| `st` | ST | 50 | 87 | striker | `centre_striker` |

### 5.2 4-3-3

- **ID:** `4-3-3`
- **Alternative names:** 4-1-2-3; 4-3-3 Holding; 4-3-3 with a single pivot
- **Concept:** Back four, one holding midfielder, two No 8s, two wide forwards, and one striker.
- **Distinction:** It has a single pivot and two advanced central midfielders, not the double pivot and CAM of `4-2-3-1-wide`. Winger and inside-forward behaviours do not create separate formations.
- **Decision:** **Include separately.** It is a foundational modern shape with a visibly different midfield triangle.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lb` | LB | 14 | 25 | full_back | `left_flank_defender` |
| `lcb` | LCB | 38 | 22 | centre_back | `left_centre_back` |
| `rcb` | RCB | 62 | 22 | centre_back | `right_centre_back` |
| `rb` | RB | 86 | 25 | full_back | `right_flank_defender` |
| `cdm` | CDM | 50 | 42 | defensive_midfielder | `single_pivot` |
| `lcm` | LCM | 34 | 57 | central_midfielder | `left_central_midfielder` |
| `rcm` | RCM | 66 | 57 | central_midfielder | `right_central_midfielder` |
| `lw` | LW | 16 | 76 | wide_forward | `left_wide_forward` |
| `rw` | RW | 84 | 76 | wide_forward | `right_wide_forward` |
| `st` | ST | 50 | 87 | striker | `centre_striker` |

### 5.3 3-4-2-1

- **ID:** `3-4-2-1`
- **Alternative names:** 3-4-3 Narrow; 3-4-3 with two No 10s; 3-4-2-1 box attack
- **Concept:** Three centre-backs, two wing-backs, a central-midfield pair, two narrow attacking midfielders, and one striker.
- **Distinction:** The LAM and RAM occupy inside channels rather than the high, wide starting positions of LW and RW in `3-4-3-wide`.
- **Decision:** **Include separately.** UK sources explicitly distinguish the narrow No 10 interpretation, and the shape is especially relevant to recent Manchester United tactical identity.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lcb` | LCB | 27 | 24 | centre_back | `left_centre_back` |
| `cb` | CB | 50 | 20 | centre_back | `central_centre_back` |
| `rcb` | RCB | 73 | 24 | centre_back | `right_centre_back` |
| `lwb` | LWB | 10 | 49 | wing_back | `left_flank_defender` |
| `lcm` | LCM | 39 | 49 | central_midfielder | `left_central_midfielder` |
| `rcm` | RCM | 61 | 49 | central_midfielder | `right_central_midfielder` |
| `rwb` | RWB | 90 | 49 | wing_back | `right_flank_defender` |
| `lam` | LAM | 36 | 70 | attacking_midfielder | `left_attacking_midfielder` |
| `ram` | RAM | 64 | 70 | attacking_midfielder | `right_attacking_midfielder` |
| `st` | ST | 50 | 87 | striker | `centre_striker` |

### 5.4 3-5-2

- **ID:** `3-5-2`
- **Alternative names:** 3-1-4-2, when the central midfield is explicitly staggered; 5-3-2 in its common defensive phase
- **Concept:** Three centre-backs, two proactive wing-backs, three central midfielders with a central holder, and two strikers.
- **Distinction:** It has three central midfielders rather than the two CMs plus CAM of `3-4-1-2`. Its wing-backs start clearly ahead of a defensive back-five position.
- **Decision:** **Include separately.** Three central midfielders and a two-striker line create a distinct, widely recognised structure.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lcb` | LCB | 27 | 24 | centre_back | `left_centre_back` |
| `cb` | CB | 50 | 20 | centre_back | `central_centre_back` |
| `rcb` | RCB | 73 | 24 | centre_back | `right_centre_back` |
| `lwb` | LWB | 10 | 50 | wing_back | `left_flank_defender` |
| `lcm` | LCM | 34 | 53 | central_midfielder | `left_central_midfielder` |
| `cm` | CM | 50 | 45 | central_midfielder | `central_central_midfielder` |
| `rcm` | RCM | 66 | 53 | central_midfielder | `right_central_midfielder` |
| `rwb` | RWB | 90 | 50 | wing_back | `right_flank_defender` |
| `lst` | LST | 39 | 82 | striker | `left_striker` |
| `rst` | RST | 61 | 82 | striker | `right_striker` |

### 5.5 4-4-2 Flat

- **ID:** `4-4-2-flat`
- **Alternative names:** 4-4-2; Classic 4-4-2; Flat 4-4-2
- **Concept:** Back four, flat midfield four with genuine wide midfielders, and two strikers.
- **Distinction:** The LM and RM sit deeper than wide forwards, and the midfield lacks both the single pivot and No 10 of the diamond.
- **Decision:** **Include separately.** It remains a core UK formation and carries particular Manchester United familiarity.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lb` | LB | 14 | 25 | full_back | `left_flank_defender` |
| `lcb` | LCB | 38 | 22 | centre_back | `left_centre_back` |
| `rcb` | RCB | 62 | 22 | centre_back | `right_centre_back` |
| `rb` | RB | 86 | 25 | full_back | `right_flank_defender` |
| `lm` | LM | 14 | 55 | wide_midfielder | `left_wide_midfielder` |
| `lcm` | LCM | 39 | 53 | central_midfielder | `left_central_midfielder` |
| `rcm` | RCM | 61 | 53 | central_midfielder | `right_central_midfielder` |
| `rm` | RM | 86 | 55 | wide_midfielder | `right_wide_midfielder` |
| `lst` | LST | 39 | 82 | striker | `left_striker` |
| `rst` | RST | 61 | 82 | striker | `right_striker` |

### 5.6 4-1-4-1

- **ID:** `4-1-4-1`
- **Alternative names:** 4-5-1 Holding; 4-1-4-1 with wide midfielders
- **Concept:** Back four, single holding midfielder, a line of four midfielders including LM and RM, and one striker.
- **Distinction:** The wide players are midfielders, not the higher wide forwards of `4-3-3`, and there is no CAM as in `4-2-3-1`.
- **Decision:** **Include separately.** The single pivot plus flat midfield four is immediately visible and cannot be represented faithfully by merely changing player roles.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lb` | LB | 14 | 25 | full_back | `left_flank_defender` |
| `lcb` | LCB | 38 | 22 | centre_back | `left_centre_back` |
| `rcb` | RCB | 62 | 22 | centre_back | `right_centre_back` |
| `rb` | RB | 86 | 25 | full_back | `right_flank_defender` |
| `cdm` | CDM | 50 | 41 | defensive_midfielder | `single_pivot` |
| `lm` | LM | 14 | 61 | wide_midfielder | `left_wide_midfielder` |
| `lcm` | LCM | 39 | 58 | central_midfielder | `left_central_midfielder` |
| `rcm` | RCM | 61 | 58 | central_midfielder | `right_central_midfielder` |
| `rm` | RM | 86 | 61 | wide_midfielder | `right_wide_midfielder` |
| `st` | ST | 50 | 86 | striker | `centre_striker` |

### 5.7 4-4-1-1

- **ID:** `4-4-1-1`
- **Alternative names:** 4-4-1-1 with a second striker; 4-4-2 with a withdrawn forward
- **Concept:** Back four, flat midfield four, one central support attacker, and one striker.
- **Distinction:** It retains the deeper LM/RM and two central midfielders of 4-4-2 but withdraws one forward into a central attacking slot. It is not a 4-2-3-1 because it has no attacking midfield three.
- **Decision:** **Include separately.** The withdrawn attacker produces a clear extra line and is a familiar UK team-sheet distinction.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lb` | LB | 14 | 25 | full_back | `left_flank_defender` |
| `lcb` | LCB | 38 | 22 | centre_back | `left_centre_back` |
| `rcb` | RCB | 62 | 22 | centre_back | `right_centre_back` |
| `rb` | RB | 86 | 25 | full_back | `right_flank_defender` |
| `lm` | LM | 14 | 55 | wide_midfielder | `left_wide_midfielder` |
| `lcm` | LCM | 39 | 53 | central_midfielder | `left_central_midfielder` |
| `rcm` | RCM | 61 | 53 | central_midfielder | `right_central_midfielder` |
| `rm` | RM | 86 | 55 | wide_midfielder | `right_wide_midfielder` |
| `cam` | CAM | 50 | 70 | attacking_midfielder | `central_attacking_midfielder` |
| `st` | ST | 50 | 87 | striker | `centre_striker` |

### 5.8 4-4-2 Diamond

- **ID:** `4-4-2-diamond`
- **Alternative names:** 4-1-2-1-2; 4-Diamond-2; Narrow Diamond
- **Concept:** Back four, single pivot, two No 8s, one No 10, and two strikers.
- **Distinction:** Unlike `4-4-2-flat`, it has no LM or RM and creates four staggered central-midfield positions. Unlike `4-3-1-2`, its base player is explicitly a holding pivot.
- **Decision:** **Include separately.** This is not a cosmetic 4-4-2 variation; its central overload and lack of natural midfield width are defining traits.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lb` | LB | 14 | 25 | full_back | `left_flank_defender` |
| `lcb` | LCB | 38 | 22 | centre_back | `left_centre_back` |
| `rcb` | RCB | 62 | 22 | centre_back | `right_centre_back` |
| `rb` | RB | 86 | 25 | full_back | `right_flank_defender` |
| `cdm` | CDM | 50 | 40 | defensive_midfielder | `single_pivot` |
| `lcm` | LCM | 34 | 54 | central_midfielder | `left_central_midfielder` |
| `rcm` | RCM | 66 | 54 | central_midfielder | `right_central_midfielder` |
| `cam` | CAM | 50 | 68 | attacking_midfielder | `central_attacking_midfielder` |
| `lst` | LST | 39 | 84 | striker | `left_striker` |
| `rst` | RST | 61 | 84 | striker | `right_striker` |

### 5.9 4-2-2-2

- **ID:** `4-2-2-2`
- **Alternative names:** Box Midfield 4-2-2-2; Narrow 4-2-2-2; Magic Rectangle
- **Concept:** Back four, double pivot, two narrow attacking midfielders, and two strikers.
- **Distinction:** It has no natural winger slots and no central CAM. It differs from the diamond through two holding players and two narrow No 10s, creating a midfield box.
- **Decision:** **Include separately.** The box is a materially different contemporary structure, not merely a role variant of 4-4-2.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lb` | LB | 14 | 25 | full_back | `left_flank_defender` |
| `lcb` | LCB | 38 | 22 | centre_back | `left_centre_back` |
| `rcb` | RCB | 62 | 22 | centre_back | `right_centre_back` |
| `rb` | RB | 86 | 25 | full_back | `right_flank_defender` |
| `ldm` | LDM | 39 | 44 | defensive_midfielder | `left_double_pivot` |
| `rdm` | RDM | 61 | 44 | defensive_midfielder | `right_double_pivot` |
| `lam` | LAM | 34 | 65 | attacking_midfielder | `left_attacking_midfielder` |
| `ram` | RAM | 66 | 65 | attacking_midfielder | `right_attacking_midfielder` |
| `lst` | LST | 39 | 84 | striker | `left_striker` |
| `rst` | RST | 61 | 84 | striker | `right_striker` |

### 5.10 3-4-3 Wide

- **ID:** `3-4-3-wide`
- **Alternative names:** 3-4-3; 3-4-3 Flat; 3-4-3 with wingers
- **Concept:** Three centre-backs, two wing-backs, two central midfielders, and a high, wide front three.
- **Distinction:** LW and RW begin wide and higher than the two narrow attacking midfielders in `3-4-2-1`.
- **Decision:** **Include separately.** UK tactical terminology treats the wide and narrow front threes as distinct arrangements even when both are loosely called 3-4-3.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lcb` | LCB | 27 | 24 | centre_back | `left_centre_back` |
| `cb` | CB | 50 | 20 | centre_back | `central_centre_back` |
| `rcb` | RCB | 73 | 24 | centre_back | `right_centre_back` |
| `lwb` | LWB | 10 | 49 | wing_back | `left_flank_defender` |
| `lcm` | LCM | 39 | 49 | central_midfielder | `left_central_midfielder` |
| `rcm` | RCM | 61 | 49 | central_midfielder | `right_central_midfielder` |
| `rwb` | RWB | 90 | 49 | wing_back | `right_flank_defender` |
| `lw` | LW | 16 | 77 | wide_forward | `left_wide_forward` |
| `rw` | RW | 84 | 77 | wide_forward | `right_wide_forward` |
| `st` | ST | 50 | 87 | striker | `centre_striker` |

### 5.11 3-4-1-2

- **ID:** `3-4-1-2`
- **Alternative names:** 3-4-1-2 with a No 10; 3-4-1-2 Diamond
- **Concept:** Three centre-backs, two wing-backs, two central midfielders, one central No 10, and two strikers.
- **Distinction:** The advanced midfielder sits behind the striker pair. In `3-5-2`, the third central midfielder sits deeper as part of the midfield three.
- **Decision:** **Include separately.** The No 10 is a meaningful starting-position change and a natural choice for fitting a specialist creator behind two forwards.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lcb` | LCB | 27 | 24 | centre_back | `left_centre_back` |
| `cb` | CB | 50 | 20 | centre_back | `central_centre_back` |
| `rcb` | RCB | 73 | 24 | centre_back | `right_centre_back` |
| `lwb` | LWB | 10 | 49 | wing_back | `left_flank_defender` |
| `lcm` | LCM | 39 | 49 | central_midfielder | `left_central_midfielder` |
| `rcm` | RCM | 61 | 49 | central_midfielder | `right_central_midfielder` |
| `rwb` | RWB | 90 | 49 | wing_back | `right_flank_defender` |
| `cam` | CAM | 50 | 66 | attacking_midfielder | `central_attacking_midfielder` |
| `lst` | LST | 39 | 84 | striker | `left_striker` |
| `rst` | RST | 61 | 84 | striker | `right_striker` |

### 5.12 4-2-3-1 Narrow

- **ID:** `4-2-3-1-narrow`
- **Alternative names:** 4-2-3-1 with three No 10s; Narrow 4-2-3-1; 4-2-3-1 with inside attacking midfielders
- **Concept:** Back four, double pivot, three narrow attacking midfielders, and one striker.
- **Distinction:** LAM and RAM begin in the inside channels. They are not merely LW and RW instructed to cut inside, because the static team sheet deliberately gives up high attacking width and relies more on the full-backs for width.
- **Decision:** **Include separately.** This is the clearest justified same-number variant and directly prevents a meaningful positional choice from being hidden behind one generic 4-2-3-1.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lb` | LB | 14 | 25 | full_back | `left_flank_defender` |
| `lcb` | LCB | 38 | 22 | centre_back | `left_centre_back` |
| `rcb` | RCB | 62 | 22 | centre_back | `right_centre_back` |
| `rb` | RB | 86 | 25 | full_back | `right_flank_defender` |
| `ldm` | LDM | 39 | 45 | defensive_midfielder | `left_double_pivot` |
| `rdm` | RDM | 61 | 45 | defensive_midfielder | `right_double_pivot` |
| `lam` | LAM | 34 | 68 | attacking_midfielder | `left_attacking_midfielder` |
| `cam` | CAM | 50 | 71 | attacking_midfielder | `central_attacking_midfielder` |
| `ram` | RAM | 66 | 68 | attacking_midfielder | `right_attacking_midfielder` |
| `st` | ST | 50 | 87 | striker | `centre_striker` |

### 5.13 4-2-4

- **ID:** `4-2-4`
- **Alternative names:** 4-2-4 Wide; Attacking 4-2-4
- **Concept:** Back four, central-midfield pair, two wide forwards, and two strikers.
- **Distinction:** The wide players are forwards on the same broad attacking line as the striker pair, rather than the deeper LM/RM of `4-4-2-flat`. It also has no CAM or double pivot defined as defensive midfielders.
- **Decision:** **Include separately.** It provides one deliberate all-out attacking structure without adding multiple speculative “ultra-attacking” variants.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lb` | LB | 14 | 25 | full_back | `left_flank_defender` |
| `lcb` | LCB | 38 | 22 | centre_back | `left_centre_back` |
| `rcb` | RCB | 62 | 22 | centre_back | `right_centre_back` |
| `rb` | RB | 86 | 25 | full_back | `right_flank_defender` |
| `lcm` | LCM | 39 | 50 | central_midfielder | `left_central_midfielder` |
| `rcm` | RCM | 61 | 50 | central_midfielder | `right_central_midfielder` |
| `lw` | LW | 14 | 76 | wide_forward | `left_wide_forward` |
| `rw` | RW | 86 | 76 | wide_forward | `right_wide_forward` |
| `lst` | LST | 39 | 85 | striker | `left_striker` |
| `rst` | RST | 61 | 85 | striker | `right_striker` |

### 5.14 5-3-2

- **ID:** `5-3-2`
- **Alternative names:** Defensive 3-5-2; 5-3-2 Low; Back-five 3-5-2
- **Concept:** A clearly drawn back five with low wing-backs, three central midfielders, and two strikers.
- **Distinction:** It uses the same broad personnel categories as `3-5-2`, but the LWB and RWB begin on the defensive line rather than the midfield line. The separate option expresses an intentionally deeper reference block, not every ordinary defensive transition of a 3-5-2.
- **Decision:** **Include separately, narrowly.** Back three versus back five is a meaningful choice to supporters and commentators. This is the only defensive-phase-derived variant retained because the static slot movement is large, symmetric, and central to how the lineup is communicated.

| Slot | Position | x | y | Role family | Equivalence key |
| --- | --- | ---: | ---: | --- | --- |
| `gk` | GK | 50 | 7 | goalkeeper | `goalkeeper` |
| `lwb` | LWB | 8 | 29 | wing_back | `left_flank_defender` |
| `lcb` | LCB | 29 | 22 | centre_back | `left_centre_back` |
| `cb` | CB | 50 | 19 | centre_back | `central_centre_back` |
| `rcb` | RCB | 71 | 22 | centre_back | `right_centre_back` |
| `rwb` | RWB | 92 | 29 | wing_back | `right_flank_defender` |
| `lcm` | LCM | 34 | 53 | central_midfielder | `left_central_midfielder` |
| `cm` | CM | 50 | 46 | central_midfielder | `central_central_midfielder` |
| `rcm` | RCM | 66 | 53 | central_midfielder | `right_central_midfielder` |
| `lst` | LST | 39 | 82 | striker | `left_striker` |
| `rst` | RST | 61 | 82 | striker | `right_striker` |

---

## 6. Explicit exclusions and aliases

These decisions prevent near-duplicate options from entering the MVP.

| Candidate | Decision | Canonical treatment |
| --- | --- | --- |
| 4-3-3 with wingers | Exclude as separate variant | Use `4-3-3` and a winger role. |
| 4-3-3 with inside forwards | Exclude as separate variant | Use `4-3-3` and an inside-forward role. Starting slots are unchanged. |
| 4-3-3 False 9 | Exclude as separate variant | Use `4-3-3` and a false-nine role for ST. |
| 4-3-3 Attacking | Exclude | Usually duplicates either `4-3-3` with advanced No 8 roles or `4-2-3-1-wide`. |
| 4-3-3 Defensive | Exclude | Use `4-3-3` with an appropriate pivot role or `4-1-4-1` when wide players are genuinely deeper. |
| 4-5-1 Flat | Exclude | Use `4-1-4-1` for a holding player or `4-4-1-1` for a withdrawn attacker. “4-5-1” alone is too ambiguous. |
| 4-3-2-1 Christmas Tree | Exclude from MVP | Tactically valid but materially overlaps the narrow attacking-midfielder space and is too specialist for the curated first release. Reconsider only with evidence of demand. |
| 4-3-1-2 | Exclude from MVP | Use `4-4-2-diamond`. Removing the explicit pivot creates a modest distinction but not enough additional fan value for MVP. |
| 4-1-2-1-2 | Alias | This is `4-4-2-diamond`. |
| 4-2-1-3 | Contextual alias only | Usually `4-2-3-1-wide` when the wide attackers are shown high. Do not add as a separate option. |
| 3-4-3 Narrow | Alias | This is `3-4-2-1`. |
| 3-4-3 with wingers | Alias | This is `3-4-3-wide`. |
| 3-4-3 Diamond | Exclude | Too ambiguous and often describes an in-possession rotation rather than a stable team-sheet shape. |
| 3-3-3-1 | Exclude | Legitimate but too specialist for the curated supporter-facing library. |
| 3-1-4-2 | Alias | This is the selected interpretation of `3-5-2`; the central CM is drawn deeper. |
| 5-2-3 | Exclude as separate variant | Use `3-4-3-wide`; a deeper back-five defensive phase does not justify a second option unless product evidence later shows demand. |
| 5-4-1 | Exclude as separate variant | Usually the defensive phase of `3-4-2-1` or `3-4-3-wide`; roles and match phase explain the difference better than another lineup option. |
| 5-2-2-1 | Alias / phase description | Use `3-4-2-1`. |
| Inverted full-backs or wing-backs | Exclude as formations | These are player roles and in-possession movements. |
| Asymmetric formations | Exclude from MVP | The builder has no custom formation editing, and a fixed set of one-off asymmetries would create arbitrary variants and poor Community aggregation. |

---

## 7. Deterministic implementation rules

1. The application must ship exactly the 14 active formation definitions in this version.
2. `id` is stable and must never be derived from a mutable display label at runtime.
3. Every formation must contain exactly 11 slots and exactly one `gk` slot.
4. Slot IDs are unique within a formation. The same ID may be reused in another formation only with the same abbreviation and positional meaning.
5. Coordinates must be integers in the inclusive range 0 to 100.
6. Mirrored left and right slots must have `leftX + rightX = 100` and equal `y`.
7. Every slot must have exactly one valid `roleFamily` and one `equivalenceKey`.
8. Formation changes use exact `equivalenceKey` equality only. Coordinate proximity, player registered position, and role similarity must never create an implicit match.
9. When a source and destination contain the same equivalence key exactly once, transfer the player to that destination slot.
10. Preserve a role only if the role specification marks it compatible with the destination `roleFamily`; otherwise clear it and inform the user as required by the PRD.
11. A formation label shown with a historical lineup must come from the saved historical snapshot, not only from the current library.
12. Alternative names are search and explanation metadata. They must not be stored as separate Community XI formation choices.
13. Formation display order is the `displayOrder` value below and is the final formation tie-break defined by the PRD.
14. No user-selectable “default formation” is specified. The builder begins without a selected formation unless restoring a working or saved lineup.

---

## 8. Machine-readable canonical representation

The following JSON is normative. Descriptions above are explanatory; if a transcription discrepancy exists, this JSON controls identifiers, order, slot data, coordinates, role families, and equivalence.

```json
{
  "schemaVersion": 1,
  "coordinateSystem": {
    "xMin": 0,
    "xMax": 100,
    "yMin": 0,
    "yMax": 100,
    "attackingDirection": "increasing_y",
    "screenTopPercentFormula": "100 - y"
  },
  "roleFamilies": [
    "goalkeeper",
    "centre_back",
    "full_back",
    "wing_back",
    "defensive_midfielder",
    "central_midfielder",
    "wide_midfielder",
    "attacking_midfielder",
    "wide_forward",
    "striker"
  ],
  "formations": [
    {
      "id": "4-2-3-1-wide",
      "name": "4-2-3-1 Wide",
      "alternativeNames": ["4-2-3-1", "4-2-3-1 with wingers", "4-2-1-3"],
      "displayOrder": 1,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lb", "LB", 14, 25, "full_back", "left_flank_defender"],
        ["lcb", "LCB", 38, 22, "centre_back", "left_centre_back"],
        ["rcb", "RCB", 62, 22, "centre_back", "right_centre_back"],
        ["rb", "RB", 86, 25, "full_back", "right_flank_defender"],
        ["ldm", "LDM", 39, 45, "defensive_midfielder", "left_double_pivot"],
        ["rdm", "RDM", 61, 45, "defensive_midfielder", "right_double_pivot"],
        ["lw", "LW", 16, 72, "wide_forward", "left_wide_forward"],
        ["cam", "CAM", 50, 68, "attacking_midfielder", "central_attacking_midfielder"],
        ["rw", "RW", 84, 72, "wide_forward", "right_wide_forward"],
        ["st", "ST", 50, 87, "striker", "centre_striker"]
      ]
    },
    {
      "id": "4-3-3",
      "name": "4-3-3",
      "alternativeNames": ["4-1-2-3", "4-3-3 Holding", "4-3-3 with a single pivot"],
      "displayOrder": 2,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lb", "LB", 14, 25, "full_back", "left_flank_defender"],
        ["lcb", "LCB", 38, 22, "centre_back", "left_centre_back"],
        ["rcb", "RCB", 62, 22, "centre_back", "right_centre_back"],
        ["rb", "RB", 86, 25, "full_back", "right_flank_defender"],
        ["cdm", "CDM", 50, 42, "defensive_midfielder", "single_pivot"],
        ["lcm", "LCM", 34, 57, "central_midfielder", "left_central_midfielder"],
        ["rcm", "RCM", 66, 57, "central_midfielder", "right_central_midfielder"],
        ["lw", "LW", 16, 76, "wide_forward", "left_wide_forward"],
        ["rw", "RW", 84, 76, "wide_forward", "right_wide_forward"],
        ["st", "ST", 50, 87, "striker", "centre_striker"]
      ]
    },
    {
      "id": "3-4-2-1",
      "name": "3-4-2-1",
      "alternativeNames": ["3-4-3 Narrow", "3-4-3 with two No 10s", "3-4-2-1 box attack"],
      "displayOrder": 3,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lcb", "LCB", 27, 24, "centre_back", "left_centre_back"],
        ["cb", "CB", 50, 20, "centre_back", "central_centre_back"],
        ["rcb", "RCB", 73, 24, "centre_back", "right_centre_back"],
        ["lwb", "LWB", 10, 49, "wing_back", "left_flank_defender"],
        ["lcm", "LCM", 39, 49, "central_midfielder", "left_central_midfielder"],
        ["rcm", "RCM", 61, 49, "central_midfielder", "right_central_midfielder"],
        ["rwb", "RWB", 90, 49, "wing_back", "right_flank_defender"],
        ["lam", "LAM", 36, 70, "attacking_midfielder", "left_attacking_midfielder"],
        ["ram", "RAM", 64, 70, "attacking_midfielder", "right_attacking_midfielder"],
        ["st", "ST", 50, 87, "striker", "centre_striker"]
      ]
    },
    {
      "id": "3-5-2",
      "name": "3-5-2",
      "alternativeNames": ["3-1-4-2", "5-3-2 in defensive phase"],
      "displayOrder": 4,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lcb", "LCB", 27, 24, "centre_back", "left_centre_back"],
        ["cb", "CB", 50, 20, "centre_back", "central_centre_back"],
        ["rcb", "RCB", 73, 24, "centre_back", "right_centre_back"],
        ["lwb", "LWB", 10, 50, "wing_back", "left_flank_defender"],
        ["lcm", "LCM", 34, 53, "central_midfielder", "left_central_midfielder"],
        ["cm", "CM", 50, 45, "central_midfielder", "central_central_midfielder"],
        ["rcm", "RCM", 66, 53, "central_midfielder", "right_central_midfielder"],
        ["rwb", "RWB", 90, 50, "wing_back", "right_flank_defender"],
        ["lst", "LST", 39, 82, "striker", "left_striker"],
        ["rst", "RST", 61, 82, "striker", "right_striker"]
      ]
    },
    {
      "id": "4-4-2-flat",
      "name": "4-4-2 Flat",
      "alternativeNames": ["4-4-2", "Classic 4-4-2", "Flat 4-4-2"],
      "displayOrder": 5,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lb", "LB", 14, 25, "full_back", "left_flank_defender"],
        ["lcb", "LCB", 38, 22, "centre_back", "left_centre_back"],
        ["rcb", "RCB", 62, 22, "centre_back", "right_centre_back"],
        ["rb", "RB", 86, 25, "full_back", "right_flank_defender"],
        ["lm", "LM", 14, 55, "wide_midfielder", "left_wide_midfielder"],
        ["lcm", "LCM", 39, 53, "central_midfielder", "left_central_midfielder"],
        ["rcm", "RCM", 61, 53, "central_midfielder", "right_central_midfielder"],
        ["rm", "RM", 86, 55, "wide_midfielder", "right_wide_midfielder"],
        ["lst", "LST", 39, 82, "striker", "left_striker"],
        ["rst", "RST", 61, 82, "striker", "right_striker"]
      ]
    },
    {
      "id": "4-1-4-1",
      "name": "4-1-4-1",
      "alternativeNames": ["4-5-1 Holding", "4-1-4-1 with wide midfielders"],
      "displayOrder": 6,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lb", "LB", 14, 25, "full_back", "left_flank_defender"],
        ["lcb", "LCB", 38, 22, "centre_back", "left_centre_back"],
        ["rcb", "RCB", 62, 22, "centre_back", "right_centre_back"],
        ["rb", "RB", 86, 25, "full_back", "right_flank_defender"],
        ["cdm", "CDM", 50, 41, "defensive_midfielder", "single_pivot"],
        ["lm", "LM", 14, 61, "wide_midfielder", "left_wide_midfielder"],
        ["lcm", "LCM", 39, 58, "central_midfielder", "left_central_midfielder"],
        ["rcm", "RCM", 61, 58, "central_midfielder", "right_central_midfielder"],
        ["rm", "RM", 86, 61, "wide_midfielder", "right_wide_midfielder"],
        ["st", "ST", 50, 86, "striker", "centre_striker"]
      ]
    },
    {
      "id": "4-4-1-1",
      "name": "4-4-1-1",
      "alternativeNames": ["4-4-1-1 with a second striker", "4-4-2 with a withdrawn forward"],
      "displayOrder": 7,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lb", "LB", 14, 25, "full_back", "left_flank_defender"],
        ["lcb", "LCB", 38, 22, "centre_back", "left_centre_back"],
        ["rcb", "RCB", 62, 22, "centre_back", "right_centre_back"],
        ["rb", "RB", 86, 25, "full_back", "right_flank_defender"],
        ["lm", "LM", 14, 55, "wide_midfielder", "left_wide_midfielder"],
        ["lcm", "LCM", 39, 53, "central_midfielder", "left_central_midfielder"],
        ["rcm", "RCM", 61, 53, "central_midfielder", "right_central_midfielder"],
        ["rm", "RM", 86, 55, "wide_midfielder", "right_wide_midfielder"],
        ["cam", "CAM", 50, 70, "attacking_midfielder", "central_attacking_midfielder"],
        ["st", "ST", 50, 87, "striker", "centre_striker"]
      ]
    },
    {
      "id": "4-4-2-diamond",
      "name": "4-4-2 Diamond",
      "alternativeNames": ["4-1-2-1-2", "4-Diamond-2", "Narrow Diamond"],
      "displayOrder": 8,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lb", "LB", 14, 25, "full_back", "left_flank_defender"],
        ["lcb", "LCB", 38, 22, "centre_back", "left_centre_back"],
        ["rcb", "RCB", 62, 22, "centre_back", "right_centre_back"],
        ["rb", "RB", 86, 25, "full_back", "right_flank_defender"],
        ["cdm", "CDM", 50, 40, "defensive_midfielder", "single_pivot"],
        ["lcm", "LCM", 34, 54, "central_midfielder", "left_central_midfielder"],
        ["rcm", "RCM", 66, 54, "central_midfielder", "right_central_midfielder"],
        ["cam", "CAM", 50, 68, "attacking_midfielder", "central_attacking_midfielder"],
        ["lst", "LST", 39, 84, "striker", "left_striker"],
        ["rst", "RST", 61, 84, "striker", "right_striker"]
      ]
    },
    {
      "id": "4-2-2-2",
      "name": "4-2-2-2",
      "alternativeNames": ["Box Midfield 4-2-2-2", "Narrow 4-2-2-2", "Magic Rectangle"],
      "displayOrder": 9,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lb", "LB", 14, 25, "full_back", "left_flank_defender"],
        ["lcb", "LCB", 38, 22, "centre_back", "left_centre_back"],
        ["rcb", "RCB", 62, 22, "centre_back", "right_centre_back"],
        ["rb", "RB", 86, 25, "full_back", "right_flank_defender"],
        ["ldm", "LDM", 39, 44, "defensive_midfielder", "left_double_pivot"],
        ["rdm", "RDM", 61, 44, "defensive_midfielder", "right_double_pivot"],
        ["lam", "LAM", 34, 65, "attacking_midfielder", "left_attacking_midfielder"],
        ["ram", "RAM", 66, 65, "attacking_midfielder", "right_attacking_midfielder"],
        ["lst", "LST", 39, 84, "striker", "left_striker"],
        ["rst", "RST", 61, 84, "striker", "right_striker"]
      ]
    },
    {
      "id": "3-4-3-wide",
      "name": "3-4-3 Wide",
      "alternativeNames": ["3-4-3", "3-4-3 Flat", "3-4-3 with wingers"],
      "displayOrder": 10,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lcb", "LCB", 27, 24, "centre_back", "left_centre_back"],
        ["cb", "CB", 50, 20, "centre_back", "central_centre_back"],
        ["rcb", "RCB", 73, 24, "centre_back", "right_centre_back"],
        ["lwb", "LWB", 10, 49, "wing_back", "left_flank_defender"],
        ["lcm", "LCM", 39, 49, "central_midfielder", "left_central_midfielder"],
        ["rcm", "RCM", 61, 49, "central_midfielder", "right_central_midfielder"],
        ["rwb", "RWB", 90, 49, "wing_back", "right_flank_defender"],
        ["lw", "LW", 16, 77, "wide_forward", "left_wide_forward"],
        ["rw", "RW", 84, 77, "wide_forward", "right_wide_forward"],
        ["st", "ST", 50, 87, "striker", "centre_striker"]
      ]
    },
    {
      "id": "3-4-1-2",
      "name": "3-4-1-2",
      "alternativeNames": ["3-4-1-2 with a No 10", "3-4-1-2 Diamond"],
      "displayOrder": 11,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lcb", "LCB", 27, 24, "centre_back", "left_centre_back"],
        ["cb", "CB", 50, 20, "centre_back", "central_centre_back"],
        ["rcb", "RCB", 73, 24, "centre_back", "right_centre_back"],
        ["lwb", "LWB", 10, 49, "wing_back", "left_flank_defender"],
        ["lcm", "LCM", 39, 49, "central_midfielder", "left_central_midfielder"],
        ["rcm", "RCM", 61, 49, "central_midfielder", "right_central_midfielder"],
        ["rwb", "RWB", 90, 49, "wing_back", "right_flank_defender"],
        ["cam", "CAM", 50, 66, "attacking_midfielder", "central_attacking_midfielder"],
        ["lst", "LST", 39, 84, "striker", "left_striker"],
        ["rst", "RST", 61, 84, "striker", "right_striker"]
      ]
    },
    {
      "id": "4-2-3-1-narrow",
      "name": "4-2-3-1 Narrow",
      "alternativeNames": ["4-2-3-1 with three No 10s", "Narrow 4-2-3-1", "4-2-3-1 with inside attacking midfielders"],
      "displayOrder": 12,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lb", "LB", 14, 25, "full_back", "left_flank_defender"],
        ["lcb", "LCB", 38, 22, "centre_back", "left_centre_back"],
        ["rcb", "RCB", 62, 22, "centre_back", "right_centre_back"],
        ["rb", "RB", 86, 25, "full_back", "right_flank_defender"],
        ["ldm", "LDM", 39, 45, "defensive_midfielder", "left_double_pivot"],
        ["rdm", "RDM", 61, 45, "defensive_midfielder", "right_double_pivot"],
        ["lam", "LAM", 34, 68, "attacking_midfielder", "left_attacking_midfielder"],
        ["cam", "CAM", 50, 71, "attacking_midfielder", "central_attacking_midfielder"],
        ["ram", "RAM", 66, 68, "attacking_midfielder", "right_attacking_midfielder"],
        ["st", "ST", 50, 87, "striker", "centre_striker"]
      ]
    },
    {
      "id": "4-2-4",
      "name": "4-2-4",
      "alternativeNames": ["4-2-4 Wide", "Attacking 4-2-4"],
      "displayOrder": 13,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lb", "LB", 14, 25, "full_back", "left_flank_defender"],
        ["lcb", "LCB", 38, 22, "centre_back", "left_centre_back"],
        ["rcb", "RCB", 62, 22, "centre_back", "right_centre_back"],
        ["rb", "RB", 86, 25, "full_back", "right_flank_defender"],
        ["lcm", "LCM", 39, 50, "central_midfielder", "left_central_midfielder"],
        ["rcm", "RCM", 61, 50, "central_midfielder", "right_central_midfielder"],
        ["lw", "LW", 14, 76, "wide_forward", "left_wide_forward"],
        ["rw", "RW", 86, 76, "wide_forward", "right_wide_forward"],
        ["lst", "LST", 39, 85, "striker", "left_striker"],
        ["rst", "RST", 61, 85, "striker", "right_striker"]
      ]
    },
    {
      "id": "5-3-2",
      "name": "5-3-2",
      "alternativeNames": ["Defensive 3-5-2", "5-3-2 Low", "Back-five 3-5-2"],
      "displayOrder": 14,
      "slots": [
        ["gk", "GK", 50, 7, "goalkeeper", "goalkeeper"],
        ["lwb", "LWB", 8, 29, "wing_back", "left_flank_defender"],
        ["lcb", "LCB", 29, 22, "centre_back", "left_centre_back"],
        ["cb", "CB", 50, 19, "centre_back", "central_centre_back"],
        ["rcb", "RCB", 71, 22, "centre_back", "right_centre_back"],
        ["rwb", "RWB", 92, 29, "wing_back", "right_flank_defender"],
        ["lcm", "LCM", 34, 53, "central_midfielder", "left_central_midfielder"],
        ["cm", "CM", 50, 46, "central_midfielder", "central_central_midfielder"],
        ["rcm", "RCM", 66, 53, "central_midfielder", "right_central_midfielder"],
        ["lst", "LST", 39, 82, "striker", "left_striker"],
        ["rst", "RST", 61, 82, "striker", "right_striker"]
      ]
    }
  ],
  "slotTuple": [
    "id",
    "abbreviation",
    "x",
    "y",
    "roleFamily",
    "equivalenceKey"
  ]
}
```

---

## 9. Validation checklist for Codex

Codex must validate the canonical JSON before implementation or whenever this file changes:

- exactly 14 formations exist;
- `displayOrder` contains every integer from 1 through 14 exactly once;
- every formation has exactly 11 slot tuples;
- every formation has exactly one `GK` and one `goalkeeper` equivalence key;
- slot IDs are unique within each formation;
- every abbreviation is defined in section 3.2;
- every role family is in the root `roleFamilies` list;
- all coordinates are integers from 0 through 100;
- every left/right pair is geometrically mirrored;
- every equivalence key occurs no more than once within a formation;
- all canonical names and IDs match the display-order table;
- alternative names never create additional stored formation identities.

The extracted runtime data should be generated from this canonical representation or copied with an automated parity test. It must not be manually maintained in two unverified sources.

---

## 10. Product boundary

This specification defines where players begin on the lineup-builder pitch. It does not define:

- how they move in possession;
- how they defend or press;
- team mentality, width, or line height;
- set-piece positions;
- duties such as attack, support, or defend;
- role names or descriptions;
- player eligibility by real-world position.

Those boundaries preserve the PRD’s principle that any available player may occupy any slot and that the role layer is optional. The separate player-role specification may add tactical meaning to a slot, but it must not silently add, remove, rename, or reposition formations from this document.
