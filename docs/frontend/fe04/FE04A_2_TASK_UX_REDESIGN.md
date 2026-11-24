# FE-04A.2 — Task Page UX Redesign (Action-First, Time-Aware, Low-Noise)

**Repository:** `D:\Development\LifeQuest_Repo`
**Branch:** `fix/FE` (uncommitted — visual approval checkpoint)

---

## 1. UX Priority Shift ("What should I do now?")

Compared with FE-04A.1 (where a filter + search + summary toolbar pushed the first task card down to `y = 411px`), FE-04A.2 reorganizes `/work/tasks` around immediate action:

1. **Work Hub Switcher (`Task · Habit · Quest`)** + **Compact Header** (`Hôm nay làm gì?`, quick jump `Tìm & lọc`, prominent orange `+ Tạo nhiệm vụ`).
2. **Urgent Section (`Cần chú ý ngay`):** Overdue, Due Soon (`≤ 2h`), and Starting Soon (`≤ 2h`) tasks surface immediately at the very top (`y ≈ 235px` — nearly `180px` higher above the fold!).
3. **Today Section (`Hôm nay`):** Today's remaining tasks ordered chronologically by `startAt ?? dueAt`.
4. **Upcoming & Unscheduled Section (`Sắp tới & Chưa đặt lịch`):** Future tasks by date followed by unscheduled tasks.
5. **Advanced Search & Full Management (`Tìm kiếm & Quản lý toàn bộ`):** Moved cleanly below the primary tasks with an instant `Tìm & lọc` jump button in the header so users can reach full filtering (`Tất cả`, `Hôm nay`, `Sắp tới`, `Quá hạn`, `Hoàn thành`, `Lưu trữ`), search, Goal filter, and user-selected sort without scrolling excessively.

---

## 2. Deterministic Deadline-Aware Sort Policy ([taskUtils.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/taskUtils.ts))

`classifyTaskTimeState(quest, nowMs)` strictly separates `startAt` from `dueAt`:

| Rank | State | Condition | Display Cue |
| ---: | --- | --- | --- |
| `0` | `overdue` | `dueAt < now` (not completed) | `Quá hạn • HH:mm` / `Quá hạn • dd/mm` (crimson) |
| `1` | `due_soon` | `0 <= dueAt - now <= 2h` | `Hạn trong N phút (HH:mm)` (orange) |
| `2` | `starting_soon` | `0 <= startAt - now <= 2h` | `Bắt đầu sau N phút (HH:mm)` (orange — never confused with due-soon) |
| `3` | `today` | `startAt` or `dueAt` on local today | `Bắt đầu HH:mm · Hạn HH:mm` (neutral navy/slate) |
| `4` | `upcoming` | Future local date | `Bắt đầu dd/mm · Hạn dd/mm` |
| `5` | `unscheduled` | Both `startAt` & `dueAt` null | `Chưa đặt hạn` |
| `6` | `completed` | `completedAt != null` | Always sorted after actionable items |

---

## 3. Reduced Visual Noise & Fox-Paw Pin Stamp

- **3-Tier Card Hierarchy:**
  - **PRIMARY:** Clear bold navy Task title (no awkward truncation).
  - **SECONDARY:** Clean inline `Bắt đầu ... · Hạn ...` time cue; semantic color used conservatively ONLY for `overdue` (crimson) and `due_soon` / `starting_soon` (orange).
  - **TERTIARY:** Quiet muted inline metadata (`Tập trung · Ưu tiên cao · Hoàn thành đồ án LifeQuest`); reward previews (`+XP`, `+Coin`) moved into the Full Task Detail Page.
- **Fox-Paw Pin Stamp ([FoxPawPinButton.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/FoxPawPinButton.tsx)):**
  - Removed the explicit `"Đã ghim"` text badge from task cards.
  - Reuses the approved Fox-paw SVG artwork from `FoxPawToggle.tsx` with a subtle orange stamp highlight (`#FFF0E8`, rotated `-12deg`) when pinned, accessible `aria-pressed` / `aria-label`, keyboard activation, and immediate synchronization with `PinnedTaskRail`.

---

## 4. Visual Comparison (Before vs After)

- **Before (FE-04A.1):** [fe04a1_task_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a1_task_1440x900.png) (`listTop: 411px`, filter bar above tasks, rainbow badges, `"Đã ghim"` text pill)
- **After — Task Overview `1440×900`:** [fe04a2_task_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a2_task_1440x900.png)
- **After — Task Overview `1024×900`:** [fe04a2_task_1024x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a2_task_1024x900.png)
- **After — Task Overview `1920×1080`:** [fe04a2_task_1920x1080.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a2_task_1920x1080.png)
