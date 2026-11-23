# FE-00 — Claude Canvas Dashboard Design Audit

**Primary Reference:** `D:\Development\LifeQuest\LifeQuest Dashboard-project.zip` (`App.dc.html`, `Main.dc.html`, `Index.dc.html`, `Tasks.dc.html`, `Habits.dc.html`, `Quests.dc.html`, `Calendar.dc.html`, `Social.dc.html`, `Messages.dc.html`, `Shop.dc.html`, `Wardrobe.dc.html`, `Profile.dc.html`, `Settings*.dc.html`, and 130+ state artboards).

This audit preserves the approved Claude Canvas visual identity and classifies every element strictly as **KEEP**, **REFINE**, **ADD**, or **DEFER**.

---

## 1. Visual Identity & Design Tokens (Recovered Ground Truth)

- **Language & Tone:** Vietnamese (`lang="vi"`), warm, encouraging, non-shaming productivity companion.
- **Typography:** `'Plus Jakarta Sans', system-ui, sans-serif` (weights 400, 500, 600, 700, 800).
- **Color System:**
  - **Surfaces:** Warm cream canvas `#F5F3EE`, crisp white cards `#FFFFFF` (`border-radius: 22px`, `border: 1px solid #F0EDE6` / `#ECE8E0`), subtle warm secondary `#EFEBE3` / `#F1EEE7`.
  - **Ink:** Deep Navy primary `#16324A` / `#122033`, body `#3B4658` / `#475467`, muted `#667085` / `#98A2B3`.
  - **Accents:** Fox Orange `#F26B3A` (hover `#B8431A` / `#C2461A`, tint `#FFF1EA`), LifeQuest Teal `#168C78` (dark `#0F6B5B`, tint `#E4F1EA`, focus ring `2px solid #168C78`), Gamification Gold `#F6C85F` (dark `#7A5410`).
  - **Entity Pills:** `TASK` (`#E3EDFB` / `#2D5B9A`), `HABIT` (`#DDEFE5` / `#1E6B4F`), `QUEST` (active/urgent highlight).
- **Motion & Accessibility:** `--ez: cubic-bezier(.22,.9,.28,1)`, `--dur: .28s`, full `@media (prefers-reduced-motion: reduce)` + manual `html.lq-rm` toggle, `44px`–`48px` touch targets, `env(safe-area-inset-*)`, `.lq-sr` screen-reader helpers.

---

## 2. Feature-by-Feature UI/UX Classification

### Layout, Identity & Navigation

| Feature / Area | Current Claude Canvas Implementation | Classification | Rationale |
|---|---|---|---|
| Warm Cream + Navy + Orange + Teal visual identity | `#F5F3EE` canvas, `#FFFFFF` 22px cards, `#16324A` ink, `#F26B3A` / `#168C78` / `#F6C85F` accents, `Plus Jakarta Sans` | **KEEP** | Signature LifeQuest identity; already harmonized with Fox V2 3D materials and `companion_sandbox_i` |
| Sticky Glass Adaptive Header (`HeaderFull` / `HeaderGlass` / `HeaderCompact`) | Top bar with search, notifications, quick-add, coin balance (Shop), avatar → Profile | **KEEP** | Clean context-aware actions per route without visual clutter |
| Mobile App Shell 5-slot Bottom Nav + Tablet Floating Pill (`min-width: 700px`, `420px`) | `Trang chủ`, `Tin nhắn`, `Tạo mới` (center FAB), `Lịch`, `Công việc/Thêm` + Drawer | **KEEP** | Strong mobile-first ergonomics with graceful tablet adaptation |
| Desktop Responsive Shell (`Main.dc.html` multi-column grid) | Desktop dashboard with Pinned Board (`Bảng ghim`), Today's focus list, Quick-Create, Activity | **REFINE** | Unify Desktop (`Main.dc.html`) and Mobile (`App.dc.html`) into **one responsive React layout** (sidebar/top-nav on `>= 1024px`, floating pill on `700–1023px`, bottom nav on `< 700px`) instead of two separate HTML apps |
| 3-Space Horizontal Swipe (`camera` ← `main` → `social`) | CSS transform gesture switching between Camera, Main, and Social spaces | **REFINE** | Keep as mobile gesture shortcut, but back it with standard URL routes (`/`, `/social`, `/camera`) so browser Back/Forward, deep links, and desktop keyboard navigation work reliably |

### Core Productivity & Gamification

