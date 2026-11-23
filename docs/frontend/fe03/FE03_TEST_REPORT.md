# FE-03 QA & Test Report

- **Branch:** `feature/tv4-frontend` (FE-02 commit `e150df069897edccab9c14d35830aeb4698990fd`)
- **Approved Mascot Source Tag:** `mascot-v2-gate-i` (`812160dff9fd37d786bc7e07fb3873d116c077fb`)
- **Environment Note:** Playwright E2E ran on **headless Chromium**; native desktop/mobile GPU frame-rate claims are intentionally omitted.

## Quality Gates Summary

| Gate | Command | Result | Details |
|---|---|---|---|
| Asset Pipeline & Checksums | `npm run assets` (via `prebuild`) | **PASS** | **32/32** approved Gate I assets synced from `mascot-v2-gate-i` & verified against `GATE_I_FINAL_SHA256SUMS.txt` |
| TypeScript | `npm run typecheck` | **PASS** | 0 errors |
| ESLint | `npm run lint` (`--max-warnings 0`) | **PASS** | 0 errors, 0 warnings |
| Production Build | `npm run build` | **PASS** | 1,773 modules, 11.40s; main chunk `339.05 kB` (`103.69 kB` gzip), lazy 3D chunk `FoxCanvas-*.js` (`1,139.73 kB` / `312.03 kB` gzip) |
| Unit & Component (Vitest) | `npm run test` | **PASS** | **10/10 files, 33/33 tests passed** |
| Playwright E2E | `npm run test:e2e` | **PASS** | **8/8 tests passed** (4.0s) |

## New FE-03 Test Coverage
1. `src/features/mascot/MascotIntegration.test.tsx` (5/5):
   - WebGL unavailable (`jsdom`) renders accessible `FoxFallback` (`data-reason="webgl"`).
   - `context-lost` fallback renders and invokes retry handler cleanly.
   - `CanvasErrorBoundary` isolates mascot runtime errors without breaking sibling Dashboard UI.
   - `CompanionProvider` + `MascotEventAdapter` sync `html.lq-rm` reduced-motion, authoritative `level`, `APP_GREETING`, `TASK_CREATED`, and clean unmount without loops.
   - Tracks active controller lifecycle cleanly across mount/unmount cycles.
2. `src/features/wardrobe/WardrobePage.test.tsx` (1/1):
   - Renders `PREVIEW ONLY` badge, filters H1/H2 catalog by slot (`HEAD`), equips individual items, applies H2 `Tết` outfit preset (3 items), and resets to base (`0`).
3. `src/features/voice/VoiceAssistantSheet.test.tsx` (1/1):
   - Verifies `DEMO / ASR UNAVAILABLE` banner, Gate I voice phase transitions (`voice_listening_loop`, `voice_processing`), strict `TASK_CREATED` gate (unauthenticated submit emits `VOICE_RETRY_REQUESTED`, never `TASK_CREATED`; real Backend `201` emits `TASK_CREATED` → `task_notebook_confirm`).
4. `e2e/dashboard.spec.ts` (8/8):
   - Desktop `1440×900`, Tablet `820×1180`, Mobile `390×844`: responsive nav, Fox V2 mounted with `canvasCount <= 1` (zero duplicate WebGL contexts), zero horizontal overflow, production live-only `AUTHENTICATION_REQUIRED`.
   - `/?nowebgl=1`: accessible `FoxFallback` (`data-reason="webgl"`).
   - `/wardrobe`: H2 `Tết` outfit preset & reset + Voice Assistant dock sheet open/transition/`Escape` dismissal.
   - Route navigation (`/` → `/wardrobe` → `/`): cleans up previous renderer and maintains `canvasCount <= 1`.
   - FE-01/FE-02 regression checks (`lq-rm`, Quick-create Sheet `Escape`, protected `/work -> /login` redirect).
