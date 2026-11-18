# LifeQuest Fox V2 — Gate D1.1 Deformation Test Report

Status: **D1.1 corrections done, waiting for visual and runtime approval.** Gate E (production animations) and skins have **not** started.

| Item | Value |
|---|---|
| Rig file | `03_RIG/fox_rig_d1_1.blend` (built from `02_MODEL/fox_master.blend`; the master is unchanged, SHA-256 `16ce1a046eb3842b…` = checkpoint `gateC_r4`) |
| Build scripts | `08_VALIDATION/scripts/rig_d1_1.py` → `rig_tests_d1_1.py` |
| Metrics | `03_RIG/deformation_metrics_d1_1.json` (D1 baseline: `deformation_metrics.json`) |
| Renders | `03_RIG/renders_d1_1/fox_rig_contact_sheet.png`, `fox_rig_preview.mp4` / `.gif` |
| Skeleton | 28 bones (D1 had 29: the `FACE` bone was removed because the face no longer uses bone or visibility drivers). No new deform bones added. |

## 1. Corrections (Part A)

| Problem in D1 | Cause | D1.1 fix | Result |
|---|---|---|---|
| Scarf roll pushed into the chest/neck on head turn and squash | The roll was rigidly bound to NECK, so the lower edge swung through the body | The roll now uses the same smooth body chain as the torso, HIPS→SPINE→NECK by height, z 0/.24/.365/.50 with blends of 35–50 mm. The flap and emblem blend from `SCARF_FLAP` to the body chain at the knot (smoothstep z .37–.405) | Scarf→body penetration: **0 verts in every pose** (D1: 45 verts / 7.5 mm at a +40° turn, 38 verts / 4.3 mm at squash) |
| Tail pushed into the rump during sway | The sway axis tilted toward the body, and the total angle (~48–58°) was too large | Sway now turns about the view axis (Y) and the total is limited to ~30°, spread 35/22/22/22 % down the chain | Tail→body: **0 verts** at ±30° (D1: 12 verts / 6.3 mm) |
| Rim fold on the "forward" ear bend | The D1 test pose rotated the wrong way (−X), so the ear actually bent **backward** and folded the rim. Ear weights also had a hard edge at HEAD→EAR_01 | The sign is corrected (+X = tip toward the face). The ear chain is HEAD→EAR_01→EAR_02 with 30 / 100 mm smooth blends. Test pose: R ear fwd 28° + tip 10° | No fold in front, 3/4 or back views (sheet T2). The Ear_R p99 deviation of 0.63 is even bending spread along the ear, not a crease |
| Shoulder stretch at a 130° wave | The arm root blend was narrow | Arm root blends were widened to 50 / 35 mm | Arm_L p99 **0.54** (D1 0.61). No visible pinching or gap at the shoulder |

Method: only weights and test-pose angles were changed, plus removing the drivers and `FACE`. **No corrective shape keys were needed** on body parts, and the simple chibi rig is unchanged.

## 2. Metrics, D1 → D1.1

| Pose | Scarf→body (verts / mm) | Tail→body | Worst stretch p99 |
|---|---|---|---|
| Head turn +40° | 45 / 7.5 → **0** | 0 → 0 | Flap 0.37 → 0.50 (spread out, not visible) |
| Head turn −40° | 47 / 7.1 → **0** | 0 → 0 | Flap 0.34 → 0.49 |
| Look up 22° | 44 / 6.4 → **0** | 0 → 0 | Body 0.31 → Roll 0.37 |
| Look down 18° | 4 / 2.6 → **0** | 0 → 0 | Body 0.25 → Roll 0.31 |
| Ear out L 30° + tip 25° | 0 | 0 | Ear_L 0.90 → 0.91 (even bend) |
| Ear fwd R | 0 | 0 | Ear_R 0.56 (bent backward in D1) → 0.63 (correct direction) |
| Tail sway + | 0 | 12 / 6.3 → **0** | Tail 0.16 → 0.21 |
| Tail sway − | 0 | 2 / 2.6 → **0** | Tail 0.29 → 0.41 |
| Both arms 60° | 0 | 0 | Arm_R 0.67 → 0.65 |
| Wave 130° | 0 | 0 | Arm_L 0.61 → **0.54** |
| Wave, paw −22° | 0 | 0 | Arm_L 0.73 → 0.76 |
| Squash 0.92/1.04 | 38 / 4.3 → **0** | 0 | Leg 0.13 |
| Stretch 1.07/0.97 | 0 (flap 5 / 2.4) | 0 | Leg 0.11 |
| 6 expressions | — | — | 0 (morph targets only change the face parts) |

How to read the numbers:
- "max depth 1.0 mm" means rest contact (the scarf sits on the body by design). Only new penetration beyond rest is counted.
- Face decal drift is ≤ 0.003 mm in every pose. Eye clearance from the head is ≥ 2.0 mm, and 4.1 mm for happy/sleepy because those use a different eye-shape morph.

## 3. Remaining minor items (not visible in renders, left for Gate D2/E)

1. **Scarf flap at stretch 1.07:** 5 verts / 2.4 mm into the body, hidden behind the flap itself. This can be handled with a small corrective shape if production uses a stretch above 1.05.
2. **Scarf roll inside the head on look up/down:** the lower edge of the head covers the roll (458 / 321 verts). These vertices are **hidden** under the head, as in D1, and are not visible on the sheet.
3. **Roll twist on head turn:** p99 0.39, spread evenly, with no visible creasing.
4. **Arm root "detached" counts (11–21 verts) during head turns:** these are measurement artefacts. The arms do not move in those poses; the shoulder root verts sit inside the body, so nothing shows.
5. There is no IK, by design for the chibi prototype. Add it in Gate D2/E if foot planting is needed.

## 4. Face system

Visibility drivers (42 drivers) were removed and replaced with **morph targets (shape keys)** that export to glTF. See `03_RIG/face_morph_map.json` and `08_VALIDATION/rig_glb_compatibility_report.md`. In Blender, all 7 expressions (neutral, blink, happy, proud, sad, surprised, sleepy) look the same as in D1 (sheet T6).

## 5. Actions in the file

- `FOX_DeformationTest_D1_1` (f1–372, markers T1–T6): the test poses above.
- Engine prototype actions: `fox_idle_test`, `fox_blink_test`, `fox_head_turn_test`, `fox_tail_sway_test`, plus the matching shape-key actions. They have fake users and are not assigned in the file; they are exported to the GLB.

## 6. How to reproduce

```
python3 08_VALIDATION/scripts/rig_d1_1.py
python3 08_VALIDATION/scripts/rig_tests_d1_1.py
FOX_TESTS=rig_tests_d1_1 FOX_METRICS=deformation_metrics_d1_1.json python3 08_VALIDATION/scripts/rig_check.py
FOX_TESTS=rig_tests_d1_1 FOX_RENDER_DIR=renders_d1_1 python3 08_VALIDATION/scripts/rig_render.py sheet
FOX_TESTS=rig_tests_d1_1 FOX_RENDER_DIR=renders_d1_1 python3 08_VALIDATION/scripts/rig_render.py preview
```
