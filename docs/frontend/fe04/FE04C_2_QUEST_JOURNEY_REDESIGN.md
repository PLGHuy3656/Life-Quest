# FE-04C.2 — Quest Journey Experience Redesign

**Branch:** `fix/FE` (uncommitted — awaiting visual approval)

---

## 1. Before vs After Comparison

| Aspect | Before (FE-04C) | After (FE-04C.2) |
| --- | --- | --- |
| **AppShell Layout** | 3-region with Fox Companion occupying ~360px right column | **Special Route Exception (`/work/quests/:questId` only):** Fox Companion & floating voice dock unmounted cleanly; central workspace expands full width (`max-width: 1240px`) with zero empty column and `0` WebGL canvases on Quest Detail (Fox restores with `1` canvas on all other routes). |
| **Actionable Task Discovery** | Required scrolling past Overview, Progress, and Members | **Above-the-fold `QuestNextActionPanel`** placed directly beside the Checkpoint Map in a 2-column desktop hero (`>= 1160px`), surfacing overdue & urgent Tasks immediately. |
| **Progress Visualization** | Generic linear progress bar | **Interactive RPG `QuestCheckpointMap`** (winding SVG path + accessible HTML checkpoint nodes + inline Checkpoint Inspector) synced 1:1 with authoritative Task progress. |
| **Quest Memories** | None | **`QuestMomentsGallery`** supporting local multi-photo preview, captions, checkpoint tags, and full-size `SocialMediaLightbox` (honest `MEDIA API: PENDING`). |
| **Collaborative Team Panel** | Placed above Tasks, pushing Tasks down | Compact member avatars near Quest Overview; expandable **Members & Invitations** placed below Tasks & Moments. |

---

## 2. Task Prioritization Algorithm (`QuestNextActionPanel`)

1. Excludes archived, deleted, and completed Tasks.
2. Applies deterministic `sortTasksActionFirst`: Overdue → Due Soon → Starting Soon (`startAt` strictly separated from `dueAt`) → Today → Upcoming → Unscheduled.
3. In Collaborative Quests, defaults to **Của tôi** (tasks assigned to current user) while displaying an inline urgent team callout if a teammate has an overdue/due-soon Task, with one-click switching to **Cả nhóm**.
