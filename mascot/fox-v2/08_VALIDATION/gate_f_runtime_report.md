# Gate F — Interactive Companion Sandbox & Runtime Foundation — runtime report

Date: 2026-11-17.

**Sandbox:** `07_WEB_PREVIEW/companion_sandbox/` (React 18.3 · TypeScript 5.6 · three.js 0.170 · React Three Fiber 8.17 · Vite 5).

**Asset:** approved Gate E2 GLB `06_EXPORTS/glb/fox_v2_anim_e2.glb` (`e884d675…`).
- The character was not rebuilt. Skeleton, morph names, materials and the 7 clip names are unchanged; the loader validates them on every load.
- All approved E2 sources are untouched (verified by hash, see `09_DOCS/CLEANUP_LOG.md`).

## Summary

| Area | Result |
|---|---|
| Automated runtime suite (headless Chrome, real mouse + touch input) | **35/35 PASS** (`runtime_f/companion_runtime_report_f.json`) |
| Real GPU (AMD Radeon 780M, ANGLE D3D11, Chromium 156) | **Single companion 59.7 fps** at a 60 Hz page rate. Update 0.53 ms + render submit 1.34 ms per frame. GLB fetch 25 ms + parse 29 ms. |
| Real tab hide / show (GPU session) | Render loop stopped (frames frozen), controllers paused, resumed automatically. |
| Mount / unmount | 40× headless + 20× on the GPU: no leaked canvases, controllers or renderer listeners. Heap flat after warm-up (17.5 KB / cycle headless). |
| Bug found and fixed in this gate | Shared-GLB renderer leak: ≈ 400 KB / cycle before, see §5. |
| Not verified | Two simultaneous companions at 60 Hz on the GPU (host throttled the pane). Mobile performance (no device). Details in §4. |

## 1. Architecture (PART A, H)

Framework-agnostic runtime in `src/mascot/`, React only in `src/components/`.

| Module | Responsibility |
|---|---|
| `FoxController.ts` | Public API façade (`play`, `setMood`, `setLevel`, `setActivity`, `setInteractionEnabled`, `setLookAtEnabled`, `pause`, `resume`, `dispose`, `handleEvent`, `bindRenderer`, `on`, `getState`, `getStats`). Orchestrates the per-frame layer order. |
| `FoxModelLoader.ts` | GLB fetch + parse, contract validation, typed errors (`network`, `parse`, `contract`, `aborted`). One parse per URL; refcounted cache; per-instance SkeletonUtils clone (shared geometry / materials). |
| `FoxAnimationManager.ts` | AnimationMixer, persistent base layer, one-shot priorities, queue (4, TTL 8 s), debounce, explicit cross-fades. |
| `FoxLookAtController.ts` | Procedural look-at: low-pass, dead zone, resting return, clip compensation. |
| `FoxInteractionManager.ts` | Pointer / touch / keyboard, raycasting on bone-attached proxies, body occlusion, hover hysteresis, tap cooldown. |
| `FoxIdleVariation.ts` | Seeded idle variation (blink, ear twitch, glance, tail flick, tempo) plus the hover feedback layer. |
| `FoxFaceController.ts` | Facial morphs: persistent mood + timed pulses; clips with faceControl win. |
| `FoxLevelScale.ts` | `levelToScale`, smooth uniform growth, `frameFoxCamera` (framing for the max scale). |
| `FoxEventMap.ts` | Typed LifeQuest event registry (14 events, aliases, coverage, planned Gate G clips). Extensible by declaration merging + `register()`. |
| `FoxRenderBinding.ts` | Per-renderer tracking of three.js listeners on the shared GLB (fixes the leak in §5). |
| `foxContract.ts` | Names and tuning. Single source of truth. |

**Business events are separate from animation.** Pages call `publish('QUEST_COMPLETED')`, a context bus forwards it to each controller's `handleEvent()`, and the registry produces steps that run through the public API. No page references a clip or a morph.

**No duplicated Fox geometry.** Test checks confirmed:
- 47 of 47 Fox geometries are the same objects in both instances;
- the GLB is downloaded once for Mini + Widget + Full view.

Only 5 small hit proxies, the skeleton bone texture and the pose are per instance.

**Prepared, not implemented:**
- future animation modules: new clip names go into `foxContract.ts`; events already name `plannedClip`;
- cosmetics: the `ATT_*` sockets are validated, and `FoxRenderBinding.collect()` can rescan for attached meshes.

