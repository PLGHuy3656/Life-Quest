# LifeQuest Fox V2 — Gate D1 Deformation Test Report

Date: 2026-11-16 · Rig: `03_RIG/fox_rig_prototype.blend` · Status: **prototype, awaiting visual approval**.
`02_MODEL/fox_master.blend` is untouched: SHA-256 `16ce1a04…`, identical to `checkpoints/gateC_r4`.

## 1. Rig summary

29 bones (22 deforming). Full list in `skeleton_spec.json`; sockets in `attachment_points.json`.

| Group | Bones | Method |
|---|---|---|
| Root / body | `ROOT` → `HIPS` → `SPINE` | skinned; squash & stretch = `HIPS` scale |
| Head / neck | `NECK` → `HEAD` | head + tuft + whole face **rigidly** bone-parented to `HEAD`. `NECK` ignores body scale, so the head never squashes |
| Ears | `EAR_L_01/02`, `EAR_R_01/02` | skinned; pivot where the ear leaves the skull; wide blend at mid-ear for a smooth tip bend |
| Arms | `ARM_L/R` → `PAW_L/R` | skinned; shoulder pivot on the body surface; 4 cm shoulder blend into `SPINE` |
| Legs | `LEG_L/R` → `FOOT_L/R` | skinned; parented to `ROOT` (planted), thigh top blends into `HIPS` |
| Tail | `TAIL_01` … `TAIL_04` | skinned along the r4 spine; chain starts at the visible root on the body surface |
| Scarf | `SCARF_FLAP` (+ `NECK`/`SPINE`) | roll 75 % `NECK` / 25 % `SPINE`; bandana and emblem on `SCARF_FLAP`, with the top edge blending into the roll weights |
| Backpack | — | whole hierarchy rigidly bone-parented to `SPINE` (detachable) |
| Face | `FACE` (non-deforming) | 10 custom properties → 42 drivers: eye shape keys (Blink, Wide, Sad, HalfLid, Proud), brow shape keys (Sad, Proud), visibility of the eye/mouth/brow swap meshes |
| Sockets | `ATT_HAT`, `ATT_GLASSES`, `ATT_SCARF`, `ATT_BACKPACK`, `ATT_HAND_L/R` | non-deforming bones for future cosmetics |

Technical rig validation: **20/20 pass** (`rig_validation_results.json`). Covers hierarchy, inherit-scale settings, modifier order, every vertex weighted and normalised, driver validity, test action and markers.

## 2. Test sequences

Action `FOX_DeformationTest`, 372 frames at 24 fps, with a timeline marker per test. Poses are deliberately strong. Every pose was rendered from 3 cameras in `renders/fox_rig_contact_sheet.png`, and the motion is in `renders/fox_rig_preview.mp4` (`.gif` copy).

| Test | Frames | Key poses |
|---|---|---|
| T1 Head | 1–72 | turn ±40° (HEAD 55 % / NECK 45 %), look up 22°, look down 18° |
| T2 Ears | 73–120 | L ear out 30° + tip 25°; R ear forward 22° + tip 15° while L ear goes back 20° |
| T3 Tail | 121–180 | chain sway +20° toward the body / −28° away, with follow-through lag |
| T4 Arms | 181–252 | both arms up 60°; L arm 130° + paw wave ±22° |
| T5 Body | 253–300 | squash 0.92 / 1.04, stretch 1.07 / 0.97 (HIPS) with scarf-flap lag |
| T6 Face | 301–372 | blink, happy, proud, sad, surprised, sleepy |

## 3. Numeric results

Source: `deformation_metrics.json`, produced by `08_VALIDATION/scripts/rig_check.py`. All values are relative to the rest pose. "p99 stretch" is the 99th-percentile edge-length change; the max value is dominated by tiny pole edges.

