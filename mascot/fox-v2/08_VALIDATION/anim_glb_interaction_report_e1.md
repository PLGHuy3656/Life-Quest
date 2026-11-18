# LifeQuest Fox V2 — Gate E1 · GLB Playback & Web Interaction Report

**Status: 24/24 PASS in a real browser runtime** (14 page checks + 10 tests with real mouse input). Waiting for visual approval.

| File | Notes |
|---|---|
| `06_EXPORTS/glb/fox_v2_anim_e1.glb` | 2,654,216 B · ~73.8k tris · 47 meshes · 1 skin / 28 joints · 12 materials · 0 textures · **7 clips** |
| `06_EXPORTS/glb/fox_v2_anim_e1_manifest.json` | Channels and durations per clip, plus the clip contract (speed, head_control, face_control) |
| `07_WEB_PREVIEW/fox_interactive_e1.html` | Interactive viewer that extends the D1.1 viewer. `rig_test.html` is kept as the D1.1 record |
| `08_VALIDATION/runtime_e1/anim_runtime_report.json` | Raw results |
| `08_VALIDATION/runtime_e1/fox_e1_runtime_sheet.png` + `e1_*.png` | Screenshots from the browser |

## 1. Export

- Same export path as the verified D1.1 test: cage LOD with the scarf at level 1, face decal refit, materials de-duplicated in memory. **New in E1:**
  - `export_anim_slide_to_zero=True`: clips start at t = 0, so loops have no 1-frame hold at the wrap.
  - `export_optimize_animation_size=False`: every sampled frame is kept, so the planted-foot locking is exact.
- Durations = spec: idle 5.000 s, walk 1.667 s, run 1.167 s, happy 2.292 s, wave 2.625 s, head_pet 2.792 s, tail_touch 2.708 s.
- Each clip has 14 `weights` channels (the face) plus the skeleton. **The morph-target contract is unchanged:** 14 face meshes with the same names and morphs as `03_RIG/face_morph_map.json`. `smile` and `excited` are combinations of existing morphs.

## 2. Runtime architecture (Three.js r170)

**Animation controller**
- **Base loops** (`idle` / `walk` / `run`): weights ramp linearly over 0.3 s and always sum to 1. Walk and run share one normalised phase, so the feet stay in step during the blend.
- **One-shots** (`happy`, `wave`, `head_pet`, `tail_touch`): 0.2 s fade-in and 0.35 s fade-out before the end, then return to the current base. A repeat click is ignored while less than 70 % of the clip has played.
- **Moving floor:** for walk/run the floor moves at `speed_mps × weight × level scale`, which proves foot planting in the viewer itself.

**Layers after the mixer**
1. **look_at_cursor**:
   - The pointer ray hits a camera-facing plane at head height, giving a target yaw/pitch in the character frame.
   - Clamps: **yaw ±40°, pitch −15…+20°**. The clamp applies to the total head angle, including any head motion the clip already has.
   - Motion uses a **critically damped spring** (velocity is continuous). The eyes lead the head with a faster spring and a small tangential shift in head space.
   - Distribution: yaw NECK 45 % / HEAD 55 %, pitch NECK 85 % / HEAD 15 %, so the head doesn't sink into the scarf.
2. **Priority:** look weight = `1 − Σ(action weight × head_control)`.
   - happy / wave / head_pet / tail_touch = 1, so head tracking is fully off; walk 0.5, run 0.6.
   - With no pointer over the scene, the clip keeps the head.
3. **Hover feedback:** on the head the ears perk up; on the tail it gives a small wiggle. A label follows the pointer and the cursor changes to grab / pointer.
4. **Manual expressions:** blended over the clip face. Suspended when `face_control` = 1 (happy, wave, head_pet, tail_touch, run).

**Picking**
- Real `Raycaster` against invisible **proxy meshes attached to the bones**: an ellipsoid on HEAD and 4 capsules on TAIL_01…04, with radii fitted to the tail mesh. They follow the animation.
- The tail is **occlusion-tested against the real body mesh**: the body in front blocks the tail, and the head in front of the tail takes priority.
- The "show hit proxies" option displays the proxies.

