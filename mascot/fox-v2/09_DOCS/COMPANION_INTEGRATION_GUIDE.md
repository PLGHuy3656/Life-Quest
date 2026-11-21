# Companion Integration Guide (LifeQuest Web)

How to bring the Gate F runtime (with the Gate G1 quest / reward / streak module) into the LifeQuest frontend later. The sandbox
(`07_WEB_PREVIEW/companion_sandbox`) is the reference implementation; copy `src/mascot/` as a
package or folder, and adapt `src/components/FoxCanvas.tsx` and `CompanionContext.tsx` to the app.

## 1. Principle: business events in, reactions out

Pages never call clips or morphs. They report **what happened**:

```ts
companion.publish('TASK_COMPLETED', { taskId, xp: 50 });
companion.publish('LEVEL_UP', { level: 9 });
companion.publish('STREAK_LOST', { previousDays: 12 });
companion.publish('STREAK_UPDATED', { days: 9 });      // on load and whenever the count changes (flame tier)
companion.publish('QUEST_STARTED', { questId });
companion.publish('XP_GAINED', { amount: 50 });
companion.publish('ACHIEVEMENT_UNLOCKED', { achievementId });
```

`FoxEventMap.ts` decides how the fox reacts. That mapping lives in one place and can change
(Gate G: new clips) without touching any page. The app also keeps owning business state such as the
real level and XP. The fox only reflects it: `setLevel(level)` on load, `LEVEL_UP` when it changes.

## 2. Embedding with React Three Fiber (as in the sandbox)

```tsx
<CompanionProvider>                       {/* settings + event bus + instance registry */}
  <FoxCanvas presentation="mini"   label="Cáo LifeQuest" style={{ width: 200, height: 200 }} />
  <FoxCanvas presentation="widget" label="Cáo LifeQuest" style={{ width: 360, height: 440 }} />
  <FoxCanvas presentation="full"   label="Cáo LifeQuest" orbit />
</CompanionProvider>
```

`FoxCanvas` already handles:

- creating and disposing the controller;
- framing per presentation;
- pausing when offscreen or when the tab is hidden;
- the render binding;
- WebGL and GLB-error fallbacks;
- syncing settings to the controller.

Recommended production defaults:

- **One live 3D companion per screen.** The dashboard mini card or the floating widget, not both. Each `<Canvas>` is a WebGL context; geometry is shared on the CPU, but every context uploads its own GPU buffers. The sandbox shows both at once only to prove they share one controller class and one model.
- `presentation="mini"` already requests a low-power GPU context.
- To hide the companion briefly (modal, collapsed widget), use `suspended`, not unmount: re-mounting costs ≈ 0.9 s on a Radeon 780M (context creation + shader compilation).
- Keep `dpr={[1, 2]}`.

## 3. Embedding without React (plain three.js)

```ts
import { FoxController, frameFoxCamera } from './mascot';
const fox = await FoxController.create({
  modelUrl: '/models/fox_v2_anim_e2.glb', level: user.level,
  modules: ANIMATION_MODULES.map(m => ({ id: m.id, url: '/' + m.path, clips: m.clips })),   // G1 module(s)
  streak: user.streakDays >= 3 ? { active: true, days: user.streakDays } : undefined,
});
scene.add(fox.object3D);
frameFoxCamera(camera, 'widget');
fox.attachView({ camera, domElement: renderer.domElement });
const binding = fox.bindRenderer();
renderer.setAnimationLoop(() => {
  fox.update(clock.getDelta());
  binding.render(() => renderer.render(scene, camera));
});
// teardown
renderer.setAnimationLoop(null); fox.dispose(); renderer.dispose();
```

Also stop the loop yourself when the element is offscreen or `document.hidden` is true, and call `fox.pause()` / `fox.resume()`.

## 4. Event registry — extending in Gate G

```ts
// 1) type the payload (declaration merging)
declare module './mascot/FoxEventMap' {
  interface FoxEventPayloads { HABIT_PERFECT_WEEK: { habitId: string } }
}
// 2) register the reaction (only clips that exist in the loaded GLB)
foxEventRegistry.register('HABIT_PERFECT_WEEK', {
  priority: 30, coverage: 'native', cooldownS: 5,
  steps: [{ kind: 'play', clip: 'happy' }, { kind: 'mood', mood: 'proud', durationS: 3 }],
  aliases: ['habit.perfect_week'],
  note: 'Perfect week on one habit.',
});
```

