# Gate C — Correction r3 (final decisions)

Date: 2026-11-16 · Status: **corrected, awaiting visual approval** · Gate D rigging NOT started.

Applies the user's final Gate C decisions on top of r2, with the same modular
source and build pipeline. Checkpoints `gateC_r1` and `gateC_r2` are kept
untouched; the result of this round is frozen in `02_MODEL/checkpoints/gateC_r3/`.

## 1. Changes

### Tail — option C (`build_tail`)
* The tail curls toward the character's **RIGHT (−X)**: the r1 orientation, matching the hero illustration, the 3/4 view and the back view.
* **One** mesh and **one** attachment point at the rump, rendered identically by every camera. There are no per-camera variants.
* The r2 shape refinements are kept: slim base where the tail passes behind the backpack, full fluffy outer half (radius peaks late), zig-zag cream tip, nothing below the ground.
* The mid-section sits outboard, so the backpack stays visible from the back with flap and buckle clear.
* Extent fitted to the reference back view. The intermediate build r3b reached x −0.43 m and touched the 3/4 frame edge; the final build reaches x −0.386 m (target ≈ −0.37). Max radius is 0.152 m (r2: 0.165).
* The front turnaround in the reference mirrors this tail. That remains a documented reference inconsistency, so in the front comparison the tail appears on the opposite side by design.

### Ears (`build_ears`)
* The upper-ear silhouette is wider in the front view. The taper exponent changed from 0.85 to 0.68, so the ear stays broad through its upper half, and the dome-tip radius grew from 0.050 to 0.058 m.
* The r2 U-bowl cup, rounded rim lip, round dome tip, cream lining, thickness and orientation are all unchanged.

### Orange material (`materials.json`)
* Base colour changed from `#FF8A3D` to **`#FF8D2E`**: higher saturation, hue nudged toward the reference. Kept soft matte: roughness 0.58, sheen lowered from 0.10 to 0.05 because sheen was washing the colour out.
* **The lighting and exposure were not changed.** The new base was chosen by rendering candidates under the identical r2 review lighting and measuring the same forehead patch:

| Base hex | Rendered | Hue | Sat |
|---|---|---|---|
| `#FF8A3D` (r2) | `#FF944F` | 24° | 0.69 |
| `#FF8330` | `#FF8E46` | 24° | 0.73 |
| `#FF7F2A` | `#FF8A42` | 23° | 0.74 |
| **`#FF8D2E` (r3)** | **`#FF9744`** | **27°** | **0.73** |
| `#FF9032` | `#FF9A47` | 27° | 0.72 |
| Reference | `#FE9942` | 28° | 0.74 |

* Consistency across views (same body area): front `#FF9744`, 3/4 `#FF9744`, side `#FF9042`, back `#FF9643`.
* The brief palette value `#FF8A3D` stays recorded as `brief_hex`. The tuned value is `model_hex`, with the reasoning stored in `r3_note`.

### Unchanged in r3
Head, face, expressions (Sad and Proud from r2), body, limbs, scarf, backpack geometry and colour, and the lighting rig. All modules were rebuilt by the pipeline. The `.blend` hashes change on every save, but only the tail, ears and the orange material differ in content.

## 2. Checks

### Technical: 35/35 pass
`08_VALIDATION/validation_results.json`. Total height 0.996 m, minimum z 0.0001 m, face decals 1.5–8 mm off the head (no clipping), all materials valid, transforms clean, eye and brow shape keys and all expression meshes present.

### Silhouette (coarse guide only, not an approval metric)
| View | r1 | r2 | **r3** | Note |
|---|---|---|---|---|
| Front | 0.77 | 0.88 | 0.78 | expected drop: the tail now follows the hero/back views, not the front turnaround |
| 3/4 | 0.68 | 0.70 | 0.67 | tail now on the correct side; the remaining mismatch is mostly framing and angle (reference ≈30–38°) |
| Side | 0.86 | 0.82 | 0.84 | |
| Back | 0.84 | 0.77 | **0.86** | tail side now matches; backpack largely visible |

### Visual review (anatomy, proportions, expression, identity)
| Area | Verdict | Notes |
|---|---|---|
| Tail — hero / 3/4 / back | ✅ | big fluffy tail with cream tip on the correct side; size close to the reference |
| Tail — front | ⚠️ by design | mirrored against the front turnaround (reference inconsistency) |
| Backpack visibility from the back | ✅ improved | flap and buckle clear; the tail overlaps the pack's lower outer corner. The reference shows the pack fully clear, with the tail beside it |
| Ears — front | ✅ | broader upper ear, round tips, thick orange rim, large cream inner |
| Ears — side | ⚠️ minor | still reads slimmer than the reference's broad, curved side-view ear |
| Orange colour | ✅ | matches the reference hue and saturation; consistent across all four views |
| Head, face, expressions | ✅ | unchanged from r2 (rounder head, Sad and Proud reworked) |
| Hair tuft — side | ⚠️ minor | projects slightly further forward than in the reference side view |
| Overall identity | ✅ | the same LifeQuest fox: cute, rounded, minimal, no redesign |

**Visual approval is not claimed.** Approval is your call. The three ⚠️ minor items can be refined in another Gate C round if you want.

## 3. Outputs

| Item | Path |
|---|---|
| Master | `02_MODEL/fox_master.blend` |
| Modules (rebuilt) | `02_MODEL/modules/*.blend` (content changes: `tail`, `ears`, plus the orange material in `head`, `body`, `arms_legs`) |
| Turnaround | `01_DESIGN/turnaround/fox_{front,34,side,back}.png` |
| Expressions | `01_DESIGN/comparisons/fox_face_controls_test.png` |
| Comparison | `01_DESIGN/comparisons/fox_reference_vs_model.png` |
| Metrics / validation | `08_VALIDATION/silhouette_metrics.json`, `validation_results.json`, `validation_report.md` |
| Checkpoint | `02_MODEL/checkpoints/gateC_r3/` (r1 and r2 kept) |

STOP: waiting for Gate C visual approval. Gate D (rig) has not been started.

> Archive note (Gate C r4): the renders of this round are kept in `02_MODEL/checkpoints/gateC_r3/renders/`; `01_DESIGN/` now holds the r4 outputs.
