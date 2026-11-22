# Fox V2 — Gate I Voice Assistant & Task Creation Event Contract

Contract version: `fox-v2/e2-anim+g1-module+g2.1-module+g3-module+i-module/f-runtime-5`.

Business code reports **what happened** in the voice-to-task workflow; the mascot runtime decides **how** the fox reacts. Every payload field is optional presentation metadata. The mascot SDK **never** implements speech recognition, microphone permission checks/requests, or task database persistence — those belong strictly to the host application.

**Critical rule:** `task_notebook_confirm` is **only** triggered when the application explicitly dispatches `TASK_CREATED`. It is never triggered by animation timers or clip completion.

Sources:
- Event registry: `07_WEB_PREVIEW/companion_sandbox_i/src/mascot/FoxEventMap.ts`
- Clip contract & VFX timeline: `04_ANIMATIONS/i_voice_assistant/anim_spec_i.json`
- Animation-only GLB module: `06_EXPORTS/glb/modules/fox_v2_i_voice_assistant.anim.glb`
- Blender source: `04_ANIMATIONS/i_voice_assistant/fox_anim_i.blend`

## 1. Animation Clips (8)

| Clip | Type | Duration | headControl | faceControl | Large motion | Props / VFX |
|---|---|---|---|---|---|---|
| `voice_listen_start` | one-shot (`rest` → `voice_listening_loop`) | 1.500 s (36 f) | 1.0 | 1.0 | no | `voice.ping`, `sparkle.soft` |
| `voice_listening_loop` | **state loop** (`voice_listening`) | 4.000 s (96 f) | 0.5 | 0.6 | no | `voice.waves` |
| `voice_processing` | **state loop** (`voice_processing`) | 4.000 s (96 f) | 1.0 | 1.0 | no | `voice.thinking` |
| `task_suggestion` | one-shot (`rest` → `rest`) | 2.750 s (66 f) | 1.0 | 1.0 | no | `voice.idea`, `sparkle.soft` |
| `task_notebook_open` | one-shot (`rest` → `task_notebook_write`) | 2.250 s (54 f) | 1.0 | 1.0 | yes | G2.1 `NotebookProp` (pop → open), `PencilProp` on `ATT_HAND_R` |
| `task_notebook_write` | **state loop** (`task_writing`) | 5.000 s (120 f) | 0.8 | 0.6 | no | G2.1 `NotebookProp`, `PencilProp`, `focus.particles` |
| `task_notebook_confirm` | one-shot (`task_notebook_write` → `rest`) | 3.250 s (78 f) | 1.0 | 1.0 | yes | `voice.check`, `NotebookProp` close/hide, `PencilProp` hide, `burst.stars` |
| `voice_retry` | one-shot (`rest` → `rest`) | 2.500 s (60 f) | 1.0 | 1.0 | no | `voice.retry_cue`, `sparkle.soft` |

## 2. Typed Semantic Events (`FoxEventPayloads`)

| Event | Payload | Priority | Reaction (Gate I module loaded) | Fallback (module missing) | Reduced motion |
|---|---|---|---|---|---|
| `VOICE_LISTEN_STARTED` | `{ sessionId? }` | 45 (urgent) | Clears prior voice states → `voice_listen_start` → `voice_listening_loop` + `voice.waves` | `smile` pulse | same (gentle) |
| `VOICE_LISTENING` | `{ sessionId? }` | 45 (urgent) | Enters/refreshes `voice_listening_loop` without replaying `voice_listen_start` | `smile` pulse | same |
| `VOICE_PROCESSING` | `{ sessionId? }` | 45 (urgent) | Exits listening → `voice_processing` loop + `voice.thinking` dots | `neutral` | same (static dots) |
| `TASK_SUGGESTION_READY` | `{ sessionId?, taskCount? }` | 50 (major) | Clears voice state → `task_suggestion` + `voice.idea` badge | `proud` pulse (2.2 s) | clip (gentle) |
| `TASK_NOTEBOOK_OPEN` | `{ sessionId? }` | 50 (major) | Exits listening/processing → `task_notebook_open` (sits, opens `NotebookProp`, takes `PencilProp`) → `task_notebook_write` loop | `proud` pulse | skips large-motion sit clip → `task_notebook_write` loop directly |
| `TASK_WRITING` | `{ sessionId? }` | 50 (major) | Enters/refreshes `task_notebook_write` loop with `NotebookProp` + `PencilProp` | `proud` pulse | same |
| `TASK_CREATED` | `{ sessionId?, taskId? }` | 50 (major) | When in `task_writing`: exits `task_writing` via `task_notebook_confirm` → `proud` (2 s). Otherwise: clears voice state → `happy` → `proud` | `happy` → `proud` | clears voice state → `proud` (2.5 s) |
| `VOICE_RETRY_REQUESTED` | `{ sessionId?, reason? }` | 50 (major) | Clears voice state (no confirm, hides props) → `voice_retry` | `surprised` pulse | clip (gentle) |
| `VOICE_CANCELLED` | `{ sessionId? }` | 60 (critical) | Immediately exits all voice states & cancels in-flight voice one-shots; hides notebook/pencil; returns to idle (or resumes suspended daily state); **never** plays `task_notebook_confirm` | clears state | clears state |
| `VOICE_PERMISSION_DENIED` | `{ sessionId? }` | 50 (major) | Clears voice state → `voice_retry` → `sad` pulse (2.2 s). Visual-only; never checks permissions | `sad` pulse (2.5 s) | clears voice state → `sad` pulse (2.5 s) |

## 3. Sequence Flow

```
VOICE_LISTEN_STARTED ──▶ voice_listen_start ──▶ voice_listening_loop (VOICE_LISTENING refreshes)
                                                        │
                                                 VOICE_PROCESSING
                                                        ▼
                                                 voice_processing (loop)
                                                        │
                                              TASK_SUGGESTION_READY
                                                        ▼
                                                 task_suggestion (one-shot)
                                                        │
                                               TASK_NOTEBOOK_OPEN
                                                        ▼
                                    task_notebook_open ──▶ task_notebook_write (TASK_WRITING refreshes)
                                                                   │
                                                            TASK_CREATED (app only)
                                                                   ▼
                                                          task_notebook_confirm ──▶ idle
```

At **any** point in the sequence:
- `VOICE_CANCELLED` aborts cleanly to `idle` (or resumes any suspended daily state) and disposes `NotebookProp` / `PencilProp`.
- `VOICE_RETRY_REQUESTED` aborts cleanly and plays `voice_retry`.
- `VOICE_PERMISSION_DENIED` aborts cleanly and plays `voice_retry` + `sad` pulse.

## 4. Cosmetics & Props Interaction

- `NotebookProp` and `PencilProp` are reused unchanged from Gate G2.1 (`fxLibraryG2.ts`).
- `PencilProp` attaches to `ATT_HAND_R`, which automatically activates the H1/H2 **hand-busy** rule for `HAND_RIGHT` cosmetics (`explorer_magnifier`, `mage_wand`, `tet_lixi`). They hide cleanly while the pencil is held and reappear automatically once `task_notebook_confirm` or `VOICE_CANCELLED` hides the pencil.
- All six H2 outfits (`outfit_student`, `outfit_sports`, `outfit_explorer`, `outfit_mage`, `outfit_ninja`, `outfit_tet`) remain equipped and attached through the entire sequence.