- **When a new Gate G clip arrives** (done this way for G1):
  1. export it in an animation-only module GLB (armature + face carriers, no body) and add the module to `ANIMATION_MODULES`, its clip names to the `G1_*`-style lists and `CLIP_META` in `foxContract.ts`; the loader then validates every track against the E2 Fox;
  2. change the affected events' `steps` to the new clip, keep the old reaction as `fallbackSteps` (used when the module is missing), add `reducedMotionSteps` if the clip is large-motion;
  3. set their `coverage` to `native` and `since` to the gate.

  The TypeScript types stop you from referencing a clip that is not in the contract.
- **Aliases:** they map the dashboard prototype's Mascot Context Engine names (`task.completed`, `habit.checkin`, `quest.completed`, `social.challenge_win`, …) onto the canonical events. A duplicated alias throws.
- **Unknown events:** they return `{ result: 'unknown' }` with a console warning and never throw.

### Current mapping (Gate G1)

| Event | Priority | Coverage | Reaction | Fallback (module missing) | Planned clip |
|---|---|---|---|---|---|
| QUEST_STARTED | 20 | native (G1) | `quest_start` | proud face 2 s | – |
| QUEST_COMPLETED | 50 | native (G1) | `quest_complete` → proud face 2 s | `happy` → proud face 3 s | – |
| QUEST_EXPIRED | 50 | native (G1) | `quest_failed` | sad face 4 s | – |
| XP_GAINED | 20 | native (G1) | `receive_xp` | smile 1.5 s | – |
| LEVEL_UP | 50 | native (G1) | `level_up`; the new level is applied at the jump apex → proud face 2.5 s | setLevel → `happy` → proud face 3 s | – |
| ACHIEVEMENT_UNLOCKED | 50 | native (G1) | `achievement_unlock` → proud face 2 s | `happy` → proud face 3 s | – |
| STREAK_UPDATED | 10 | native (G1) | state only: flame tier from `days`, base `streak_active` while idle | – | – |
| STREAK_MILESTONE | 30 | native (G1) | flame tier from `days` → `streak_cheer` | tier → `happy` → proud face 3 s | – |
| STREAK_LOST | 50 | native (G1) | `streak_lost` (lightning, temporary char, flame out, streak off at the end) | streak off + sad face 4 s | – |
| TASK_COMPLETED | 20 | native | `happy` | – | – |
| HABIT_CHECKED_IN | 20 | fallback | proud face 2.5 s | – | proud_pose |
| CHALLENGE_WON | 50 | partial | `happy` → excited face 2.5 s | – | celebrate |
| CHALLENGE_LOST | 30 | fallback | sad face 3 s | – | sad_react |
| QUEST_DEADLINE_URGENT | 45 | fallback | surprised face 3 s (6 s cooldown) | – | panic |
| FRIEND_CHEER | 20 | native | `wave` → smile 2 s | – | – |
| APP_GREETING | 10 | native | idle → `wave` (30 s cooldown) | – | – |
| USER_IDLE | 0 | fallback | activity `resting` (idle 0.8× + sleepy face) | – | sleep_loop |
| USER_RETURNED | 10 | native | idle → `wave` | – | – |

Typical sequences: completing a quest publishes `QUEST_COMPLETED` then `XP_GAINED` — `receive_xp` waits in the queue and plays after `quest_complete`. If that XP causes a level-up, publish `LEVEL_UP` too (priority 50: it plays after the current major reaction, the scale changes at its apex).

## 5. Settings the app should expose (map onto the LifeQuest Settings › Mascot section)

| LifeQuest setting | Runtime call |
|---|---|
| Show mascot | mount / unmount the canvas (dispose is complete, see the runtime report) |
| Follow cursor | `setLookAtEnabled` |
| React to events | stop publishing, or publish only major events |
| Reduce motion (`lq-rm` or OS preference) | `setReducedMotion(true)` |
| Disable interaction | `setInteractionEnabled(false)`, e.g. while a modal is open |
| Mascot effects (confetti, flame, lightning…) | `setEffectsEnabled(false)` or per category `setEffectVisible('lightning', false)`; state changes (level, streak) still apply |

## 6. Asset hosting

- **Module GLB:** `fox_v2_g1_quest_reward_streak.anim.glb` is 1.0 MB (animation data only); load it in parallel with the base GLB. If it fails, the fox still works with F fallbacks.
- **GLB:** serve it with long-lived caching (2.7 MB uncompressed; the content hash is in the file manifest). It can be compressed in transit (gzip / brotli). Meshopt or Draco compression is not applied yet (see known limitations).
- **Poster:** `public/fox_poster.png` is the static fallback for no-WebGL and load failures. Re-render it if the model ever changes.

## 7. Accessibility

- The canvas has `role="img"` plus an `aria-label`. When focused: Enter / Space pets the head, T touches the tail.
- Interaction is always optional; no feature depends on it.
- Reduced motion is honoured from the OS preference, and can also be forced from app settings.
