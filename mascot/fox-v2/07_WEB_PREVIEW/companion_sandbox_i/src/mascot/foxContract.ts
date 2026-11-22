// LifeQuest Fox V2 — runtime contract (Gate E2 asset, Gate F runtime).
// Single source of truth for clip names, morph targets, bones and tuning used by every runtime module.
// Values come from 04_ANIMATIONS/anim_spec_e2.json and idle_variation_e2.json; the GLB is validated
// against this file at load time (FoxModelLoader), so a mismatching asset fails loudly instead of
// animating wrongly.

export const FOX_CONTRACT_VERSION = 'fox-v2/e2-anim+g1-module+g2.1-module+g3-module+i-module/f-runtime-5';
export const FOX_ASSET_FPS = 24;

// ------------------------------------------------------------------ clips
// Core set (in the approved E2 Fox GLB) + Gate G1 module (animation-only GLB bound to the same Fox).
export const CORE_BASE_CLIPS = ['idle', 'walk', 'run'] as const;
export const CORE_ONE_SHOT_CLIPS = ['happy', 'wave', 'head_pet', 'tail_touch'] as const;
export const G1_BASE_CLIPS = ['streak_active'] as const;
export const G1_ONE_SHOT_CLIPS = ['quest_start', 'quest_complete', 'quest_failed', 'receive_xp', 'level_up', 'achievement_unlock', 'streak_lost', 'streak_cheer'] as const;
// Gate G2 module: daily life (study, sports, wake / alarm, sleep, cooldown). State loops are base clips.
export const G2_BASE_CLIPS = ['study_focus', 'sports_active', 'alarm_ring', 'sleep_loop', 'cooldown_wait', 'cooldown_wait_impatient'] as const;
export const G2_ONE_SHOT_CLIPS = ['study_start', 'study_complete', 'sports_start', 'sports_complete', 'wake_start', 'wake_late', 'alarm_success',
  'sleep_enter', 'sleep_wake', 'cooldown_complete'] as const;
// Gate G3 module: challenge, duo / group and private social (all one-shots; duo_celebrate_mirror = duo variant, partner on the fox's right).
export const G3_ONE_SHOT_CLIPS = ['challenge_invite', 'challenge_accept', 'challenge_start', 'challenge_win', 'challenge_lose', 'challenge_draw',
  'duo_celebrate', 'duo_celebrate_mirror', 'group_victory', 'team_encourage', 'group_streak_active', 'group_streak_lost',
  'friend_greet', 'photo_reaction', 'receive_like', 'receive_comment', 'friend_support', 'friend_miss_you'] as const;
// Gate I module: voice assistant & task creation (3 looping states + 5 one-shots).
export const I_BASE_CLIPS = ['voice_listening_loop', 'voice_processing', 'task_notebook_write'] as const;
export const I_ONE_SHOT_CLIPS = ['voice_listen_start', 'task_suggestion', 'task_notebook_open', 'task_notebook_confirm', 'voice_retry'] as const;
export const BASE_CLIPS = [...CORE_BASE_CLIPS, ...G1_BASE_CLIPS, ...G2_BASE_CLIPS, ...I_BASE_CLIPS] as const;
export const ONE_SHOT_CLIPS = [...CORE_ONE_SHOT_CLIPS, ...G1_ONE_SHOT_CLIPS, ...G2_ONE_SHOT_CLIPS, ...G3_ONE_SHOT_CLIPS, ...I_ONE_SHOT_CLIPS] as const;
export type FoxBaseClip = (typeof BASE_CLIPS)[number];
export type FoxOneShotClip = (typeof ONE_SHOT_CLIPS)[number];
export type FoxClipName = FoxBaseClip | FoxOneShotClip;
export type FoxCoreClip = (typeof CORE_BASE_CLIPS)[number] | (typeof CORE_ONE_SHOT_CLIPS)[number];

export interface FoxClipMeta {
  loop: boolean;
  durationS: number;
  /** 1 = the clip owns the head (procedural look-at suppressed), 0 = free. */
  headControl: number;
  /** 1 = the clip drives the facial morphs (mood overrides suspended). */
  faceControl: number;
  /** In-place locomotion speed (m/s at level scale 1). */
  speedMps?: number;
  /** Large body motion (hops, jumps, spins). Replaced by a face-only reaction under reduced motion. */
  largeMotion: boolean;
}

