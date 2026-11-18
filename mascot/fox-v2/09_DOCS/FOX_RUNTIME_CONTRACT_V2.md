# Fox Runtime Contract V2 (Gate F + Gate G1 module)

Contract version `fox-v2/e2-anim+g1-module/f-runtime-2` (Gate F was `fox-v2/e2-anim/f-runtime-1`; everything in §1–§8 of the F contract still holds, G1 only adds). Base asset: `06_EXPORTS/glb/fox_v2_anim_e2.glb` (approved Gate E2, `e884d675…`, unchanged). G1 animation module: `06_EXPORTS/glb/modules/fox_v2_g1_quest_reward_streak.anim.glb` (§10).
Implementation: `07_WEB_PREVIEW/companion_sandbox/src/mascot/`. Source of truth for names and tuning: `foxContract.ts`.

## 1. Asset contract (validated on load)

`FoxModelLoader` rejects a GLB with `FoxAssetError('contract')` unless all of the following are present:

- **Bones (28):** `ROOT HIPS SPINE NECK HEAD EAR_L_01/02 EAR_R_01/02 ARM_L PAW_L ARM_R PAW_R LEG_L FOOT_L LEG_R FOOT_R TAIL_01…04 SCARF_FLAP ATT_HAT ATT_GLASSES ATT_SCARF ATT_BACKPACK ATT_HAND_L ATT_HAND_R`.
  The `ATT_*` sockets are reserved for Gate H cosmetics and are not used yet.
- **Core clips (7):** these names are unchanged. They are the only clips the base GLB must contain; module clips (§10) are optional and validated separately.

| Clip | Layer | Duration | headControl | faceControl | Large motion |
|---|---|---|---|---|---|
| `idle` | base, loop | 6.000 s | 0 | 0 | – |
| `walk` | base, loop, in place, 0.22 m/s | 1.667 s | 0.5 | 0 | – |
| `run` | base, loop, in place, 0.4857 m/s | 1.167 s | 0.6 | 1 | yes |
| `happy` | one-shot | 2.542 s | 1 | 1 | yes (hops) |
| `wave` | one-shot | 2.792 s | 1 | 1 | – |
| `head_pet` | one-shot | 3.125 s | 1 | 1 | – |
| `tail_touch` | one-shot | 2.875 s | 1 | 1 | yes (jump) |

`headControl` 1 means the clip owns the head and look-at is suppressed. `faceControl` 1 means the clip owns the face and moods are suspended.
- **Morph targets (D1.1, unchanged):** `FOX_Eye_L/R: Blink Wide Sad HalfLid Proud hide` · `FOX_Mouth_Neutral: hide` ·
  `FOX_EyeClosedHappy_L/R`, `FOX_EyeClosedSleepy_L/R`, `FOX_Mouth_Open/Tongue/SmallO/Frown/Smile: show` · `FOX_Brow_L/R: show Sad Proud`.
- Materials are used as exported; the runtime never edits them.

## 2. Public API (`FoxController`)

```ts
const fox = await FoxController.create({ modelUrl, level?, mood?, activity?, interaction?, lookAt?, idleVariation?, reducedMotion?, seed?, registry?, shadow?, signal? });
scene.add(fox.object3D);                                   // host owns scene, camera, renderer
fox.attachView({ camera, domElement: renderer.domElement });
const binding = fox.bindRenderer();                         // one per renderer
// per frame:  fox.update(dt); binding.render(() => renderer.render(scene, camera));

fox.play("happy");            // one-shot (priority 30) or base clip → activity
fox.setMood("happy");         // persistent face; setMood("sad", { durationS: 3 }) = timed pulse
fox.setLevel(10);             // uniform scale 0.92 (animated ~0.6 s; instant under reduced motion)
fox.setActivity("idle");      // idle | walk | run | resting
fox.setInteractionEnabled(true);
fox.setLookAtEnabled(true);
fox.setIdleVariationEnabled(true);
fox.setReducedMotion(false);
fox.pause(); fox.resume();    // pause freezes animation time; resume does not jump
fox.handleEvent("QUEST_COMPLETED", payload?);   // semantic LifeQuest event → registry reaction
fox.on(e => …);               // oneshot-start/end, hover, tap, event, level, mood, activity, paused, grab
fox.getState(); fox.getStats();
fox.dispose();                // releases everything this instance owns
```