| Feature / Area | Current Claude Canvas Implementation | Classification | Rationale |
|---|---|---|---|
| Home Dashboard Priority Feed (`pins` max 3 + Today's Tasks/Habits/Quests) | Urgent Quests → Open Tasks → Open Habits sorting, `almost`/`done`/`empty`/`loading` states | **KEEP** | Directly matches daily execution workflow; includes complete empty/loading/done states |
| Goals & Milestones hierarchy (`/goals`, `/goals/:id/milestones`) | Quests/Tasks/Habits exist in Canvas, but backend already implements `Goal → Milestone → Quest` | **ADD** | Required by SRS & existing `backend/` Prisma schema (`Goal`, `Milestone`, `Quest`) |
| Gamification Presentation (XP bar, Level badge, Streak flame tier, Coins) | Shown in Header/Home/Profile/Shop/Settings with non-shaming copy | **KEEP** | Consistent with Fox V2 uniform level scale (Lv1–Lv30+) and 4-tier streak flame (3/7/14/30+ days) |
| Voice Assistant → Task Creation UI | **Not present in Claude Canvas export** (`0` voice artboards) | **ADD** | Required by SRS + Gate I Fox V2 Voice module (`VOICE_LISTEN_STARTED` → `TASK_SUGGESTION_READY` → `TASK_NOTEBOOK_OPEN` → `TASK_CREATED` / `VOICE_RETRY_REQUESTED` / `VOICE_CANCELLED`) |
| Authentication & Onboarding (Login, Register, Session Guard) | **Not present in Claude Canvas export** (`Index.dc.html` is marketing landing only) | **ADD** | Required by SRS & backend `User` model (`email`, `username`, `passwordHash`) |
| Focus / Pomodoro & Daily Life Modes (Study, Sports, Sleep, Alarm, Cooldown) | Represented in Mascot Debug/Context artboards (`AppMcStudy`, `AppMcFitness`, `AppMcAlarm`, `AppMcNight`) | **REFINE** | Surface a clean Focus Timer / Activity trigger UI on Task/Quest detail and Home so G2.1 mascot states are driven by real user sessions |

### Mascot, Cosmetics, Social & Secondary Flows

| Feature / Area | Current Claude Canvas Implementation | Classification | Rationale |
|---|---|---|---|
| Floating Draggable / Edge-Snapping Mascot Slot (`[data-rive-slot="footer-mascot"]`) | Desktop `80/110px`, mobile `76px`, peek/hide/recall (`#lq-mc-recall`), auto-hide on camera (`html.lq-camopen`) | **REFINE** | **Keep** the exact UX placement, drag/snap, peek/recall, and camera-yield rules; **replace** the 2D Rive engine with the Gate I **Fox V2 3D `FoxCanvas`** (`mini` / `widget` / `full`) |
| Mascot Settings (`SettingsMascot.dc.html`) | Toggles for Show mascot, Follow cursor, Reactions, Reduced motion (`lq-rm`), Size | **KEEP** | Maps 1:1 to `FoxController` settings API (`setLookAtEnabled`, `setReducedMotion`, `setInteractionEnabled`, `setEffectsEnabled`) |
| Shop & Wardrobe (`Shop.dc.html`, `Wardrobe.dc.html`) | Cosmetic browsing & equip flow | **REFINE** | Bind directly to Fox V2 H1/H2 9-slot cosmetic catalog (`student`, `sports`, `explorer`, `mage`, `ninja`, `tet` + individual slot mixing) on a `full` 3D Fox preview |
| Challenges, Duo & Group Streaks (`AppCh*` artboards) | Invite, Accept, Active, Won/Lost/Draw, Duo, Group Streak, Group Chat | **DEFER** (Phase 2 / FE-05+) | Rich design is already captured in Canvas; defer full implementation until Core Auth + Goals/Milestones/Quests + Home + Mascot + Voice are complete |
| Private Social Feed, Journey Board, Camera Evidence & Direct Messages (`Social*`, `Messages*`, `AppCam*`) | Full artboard set in Canvas | **DEFER** (Phase 2 / FE-06+) | Backend modules not yet built; keep route placeholders and shared layout ready without blocking core MVP |

---

## 3. Accessibility & Missing Application States Audit

- **Strengths to KEEP:** `focus-visible` teal rings (`#168C78`), `prefers-reduced-motion` + manual `lq-rm`, `44–48px` touch targets, `HomeEmpty`, `HomeLoading`, `McLoadErr`, `CamDenied` states already designed in Canvas.
- **Refinements Needed:**
  1. Replace `localStorage`-coupled global singletons (`window.__lqMc`, `lifequest.settings.v1`) with typed React Context / store adapters.
  2. Add standardized **API Error & Offline Banner** states (401 session expired, 5xx retry, network offline) and **WebGL Unavailable Fallback** (Fox V2 `fox_poster.png` already ships with Gate I).
  3. Ensure keyboard accessibility for floating mascot recall, modal sheets (`Escape` to close, focus trap), and Voice Assistant controls (`aria-live="polite"` transcript/status announcements).
