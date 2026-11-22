# FE-00 — Repository Audit

**Date:** 2026-11-22  
**Mode:** Strictly read-only inspection (no files modified, no packages installed, no Git operations).

## 1. Git & Monorepo State

- **Repository Root:** `D:\Development\LifeQuest_Repo`
- **Remote:** `origin` → `https://github.com/PLGHuy3656/Life-Quest.git`
- **Current Branch:** `feature/tv4-mascot-fox-v2`
- **Working Tree (`git status --short`):** Clean (0 modified, 0 untracked)
- **Recent Commits:**
  - `5d22112` `docs(mascot): add Gate F/G1 validation reports, scripts, and runtime contracts`
  - `f09a09f` `feat(mascot): add G1 quest reward/streak animation module and test harness`
  - `7472b52` `feat(mascot): add Gate F companion sandbox runtime and web previews`
  - `b88e729` `feat(mascot): add core E1/E2 animations and exported GLBs`
  - `e416b9e` `feat(mascot): add Fox V2 model, D1.1 rig, and Blender asset pipeline`
- **Top-Level Monorepo Structure:** `backend/`, `front-end/`, `mascot/fox-v2/`, `README.md`.

## 2. Existing `front-end/` Inspection

`D:\Development\LifeQuest_Repo\front-end` currently contains **only a blank Vite starter template** (originally from a third-party MERN/Trello tutorial boilerplate — zero LifeQuest domain code, routes, components, or styles):

| File / Item | Current State |
|---|---|
| `package.json` | `"name": "life-quest"`, React `^18.2.0`, Vite `^4.3.2`, `@vitejs/plugin-react-swc ^3.0.0`, ESLint `^8.38.0` |
| Language | Plain JavaScript (`.js` / `.jsx`) — **no TypeScript** configured yet |
| Lockfile | `yarn.lock` (Yarn v1) |
| Source files | `src/App.jsx` (default Vite counter), `src/App.css`, `src/index.css`, `src/main.jsx`, `public/vite.svg`, `src/assets/react.svg` |
| Routing / State / Styling / Testing / 3D | None installed (`react-router`, state store, styling framework, Vitest/Testing Library, `three`, `@react-three/fiber` all absent) |

**Implication:** `front-end/` is a clean slate ready to be upgraded to TypeScript + Vite 5 + React 18.3 (matching the Gate I Mascot SDK runtime dependencies) without risking any existing LifeQuest frontend code.

## 3. Backend API & Data Model Readiness (`backend/`)

The Express + Prisma 7 (PostgreSQL) backend currently implements 4 modules:

| Module | Prisma Model | Implemented REST Endpoints (`/api/v1/...`) |
|---|---|---|
| **Users** | `User` (`id`, `email`, `username`, `passwordHash`, `status`) | `POST /users`, `GET /users/:email` *(not yet mounted in `routes/index.js`)* |
| **Goals** | `Goal` (`id`, `userId`, `title`, `description`, `startDate`, `dueDate`, `status`) | `GET/POST /goals`, `GET/PATCH /goals/:goalId`, `POST /goals/:goalId/{pause,resume,complete,archive}` |
| **Milestones** | `Milestone` (`id`, `goalId`, `title`, `description`, `position`, `status`, `completedAt`, `deletedAt`) | `GET/POST /goals/:goalId/milestones`, `GET/PATCH/DELETE /milestones/:milestoneId`, `POST /milestones/:milestoneId/complete`, `PATCH /goals/:goalId/milestones/reorder` |
| **Quests** | `Quest` (`id`, `userId`, `goalId?`, `milestoneId?`, `title`, `description`, `status`) | `GET/POST /quests`, `GET/PATCH /quests/:questId` |

**Not yet implemented in `backend/` (require clean Mock/Adapter layer in FE):** Auth/JWT sessions, Habits, Gamification (XP/Level/Streak/Coins/Shop/Wardrobe), Focus/Pomodoro, Challenges/Duo/Group, Private Social/Journey/Messages, and Voice-to-Task AI endpoints.

## 4. Recovered Claude Canvas Dashboard Source

- **Recovered Archive:** `D:\Development\LifeQuest\LifeQuest Dashboard-project.zip` (**49,887,210 bytes**, **141 files**).
- **Format:** Complete Claude Canvas HTML/React/CSS export (`App.dc.html` = 458 KB / 4,140 lines mobile app shell; `Main.dc.html` = 188 KB desktop dashboard; `Index.dc.html` = landing page; plus **130+ screen & state artboards** covering Tasks, Habits, Quests, Calendar, Social, Challenges/Duo/Group, Messages, Camera Evidence/Journey, Profile, Shop, Wardrobe, Settings, History, and Mascot states).
- **Reusable Design Assets Present:** Full CSS design tokens, `Plus Jakarta Sans` typography scale, responsive breakpoints, accessibility rules (`focus-visible`, `prefers-reduced-motion`, `html.lq-rm`), and the Mascot Companion floating/edge-snap controller logic.
- **Note:** Prototype currently embeds a **2D Rive placeholder** (`rive/fox.b64.txt` + `rive/rive.wasm`), which will be replaced by the approved **Gate I Fox V2 3D Mascot Runtime SDK**.

## 5. Mascot Production Baseline

- **Workspace:** `D:\Development\LifeQuest\LifeQuest_Assets\Mascot\LifeQuest_Fox_V2` (Gate I production package `LifeQuest_Fox_V2_GateI_Final.zip`, SHA-256 `ab0de68fa67f63489148c7bf6f63d19aac6a361ce8bf0f883b84dd06caccd501`, 405/405 checksums verified).
- **Capabilities:** 58 clips across E2 (7), G1.1 (9), G2.1 (16), G3 (18), and Gate I Voice Assistant (8); 20 H1+H2 cosmetics across 6 themed outfits; framework-agnostic `FoxController` + React Three Fiber `FoxCanvas` (`mini` / `widget` / `full`) + typed `FoxEventMap`.
