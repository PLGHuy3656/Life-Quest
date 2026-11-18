# Gate C — Visual Correction r2

Date: 2026-11-16 · Status: **corrected, awaiting visual approval** · Rigging/animation NOT started.

The Gate A/B structure was kept: same modular source, same build pipeline,
same names and collections. Only the affected module functions, data values
and the review renderer changed. No rebuild from scratch.

## 0. Backup checkpoint

`02_MODEL/checkpoints/gateC_r1/` holds the unapproved r1 model unchanged:
8 module `.blend` files, `fox_master.blend` (SHA-256 `d5e49a3b9498beb6…`), its
renders, its JSON data and its build scripts. See `CHECKPOINT.md` inside.

## 1. What changed

### P0 — Head and face (`build_head`)
| r1 | r2 |
|---|---|
| Flat bottom: chin pole at z 0.405 with a sudden 0.13 m-wide first ring → wide slab-like lower face | Chin tapers in a smooth arc (0.400 → 0.085 → 0.150 → 0.205 …): rounder, softer silhouette |
| Face front flattened (front scale 0.96) | Full round front (1.0) |
| Sharp cheek-fluff "wing" (amp 0.034, σ 0.032, side⁵) | Softer, broader ridge (amp 0.024, σ 0.045, side³) |
| Single muzzle bulge | Two rounded lower-cheek volumes either side of the muzzle + a smaller central muzzle → the cream area reads as soft mochi cheeks, not a flat panel |
| Cream boundary cut at fixed underside z 0.419 | Re-fitted to the new chin (0.414); same measured arch (top z 0.607, half-width 0.284) |

Eyes, nose, mouth and blush keep their measured positions. They are re-projected onto the new surface automatically, and validation confirms 1.5–8 mm clearance with no clipping.

### P0 — Ears (`build_ears`)
* Shape: the triangular taper now ends in a **round dome tip**. The last 16 % of the ear height is a circular cap with a 0.05 m radius. In r1 the taper ended in a point.
* **Cupped U-bowl** cross-section. The outer side walls curve and bulge slightly. A rounded rim lip forms the outer 22 % of each side, which gives the thick orange outline seen in the reference. The centre is recessed.
* **Inner ear** is now a cream lining shell that follows the inside of the bowl. It covers 74 % of the width and 7–94 % of the height. In r1 it was a flat strip.
* Thickness: ear depth 0.125 m at the base, 0.045 m at the tip. In r1 it was 0.08 m tapering to a point.
* Orientation relaxed: outward tilt 9°, yaw 8°, lean back 12°. r1 was 16° / 16° / 13°.
* Base tucked into the head (z 0.655, narrower buried base), so no corners poke out of the skull.
* Checked in profile and from the back (see turnaround). The ear reads as a thick cupped cone from the side and a rounded triangle from the back.

### P0 — Tail (`build_tail`)
* **One physical tail with one attachment**, rendered identically from every camera. Nothing is mirrored per view.
* The base runs back from the rump, slim where it passes behind the backpack. The radius profile peaks late (t^1.35), so the volume sits in the outer half.
* The full, fluffy, cream-tipped end curls up towards the character's **left (+X)**. It now shows clearly on screen-right in the front view, as in the front reference.
* Back view: the backpack is now mostly visible, with buckle and flap clear. The tail overlaps only the lower corner of the pack.
* Side view: tail length reduced from y 0.55 to 0.53 m. In r1 it stuck out too far back.
* The tail was lifted 1.6 cm, because an intermediate r2 build dipped below the ground. A new validation check guards against this.

### P1 — Backpack
Base colour `#4CAF6E` changed to **`#688E52`**. Soft matte finish: roughness 0.82, light sheen 0.15. The rendered back view samples at `#6C8550`.

### P1 — Limbs
* Body now has soft **shoulder pads** where the arms emerge. The arms start deeper inside the torso and are thicker at the shoulder (r 0.062 tapering to 0.046), so they grow out of the body instead of looking stuck on.
* Legs gained a fuller thigh (r up to 0.080) that tucks into slightly wider hips.
* Paws and feet stay simple rounded shapes, with no fingers or toes.

### P1 — Facial expressions
| Expression | r1 | r2 |
|---|---|---|
| **Sad** | slightly smaller eye + small "o" mouth + flat brows | eye shape key `Sad`: upper lid slopes down to the **outer** corner, giving a worried "puppy" eye. Brow key `Sad`: inner ends lifted steeply. New `FOX_Mouth_Frown` (small inverted arc) |
| **Proud** | Happy's closed ^ ^ eyes + neutral mouth + flat brows | eye key `Proud`: calm, level half-lid with the round lower eye kept. Brow key `Proud`: raised soft arch. New `FOX_Mouth_Smile`: wide ω with lifted corners. Reads content and confident, not just happy with eyes closed |

