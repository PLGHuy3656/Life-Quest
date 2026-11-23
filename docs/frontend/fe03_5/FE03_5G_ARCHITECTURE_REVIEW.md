# FE-03.5G — Social-First Dashboard Architecture Review

**Repository:** `D:\Development\LifeQuest_Repo`  
**Branch:** `feature/tv4-frontend` (inspected at `46df990`)  
**Scope:** Architecture audit & refactor blueprint to evolve the Desktop shell into a social-first three-region application shell (`LEFT: PinnedTaskRail` • `CENTER: SocialFeed` • `RIGHT: FoxCompanionPanel`) while preserving Fox V2 Gate I runtime integrity and existing production routes.

---

## 1. Current Architecture Audit (Phase 1)

| Component / Module | Current Ownership | Key Findings for FE-03.5G Refactor |
| :--- | :--- | :--- |
| **`AppShell.tsx`** | Renders `DesktopHeader`, Tablet/Mobile navs, `<main className={styles.content}>`, and `FloatingMascotDock`. | Already shares `--lq-container-max: 1200px` and `--lq-page-gutter: 24px` (`16px` at `1024–1180px`) with `DesktopHeader` (`0px` outer edge delta). Ideal host for a persistent, route-aware `PinnedTaskRail` on authenticated Desktop routes. |
| **`DashboardPage.tsx`** | Renders `MascotEventAdapter`, `<HeroSection>` (Tablet/Mobile only), 2-column showcase (`PinnedBoard + SocialPreviewPanel` \| `MascotHeroPanel`), `TodayFeed`, `GoalsProgressPanel`, and `DashboardSheets`. | Currently owns `PinnedBoard` and `DashboardSheets` locally. Moving `PinnedTaskRail` + `DashboardSheets` up to `AppShell` lets pinned tasks remain accessible across `/`, `/work`, `/calendar`, `/messages`, `/settings` without re-fetching. |
| **`PinnedBoard.tsx`** | Displays up to `MAX_PINNED_CARDS = 3` pinned quests horizontally inside `DashboardPage`. | Can be refactored into two views sharing the same `useQuestsQuery()` cache: vertical `PinnedTaskRail` (Desktop `>= 1024px`) and existing horizontal `PinnedBoard` (Tablet/Mobile `< 1024px`). |
| **`SocialPreviewPanel.tsx`** | 2-card compact preview inside `DashboardPage` left column. | Replaced on Desktop by the central scrollable `SocialFeedColumn` supporting Friends-only posts, photo evidence, reactions, comments, privacy tags, and cursor pagination. |
| **`FoxCompanionView.tsx` & `FoxCanvas.tsx`** | Lazy-loads Three.js `<Canvas>` with `gl={{ alpha: true }}`, registers single controller in `CompanionProvider`, supports `suspended?: boolean` which calls `ctrl.pause()` / `ctrl.resume()` and switches `frameloop` to `'never'`. | **Zero SDK/GLB changes needed.** Passing `suspended={foxCollapsed}` while keeping the panel mounted (`display: none` when collapsed) pauses GPU work on collapse, resumes cleanly on expand, guarantees **1 single active WebGL renderer**, and preserves unsent Quick Create input in state. |
| **`uiStore.ts` (Zustand)** | Manages `reducedMotion`, `activeSheet`, `searchQuery`. | Minimum extension: add `pinnedRailCollapsed: boolean`, `foxRailCollapsed: boolean`, `togglePinnedRail()`, `toggleFoxRail()`, and optional `quickCreateDraft: string` (in-memory or session-scoped) so draft text survives both panel collapse and route navigation. |
| **`dashboardRepository.ts`** | Enforces Live-only writes (`POST /api/v1/quests`, `POST/DELETE /api/v1/quests/:id/pin`) and explicit `MOCK` preview only in hybrid dev mode when unauthenticated. | Preserved verbatim. A dedicated `socialRepository.ts` will be added when `origin/feature/friends-and-social` merges into `develop` (never fabricating live social writes). |

---

## 2. Proposed Component Ownership (Production Target)

```text
AppShell (Desktop >= 1024px)
├── DesktopHeader (approved 3-island sticky bar — untouched)
├── DesktopBodyContainer (max-width: 1200px, shared gutter)
│   ├── LEFT:   PinnedTaskRail (shared across authenticated routes; auto-hides when 0 pins; collapsible to 56px)
│   ├── CENTER: <Routes /> outlet
│   │           ├── /         -> SocialFeedPage (Social-First central feed)
│   │           ├── /work     -> WorkPage (Goals, Milestones, Quests)
│   │           ├── /calendar -> CalendarPage
│   │           ├── /wardrobe -> WardrobePage (hides right FoxCompanionRail to keep 1 active WebGL context!)
│   │           └── /settings -> SettingsPage
│   └── RIGHT:  FoxCompanionRail (on / and optionally non-Wardrobe routes; collapsible to 56px; suspended when collapsed)
├── DashboardSheets (promoted to AppShell so Quick Create & Manage Pins work from any route)
└── FloatingMascotDock (Voice Assistant entry; hidden or docked cleanly when FoxCompanionRail already exposes Mic)
```

