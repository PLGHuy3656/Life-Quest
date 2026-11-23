# FOX-D03 — Contextual Dialogue & Personality Engine Architecture

**Branch:** `fix/FE`  
**Source-of-Truth Catalog:** `mascot/fox-v2/dialogues/` (`165` distinct Vietnamese lines across 7 JSON collections + `schema.json`)  
**Engine Implementation:** `front-end/src/features/mascot/dialogue/` (strictly outside the immutable Gate I SDK `front-end/src/mascot/`).

---

## 1. Architecture Overview

```text
mascot/fox-v2/dialogues/*.json  (165 lines, 7 categories, schema-validated)
            │
            ▼ (@dialogues alias)
    catalogLoader.ts            (validateDialogueCatalog, timeOfDay filter)
            │
            ▼
    FoxDialogueEngine.ts        (priority, weighted pick, repeat avoidance,
            │                    per-event & global cooldowns, dedupe, queue, pause)
            ▼
    dialogueBus.ts              (typed singleton pub/sub + auto-expire timer)
            │
            ├── FoxCompanionRail.tsx  (idle timer, deadline monitor, UI pause flags,
            │                          CompanionProvider event & Gate I bridge)
            └── FoxSpeechBubble.tsx   (overhead HTML/CSS bubble + emotion variants)
```

---

## 2. Core Capabilities

1. **Standalone Validated Catalog (`mascot/fox-v2/dialogues/`):**
   - `idle.json` (**35**), `encouragement.json` (**22**), `dashboard.json` (**22**), `social.json` (**22**), `task.json` (**28**), `deadline.json` (**22**), `system.json` (**14**) = **165 distinct lines** (target ≥ 145).
   - Validated via `validateDialogueCatalog()` for unique IDs, unique text, length (`4..140` chars), valid emotions, and per-category minimums.
2. **Arbitration & Anti-Spam (`FoxDialogueEngine`):**
   - **One active bubble at a time.**
   - **Priority interruption:** Higher-priority events (e.g. `DEADLINE_15M` = 85, `DEADLINE_OVERDUE` = 95) immediately interrupt lower-priority/idle chatter (`10..15`). Idle chatter never interrupts active speech.
   - **Repeat avoidance:** Tracks recent spoken IDs per event (`maxRecentPerEvent = 6`) so lines never repeat in loops.
   - **Cooldowns & deduplication:** Enforces per-event cooldowns, global cooldown (`4s`), and permanent session `dedupeKey` suppression (e.g. `deadline:<questId>:<threshold>`).
3. **Idle Chatter & Pause Awareness:**
   - Fires after `45s` of user inactivity, cycling across `IDLE_CHATTER`, `ENCOURAGEMENT`, and `TASK_SUGGESTION`.
   - Automatically pauses while: user is typing (`INPUT`/`TEXTAREA`/contentEditable), any modal/sheet/Voice Assistant is open, `SocialMediaLightbox` is open, `FoxCompanionRail` is collapsed, or `document.visibilityState === 'hidden'`.
   - All timers and DOM listeners are strictly cleaned up on unmount.
4. **Timezone-Safe Deadline Monitor (`deadlineMonitor.ts`):**
   - Evaluates real ISO `quest.dueAt` timestamps from LIVE `GET /api/v1/quests` against UTC epoch `Date.now()`.
   - Triggers at `60m` (`alert`), `15m` (`panic`), and `overdue` (`panic`), ignoring completed/archived/deleted quests and deduplicating `(questId, threshold)` across navigation.
   - Provides an optional `Mở nhiệm vụ →` link to `/work`.
   - Defines `NotificationServiceAdapter` for future Backend Notification integration; **no fake push notifications** are implemented.
5. **Overhead Bubble & Emotion Variants (`FoxSpeechBubble.tsx`):**
   - Reuses the FOX-D02 overhead HTML/CSS bubble above Fox's ears (`top: 8px`) with subtle `emotionWarm`, `emotionAlert`, and `emotionPanic` styling.
   - Respects `html.lq-rm` and `prefers-reduced-motion: reduce`, supports `Escape` dismissal, and never touches WebGL or Gate I GLB assets.