**Gestures**
- Click (< 6 px movement) on the head → `head_pet`; click on the tail → `tail_touch`.
- **Stroking the head** (drag > 40 px across it) → `head_pet`.
- While pressing on the head or tail, OrbitControls is disabled. Dragging empty space orbits the camera.

**Three.js pitfall handled:** `PropertyMixer.apply()` only writes a value when the mixed value changed since the previous frame. A procedural layer that modifies a bone or morph can therefore "stick". The viewer invalidates the previous accumulation buffer before every `mixer.update()`, so the clips rewrite every property every frame.

## 3. Results in the browser

Environment: Chrome 153 headless, WebGL 2 on ANGLE/**SwiftShader** (software rendering). Three.js r170 is loaded through the same importmap as the page. The container network blocks jsdelivr, so the 4 requests were served from the local npm package `three@0.170.0` (same version).

Time is stepped deterministically (`__fox.step(1/60)`) so results don't depend on the software frame rate. **Mouse input is real**: Playwright moves and clicks, and the browser dispatches the pointer events.

| # | Check | Result |
|---|---|---|
| 1 | GLB loads | 47 meshes, 7 clips |
| 2 | Clip durations = spec, starting at t = 0 | PASS |
| 3 | Morph-target contract identical to D1.1 | 14 face meshes, names match |
| 4 | Skeleton unchanged | 28 joints, hierarchy correct |
| 5 | Seamless loops | wrap Δ 0.000° / ≤ 0.001 mm; gait cycle periodicity ≤ 0.025° |
| 6 | **No foot sliding during GLB playback** | Sole drift relative to the floor per 1/120 s: **walk ≤ 0.018 mm, run ≤ 0.105 mm** |
| 7 | Smooth transitions | Weight sum 1.000 throughout. Largest joint step per 1/60 s during transitions 9.2° vs 8.0° inside the clips themselves (fast paw motion), so no pops. All 4 one-shots return to base |
| 8 | look_at_cursor clamped and damped | Total yaw 39–40°, pitch 19.6° (limits 40° / 20°). Largest step 1.8°/frame |
| 9 | Priority | During head_pet with the cursor far right: look weight 0.000; HEAD differs from the clip pose by 0.00° |
| 10 | Picking | Head → head; visible tail surface → tail; belly → none (the body occludes the tail); the hidden part of the tail → head (the front-most surface wins) |
| 11 | Expression controls / face priority | `sad` on idle: brow Sad 1.00. During happy: sad 0.00, happy eyes 1.00 |
| 12 | Level scale | ×0.8 → 0.800, ×1.1 → 1.100 (floor speed scales too) |
| 13 | HUD statistics | FPS · triangles · draw calls (73,844 tris, 49 draw calls) |
| 14 | Console errors | none |
| 15 | **Real hover** | Head → head (grab cursor, "pet the head" label); tail → tail (pointer cursor); belly → none |
| 16 | **Real click on the head** | → head_pet (weight 1.00, look weight 0.003), then back to idle |
| 17 | **Real head stroke** | → head_pet (stroke); the camera does not orbit while petting |
| 18 | **Real click on the tail** | → tail_touch |
| 19 | Click on the body / drag empty space | Body click does nothing; dragging moved the camera 1.4 m without triggering a clip |
| 20 | **Real-mouse look-at** | Right +40.1°, left −40.1°, top +19.6°. After an ~80° target jump: peak speed 3.45°/frame, acceleration ≤ 0.66°/frame² (no jumps) |
| 21 | Priority with the real mouse | Look weight 0.000 during head_pet |
| 22 | UI buttons | Walk/run (floor 0.220 / 0.486 m/s), wave, `surprised` expression, Lv 0.8/1.1 |
| 23 | Live HUD | FPS/tris shown by the real render loop |
| 24 | Console during the session | no errors |

**FPS:** about 3 fps is SwiftShader software rendering, **not representative**. A real GPU/phone test belongs to Gate F.

## 4. Limits

- Proxy wireframes are drawn without a depth test, so they show through the body when enabled (debug display only).
- Look-at does not account for the camera being behind the fox: the yaw is clamped at ±40°, and from behind the fox only turns its head to the side.
- Raycasting runs only on pointer move. The tail occlusion test uses the real `FOX_Body` mesh on the CPU, which is cheap enough because it runs only when a tail proxy is hit.