> **Single-WebGL-Context Rule:** On `/wardrobe`, which mounts its own full-stage `<FoxCompanionView presentation="full" />`, the right `FoxCompanionRail` MUST unmount (or be omitted by route config) so the application never mounts two simultaneous WebGL renderers.

---

## 3. Social & Friends Backend Dependency Matrix (Phase 2)

Audited directly against `origin/develop` (`f9db2e1`) and `origin/feature/friends-and-social` (`backend/src/modules/social/*` & `backend/src/modules/friends/*`):

| Capability | Status | Backend Endpoint / Contract | Notes |
| :--- | :---: | :--- | :--- |
| Pinned Quests read & pin/unpin | **LIVE** | `GET /api/v1/quests`, `POST/DELETE /api/v1/quests/:id/pin` | Active on `origin/develop`. |
| Quick Create Quest | **LIVE** | `POST /api/v1/quests` | Active on `origin/develop` (authenticated). |
| User default privacy setting | **LIVE** | `GET/PATCH /api/v1/users/me/settings` (`privacyMode`) | `PUBLIC \| FRIENDS \| PRIVATE`. |
| Friends-only Social Feed + Cursor Pagination | **PENDING** | `GET /api/v1/feed?limit=20&cursor=<uuid>` | Implemented on `origin/feature/friends-and-social`; awaiting merge into `develop`. |
| Post CRUD + Captions + Per-Post Privacy | **PENDING** | `POST/GET/PATCH/DELETE /api/v1/posts/:postId` | Supports `content` (1–1000 chars), `mediaUrl` (URI), `sourceType`/`sourceId`, `visibility` (`FRIENDS \| PUBLIC \| PRIVATE`). |
| Likes / Reactions | **PENDING** | `POST/DELETE /api/v1/posts/:postId/reactions` | Enum: `LIKE \| CELEBRATE \| FIRE \| CLAP`. |
| Comments | **PENDING** | `GET/POST /api/v1/posts/:postId/comments`, `DELETE /api/v1/comments/:commentId` | `content` 1–500 chars. |
| Friendly Pokes | **PENDING** | `POST /api/v1/pokes` | `receiverId`, optional `message` (max 100 chars). |
| Friends List, Search, Requests & Block | **PENDING** | `/api/v1/friends*`, `/api/v1/friend-requests*` | Full friend graph on `feature/friends-and-social`. |
| Photo Upload / Presigned Media Storage | **UNAVAILABLE** | *None* | Backend accepts `mediaUrl` string only; no multipart/S3 upload endpoint exists yet. |
| Share / Repost API | **UNAVAILABLE** | *None* | No share endpoint; private social stays friends-scoped. |
| Real-time Social Notifications | **UNAVAILABLE** | *None* | No Notification module on `develop` or `feature/friends-and-social`. |
| QuestExecution Completion | **UNAVAILABLE** | *None* | Still unimplemented on `develop`. |

---

## 4. Desktop Layout Specification

| Breakpoint | Outer Container | Left (`PinnedTaskRail`) | Center (`SocialFeed`) | Right (`FoxCompanionPanel`) | Gap |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`>= 1280px`** (`1280`, `1440`, `1920`) | `1200px` centered (`24px` gutter) | `248px` expanded / `56px` collapsed / `0px` (0 pins) | `flex: 1` (`572px` all-expanded → `764px` / `836px` / `864px`; `max-width: 780px` centered when both collapsed) | `348px` expanded / `56px` collapsed | `16px` |
| **`1024px–1199px`** (Compact Desktop) | `100%` (`16px` gutter → `992px` at `1024px`) | Defaults to **`56px` collapsed** (user can still expand to `224px`) | `flex: 1` (`588px` default at `1024px` — never squeezed!) | `316px` expanded / `56px` collapsed | `16px` |
| **`< 1024px`** (Tablet & Mobile) | Unchanged | Existing `PinnedBoard` | Existing responsive stack | Existing `FoxCompanionView` | Unchanged |

- **Sticky Behavior:** Both Left and Right rails use `position: sticky; top: 92px; align-self: start;` (`80px` sticky Header + `12px` top rhythm). Center `SocialFeed` scrolls naturally with the document so there are no nested scroll-trap regions.

---

## 5. Remaining Risks & Recommendations

1. **Wardrobe Route WebGL Guard:** When promoting `FoxCompanionRail` into `AppShell`, explicitly suppress it on `/wardrobe` so only one `<Canvas>` mounts at a time.
2. **Media Upload Dependency:** Before enabling live photo evidence uploads in the Social Composer, Backend needs a presigned upload or multipart media endpoint (otherwise Composer must restrict to text + linked Quest/Milestone badge until upload API lands).
3. **1024px Full-Expanded Edge Case:** At `1024px`, if a user manually expands *both* `PinnedTaskRail` (`224px`) and `FoxCompanionRail` (`316px`), the Center feed narrows to `420px`. Recommendation: auto-collapse the opposite rail when manually expanding a rail below `1200px` (mutual exclusion in compact desktop mode).
