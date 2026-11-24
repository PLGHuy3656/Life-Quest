# FE-04A.2 — Full Task Detail Page Architecture (`/work/tasks/:taskId`)

**Component:** [TaskDetailPage.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/TaskDetailPage.tsx)
**Route:** `/work/tasks/:taskId` inside shared `AppShell` (`DesktopHeader` + `PinnedTaskRail` + `FoxCompanionRail` — strictly `1` Fox WebGL canvas).

---

## 1. Information Architecture (Jira-Inspired, LifeQuest Identity)

1. **Breadcrumb & Back Navigation:** `← Nhiệm vụ / Chi tiết nhiệm vụ` + live/mock `SourceBadge`.
2. **Primary Header Card:**
   - Status chip (`Đang hoạt động` / `Đã lưu trữ`), Time State badge (`Quá hạn` / `Sắp đến hạn` / `Sắp bắt đầu` / `Hôm nay`), Priority badge, Category (`QuestType`) pill.
   - **Fox-Paw Pin Stamp (`FoxPawPinButton` with label):** Toggles pin in LIVE or preview mode and syncs immediately with shared `PinnedTaskRail`.
   - **Inline Editable Title:** Click edit icon → validates 3–100 chars → calls `PATCH /api/v1/quests/:id` when authenticated.
   - **Description Section** + **Action Toolbar** (`Hoàn thành (PENDING)` disabled, `Chỉnh sửa đầy đủ`, `Lưu trữ` / `Khôi phục`, `Xóa`).
3. **Time & Linked Context Card (2-column structured grid):**
   - `Thời gian bắt đầu` (`startAt`), `Hạn hoàn thành` (`dueAt`)
   - Linked `Hành trình (Quest / Goal)` (links to `/work/quests`), linked `Cột mốc (Milestone)`
   - Read-only `Phần thưởng dự kiến` (`+XP`, `+Coin`), `Thời lượng ước tính`
4. **Honest Backend Boundaries Card:**
   - **Checklist / Subtasks (`PENDING API`):** Explicitly notes Backend has no subtasks table yet; never persists fake local checklist progress.
   - **Evidence Media (`PENDING API`):** Displays verified `proofRequirement` (`Không cần` / `Tùy chọn` / `Bắt buộc`) without unverified file upload.
   - **Timestamps Footer:** `createdAt` & `updatedAt`.

---

## 2. Direct URL, Refresh & Unknown ID Handling

- `useWorkQuestByIdQuery(taskId)` in [useWorkData.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/hooks/useWorkData.ts) calls `GET /api/v1/quests/:taskId` when authenticated (or resolves from `previewWorkState` in dev preview), so bookmarked `/work/tasks/:taskId` URLs load directly after refresh.
- Unknown or deleted IDs render an accessible `EmptyState` (`"Không tìm thấy nhiệm vụ"`) with a back link to `/work/tasks`.
- Clicking any pinned task in `PinnedTaskRail` (from Dashboard, Habits, Quests, or Tasks) navigates directly to `/work/tasks/:taskId`.

---

## 3. Visual QA Screenshots

- **Full Task Detail `1440×900`:** [fe04a2_detail_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a2_detail_1440x900.png)
- **Full Task Detail `1024×900`:** [fe04a2_detail_1024x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a2_detail_1024x900.png)
