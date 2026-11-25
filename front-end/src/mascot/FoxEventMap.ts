import { CLIP_META, type FoxActivity, type FoxMood, type FoxOneShotClip, type FoxState } from './foxContract';
import { PRIORITY } from './FoxAnimationManager';

// LifeQuest → Fox semantic event mapping. Business code only ever says WHAT happened
// (fox.handleEvent('QUEST_COMPLETED')); this registry decides HOW the fox reacts, using ONLY clips
// that exist in the contract (E2 core GLB + validated animation modules). Gate G1 replaced the
// quest / reward / streak fallbacks with real clips; each such event keeps its previous reaction as
// `fallbackSteps`, used automatically if the module is not loaded. Events still without a clip keep
// their documented fallback and name the clip a later gate is expected to add (`plannedClip`).
// No clip is ever fabricated: `play` steps are typed to FoxOneShotClip.

export type FoxReactionStep =
  | { kind: 'play'; clip: FoxOneShotClip }
  | { kind: 'mood'; mood: FoxMood; durationS?: number }
  | { kind: 'activity'; activity: FoxActivity }
  | { kind: 'level'; from: 'payload' }
  /** Streak state: active flag + tier from payload.days (or kept). */
  | { kind: 'streak'; active: boolean; from?: 'payload' }
  /** Gate G2: start / end a daily-life state. via = clip replacing the state's start / complete clip ('none' = no clip).
   *  outcome 'payload' = 'cancel' when payload.snoozed / payload.cancelled is true, else 'complete'. */
  | { kind: 'state'; state: FoxState; op: 'enter' | 'exit'; via?: FoxOneShotClip | 'none'; outcome?: 'complete' | 'cancel' | 'payload' }
  /** Gate G3: duo high-five — duo_celebrate or its mirror, chosen by payload.partnerSide / the duo role set by FoxDuoCoordinator. */
  | { kind: 'duo' }
  /** Gate G3: group presentation data / group-streak link (team markers + linked embers). Data only — no business rule. */
  | { kind: 'group'; op: 'data' | 'streak-on' | 'streak-off' }
  /** Gate I: cancel all active voice states & in-flight voice one-shots cleanly (never triggers task_notebook_confirm). */
  | { kind: 'voice'; op: 'clear' };

export type FoxEventCoverage = 'native' | 'partial' | 'fallback';

export interface FoxEventSpec {
  /** Same scale as the dashboard Mascot Context Engine: 0 ambient · 10 context · 20 normal · 30 important · 45 urgent · 50 major · 60 critical. */
  priority: number;
  steps: FoxReactionStep[];
  /** Used instead of `steps` under reduced motion (defaults to the mood / level steps only). */
  reducedMotionSteps?: FoxReactionStep[];
  /** Used when a clip of `steps` is not loaded (e.g. the G1 module is missing): the pre-G1 reaction. */
  fallbackSteps?: FoxReactionStep[];
  /** Gate that introduced the current mapping. */
  since?: 'F' | 'G1' | 'G2' | 'G3' | 'I';
  /** Gate G2: steps chosen by the currently visible state ('none' = no state); falls back to `steps`. */
  byState?: Partial<Record<FoxState | 'none', FoxReactionStep[]>>;
  /** Repeated events inside this window are coalesced (counted, not replayed). */
  cooldownS?: number;
  coverage: FoxEventCoverage;
  /** Clip Gate G is expected to provide for a full reaction (not present in the E2 GLB). */
  plannedClip?: string;
  /** Names used by the dashboard prototype's Mascot Context Engine that map onto this event. */
  aliases?: readonly string[];
  note: string;
}

