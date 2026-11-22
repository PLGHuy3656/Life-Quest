# Fox V2 — Gate G2 event & state contract (daily life)

Business code says **what happened**; the runtime decides how the fox shows it. All payload fields are optional
(the fox reacts the same way without them). No event implements audio, notifications or permissions: the runtime
only exposes visual and state events (`alarm-visual`, `state`, `cooldown`) that the application layer may use
to drive its own sound / permission logic.

## Events

| Event | Payload (TypeScript) | Priority | Reaction (G2 module loaded) | Fallback (module missing) |
|---|---|---|---|---|
| `STUDY_STARTED` | `{ taskId?, subject? }` | 30 | `study_start` → state **study** (`study_focus` loop, notebook + pencil, focus particles) | idle + `proud` pulse |
| `STUDY_COMPLETED` | `{ taskId?, minutes? }` | 30 | `study_complete` → idle / next state | `happy` pulse |
| `SPORTS_STARTED` | `{ activity? }` | 30 | `sports_start` → state **sports** (`sports_active` jog loop, sweat drops) | idle + `excited` pulse |
| `SPORTS_COMPLETED` | `{ activity?, minutes? }` | 30 | `sports_complete` → idle / next state | `happy` pulse |
| `SLEEP_ENTERED` | `{ source? }` | 30 | `sleep_enter` → state **sleep** (`sleep_loop`, pillow + mat, Z + glow) | activity `resting` (sleepy face) |
| `SLEEP_ENDED` | `{ source? }` | 30 | `sleep_wake` → idle | back to idle |
| `WAKE_REQUESTED` | `{ source? }` | 30 | asleep: `wake_start` → idle · awake: `wave` + smile | asleep: idle · awake: `wave` |
| `WAKE_LATE` | `{ minutesLate? }` | 30 | `wake_late` (asleep: `wake_start` first, `wake_late` queued) | `surprised` pulse |
| `ALARM_STARTED` | `{ alarmId?, label? }` | 60 | state **alarm** (`alarm_ring` loop, clock + ring arcs); asleep: `wake_start` first | idle + `surprised` pulse |
| `ALARM_DISMISSED` | `{ alarmId?, snoozed? }` | 60 | `alarm_success` → previous state / idle; `snoozed: true` → no celebration (sleepy pulse) | idle |
| `COOLDOWN_STARTED` | `{ cooldownId?, progress?, durationS? }` | 20 | state **cooldown** (`cooldown_wait`, hourglass + progress ring); repeating it refreshes the data | idle |
| `COOLDOWN_COMPLETED` | `{ cooldownId? }` | 20 | `cooldown_complete` → previous state / idle | idle |

Aliases: `study.started`, `focus.started`, `study.completed`, `sports.started`, `exercise.started`, `sleep.entered`,
`sleep.ended`, `wake.requested`, `wake.late`, `alarm.started`, `alarm.ring`, `alarm.dismissed`, `alarm.stop`,
`cooldown.started`, `cooldown.completed`, `cooldown.ready`.

## States

| State | Priority | Loop | Props | Loop fx | Tap answer | Non-state events that may play a clip over it |
|---|---|---|---|---|---|---|
| alarm | 60 | `alarm_ring` | alarm clock | ring arcs, clock shake | `head_pet` / `tail_touch` (standing) | priority ≥ 60 |
| sleep | 50 | `sleep_loop` | pillow, mat | Z letters, night glow | procedural ear twitch / tail flick, eyes stay closed | priority ≥ 60 |
| sports | 40 | `sports_active` | — | sweat drops | `head_pet` / `tail_touch` over the jog | priority ≥ 30 |
| study | 35 | `study_focus` | notebook, pencil | focus particles | face pulse + procedural (stays seated) | priority ≥ 50 |
| cooldown | 25 | `cooldown_wait` (→ `cooldown_wait_impatient` after `impatienceAfterS`) | hourglass timer | — | `head_pet` / `tail_touch` | priority ≥ 20 |

* Several states can be active; the highest priority one is visible, the others are suspended and **resume with
  their start clip** when it ends (e.g. alarm during study → `alarm_success` → `study_start` → study loop).
* A temporary head-pet / tail-touch never ends a state. Idle variation is gated off by every state loop.
* A state left while its start clip is still playing fades that clip out over `DAILY_TUNING.postureFade` (0.45 s)
  — no complete clip from a half-done pose.
* Reduced motion: large start / complete clips are skipped (face pulse instead); `sports` uses the idle base
  without sweat; other loops are kept.

## Runtime API (FoxController)

```ts
fox.handleEvent('COOLDOWN_STARTED', { durationS: 45 })   // or { progress: 0.2 } and stream progress:
fox.setCooldown({ progress: 0.6 })                        // data from the app (0..1); durationS only interpolates display
fox.setDailyTuning({ impatienceAfterS: 30 })              // presentation parameter (default 20 s), not a business rule
fox.enterState('study'); fox.exitState('study', 'complete' | 'cancel')
fox.getDailyState()   // { visible, active[], pending, interaction, cooldown, … }
fox.setLowCostEffects(true)                               // small displays
fox.on(e => { if (e.type === 'alarm-visual') audio.toggle(e.ringing) })   // app-owned audio / permissions
// events: { type: 'state', state, phase: 'enter'|'visible'|'suspended'|'resumed'|'exit'|'refresh', cause, fallback? }
//         { type: 'alarm-visual', ringing } · { type: 'cooldown', progress, impatient }
```
