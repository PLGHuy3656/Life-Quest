// LifeQuest Fox V2 — runtime contract (Gate E2 asset, Gate F runtime).
// Single source of truth for clip names, morph targets, bones and tuning used by every runtime module.
// Values come from 04_ANIMATIONS/anim_spec_e2.json and idle_variation_e2.json; the GLB is validated
// against this file at load time (FoxModelLoader), so a mismatching asset fails loudly instead of
// animating wrongly.

export const FOX_CONTRACT_VERSION = 'fox-v2/e2-anim+g1-module/f-runtime-2';
export const FOX_ASSET_FPS = 24;

// ------------------------------------------------------------------ clips
// Core set (in the approved E2 Fox GLB) + Gate G1 module (animation-only GLB bound to the same Fox).
export const CORE_BASE_CLIPS = ['idle', 'walk', 'run'] as const;
export const CORE_ONE_SHOT_CLIPS = ['happy', 'wave', 'head_pet', 'tail_touch'] as const;
export const G1_BASE_CLIPS = ['streak_active'] as const;
export const G1_ONE_SHOT_CLIPS = ['quest_start', 'quest_complete', 'quest_failed', 'receive_xp', 'level_up', 'achievement_unlock', 'streak_lost', 'streak_cheer'] as const;
export const BASE_CLIPS = [...CORE_BASE_CLIPS, ...G1_BASE_CLIPS] as const;
export const ONE_SHOT_CLIPS = [...CORE_ONE_SHOT_CLIPS, ...G1_ONE_SHOT_CLIPS] as const;
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
  // ---- Gate G1 (values = 04_ANIMATIONS/g1_quest_reward_streak/anim_spec_g1.json, re-checked against the GLB at load)
  quest_start: { loop: false, durationS: 59 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  quest_complete: { loop: false, durationS: 79 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  quest_failed: { loop: false, durationS: 87 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  receive_xp: { loop: false, durationS: 53 / 24, headControl: 1, faceControl: 1, largeMotion: false },
  level_up: { loop: false, durationS: 99 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  achievement_unlock: { loop: false, durationS: 85 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  streak_active: { loop: true, durationS: 96 / 24, headControl: 0, faceControl: 0, largeMotion: false },
  streak_lost: { loop: false, durationS: 99 / 24, headControl: 1, faceControl: 1, largeMotion: true },
  streak_cheer: { loop: false, durationS: 73 / 24, headControl: 1, faceControl: 1, largeMotion: true },
};

export const CLIP_CATEGORY: Record<FoxClipName, 'core' | 'quest' | 'rewards' | 'streak'> = {
  idle: 'core', walk: 'core', run: 'core', happy: 'core', wave: 'core', head_pet: 'core', tail_touch: 'core',
  quest_start: 'quest', quest_complete: 'quest', quest_failed: 'quest',
  receive_xp: 'rewards', level_up: 'rewards', achievement_unlock: 'rewards',
  streak_active: 'streak', streak_lost: 'streak', streak_cheer: 'streak',
};

// ------------------------------------------------------------------ animation modules (animation-only GLBs)
export interface FoxAnimationModuleDef { id: string; path: string; clips: readonly FoxClipName[] }
export const ANIMATION_MODULES: readonly FoxAnimationModuleDef[] = [
  { id: 'g1_quest_reward_streak', path: 'models/modules/fox_v2_g1_quest_reward_streak.anim.glb', clips: [...G1_BASE_CLIPS, ...G1_ONE_SHOT_CLIPS] },
];

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