/** Typed payloads. Gate G extends this with declaration merging (see COMPANION_INTEGRATION_GUIDE.md). */
export interface FoxEventPayloads {
  QUEST_COMPLETED: { questId?: string; xp?: number } | undefined;
  TASK_COMPLETED: { taskId?: string; xp?: number } | undefined;
  HABIT_CHECKED_IN: { habitId?: string; streak?: number } | undefined;
  STREAK_MILESTONE: { days: number } | undefined;
  STREAK_UPDATED: { days: number };
  QUEST_STARTED: { questId?: string } | undefined;
  XP_GAINED: { amount?: number } | undefined;
  ACHIEVEMENT_UNLOCKED: { achievementId?: string } | undefined;
  STREAK_LOST: { previousDays?: number } | undefined;
  LEVEL_UP: { level: number };
  CHALLENGE_WON: { challengeId?: string } | undefined;
  CHALLENGE_LOST: { challengeId?: string } | undefined;
  QUEST_DEADLINE_URGENT: { questId?: string; hoursLeft?: number } | undefined;
  QUEST_EXPIRED: { questId?: string } | undefined;
  FRIEND_CHEER: { friendId?: string } | undefined;
  APP_GREETING: undefined;
  USER_IDLE: undefined;
  USER_RETURNED: undefined;
  // ---- Gate G2 daily life (all fields optional: the fox reacts the same way without them)
  STUDY_STARTED: { taskId?: string; subject?: string } | undefined;
  STUDY_COMPLETED: { taskId?: string; minutes?: number } | undefined;
  SPORTS_STARTED: { activity?: string } | undefined;
  SPORTS_COMPLETED: { activity?: string; minutes?: number } | undefined;
  WAKE_REQUESTED: { source?: 'user' | 'schedule' | 'app' } | undefined;
  WAKE_LATE: { minutesLate?: number } | undefined;
  ALARM_STARTED: { alarmId?: string; label?: string } | undefined;
  ALARM_DISMISSED: { alarmId?: string; snoozed?: boolean } | undefined;
  SLEEP_ENTERED: { source?: 'user' | 'schedule' | 'idle' } | undefined;
  SLEEP_ENDED: { source?: 'user' | 'schedule' } | undefined;
  /** progress 0..1 (data) and/or durationS (display interpolation) — both come from the application. */
  COOLDOWN_STARTED: { cooldownId?: string; progress?: number; durationS?: number } | undefined;
  COOLDOWN_COMPLETED: { cooldownId?: string } | undefined;
  // ---- Gate G3 challenge / duo-group / private social. Every field is optional presentation data: ids are passed through
  // to listeners untouched, never interpreted (winners, friendships, privacy and streak rules belong to the application).
  CHALLENGE_INVITED: { challengeId?: string } | undefined;
  CHALLENGE_ACCEPTED: { challengeId?: string } | undefined;
  /** countdown: the value the application wants displayed (3, 2, 1 …); the clip never runs the game countdown. */
  CHALLENGE_STARTED: { challengeId?: string; countdown?: number } | undefined;
  CHALLENGE_DRAW: { challengeId?: string } | undefined;
  /** partnerSide: where the partner fox stands relative to THIS fox (default 'left'). */
  DUO_CELEBRATION: { partnerId?: string; partnerSide?: 'left' | 'right' } | undefined;
  GROUP_VICTORY: FoxGroupData | undefined;
  TEAM_ENCOURAGEMENT: { teammateId?: string; side?: 'left' | 'right' } | undefined;
  GROUP_STREAK_ACTIVE: (FoxGroupData & { days?: number }) | undefined;
  GROUP_STREAK_LOST: (FoxGroupData & { previousDays?: number }) | undefined;
  FRIEND_GREETING: { friendId?: string } | undefined;
  PHOTO_REACTION: { photoId?: string } | undefined;
  SOCIAL_LIKE_RECEIVED: { postId?: string; count?: number } | undefined;
  SOCIAL_COMMENT_RECEIVED: { postId?: string; commentId?: string } | undefined;
  FRIEND_SUPPORT: { friendId?: string } | undefined;
  FRIEND_MISS_YOU: { friendId?: string } | undefined;
  // ---- Gate I voice assistant & task creation (presentation only — no ASR, mic permissions or DB persistence in the mascot SDK)
  VOICE_LISTEN_STARTED: { sessionId?: string } | undefined;
  VOICE_LISTENING: { sessionId?: string } | undefined;
  VOICE_PROCESSING: { sessionId?: string } | undefined;
  TASK_SUGGESTION_READY: { sessionId?: string; taskCount?: number } | undefined;
  TASK_NOTEBOOK_OPEN: { sessionId?: string } | undefined;
  TASK_WRITING: { sessionId?: string } | undefined;
  TASK_CREATED: { sessionId?: string; taskId?: string } | undefined;
  VOICE_RETRY_REQUESTED: { sessionId?: string; reason?: string } | undefined;
  VOICE_CANCELLED: { sessionId?: string } | undefined;
  VOICE_PERMISSION_DENIED: { sessionId?: string } | undefined;
}
/** Group presentation data (Gate G3). Only counts and display colours — no names, avatars or ids are rendered. */
export interface FoxGroupData { groupId?: string; members?: number; colors?: readonly string[] }
export type FoxEventName = keyof FoxEventPayloads;

