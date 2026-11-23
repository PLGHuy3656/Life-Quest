# Fox V2 — Gate G3 event contract, props / VFX and multi-mascot choreography

Business code reports **what happened**. The runtime decides how the fox shows it. Every payload field is optional
presentation data, and the fox reacts the same way without any of them. The runtime never decides challenge winners,
friendships, privacy or streak rules: those belong to the application layer. The GLB contains no user content:

- photos, comment text and avatars are never in the 3D assets;
- countdown values and team member counts or colours come from the application at runtime.

Sources:

- event registry: `07_WEB_PREVIEW/companion_sandbox_g3/src/mascot/FoxEventMap.ts`;
- clip contract and VFX timeline: `04_ANIMATIONS/g3_challenge_social/anim_spec_g3.json`;
- module: `06_EXPORTS/glb/modules/fox_v2_g3_challenge_social.anim.glb`.

The module is animation-only: it binds to the approved E2 Fox by node name and carries no second mesh.

## Events (typed: `FoxEventPayloads`)

Priority scale: 10 context · 20 normal · 30 important · 50 major · 60 critical.

| Event | Payload | Priority | Reaction (G3 module loaded) | Fallback (module missing) | Reduced motion |
|---|---|---|---|---|---|
| `CHALLENGE_INVITED` | `{ challengeId? }` | 20 | `challenge_invite` (token over the paw, energy ring, presentation pulse) | `smile` | clip (gentle) |
| `CHALLENGE_ACCEPTED` | `{ challengeId? }` | 30 | `challenge_accept` (clench, streaks, stomp, nod, ready aura) | `proud` | clip (gentle) |
| `CHALLENGE_STARTED` | `{ challengeId?, countdown? }` | 30 | `challenge_start` (crouch, 3 countdown pulses, launch hop) | `surprised` → `proud` | `proud` face |
| `CHALLENGE_WON` | `{ challengeId? }` | 50 | `challenge_win` + `proud` (jump with full turn, trophy, starburst, confetti, aura) | Gate F `happy` + `excited` (unchanged) | `proud` face |
| `CHALLENGE_LOST` | `{ challengeId? }` | 30 | `challenge_lose` (droop, crouch, emblem fades, determined, motivation spark) | Gate F `sad` pulse (unchanged) | clip (gentle) |
| `CHALLENGE_DRAW` | `{ challengeId? }` | 30 | `challenge_draw` (two equal emblems, tilt, shrug, `=`, friendly paw) | `smile` | clip (gentle) |
| `DUO_CELEBRATION` | `{ partnerId?, partnerSide? }` | 30 | `duo_celebrate` / `duo_celebrate_mirror` (mid-air high-five) | core `happy` | `happy` face |
| `GROUP_VICTORY` | `{ groupId?, members?, colors? }` | 50 | group data, then `group_victory` (120 bpm dance, team emblems orbit, collective burst) | `happy` + `excited` | data + `happy` face |
| `TEAM_ENCOURAGEMENT` | `{ teammateId?, side? }` | 20 | `team_encourage` (paw over heart, nod, reach, connection line) | `smile` | clip (gentle) |
| `GROUP_STREAK_ACTIVE` | `{ days?, members?, colors? }` | 30 | streak on (tier from `days`) + group data + `group_streak_active`, then the persistent group streak (`streak_active` loop + linked embers) | streak + group link + `happy` | streak + link + `proud` |
| `GROUP_STREAK_LOST` | `{ previousDays?, … }` | 50 | `group_streak_lost` (flame shielded, linked flames fade, ring breaks, smoke; streak inactive at the end) | link off, streak off, `sad` | same as fallback |
| `FRIEND_GREETING` | `{ friendId? }` | 20 | `friend_greet` (turns to the notification, wave, warm smile) | core `wave` + `smile` | clip (gentle) |
| `PHOTO_REACTION` | `{ photoId? }` | 20 | `photo_reaction` (blank frame, tilt, delighted hop, paw by the frame) | `happy` | clip (gentle) |
| `SOCIAL_LIKE_RECEIVED` | `{ postId?, count? }` | 20 | `receive_like` (2 s; bursts within 1.2 s are coalesced) | `smile` | clip (gentle) |
| `SOCIAL_COMMENT_RECEIVED` | `{ postId?, commentId? }` | 20 | `receive_comment` (bubble with typing dots only) | `smile` | clip (gentle) |
| `FRIEND_SUPPORT` | `{ friendId? }` | 20 | `friend_support` (quieter and closer than `team_encourage`) | `smile` | clip (gentle) |
| `FRIEND_MISS_YOU` | `{ friendId? }` | 20 | `friend_miss_you` (holds a friend icon close, hopeful wave; at most one every 20 s) | `smile` | clip (gentle) |

