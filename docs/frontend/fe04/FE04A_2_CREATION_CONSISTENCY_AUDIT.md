# FE-04A.2 — Shared Creation Consistency Audit

**Shared Contract:** [creationContract.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/creationContract.ts)

---

## 1. Standardized Entity Type vs Category Separation

Previously, `FoxCompanionRail` mixed entity types (`Task`, `Thói quen`) with Backend `QuestType` categories (`Focus`, `Thời lượng`). FE-04A.2 separates them cleanly across all creation entry points:

- **Entity Type (`WorkEntityType`):**
  - `TASK` (`Nhiệm vụ`) → **LIVE** (`POST /api/v1/quests`)
  - `HABIT` (`Thói quen`) → **PENDING** (Backend has no `Habit` table/route; shows honest `PENDING` notice, never fakes creation)
  - `QUEST` (`Hành trình`) → **LIVE** (`POST /api/v1/goals`)
- **Task Category (`QuestType`):** Separate field (`SIMPLE`, `FOCUS`, `DURATION`, `QUANTITY`, `PROGRESS`) used exclusively when creating/editing a `TASK`.
- **Shared Validation:** `validateCreationTitle(title)` enforces 3–100 characters matching Backend Joi rules, and all submit buttons guard against duplicate submissions via `isPending`.

---

## 2. Entry Point Matrix

| Entry Point | File | Entity Types Supported | Draft Persistence | Duplicate Guard | Capability Honesty |
| --- | --- | --- | --- | --- | --- |
| **Fox Quick Create** | [FoxCompanionRail.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/components/shell/FoxCompanionRail.tsx) | `TASK` (LIVE), `HABIT` (PENDING notice), `QUEST` (LIVE) via `fox-entity-type-pill` | `uiStore.quickCreateDraft` & `quickCreateEntityType` persist across collapse & route changes | `disabled={isSubmitting}` | Never fakes Habit creation or unauthenticated saves |
| **Quick Create Sheet** | [DashboardSheets.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/dashboard/DashboardSheets.tsx) | `TASK` + separate Category dropdown, `HABIT` (PENDING), `QUEST` (LIVE) | Local form state | `createQuest.isPending \|\| createGoal.isPending` | Explicit `(LIVE)` / `(PENDING)` labels |
| **Task Page Create Sheet** | [WorkPage.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/WorkPage.tsx) | `TASK` (LIVE) with separate `Category`, `startAt`, `dueAt`, `priority`, `goalId`, `milestoneId`, `proofRequirement` | Modal form | `createQuest.isPending` | Honest preview-mode notice if unauthenticated |
| **Habit Page Create CTA** | [HabitsPage.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/HabitsPage.tsx) | `HABIT` (disabled `PENDING`) | N/A | Disabled | Explicit `PROTOTYPE • PENDING API` |
| **Quest Page Create Sheet** | [QuestsPage.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/QuestsPage.tsx) | `QUEST` (`POST /api/v1/goals`, LIVE) | Modal form | `createGoal.isPending` | Honest preview-mode notice if unauthenticated |

---

## 3. Visual QA Screenshot

- **Fox Quick Create Entity Type Selection (`Quest` active) `1440×900`:** [fe04a2_quickcreate_quest_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a2_quickcreate_quest_1440x900.png)
