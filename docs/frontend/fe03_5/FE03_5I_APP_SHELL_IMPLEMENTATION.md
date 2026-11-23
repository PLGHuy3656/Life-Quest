# FE-03.5I — Approved Dashboard & Shared AppShell Implementation

**Branch:** `feature/tv4-frontend`  
**Decision:** Promoted the visually approved Social-First three-region Desktop prototype (FE-03.5G + FE-03.5H) into the production `AppShell` and Home Dashboard (`/`).

---

## 1. Shared Three-Region Application Shell

Refactored `front-end/src/components/shell/AppShell.tsx` so that on Desktop (`>= 1024px`, tracked cleanly via `useIsDesktop()`), all authenticated and application routes share:

- **TOP:** Existing approved three-island sticky `DesktopHeader` (`80px`, `1200px` max-width, untouched visual identity).
- **LEFT (`PinnedTaskRail`):** Promoted to `src/components/shell/PinnedTaskRail.tsx`.
  - Reads pinned quests from verified Backend APIs (`useQuestsQuery()` / `useTodayQuery()`), automatically reflecting `POST/DELETE /api/v1/quests/:id/pin` across all routes via React Query cache invalidation.
  - Auto-hides completely (`return null`) when 0 pinned tasks exist.
  - Persists collapse/expand state across routes via `uiStore.pinnedRailCollapsed` using the approved bespoke `FoxPawToggle`.
- **CENTER (`centerRegion`):** Renders route-specific content (`/`, `/work`, `/calendar`, `/messages`, `/wardrobe`, `/settings`, `/profile`).
- **RIGHT (`FoxCompanionRail`):** Promoted to `src/components/shell/FoxCompanionRail.tsx`.
  - Persists Fox V2 greeting, cozy study-room backdrop (`MascotSceneBackdrop`), WebGL `<FoxCompanionView>`, and Claude-style Quick Create + Mic voice trigger across all routes.
  - Persists `uiStore.foxRailCollapsed` and `uiStore.quickCreateDraft` across collapse/expand and route transitions.
  - Passes `suspended={collapsed}` when collapsed so WebGL pauses cleanly without losing draft text or creating duplicate contexts.
  - Passes `hideCanvas={location.pathname === '/wardrobe'}` on `/wardrobe` so the full-stage Wardrobe Fox remains the sole active WebGL renderer (`canvasCount <= 1`).
- **Shared Sheets & Events:** Promoted `<MascotEventAdapter />` and `<DashboardSheets />` into `AppShell` so Quick Create, Manage Pins, Search, Notifications, and API Status sheets work from every route.
- **Auth Routes & Tablet/Mobile:** `/login` and `/register` remain outside `AppShell`; Tablet (`< 1024px`) and Mobile (`< 700px`) layouts remain untouched.

---

## 2. Production Social-First Dashboard & Typed Contracts

- **Home Dashboard (`/`):** `src/features/dashboard/DashboardPage.tsx` now renders `SocialFeedSection` as the primary Desktop content (no separate Social navigation page).
- **Honest Capability Boundaries (`src/services/api/socialContracts.ts`):**
  - **LIVE:** Pinned quests (`GET/POST/DELETE /quests/:id/pin`), Quick Create (`POST /quests`), User `privacyMode` settings.
  - **PENDING:** Friends feed + cursor pagination (`GET /feed`), Post creation (`POST /posts`), Reactions (`POST/DELETE /posts/:postId/reactions`), Comments (`GET/POST /posts/:postId/comments`) — awaiting Backend merge of `origin/feature/friends-and-social`.
  - **UNAVAILABLE:** Direct photo upload/presigned media storage, Share/Repost endpoint.
  - Never simulates successful live posting, liking, commenting, or sharing when Backend Social APIs are pending/unavailable.
- **Future Profile Compatibility (`/profile`):** Added protected `ProfileBoundaryPage` (`src/features/profile/ProfileBoundaryPage.tsx`) linked from `DesktopHeader`'s account menu, defining typed boundaries for Personal Posts, Personal Albums, Friends' Albums, Quest Evidence Photos, and LIVE Privacy Controls.
- **Prototype Cleanup:** Redirected `/preview/social-first` → `/` and removed the temporary `src/features/social-prototype/` folder.
