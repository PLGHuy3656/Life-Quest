# FE-04B.1 — Focus Session V1 Report

**Store:** [focusSessionStore.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/stores/focusSessionStore.ts)
**Component:** [FocusSessionCard.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/FocusSessionCard.tsx)

---

## 1. Architecture & Timer Lifecycle

- **Presets:** `15m` / `25m` (default) / `45m`. Presets are locked while a session is active to prevent accidental resets.
- **Controls:** `Bắt đầu` → `Tạm dừng` → `Tiếp tục`, plus `Đặt lại` and `Kết thúc` (both require inline confirmation before discarding an active session).
- **Drift-Free Timing:** Uses timestamp-based elapsed calculation (`remainingAtAnchorMs - (Date.now() - startedAtMs)`) with a `500ms` UI tick and `document.visibilitychange` resync when returning to a backgrounded tab. Timers and listeners are cleaned up on unmount.
- **Navigation Persistence & Single Active Session Invariant:**
  - Stored in Zustand (`useFocusSessionStore`) so navigating between routes inside the SPA does **not** destroy a running or paused session.
  - Only **one** active session may run globally; opening another task's detail page displays an explicit notice and requires confirmation before switching the active session to the new task.
- **Reduced Motion & Accessibility:** Respects `html.lq-rm` (disables progress bar transition), exposes `role="timer"`, `role="progressbar"`, `role="alertdialog"` for confirmations, and keyboard-accessible controls.

---

## 2. Fox Dialogue Integration

- `FOCUS_STARTED` (priority `45`) fires on start/resume; `FOCUS_PAUSED` (priority `32`) fires on pause/end.
- Verified in [FocusSession.test.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/FocusSession.test.tsx) that neither event can interrupt active urgent deadline alerts (`priority >= 70`).

---

## 3. Honest Local-Only Boundaries

- Does **not** persist completed sessions to Backend (no `/executions` route yet).
- Does **not** award XP, coins, or streak progress.
- Does **not** automatically mark the task completed when reaching `00:00`.
- Does **not** claim background OS notifications when the browser is closed.
