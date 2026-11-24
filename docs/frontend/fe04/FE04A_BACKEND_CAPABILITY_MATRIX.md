# FE-04A — Backend Capability Matrix (Task Page / Work Hub)

Verified directly against `D:\Development\LifeQuest_Repo\backend\src\routes\index.js`, `questsRoute.js`, `questsValidation.js`, `goalsRoute.js`, `milestonesRoute.js`, and `front-end/src/services/api/`.

| Capability | Status | Verified Endpoint / Contract | Notes for FE-04A UI |
| --- | --- | --- | --- |
| List Quests (`ACTIVE` / `ARCHIVED`, `goalId`, `milestoneId`, `search`) | **LIVE** | `GET /api/v1/quests` | Used via `useWorkQuestsQuery`. Date buckets (`Hôm nay`, `Sắp tới`, `Quá hạn`, `Hoàn thành`) and sorting are computed client-side from returned `Quest[]`. |
| Get Quest by ID | **LIVE** | `GET /api/v1/quests/:questId` | Available in `questsApi.getQuestById`. |
| Create Quest (`title`, `description`, `type`, `priority`, `dueAt`, `startAt`, `goalId`, `milestoneId`, `proofRequirement`, `targetValue`, `targetUnit`, `estimatedDurationSeconds`) | **LIVE** | `POST /api/v1/quests` | Joi-validated (`title` 3–100 chars, `description` ≤ 500, `priority` 0..32767). Emits `TASK_CREATED` to Fox dialogue bus. |
| Edit / Update Quest | **LIVE** | `PATCH /api/v1/quests/:questId` | Full support for editing title, description, type, priority, dueAt, goalId, milestoneId, proofRequirement. |
| Delete Quest | **LIVE** | `DELETE /api/v1/quests/:questId` | Soft-deletes quest and refreshes list + `PinnedTaskRail`. |
| Pin / Unpin Quest | **LIVE** | `POST /api/v1/quests/:questId/pin`, `DELETE /api/v1/quests/:questId/pin` | Invalidates `['work', 'quests']`, `['dashboard', 'quests']`, `['dashboard', 'today']` so shared `PinnedTaskRail` stays in sync. Emits `PIN_UPDATED`. |
| Archive / Restore Quest | **LIVE** | `POST /api/v1/quests/:questId/archive`, `POST /api/v1/quests/:questId/restore` | Supported in task card quick actions and Task Detail sheet. |
| List / Create / Edit / Pause / Resume / Complete / Archive Goals | **LIVE** | `/api/v1/goals/*` | Preserved in the secondary `Mục tiêu & Cột mốc` tab and used for Goal dropdowns & badges on tasks. |
| List / Create / Edit / Complete / Delete / Reorder Milestones | **LIVE** | `/api/v1/goals/:goalId/milestones`, `/api/v1/milestones/*` | Preserved in the secondary `Mục tiêu & Cột mốc` tab and used for Milestone association on tasks. |
| Quest Schedules CRUD | **LIVE** | `/api/v1/quests/:questId/schedules`, `/api/v1/schedules/:scheduleId` | Live in Calendar (`FE-04B` can surface schedule links directly in Task Detail). |
| Today Summary / Gamification / Streak (read-only) | **LIVE** | `GET /api/v1/today` | Read-only summary; no mutation endpoints for XP/coins/streak. |
| **Mark Quest Complete / Undo Complete** | **UNAVAILABLE** | No `/quests/:id/complete` or `/executions` route in `backend/src/routes/index.js` | Render a clearly disabled check button + `PENDING` badge in Task Detail explaining Execution API is not yet merged. **Never fake completion.** |
| **Award XP / Coins / Update Streak on Completion** | **UNAVAILABLE** | Dependent on Execution / Gamification mutation APIs | Display `xpReward` & `coinReward` as read-only preview chips only. **Never increment client-side.** |
| **Task Evidence / Proof Media Upload** | **UNAVAILABLE** | No upload/evidence route in Backend (`proofRequirement` metadata is LIVE) | Render `proofRequirement` badge (`Không cần` / `Tùy chọn` / `Bắt buộc`) and an honest `PENDING` evidence boundary box in Task Detail. |
| **Focus Timer / Execution Session Start & Log** | **PENDING** | `QuestExecution` schema exists in Prisma, but no `/executions` route is mounted yet | Defer interactive timer/execution logging to `FE-04B` once Backend merges Execution routes. |

---

## Recommended FE-04B Follow-up Tasks (After Visual Approval)

1. Wire real Quest completion / execution start-stop once Backend exposes `/executions` or `/quests/:id/complete`, then emit `TASK_COMPLETED` to `foxDialogueBus`.
2. Connect Task Evidence upload UI (reusing `FE-03.5J` local preview & lightbox components) once Backend exposes a verified proof upload endpoint.
3. Add inline schedule badge & quick-schedule link inside `TaskDetailSheet` using existing `schedulesApi`.
4. Add responsive Tablet/Mobile refinement pass for `/work` after Desktop visual approval.
