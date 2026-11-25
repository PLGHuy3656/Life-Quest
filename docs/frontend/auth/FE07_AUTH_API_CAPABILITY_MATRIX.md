# FE-07 — Authentication API Capability Matrix

Audited against:
- `backend/src/modules/auth/authRoute.js`, `authController.js`, `authService.js`, `authValidation.js`, `authRepository.js`
- `backend/src/common/middleware/authenticate.js`
- `backend/prisma/schema.prisma`
- `front-end/src/services/api/authApi.ts`, `httpClient.ts`, `config.ts`
- `front-end/src/stores/authStore.ts`

## 1. Endpoint & Capability Classification

| Capability | Classification | Backend Endpoint | Actual Request / Response Contract | Frontend Status & Boundary |
| --- | --- | --- | --- | --- |
| Sign In (Email + Password) | **AVAILABLE** | `POST /api/v1/auth/login` | Req: `{ email (trimmed), password }` • Res: `{ success, data: { accessToken, refreshToken, user: { id, email, username, status } } }` | Wired via `authApi.login()`. Tokens held strictly in RAM (`useAuthStore`). No `rememberMe` field in contract. |
| Register Account | **AVAILABLE** | `POST /api/v1/auth/register` | Req: `{ email, username (3..50), password (8..72) }` • Res: `{ success, data: { id, email, username, status, createdAt } }` | Wired via `authApi.register()`. Client validation matches Backend Joi exactly (`username 3..50`, `password 8..72`). |
| Access Token Refresh | **AVAILABLE** | `POST /api/v1/auth/refresh` | Req: `{ refreshToken }` • Res: `{ success, data: { accessToken } }` | Single-flight 401 refresh guard in `httpClient.ts` (never retries `/auth/*`, prevents infinite refresh loops). |
| Sign Out (Session Revoke) | **AVAILABLE** | `POST /api/v1/auth/logout` | Header: `Authorization: Bearer <accessToken>` • Req: `{ refreshToken }` • Res: `{ success, data: { message } }` | Wired via `authApi.logout()`. Clears `useAuthStore`, TanStack Query cache, and `useMessengerStore` private session. |
| Current Authenticated Profile | **AVAILABLE** | `GET /api/v1/users/me` | Header: `Authorization: Bearer <accessToken>` • Res: `{ user, profile, settings, gamification }` | Wired via `usersApi.getMe()`. |
| Forgot Password (Email Reset Request) | **PENDING BACKEND** | `POST /api/v1/auth/forgot-password` *(TODO stub)* | Route exists (`{ email }`), but `authService.js:211` is a `// TODO` placeholder with no email service or token persistence. | `/forgot-password` renders honest `PENDING BACKEND` visual UI. `authApi.forgotPassword()` throws `501 FEATURE_UNAVAILABLE`; never fakes "email sent". |
| Reset Password (Token Confirmation) | **PENDING BACKEND** | `POST /api/v1/auth/reset-password` *(TODO stub)* | Route exists (`{ token, newPassword (8..72) }`), but `authService.js:218` is a `// TODO` placeholder with no token verification. | `/reset-password` renders honest `PENDING BACKEND` visual UI. Never generates fake reset tokens or false success states. |
| Email Verification Flow | **PENDING BACKEND** | *(none)* | `User.emailVerifiedAt` exists in Prisma schema, but no verification email or endpoint exists. | Not faked on Register; user navigates to `/login` after verified `201` registration response. |
| HttpOnly Cookie Session Persistence | **UNSUPPORTED** | *(none)* | Backend returns `accessToken` + `refreshToken` in JSON body; no cookie middleware configured. | Tokens are stored strictly in memory (Zustand RAM) to prevent XSS token theft from `localStorage`/`sessionStorage`. Full page reload requires re-auth until Backend adds HttpOnly cookies. |
| Remember-Me Persistent Session | **UNSUPPORTED** | *(none)* | Not present in `authValidation.login`. | Omitted from Login UI to avoid fake/misleading controls. |
| OAuth / Social Login | **UNSUPPORTED** | *(none)* | No OAuth providers configured. | Not rendered on Auth pages. |

## 2. Runtime Integration Notes
- **Vite Dev Proxy:** `/api -> http://localhost:3000` (`front-end/vite.config.ts`). Backend `app.js` does not yet configure CORS middleware for cross-origin production deployments.
- **Local Verification Blocker:** Automated frontend E2E tests (`playwright test`) run against `vite preview` without a live PostgreSQL/Express Backend process, so live login/register flows are verified in Vitest & Playwright using isolated API mocks while keeping real `fetch` calls in production code.