Notes:

- **Existing contracts are kept.**
  - `CHALLENGE_WON` / `CHALLENGE_LOST` keep their names, aliases and their Gate F reactions (now the `fallbackSteps`).
  - The solo `STREAK_LOST` keeps its alias `social.group_streak_broken`.
  - `FRIEND_CHEER` is unchanged.
- **Aliases:** `challenge.invited`, `challenge.accepted`, `challenge.started`, `challenge.won`, `challenge.lost`, `challenge.draw`,
  `duo.celebrate`, `group.victory`, `team.encourage`, `group.streak_active`, `group.streak_lost`, `social.friend_greeting`,
  `social.photo`, `social.like`, `social.comment`, `social.friend_support`, `social.miss_you` (plus their `social.*` / `friend.*` variants).
- **Visible daily-life state.** When a G2 state is visible (study, sleep …), events below that state's `minEventPriority` get a
  face or procedural reaction instead of a full-body clip. The `duo` step follows the same rule.

## Controller API added in G3 (presentation only)

```ts
fox.setChallengeCountdown(3)                 // the value challenge_start displays (3 / 2 / 1 / 'GO' …); null = abstract pulses
fox.setGroup({ members: 4, colors: ['#3EA2FF', '#9BE3C8', '#F6C85F', '#FF7AA8'] })   // team markers (counts / colours only)
fox.setGroupStreak(true)                     // persistent group-streak link (needs / turns on the streak flame)
fox.playDuo({ side: 'left' })                // duo clip for a partner on this fox's left / right
fox.cancel(tag?)                             // cancel one tagged one-shot (or all): effects stop, the clip's props are removed
fox.shot                                     // { clip, tag, time } — synchronisation
fox.getGroup()                               // { members, colors, linked, markersVisible, flamesLit }
```

The application owns the countdown, the timing of the start and the winner. The mascot only plays the pulses at the
clip's beats and shows the value it was given.

## Props and effects (`effects/fxLibraryG3.ts`, driven by the spec cues)

| Prop | Used by | Notes |
|---|---|---|
| `challenge_token` | invite / accept / lose | glowing coin; phases `paw` · `present` · `flash` · `fade_out` |
| `countdown` | start | badge above the head: application value or 3 → 1 dots |
| `trophy` | win | floating lathe cup; phase `shine` (highlight sweep) |
| `equal_emblem` | draw | two identical emblems + `=` (phase `equal`) |
| `team_markers` | group victory / streak | 1–8 coloured markers; phases `orbit` · `flames` · `flames_fade` (one by one) · `break` |
| `photo_frame` | photo reaction | blank Polaroid; `setPicture(texture)` for application content; phase `shine` |
| `heart` | like | extruded heart; phase `to_paw`; pops into small hearts |
| `chat_bubble` | comment | dots only; phases `typing` · `done` |
| `friend_icon` | miss you | generic silhouette badge; phases `hold` · `glow` |

Effect cues:

