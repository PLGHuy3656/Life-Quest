# FE-03 Mascot Event Matrix

| LifeQuest Trigger | Gate I Semantic Event (`FoxEventMap`) | Authoritative Gate / Guard | Target Animation / Behavior |
|---|---|---|---|
| Dashboard mount | `APP_GREETING` (`{ timeOfDay }`) | Local clock (`morning` / `afternoon` / `evening`) | Greeting wave / idle reaction |
| LIVE `GET /api/v1/today` returns `gamification.level` | `CompanionProvider.update({ level })` | Only when `source === 'LIVE'` (never mock) | `FoxController.setLevel(level)` scale & framing |
| Real quest created (`POST /api/v1/quests` → `201`) | `TASK_CREATED` (`{ title }`) | Only on real Backend `201` success | `task_notebook_confirm` / celebration reaction |
| Mic permission granted (Voice Sheet) | `VOICE_LISTEN_STARTED` | Explicit user click + `getUserMedia` grant | `voice_listen_start` → `voice_listening_loop` |
| Mic permission denied / unsupported | `VOICE_PERMISSION_DENIED` | Browser denial or missing `mediaDevices` | Graceful fallback / retry pose |
| Voice demo controls (Listening / Thinking / Suggesting / Open Notebook) | `VOICE_LISTENING`, `VOICE_PROCESSING`, `TASK_SUGGESTION_READY`, `TASK_NOTEBOOK_OPEN` | Explicitly labeled `DEMO / ASR UNAVAILABLE` | Gate I voice animation sequence |
| Voice task confirm submit | `TASK_WRITING` → (`201` ? `TASK_CREATED` : `VOICE_RETRY_REQUESTED`) | **Strict Backend gate:** `TASK_CREATED` never fires on unauthenticated/failed write | `task_notebook_write` → `task_notebook_confirm` or `voice_retry` |
| Voice sheet cancelled / closed | `VOICE_CANCELLED` | User close or Cancel button | Returns Fox to idle |
| Reduced-motion toggle (`html.lq-rm` or OS `prefers-reduced-motion`) | `FoxController.setReducedMotion(true)` | Synced live via `CompanionProvider` | Dampens motion & disables extra flourishes |
| XP / Streak celebration events | *(Deferred until Backend QuestExecution & Streak APIs exist)* | Not triggered from mock/hardcoded `0` streak | No fabricated reward animations |
