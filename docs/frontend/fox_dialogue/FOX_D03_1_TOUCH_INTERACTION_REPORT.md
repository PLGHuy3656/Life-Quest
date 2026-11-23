# FOX-D03.1 — Touch Interaction Dialogue Report

**Branch:** `fix/FE`
**Scope:** Frontend UI & standalone mascot dialogue catalog only (`front-end/`, `mascot/fox-v2/dialogues/`, `docs/frontend/fox_dialogue/`).
**Untouched boundaries:** `backend/`, `front-end/src/mascot/*` (Gate I SDK), GLB assets, and `socialContracts.ts`.

---

## 1. Dialogue Catalog Expansion

Added a new standalone Vietnamese touch dialogue collection at [`mascot/fox-v2/dialogues/touch.json`](file:///D:/Development/LifeQuest_Repo/mascot/fox-v2/dialogues/touch.json) and extended [`mascot/fox-v2/dialogues/schema.json`](file:///D:/Development/LifeQuest_Repo/mascot/fox-v2/dialogues/schema.json) and [`catalogLoader.ts`](file:///D:/Development/LifeQuest_Repo/front-end/src/features/mascot/dialogue/catalogLoader.ts):

| Event | Line Count | Emotion / Tone | Verified Gate I Animation |
| --- | ---: | --- | --- |
| `TOUCH_SINGLE` | 10 | Friendly greeting / warmth | `FRIEND_GREETING` |
| `TOUCH_REPEAT` | 10 | Playful teasing / encouragement | `FRIEND_CHEER` |
| `TOUCH_SLEEP` | 7 | Gentle sleepy reaction | `SLEEP_ENDED` |
| `TOUCH_RETURN` | 7 | Welcome-back warmth | `USER_RETURNED` |
| **Touch subtotal** | **34** | Distinct Vietnamese lines (requirement: ≥ 30) | Guarded by `!voiceBusy` |
| **Full catalog total** | **199** | 8 categories validated at runtime & in tests | Zero duplicate IDs/texts |

---

## 2. Touch Detection & Classification

- **Accessible, tightly bounded hit target:** Added `<button type="button" className={styles.foxTouchTarget} aria-label="Chạm vào Fox" data-testid="fox-touch-target" />` inside `mascot-decorated-stage` in [`FoxCompanionRail.tsx`](file:///D:/Development/LifeQuest_Repo/front-end/src/components/shell/FoxCompanionRail.tsx) and [`FoxCompanionRail.module.css`](file:///D:/Development/LifeQuest_Repo/front-end/src/components/shell/FoxCompanionRail.module.css).
  - Bounded to `112×152px` (`bottom: 18px`, centered horizontally over Fox's visible body), `< 40%` of the stage width — clicks elsewhere in the Companion panel never trigger Fox touches.
  - Layered at `z-index: 2`, safely below `FoxSpeechBubble` (`z-index: 4`) so bubble dismissal is never intercepted, and outside Quick Create and collapse controls.
  - Native `<button type="button">` supports mouse click, mobile tap, and keyboard `Enter` / `Space` without mouse+touch double firing, with an accessible `:focus-visible` ring.
- **Deterministic classifier:** [`touchClassifier.ts`](file:///D:/Development/LifeQuest_Repo/front-end/src/features/mascot/dialogue/touchClassifier.ts) (`FoxTouchClassifier`):
  - `250ms` debounce prevents accidental double-fire.
  - `TOUCH_SLEEP` fires **only** when verified mascot state indicates sleep/rest (`companion.settings.activity === 'resting' || companion.settings.mood === 'sleepy'`); never inferred from wall-clock time.
  - `TOUCH_RETURN` fires when touching Fox after a verified inactivity gap (`≥ 10 minutes`).
  - `TOUCH_REPEAT` fires on repeated touches within `4s`; otherwise `TOUCH_SINGLE`.

---

## 3. Priority, Cooldown & Animation Safety

- Touch events carry priority `40` (`TOUCH_SINGLE`, `TOUCH_REPEAT`) and `42` (`TOUCH_SLEEP`, `TOUCH_RETURN`) in [`types.ts`](file:///D:/Development/LifeQuest_Repo/front-end/src/features/mascot/dialogue/types.ts).
- In [`FoxDialogueEngine.ts`](file:///D:/Development/LifeQuest_Repo/front-end/src/features/mascot/dialogue/FoxDialogueEngine.ts):
  - Touch events interrupt lower-priority chatter (e.g., `IDLE_CHATTER`) immediately and can smoothly replace an active touch line after their `1.2s` per-event cooldown.
  - Touch events are explicitly blocked (`reason: 'blocked_by_urgent_alert'`) while an urgent deadline alert (`priority ≥ 70`, e.g., `DEADLINE_15M`, `DEADLINE_OVERDUE`) is active.
  - Gate I mascot animations are only published when `companion.voicePhase === 'idle'` (never interrupting active voice assistant states), and zero extra WebGL canvases are created (`canvases === 1`).

---

## 4. Visual QA Verification (4 Viewports)

Captured live screenshots after dismissing initial greeting and clicking `fox-touch-target`:

| Viewport | Trigger | Canvas Count | Bubble Bounds (`top..bottom`) | Touch Target (`top..bottom`, `W×H`) | Screenshot |
| --- | --- | ---: | --- | --- | --- |
| `1024×900` | `TOUCH_SINGLE` | 1 | `230..282px` | `298..450px` (`112×152`) | [fox_d03_1_touch_1024x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fox_dialogue/screenshots/fox_d03_1_touch_1024x900.png) |
| `1280×900` | `TOUCH_SINGLE` | 1 | `230..282px` | `298..450px` (`112×152`) | [fox_d03_1_touch_1280x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fox_dialogue/screenshots/fox_d03_1_touch_1280x900.png) |
| `1440×900` | `TOUCH_SINGLE` | 1 | `230..282px` | `298..450px` (`112×152`) | [fox_d03_1_touch_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fox_dialogue/screenshots/fox_d03_1_touch_1440x900.png) |
| `1920×1080` | `TOUCH_SINGLE` | 1 | `230..282px` | `298..450px` (`112×152`) | [fox_d03_1_touch_1920x1080.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fox_dialogue/screenshots/fox_d03_1_touch_1920x1080.png) |

All 4 viewports maintain a 16px vertical clearance between the speech bubble and Fox's touch target with zero clipping or overlap against Fox's ears, Quick Create, or Header.

---

## 5. Automated Verification Gates

- `npm run typecheck` — PASS (`tsc -b --noEmit`, 0 errors)
- `npm run lint` — PASS (0 warnings, 0 errors)
- `npm run build` — PASS (production Vite bundle)
- `npm run test` — PASS (14 test files, 53 tests including `FOX-D03.1 Touch Interaction Dialogue`)
- `npm run test:e2e` — PASS (Playwright suite including `FOX-D03.1 touch interaction`)