const BUILTIN: Record<FoxEventName, FoxEventSpec> = {
  QUEST_COMPLETED: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 2, since: 'G1',
    steps: [{ kind: 'play', clip: 'quest_complete' }, { kind: 'mood', mood: 'proud', durationS: 2 }],
    fallbackSteps: [{ kind: 'play', clip: 'happy' }, { kind: 'mood', mood: 'proud', durationS: 3 }],
    aliases: ['quest.completed', 'quest_completed'],
    note: 'G1 quest_complete: big jump celebration with confetti and a star ring, then a proud face.',
  },
  TASK_COMPLETED: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 1.5,
    steps: [{ kind: 'play', clip: 'happy' }],
    aliases: ['task.completed'],
    note: 'Dashboard rule "tick task → happy" maps 1:1 onto the happy clip.',
  },
  HABIT_CHECKED_IN: {
    priority: PRIORITY.normal, coverage: 'fallback', plannedClip: 'proud_pose', cooldownS: 1.5,
    steps: [{ kind: 'mood', mood: 'proud', durationS: 2.5 }],
    aliases: ['habit.checkin'],
    note: 'No proud body clip in E2: face-only proud pulse over the current base loop.',
  },
  STREAK_MILESTONE: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 3, since: 'G1',
    steps: [{ kind: 'streak', active: true, from: 'payload' }, { kind: 'play', clip: 'streak_cheer' }],
    reducedMotionSteps: [{ kind: 'streak', active: true, from: 'payload' }, { kind: 'mood', mood: 'happy', durationS: 2 }],
    fallbackSteps: [{ kind: 'streak', active: true, from: 'payload' }, { kind: 'play', clip: 'happy' }, { kind: 'mood', mood: 'proud', durationS: 3 }],
    aliases: ['habit.streak_milestone'],
    note: 'G1 streak_cheer: updates the flame tier (payload.days), then the cheer with a tier-coloured flame flare.',
  },
  STREAK_LOST: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 5, since: 'G1',
    steps: [{ kind: 'play', clip: 'streak_lost' }],
    reducedMotionSteps: [{ kind: 'streak', active: false }, { kind: 'mood', mood: 'sad', durationS: 3 }],
    fallbackSteps: [{ kind: 'streak', active: false }, { kind: 'mood', mood: 'sad', durationS: 4 }],
    aliases: ['habit.streak_broken', 'social.group_streak_broken'],
    note: 'G1 streak_lost: lightning hits the flame, temporary char overlay, flame goes out (streak inactive at the end). Reduced motion: flame fades out gently + sad face.',
  },
  LEVEL_UP: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 0, since: 'G1',
    steps: [{ kind: 'level', from: 'payload' }, { kind: 'play', clip: 'level_up' }, { kind: 'mood', mood: 'proud', durationS: 2.5 }],
    fallbackSteps: [{ kind: 'level', from: 'payload' }, { kind: 'play', clip: 'happy' }, { kind: 'mood', mood: 'proud', durationS: 3 }],
    aliases: ['level.up'],
    note: 'G1 level_up: charge, spin jump, light pillar; the new uniform scale is applied at the apex cue (instantly under reduced motion).',
  },
  STREAK_UPDATED: {
    priority: PRIORITY.context, coverage: 'native', cooldownS: 0, since: 'G1',
    steps: [{ kind: 'streak', active: true, from: 'payload' }],
    reducedMotionSteps: [{ kind: 'streak', active: true, from: 'payload' }],
    note: 'State only: shows / updates the streak flame (tier from payload.days); the base loop becomes streak_active while idle.',
  },
  QUEST_STARTED: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 2, since: 'G1',
    steps: [{ kind: 'play', clip: 'quest_start' }],
    fallbackSteps: [{ kind: 'mood', mood: 'proud', durationS: 2 }],
    aliases: ['quest.started', 'quest.start'],
    note: 'G1 quest_start: determined fist pump with a small flag prop.',
  },
  XP_GAINED: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 1, since: 'G1',
    steps: [{ kind: 'play', clip: 'receive_xp' }],
    fallbackSteps: [{ kind: 'mood', mood: 'smile', durationS: 1.5 }],
    aliases: ['reward.xp'],
    note: 'G1 receive_xp: XP orbs fly into the chest, glow, "+XP".',
  },
  ACHIEVEMENT_UNLOCKED: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 2, since: 'G1',
    steps: [{ kind: 'play', clip: 'achievement_unlock' }, { kind: 'mood', mood: 'proud', durationS: 2 }],
    fallbackSteps: [{ kind: 'play', clip: 'happy' }, { kind: 'mood', mood: 'proud', durationS: 3 }],
    aliases: ['achievement.unlocked', 'reward.achievement'],
    note: 'G1 achievement_unlock: a medal rises, the fox takes it and lifts it up with a star burst.',
  },
  CHALLENGE_WON: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 2, since: 'G3',
    steps: [{ kind: 'play', clip: 'challenge_win' }, { kind: 'mood', mood: 'proud', durationS: 2 }],
    reducedMotionSteps: [{ kind: 'mood', mood: 'proud', durationS: 3 }],
    fallbackSteps: [{ kind: 'play', clip: 'happy' }, { kind: 'mood', mood: 'excited', durationS: 2.5 }],
    aliases: ['social.challenge_win', 'challenge.won'],
    note: 'G3 challenge_win: surprise, big jump with a full turn, floating trophy, golden starburst, confetti, victory aura (more triumphant than quest_complete). Fallback (no G3 module): the Gate F happy + excited face.',
  },
  CHALLENGE_LOST: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 3, since: 'G3',
    steps: [{ kind: 'play', clip: 'challenge_lose' }],
    fallbackSteps: [{ kind: 'mood', mood: 'sad', durationS: 3 }],
    aliases: ['social.challenge_lose', 'challenge.lost'],
    note: 'G3 challenge_lose: disappointment, brief crouch, the emblem fades, then straightens up determined with a motivation spark — never shaming. Fallback: the Gate F sad face pulse.',
  },
  QUEST_DEADLINE_URGENT: {
    priority: PRIORITY.urgent, coverage: 'fallback', plannedClip: 'panic', cooldownS: 6,
    steps: [{ kind: 'mood', mood: 'surprised', durationS: 3 }],
    aliases: ['quest.deadline_urgent', 'quest.deadline_critical'],
    note: 'No panic clip in E2: surprised face pulse. The dashboard cooldown of 6 s is kept.',
  },
  QUEST_EXPIRED: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 5, since: 'G1',
    steps: [{ kind: 'play', clip: 'quest_failed' }],
    fallbackSteps: [{ kind: 'mood', mood: 'sad', durationS: 4 }],
    aliases: ['quest.expired', 'quest.failed'],
    note: 'G1 quest_failed: disappointment slump with a little rain cloud, then a determined recovery.',
  },
  FRIEND_CHEER: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 3,
    steps: [{ kind: 'play', clip: 'wave' }, { kind: 'mood', mood: 'smile', durationS: 2 }],
    aliases: ['social.cheer_received'],
    note: 'Waves back at the friend, then smiles.',
  },
  APP_GREETING: {
    priority: PRIORITY.context, coverage: 'native', cooldownS: 30,
    steps: [{ kind: 'activity', activity: 'idle' }, { kind: 'play', clip: 'wave' }],
    aliases: ['app.greeting', 'app.open'],
    note: 'Wave hello. Business code decides when (e.g. once per day).',
  },
  USER_IDLE: {
    priority: PRIORITY.ambient, coverage: 'fallback', plannedClip: 'sleep_loop', cooldownS: 0,
    steps: [{ kind: 'activity', activity: 'resting' }],
    reducedMotionSteps: [{ kind: 'activity', activity: 'resting' }],
    aliases: ['app.idle'],
    note: 'Unchanged in G2 (the app decides when idle means sleep: send SLEEP_ENTERED for the real sleep state). resting = idle clip at 0.8× + sleepy face.',
  },
  USER_RETURNED: {
    priority: PRIORITY.context, coverage: 'native', cooldownS: 5,
    steps: [{ kind: 'activity', activity: 'idle' }, { kind: 'play', clip: 'wave' }],
    reducedMotionSteps: [{ kind: 'activity', activity: 'idle' }, { kind: 'mood', mood: 'smile', durationS: 2 }],
    aliases: ['app.return'],
    note: 'Wakes up from resting and waves.',
  },
  // ================================================================ Gate G2 — daily life (state events)
  STUDY_STARTED: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 1, since: 'G2',
    steps: [{ kind: 'state', state: 'study', op: 'enter' }],
    aliases: ['study.started', 'focus.started'],
    note: 'study_start (notebook pops in, sits down, opens it, takes the pencil) → study_focus loop until STUDY_COMPLETED. Fallback (no G2 module): idle + proud pulse.',
  },
  STUDY_COMPLETED: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 1, since: 'G2',
    steps: [{ kind: 'state', state: 'study', op: 'exit', outcome: 'complete' }],
    aliases: ['study.completed', 'focus.completed'],
    note: 'study_complete (last stroke, claps the book shut, stretch, stands up proud) → idle (or the next active state).',
  },
  SPORTS_STARTED: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 1, since: 'G2',
    steps: [{ kind: 'state', state: 'sports', op: 'enter' }],
    aliases: ['sports.started', 'exercise.started'],
    note: 'sports_start (stretch, fist-in-palm, warm-up hops) → sports_active jog-in-place loop with sweat drops. Reduced motion: idle base + smile. Fallback: idle + excited pulse.',
  },
  SPORTS_COMPLETED: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 1, since: 'G2',
    steps: [{ kind: 'state', state: 'sports', op: 'exit', outcome: 'complete' }],
    aliases: ['sports.completed', 'exercise.completed'],
    note: 'sports_complete (slows down, hands on knees panting, wipes the forehead, flexes + thumbs-up wink) → idle.',
  },
  SLEEP_ENTERED: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 1, since: 'G2',
    steps: [{ kind: 'state', state: 'sleep', op: 'enter' }],
    aliases: ['sleep.entered', 'sleep.start'],
    note: 'sleep_enter (droops, yawns, sits, lies down on the pillow) → sleep_loop with Z letters and a soft glow. Idle variation, look-at and the idle tempo stay off. Fallback: activity "resting".',
  },
  SLEEP_ENDED: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 1, since: 'G2',
    steps: [{ kind: 'state', state: 'sleep', op: 'exit', outcome: 'complete' }],
    aliases: ['sleep.ended'],
    note: 'Natural wake: sleep_wake (stretch while lying, sit up, rub eyes, stand, shake) → idle.',
  },
  WAKE_REQUESTED: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 1, since: 'G2',
    steps: [{ kind: 'play', clip: 'wave' }, { kind: 'mood', mood: 'smile', durationS: 1.5 }],
    byState: { sleep: [{ kind: 'state', state: 'sleep', op: 'exit', via: 'wake_start' }] },
    aliases: ['wake.requested'],
    note: 'Asleep → wake_start (ear twitch, one eye peeks, rubs face, sits up, stretches, energetic wave). Already awake → wave + smile.',
  },
  WAKE_LATE: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 3, since: 'G2',
    steps: [{ kind: 'play', clip: 'wake_late' }],
    byState: { sleep: [{ kind: 'state', state: 'sleep', op: 'exit', via: 'wake_start' }, { kind: 'play', clip: 'wake_late' }] },
    fallbackSteps: [{ kind: 'state', state: 'sleep', op: 'exit', via: 'none' }, { kind: 'mood', mood: 'surprised', durationS: 1.2 }],
    aliases: ['wake.late'],
    note: 'Teasing, never insulting: racing clock, double take, giggle, finger wag, wink + thumbs-up. From sleep: wake_start first, wake_late queued after it.',
  },
  ALARM_STARTED: {
    priority: PRIORITY.critical, coverage: 'native', cooldownS: 0.5, since: 'G2',
    steps: [{ kind: 'state', state: 'alarm', op: 'enter' }],
    byState: { sleep: [{ kind: 'state', state: 'sleep', op: 'exit', via: 'wake_start' }, { kind: 'state', state: 'alarm', op: 'enter', via: 'none' }] },
    aliases: ['alarm.started', 'alarm.ring'],
    note: 'alarm_ring loop (points at the ringing clock, urgent bounces) until ALARM_DISMISSED. From sleep: wake_start plays first (the clock rings beside the bed). Visual only: emits alarm-visual events; audio / permissions belong to the app.',
  },
  ALARM_DISMISSED: {
    priority: PRIORITY.critical, coverage: 'native', cooldownS: 0.5, since: 'G2',
    steps: [{ kind: 'state', state: 'alarm', op: 'exit', outcome: 'payload' }],
    aliases: ['alarm.dismissed', 'alarm.stop'],
    note: 'alarm_success (slaps the button, relief, proud thumbs-up) → previous state or idle. payload.snoozed = true → no celebration (cancel).',
  },
  COOLDOWN_STARTED: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 0.5, since: 'G2',
    steps: [{ kind: 'state', state: 'cooldown', op: 'enter' }],
    aliases: ['cooldown.started'],
    note: 'cooldown_wait loop + floating hourglass with a progress ring. Progress is DATA (payload.progress / setCooldown); impatience (cooldown_wait_impatient) only after the runtime impatienceAfterS. Repeating the event refreshes the data.',
  },
  COOLDOWN_COMPLETED: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 0.5, since: 'G2',
    steps: [{ kind: 'state', state: 'cooldown', op: 'exit', outcome: 'complete' }],
    aliases: ['cooldown.completed', 'cooldown.ready'],
    note: 'cooldown_complete (timer dings, ears up, fist pump hop, timer bursts into sparkles) → previous state or idle.',
  },
  // ================================================================ Gate G3 — challenge
  CHALLENGE_INVITED: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 2, since: 'G3',
    steps: [{ kind: 'play', clip: 'challenge_invite' }],
    fallbackSteps: [{ kind: 'mood', mood: 'smile', durationS: 2 }],
    aliases: ['challenge.invited', 'social.challenge_invite'],
    note: 'challenge_invite: one ear then the other, looks at the incoming symbol, the token forms over the raised paw (energy ring) and is presented with a cheeky smile.',
  },
  CHALLENGE_ACCEPTED: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 2, since: 'G3',
    steps: [{ kind: 'play', clip: 'challenge_accept' }],
    fallbackSteps: [{ kind: 'mood', mood: 'proud', durationS: 2 }],
    aliases: ['challenge.accepted'],
    note: 'challenge_accept: eyes widen, paws clench (converging streaks), confident stomp-step, decisive nod, ready aura.',
  },
  CHALLENGE_STARTED: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 2, since: 'G3',
    steps: [{ kind: 'play', clip: 'challenge_start' }],
    reducedMotionSteps: [{ kind: 'mood', mood: 'proud', durationS: 2.5 }],
    fallbackSteps: [{ kind: 'mood', mood: 'surprised', durationS: 1 }, { kind: 'mood', mood: 'proud', durationS: 2 }],
    aliases: ['challenge.started'],
    note: 'challenge_start: crouch, competitive stance, three countdown pulses, launch hop. The countdown VALUE is application data (payload.countdown / setChallengeCountdown); without it the pulses are abstract.',
  },
  CHALLENGE_DRAW: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 3, since: 'G3',
    steps: [{ kind: 'play', clip: 'challenge_draw' }],
    fallbackSteps: [{ kind: 'mood', mood: 'smile', durationS: 2.5 }],
    aliases: ['challenge.draw'],
    note: 'challenge_draw: looks at both equal emblems, head tilt, shrug, equal sign, smile and a friendly paw (symmetric sparks).',
  },
  // ================================================================ Gate G3 — duo / group
  DUO_CELEBRATION: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 3, since: 'G3',
    steps: [{ kind: 'duo' }],
    reducedMotionSteps: [{ kind: 'mood', mood: 'happy', durationS: 2.5 }],
    fallbackSteps: [{ kind: 'play', clip: 'happy' }],
    aliases: ['duo.celebrate', 'social.duo_celebration'],
    note: 'duo_celebrate (partner on the left) / duo_celebrate_mirror (partner on the right): high-five at a shared contact point. With FoxDuoCoordinator both foxes start on the same tick and the paws meet; alone it is a solo high-five.',
  },
  GROUP_VICTORY: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 3, since: 'G3',
    steps: [{ kind: 'group', op: 'data' }, { kind: 'play', clip: 'group_victory' }],
    reducedMotionSteps: [{ kind: 'group', op: 'data' }, { kind: 'mood', mood: 'happy', durationS: 3 }],
    fallbackSteps: [{ kind: 'play', clip: 'happy' }, { kind: 'mood', mood: 'excited', durationS: 2.5 }],
    aliases: ['group.victory', 'social.group_victory'],
    note: 'group_victory: 120 bpm group dance with orbiting team emblems (one fox + symbolic teammates; payload.members / colors = display data), collective burst at the climax.',
  },
  TEAM_ENCOURAGEMENT: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 3, since: 'G3',
    steps: [{ kind: 'play', clip: 'team_encourage' }],
    fallbackSteps: [{ kind: 'mood', mood: 'smile', durationS: 2.5 }],
    aliases: ['team.encourage', 'social.team_encourage'],
    note: 'team_encourage: notices a struggling teammate, paw over the heart, reassuring nod, extends a paw (connection line, hearts).',
  },
  GROUP_STREAK_ACTIVE: {
    priority: PRIORITY.important, coverage: 'native', cooldownS: 3, since: 'G3',
    steps: [{ kind: 'streak', active: true, from: 'payload' }, { kind: 'group', op: 'data' }, { kind: 'play', clip: 'group_streak_active' }],
    reducedMotionSteps: [{ kind: 'streak', active: true, from: 'payload' }, { kind: 'group', op: 'data' }, { kind: 'group', op: 'streak-on' }, { kind: 'mood', mood: 'proud', durationS: 2 }],
    fallbackSteps: [{ kind: 'streak', active: true, from: 'payload' }, { kind: 'group', op: 'data' }, { kind: 'group', op: 'streak-on' }, { kind: 'mood', mood: 'happy', durationS: 2 }],
    aliases: ['group.streak_active', 'social.group_streak_active'],
    note: 'Raises the (single, G1.1) streak flame, flare + team-linked ember arcs, then the persistent group streak state (streak_active loop + linked embers until GROUP_STREAK_LOST).',
  },
  GROUP_STREAK_LOST: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 5, since: 'G3',
    steps: [{ kind: 'play', clip: 'group_streak_lost' }],
    reducedMotionSteps: [{ kind: 'group', op: 'streak-off' }, { kind: 'streak', active: false }, { kind: 'mood', mood: 'sad', durationS: 3 }],
    fallbackSteps: [{ kind: 'group', op: 'streak-off' }, { kind: 'streak', active: false }, { kind: 'mood', mood: 'sad', durationS: 3 }],
    aliases: ['group.streak_lost'],
    note: 'group_streak_lost: flame destabilises, the fox shields it, linked flames fade one by one, ring breaks, soft smoke (no lightning — established streak-loss style without the strike); streak inactive at the end. The solo STREAK_LOST keeps its own alias social.group_streak_broken (unchanged contract).',
  },
  // ================================================================ Gate G3 — private social
  FRIEND_GREETING: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 4, since: 'G3',
    steps: [{ kind: 'play', clip: 'friend_greet' }],
    fallbackSteps: [{ kind: 'play', clip: 'wave' }, { kind: 'mood', mood: 'smile', durationS: 1.5 }],
    aliases: ['social.friend_greeting', 'friend.greet'],
    note: 'friend_greet: ears up, turns toward the notification, enthusiastic wave, warm smile. Fallback: the core wave.',
  },
  PHOTO_REACTION: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 2, since: 'G3',
    steps: [{ kind: 'play', clip: 'photo_reaction' }],
    fallbackSteps: [{ kind: 'mood', mood: 'happy', durationS: 2 }],
    aliases: ['social.photo', 'photo.reaction'],
    note: 'photo_reaction: a blank Polaroid frame floats in, curious tilt, delighted hop, paw beside the frame (shine, hearts). No photo content in the GLB.',
  },
  SOCIAL_LIKE_RECEIVED: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 1.2, since: 'G3',
    steps: [{ kind: 'play', clip: 'receive_like' }],
    fallbackSteps: [{ kind: 'mood', mood: 'smile', durationS: 1.2 }],
    aliases: ['social.like', 'social.like_received'],
    note: 'receive_like (2 s, frequent): reaches for a heart, heart pop, small bounce. Bursts of likes inside 1.2 s are coalesced (counted).',
  },
  SOCIAL_COMMENT_RECEIVED: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 1.5, since: 'G3',
    steps: [{ kind: 'play', clip: 'receive_comment' }],
    fallbackSteps: [{ kind: 'mood', mood: 'smile', durationS: 1.5 }],
    aliases: ['social.comment', 'social.comment_received'],
    note: 'receive_comment: chat bubble with typing dots (never text), curious lean-in, nod, gesture toward the bubble.',
  },
  FRIEND_SUPPORT: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 3, since: 'G3',
    steps: [{ kind: 'play', clip: 'friend_support' }],
    fallbackSteps: [{ kind: 'mood', mood: 'smile', durationS: 2.5 }],
    aliases: ['social.friend_support', 'friend.support'],
    note: 'friend_support: quieter and closer than team_encourage — concerned look at the viewer, paw to chest, palm-up reassurance, slow nod, gentle smile.',
  },
  FRIEND_MISS_YOU: {
    priority: PRIORITY.normal, coverage: 'native', cooldownS: 20, since: 'G3',
    steps: [{ kind: 'play', clip: 'friend_miss_you' }],
    fallbackSteps: [{ kind: 'mood', mood: 'smile', durationS: 2 }],
    aliases: ['social.miss_you', 'friend.miss_you'],
    note: 'friend_miss_you: looks around, ears droop a little, holds a small friend icon close, returning sparkle, hopeful smile and a small wave (never guilt-inducing).',
  },
  // ================================================================ Gate I — voice assistant & task creation
  VOICE_LISTEN_STARTED: {
    priority: PRIORITY.urgent, coverage: 'native', cooldownS: 0.25, since: 'I',
    steps: [{ kind: 'voice', op: 'clear' }, { kind: 'state', state: 'voice_listening', op: 'enter' }],
    aliases: ['voice.listen_started', 'voice.start'],
    note: 'voice_listen_start → voice_listening_loop + listening waves. Cancels any prior voice state first.',
  },
  VOICE_LISTENING: {
    priority: PRIORITY.urgent, coverage: 'native', cooldownS: 0.25, since: 'I',
    steps: [{ kind: 'state', state: 'voice_processing', op: 'exit', outcome: 'cancel' }, { kind: 'state', state: 'task_writing', op: 'exit', outcome: 'cancel' },
      { kind: 'state', state: 'voice_listening', op: 'enter', via: 'none' }],
    aliases: ['voice.listening'],
    note: 'Sustained attentive listening loop (voice_listening_loop). If already listening, refreshes without replaying voice_listen_start.',
  },
  VOICE_PROCESSING: {
    priority: PRIORITY.urgent, coverage: 'native', cooldownS: 0.25, since: 'I',
    steps: [{ kind: 'state', state: 'voice_listening', op: 'exit', outcome: 'cancel' }, { kind: 'state', state: 'task_writing', op: 'exit', outcome: 'cancel' },
      { kind: 'state', state: 'voice_processing', op: 'enter', via: 'none' }],
    aliases: ['voice.processing', 'voice.thinking'],
    note: 'Thoughtful processing loop (voice_processing) + floating thinking dots until the application sends TASK_SUGGESTION_READY, TASK_NOTEBOOK_OPEN, VOICE_RETRY_REQUESTED or VOICE_CANCELLED.',
  },
  TASK_SUGGESTION_READY: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 0.25, since: 'I',
    steps: [{ kind: 'voice', op: 'clear' }, { kind: 'play', clip: 'task_suggestion' }],
    fallbackSteps: [{ kind: 'voice', op: 'clear' }, { kind: 'mood', mood: 'proud', durationS: 2.2 }],
    aliases: ['voice.suggestion_ready', 'task.suggestion_ready'],
    note: 'task_suggestion: ears perk, idea badge, open presenting paw gesture and proud smile.',
  },
  TASK_NOTEBOOK_OPEN: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 0.25, since: 'I',
    steps: [{ kind: 'state', state: 'voice_listening', op: 'exit', outcome: 'cancel' }, { kind: 'state', state: 'voice_processing', op: 'exit', outcome: 'cancel' },
      { kind: 'state', state: 'task_writing', op: 'enter' }],
    aliases: ['voice.notebook_open', 'task.notebook_open'],
    note: 'task_notebook_open (sits, pops & opens G2.1 NotebookProp, takes PencilProp) → task_notebook_write loop. Never confirms on a timer: waits for application TASK_CREATED.',
  },
  TASK_WRITING: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 0.25, since: 'I',
    steps: [{ kind: 'state', state: 'voice_listening', op: 'exit', outcome: 'cancel' }, { kind: 'state', state: 'voice_processing', op: 'exit', outcome: 'cancel' },
      { kind: 'state', state: 'task_writing', op: 'enter', via: 'none' }],
    aliases: ['voice.writing', 'task.writing'],
    note: 'Sustained seated task-writing loop (task_notebook_write) with NotebookProp + PencilProp. Refreshes if already in task_writing.',
  },
  TASK_CREATED: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 0.25, since: 'I',
    steps: [{ kind: 'voice', op: 'clear' }, { kind: 'play', clip: 'happy' }, { kind: 'mood', mood: 'proud', durationS: 2 }],
    byState: {
      task_writing: [{ kind: 'state', state: 'task_writing', op: 'exit', outcome: 'complete' }, { kind: 'mood', mood: 'proud', durationS: 2 }],
    },
    reducedMotionSteps: [{ kind: 'voice', op: 'clear' }, { kind: 'mood', mood: 'proud', durationS: 2.5 }],
    fallbackSteps: [{ kind: 'voice', op: 'clear' }, { kind: 'play', clip: 'happy' }, { kind: 'mood', mood: 'proud', durationS: 2 }],
    aliases: ['voice.task_created', 'task.created'],
    note: 'Application-driven confirmation: plays task_notebook_confirm when exiting task_writing (checkmark flourish, closes & hides notebook/pencil, stands up proud). Never triggered by animation timing.',
  },
  VOICE_RETRY_REQUESTED: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 0.25, since: 'I',
    steps: [{ kind: 'voice', op: 'clear' }, { kind: 'play', clip: 'voice_retry' }],
    fallbackSteps: [{ kind: 'voice', op: 'clear' }, { kind: 'mood', mood: 'surprised', durationS: 1.8 }],
    aliases: ['voice.retry', 'voice.retry_requested'],
    note: 'Cancels active voice state (no confirm) and plays friendly puzzled → encouraging voice_retry clip.',
  },
  VOICE_CANCELLED: {
    priority: PRIORITY.critical, coverage: 'native', cooldownS: 0, since: 'I',
    steps: [{ kind: 'voice', op: 'clear' }],
    reducedMotionSteps: [{ kind: 'voice', op: 'clear' }],
    aliases: ['voice.cancelled', 'voice.cancel'],
    note: 'Immediately cancels all active voice states and voice one-shots, hides notebook/pencil cleanly, and returns to idle (or resumes any suspended daily state) without playing task_notebook_confirm.',
  },
  VOICE_PERMISSION_DENIED: {
    priority: PRIORITY.major, coverage: 'native', cooldownS: 0.5, since: 'I',
    steps: [{ kind: 'voice', op: 'clear' }, { kind: 'play', clip: 'voice_retry' }, { kind: 'mood', mood: 'sad', durationS: 2.2 }],
    reducedMotionSteps: [{ kind: 'voice', op: 'clear' }, { kind: 'mood', mood: 'sad', durationS: 2.5 }],
    fallbackSteps: [{ kind: 'voice', op: 'clear' }, { kind: 'mood', mood: 'sad', durationS: 2.5 }],
    aliases: ['voice.permission_denied'],
    note: 'Visual-only reaction when the host app reports microphone permission denial (mascot never checks or requests permissions).',
  },
};

