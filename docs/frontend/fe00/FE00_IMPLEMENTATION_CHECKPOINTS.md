# FE-00 — Frontend Implementation Checkpoints

Phased delivery roadmap to build the LifeQuest frontend cleanly on top of the approved Claude Canvas design, existing Express/Prisma backend, and Gate I Fox V2 mascot SDK.

> **Current Gate:** **FE-00** (Audit & Architecture Proposal) — awaiting explicit approval before starting **FE-01**.

---

## Checkpoint Roadmap

| Checkpoint | Milestone | Scope & Deliverables | Exit Criteria |
|---|---|---|---|
| **FE-01** | **Foundation, Design Tokens & App Shell** | Upgrade `front-end/` to React 18.3 + TypeScript 5.6 + Vite 5.4 + npm; port exact Claude Canvas tokens (`tokens.css`, `base.css`, `Plus Jakarta Sans`, `html.lq-rm`); build responsive `AppShell` (Sticky Glass Adaptive Header, Desktop grid, Tablet floating pill, Mobile 5-slot bottom nav, Drawer, Search/Notification sheets); configure React Router v6, TanStack Query, Zustand, and `sync-mascot-assets.mjs`. | Clean `tsc -b` + `vite build`; responsive shell matches Claude Canvas visual identity across desktop/tablet/mobile; zero console errors; Vitest configured. |
| **FE-02** | **Core Productivity + Live Backend Integration** | Implement Auth views (Login/Register + session store), **Dashboard Home** (Pinned Board `Bảng ghim`, priority Today feed, empty/loading/done states, Quick-Create sheet), **Goals & Milestones** CRUD + reorder (connected live to `backend/api/v1/goals` & `/milestones`), **Quests & Tasks** CRUD + completion (connected live to `/quests`), and **Habits** (hybrid mock adapter ready for backend). | Full CRUD works against live PostgreSQL backend for Goals/Milestones/Quests; mock fallback works offline; unit + integration tests pass. |
| **FE-03** | **Fox V2 3D Mascot Integration & Wardrobe** | Vendor Gate I `src/mascot/` SDK cleanly; build `CompanionProvider` + `FoxCompanionView` (`mini`/`widget`/`full`) + `FloatingMascotDock` (preserving Canvas drag/snap/peek/recall/camera-yield UX); wire productivity/gamification domain events (`TASK_COMPLETED`, `QUEST_COMPLETED`, `LEVEL_UP`, `STREAK_UPDATED`, `STUDY_STARTED`); implement **Settings → Mascot** (`SettingsMascot`) and **Wardrobe / Shop** (all 6 H2 outfits + 9-slot mixing). | Single-WebGL-context rule enforced; zero direct Three.js imports in feature pages; WebGL fallback poster verified; all 6 H2 outfits equip/persist cleanly. |
| **FE-04** | **Voice Assistant → Task Creation Flow** | Build host-owned Voice Assistant UI (mic permission request/denial handling, browser Web Speech API / fallback text-voice simulator, transcript preview, suggestion card, confirm/cancel/retry controls); connect strictly to Gate I voice events (`VOICE_LISTEN_STARTED` → `VOICE_PROCESSING` → `TASK_SUGGESTION_READY` → `TASK_NOTEBOOK_OPEN` → `TASK_WRITING` → **`TASK_CREATED`** only after API/store persistence succeeds). | Automated tests prove `task_notebook_confirm` never fires before `TASK_CREATED`; `VOICE_CANCELLED`, `VOICE_RETRY_REQUESTED`, and `VOICE_PERMISSION_DENIED` clean up props and states cleanly. |
| **FE-05** | **Calendar, Focus Timer & Gamification Polish** | Implement **Calendar** view (`Calendar.dc.html`), **Focus / Pomodoro** session mode driving G2.1 `STUDY_*` / `COOLDOWN_*` states, **Profile & Activity History** (`Profile.dc.html`, `History.dc.html`), and real-GPU performance telemetry pass. | All core daily workflows complete; real-GPU frame-time and memory checks documented. |
| **FE-06** | **Challenges, Duo/Group & Private Social (Phase 2)** | Implement deferred Claude Canvas modules once backend endpoints are ready: **Challenges / Duo / Group Streaks** (`AppCh*` wired to G3 events & `FoxDuoCoordinator`), **Private Social / Journey Board** (`Social*`), **Camera Evidence** (`AppCam*` with `html.lq-camopen` mascot yield), and **Direct Messages** (`Messages*`). | End-to-end social/challenge flows verified with G3 mascot reactions and zero regression on FE-01–FE-05. |

---

## Sequencing & Git Hygiene Note

1. **Before FE-01:** Complete the pending **Gate I Git Checkpoint** (`chore(mascot): checkpoint Fox V2 Gate I production baseline` + tag `mascot-v2-gate-i` on `feature/tv4-mascot-fox-v2`) once approved, so the mascot baseline is locked in Git before frontend files are added.
2. **During FE-01+:** Keep `mascot/fox-v2/` read-only; all frontend work lives strictly inside `front-end/`.