Return values: `play` / interaction → `'played' | 'queued' | 'merged' | 'debounced' | 'rejected' | 'substituted' | 'base' | 'unavailable' | 'unknown'` (`unavailable`: a module clip whose module is not loaded).
`handleEvent` → `{ result: 'handled' | 'coalesced' | 'unknown', canonical, coverage, steps, play }`.

## 3. Animation layering and priorities

Order per frame: level scale → **mixer** (base + one-shots, explicit weights) → idle variation → look-at → hover feedback → face → idle blink → hover picking.
Procedural layers are additive and run after the mixer. The mixer's own bone and morph values are restored before every mixer update.

- **Base layer:** one persistent activity. Base clips cross-fade linearly over 0.3 s. Walk and run share one normalised phase, so the feet stay planted during the blend.
- **One-shot layer:** fade in 0.2 s, fade out 0.35 s. An interrupted one-shot cross-fades out over 0.2 s from its current weight (no pop). Base weight = 1 − Σ one-shot weights.
- **Priorities** (same scale as the dashboard prototype's Mascot Context Engine): `0 ambient · 10 context · 20 normal / interaction · 30 important (API play default) · 45 urgent · 50 major · 60 critical`.
  - A request **interrupts** only with a higher priority. The one exception is a new user interaction replacing a user interaction (e.g. a tail tap while petting), which is allowed at equal priority.
  - Otherwise events are **queued**: up to 4, TTL 8 s, sorted by priority; a repeat of the same clip is merged. Interactions and API calls without `queue` are **rejected**.
  - The same clip requested again within 70 % of its duration is **debounced**.
- **Idle variation never interrupts anything:** its gate closes while a one-shot is playing or queued, while the pointer hovers or holds the fox, while the base layer is not idle, while resting, and under reduced motion. New idle events are only scheduled while the gate is open.
- **Moods vs clips:** a mood that is part of an event reaction waits until that event's clip ends.

## 4. Look-at (procedural)

| Parameter | Value |
|---|---|
| Range | yaw ±40°, pitch −15…+20° |
| Yaw split | NECK 45 % / HEAD 55 % |
| Pitch split | NECK 85 % / HEAD 15 % |
| Eyes | lead the head (ω 14 vs head ω 6, critically damped) |
| Input low-pass | 9 /s |
| Dead zone | ±3° yaw, ±2° pitch |
| Activity threshold | pointer moves under 3 px are not activity |
| Pointer resting | after 2.5 s the head eases to 35 % of the angle |
| Pointer leaves | slow return to the clip's own head pose (ω 2.6) |
| Weight | `(1 − Σ clip weight × headControl) × intensity` |

## 5. Interaction (raycasting)

- **Hit proxies:** a head ellipsoid and 4 tail capsules, built at scale 1 and parented to the HEAD and TAIL_0x bones, so they follow the animation and the level scale.
- **Occlusion:** the body mesh blocks the tail.
- **Picking cadence:** picks run on pointer moves of ≥ 3 px, or every 120 ms when the fox moves under a still cursor.
- **Hover:** enters immediately, exits after 120 ms (no edge flicker).
- **Taps:** a tap needs < 6 px of travel; a head stroke needs 40 px of drag; each target has a 0.6 s tap cooldown.
- **Mapping:** head → `head_pet`, tail → `tail_touch`, both at priority 20 (interaction).
- **Keyboard:** when the canvas is focused, Enter / Space pets the head and T touches the tail.
- **Touch:** no hover; a tap or drag works the same way.

## 6. Level scaling

- **Formula:** `levelToScale(level)` is piecewise linear: Lv1 0.80 · Lv10 0.92 · Lv20 1.00 · Lv30+ 1.10. It is a uniform scale on one model and one rig: no growth morphs, no age models.
- **Camera framing:** `frameFoxCamera()` fits the fox at the **largest** scale (1.10, plus hops) with these margins: mini 1.20, widget 1.24, full 1.45.
  The camera never moves when the level changes, and every level fits. Measured: a Lv30 fox during `happy` keeps ≥ 58 px of margin in the widget.

## 7. Reduced motion

`setReducedMotion(true)`, or `prefers-reduced-motion` in the sandbox:

- look-at off and idle variation off;
- level growth is instant;
- hover feedback runs at half amplitude;
- large-motion clips (`happy`, `tail_touch`, `run`, and the G1 large-motion clips, §11) are replaced by face reactions: `tail_touch` → surprised 1.4 s, `happy` → happy 2 s; G1 substitutions in §11;
- gentle clips (`wave`, `head_pet`) still play.

## 8. Rendering and lifecycle (host responsibilities)

- Render only while the companion is visible: the sandbox switches R3F `frameloop` to `'never'` and calls `pause()` when the canvas leaves the viewport (IntersectionObserver, 100 px pre-roll) or the tab is hidden.
- Wrap every render of a renderer with its `FoxRenderBinding`, and release the binding when that renderer is destroyed (`dispose()` releases all bindings of the controller).
- Geometry, materials and textures are shared by every instance through the loader cache: refcounted, freed 5 s after the last instance (`setFoxAssetKeepAlive`, `purgeFoxAssetCache`).
- Each instance owns only its cloned bones, morph influences, skeleton bone texture, 5 hit-proxy meshes and its mixer.

## 9. Not in this contract (later gates)

- Gate G2 / G3: the remaining functional clips (`celebrate`, `sad_react`, `panic`, `proud_pose`, `sleep_loop`, …). The registry still names them as `plannedClip`; the events that use them keep their F fallback.
- Gate H: cosmetics on the `ATT_*` sockets. G1 props are temporary effects (§12), never cosmetics.
- No Rive library and no full LifeQuest frontend.

## 10. Animation modules (Gate G1+)

An animation module is a GLB that contains **no Fox body**: only the canonical armature (same 28 joint names and rest pose as the E2 GLB) and the 14 facial-feature nodes reduced to one triangle each, kept only to carry the morph-weight channels in the original morph order. No materials, no textures.

```ts
const fox = await FoxController.create({ modelUrl, modules: [{ id: 'g1_quest_reward_streak', url: '/models/modules/fox_v2_g1_quest_reward_streak.anim.glb', clips: G1_CLIPS }] });
```

- `ANIMATION_MODULES` in `foxContract.ts` lists the known modules (the sandbox passes all of them; `?modules=0` passes none).
- `FoxModelLoader.bindModuleClips` validates **every track** against the loaded E2 Fox: the target node exists, the property is a valid binding for it (`PropertyBinding.parseTrackName` + `findNode`), morph tracks have the right width (morph count of the target mesh) and each clip's duration matches the contract (±1 frame). The module's own nodes are disposed; only its `AnimationClip`s are kept and played by the same mixer on the same skeleton.
- A module that fails validation is dropped with a console warning and reported in `getStats().modules` (`ok`, `tracks`, `boundTracks`, `morphTracks`, `problems`). The fox keeps running on the core clips and the events use their `fallbackSteps`.
- Measured (G1): 891 / 891 tracks bound (135 morph-weight tracks); three.js reproduces an independent numpy evaluation of the module data to 0.0002 mm.

## 11. G1 clips

| Clip | Category | Layer | Duration | headControl | faceControl | Large motion | Effect cues |
|---|---|---|---|---|---|---|---|
| `quest_start` | quest | one-shot | 2.458 s | 1 | 1 | yes | flag prop on `ATT_HAND_R`, "!" burst, sparkle |
| `quest_complete` | quest | one-shot | 3.292 s | 1 | 1 | yes (jump) | star ring, confetti, sparkle |
| `quest_failed` | quest | one-shot | 3.625 s | 1 | 1 | – | rain cloud, sigh puff |
| `receive_xp` | rewards | one-shot | 2.208 s | 1 | 1 | – | XP orbs → chest, glow, "+XP" |
| `level_up` | rewards | one-shot | 4.125 s | 1 | 1 | yes (spin jump) | charge aura, light pillar, **level.apply at 0.917 s**, "LÊN CẤP!", shockwave, sparkle |
| `achievement_unlock` | rewards | one-shot | 3.542 s | 1 | 1 | yes | medal prop (rise → paws → fly away), star burst, sparkle |
| `streak_active` | streak | **base, loop** | 4.000 s | 0 | 0 | – | tier flame (loop) |
| `streak_lost` | streak | one-shot | 4.125 s | 1 | 1 | yes (jolt) | flame flicker, lightning, char on, flame out, smoke, coughs, char off, soot shake, **streak.end** |
| `streak_cheer` | streak | one-shot | 3.042 s | 1 | 1 | yes | flame flare, tier ring, sparkle |

- `streak_active` replaces `idle` as the base clip while a streak is active and the activity is `idle` (walk / run / resting are unchanged). It owns neither head nor face, so look-at, petting, moods, blinks and idle variation work exactly as on `idle`.
- Cues are part of the clip data (`anim_spec_g1.json` → `src/mascot/modules/g1_quest_reward_streak.spec.json`) and fire from the clip's own time, so they stay in sync with interruptions and pauses.

### Streak

```ts
fox.setStreak({ active: true, days: 9 });        // tier from days: 3–6 orange · 7–13 blue · 14–29 purple · 30+ crimson
fox.setStreak({ active: true, tier: 'purple' }); // explicit tier
fox.setStreak({ active: false });                // flame out, base back to idle
fox.getStreak();                                 // { active, tier, days }
```

| Tier | Days | Core / mid / edge |
|---|---|---|
| orange | 3–6 | `#FFD25E` / `#FF8A1F` / `#E8480F` |
| blue | 7–13 | `#B8E4FF` / `#3EA2FF` / `#1A4FC4` |
| purple | 14–29 | `#E2C7FF` / `#9A5CFF` / `#5224B5` |
| crimson | 30+ | `#FFBFD8` / `#F2427F` / `#8E0E33` |

The app owns the streak count; the fox only shows it (`STREAK_UPDATED` on load / change, `STREAK_MILESTONE`, `STREAK_LOST`).

### G1 priorities and reduced motion

- Event priorities: `QUEST_STARTED` 20 · `XP_GAINED` 20 · `STREAK_MILESTONE` 30 · `QUEST_COMPLETED`, `QUEST_EXPIRED`, `LEVEL_UP`, `ACHIEVEMENT_UNLOCKED`, `STREAK_LOST` 50 · `STREAK_UPDATED` 10 (state only). The F rules of §3 apply unchanged (e.g. `XP_GAINED` after `QUEST_COMPLETED` is queued, a head tap during `level_up` is rejected).
- Under reduced motion the large-motion G1 clips are substituted, keeping the state change: `quest_start` → proud face 2 s · `quest_complete` → happy face 2 s · `level_up` → proud face 2.5 s, level applied instantly · `achievement_unlock` → proud face 2.5 s · `streak_cheer` → flame flare + happy face · `streak_lost` → gentle flame fade-out + sad face 3 s, no lightning / char / jolt. `quest_failed` and `receive_xp` still play. (These substitutions apply to `play()`; through `handleEvent` an event's `reducedMotionSteps` are used when defined, otherwise its large-motion clip is dropped and its mood / level / streak steps run, e.g. `QUEST_COMPLETED` → proud face, `LEVEL_UP` → level applied at once + proud face.) The lightning flash sprite is never drawn under reduced motion.

## 12. Effects (Gate G1)

- `FoxEffectsManager` owns one group `FOX_FX_ROOT`, a child of the fox's scaled root, so every effect follows the uniform level scale. Layers: `flame`, `lightning`, `char`, `particles`, `props`, `text`.
- **The Fox materials are never modified.** The temporary char look is a set of overlay meshes that share the Fox geometry and skeleton with their own material (polygon offset), faded in and out and disposed afterwards. Props (`FX_PROP_flag`, `FX_PROP_medal`) are effect objects tagged `userData.fxProp` and never attach to the `ATT_*` sockets' cosmetic slots.
- API: `fox.setEffectsEnabled(on)` · `fox.setEffectVisible(category, on)` · `getStats().effects` (`active`, `byCategory`, `rootObjects`, `char`, `streak`, `visibility`).
- Logic cues (`level.apply`, `streak.end`, flame state) run even with effects disabled or hidden, so business state never depends on visuals.
- An interrupted one-shot resolves its state at once (char off, streak ended for `streak_lost`, pending level applied for `level_up`) and stops its own effects.
- Shared effect textures are refcounted and handed to `FoxRenderBinding` so their renderer listeners are released with the binding.
- All effects use normal alpha blending (additive blending on a transparent canvas over UI cards produces invalid premultiplied colours).