## 2. Presentations and visual QA (PART B, G)

All three use the same `<FoxCanvas>` and the same `FoxController` class:

| Mode | Size | Framing margin | Shown in |
|---|---|---|---|
| Dashboard Mini | 200 × 200 (verified) | 1.20 | Dashboard "Bạn đồng hành" card: level badge, mood, XP, scale |
| Companion Widget | 360 × 440 (verified) | 1.24 | Dashboard side column, glass header / footer overlays, minimise / close / recall |
| Full Companion View | responsive (`100%`, min 520 px) | 1.45 | `#/companion` stage + runtime panel, orbit |

Styling follows the LifeQuest Dashboard UI V1 tokens:
- cream container `#F5F3EE`;
- white 24 px cards with border `#EFEBE3`;
- teal / mint `#168C78` / `#DDEFE5`;
- fox orange `#F26B3A`;
- navy `#16324A`;
- Plus Jakarta Sans (self-hosted, including the Vietnamese subset).

The canvas is transparent, so the fox sits on the card's own mint "floor" instead of a generic viewer background.

Screenshots in `runtime_f/`:
- `f_01_dashboard.png` and `f_02_dashboard_quest_completed.png`;
- `f_03_full_companion.png`, `f_04_full_lookat.png`, `f_05_full_head_pet.png`;
- `f_10…12` (widget hover head / head pet / tail touch);
- `f_06_reduced_motion.png`, `f_07_glb_error.png`, `f_09_no_webgl.png`;
- `f_08_mobile_viewport_dashboard.png` (390 × 844, emulated).

## 3. Behaviour checks (PART C, D, E) — headless Chrome, real input

| Check | Result |
|---|---|
| Hover head / click head → `head_pet` / hover + click visible tail (body occlusion) → `tail_touch`, via real mouse and actual raycasting | PASS |
| Second click during `head_pet` does not restart it | PASS (clip time 1.000 → 1.033 s) |
| Look-at ignores ±1.5 px cursor jitter | PASS: max head change 0.24° |
| Look-at follows a real move | PASS: yaw +37° → −37° |
| Pointer leaves → return to neutral | PASS: look offset −0.15° |
| Idle variation never interrupts one-shots | PASS: 13 events in 30 s of idle, 0 during `head_pet`; gate weight ≤ 0.04 while playing |
| Priorities | PASS: major event (50) not interrupted by a tap (20); equal-priority event queued then played (`wave` after `happy`); interaction replaces interaction with a cross-fade (0 → 1 in 0.2 s); LEVEL_UP interrupts |
| Uniform level scale | PASS: Lv1 0.800 · Lv10 0.920 · Lv20 1.000 · Lv30 1.100 · Lv45 1.100; hit proxies scale identically |
| Camera framing | PASS: unchanged for all levels; Lv30 during `happy` keeps ≥ 58.4 px of margin in the widget |
| Event registry | PASS: all 14 events use only E2 clips; fallback events play no clip (STREAK_LOST → sad face); unknown events refused; aliases resolve; repeats coalesce; alias collisions rejected |
| Dashboard button → QUEST_COMPLETED → both mounted foxes play `happy` | PASS |
| API: play / setMood / setActivity / setLevel / setLookAtEnabled / setInteractionEnabled / pause / resume | PASS |
| prefers-reduced-motion (OS emulation) | PASS: look-at 0, idle variation 0, `tail_touch` → face substitute, QUEST_COMPLETED → proud face only, `wave` still plays |
| Touch tap on the head (emulated mobile viewport) | PASS |
| No console or page errors | PASS |

## 4. Performance (PART F)

### Real GPU — `runtime_f/gpu_test_f.json`

Environment:
- **Machine:** the user's Windows laptop.
- **GPU:** AMD Radeon 780M (ANGLE Direct3D11).
- **Browser:** the Claude desktop app's built-in browser, Chromium 156, DPR 1.5.
- **Serving:** localhost-only static server, stopped afterwards.

