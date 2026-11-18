import { CLIP_META, type FoxActivity, type FoxMood, type FoxOneShotClip } from './foxContract';
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
  | { kind: 'streak'; active: boolean; from?: 'payload' };

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
  since?: 'F' | 'G1';
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
}
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
    priority: PRIORITY.major, coverage: 'partial', plannedClip: 'celebrate', cooldownS: 2,
    steps: [{ kind: 'play', clip: 'happy' }, { kind: 'mood', mood: 'excited', durationS: 2.5 }],
    aliases: ['social.challenge_win'],
    note: 'happy one-shot + excited face until a celebrate clip exists.',
  },
  CHALLENGE_LOST: {
    priority: PRIORITY.important, coverage: 'fallback', plannedClip: 'sad_react', cooldownS: 3,
    steps: [{ kind: 'mood', mood: 'sad', durationS: 3 }],
    aliases: ['social.challenge_lose'],
    note: 'Face-only sad pulse.',
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
    note: 'resting = idle clip at 0.8× + sleepy face, no look-at, no idle variation (no sleep loop in E2).',
  },
  USER_RETURNED: {
    priority: PRIORITY.context, coverage: 'native', cooldownS: 5,
    steps: [{ kind: 'activity', activity: 'idle' }, { kind: 'play', clip: 'wave' }],
    reducedMotionSteps: [{ kind: 'activity', activity: 'idle' }, { kind: 'mood', mood: 'smile', durationS: 2 }],
    aliases: ['app.return'],
    note: 'Wakes up from resting and waves.',
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
  const playable = (s: FoxReactionStep) => s.kind !== 'play' || available(s.clip);
  // 1) module missing → the event's fallback reaction (the Gate F behaviour); 2) then the reduced-motion rules apply to it
  const missing = spec.steps.some(s => !playable(s));
  const steps = missing ? (spec.fallbackSteps ?? spec.steps.filter(s => s.kind !== 'play')).filter(playable) : spec.steps;
  if (!reducedMotion) return steps;
  if (spec.reducedMotionSteps) return spec.reducedMotionSteps.filter(playable);
  // large-motion clips (hops, jumps) are dropped; gentle clips (wave, head_pet) stay
  const out = steps.filter(s => s.kind !== 'play' || !CLIP_META[s.clip].largeMotion);
  // keep the emotional read: if a dropped clip was the only reaction, show a face instead
  const dropped = steps.some(s => s.kind === 'play' && CLIP_META[s.clip].largeMotion);
  if (dropped && !out.some(s => s.kind === 'mood')) out.push({ kind: 'mood', mood: 'happy', durationS: 2 });
  return out;
}
