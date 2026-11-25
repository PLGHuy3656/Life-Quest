# FE-06A.1 — Global Floating Chat Architecture

## 1. Overview
FE-06A.1 extends FE-06A Private Messenger with a persistent global floating chat system ("Bong bóng chat") mounted once at the authenticated `AppShell` level. Users can keep conversations accessible across Dashboard, Work Hub, Calendar, Wardrobe, Cosmetic Shop, Profile, Settings, and future authenticated pages without duplicating messaging logic or WebGL canvases.

## 2. Component Hierarchy & Boundaries
Mounted **once** inside `front-end/src/components/shell/AppShell.tsx`:

```text
AppShell
 └─ FloatingChatHost (single global instance; unmounted on /login, /register, or when disabled)
     ├─ FloatingBubbleDock (draggable pointer/touch dock, edge snap, max 3 visible + overflow menu)
     │   └─ FloatingChatBubble (React.memo; private/group avatar, unread badge, non-nested close button)
     └─ FloatingChatWindow (364px desktop / responsive bottom sheet on mobile; hidden on /messages)
         ├─ ChatTimeline (reused directly from FE-06A)
         ├─ MessageComposer (reused directly from FE-06A)
         └─ SocialMediaLightbox (reused directly from FE-06A)
```

Settings integration (`ChatBubbleSettings`):
- Embedded in `SettingsPage.tsx` (`/settings`) under **"Bong bóng chat"**.
- Embedded as a compact popover in `MessagesPage.tsx` (`/messages`) header so users can toggle, close all bubbles, or reset position directly from Messenger.

## 3. Shared Messaging Data Layer
- Store: `front-end/src/stores/messengerStore.ts` (Zustand).
- Both `MessagesPage` and `FloatingChatHost` read/write the same `conversations`, `messagesByConv`, `draftsByConv`, and `attachmentsByConv` slices.
- Zero duplicate API subscriptions, zero duplicate WebSocket connections, and targeted selectors ensure composer keystrokes never rerender `FloatingChatBubble` items.
- Deep-linking: clicking **"Mở toàn màn hình"** in `FloatingChatWindow` navigates to `/messages?conv=<id>`, preserving drafts and timeline history.

## 4. Route Coexistence & Persistence
- **Authenticated app routes (`/`, `/work/*`, `/calendar`, `/wardrobe/*`, `/profile`, `/settings`):** Floating dock and expanded chat window persist across route navigation.
- **Full Messenger route (`/messages`):** Expanded `FloatingChatWindow` automatically collapses (`data-messenger-coexistence="collapsed"`) while `activeFloatingConvId` remains preserved in store, preventing duplicate chat windows. Navigating away restores the expanded window seamlessly.
- **Unauthenticated routes (`/login`, `/register`):** `AppShell` and `FloatingChatHost` are never mounted.

## 5. Fox Companion Coexistence
- `FloatingChatHost` receives `isFoxVisible` from `AppShell`.
- Default desktop dock position is bottom-left (`left: 14px`, `normalizedY: 0.82`), with the expanded chat window opening at `left: 82px, bottom: 18px` — completely clear of the right-side `FoxCompanionRail`, Fox's face, and overhead `FoxSpeechBubble`.
- If the user drags the dock to the right edge on a Fox-visible desktop route, `FloatingChatWindow` offsets left of `FoxCompanionRail` (`right: 332px`) so Fox interaction is never obstructed.
- Zero additional WebGL canvases are created.

## 6. Account Isolation & Security Boundaries
- Preference storage key is scoped per account: `lq_floating_chat_prefs_v1::<scope>` (`user_<userId>` when authenticated, `preview-guest` in hybrid preview mode).
- `localStorage` stores **only** `{ enabled, dockSide, normalizedY, openBubbleIds }` (validated safe IDs). Private message bodies, drafts, and auth tokens are **never** written to `localStorage`.
- On logout (`authStore.clearSession()` -> `messengerStore.clearPrivateSession()`), all in-memory messages, drafts, ObjectURLs, and active windows are immediately wiped.
- Switching accounts via `syncAccountScope(nextScope)` clears previous runtime state and loads only the new user's safe preferences.

## 7. Backend Boundaries (Frontend-First Checkpoint)
- Messaging REST/Socket.IO delivery, authoritative unread counts, read receipts, online presence, and media upload remain **PENDING BACKEND**.
- Preview fixtures and local simulated sends are explicitly labeled `PREVIEW` / `Mô phỏng cục bộ`.
- Backend remains authoritative for conversation membership and authorization once integrated.