| Metric | Value |
|---|---|
| Full view, 1 companion (667 × 778 px canvas) | **59.7 fps**, page rAF p50 16.7 ms / p95 16.9 ms |
| Update per frame | 0.53 ms avg (max 1.96 ms) |
| Render submit per frame | 1.34 ms avg (max 7.6 ms) |
| Draw calls / triangles | 48 / 73,842 per companion |
| GPU resources (renderer.info) | 53 geometries, 34 textures |
| GLB 2.71 MB | fetch 25 ms + parse 29 ms = 55 ms; 2nd and 3rd instances from the cache |
| JS heap (page) | ≈ 20–35 MB (no forced GC available in the pane) |
| Real `visibilitychange` → hidden | frames frozen 3 s, both controllers paused / inactive |
| Back to visible | resumed automatically |
| 20× mount / unmount | shared listeners 61/12 → 61/12, canvases 2 → 2, cache refs correct, heap level ≈ 30 MB from cycle 10 to 20 |
| Re-mount latency | ≈ 0.9 s (context + shader compile on D3D11); see limitations #12 |

**Not verified on the GPU, so no performance claim:**
- **Two companions at once (Dashboard Mini + Widget) at 60 Hz.** During those runs the host app throttled the pane (page rAF 15–30 Hz, timers throttled) because its window was not in front. In every stable run each companion rendered exactly one frame per page frame (29.5 = 29.5, 30.2 = 30.2), with update 0.26–0.57 ms and render submit 1.16–2.0 ms per companion. One early run at 60 Hz rAF showed 31 / 16 fps and could not be reproduced. **Recommendation: one live companion per screen.**
- **Pointer overhead on the GPU** (timers were throttled). It was measured headless instead: raycast 0.045 ms avg / 0.2 ms max per pick (CPU work, not GPU-dependent); update 0.03 → 0.24 ms while the pointer moves.
- **Mobile:** no real device was available, so **mobile performance remains unverified.** Only the layout and touch input were tested in an emulated 390 × 844 viewport.

### Render loop discipline

- **Offscreen:** a companion parked below the fold rendered **0 frames** and stayed paused until scrolled into view (IntersectionObserver with 100 px pre-roll → R3F `frameloop="never"` + `pause()`).
- **Hidden tab:** the same mechanism (verified on the GPU with a real hide, and headless with a simulated event).
- **Resume:** no time jump (the first frame after resume uses dt = 1/60).
- **Low frame rates:** dt is clamped to 0.1 s.

### WebGL unavailable / load failure

- Chrome with `--disable-3d-apis`: both companions show the static poster (rendered from the E2 GLB), no canvas is created, no errors.
- Missing GLB: poster + "Không tải được mô hình cáo." + **Thử lại**; the rest of the page keeps working.

## 5. Defect found and fixed during Gate F — shared-GLB renderer leak

Repeated mount / unmount grew the heap linearly by ≈ 0.4 MB per cycle (7.7 → 32.0 MB over 60 cycles).

**Root cause:** every three.js WebGLRenderer registers internal `dispose` listeners on the geometries (buffers, morph textures) and materials (programs) it draws. The Fox geometry is shared and cached across companions, so those listeners kept every unmounted renderer alive (+61 geometry and +12 material listeners per cycle).

**Fix:** `FoxRenderBinding` wraps each renderer's render calls, records exactly the listeners that renderer added to the shared resources, and removes only those when it is released. Other live canvases keep their GPU buffers; nothing is re-uploaded.

**After the fix:**
- listeners stay constant (122/24 with two canvases, 61/12 per renderer);
- heap +1 MB warm-up, then 17.5 KB per cycle headless;
- flat on the GPU.

## 6. Defect found and fixed — idle event on a one-shot's first frame

With a short frame (< 0.05 s), the idle-variation weight was still above 0.5 on the first frame after a one-shot started, so a due idle event could begin. New idle events are now only scheduled while the gate is actually open.

## 7. Files

- **Sandbox:** `07_WEB_PREVIEW/companion_sandbox/` (sources, `package.json`, `README.md`, `dist/` prebuilt; `node_modules/` is not delivered).
- **Docs:** `09_DOCS/FOX_RUNTIME_CONTRACT_V2.md`, `09_DOCS/COMPANION_INTEGRATION_GUIDE.md`, `09_DOCS/KNOWN_LIMITATIONS_GATE_F.md`.
- **Validation:**
  - `08_VALIDATION/scripts/browser_companion_test_f.py`
  - `08_VALIDATION/runtime_f/companion_runtime_report_f.json`
  - `08_VALIDATION/runtime_f/gpu_test_f.json`
  - screenshots `08_VALIDATION/runtime_f/f_*.png`

Stopped after Gate F. Gate G functional animations, Gate H cosmetics and full LifeQuest frontend development have not been started.
