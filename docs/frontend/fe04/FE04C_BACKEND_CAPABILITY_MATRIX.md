# FE-04C — Backend Capability Matrix

**Audited Source:** `backend/prisma/schema.prisma`, `front-end/src/services/api/{goalsApi,milestonesApi,questsApi}.ts`

| Capability | Status | Backend Endpoint / Model | Frontend Behavior |
| --- | --- | --- | --- |
| List & Get Personal Quests | **LIVE** | `GET /goals`, `GET /goals/:id` (`Goal`) | Real query when authenticated; `MOCK_GOALS` in unauthenticated preview. |
| Create & Edit Personal Quest | **LIVE** | `POST /goals`, `PATCH /goals/:id` | Shared `QuestCreateSheet` with validation & duplicate-submit lock. |
| Pause / Resume / Complete / Archive Quest | **LIVE** | `POST /goals/:id/{pause,resume,complete,archive}` | Overflow menu with inline Archive confirmation; no fake success before API confirmation. |
| Delete / Restore Quest | **PENDING** | *Not implemented in `goalsApi`* | Intentionally omitted from enabled actions. |
| Linked Tasks under Quest | **LIVE** | `GET /quests?goalId=…`, `POST /quests` (`goalId`) | Authoritative source for Quest progress & operational Task list. |
| Optional Milestones CRUD & Reorder | **LIVE** | `/goals/:id/milestones`, `/milestones/:id` | Collapsible optional roadmap; never overrides Task progress. |
| Collaborative Mode / Members / Invitations | **PENDING** | *No `QuestMember` / `QuestInvitation` / `Friendship`* | Clearly labeled `COLLAB PREVIEW • PENDING API` fixtures + disabled/notice invitation UI. |
| Task Assignment (`assigneeId`) | **PENDING** | *No `Quest.assigneeId` column* | Assignee picker boundary sheet clearly marked `ASSIGNEE API: PENDING`. |
| Quest Discussion / Activity Feed | **PENDING** | *Social Backend on separate branch* | Honest `SOCIAL / ACTIVITY: PENDING API` boundary card. |
| Task Completion & Reward Awarding | **PENDING** | *No live completion mutation* | Read-only expected XP/Coin sum; never mutates user balances locally. |