- `ring.paw`, `pulse.out`, `streaks.converge`;
- `aura.ready` / `aura.victory` / `aura.team`;
- `countdown.begin` / `countdown.pulse` / `countdown.end`, `ring.ground`, `speed.lines`, `flash.start`;
- `starburst.gold`, `dust.small`, `spark.motivation`, `sparks.symmetric`;
- `duo.contact`, `burst.heart`, `confetti.multi`, `team.orbit`, `burst.team`;
- `glow.warm`, `hearts.float`, `link.line`, `group.link.on` / `group.link.off`, `group.flames.fade`, `group.ring.break`, `embers.fade`;
- `sparkle.greet`, `pulse.heart`, `highlight`, `pulse.gentle`, `sparkle.return`, `beat`.

Every prop and effect:

- lives in the controller's fx root, so it follows the uniform level scale;
- is owned by the one-shot that cued it:
  - an interrupted or cancelled clip stops its effects;
  - its G3 props are removed when it ends;
  - the group-streak markers are the one documented exception: they persist as the group-streak state;
- freezes with `pause()`;
- under reduced motion: halves the particle counts, fades props in instead of popping them, and turns low-cost (no link embers);
- never touches the Fox mesh, skeleton, materials or the cosmetics sockets.

The streak flame stays the **single** G1.1 flame on `ATT_HAND_L`. G3 only flares it and adds ember arcs that fly into it.

## Multi-mascot choreography (`mascot/choreography/`)

```ts
const mgr = new FoxChoreographyManager();   scene.add(mgr.root);          // ONE scene, any number of foxes
mgr.add('me', foxA); mgr.add('friend', foxB);                              // FoxController instances (shared GLB, no geometry copy)
scene.add(foxA.object3D, foxB.object3D);
// render loop: mgr.update(dt) (updates every participant, then coordinators, then shared effects)

const duo = new FoxDuoCoordinator(mgr, foxA /* viewer's left */, foxB /* or null = solo */);
duo.layout();  duo.start();                // paw tips meet at the stage origin; both clips start on the same tick
duo.cancel('b');                           // B stops and cleans up; A finishes solo   ·  duo.cancel('both')
duo.report                                 // start ticks, clip-time Δ, contact distance / vertical gap, corrections

const group = new FoxGroupEffectCoordinator(mgr, [foxA], { mode: 'symbolic', members: 4 });  // 1 fox + markers
const party = new FoxGroupEffectCoordinator(mgr, [foxA, foxB, foxC], { mode: 'multi' });      // frame-locked
party.layout(); party.start('group_victory');
```

- **Synchronisation.** Starts happen in one update tick. Afterwards every fox advances on the same dt, so the clips are
  frame-locked (the measured clip-time difference is 0 s).
- **Duo contact.** The contact points come from the spec (`prop_anchors.duo_contact_l_head` / `_r_head`: paw tips at the
  contact frame).
  - `layout()` places both foxes so the paws meet, whatever their level scales.
  - With different levels, the height difference is absorbed in the air: the smaller fox jumps higher (a smooth bump, zero
    at take-off and landing), and a small shoulder correction (≤ 14°) closes the rest.
  - Mismatches are measured and reported, never hidden.
- **Why the contact is mid-air.** Upright foxes cannot touch paws, because the paw reaches 0.30 m from the fox's axis while
  the head is 0.34 m wide. So the foxes hop toward each other and arc outward at the apex. See the deformation report.
- **Shared cues.** `duo.contact` and `burst.heart`, and in multi mode `burst.team`, `confetti.multi` and `aura.team`, are taken
  over by the coordinator and drawn once per pair or group in `mgr.root`.
- **Multi mode.** Per-fox team markers are suppressed and replaced by one shared group aura and burst.
- **Cleanup.**
  - When a participant is removed, it is cancelled in every coordinator.
  - `mgr.cancelAll()` stops every coordinator and shared effect.
  - `mgr.dispose()` releases the stage. The controllers stay owned by the host.

## Harness

`#/g3` in `companion_sandbox_g3`:

- single-fox stage with every event, countdown and member inputs, and the test buttons;
- a multi-fox stage (one canvas, three foxes) with duo, solo and group controls.

Test hooks are `window.__g3` and `window.__g3multi`.
