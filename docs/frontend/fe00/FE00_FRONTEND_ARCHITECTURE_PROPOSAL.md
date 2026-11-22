# FE-00 — Frontend Architecture Proposal

This proposal upgrades `D:\Development\LifeQuest_Repo\front-end` from its current blank Vite 4.3 JS template into a production-ready React + TypeScript application that honors the recovered Claude Canvas design, integrates seamlessly with `backend/` (Express + Prisma), and embeds the Gate I Fox V2 3D Mascot SDK cleanly.

---

## 1. Technology Stack Evaluation & Recommendations

| Concern | Recommendation | Rationale |
|---|---|---|
| **Core Framework & Language** | **React 18.3 + TypeScript 5.6 (strict mode)** | Exact peer match with the Gate I Mascot SDK (`react 18.3.1`, `@react-three/fiber 8.17.14`, `three 0.170.0`, `typescript 5.6.3`) — eliminates React 19 / R3F v8 peer conflicts and enforces typed event/API contracts |
| **Build System** | **Vite 5.4** (`@vitejs/plugin-react`) | Matches `companion_sandbox_i` (`vite 5.4.21`), fast HMR, native ESM, clean static GLB asset serving from `public/models/` |
| **Package Manager** | **npm** (standardize with `package-lock.json`) | Both `backend/` (Node) and `companion_sandbox_i/` use `npm`; avoids Yarn v1 vs npm dual-lockfile drift |
| **Styling Strategy** | **CSS Custom Properties (Design Tokens) + CSS Modules** (preserving exact Claude Canvas tokens `#F5F3EE`, `#16324A`, `#F26B3A`, `#168C78`, `#F6C85F`, `Plus Jakarta Sans` via `@fontsource/plus-jakarta-sans`) | Direct 1:1 fidelity with the 32 KB Claude Canvas CSS (`lq-*` tokens, `22px` cards, glass header, `html.lq-rm` reduced-motion) with zero runtime CSS-in-JS overhead and scoped component styles (no Tailwind rewrite risk that would drift from the approved Canvas aesthetic) |
| **Routing** | **React Router v6 (`react-router-dom`)** | Clean nested layouts (`AppShell`), protected auth routes, deep links (`/`, `/goals`, `/quests/:id`, `/calendar`, `/wardrobe`, `/settings/mascot`, `/social`, `/challenges`), and mobile gesture sync |
| **Server State & API Client** | **TanStack Query v5 + typed `fetch` HTTP client (`src/api/client.ts`)** | Handles caching, optimistic task/quest check-off, retries, loading/error states, and automatic invalidation for `/api/v1/goals`, `/milestones`, `/quests`, `/users` |
| **Client UI State** | **Zustand (lightweight) + React Context** | Separate UI shell state (drawer, active sheet, mascot dock position/mode, reduced motion, theme) from server data; persists user preferences cleanly to `localStorage` (`lifequest.settings.v1`, `lifequest.mascot.ui.v1`) |
| **Mock / Hybrid Data Layer** | **Repository-pattern Service Adapter (`VITE_API_MODE=hybrid \| mock \| live`)** | Connects **live** to implemented `backend/` routes (Goals, Milestones, Quests, Users) while cleanly serving deterministic **mock** repositories for not-yet-built backend domains (Habits, Streaks/XP, Shop/Wardrobe, Voice AI parser, Social/Challenges) — swappable per module without touching UI components |
| **3D Mascot Runtime** | **Decoupled Adapter (`src/mascot/` vendored from Gate I SDK + `src/features/mascot/`)** | Zero direct Three.js imports in business pages; pages emit semantic domain events (`companionBus.publish(...)`), never clip names |
| **Testing Framework** | **Vitest + React Testing Library + Playwright (E2E)** | Fast unit/component tests for stores, API adapters, and voice-to-task event guards (`TASK_CREATED` gate); Playwright for responsive visual & WebGL smoke tests |

---

## 2. Proposed Directory Structure (`front-end/src/`)

