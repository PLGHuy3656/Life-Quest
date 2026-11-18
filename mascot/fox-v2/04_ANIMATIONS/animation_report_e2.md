# LifeQuest Fox V2 — Gate E2 Character Motion Polish · Animation QA Report

**Status: Gate E2 is done and waiting for visual approval.** The historical Rive library, cosmetics and advanced virtual-pet features have **not** been started.

| Item | Value |
|---|---|
| Animation file | `04_ANIMATIONS/fox_anim_e2.blend` (`2fa211a2…`), built from the approved `03_RIG/fox_rig_d1_1.blend` by `08_VALIDATION/scripts/anim_e2.py` |
| GLB | `06_EXPORTS/glb/fox_v2_anim_e2.glb` (`e884d675…`), ~73.8k tris, 28 joints, 12 materials, 7 clips |
| Viewer | `07_WEB_PREVIEW/fox_interactive_e2.html` (`3ec68b1e…`), with `?size=small\|medium\|large` |
| Clip contract | `04_ANIMATIONS/anim_spec_e2.json`. **Same 7 runtime names**; head_control and face_control are unchanged from E1 |
| Idle variation (runtime) | `04_ANIMATIONS/idle_variation_e2.json` |
| Metrics | `04_ANIMATIONS/anim_metrics_e2.json` (E1 baseline: `anim_metrics_e1.json`) |
| Renders | `04_ANIMATIONS/renders_e2/`: key frames + 11 previews (walk and run from **front, 3/4 and side**) |
| Before / after | `04_ANIMATIONS/renders_compare/`: E1 \| E2 side by side, per clip and as a single video |
| Approved E1 | **Unchanged**: `fox_anim_e1.blend` `739b544d…`, `fox_v2_anim_e1.glb` `eabde5b2…`, `fox_interactive_e1.html` `1cf7c065…` |
| Contracts | The skeleton (28 bones), the morph contract (14 face meshes, same names) and the materials are unchanged. The browser re-checks all of them |

## 1. What changed, clip by clip

| Clip | E1 | E2 |
|---|---|---|
| `idle` | 5 s, regular rhythm | **6 s with an uneven inner rhythm**: 3 breaths (the shoulders lag the chest), a slow weight shift, a curious **head tilt** with a small settle afterwards, a left-ear twitch, a right-ear **double flick**, the tail alternating between gentle sways and a short wag burst, and blinks at uneven intervals (one of them a double). Plus the **runtime variation layer** (§2) |
| `happy` | 2 hops | Clearer **anticipation** (deeper crouch, arms pulled back), a stretch at take-off, overshoot squash on landing, a second smaller hop, then a side-to-side wiggle with head tilts. **Ears and tail are driven by springs** from the body motion (follow-through). The face turns happy as the crouch starts and ends with a smile |
| `wave` | raise and wave | A counter-lean and a small dip before the raise (anticipation), a snappy raise with overshoot, the shoulder lifts, the body bobs in time with the waves, the head tilts toward the paw, the ears perk, a **happy double blink** mid-wave, and paw follow-through as the arm comes down |
| `head_pet` | squint, ears flat | **Affectionate**: a little flinch, eyes melting shut, the head **pushes up into the hand** and nuzzles slowly (a 20-frame rhythm), the body relaxes ("melt"), a small "purr" vibration, the **tail wag builds up** (amplitude and speed), then the ears pop back with overshoot, a small happy bounce and a smile |
| `tail_touch` | startled, looks back; the playful part happens facing away | **Surprised, then playful**: a 2-frame "take" (freeze + wide eyes), a big stretch jump that turns toward the tail **while airborne** (the feet don't slide), looks back with a curious tilt and a blink. Then **hops back to face the viewer** and plays from the front: happy face, crouch-wiggle with head tilts, little bounces, fast wag, smile. (The first E2 version still played facing away and wasn't readable from the front or 3/4 view, so it was re-timed) |
| `walk` | solved feet | **Feet identical** (same solver, same parameters, same 0.22 m/s). Over that: more forward lean (momentum), contact squash, a delayed head nod (overlap), stronger hip twist with the spine counter-rotating, paws lagging the arms, ears drifting with the weight shift, a **tail that follows the hip roll with an increasing delay down the chain**, and the scarf flap swinging with the hip roll and the body's vertical motion |
| `run` | solved feet | **Feet identical** (0.486 m/s). More lean (10°), **squash on landing and stretch on push-off**, bent arms swinging hard, ears bouncing out on impact, the tail raised over the back and swinging as a delayed chain, the scarf flap fluttering outward, and an "excited" face |

