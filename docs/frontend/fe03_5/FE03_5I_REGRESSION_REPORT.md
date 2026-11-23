# FE-03.5I — Regression Verification Report

## 1. Mandatory Quality Gates

| Gate | Command | Result |
| :--- | :--- | :---: |
| TypeScript | `npm run typecheck` | **PASS** (0 errors) |
| ESLint | `npm run lint` | **PASS** (0 errors, 0 warnings) |
| Production Build + Gate I Checksums | `npm run build` | **PASS** (`32/32` assets verified against `GATE_I_FINAL_SHA256SUMS.txt`) |
| Unit & Integration Tests (Vitest) | `npm run test` | **PASS** (`11/11` files, `36/36` tests) |
| End-to-End Browser Suite (Playwright) | `npm run test:e2e` | **PASS** (`12/12` tests) |

## 2. Cross-Route & Lifecycle Scenarios Verified

- **Fox WebGL Lifecycle:** Verified `canvasCount <= 1` on `/`, `/messages`, `/wardrobe`, and across `/ -> /messages -> /wardrobe -> /` navigation without duplicate WebGL contexts.
- **Rail Collapse Persistence:** Verified `fox-paw-toggle-right` collapse persists across route navigation (`/` → `/messages` → `/`) via `uiStore`.
- **Quick Create Draft Preservation:** Verified typed draft (`"Ôn tập kiến trúc hệ thống"`) survives Fox collapse, route navigation across `/messages` and `/wardrobe`, and Fox re-expansion.
- **Auto-Hide No Pinned Tasks:** Verified `shared-pinned-rail` renders `0` DOM nodes in production live mode when 0 pinned quests exist.
- **Live API Error Transparency & Auth Redirects:** Verified `AUTHENTICATION_REQUIRED` banner surfaces honestly on unauthenticated production `/` (no silent mock fallback), and both `/work` and `/profile` redirect unauthenticated users to `/login?redirect=...`.
- **Honest Social Capability Boundaries:** Verified submitting a post or clicking unmerged Social actions surfaces explicit `PENDING:` / `UNAVAILABLE:` status notices rather than faking persistence.
- **Backend & Mascot SDK Integrity:** Zero changes to `backend/`, Mascot Gate I SDK, or Fox V2 GLBs.