```text
front-end/
├── public/
│   ├── fox_poster.png              # WebGL fallback poster (from Gate I)
│   └── models/                     # Copied via sync script from mascot/fox-v2/06_EXPORTS/glb/
│       ├── fox_v2_anim_e2.glb
│       ├── modules/fox_v2_{g1_1,g2_1,g3,i}_*.anim.glb
│       └── cosmetics/*.glb
├── src/
│   ├── styles/
│   │   ├── tokens.css              # Recovered Claude Canvas palette, radii, motion, lq-rm
│   │   ├── base.css                # Typography (Plus Jakarta Sans), focus-visible, safe-area
│   │   └── layout.css              # Responsive shell (Desktop grid / Tablet pill / Mobile bottom nav)
│   ├── api/
│   │   ├── client.ts               # Typed fetch wrapper (base URL, auth header, error normalization)
│   │   ├── contracts/              # TypeScript DTOs matching backend/prisma/schema.prisma
│   │   └── repositories/           # live + mock implementations (goals, milestones, quests, habits, profile, voice)
│   ├── app/
│   │   ├── App.tsx                 # Router + QueryClientProvider + CompanionProvider
│   │   ├── routes.tsx              # Route table (Auth, Dashboard, Work, Calendar, Wardrobe, Settings, Social)
│   │   └── AppShell.tsx            # Adaptive Glass Header + Desktop Sidebar / Mobile Bottom Nav + Floating Mascot
│   ├── components/                 # Shared UI primitives (Card, Button, Chip, Sheet, EmptyState, ErrorBanner, ProgressRing)
│   ├── mascot/                     # Unmodified Gate I Fox V2 SDK (FoxController, FoxEventMap, cosmetics, effects)
│   ├── features/
│   │   ├── mascot/                 # App-level MascotAdapter, CompanionContext, FloatingMascotDock, MascotCanvasWrapper
│   │   ├── auth/                   # Login, Register, Session guard
│   │   ├── dashboard/              # Home priority feed, Pinned Board (Bảng ghim), Quick-Create
│   │   ├── goals/                  # Goals & Milestones CRUD + reorder (live backend)
│   │   ├── quests/                 # Quests & Tasks CRUD + completion → XP/Mascot events (live backend)
│   │   ├── habits/                 # Daily Habits check-in & streak tracking
│   │   ├── voice/                  # Voice Assistant modal/bar (host-owned Web Speech/mic + strict TASK_CREATED dispatch)
│   │   ├── focus/                  # Focus / Pomodoro timer driving G2.1 study/cooldown mascot states
│   │   ├── wardrobe/               # Shop & Wardrobe (H1/H2 6 outfits + 9-slot customization)
│   │   ├── settings/               # Account, Appearance, Notifications, Mascot Settings (`lq-rm`, look-at, size)
│   │   ├── challenges/             # (Deferred Phase 2) Duo/Group challenges
│   │   └── social/                 # (Deferred Phase 2) Journey feed, Camera evidence, Messages
│   └── main.tsx
└── vite.config.ts
```

---

## 3. Architectural Guardrails

1. **Zero UI Coupling to 3D Assets:** Feature pages (`goals`, `quests`, `voice`, `habits`) never import `three`, `FoxController`, or `.glb` paths. They only call `useCompanionBus().publish(eventName, payload)`.
2. **Application Owns Business Truth:** Level, XP, streak days, microphone permissions, speech recognition, and task persistence live strictly in `src/api/` and `src/features/voice/` — never inside `src/mascot/`.
3. **One Live WebGL Context Per Screen:** Enforced by `MascotHostManager` (when `/wardrobe` or `/companion` mounts a `full` 3D Fox, the floating `FloatingMascotDock` automatically suspends its WebGL canvas instead of running two simultaneous contexts).
4. **Asset Sync Without Duplication in Git:** A lightweight `scripts/sync-mascot-assets.mjs` copies GLBs from `../mascot/fox-v2/06_EXPORTS/glb/` into `front-end/public/models/` at build/dev time (`public/models/` stays gitignored).
