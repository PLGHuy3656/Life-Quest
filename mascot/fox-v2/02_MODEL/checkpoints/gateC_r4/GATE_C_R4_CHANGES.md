# Gate C — Correction r4 (final shape polish)

Date: 2026-11-16 · Status: **polished, awaiting visual approval** · Gate D rigging NOT started.

Shape-only polish on top of r3. It reuses the same modular source and build
pipeline: no full rebuild, no camera-specific geometry, no 2D cards. Colours,
scarf, backpack, proportions, expressions design and lighting are unchanged.
Earlier checkpoints `gateC_r1` … `gateC_r3` are kept; this round is frozen in
`02_MODEL/checkpoints/gateC_r4/`.

## 1. Changes

### 1. Head silhouette (`build_head`): softer, rounder lower edge
* r3 lower half: hand-placed rows that reached full width by z ≈ 0.50, so the head had a "shoulder" there and read flat at the bottom in the front view.
* r4 lower half: generated as an exact elliptical profile (superellipse exponent 1.75) from a slightly deeper chin pole (z 0.389, was 0.400) up to the equator at z 0.575. The width now grows gradually, so the chin curves in instead of ending in a straight edge.
* The upper head (crown, ear area, cheek-fluff ridge) is unchanged.

### 2 + 3. Cheeks and muzzle integration (`build_head` deform)
* r3 used three separate bumps: two cheek bumps (σx 0.095) and a central muzzle bump (0.016 m). Together they read as a muzzle stuck onto the face.
* r4 uses **one continuous lower-face swell** (σx 0.215, σz 0.068, 0.021 m) spanning both cheeks and the muzzle, plus a very soft sideways cheek puff (0.007 m). The muzzle is only a gentle crest inside that volume (0.007 m, was 0.016).
* The cream boundary still follows the measured arch exactly. Its underside cut was re-fitted to the new chin (z 0.405).
* Eyes, nose, mouth and blush are re-projected automatically onto the new surface. Validation reports 1.5–8 mm clearance with no clipping.

### 4. Ears (`build_ears`): thickness, curvature, upper silhouette
* **Thicker upper ear:** the back of the ear now fills out with height, from 0.75× to 1.05× of the depth, and the tip depth went from 0.047 to 0.056 m. The far ear in the 3/4 view and the side view no longer read as a thin blade.
* **Curvature:** the ear arcs 0.032 m backward toward the tip, matching the soft backward sweep in the reference side and 3/4 views. The cream lining follows the same curve.
* The broad upper silhouette (r3), round dome tip, U-bowl cup and orientation are unchanged.
* The ear tip now sits 6 mm lower (total height 0.990 m vs 0.996 m) because of the backward arc. That is within tolerance; the reference measures 0.997 m.

### 5. Tail curvature (`build_tail`): orientation C kept
* Spine went from 7 to 8 points. The tail sweeps out more gradually and the tip curls softly up and back in over the body, giving a fluffy "comma" shape.
* First attempt (r4a/b) curled too tightly and pinched the cream tip (a visible crease in the 3/4 and side views). Final: gentler last segment plus a longer rounded end cap (34 % of the length, was 30 %). The tip is smooth from every view.
* Same orientation (character's right), same attachment point, same extent (x −0.403 … +0.013 m, top z 0.483).

### 6. Preserved
Orange `#FF8D2E` (renders `#FF9744`, unchanged across views: front/3/4 `#FF9744`, side `#FF9042`, back `#FF9643`), cream, red scarf, olive backpack, all proportions, all seven expressions.

### 7. Polygon count
Base cage 55,345 triangles (r3: 55,341). The +4 comes from the exact colour-boundary cut crossing slightly different edges on the reshaped surfaces. Segment and ring counts are unchanged (the extra tail spine point only reshapes the curve; ring count stays 64), so effectively only vertex positions moved.

## 2. Checks

### Technical: 35/35 pass
See `08_VALIDATION/validation_results.json`.

### Silhouette (coarse guide only)
| View | r3 | r4 |
|---|---|---|
| Front | 0.78 | 0.76 |
| 3/4 | 0.67 | 0.66 |
| Side | 0.84 | 0.83 |
| Back | 0.86 | 0.85 |

These r4 changes are interior form and curvature polish (lower-face volume, cheek transitions, ear thickness), which a silhouette barely captures. The −0.01 to −0.02 changes come from the slightly deeper chin and the lower ear tips, and are within measurement noise. **IoU is not evidence of approval in either direction.**

### Visual review against the reference and r3
`01_DESIGN/comparisons/fox_r3_vs_r4.png` uses identical camera and lighting.

| Area | r4 vs r3 | vs reference |
|---|---|---|
| Head lower edge | ✅ visibly rounder chin; no straight lower edge in the front view | closer to the soft mochi head |
| Cheeks → muzzle | ✅ one smooth volume; the 3/4 cheek-to-muzzle transition is soft | ✅ muzzle no longer reads as a separate object |
| Ears, 3/4 and side | ✅ thicker, gently curved back; far ear not blade-like | ⚠️ the reference side ear is still a little broader |
| Tail | ✅ smoother comma curve, round cream tip, no crease | ✅ orientation C matches hero / 3/4 / back |
| Colours, scarf, backpack | unchanged | ✅ |
| Expressions | unchanged (`fox_face_controls_r4.png`) | ✅ |
| Overall identity | ✅ same character, softer | ✅ |

Remaining minor items, carried over from r3 and not part of this brief:
* hair tuft projects slightly forward in the side view;
* the tail overlaps the backpack's lower outer corner from the back.

**Visual approval is not claimed.**

## 3. Outputs

| Item | Path |
|---|---|
| Master | `02_MODEL/fox_master.blend` |
| Modules (rebuilt) | `02_MODEL/modules/*.blend` (content changes: `head`, `face` (re-projected decals), `ears`, `tail`) |
| Turnaround | `01_DESIGN/turnaround/fox_{front,34,side,back}.png` |
| Reference comparison | `01_DESIGN/comparisons/fox_reference_vs_model_r4.png` |
| Expressions | `01_DESIGN/comparisons/fox_face_controls_r4.png` |
| r3 vs r4 | `01_DESIGN/comparisons/fox_r3_vs_r4.png` |
| Metrics / validation | `08_VALIDATION/silhouette_metrics.json`, `validation_results.json`, `validation_report.md` |
| Checkpoint | `02_MODEL/checkpoints/gateC_r4/` |
| Archive | `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2_GateC_r4.zip` |

The un-suffixed r3 comparison images (`fox_reference_vs_model.png`, `fox_face_controls_test.png`) were removed from `01_DESIGN/comparisons/`. They are byte-identical copies of the files kept in `checkpoints/gateC_r3/renders/` (logged in `09_DOCS/CLEANUP_LOG.md`).

STOP: waiting for Gate C visual approval. Gate D has not been started.