| Pose | Worst p99 stretch | Face drift | Scarf → body | Tail → body | Backpack gap Δ | Root exposure* |
|---|---|---|---|---|---|---|
| Head +40° | scarf flap 0.37 | 0.001 mm | 45 verts, 7.5 mm | 0 | +0.8 mm | arm 21 |
| Head −40° | scarf flap 0.34 | 0.003 mm | 47 verts, 7.1 mm | 0 | +0.8 mm | arm 21 |
| Look up 22° | body 0.31 | 0.003 mm | 44 verts, 6.4 mm | 0 | +0.8 mm | 0 |
| Look down 18° | body 0.25 | 0.003 mm | 4 verts, 2.6 mm | 0 | −0.3 mm | 0 |
| L ear out | ear 0.90 | 0 | 0 | 0 | 0 | ear 144 |
| R ear fwd | ear 0.56 | 0 | 0 | 0 | 0 | ear 34 |
| Tail +20° | tail 0.16 | 0 | 0 | 12 verts, 6.3 mm | 0 | 0 |
| Tail −28° | tail 0.29 | 0 | 0 | 2 verts, 2.6 mm | 0 | tail 10 |
| Arms up 60° | arm 0.67 | 0 | 0 | 0 | 0 | arm 167 each |
| Wave 130° | arm 0.73 | 0 | 0 | 0 | 0 | arm 199 |
| Squash | leg 0.13 | 0 | 38 verts, 4.3 mm | 0 | +1.4 / −0.6 mm | leg 12 |
| Stretch | leg 0.11 | 0 | flap 5 verts, 2.4 mm | 0 | +0.4 / −1.1 mm | 0 |
| Expressions | 0 | 0 (eye clearance ≥ 2.0 mm) | 0 | 0 | 0 | 0 |

\* Root exposure = vertices of a part's buried root (inside the head or body at rest) that come more than 2 mm out of their host. The part's own surface stays closed, so this means more of the root becomes visible, **not** a hole. Visual check: no gap at the ear bases or shoulders in any render.

Also measured:
* Chain smoothness: tail bone-to-bone angles change by at most 1.2° from rest (no kink). Ear tip bends of 15–23° are distributed over a 15 cm blend.
* Scarf → head: when looking up or down, the head bottom swallows part of the roll (up to 37 mm) and the flap top (26 mm). This is hidden inside the head and reads as the scarf tucked under the chin. Visible penetration is the scarf going *into the body*, which the table above tracks.

## 4. Visual checks (critical list)

| Check | Result |
|---|---|
| Large head must not distort | ✅ rigid on `HEAD`; squash/stretch never reaches it (`NECK` inherit scale = none) |
| Muzzle and cream face boundary stay attached | ✅ part of the rigid head; decal drift ≤ 0.003 mm |
| Ear tips bend smoothly | ✅ outward and back bends are smooth. ⚠️ The forward tip bend shows a soft fold at the rim when seen from behind. Acceptable at 15°, larger angles need a third ear bone or a corrective shape |
| Tail must not kink or intersect the body | ✅ no kink. ⚠️ At +20° toward the body, 12 tail vertices sink up to 6.3 mm into the rump side. Recommendation: limit that direction to about 15° or add a corrective shape in Gate E |
| Scarf must not penetrate the neck | ⚠️ minor. The inner side of the roll dips up to 7.5 mm into the body during ±40° head turns and up to 4.3 mm during squash. It is on the neck side under the chin, not visible in the contact sheet. Fix options: give the roll a small inner offset, or drive the roll with a corrective shape |
| Backpack stays attached during torso movement | ✅ rigid on `SPINE`; gap change ≤ 1.4 mm |
| No unexpected stretching or detached geometry | ✅ no detached pieces. Highest local stretch is at the shoulders when the arm goes up 130° (p99 0.73, smooth in renders) and at the ear base at 30° tilt |

## 5. Known limitations (prototype scope)

* No IK, no foot roll and no control shapes or widgets yet. Bones are posed directly (FK). Planned for Gate E when the core animations need them.
* The expression swap meshes are switched by visibility drivers. That works in Blender, but glTF does not export visibility animation. Gate F must convert these swaps to scale-to-zero or morph targets.
* Head pitch beyond about ±25° will push the chin visibly into the scarf flap. Animations should stay inside that range.
* `HIPS` squash moves the body away from the planted legs by a few millimetres (thigh blend absorbs it). Large hops need a dedicated `BODY` control in Gate E.
* Renders use Cycles at low samples for speed (EEVEE is software-only in this build environment).

STOP: awaiting visual approval of the rig prototype. Gate E (animation library) and Gate F (GLB/web) have not been started.
