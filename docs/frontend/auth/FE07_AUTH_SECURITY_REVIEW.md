# FE-07 — Authentication Security Review

## 1. Token & Credential Handling
- **RAM-only tokens:** Both `accessToken` and `refreshToken` live strictly in Zustand memory (`useAuthStore`). Neither token is ever persisted to `localStorage` or `sessionStorage`, eliminating XSS token exfiltration from browser storage until Backend supports HttpOnly cookies.
- **Password handling:** Passwords are never trimmed, mutated, logged, or stored in browser storage. Email inputs are trimmed and lowercased before submission.
- **Account enumeration avoidance:** Login error feedback does not disclose whether an email address is registered. Password recovery pages are explicitly marked `PENDING BACKEND` and never fabricate reset tokens or "email sent" confirmations.

## 2. Open Redirect & Loop Prevention
- `validateSafeRedirect(raw, fallback)` in `front-end/src/features/auth/authRedirect.ts`:
  - Rejects external URLs (`https://evil.com`), protocol-relative URLs (`//evil.com`), backslash bypasses (`/\evil.com`), and control characters.
  - Rejects auth routes (`/login`, `/register`, `/forgot-password`, `/reset-password`) to prevent redirect loops.
  - Strips internal QA parameters (`?authGuard=strict`) before encoding the post-login destination.

## 3. Cross-Feature Account Isolation
- On logout: `useAuthStore.clearSession()`, `queryClient.clear()`, and `useMessengerStore.clearPrivateSession()` execute together in `finally`, guaranteeing zero residual user profile, quest, or private chat draft leakage across accounts.
- `FloatingChatHost` is excluded from `/login`, `/register`, `/forgot-password`, and `/reset-password`.

## 4. Known Backend Integration Blockers & Remaining Work
1. **HttpOnly Cookie Refresh:** Backend currently returns `refreshToken` in JSON body; full browser reload clears in-memory RAM tokens until Backend adopts HttpOnly Secure SameSite cookies.
2. **Password Recovery Pipeline:** `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password` remain `TODO` stubs in `backend/src/modules/auth/authService.js`.
3. **CORS Middleware:** Backend `src/app.js` requires explicit CORS origin configuration for cross-origin production deployment.
4. **Production Strict Guard Toggle:** Set `VITE_STRICT_AUTH_GUARD=true` in production environments once live Backend authentication is deployed.
