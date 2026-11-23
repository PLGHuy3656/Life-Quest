# FOX-D03 — Quality Assurance & Test Report

## 1. Mandatory Quality Gates

| Gate | Command | Result |
| :--- | :--- | :---: |
| TypeScript | `npm run typecheck` | **PASS** (0 errors) |
| ESLint | `npm run lint` | **PASS** (0 errors, 0 warnings) |
| Production Build + Gate I Checksums | `npm run build` | **PASS** (`32/32` Gate I assets verified) |
| Unit & Integration Tests (Vitest) | `npm run test` | **PASS** (`14/14` files, `50/50` tests) |
| End-to-End Browser Suite (Playwright) | `npm run test:e2e` | **PASS** (`14/14` tests) |

## 2. Verified Test Coverage (`FoxDialogueEngine.test.ts` & `FoxSpeechBubble.test.tsx`)

- **Catalog Schema & Volume:** Verified `165` distinct Vietnamese lines (`idle: 35`, `encouragement: 22`, `dashboard: 22`, `social: 22`, `task: 28`, `deadline: 22`, `system: 14`), zero duplicate IDs or texts.
- **Pause Gates:** Verified idle chatter is suppressed while typing, modal open, lightbox open, Fox collapsed, or page hidden.
- **Priority Interruption:** Verified `DEADLINE_15M` interrupts `IDLE_CHATTER`, while `IDLE_CHATTER` never interrupts `DEADLINE_15M`.
- **Cooldown & Repeat Avoidance:** Verified per-event cooldown blocks rapid spam and consecutive emissions pick distinct lines without loops.
- **Task Contracts:** Verified `TASK_CREATED` and `TASK_COMPLETED` contracts without faking local completion.
- **Deadline Monitor:** Verified `60m`, `15m`, and `overdue` thresholds with UTC ISO timestamps, ignoring completed quests, and deduplicating across repeated checks.
- **Fake Timers:** Verified deterministic auto-expiration on `foxDialogueBus` via `vi.useFakeTimers()`.
- **UI & Accessibility:** Verified `panic` emotion styling + `aria-live="assertive"` + `Mở nhiệm vụ →` link, `Escape` dismissal, collapse hiding, reduced-motion, and single active WebGL `<canvas>` (`canvasCount <= 1`).
