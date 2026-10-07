# Initial squad

Source: the seven screenshots supplied by the user in this task. This is a transcription of the requested squad, not an independently verified real-world roster.

[shared.json](../../content/shared.json) is the machine-readable source for the initial squad: **36 players**, ordered by shirt number. IDs are permanent opaque identifiers; preserve them when changing names or numbers. The original seed was moved into the single shared-content document on 7 October 2026, preserving every record. Squad active state and fixture availability will be handled during content integration; they are not inferred from the screenshots.

## Applied instructions

- Include only players with a visible shirt number.
- Remove middle names: Patrick Chinazaekpere Dorgu becomes **Patrick Dorgu**.
- Preserve **Matthijs de Ligt** (surname particle), **Amad** as displayed, and accents in Šeško, Martínez and León.
- Do not extract or reuse photographs, crests or kit imagery.
- This seed-specific filtering does not settle M-01's general admin number-range/uniqueness policy or M-02's availability-change policy.

## Excluded: no visible number

Enzo Kana Biyik, Samuel Lusale, Tynan Thompson, Dan Armer, Godwill Kukonki and Albert Mills.

## Review list

This table is a review rendering of the JSON; the JSON is the source to use for implementation.

| Number | Player |
| ---: | --- |
| 1 | Senne Lammens |
| 2 | Diogo Dalot |
| 3 | Noussair Mazraoui |
| 4 | Matthijs de Ligt |
| 5 | Harry Maguire |
| 6 | Lisandro Martínez |
| 7 | Mason Mount |
| 8 | Bruno Fernandes |
| 9 | Marcus Rashford |
| 10 | Matheus Cunha |
| 11 | Joshua Zirkzee |
| 12 | Karl Darlow |
| 13 | Patrick Dorgu |
| 15 | Leny Yoro |
| 16 | Amad |
| 17 | Andrey Santos |
| 18 | Youri Tielemans |
| 19 | Bryan Mbeumo |
| 20 | Carlos Baleba |
| 22 | Tom Heaton |
| 23 | Luke Shaw |
| 25 | Manuel Ugarte |
| 26 | Ayden Heaven |
| 30 | Benjamin Šeško |
| 31 | Shea Lacey |
| 35 | Diego León |
| 37 | Kobbie Mainoo |
| 38 | Jack Fletcher |
| 39 | Tyler Fletcher |
| 41 | Harry Amass |
| 45 | Dermot Mee |
| 58 | Ashton Missin |
| 64 | Victor Musa |
| 65 | Reece Munro |
| 66 | Jaydan Kamason |
| 70 | Bendito Mantato |

## Verification

Mapped to MVP-10's seed/shared-content checks: all 36 entries have nonempty names, integer shirt numbers and unique stable IDs. This particular supplied roster also has unique numbers. No future validation policy is inferred from that observation. Checked inclusion against all seven screenshots and excluded the six unnumbered cards.
