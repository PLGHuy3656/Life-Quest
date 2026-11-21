# LifeQuest Fox V2 — Gate E1 Interactive Animation Prototype · Animation Report

**Status: Gate E1 done, stopped for visual approval.** The full Phase 1–4A library has **not** been built.

| Item | Value |
|---|---|
| Animation file | `04_ANIMATIONS/fox_anim_e1.blend`, built from a copy of the approved `03_RIG/fox_rig_d1_1.blend` |
| Approved D1.1 sources | **Unchanged**: master `16ce1a04…`, rig `87463907…`, GLB `b7ba8c32…`. Rollback checkpoint: `03_RIG/checkpoints/gateD1_1_approved/` (with `SHA256SUMS`) |
| Model / skeleton / morph contract / materials | Unchanged. Same 28 bones, same 14 face meshes and morph names, same 12 materials. The browser re-checks all of this |
| Clip contract | `04_ANIMATIONS/anim_spec_e1.json` (frames, loop, speed, head_control / face_control) |
| QA metrics | `04_ANIMATIONS/anim_metrics_e1.json` (every frame of every clip; idle every 2nd frame) |
| Renders | `04_ANIMATIONS/renders_e1/`: `fox_e1_keyframes.png` plus mp4/gif previews for idle, walk (side + 3/4), run (side + 3/4), head_pet, tail_touch |

## 1. Clips (24 fps)

| Clip | Type | Length | Content |
|---|---|---|---|
| `idle` | loop | 5.0 s | 2 breaths, weight shift, slow head drift, 3 gentle tail wags (overlap along the chain), left-ear twitch, right-ear flick, 3 blinks (one single and one double) |
| `walk` | loop, in place | 2 cycles / 1.67 s | Short-legged chibi walk: heel strike → flat foot → toe-off. Body rolls over the planted foot (weight shift), hips twist, arms swing opposite the legs, head stays steady, tail sways with a phase lag, ears and scarf follow. **speed 0.22 m/s** |
| `run` | loop, in place | 2 cycles / 1.17 s | Energetic run: short contact and a flight phase, pushing off over the toe, forward lean, arms bent and swinging hard, tail raised and swinging, scarf flap swings, "excited" face (open-mouth smile). **speed 0.486 m/s** |
| `happy` | one-shot | 2.29 s | Anticipation (crouch) → two hops of decreasing height → wiggle with a fast tail wag → settle. Happy face |
| `wave` | one-shot | 2.63 s | Anticipation → left arm raised forward with overshoot → three paw waves in front of the shoulder (under the cheek, where a chibi arm reads well) → lowered with follow-through. Smile + blink |
| `head_pet` | one-shot (interaction) | 2.79 s | Eyes squeeze → happy face, head nuzzles into the hand, ears spread flat to the sides, fast tail wag → ears pop back up with overshoot |
| `tail_touch` | one-shot (interaction) | 2.71 s | Startle (wide eyes, open mouth) with a hop. The fox turns toward the tail **only while airborne**, so the feet never slide. Looks back at the tail → turns playful (happy, fast wag) → hops back to face forward |
| `look_at_cursor` | procedural (runtime) | — | No clip. See `08_VALIDATION/anim_glb_interaction_report_e1.md` |

Every one-shot starts and ends exactly on the rest pose (difference 0.000°/0.000 mm), so it blends cleanly with any base loop. Idle, walk and run are seamless loops: the last frame equals the first, and the two gait cycles are identical.

## 2. How the locomotion was made (no foot sliding without IK)

The rig has no knee and no IK, by design for the chibi rig. Instead of animating by eye, `anim_e1.py` **solves the walk/run one frame at a time** with a small least-squares solver:
- **Variables:** root height, root side shift, hip roll (weight shift), left/right leg swing, and the heel-lift angle.
- **Planted foot:** held fixed relative to the floor (which moves at `speed_mps`): heel strike, then flat, then pushing off over the toe. Error ≤ 0.42 mm in the solve.
- **Swing foot:** follows a Hermite curve that leaves and lands at zero speed relative to the floor. Ground clearance comes from rolling the hips onto the planted foot (the chibi waddle), plus a minimum mid-swing margin of 3.5 mm.
- **Smoothing:** hip roll and root height are smoothed by Fourier filtering, so there are no jolts at heel strike.
- **Run flight:** the root follows a ballistic Hermite curve.