export const CLIP_META: Record<FoxClipName, FoxClipMeta> = {
  idle: { loop: true, durationS: 6.0, headControl: 0, faceControl: 0, largeMotion: false },
  walk: { loop: true, durationS: 40 / 24, headControl: 0.5, faceControl: 0, speedMps: 0.22, largeMotion: false },
  run: { loop: true, durationS: 28 / 24, headControl: 0.6, faceControl: 1, speedMps: 0.4857, largeMotion: true },
  happy: { loop: false, durationS: 61 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  wave: { loop: false, durationS: 67 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  head_pet: { loop: false, durationS: 75 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  tail_touch: { loop: false, durationS: 69 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  // ---- Gate G1 clips, G1.1 module (values = 04_ANIMATIONS/g1_1_cinematic_polish/anim_spec_g1_1.json, re-checked against the GLB at load)
  quest_start: { loop: false, durationS: 67 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  quest_complete: { loop: false, durationS: 83 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  quest_failed: { loop: false, durationS: 91 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  receive_xp: { loop: false, durationS: 65 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  level_up: { loop: false, durationS: 115 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  achievement_unlock: { loop: false, durationS: 95 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  streak_active: { loop: true, durationS: 96 / 24, headControl: 0, faceControl: 0, largeMotion: false },
  streak_lost: { loop: false, durationS: 123 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  streak_cheer: { loop: false, durationS: 85 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  // ---- Gate G2 clips, G2.1 module (values = 04_ANIMATIONS/g2_1_deformation_polish/anim_spec_g2_1.json, re-checked against the GLB at load)
  study_start: { loop: false, durationS: 59 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  study_focus: { loop: true, durationS: 168 / 24, headControl: 0.8, faceControl: 0.5, largeMotion: false },
  study_complete: { loop: false, durationS: 87 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  sports_start: { loop: false, durationS: 63 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  sports_active: { loop: true, durationS: 96 / 24, headControl: 1, faceControl: 0.9, largeMotion: true },
  sports_complete: { loop: false, durationS: 91 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  wake_start: { loop: false, durationS: 99 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  wake_late: { loop: false, durationS: 87 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  alarm_ring: { loop: true, durationS: 48 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  alarm_success: { loop: false, durationS: 87 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  sleep_enter: { loop: false, durationS: 111 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  sleep_loop: { loop: true, durationS: 192 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  sleep_wake: { loop: false, durationS: 99 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  cooldown_wait: { loop: true, durationS: 120 / 24, headControl: 0.5, faceControl: 0.5, largeMotion: false },
  cooldown_wait_impatient: { loop: true, durationS: 96 / 24, headControl: 0.5, faceControl: 0.6, largeMotion: false },
  cooldown_complete: { loop: false, durationS: 63 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  // ---- Gate G3 clips (values = 04_ANIMATIONS/g3_challenge_social/anim_spec_g3.json, re-checked against the GLB at load)
  challenge_invite: { loop: false, durationS: 72 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  challenge_accept: { loop: false, durationS: 60 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  challenge_start: { loop: false, durationS: 84 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  challenge_win: { loop: false, durationS: 108 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  challenge_lose: { loop: false, durationS: 96 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  challenge_draw: { loop: false, durationS: 84 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  duo_celebrate: { loop: false, durationS: 96 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  duo_celebrate_mirror: { loop: false, durationS: 96 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  group_victory: { loop: false, durationS: 120 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  team_encourage: { loop: false, durationS: 84 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  group_streak_active: { loop: false, durationS: 84 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  group_streak_lost: { loop: false, durationS: 108 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  friend_greet: { loop: false, durationS: 60 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  photo_reaction: { loop: false, durationS: 72 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  receive_like: { loop: false, durationS: 48 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  receive_comment: { loop: false, durationS: 60 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  friend_support: { loop: false, durationS: 84 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  friend_miss_you: { loop: false, durationS: 84 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  // ---- Gate I clips (values = 04_ANIMATIONS/i_voice_assistant/anim_spec_i.json, re-checked against the GLB at load)
  voice_listen_start: { loop: false, durationS: 36 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  voice_listening_loop: { loop: true, durationS: 96 / 24, headControl: 0.5, faceControl: 0.6, largeMotion: false },
  voice_processing: { loop: true, durationS: 96 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  task_suggestion: { loop: false, durationS: 66 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  task_notebook_open: { loop: false, durationS: 54 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  task_notebook_write: { loop: true, durationS: 120 / 24, headControl: 0.8, faceControl: 0.6, largeMotion: false },
  task_notebook_confirm: { loop: false, durationS: 78 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  voice_retry: { loop: false, durationS: 60 / 24, headControl: 1, faceControl: 1, largeMotion: false },
};

export type FoxClipCategory = 'core' | 'quest' | 'rewards' | 'streak' | 'study' | 'sports' | 'wake_alarm' | 'sleep' | 'cooldown' | 'challenge' | 'duo_group' | 'social' | 'voice_assistant';
export const CLIP_CATEGORY: Record<FoxClipName, FoxClipCategory> = {
  idle: 'core', walk: 'core', run: 'core', happy: 'core', wave: 'core', head_pet: 'core', tail_touch: 'core',
  quest_start: 'quest', quest_complete: 'quest', quest_failed: 'quest',
  receive_xp: 'rewards', level_up: 'rewards', achievement_unlock: 'rewards',
  streak_active: 'streak', streak_lost: 'streak', streak_cheer: 'streak',
  study_start: 'study', study_focus: 'study', study_complete: 'study',
  sports_start: 'sports', sports_active: 'sports', sports_complete: 'sports',
  wake_start: 'wake_alarm', wake_late: 'wake_alarm', alarm_ring: 'wake_alarm', alarm_success: 'wake_alarm',
  sleep_enter: 'sleep', sleep_loop: 'sleep', sleep_wake: 'sleep',
  cooldown_wait: 'cooldown', cooldown_wait_impatient: 'cooldown', cooldown_complete: 'cooldown',
  challenge_invite: 'challenge', challenge_accept: 'challenge', challenge_start: 'challenge', challenge_win: 'challenge', challenge_lose: 'challenge', challenge_draw: 'challenge',
  duo_celebrate: 'duo_group', duo_celebrate_mirror: 'duo_group', group_victory: 'duo_group', team_encourage: 'duo_group', group_streak_active: 'duo_group', group_streak_lost: 'duo_group',
  friend_greet: 'social', photo_reaction: 'social', receive_like: 'social', receive_comment: 'social', friend_support: 'social', friend_miss_you: 'social',
  voice_listen_start: 'voice_assistant', voice_listening_loop: 'voice_assistant', voice_processing: 'voice_assistant',
  task_suggestion: 'voice_assistant', task_notebook_open: 'voice_assistant', task_notebook_write: 'voice_assistant',
  task_notebook_confirm: 'voice_assistant', voice_retry: 'voice_assistant',
};

// ------------------------------------------------------------------ animation modules (animation-only GLBs)
export interface FoxAnimationModuleDef { id: string; path: string; clips: readonly FoxClipName[] }
export const ANIMATION_MODULES: readonly FoxAnimationModuleDef[] = [
  // G1.1: same module id and clip contract (drop-in replacement), polished clips in a versioned file
  { id: 'g1_quest_reward_streak', path: 'models/modules/fox_v2_g1_1_quest_reward_streak.anim.glb', clips: [...G1_BASE_CLIPS, ...G1_ONE_SHOT_CLIPS] },
  // G2: daily life — independent of the G1 module (either can be missing)
  // G2.1: same module id and clip contract as G2 (drop-in replacement), corrected clips in a versioned file
  { id: 'g2_daily_life', path: 'models/modules/fox_v2_g2_1_daily_life.anim.glb', clips: [...G2_BASE_CLIPS, ...G2_ONE_SHOT_CLIPS] },
  // G3: challenge / duo-group / private social — independent of G1 / G2 (any module can be missing; documented fallbacks apply)
  { id: 'g3_challenge_social', path: 'models/modules/fox_v2_g3_challenge_social.anim.glb', clips: [...G3_ONE_SHOT_CLIPS] },
  // Gate I: voice assistant & task creation — independent module (documented fallbacks apply when missing)
  { id: 'i_voice_assistant', path: 'models/modules/fox_v2_i_voice_assistant.anim.glb', clips: [...I_BASE_CLIPS, ...I_ONE_SHOT_CLIPS] },
];

// ------------------------------------------------------------------ daily-life & voice states (Gate G2 + Gate I)
// A state is a persistent context with its own base loop. Several can be active at once; the one with
// the highest priority is VISIBLE, the others are suspended and resume (with their start clip) when it ends.
// Priorities are presentation rules only — the application decides WHEN a state starts / ends.
export const VOICE_STATES = ['voice_listening', 'voice_processing', 'task_writing'] as const;
export type FoxVoiceState = (typeof VOICE_STATES)[number];
export const FOX_STATES = ['alarm', 'sleep', 'task_writing', 'voice_processing', 'voice_listening', 'sports', 'study', 'cooldown'] as const;
export type FoxState = (typeof FOX_STATES)[number];
export type FoxInteractionMode = 'full' | 'face' | 'procedural';
export interface FoxStateDef {
  priority: number;
  base: FoxBaseClip;
  start?: FoxOneShotClip;
  complete?: FoxOneShotClip;
  /** Props the state needs while visible (effects manager prop ids). */
  props: readonly string[];
  /** Persistent loop effects while visible. */
  fx: readonly string[];
  /** How a head-pet / tail-touch is answered while the state is visible (it never ends the state). */
  interaction: FoxInteractionMode;
  /** Non-state events below this priority only get a face / procedural reaction while the state is visible. */
  minEventPriority: number;
  /** Module missing → documented fallback (activity + mood). */
  fallback: { activity: FoxActivity; mood: FoxMood };
  /** Under reduced motion: the base loop to use when the state loop itself is large motion. */
  reducedBase?: FoxBaseClip;
}
export const FOX_STATE_DEFS: Record<FoxState, FoxStateDef> = {
  alarm: { priority: 60, base: 'alarm_ring', complete: 'alarm_success', props: ['alarm_clock'], fx: ['alarm.ring'], interaction: 'full', minEventPriority: 60, fallback: { activity: 'idle', mood: 'surprised' } },
  sleep: { priority: 50, base: 'sleep_loop', start: 'sleep_enter', complete: 'sleep_wake', props: ['pillow', 'sleep_mat'], fx: ['sleep.z', 'sleep.glow'], interaction: 'procedural', minEventPriority: 60, fallback: { activity: 'resting', mood: 'sleepy' } },
  task_writing: { priority: 47, base: 'task_notebook_write', start: 'task_notebook_open', complete: 'task_notebook_confirm', props: ['notebook', 'pencil'], fx: ['focus.particles'], interaction: 'face', minEventPriority: 50, fallback: { activity: 'idle', mood: 'proud' } },
  voice_processing: { priority: 46, base: 'voice_processing', props: [], fx: ['voice.thinking'], interaction: 'face', minEventPriority: 50, fallback: { activity: 'idle', mood: 'neutral' } },
  voice_listening: { priority: 45, base: 'voice_listening_loop', start: 'voice_listen_start', props: [], fx: ['voice.waves'], interaction: 'face', minEventPriority: 50, fallback: { activity: 'idle', mood: 'smile' } },
  sports: { priority: 40, base: 'sports_active', start: 'sports_start', complete: 'sports_complete', props: [], fx: ['sweat.drops'], interaction: 'full', minEventPriority: 30, fallback: { activity: 'idle', mood: 'excited' }, reducedBase: 'idle' },
  study: { priority: 35, base: 'study_focus', start: 'study_start', complete: 'study_complete', props: ['notebook', 'pencil'], fx: ['focus.particles'], interaction: 'face', minEventPriority: 50, fallback: { activity: 'idle', mood: 'proud' } },
  cooldown: { priority: 25, base: 'cooldown_wait', complete: 'cooldown_complete', props: ['timer'], fx: ['timer.watch'], interaction: 'full', minEventPriority: 20, fallback: { activity: 'idle', mood: 'neutral' } },
};
/** Runtime presentation parameters (not business rules). */
export const DAILY_TUNING = {
  /** Seconds in cooldown before the patient loop switches to the impatient variant (host may override). */
  impatienceAfterS: 20,
  /** Extra base cross-fade when a full-body one-shot replaces a seated / lying loop. */
  postureFade: 0.45,
} as const;

// ------------------------------------------------------------------ streak flame attachment (Gate G1.1)
/** The flame is held on the left paw: base point = `offset` in the LOCAL space of `bone` (metres at
 *  Fox scale 1), measured on the streak_active hold pose so the flame sits on the palm. */
export const FLAME_SOCKET = {
  bone: 'ATT_HAND_L' as const,
  offset: [0.0126, -0.0071, 0.0017] as [number, number, number],   // = 1.4 cm up + 0.4 cm forward of the paw centre on the hold pose (palm top)
  /** Used only if the socket bone is missing (never with the approved rig). */
  fallback: [0.3, 0.45, 0.2] as [number, number, number],
};

// ------------------------------------------------------------------ streak tiers (dashboard rule: 3–6 · 7–13 · 14–29 · 30+ days)
export const STREAK_TIERS = ['orange', 'blue', 'purple', 'crimson'] as const;
export type FoxStreakTier = (typeof STREAK_TIERS)[number];
export const STREAK_TIER_COLORS: Record<FoxStreakTier, { core: string; mid: string; edge: string; minDays: number }> = {
  orange: { core: '#FFD25E', mid: '#FF8A1F', edge: '#E8480F', minDays: 3 },
  blue: { core: '#B8E4FF', mid: '#3EA2FF', edge: '#1A4FC4', minDays: 7 },
  purple: { core: '#E2C7FF', mid: '#9A5CFF', edge: '#5224B5', minDays: 14 },
  crimson: { core: '#FFBFD8', mid: '#F2427F', edge: '#8E0E33', minDays: 30 },
};
export function streakTierForDays(days: number): FoxStreakTier {
  return days >= 30 ? 'crimson' : days >= 14 ? 'purple' : days >= 7 ? 'blue' : 'orange';
}

export const isBaseClip = (n: string): n is FoxBaseClip => (BASE_CLIPS as readonly string[]).includes(n);
export const isOneShotClip = (n: string): n is FoxOneShotClip => (ONE_SHOT_CLIPS as readonly string[]).includes(n);

// ------------------------------------------------------------------ activities (persistent base layer)
// 'resting' has no dedicated clip in the E2 contract: documented fallback = idle at 0.8× tempo +
// sleepy face + no look-at / idle variation. Gate G may add a real sleep loop.
export const ACTIVITIES = ['idle', 'walk', 'run', 'resting'] as const;
export type FoxActivity = (typeof ACTIVITIES)[number];
export const ACTIVITY_BASE: Record<FoxActivity, FoxBaseClip> = { idle: 'idle', walk: 'walk', run: 'run', resting: 'idle' };
// Gate G2: with the G2 module loaded the sleep STATE (sleep_loop) replaces 'resting' for USER_IDLE / SLEEP_ENTERED;
// 'resting' stays the documented fallback when the module is missing.

// ------------------------------------------------------------------ face (morph targets, D1.1 contract)
export const MOODS = ['neutral', 'happy', 'proud', 'sad', 'surprised', 'sleepy', 'smile', 'excited'] as const;
export type FoxMood = (typeof MOODS)[number];
type MorphSet = Record<string, Record<string, number>>;

export const EXPRESSIONS: Record<FoxMood, MorphSet> = {
  neutral: {},
  happy: { FOX_Eye_L: { hide: 1 }, FOX_Eye_R: { hide: 1 }, FOX_EyeClosedHappy_L: { show: 1 }, FOX_EyeClosedHappy_R: { show: 1 }, FOX_Mouth_Neutral: { hide: 1 }, FOX_Mouth_Open: { show: 1 }, FOX_Mouth_Tongue: { show: 1 } },
  proud: { FOX_Eye_L: { Proud: 1 }, FOX_Eye_R: { Proud: 1 }, FOX_Brow_L: { Proud: 1 }, FOX_Brow_R: { Proud: 1 }, FOX_Mouth_Neutral: { hide: 1 }, FOX_Mouth_Smile: { show: 1 } },
  sad: { FOX_Eye_L: { Sad: 1 }, FOX_Eye_R: { Sad: 1 }, FOX_Brow_L: { Sad: 1 }, FOX_Brow_R: { Sad: 1 }, FOX_Mouth_Neutral: { hide: 1 }, FOX_Mouth_Frown: { show: 1 } },
  surprised: { FOX_Eye_L: { Wide: 1 }, FOX_Eye_R: { Wide: 1 }, FOX_Mouth_Neutral: { hide: 1 }, FOX_Mouth_Open: { show: 1 }, FOX_Mouth_Tongue: { show: 1 } },
  sleepy: { FOX_Eye_L: { hide: 1 }, FOX_Eye_R: { hide: 1 }, FOX_EyeClosedSleepy_L: { show: 1 }, FOX_EyeClosedSleepy_R: { show: 1 }, FOX_Mouth_Neutral: { hide: 1 }, FOX_Mouth_SmallO: { show: 1 } },
  smile: { FOX_Mouth_Neutral: { hide: 1 }, FOX_Mouth_Smile: { show: 1 } },
  excited: { FOX_Mouth_Neutral: { hide: 1 }, FOX_Mouth_Open: { show: 1 }, FOX_Mouth_Tongue: { show: 1 } },
};

export const FACE_DEFAULT_VISIBLE = ['FOX_Eye_L', 'FOX_Eye_R', 'FOX_Mouth_Neutral'] as const;
export const FACE_SWAP_PARTS = [
  'FOX_EyeClosedHappy_L', 'FOX_EyeClosedHappy_R', 'FOX_EyeClosedSleepy_L', 'FOX_EyeClosedSleepy_R',
  'FOX_Mouth_Open', 'FOX_Mouth_Tongue', 'FOX_Mouth_SmallO', 'FOX_Mouth_Frown', 'FOX_Mouth_Smile', 'FOX_Brow_L', 'FOX_Brow_R',
] as const;
export const FACE_MESHES: readonly string[] = [...FACE_DEFAULT_VISIBLE, ...FACE_SWAP_PARTS];

export const REQUIRED_MORPHS: Record<string, readonly string[]> = {
  FOX_Eye_L: ['Blink', 'Wide', 'Sad', 'HalfLid', 'Proud', 'hide'],
  FOX_Eye_R: ['Blink', 'Wide', 'Sad', 'HalfLid', 'Proud', 'hide'],
  FOX_Mouth_Neutral: ['hide'],
  FOX_EyeClosedHappy_L: ['show'], FOX_EyeClosedHappy_R: ['show'],
  FOX_EyeClosedSleepy_L: ['show'], FOX_EyeClosedSleepy_R: ['show'],
  FOX_Mouth_Open: ['show'], FOX_Mouth_Tongue: ['show'], FOX_Mouth_SmallO: ['show'], FOX_Mouth_Frown: ['show'], FOX_Mouth_Smile: ['show'],
  FOX_Brow_L: ['show', 'Sad', 'Proud'], FOX_Brow_R: ['show', 'Sad', 'Proud'],
};

// ------------------------------------------------------------------ skeleton (D1.1, 28 joints)
export const REQUIRED_BONES = [
  'ROOT', 'HIPS', 'SPINE', 'NECK', 'HEAD', 'EAR_L_01', 'EAR_L_02', 'EAR_R_01', 'EAR_R_02',
  'ARM_L', 'PAW_L', 'ARM_R', 'PAW_R', 'LEG_L', 'FOOT_L', 'LEG_R', 'FOOT_R',
  'TAIL_01', 'TAIL_02', 'TAIL_03', 'TAIL_04', 'SCARF_FLAP',
  'ATT_HAT', 'ATT_GLASSES', 'ATT_SCARF', 'ATT_BACKPACK', 'ATT_HAND_L', 'ATT_HAND_R',
] as const;
export type FoxBoneName = (typeof REQUIRED_BONES)[number];
/** Attachment sockets reserved for Gate H cosmetics (not used yet). */
export const ATTACHMENT_SOCKETS = ['ATT_HAT', 'ATT_GLASSES', 'ATT_SCARF', 'ATT_BACKPACK', 'ATT_HAND_L', 'ATT_HAND_R'] as const;
/** Bones that procedural layers write after the mixer (restored before every mixer update). */
export const PROCEDURAL_BONES: readonly FoxBoneName[] = ['NECK', 'HEAD', 'EAR_L_01', 'EAR_R_01', 'TAIL_01', 'TAIL_02', 'TAIL_03', 'TAIL_04'];

// ------------------------------------------------------------------ tuning (from the approved E2 viewer)
export const LOOK_TUNING = {
  yawMax: 40, pitchUp: 20, pitchDown: 15,
  neck: 0.45, head: 0.55, neckPitch: 0.85, headPitch: 0.15,
  omega: 6, eyeOmega: 14, eyeX: 0.0035, eyeY: 0.0022,
  inputRate: 9, deadYaw: 3, deadPitch: 2, moveThresholdPx: 3,
  restDelay: 2.5, restKeep: 0.35, restRate: 0.8, returnOmega: 2.6,
} as const;

export const MIX_TUNING = { fadeIn: 0.2, fadeOut: 0.35, baseFade: 0.3, interruptFade: 0.2 } as const;

export const IDLE_VARIATION = {
  seedDefault: 7,
  idleTimeScale: { min: 0.94, max: 1.06 },
  events: {
    blink: { intervalS: [3.5, 7.5], doubleChance: 0.25, durationS: 0.24 },
    ear_twitch: { intervalS: [7.0, 14.0], durationS: 0.32, forwardDeg: 12, outDeg: 6 },
    glance: { intervalS: [10.0, 20.0], durationS: [1.4, 2.4], yawDeg: 8, rollDeg: 4 },
    tail_flick: { intervalS: [6.0, 12.0], durationS: 0.6, amplitudeDeg: 10 },
  },
} as const;
export type IdleEventType = keyof typeof IDLE_VARIATION.events;
