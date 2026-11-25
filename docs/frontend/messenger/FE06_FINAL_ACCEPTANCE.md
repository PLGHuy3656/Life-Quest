# FE-06 — Private Messenger & Floating Chat Final Acceptance (Frontend Baseline)

## 1. Checkpoint Summary
- **Milestone:** FE-06 Private Messenger Core (`FE-06A`), Global Floating Chat Bubbles (`FE-06A.1`), and Chibi Fox Companion on Fox-free routes.
- **Branch:** `fix/FE`
- **Previous Approved Frontend Baseline:** `f95633d539200900142e571a31aa6b0133d70778` (FE-W01)
- **Overall Completion Assessment:** **~70% (Frontend UI Baseline Approved — Pending Backend Integration)**
- **Important Release Boundary:** UI/UX approval for this Frontend baseline does **not** imply production-ready realtime messaging or Backend persistence. All unverified realtime, persistence, Social, Media, and Streak capabilities remain explicitly labeled as `PREVIEW` / `PENDING BACKEND`.

---

## 2. Implemented Frontend Capabilities

### A. FE-06A Private Messenger Core (`/messages`)
- **Three-region Desktop workspace** inside shared `AppShell` (preserving three-island `DesktopHeader`, `PinnedTaskRail`, `PlayerStatsRail`, and hiding `FoxCompanionRail` on `/messages` with zero extra WebGL canvas).
- **Conversation Sidebar (`ConversationSidebar.tsx`):** Search by title/member/preview, `Tất cả` / `Cá nhân` / `Nhóm` filters, personal & group avatars, timestamps, preview unread badges, and honest pending toast for new group creation.
- **Message Timeline (`ChatTimeline.tsx`):** Incoming/outgoing bubbles, consecutive sender grouping, date separators, system notices, preview Quest invitation & Duo/Group challenge cards (explicitly locked as `Chờ API`), and `SocialMediaLightbox` integration.
- **Message Composer (`MessageComposer.tsx`):** Plain & multi-line text, Enter to send / Shift+Enter newline, Vietnamese IME composition guard (`isComposing` / `keyCode === 229`), quick emoji picker, local image attachment preview (`ObjectURL`) with remove before send, and honest local preview simulation labeling (never faking server delivery confirmation).
- **Collapsible Conversation Details (`ConversationDetailsPanel.tsx`):** Participant/group metadata, member list, shared photos gallery, shared Quest preview refs, streak preview placeholder, and local mute toggle.
- **Honest Non-Happy States:** Dedicated `EMPTY`, `PENDING_API`, and `UNAUTHORIZED` views (`?state=empty|pending|unauthorized`).
- **Responsive Layout:** Desktop 3-column viewport-fit (zero document scroll), Tablet drawer, and Mobile 3-pane (`list → chat → details`) navigation.

### B. FE-06A.1 Global Floating Chat Bubbles
- **Single Global Host (`FloatingChatHost.tsx`):** Mounted once in `AppShell`, hidden on `/login` & `/register`, and automatically collapses expanded floating windows on `/messages` (`data-messenger-coexistence="collapsed"`) while preserving state for restoration on navigation away.
- **Shared Zustand Messaging Store (`messengerStore.ts`):** Single source of truth shared between `MessagesPage` and `FloatingChatHost` — zero duplicate messaging logic or subscriptions, per-account storage scope (`lq_floating_chat_prefs_v1::<scope>`), logout memory wipe, and strict `localStorage` boundary (UI prefs & safe IDs only; never message bodies or tokens).
- **Autumn Fox Compact Bubble Dock (`FloatingBubbleDock.tsx`, `FloatingChatBubble.tsx`):**
  - Compact `44×44px` standalone circular bubbles with subtle Fox-ear silhouette and warm autumn palette.
  - Bottom-anchored **Fox Paw (`PawPrint`)** button that stays stationary (`<= 1px` shift) while bubbles collapse/expand smoothly with staggered spring animation (and shows aggregate unread count when collapsed).
  - Top 6-dot handle (`GripHorizontal`): drag to reposition with viewport safe bounds + left/right edge snap, click to open Settings & `+N` overflow menu (`Chuyển cạnh`, `Đặt lại vị trí`, `Đóng tất cả`, `Tắt Bong bóng chat`), and full keyboard navigation (`Arrow` keys, `Home`, `Enter`/`Space`).
