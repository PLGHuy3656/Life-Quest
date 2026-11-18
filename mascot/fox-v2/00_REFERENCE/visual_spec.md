# LifeQuest Fox V2 — Visual Reference Specification

Status: **Gate A complete** · version 2.0.0-gateA · 2026-11-16

## 1. Reference files

| File | Role | Authority |
|---|---|---|
| `FOX_V2_BASELINE.png` (1536×1024, SHA-256 `19811dd7…8c8653`) | Canonical sheet "LifeQuest Fox V2 — Chibi Baseline", copied unchanged | **Single source of truth.** Main full-body fox = colour, materials, proportions, identity |
| `supplementary/fox_v2_turnaround_front_34_side.png` (2172×724) | High-res front / 3/4 / side turnaround supplied with the brief | Measurement source for face alignment, head depth, muzzle, tail curve, torso depth |
| `supplementary/fox_v2_turnaround_back_views.png` (2172×724) | Back / back-3/4 / back-side | Scarf, backpack, ears and **tail placement** |
| `supplementary/fox_v2_expressions_front.png` (2172×724) | Neutral / happy / sleepy / surprised, full body | Expression design |
| `supplementary/fox_v2_3d_production_reference_sheet.png` (1774×887) | Second layout of the same sheet | Cross-check only (identical design) |

The supplementary images show the same character as the baseline at higher
resolution; they are used for measurement, never to override the baseline.

## 2. Identity checklist (all present in the reference, all required in 3D)

Orange chibi body · large soft triangular ears with cream inner · oversized
rounded head with horizontal cheek-fluff ridge · small compact body · very
short arms and legs · dark-brown paws and feet · large dark vertical oval eyes
(no sclera) · small brown nose · cat "ω" mouth · large cream face mask and
cream belly · subtle pink cheeks · small three-lobe forehead tuft · large
orange tail with zig-zag cream tip · red bandana-scarf with white flame
emblem · small green backpack with gold buckle.

Explicitly absent: fur strands, clothing wrinkles, fingers, realistic anatomy,
facial markings, extra props, texture noise.

## 3. How measurements were taken

* Each turnaround view was cropped to 724×724 px; a 25 px grid was overlaid
  and colour regions were segmented (orange / cream / red / green / brown) to
  read bounding boxes and per-row widths (`proportions.json` keeps the raw px).
* Normalisation: ground (bottom of feet) at y = 670 px, ear tip at y = 28 px →
  642 px = **1.000 m** total height. 1 px ≈ 1.56 mm.
* Each value in `01_DESIGN/proportions.json` is tagged **measured**,
  **estimated** or **decided**. Measured values are ±5 px (±8 mm). The
  turnaround is a rendered illustration with mild perspective, so even
  "measured" values describe design intent rather than CAD truth.

## 4. Key proportions (summary)

| Feature | Value | Confidence |
|---|---|---|
| Total height : width (no tail) | 1.00 m : 0.70 m (1.42) | measured |
| Head incl. ears / total height | 0.59 | measured |
| Head (crown→chin) : body (chin→ground) | 1.04 : 1 | measured |
| Head max half-width at cheek fluff | 0.352 m at z 0.576 | measured |
| Head depth (side, no nose) | 0.59 m | measured |
| Eye size / spacing | 0.068 × 0.101 m, centres ±0.105 m, z 0.611 | measured |
| Nose / mouth centre | z 0.587 / z 0.543 | measured |
| Cream face mask | ellipse ½w 0.284, top of arch z 0.607 | measured |
| Ear | tip (±0.252, 0.997), height ≈0.28, base ≈0.24 wide | measured / estimated |
| Arm | ≈0.18 long, r 0.047, paw r 0.052, ~31° from vertical | measured / estimated |
| Foot | 0.156 W × 0.21 L × 0.07 H | measured |
| Tail bbox | x −0.37…−0.03, y +0.13…+0.50, z 0.05…0.45 | measured (back + side) |
| Scarf flap | top z 0.42 → point z 0.25, ½w 0.187 | measured |
| Backpack | 0.24 W × 0.21 H × 0.10 D, z 0.14…0.35, centred on back | measured |

## 5. Palette

| Name | Brief hex | Observed in lit render |
|---|---|---|
| Main orange | `#FF8A3D` | `#FA8832` |
| Cream | `#FFE8D3` | `#FEE3C4` |
| Scarf red | `#CE3A3A` | ≈`#CE3F2B` |
| Backpack green | `#4CAF6E` | **`#688E52` (olive)** |
| Brown details | `#7A482D` | `#884420` |

## 6. Discrepancies found in the reference (documented, not silently fixed)

1. **Tail side.** Front turnaround: tail on the character's LEFT. Back
   turnaround: tail on the character's RIGHT. The main illustration and the
   3/4 view are compatible with a tail on the right. The brief makes the back
   view the authority for tail placement → r1 put the tail on the character's
   right (−X). **Gate C r2 (user decision):** match the front and 3/4 views
   with one physical tail — the base runs straight back from the rump and the
   cream-tipped end curls to the character's LEFT (+X). Consequence: the back
   view now shows the tail on screen-left, opposite to the reference back view.
   **Gate C r3 (user final decision, option C):** tail curls to the character's
   RIGHT (−X), matching the hero illustration, 3/4 and back views. The front
   turnaround is treated as the inconsistent view.
2. **Backpack colour.** Palette swatch `#4CAF6E` is a bright green; every
   rendered view shows an olive green (≈`#688E52`). **Gate C r2 (user
   decision):** model uses `#688E52`, soft matte.
3. **Scarf knot / tails.** The brief lists "scarf knot" and "scarf tails", but
   no view shows a knot or loose tails: the scarf is a bunched neck roll with a
   bandana triangle on the chest. The model follows the reference: the front
   triangle is the "tail", the knot is implied under the roll.
4. **Backpack position.** In the main illustration the pack appears on the
   character's right flank; the back view shows it centred (slightly towards
   the left). Treated as perspective → centred on the back.
5. **Eyebrows.** Neutral reference has no brows; Sad/Proud samples show small
   brows. Brows are modelled but hidden in neutral.
6. **3/4 angle.** Estimated at ~38°; the reference is not a calibrated camera.