Limits kept from the E1 QA (written into `anim_e2.py`):
- tail raise ≤ 10° over the back, wag ≤ ±20° graded down the chain
- head roll ≤ 5°, carried on the NECK
- arm raise in reactions ≤ 45°, ear spread ≤ 18°
- body squash −8 % … +10 %
- root yaw only while airborne
- the scarf flap never swings into the chest
- **Silhouette:** the head is rigid; squash and stretch only affect the body, within the limits above

## 2. Idle variation (runtime)

To avoid one very long clip, the variation lives in the viewer (`updateIdleVariation`), configured in `idle_variation_e2.json`:

| Event | How often | Effect |
|---|---|---|
| Blink | every 3.5–7.5 s, 25 % double | Morph `Blink` on top of the clip's own blinks |
| Ear twitch | every 7–14 s, random side | EAR_01 12° forward / 6° out, 0.32 s |
| Glance / tilt | every 10–20 s, **skipped while tracking the cursor** | NECK yaw 8° + roll 4°, 1.4–2.4 s |
| Tail flick | every 6–12 s | Tail sway, phase-shifted down the chain, 0.6 s |
| Tempo | each time idle loops | Idle speed 0.94–1.06 |

It only runs while idle is in control (idle weight > 0.9, no one-shot playing, no hover or drag), and fades in and out. `?seed=N` makes it reproducible. In the browser over 40 s of idle (seed 7) it produced 25–26 events of all 5 kinds; during head_pet, 0 events.

## 3. Quality checks (Blender, every frame, runtime cage = GLB geometry)

| Requirement | E1 (approved) | E2 |
|---|---|---|
| Foot sliding walk / run (mm/frame) | 0.025 / 0.030 | **0.025 / 0.030** (feet identical) |
| Sole below the floor | −0.02 mm | −0.02 mm |
| Tail into body | 0 in all clips | **0 in all clips** |
| Scarf into body | walk: 1 vertex at the 2 mm threshold | walk: 2 vertices at the threshold; 0 elsewhere |
| Scarf top under the head (hidden) | ≤ 9 vertices / 4.1 mm | ≤ 9 vertices / 3.8 mm |
| Visible arm surface into the head | ≤ 4 vertices (tail_touch 11 mm, hidden) | ≤ 4 vertices (same) |
| Joint roots leaving the host | happy 0; tail_touch arm 7 / 11 mm; head_pet ear 3 / 6.4 mm | happy arm 3 / 2.4 mm, ear 3 / 5.6 mm; tail_touch arm 9 / 11.4 mm; head_pet ear 3 / 7.4 mm. **Same kind and size as the approved E1**, at the same frames (landing squash, ears spreading), hidden inside the silhouette |
| Stretch, cage p99 (max) | 0.77 (run legs) | 0.77 (run legs); idle 0.45 |
| Loop seam / gait periodicity | 0.000 | **0.000** |
| One-shot start/end = rest | 0.000° | **0.000°** (the happy clip was caught at 3° and fixed: the scarf offset now fades with the expression) |

Visual check: the E2 key-frame sheet, the 11 previews and the E1 \| E2 comparisons show no clipping, gaps or silhouette distortion.

## 4. Limits

- No IK. Locomotion stays in place, and the app moves the character at `speed_mps × level scale` (unchanged).
- The idle variation only exists at runtime: an engine without the viewer's logic will play the plain 6 s idle, which is still varied on its own.
- Expression changes inside clips are linear morph blends over 3–5 frames (the morph contract has no dedicated in-between shapes).

## 5. How to reproduce

```
python 08_VALIDATION/scripts/anim_e2.py
python 08_VALIDATION/scripts/anim_check_e2.py
python 08_VALIDATION/scripts/anim_render_e2.py qa
FOX_GATE=e2 python 08_VALIDATION/scripts/anim_render_e2.py preview idle walk_front walk_side walk_34 run_front run_side run_34 happy wave head_pet tail_touch
FOX_GATE=e1 FOX_OUT=04_ANIMATIONS/renders_compare/e1 python 08_VALIDATION/scripts/anim_render_e2.py preview walk_front run_front happy wave
python 08_VALIDATION/scripts/make_e1_e2_compare.py
python 08_VALIDATION/scripts/export_glb_e2.py
python 08_VALIDATION/scripts/make_anim_viewer_e2.py
python 08_VALIDATION/scripts/browser_anim_test_e2.py
```
