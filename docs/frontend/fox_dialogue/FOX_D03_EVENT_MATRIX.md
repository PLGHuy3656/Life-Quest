# FOX-D03 — Contextual Event Matrix & Backend Dependencies

| Event Type | Priority | Cooldown | Gate I Animation Mapping | Trigger Source | Backend Status |
| :--- | :---: | :---: | :--- | :--- | :---: |
| `DEADLINE_OVERDUE` | `95` | `2s` (+ dedupe) | `QUEST_EXPIRED` | `deadlineMonitor.ts` (real `quest.dueAt <= now`) | **LIVE** (`GET /api/v1/quests`) |
| `DEADLINE_15M` | `85` | `2s` (+ dedupe) | `QUEST_DEADLINE_URGENT` | `deadlineMonitor.ts` (`0 < remaining <= 15m`) | **LIVE** (`GET /api/v1/quests`) |
| `DEADLINE_60M` | `70` | `2s` (+ dedupe) | `QUEST_DEADLINE_URGENT` | `deadlineMonitor.ts` (`15m < remaining <= 60m`) | **LIVE** (`GET /api/v1/quests`) |
| `BACKEND_ERROR` | `60` | `8s` (+ dedupe) | *(text only)* | Verified query/mutation failure in `FoxCompanionRail` | **LIVE** |
| `TASK_COMPLETED` | `55` | `2s` | `TASK_COMPLETED` | Contract ready in `FoxCompanionRail` & `FoxDialogueEngine`; **NOT fired from fake local state** | **UNAVAILABLE** (no QuestExecution completion API on `develop`) |
| `TASK_CREATED` | `50` | `2s` | `TASK_CREATED` | Verified `useCreateQuestMutation.onSuccess` (`POST /api/v1/quests`) | **LIVE** |
| `APP_GREETING` | `35` | `60s` (+ dedupe) | `APP_GREETING` | `MascotEventAdapter` on mount (time-of-day aware) | **LIVE** (client local time) |
| `EMPTY_TASKS` | `35` | `60s` (+ dedupe) | *(text only)* | Verified empty `questsQuery.data.data.length === 0` | **LIVE** |
| `PIN_UPDATED` | `30` | `5s` | *(text only)* | Verified `usePinQuestMutation.onSuccess` | **LIVE** (`POST/DELETE /quests/:id/pin`) |
| `SOCIAL_MEDIA_VIEWED` | `25` | `10s` | `PHOTO_REACTION` | `SocialMediaGrid` opening `SocialMediaLightbox` (read/view only, context-neutral) | **PREVIEW / LOCAL** (Social APIs `PENDING`) |
| `DASHBOARD_ACTION` | `25` | `12s` | *(text only)* | Opening `manage-pins` or `quick-create` sheets | **LIVE** (UI event) |
| `ROUTE_SWITCHED` | `20` | `15s` | *(text only)* | Meaningful route change in `AppShell` | **LIVE** (UI event) |
| `RAIL_TOGGLED` | `20` | `12s` | *(text only)* | `PinnedTaskRail` Fox-paw collapse/expand | **LIVE** (UI event) |
| `ENCOURAGEMENT` / `TASK_SUGGESTION` | `15` | `30s` | *(text only)* | Idle cycle when unpaused | **LIVE** (in-app) |
| `IDLE_CHATTER` | `10` | `35s` | `USER_IDLE` | 45s user inactivity timer when unpaused | **LIVE** (in-app) |

## Known Backend & Notification Limitations

1. **Task Completion (`UNAVAILABLE`):** `TASK_COMPLETED` dialogue lines and event contracts are implemented and unit-tested, but never triggered from unverified local clicks until Backend exposes a real QuestExecution completion endpoint on `develop`.
2. **Social Reactions (`PENDING`):** Only read/view lightbox reactions (`SOCIAL_MEDIA_VIEWED`) fire; Fox never claims knowledge of image contents or unconfirmed social relationships.
3. **Push Notifications (`UNAVAILABLE`):** Deadline alerts operate in-app while the tab is open via `deadlineMonitor.ts`. Remote/push notifications await a future Backend Notification Service implementing `NotificationServiceAdapter`.