- **Compact Floating Chat Window (`FloatingChatWindow.tsx`):** `336×460px` desktop card (full bottom sheet on mobile), reusing FE-06A `ChatTimeline`, `MessageComposer`, and `SocialMediaLightbox`, collision-aware against `FoxCompanionRail`, `Esc` to minimize with focus restoration.
- **Settings Integration (`ChatBubbleSettings.tsx`):** Exposed in both `/settings` (`SettingsPage.tsx`) and `/messages` header popover; global disable persists across navigation, reload, and browser restart without auto-reopening.

### C. Chibi Fox Companion on Fox-Free Routes (`ChibiFoxWidget.tsx`)
- Renders only on routes where the 3D `FoxCompanionRail` is hidden (`/calendar`, `/messages`, `/work/quests/:questId`), with **zero WebGL canvases** (uses verified Gate I `/fox_poster.png`).
- Transparent background with grounded shadow, idle breathing animation, playful hop on click, smooth fade/spring speech bubble, page-wide mouse-tracking 3D tilt & facing (`window pointermove` + `requestAnimationFrame`), drag-to-move, corner drag-to-resize, and keyboard support (`Arrow` keys, `+/-`, `Home`).

---

## 3. Backend Capabilities Pending (~30% Remaining)
| Capability | Status | Required Backend Work |
| --- | --- | --- |
| Personal & Group Conversation REST APIs | **PENDING BACKEND** | `Conversation`, `Participant`, `Message` schema + cursor pagination |
| Realtime Messaging Pipeline | **PENDING BACKEND** | Socket.IO + Redis Pub/Sub event delivery & authorization |
| Authoritative Unread, Delivery & Read Receipts | **PENDING BACKEND** | Server-side receipt tracking & privacy-aware presence |
| Media Upload & Signed URL Storage | **PENDING BACKEND** | Presigned upload, MIME/size validation & conversation access control |
| Collaborative Quest Invitations & Challenges (FE-06B) | **PENDING BACKEND** | Invite/Accept/Decline & Duo/Group Challenge APIs |
| Friendship & Group Streaks + Authoritative Fox Triggers (FE-06C) | **PENDING BACKEND** | Server-authoritative streak calculation & event triggers |

---

## 4. Automated Quality Gates (All Passed)
| Gate | Command (`front-end/`) | Exit Code | Result |
| --- | --- | --- | --- |
| Typecheck | `npm run typecheck` | `0` | Passed |
| Lint | `npm run lint` | `0` | Passed (`0` errors, `0` warnings) |
| Gate I Checksums & Build | `npm run build` | `0` | Passed (`32/32` Gate I assets verified against `GATE_I_FINAL_SHA256SUMS.txt`; `6.96s`) |
| Unit / Integration | `npm run test` | `0` | **22 test files / 103 tests passed**, `0` failed, `0` skipped |
| E2E (Playwright) | `npm run test:e2e` | `0` | **31 tests passed**, `0` failed, `0` skipped (`14.3s`) |

---

## 5. Visual QA Coverage
Verified across Desktop (`1024x900`, `1280x900`, `1440x900`, `1920x1080`), Tablet (`820x1180`), and Mobile (`390x844`):
- Zero document-level horizontal overflow across all viewports.
- Zero vertical document overflow on `/messages` desktop viewport-fit workspace.
- Composer remains visible and accessible across Messenger and Floating Chat windows.
- Floating bubbles stay clamped inside viewport safe bounds and never obstruct `FoxCompanionRail` or critical controls.
- Fox Paw collapse/expand anchor shift verified `<= 1px` in Playwright E2E.
- Single active WebGL canvas (`<= 1`) verified across all route transitions.