export class FoxEventRegistry {
  private specs = new Map<string, FoxEventSpec>();
  private alias = new Map<string, string>();
  constructor(initial: Record<string, FoxEventSpec> = BUILTIN) { for (const [k, v] of Object.entries(initial)) this.register(k, v); }

  /** Add or replace an event (Gate G hook). Throws on alias collisions so mappings stay unambiguous. */
  register(name: string, spec: FoxEventSpec) {
    for (const a of spec.aliases ?? []) {
      const owner = this.alias.get(a);
      if (owner && owner !== name) throw new Error(`Fox event alias "${a}" already belongs to ${owner}`);
    }
    this.specs.set(name, spec);
    for (const a of spec.aliases ?? []) this.alias.set(a, name);
  }
  /** Canonical name for an event or one of its aliases. */
  canonical(name: string) { return this.specs.has(name) ? name : this.alias.get(name); }
  get(name: string): FoxEventSpec | undefined { const c = this.canonical(name); return c ? this.specs.get(c) : undefined; }
  list() { return [...this.specs.entries()].map(([name, spec]) => ({ name, ...spec })); }
}

/** Shared default registry (one per page; controllers can be given their own). */
export const foxEventRegistry = new FoxEventRegistry();

/** Steps actually executed for a spec, given reduced motion and which clips are loaded. */
export function stepsFor(spec: FoxEventSpec, reducedMotion: boolean, available: (clip: FoxOneShotClip) => boolean = () => true): FoxReactionStep[] {
  // state steps are always kept: the daily-life layer applies its own documented fallback / reduced-motion rules
  const playable = (s: FoxReactionStep) => (s.kind === 'play' ? available(s.clip) : s.kind === 'duo' ? available('duo_celebrate') && available('duo_celebrate_mirror') : true);
  // 1) module missing → the event's fallback reaction (the Gate F behaviour); 2) then the reduced-motion rules apply to it
  const missing = spec.steps.some(s => !playable(s));
  const steps = missing ? (spec.fallbackSteps ?? spec.steps.filter(s => s.kind !== 'play')).filter(playable) : spec.steps;
  if (!reducedMotion) return steps;
  if (spec.reducedMotionSteps) return spec.reducedMotionSteps.filter(playable);
  // large-motion clips (hops, jumps) are dropped; gentle clips (wave, head_pet) stay
  const out = steps.filter(s => s.kind !== 'duo' && (s.kind !== 'play' || !CLIP_META[s.clip].largeMotion));
  // keep the emotional read: if a dropped clip was the only reaction, show a face instead
  const dropped = steps.some(s => s.kind === 'duo' || (s.kind === 'play' && CLIP_META[s.clip].largeMotion));
  if (dropped && !out.some(s => s.kind === 'mood')) out.push({ kind: 'mood', mood: 'happy', durationS: 2 });
  return out;
}
