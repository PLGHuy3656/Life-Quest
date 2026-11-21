# LifeQuest Fox V2 — Companion Sandbox (Gate F + Gate G1 module)

React 18 + TypeScript + three.js r170 + React Three Fiber 8. A runtime foundation for embedding
the 3D Fox companion in LifeQuest Web. **This is not the LifeQuest app.** The dashboard here is a
simplified mock that shows how the companion fits into the interface.

- Model: the approved Gate E2 GLB `06_EXPORTS/glb/fox_v2_anim_e2.glb` (`e884d675…`). It is copied and hash-checked by `scripts/copy-assets.mjs`; the build stops on a mismatch.
- Gate G1 adds an animation-only module, `06_EXPORTS/glb/modules/fox_v2_g1_quest_reward_streak.anim.glb` (9 clips, no mesh), copied to `public/models/modules/` and bound to the same Fox at load time (every track validated). `?modules=0` disables it (fallback test).
- The character is not rebuilt. Skeleton, morph names, materials and clip names are unchanged (validated at load time against `src/mascot/foxContract.ts`).

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (copies + verifies the GLB first)
npm run build      # type-check + production build → dist/
npm run preview    # serve dist/ on http://localhost:4173
```

You can also run it without Node: `dist/` is a static build with relative paths. Serve the folder
from any static server (the GLB has to be fetched over HTTP, so `file://` does not work):

```bash
python -m http.server 8080 --directory dist      # then open http://localhost:8080
```

## Pages (hash routes)

| Route | What it shows |
|---|---|
| `#/dashboard` | Simplified LifeQuest dashboard with the **Dashboard Mini** (200 × 200) card and the **Companion Widget** (360 × 440). The task, habit and quest buttons only publish business events. |
| `#/companion` | **Full Companion View**: a large responsive stage with orbit, plus the runtime panel (level, mood, activity, clips, every LifeQuest event, toggles, live stats). |
| `#/lab` | Runtime lab: repeated mount / unmount, a companion parked offscreen, and the shared-GLB cache state. |
| `#/g1` | **G1 technical test harness** (not an app screen): animation selector by category, Play / Stop, streak tier chips + days, every registered event with G1 / coverage badges, effects master + per-category toggles, level slider, reduced motion, hit proxies, the in-page test suite (“Run tests”) and a runtime panel (module tracks, effects, flame). |

All three use the same `<FoxCanvas>` component and the same `FoxController` class. Nothing is
duplicated per mode except the per-instance pose.

URL switches for testing: `?seed=N` (idle variation seed), `?level=N`, `?rm=on|off|auto` (reduced
motion), `?glb=<url>` (another or a missing model, to test the error state), `?nowebgl=1` (forces the
poster fallback), `?capture=1` (preserveDrawingBuffer for screenshots), `?modules=0` (no animation modules).

## Source layout

```text
src/
  mascot/                      framework-agnostic runtime (no React)
    FoxController.ts           public façade: play / setMood / setLevel / setActivity / … / handleEvent / dispose
    FoxAnimationManager.ts     mixer, persistent base layer, one-shot priorities, queue, cross-fades
    FoxLookAtController.ts     procedural look-at (dead zone, low-pass, gentle return)
    FoxInteractionManager.ts   pointer + raycasting on bone-attached hit proxies
    FoxIdleVariation.ts        seeded idle variation + hover feedback layer
    FoxFaceController.ts       facial morphs (persistent mood + timed pulses)
    FoxLevelScale.ts           level → uniform scale, camera framing
    FoxEventMap.ts             typed LifeQuest event registry (extensible in Gate G)
    FoxModelLoader.ts          GLB load, contract validation, shared cache with refcount
    FoxRenderBinding.ts        per-renderer listener tracking on the shared GLB (leak fix)
    foxContract.ts             clip / morph / bone names, modules, streak tiers and tuning (single source of truth)
    effects/                   G1 effects: FoxEffectsManager (cues, layers, cleanup), StreakFlame, CharOverlay, fxLibrary, fxCore
    modules/                   module clip specs (cues) copied from 04_ANIMATIONS
    foxMath.ts                 springs, envelopes, PRNG, allocation-free bone ops
    index.ts                   public exports
  components/                  React integration (R3F canvas, fallback, context / event bus, cards)
  pages/                       Dashboard, Companion, Lab (unchanged by G1), G1LabPage + g1Tests (technical harness)
  App.tsx · main.tsx · styles.css
```

Read next: `09_DOCS/COMPANION_INTEGRATION_GUIDE.md` (how to embed it),
`09_DOCS/FOX_RUNTIME_CONTRACT_V2.md` (API and behaviour contract),
`09_DOCS/KNOWN_LIMITATIONS_GATE_F.md` / `KNOWN_LIMITATIONS_GATE_G1.md`, `08_VALIDATION/gate_f_runtime_report.md` and `08_VALIDATION/gate_g1_runtime_report.md`.

## Tests

`08_VALIDATION/scripts/browser_companion_test_f.py` runs headless Chrome with real mouse and touch
input against `dist/` (serve it on `127.0.0.1:4180` first). It writes
`08_VALIDATION/runtime_f/companion_runtime_report_f.json` plus screenshots. Headless Chrome uses
SwiftShader (no GPU), so its FPS figures are not performance evidence. GPU results are in the Gate F
runtime report.

Gate G1: `08_VALIDATION/scripts/browser_g1_test.py` (module binding, pose equivalence, the harness suite, level scaling, real-mouse petting during `streak_active`, GPU cleanup, module-off fallback) and `browser_companion_regress_g1.py --mode fallback|g1` (the unmodified Gate F suite against the G1 build). Results: `08_VALIDATION/runtime_g1/`.
