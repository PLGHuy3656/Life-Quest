# FE-04C — Collaborative Quest UX & Unresolved Product Questions

**Branch:** `fix/FE` (uncommitted — awaiting visual approval)

---

## 1. Personal vs Collaborative UX Separation

- **Personal Quest (`/work/quests/:goalId`):** Shows Owner, Start/Deadline timing strip, Task-derived Journey Progress, Linked Tasks, Optional Milestones, and verified Goal lifecycle actions (`Pause`, `Resume`, `Complete`, `Archive` with confirmation). Omits empty team-management panels.
- **Collaborative Quest Preview (`/work/quests/collab-preview-1`, `/work/quests/collab-preview-invite`):**
  - Clearly labeled `COLLABORATIVE PREVIEW • PENDING API` so fixtures are never mistaken for live persisted collaboration.
  - Displays collapsible **Thành viên & Lời mời** card distinguishing `OWNER`, `ACCEPTED`, and `PENDING` invitees.
  - Exposes `Mời bạn bè`, `Chấp nhận / Từ chối` (for incoming invitations), `Thu hồi`, and per-Task `Assignee` picker sheets — all honestly marked `PENDING API` without faking mutations.
  - **Permission Denied (`/work/quests/collab-preview-denied` or Backend `403`):** Blocks private Quest titles, members, and linked Tasks from rendering.

---

## 2. Unresolved Product & Backend Authorization Questions (Documented, Not Invented)

1. **Ownership Transfer:** Can a Quest Owner transfer `OWNER` role to an accepted Collaborator?
2. **Deletion Authority:** Who may delete a Collaborative Quest (Owner only, or soft-delete with grace period)?
3. **Task Creation & Assignment Permissions:** Can any `COLLABORATOR` create and assign Tasks, or only the `OWNER`?
4. **Owner Departure:** What happens if the `OWNER` leaves a Collaborative Quest with remaining members?
5. **Viewer Role:** Will Backend implement a read-only `VIEWER` role (`ROLES: UI PROPOSAL` in FE-04C)?
6. **Friendship Prerequisite:** Does inviting a user require an accepted `Friendship` record, or can invitations target any username?
