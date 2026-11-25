# FE-07 — Authentication Architecture

## 1. Routes & Public vs Protected Boundary
Configured in `front-end/src/app/router.tsx`:
- **Public Auth Routes (outside `AppShell` — no `FloatingChatHost`, no `ChibiFoxWidget`, zero WebGL canvas):**
  - `/login` → `LoginPage`
  - `/register` → `RegisterPage`
  - `/forgot-password` → `ForgotPasswordPage` (`PENDING BACKEND`)
  - `/reset-password` → `ResetPasswordPage` (`PENDING BACKEND`)
- **Strict Protected Routes (`ProtectedRoute mode="strict"`):**
  - `/profile`, `/settings` — always redirect unauthenticated users to `/login?redirect=<validated>`.
- **Workspace Protected Routes (`ProtectedRoute mode="workspace"`):**
  - `/`, `/work/tasks`, `/work/tasks/:taskId`, `/work/tasks/:taskId/focus`, `/work/habits`, `/work/quests`, `/work/quests/:questId`, `/calendar`, `/messages`, `/messages/*`, `/wardrobe/*`.
  - Enforce authentication redirect when `VITE_STRICT_AUTH_GUARD=true` or `?authGuard=strict` is active.
  - Retain explicit preview access when running frontend-only QA without a live Backend server (never silently pretending guards are active when bypassed).

## 2. Shared UI & Fox Companion Integration
- `AuthLayout.tsx` provides a responsive split layout (`1.05fr / 1fr` on desktop `>= 960px`, single column `< 960px`) using the approved Gate I `/fox_poster.png` artwork (zero WebGL canvas).
- Supported Fox reaction states: `LOGIN_IDLE`, `EMAIL_FOCUS`, `PASSWORD_FOCUS`, `LOGIN_SUCCESS`, `LOGIN_ERROR`, `REGISTER_SUCCESS`, `RECOVERY_PENDING`.
- Respects `html.lq-rm` and `prefers-reduced-motion: reduce`.

## 3. Auth State, Session Refresh & Logout Flow
- **Store:** `useAuthStore` (Zustand, RAM-only — no `localStorage`/`sessionStorage` token persistence).
- **Single-Flight Refresh:** `httpClient.ts` intercepts `401` on authenticated non-`/auth/*` calls, runs one shared `POST /api/v1/auth/refresh`, retries the original request once (`_isRetry: true`), and expires the session cleanly on failure without infinite loops.
- **Logout (`AppShell.tsx` & `SettingsPage.tsx`):**
  1. Calls `POST /api/v1/auth/logout` with `{ refreshToken }` when present.
  2. Clears `useAuthStore` (`clearSession()`).
  3. Clears TanStack Query cache (`queryClient.clear()`).
  4. Wipes `useMessengerStore` private in-memory state & closes floating chat windows (`clearPrivateSession()`).
  5. Redirects to `/login`.
