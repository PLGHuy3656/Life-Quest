# FE-04A.1 — Pin & Task Detail Root Cause Diagnosis

**Reported Issue:** *"Pinning a task does not produce the expected Task Detail behavior."*

---

## 1. Root Cause Analysis (Confirmed Frontend Bugs — Zero Backend Changes Needed)

Inspection of `PinnedTaskRail.tsx`, `WorkPage.tsx`, `TaskDetailSheet.tsx`, `useWorkData.ts`, and `dashboardRepository.ts` identified **4 concrete Frontend issues**:

1. **Missing Click / Navigation Wiring in `PinnedTaskRail.tsx`:**
   - Pinned task snippets (`data-testid="rail-pinned-snippet"`) were rendered as static `<article>` elements with **no `onClick` handler** and no route/detail wiring. Clicking any pinned item did nothing.
   - In collapsed rail mode, clicking a pinned icon button only toggled rail expansion (`toggleCollapsed`) instead of opening the task detail.
2. **No Cross-Route Task Detail Identifier:**
   - `WorkPage` stored `detailQuestId` in local `useState`, so `PinnedTaskRail` (which lives in shared `AppShell` across `/`, `/work/habits`, `/work/quests`, `/calendar`, etc.) had no stable way to navigate to and open a specific task's detail sheet.
3. **Preview Mode Pin Desynchronization:**
   - In unauthenticated preview mode, `WorkPage` blocked pin toggles with a static error banner, while `dashboardRepository` (`PinnedTaskRail`) and `useWorkData` (`WorkPage`) read independent copies of `MOCK_QUESTS`. Pinning/unpinning therefore did not reflect in `PinnedTaskRail` during preview review.
4. **Filtered-List Detail Lookup Gap:**
   - `WorkPage` looked up `detailQuest` only inside `rawQuests` (filtered by active bucket/search/goal). If a user clicked a pinned `ACTIVE` task from `PinnedTaskRail` while viewing `Lưu trữ` (`ARCHIVED`) or a filtered subset, `detailQuest` resolved to `null`.

---

## 2. Implemented Fixes

- **Interactive Pinned Snippets ([PinnedTaskRail.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/components/shell/PinnedTaskRail.tsx)):** Converted each pinned snippet to a full-width accessible `<button type="button">` (preserving exact visual styling) that navigates to `/work/tasks?task=${encodeURIComponent(quest.id)}` in both expanded and collapsed rail states.
- **Route-Synced Detail State ([WorkPage.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/WorkPage.tsx)):** Bound `detailQuestId` to URL query parameter `?task=<id>` via `useSearchParams()`, resolving `detailQuest` across both filtered `rawQuests` and unfiltered `allActiveQuests`. Closing `TaskDetailSheet` cleanly removes `?task`.
- **Event Isolation:** Pin toggle button calls `e.stopPropagation()` so clicking Pin never opens Detail, and clicking Detail never toggles Pin.
- **Unified Preview + Live Sync ([previewWorkState.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/services/repositories/previewWorkState.ts), [useWorkData.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/hooks/useWorkData.ts), [dashboardRepository.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/services/repositories/dashboardRepository.ts)):**
  - **LIVE authenticated mode:** Calls real `POST/DELETE /api/v1/quests/:id/pin`, invalidates `['work', 'quests']`, `['dashboard', 'quests']`, and `['dashboard', 'today']`, emits `PIN_UPDATED` to Fox, and propagates any Backend failure without faking success.
  - **MOCK preview mode:** Updates shared in-memory `previewQuests` and invalidates the same query keys so `PinnedTaskRail` and `TaskDetailSheet` stay 100% synchronized during visual review.

---

## 3. Verified Behavior

- Pinning/unpinning on a Task card updates `PinnedTaskRail` immediately without opening `TaskDetailSheet`.
- Clicking a pinned task in `PinnedTaskRail` from `/work/quests` (or any route) navigates to `/work/tasks?task=<id>` and opens its exact `TaskDetailSheet`.
- Toggling `Bỏ ghim` / `Ghim lên thanh trái` inside `TaskDetailSheet` immediately updates `PinnedTaskRail` count and list.
- Verified by unit tests ([WorkPage.test.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/WorkPage.test.tsx)) and Playwright E2E ([work.spec.ts](file:///D:/Development/LifeQuest_Repo/front-end/e2e/work.spec.ts)).
