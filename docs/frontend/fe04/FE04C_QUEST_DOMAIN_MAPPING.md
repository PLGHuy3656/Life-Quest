# FE-04C — Quest Domain Model & Authoritative Backend Mapping

**Branch:** `fix/FE` (uncommitted — awaiting visual approval)
**Authoritative Schema Audited:** `D:\Development\LifeQuest_Repo\backend\prisma\schema.prisma`

---

## 1. Authoritative UI ↔ Backend Entity Mapping

| UI Concept (LifeQuest Product) | Authoritative Backend Model | Verified Endpoints | Notes & Limitations |
| --- | --- | --- | --- |
| **Quest (Hành trình — parent journey)** | `Goal` | `GET /goals`, `GET /goals/:id`, `POST /goals`, `PATCH /goals/:id`, `POST /goals/:id/{pause,resume,complete,archive}` | Single-owner (`userId`) today. No `mode`, `deleteGoal`, or `restoreGoal` endpoint yet. |
| **Task (Nhiệm vụ — atomic work item)** | `Quest` | `GET /quests`, `GET /quests/:id`, `POST /quests`, `PATCH /quests/:id`, `DELETE /quests/:id`, `POST /quests/:id/{archive,restore,pin,unpin}` | Links to parent Quest via `goalId` and optional stage via `milestoneId`. |
| **Milestone (Cột mốc — optional stage)** | `Milestone` (under `Goal`) | `GET/POST /goals/:goalId/milestones`, `PATCH/DELETE`, `complete`, `reorder` | Optional organizational stage. Does **not** replace Task completion as Quest progress. |
| **Habit (Thói quen — recurring)** | *None (`PENDING`)* | *None* | Isolated prototype modal + schedule on `/work/habits`. |
| **Collaborative Members / Invitations / Assignees** | *None (`PENDING`)* | *None* | `schema.prisma` has no `Friendship`, `QuestMember`, `QuestInvitation`, or `Quest.assigneeId`. |
| **Quest Discussion / Activity Feed** | *None (`PENDING`)* | *None* | Deferred until Social Backend branch is merged. |

---

## 2. Quest Progress Calculation Policy (`computeQuestProgress`)

- **Authoritative source:** Linked active Tasks (`Quest[]` where `q.goalId === goal.id`, excluding `status === 'ARCHIVED'` and `deletedAt !== null`).
- **Formula:** `percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0`.
- **Safety rules:**
  - `0` linked Tasks renders `0%` with an honest call-to-action to add the first Task — never fake `100%`.
  - Milestone completion count never overrides Task completion progress.
  - `nextActionableTask` is deterministically selected via `sortTasksByActionPriority()` (overdue → due soon → today → upcoming → unscheduled).
  - Local UI toggles never claim persisted completion or award XP/Coins.


---

## 3. FE-04C.3 Finalized Hierarchy Audit: `Quest → Epic → Task`

- **UI `Epic` = Authoritative Backend `Milestone` under `Goal`:**
  - `schema.prisma` already defines `Milestone.goalId -> Goal.id` and `Quest.milestoneId -> Milestone.id` (`Milestone.quests: Quest[]`).
  - No new Backend `Epic` table or migration is required.
  - Every visual checkpoint on `QuestCheckpointMap` represents an ordered `Epic` (`Milestone`).
  - Clicking an Epic checkpoint selects and filters the **Tasks Grouped by Epic** workspace (`groupTasksByEpic`).
  - `groupTasksByEpic` deduplicates linked Tasks by `id` (zero duplicate Tasks across Epics), computes each Epic's progress strictly from verified completed Tasks (`completedCount / totalCount`), and aggregates Quest progress across all Epics.
- **Explicit Backend Gap Documented:**
  - `Quest.milestoneId` is nullable in `schema.prisma`. Tasks created without an Epic (`milestoneId === null`) are rendered in a dedicated `"Chưa gắn Epic"` bucket so no Task is hidden or duplicated.
  - Collaborative Epics (`collab-preview-1`) remain isolated preview fixtures (`COLLABORATIVE PREVIEW • PENDING API`) until Backend Collaboration API is implemented.