New controls: eye keys `Basis, Blink, Wide, Sad, HalfLid, Proud`; brow keys `Basis, Sad, Proud`; mouths `Neutral, Open(+Tongue), SmallO, Frown, Smile`.

### P1 — Lighting (review renders)
* Five large soft area lights with stronger fill (key 70 W at 3.5 m size, fill 55 W at 4 m, low bounce 18 W, rim 40 W, top 22 W).
* **The whole light rig rotates with the camera** for each turnaround view, so front, 3/4, side and back get identical key, fill and rim.
* Measured orange on the same body area: front `#FF9551`, side `#FF8F4E`, back `#FF934F`. That is consistent within about 3 % between views. In r1 the side and back renders came out visibly darker and browner.

## 2. Silhouette metrics (coarse guide only)

| View | r1 IoU | r2 IoU |
|---|---|---|
| Front | 0.77 | **0.88** |
| 3/4 | 0.68 | 0.70 |
| Side | 0.86 | 0.82 |
| Back | 0.84 | 0.77 |

Side and back IoU dropped because the tail moved to the side the front
reference shows, which the back reference contradicts. IoU is not an approval criterion.

## 3. Visual review — anatomy, proportions, expression, identity

| Area | Verdict | Notes |
|---|---|---|
| Head silhouette | ✅ improved | round, soft dome; lower face no longer a flat slab; front overlay matches closely |
| Face boundary / cheeks | ✅ | cream arch sits right under the eyes as in the reference; lower cheeks have volume |
| Eyes, nose, mouth, blush | ✅ unchanged design | |
| Ears | ✅ much closer / ⚠️ minor | round tips, cupped, thick orange rim, large cream inner as in the reference. The reference ears still flare slightly wider at the top in the front view |
| Body / limbs | ✅ | shoulders and hips read as one chibi volume |
| Tail — front | ✅ | large tail with cream tip visible on screen-right, as in the reference |
| Tail — 3/4 | ⚠️ **not matched** | only a sliver of tail shows at the lower left; the reference shows a big tail there. See §4 |
| Tail — back | ⚠️ | pack mostly visible (improved), but the tail is on screen-left whereas the reference back view has it on screen-right |
| Backpack | ✅ | olive matte, buckle visible from the back |
| Colours across views | ✅ | consistent; orange slightly less saturated than the reference's lit orange (`#FE9737`) |
| Expressions | ✅ | Sad clearly worried; Proud confident and content; the other five unchanged and working |
| Overall identity | ✅ | the same LifeQuest fox, no redesign |

**Not claimed as approved.** One identity item remains open: the tail in 3/4.

## 4. The tail contradiction (needs your call)

Measured from the reference sheet:
* **Front view:** the tail mass sits at x ≈ **+0.17 … +0.40 m**, on the character's left.
* **3/4 view (~30–38°):** the tail sticks out far to screen-left (≈ −0.43 m). With any physically consistent tail, that requires the tail to sit behind or to the character's **right**.
* **Back view:** tail on the character's **right**.
* **Main illustration:** compatible with the 3/4 and back views.

No single rigid tail can satisfy all four views. r2 prioritises the front view, as asked, while keeping one consistent attachment. Options:

* **A (current r2):** curls to the left. Front ✅, 3/4 ⚠️, back ✗.
* **B:** a straight-back tail that curls only slightly left. 3/4 ✅ and front partial, but the base sits right behind the backpack (heavy back occlusion). This was tried as intermediate build r2b.
* **C:** curls to the right (r1-style). Main illustration, 3/4 and back ✅, front ✗.
* **D:** keep A as the rest pose and let the Gate E idle/turn animation swing the tail. That swing becomes part of the character's motion design.

## 5. Re-run evidence

| Step | Output |
|---|---|
| Rebuild all modules + master | `02_MODEL/modules/*.blend`, `02_MODEL/fox_master.blend` |
| Turnaround (724 px, 96 spp) | `01_DESIGN/turnaround/fox_{front,34,side,back}.png` |
| 7 expressions | `01_DESIGN/comparisons/fox_face_controls_test.png` |
| Comparison sheet | `01_DESIGN/comparisons/fox_reference_vs_model.png` |
| Silhouette metrics | `08_VALIDATION/silhouette_metrics.json` |
| Technical validation | **35/35 pass** → `08_VALIDATION/validation_results.json` (new checks: brow keys, Frown/Smile meshes, nothing below ground) |

Gates D (rig), E (animation) and F (GLB/web) have **not** been started.

> Archive note (Gate C r4): the renders of this round are kept in `02_MODEL/checkpoints/gateC_r2/renders/`; `01_DESIGN/` now holds the r4 outputs.