Secondary motion is phase-shifted periodic motion (loops are seamless by construction) or a damped spring driven by the body's vertical acceleration (ears, scarf flap).

## 3. Quality checks (Blender, evaluated mesh, every frame)

Parts and joints are measured on the **runtime cage**, i.e. the same geometry as the GLB.

| Requirement | Result |
|---|---|
| No foot sliding in walk/run | Sole drift relative to the floor: **walk ≤ 0.025 mm/frame, run ≤ 0.030 mm/frame**. Feet never go below the floor (lowest −0.02 mm) |
| No tail/body intersection | **0 new tail vertices inside the body** in all 7 clips |
| No scarf penetration | Scarf into body: 0 (walk: 1 vertex at the 2 mm threshold). The scarf top touching the underside of the head, hidden: ≤ 9 vertices / ≤ 4.1 mm, only in one-shots |
| No visible shoulder detachment | Shoulder/hip/tail roots (vertices with ≥ 50 % weight on the host bone): idle/walk/run/happy 0. Wave 3 vertices/5 mm, head_pet 1/4.6 mm, tail_touch 7/11 mm at the landing squash. **The close-up render check at exactly those frames shows no gap** |
| Arm into head | Only the visible arm surface counts (the arm's buried end inside the torso is excluded): 0–4 vertices. tail_touch peaks at 11 mm at the landing frame, at the arm's top edge under the cheek, which the close-up shows is hidden |
| Ear roots | run 2 vertices/2.8 mm; head_pet 3 vertices/6.4 mm while the ears spread flat. Not visible in the render |
| Stretch (cage p99) | Body ≤ 0.38, arms ≤ 0.61 (wave), legs ≤ 0.77 (run, hip blend region), ears ≤ 0.64 (head_pet). The head is rigid and the chibi proportions are kept |
| Loops | Last frame = first frame: 0.000°/0.000 mm. Gait cycle periodicity ≤ 0.03 mm |
| One-shots | Start/end = rest pose: 0.000°/0.000 mm |

### Fixes found by QA during E1 (all in the final version)

1. **Tail into the rump.** "Lifting" the tail by rotating its root backward pushes the tail base into the body. It now rises over the back instead (+X, ≤ 10°), and the wag is capped at ±25°.
2. **Head swallowing the scarf.** Pitch/roll on the rigid HEAD bone pushed the head's lower edge into the scarf roll (up to 18 mm). Head pitch/roll now goes 85–90 % to the NECK, which the scarf top follows. HEAD keeps the yaw share (D1.1-tested) plus a small nod. The look-at in the viewer uses the same split.
3. **Wave paw hidden.** The original wave raised the paw into the space under the head. It now waves forward and out in front of the shoulder, and is visible from the front and 3/4 views.
4. **Hip jolt at heel strike.** With no knee, the rear leg is "too long" in double support. Fixed with heel strike, a variable heel lift, and filtered roll/height.
5. **Run toe scuffing the floor.** On the runtime mesh the trailing toe skimmed the floor by about 1 mm (found by the browser test). The swing toe now comes up faster, with a minimum clearance of 3.5 mm.

## 4. Limits of E1 (not in scope)

- No IK and no ground adaptation (flat floor only). Locomotion is in place; the app moves the character at `speed_mps × level scale`.
- Expression transitions in clips are linear morph blends over 3–5 frames. Closed-eye ↔ open-eye swaps are blends, not a dedicated blink shape.
- The wave arm cannot go above the head: the chibi arm is short and the head is wide (a proportion fact, kept as is).
- Walk ↔ run blends phase-synced feet with an average speed. Brief foot slip during the 0.3 s cross-fade is expected and not measured.

## 5. How to reproduce

```
python 08_VALIDATION/scripts/anim_e1.py              # 04_ANIMATIONS/fox_anim_e1.blend + anim_spec_e1.json
python 08_VALIDATION/scripts/anim_check_e1.py        # 04_ANIMATIONS/anim_metrics_e1.json
python 08_VALIDATION/scripts/anim_render_e1.py qa    # key-frame sheet
python 08_VALIDATION/scripts/anim_render_e1.py preview idle walk_side walk_34 run_side run_34 head_pet tail_touch
```
