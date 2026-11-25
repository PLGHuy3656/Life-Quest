# FE-06A — LifeQuest Private Messenger Core Implementation

- **Checkpoint:** `FE-06A` (Messenger Core — stopped here awaiting user visual approval before FE-06B / FE-06C)
- **Branch:** `fix/FE` (uncommitted working tree, awaiting visual approval)
- **Route:** `/messages` (and `/messages/*`)

## 1. Architecture & Components (Implemented Frontend)
- [MessagesPage.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/messages/MessagesPage.tsx) & [MessagesPage.module.css](file:///D:/Development/LifeQuest_Repo/front-end/src/features/messages/MessagesPage.module.css): 3-region desktop workspace (Conversation Sidebar + Center Chat Workspace + Collapsible Conversation Details Panel) with single-viewport desktop fit (`0px` vertical & horizontal document scroll), tablet 2-column + overlay details drawer, and mobile 3-screen flow (`List → Chat → Details`).
- [ConversationSidebar.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/messages/ConversationSidebar.tsx): Search, `Tất cả / Cá nhân / Nhóm` filters, individual & 2-badge composite group avatars, unread counters, muted indicators, and empty-search recovery.
- [ChatTimeline.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/messages/ChatTimeline.tsx): `React.memo`-isolated message timeline with date separators, consecutive message grouping, Locket-inspired single & multi-image grids wired to `SocialMediaLightbox`, system notices, embedded Quest Invitation & Group Challenge preview cards, and honest local simulation badges (zero fabricated read receipts).
- [MessageComposer.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/messages/MessageComposer.tsx): Multiline auto-resizing composer with per-conversation draft retention, Vietnamese IME-safe `Enter` / `Shift+Enter` handling (`isComposing` + `keyCode === 229` guard), Escape-dismissible emoji popover, and local image attachment preview + remove controls.
- [ConversationDetailsPanel.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/messages/ConversationDetailsPanel.tsx): Friend/Group summary, mute toggle (local UI state), member list for groups, shared media gallery (opens `SocialMediaLightbox`), shared Quest shortcuts, and honest `FE-06C` Streak preview boundary.
- **AppShell Integration ([AppShell.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/components/shell/AppShell.tsx)):** Hides `FoxCompanionRail` and `FloatingMascotDock` on `/messages` so the 3-column Messenger uses full width cleanly with `0` WebGL canvases on `/messages` and `<= 1` WebGL canvas globally.

## 2. Explicit Scope Boundaries
- **Implemented Frontend:** Full 3-column responsive UI, local preview simulation, attachment preview, lightbox integration, IME-safe composer, empty/pending/unauthorized states, unit & E2E tests.
- **Preview UI:** Conversations, messages, embedded Quest/Challenge cards, and local sends are explicitly labeled `PREVIEW` / `Mô phỏng cục bộ (chưa gửi máy chủ)`.
- **Pending Backend:** Real message persistence, Socket.IO delivery/read receipts, presence, media upload storage, group creation/membership mutations, Quest invitations, and Friendship/Group Streaks.
- **Future Checkpoints:** `FE-06B` (Private Social Interactions) & `FE-06C` (Streak & Fox Animations) — not started until user approves `FE-06A`.
