# FE-00 — Fox V2 Gate I Mascot Integration Plan

Based on `COMPANION_INTEGRATION_GUIDE.md`, `FOX_RUNTIME_CONTRACT_V2.md`, `FOX_G2_EVENT_CONTRACT.md`, `FOX_G3_EVENT_CONTRACT.md`, `FOX_H1_COSMETIC_CONTRACT.md`, `FOX_H2_OUTFIT_LIBRARY.md`, and `FOX_I_VOICE_EVENT_CONTRACT.md`.

---

## 1. Embedding Strategy in React

Embed the framework-agnostic Gate I SDK (`src/mascot/`) via **two thin, reusable React layers** in `src/features/mascot/`:

1. **`CompanionProvider` (App-Root Context):**
   - Owns the typed event bus (`publish<E extends FoxEventName>(event, payload)`), mascot user settings (`enabled`, `lookAt`, `reactions`, `effects`, `reducedMotion`, `size`, `outfit`), and the active-slot arbiter (ensuring **at most one live 3D WebGL context** is active at any time).
   - Syncs `level`, `streak`, and `outfit` state from the user profile store into whichever `FoxController` instance is currently active.
2. **`FoxCompanionView` (Reusable Wrapper Component):**
   - Adapts Gate I's `FoxCanvas.tsx` for three presentations:
     - `mini` (`80–110px` desktop / `76px` mobile): used inside `FloatingMascotDock` (preserving Claude Canvas drag, edge-snap, peek, recall `#lq-mc-recall`, and auto-hide on `html.lq-camopen`). Requests `powerPreference: 'low-power'`.
     - `widget` (`320–360px`): used in Dashboard Companion Card or Voice Assistant sheet.
     - `full` (`100%` container, `orbit` enabled): used in Wardrobe / Shop / Companion fullscreen page.
   - Automatically handles `IntersectionObserver` pause (`100px` pre-roll), `document.hidden` pause, `FoxRenderBinding` lifecycle, WebGL/GLB error fallback to `public/fox_poster.png`, and `suspended` prop (pauses loop without unmounting WebGL context to avoid ~0.9 s re-creation cost).

---

## 2. Decoupled Event Architecture (Zero Coupling to Animation Files)

UI components **never** reference clip names (`quest_complete`, `task_notebook_confirm`, etc.) or `.glb` URLs:

```text
[UI Feature Page] ──▶ companionBus.publish('QUEST_COMPLETED', { questId, xp })
                                │
                                ▼
                    [CompanionProvider / Adapter]
                                │
                                ▼
               FoxController.handleEvent('QUEST_COMPLETED', payload)
                                │
                                ▼
                 FoxEventMap.ts (resolves clip, priority,
                 cooldown, fallbackSteps, reducedMotionSteps)
```

### Key Frontend → Mascot Event Bindings

| Frontend Action / State | Published Semantic Event | Fox V2 Gate I Reaction |
|---|---|---|
| User completes a Task | `TASK_COMPLETED` | `happy` |
| User completes a Quest / Milestone | `QUEST_COMPLETED`, `XP_GAINED` | `quest_complete` → queued `receive_xp` |
| User levels up | `LEVEL_UP` (`{ level }`) | `level_up` (uniform scale applied at jump apex) |
| User checks in Habit / Streak updates | `HABIT_CHECKED_IN`, `STREAK_UPDATED` (`{ days }`) | `proud` pulse + 4-tier streak flame (`streak_active` base) |
| Focus / Study session starts / ends | `STUDY_STARTED` / `STUDY_COMPLETED` | `study_start` → `study_focus` (notebook + pencil) → `study_complete` |
| Voice Assistant flow (Host-driven) | `VOICE_LISTEN_STARTED` → `VOICE_LISTENING` → `VOICE_PROCESSING` → `TASK_SUGGESTION_READY` → `TASK_NOTEBOOK_OPEN` → `TASK_WRITING` | Listening waves → thinking dots → suggestion badge → seated notebook writing loop |
| **Task persisted by API / store** | **`TASK_CREATED`** (`{ taskId }`) | **`task_notebook_confirm`** (checkmark flourish, closes notebook, stands up proud). **Never triggered by timers.** |
| User cancels / retries / mic denied | `VOICE_CANCELLED` / `VOICE_RETRY_REQUESTED` / `VOICE_PERMISSION_DENIED` | Cleanly cancels voice states & hides props without confirm; plays `voice_retry` on retry/denied |
| User equips outfit in Wardrobe | `fox.setOutfit('outfit_mage')` / `fox.equip(itemId)` | Skinned mesh binding on Fox skeleton; automatic `HAND_RIGHT` hand-busy hiding when `PencilProp` is active |

---

## 3. Runtime Asset Loading & Caching Strategy

- **Asset Location:** Served statically from `front-end/public/models/` (copied at dev/build time from `mascot/fox-v2/06_EXPORTS/glb/`):
  - Base GLB: `fox_v2_anim_e2.glb` (2.71 MB, immutable cache headers)
  - 4 Animation-Only Modules (loaded **in parallel** with the base GLB via Gate I's optimized `FoxModelLoader.ts`):
    - `fox_v2_g1_1_quest_reward_streak.anim.glb` (1.12 MB)
    - `fox_v2_g2_1_daily_life.anim.glb` (2.10 MB)
    - `fox_v2_g3_challenge_social.anim.glb` (1.97 MB)
    - `fox_v2_i_voice_assistant.anim.glb` (0.85 MB)
  - Cosmetics (lazy-loaded on demand per equipped item, 11 KB – 137 KB each, refcounted with 5 s keep-alive).
- **Graceful Degradation:** If any animation module fails to load (offline/slow network), `FoxModelLoader` drops only that module and `FoxEventMap` automatically executes `fallbackSteps` using the core E2 clips/morphs. If WebGL2 is unavailable, `FoxCompanionView` renders `fox_poster.png`.

---

## 4. Performance, Rendering & Cleanup Constraints

1. **Single Active WebGL Context Rule:** Never mount `FloatingMascotDock` and `Wardrobe` 3D canvases simultaneously. When a full-page mascot view mounts, the floating dock switches to `suspended={true}` (or hides its canvas while keeping state).
2. **DPR & Low-Cost Mode:** Cap `dpr={[1, 2]}`. Automatically enable `fox.setLowCostEffects(true)` on `presentation="mini"` and mobile viewports (`<= 640px`).
3. **Zero Idle GPU Burn:** Switch R3F `frameloop` to `'never'` and call `fox.pause()` whenever the canvas is offscreen, tab is hidden (`visibilitychange`), camera overlay is open (`html.lq-camopen`), or mascot is tucked into peek/hidden mode.
4. **Reduced Motion Parity:** Bind both OS `prefers-reduced-motion: reduce` and LifeQuest's `html.lq-rm` setting directly to `fox.setReducedMotion(true)`.
5. **Memory Teardown:** On unmount, `FoxController.dispose()` releases `FoxRenderBinding`, hit proxies, cloned skeletons, effects, and cosmetics; `purgeFoxAssetCache()` / `purgeCosmeticCache()` clear templates when refs reach 0.
6. **Hardware Benchmark Note:** Gate I validation used headless Chromium + SwiftShader (CPU); FE-03/FE-04 should capture real-device GPU frame times on desktop and mobile before production launch.
