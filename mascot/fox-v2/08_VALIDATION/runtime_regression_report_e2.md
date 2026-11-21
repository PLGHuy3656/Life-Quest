# LifeQuest Fox V2 — Gate E2 · Runtime Regression Report (E1 → E2)

**Status: no regressions.** The E2 page passes **every E1 check** plus the E2 checks:
- **29/29** in headless Chrome with real mouse input and all 3 presentation sizes (final build)
- On a **real GPU** (AMD Radeon 780M): **16/16** on run 1, and **15/16** with the final build. The 16th check (live HUD) couldn't run because the app window was hidden at that moment

Waiting for visual approval.

| | E1 (approved, unchanged) | E2 |
|---|---|---|
| Page | `07_WEB_PREVIEW/fox_interactive_e1.html` `1cf7c065…` | `07_WEB_PREVIEW/fox_interactive_e2.html` `3ec68b1e…` |
| GLB | `fox_v2_anim_e1.glb` `eabde5b2…` (2.65 MB) | `fox_v2_anim_e2.glb` `e884d675…` (2.71 MB) |
| Clips | idle 5.000 · walk 1.667 · run 1.167 · happy 2.292 · wave 2.625 · head_pet 2.792 · tail_touch 2.708 s | idle 6.000 · walk 1.667 · run 1.167 · happy 2.542 · wave 2.792 · head_pet 3.125 · tail_touch 2.875 s |
| Runtime names, skeleton, morph contract | 7 clips, 28 joints, 14 face meshes | **identical** (checked in the browser) |

## 1. Regression suite (E1 checks on the E2 page, headless Chrome + SwiftShader, real mouse)

| Check | E1 | E2 |
|---|---|---|
| GLB loads, 7 clips, durations = spec from t = 0 | PASS | PASS |
| Morph contract = D1.1 / skeleton unchanged | PASS | PASS |
| Seamless loops | wrap 0.000°, periodicity ≤ 0.025° | wrap 0.000°, periodicity ≤ 0.025° |
| Foot sliding during GLB playback (per 1/120 s) | walk 0.018 / run 0.105 mm | **walk 0.018 / run 0.105 mm** (feet identical) |
| Transitions | weight sum 1.000, no pops | weight sum 1.000. Largest step 10.73° = the wave's own snappy arm raise played alone, so a transition never exceeds the clip itself. All 4 one-shots return to base |
| Look-at clamp / damping | 40.1° / 20° | 37.0° total (≤ 40°), pitch ≤ 20°. Real mouse after an ~80° jump: speed 2.2°/frame, acceleration 0.22°/frame² (E1: 3.45 / 0.66 — softer) |
| Clip owns the head → look-at yields | look weight 0.000, Δ 0.00° | look weight 0.000, Δ 0.00° |
| Picking head / tail / body (+ occlusion) | PASS | PASS |
| Real hover, click head, stroke head, click tail, body click / orbit | PASS | PASS |
| Expressions via morphs, clip face priority | PASS | PASS |
| Level scale 0.8–1.1 | 0.800 / 1.100 | 0.800 / 1.100 |
| UI (base loop, one-shot, expression, Lv) | PASS | PASS |
| HUD stats / console errors | PASS / none | PASS / none |

## 2. New in E2

| Check | Result |
|---|---|
| **Dead zone + input smoothing** | ±0.6 % cursor jitter: target changes by **0.000°** and head direction by 0.03° (dead zone 3° yaw / 2° pitch). Mouse moves < 3 px don't count as activity |
| **Gentle return** | After 6 s at rest the target eases from 37° to 14.4° (35 %). When the pointer leaves, the head glides back to the clip's own motion within 3 s (offset 0.34°), max acceleration 0.024°/frame² |
| **Look-at fix found during E2** | E1 smoothed the cursor minus the clip's head, so fast idle head moves made tracking lag (6.7°). E2 smooths the desired direction and compensates for the clip instantly: the lag is gone (0.03°) |
| **Idle variation layer** | 40 s of idle (seed 7): 25–26 events (blink, ear twitch, glance, tail flick, tempo). 0 events during head_pet |
| **Presentation sizes** (real mouse: hover head → `head`, click → `head_pet`, look target 37°) | **small** 200×200 CSS px (DPR 2): margin ≥ 14.6 px · **medium** 360×440 CSS px (DPR 2): margin ≥ 52.9 px · **large** full UI: margin ≥ 142 px. Margins are the smallest gap between the fox and the canvas edge, over the projected vertices, at level scale 1.1 and through the happy and tail_touch jumps |

`small` and `medium` show no floor checker or fog (soft shadow only) and no side panel; `medium` has a mini bar (idle / walk / run / happy / wave). The camera frames itself per size and aspect ratio.

## 3. GPU-backed browser test (real hardware)

- **Environment:** your Windows machine, Claude desktop app built-in browser (Chromium 156), **ANGLE D3D11 on an AMD Radeon 780M** (integrated GPU), DPR 1.5, 60 Hz.
- **How it was served:** a temporary localhost-only server (127.0.0.1:8765), stopped after the test. Three.js r170 came from the real CDN.
- Details: `08_VALIDATION/runtime_e2/gpu_test_e2.json`

| Size | Canvas (device px) | rAF fps | p95 frame | Cost per frame (anim + render + GPU finish) |
|---|---|---|---|---|
| large | 733 × 582 | 59–60 (idle, walk, run, happy, tail_touch) | 16.8 ms | p50 0.5 ms · p95 0.9–1.3 ms |
| medium | 540 × 660 | 59.6–60 | 16.8–16.9 ms | p50 0.5 ms · p95 1.1 ms |
| small | 300 × 300 | 59–60 | 16.8–16.9 ms | p50 0.5 ms · p95 0.9 ms |

- 73,844 tris, 49 draw calls. **runChecks() on the GPU: 16/16 PASS in 1.3 s (run 1).**
- **Run 2, final build** (after re-timing tail_touch): 15/16 PASS on the same GPU. The 16th check (live HUD statistics) couldn't be evaluated because the desktop app window was hidden (`visibilityState = hidden`), so no animation frames were delivered. The FPS numbers are from run 1, which uses the same viewer code.
- **Single missed frames (33–50 ms):** a few appeared while you were moving the pointer and clicking in the pane during the test (330 pointer events in 9 s). Picking costs 0.1–0.3 ms and the render call peaks at 8 ms, so they don't come from the companion's per-frame work.
- **Verdict:** on a desktop integrated GPU the companion uses about 1 ms of a 16.7 ms frame. **This is not a mobile performance approval:** phones, low-end GPUs and battery impact still need testing (Gate F).

## 4. How to rerun

```
python 08_VALIDATION/scripts/browser_anim_test_e2.py     # headless regression + sizes, writes runtime_e2/
python -m http.server 8765 --bind 127.0.0.1             # in the project folder, then open:
#   http://127.0.0.1:8765/07_WEB_PREVIEW/fox_interactive_e2.html?size=small|medium|large
#   and in the console: runChecks()
```
