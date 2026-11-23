import { Bone } from 'three';
import { FoxAnimationManager } from './FoxAnimationManager';
import type { FoxEffectsManager } from './effects/FoxEffectsManager';
import { FoxBoneOps, mulberry32 } from './foxMath';
import {
  CLIP_META, DAILY_TUNING, FOX_STATE_DEFS, FOX_STATES, MIX_TUNING,
  type FoxActivity, type FoxBaseClip, type FoxInteractionMode, type FoxMood, type FoxOneShotClip, type FoxState, type FoxStateDef,
} from './foxContract';

// Gate G2 — daily-life state layer (study, sports, alarm, sleep, cooldown).
//
// * States are persistent contexts with their own base loop. Several may be active; the highest priority
//   one is VISIBLE (alarm 60 > sleep 50 > sports 40 > study 35 > cooldown 25 > idle). The others are
//   suspended and resume with their start clip when the visible one ends.
// * Transitions are clip-accurate: a start clip plays as a one-shot and the state loop is switched in
//   UNDER it (setBaseInstant, loop time 0) just before its fade-out, so the loop begins exactly where the
//   start clip ends. Complete clips switch the base back at full weight and end on the rest pose.
// * The layer never invents business rules: WHEN a state starts / ends comes from the application
//   (events / API). Cooldown progress is data; the impatience delay is a runtime presentation parameter.
// * Temporary interactions never end a state: 'full' plays the standing clip over the loop, 'face' shows
//   a face pulse + procedural ear / tail reaction (seated), 'procedural' only twitches (asleep).
// * Missing module → documented fallback (activity + mood); reduced motion → large start / complete clips
//   are skipped (face pulse instead) and large-motion loops use their reducedBase.

export interface FoxDailyHost {
  anim: FoxAnimationManager;
  effects: FoxEffectsManager;
  reducedMotion(): boolean;
  /** Base clip of the current activity (idle / walk / run / streak_active). */
  activityBase(): FoxBaseClip;
  setActivity(a: FoxActivity): void;
  getActivity(): FoxActivity;
  setMood(m: FoxMood, durationS?: number): void;
  emit(e: FoxDailyEvent): void;
}

export type FoxStatePhase = 'enter' | 'visible' | 'suspended' | 'resumed' | 'exit' | 'refresh';
export type FoxDailyEvent =
  | { type: 'state'; state: FoxState; phase: FoxStatePhase; cause?: string; fallback?: boolean }
  | { type: 'alarm-visual'; ringing: boolean }
  | { type: 'cooldown'; progress: number; impatient: boolean };

export interface FoxCooldownData { progress?: number; durationS?: number }
type Pending = { kind: 'start' | 'complete' | 'via'; state: FoxState; tag: string; clip: FoxOneShotClip; switched: boolean; then?: () => void };

let seq = 0;

export class FoxDailyLife {
  private active = new Map<FoxState, { since: number; data?: unknown }>();
  private visibleState: FoxState | null = null;
  private override: FoxBaseClip | null = null;
  private pending: Pending | null = null;
  private t = 0;
  private visibleSince = 0;
  private rnd = mulberry32(23);
  private lastStudyT = 0;
  private lastVisibleSeated = false;
  // cooldown (data from the app)
  private cd = { progress: 0, durationS: 0, startedAt: 0, streamed: false, impatient: false };
  impatienceAfterS: number = DAILY_TUNING.impatienceAfterS;
  readonly log: { t: number; state: string; phase: string; cause?: string }[] = [];
  readonly reactions: FoxReactionLayer;

  constructor(private host: FoxDailyHost, ops: FoxBoneOps, bones: Record<string, Bone>) {
    this.reactions = new FoxReactionLayer(ops, bones);
  }

  // ---------------------------------------------------------------- queries
  get visible() { return this.visibleState; }
  isActive(s: FoxState) { return this.active.has(s); }
  activeStates() { return [...this.active.keys()].sort((a, b) => FOX_STATE_DEFS[b].priority - FOX_STATE_DEFS[a].priority); }
  /** Base clip the state layer wants (null = the activity decides). */
  baseOverride() { return this.override; }
  available(s: FoxState) { return this.host.anim.has(FOX_STATE_DEFS[s].base); }
  interactionMode(): FoxInteractionMode { return this.visibleState ? FOX_STATE_DEFS[this.visibleState].interaction : 'full'; }
  minEventPriority() { return this.visibleState && this.available(this.visibleState) ? FOX_STATE_DEFS[this.visibleState].minEventPriority : 0; }
  get pendingClip() { return this.pending?.clip ?? null; }
  get cooldown() { return { progress: +this.cd.progress.toFixed(4), durationS: this.cd.durationS, impatient: this.cd.impatient, streamed: this.cd.streamed }; }
  snapshot() {
    return { visible: this.visibleState, active: this.activeStates(), override: this.override, pending: this.pending ? { kind: this.pending.kind, clip: this.pending.clip, state: this.pending.state, switched: this.pending.switched } : null,
      interaction: this.interactionMode(), cooldown: this.cooldown, impatienceAfterS: this.impatienceAfterS };
  }

  // ---------------------------------------------------------------- state API
  /** Start (or refresh) a state. `via` replaces its start clip ('none' = no clip). */
  enter(state: FoxState, opts: { via?: FoxOneShotClip | 'none'; cause?: string; data?: unknown } = {}) {
    if (!(FOX_STATES as readonly string[]).includes(state)) return 'unknown';
    if (this.active.has(state)) { this.active.get(state)!.data = opts.data; this.note(state, 'refresh', opts.cause); return 'refreshed'; }
    this.active.set(state, { since: this.t, data: opts.data });
    this.note(state, 'enter', opts.cause);
    if (state === 'cooldown') this.resetCooldown(opts.data as FoxCooldownData | undefined);
    const top = this.top();
    if (top === state) {
      const prev = this.visibleState;
      if (prev) this.note(prev, 'suspended', `by ${state}`);
      this.makeVisible(state, opts.via, false, opts.cause);
      return 'visible';
    }
    this.note(state, 'suspended', `behind ${top}`);
    return 'suspended';
  }

  /** End a state. outcome 'complete' plays its complete clip (or `via`), 'cancel' just leaves. */
  exit(state: FoxState, opts: { outcome?: 'complete' | 'cancel'; via?: FoxOneShotClip | 'none'; cause?: string } = {}) {
    if (!this.active.has(state)) return 'inactive';
    this.active.delete(state);
    this.note(state, 'exit', opts.cause);
    if (state === 'alarm') this.host.emit({ type: 'alarm-visual', ringing: false });
    if (this.visibleState !== state) return 'removed';
    const def = FOX_STATE_DEFS[state];
    const next = this.top();
    this.visibleState = null;
    const midStart = this.pending && this.pending.state === state && this.pending.kind === 'start' && !this.pending.switched;
    this.cancelPending();
    const fallback = !this.available(state);
    if (fallback) {
      if (def.fallback.activity === 'resting' && this.host.getActivity() === 'resting') this.host.setActivity('idle');
      if (opts.outcome !== 'cancel') this.host.setMood('happy', 2);
      this.override = null; this.refreshBase();
      if (next) this.makeVisible(next, undefined, true, `after ${state}`);
      return 'fallback';
    }
    // left while its start clip was still playing: the body is mid-transition, so no complete clip (it starts
    // from the loop pose) — the start clip fades out over the posture fade and a face pulse keeps the read
    if (midStart && opts.via !== 'none' && !(opts.via && opts.via !== def.complete)) {
      if (opts.outcome !== 'cancel') this.host.setMood('smile', 1.5);
      this.override = null; this.host.anim.setBase(this.host.activityBase(), DAILY_TUNING.postureFade);
      if (next && this.active.has(next)) this.makeVisible(next, undefined, true, `after ${state}`);
      return 'left-mid-start';
    }
    const clip = opts.via === 'none' ? undefined : opts.via ?? (opts.outcome === 'cancel' ? undefined : def.complete);
    const resume = () => { if (next && this.active.has(next) && !this.visibleState) this.makeVisible(next, undefined, true, `after ${state}`); };
    if (clip && this.canPlay(clip)) {
      const tag = `${clip}@state#${++seq}`;
      const r = this.host.anim.request(clip, { priority: Math.max(def.priority, 30), source: 'event', queue: false, tag });
      if (r === 'played') {
        this.pending = { kind: opts.via ? 'via' : 'complete', state, tag, clip, switched: false, then: resume };
        return 'transition';
      }
    } else if (clip && this.host.reducedMotion()) this.host.setMood(state === 'sleep' ? 'smile' : 'happy', 2);
    // no clip: cross-fade back (longer fade when leaving a seated / lying loop)
    this.override = null;
    this.host.anim.setBase(this.host.activityBase(), state === 'study' || state === 'sleep' || state === 'task_writing' ? DAILY_TUNING.postureFade : undefined);
    resume();
    return 'left';
  }

  /** Cooldown progress (0..1) as data, or a display duration to interpolate (both provided by the app). */
  setCooldown(d: FoxCooldownData) {
    if (typeof d.progress === 'number') { this.cd.progress = Math.min(1, Math.max(0, d.progress)); this.cd.streamed = true; }
    if (typeof d.durationS === 'number' && d.durationS > 0) { this.cd.durationS = d.durationS; this.cd.startedAt = this.t - this.cd.progress * d.durationS; this.cd.streamed = typeof d.progress === 'number' ? this.cd.streamed : false; }
    this.host.effects.setCooldownProgress(this.cd.progress);
  }
  private resetCooldown(d?: FoxCooldownData) {
    this.cd = { progress: 0, durationS: 0, startedAt: this.t, streamed: false, impatient: false };
    if (d) this.setCooldown(d);
    this.host.effects.setCooldownProgress(this.cd.progress); this.host.effects.setCooldownImpatient(false);
  }

  /** Drop every state immediately (no clips) — dispose / hard reset. */
  clear() { this.active.clear(); this.visibleState = null; this.pending = null; this.override = null; this.host.effects.setStateFx([]); this.host.effects.reconcileProps([], false); }

  // ---------------------------------------------------------------- interaction / suppressed events
  /** Reaction for a tap when the visible state does not allow the standing clip. */
  react(target: 'head' | 'tail', mode: FoxInteractionMode) {
    this.reactions.trigger(target === 'head' ? 'ears' : 'tail');
    if (target === 'head') this.reactions.trigger('ears2');
    if (mode === 'face') this.host.setMood(target === 'head' ? 'happy' : 'surprised', target === 'head' ? 1.2 : 0.9);
  }

  // ---------------------------------------------------------------- per frame
  update(dt: number) {
    this.t += dt;
    const anim = this.host.anim, p = this.pending;
    if (p) {
      const D = CLIP_META[p.clip].durationS;
      if (anim.currentTag === p.tag) {
        const tt = anim.currentTime ?? 0;
        if (p.kind === 'start' && !p.switched && tt >= D - MIX_TUNING.fadeOut - 1 / 60) {
          // the start clip is at full weight and about to fade out: start the state loop under it at time 0
          this.override = this.baseFor(p.state); anim.setBaseInstant(this.override, 0); p.switched = true;
        }
        if (p.kind !== 'start' && !p.switched && tt >= MIX_TUNING.fadeIn) {
          // complete / via clip owns the body: put the activity base under it (the clip ends on the rest pose)
          this.override = null; anim.setBaseInstant(this.host.activityBase(), 0); p.switched = true;
        }
      } else {
        // the clip ended (or was interrupted by something more important)
        this.pending = null;
        if (p.kind === 'start') {
          if (!p.switched && this.visibleState === p.state) { this.override = this.baseFor(p.state); anim.setBase(this.override, undefined, true); }
        } else {
          if (!p.switched) { this.override = null; anim.setBase(this.host.activityBase()); }
          p.then?.();
        }
      }
    }
    const v = this.visibleState;
    // cooldown: display progress from an app-provided duration when not streamed; impatience after the runtime delay
    if (v === 'cooldown' && this.available('cooldown')) {
      if (!this.cd.streamed && this.cd.durationS > 0) this.cd.progress = Math.min(1, (this.t - this.cd.startedAt) / this.cd.durationS);
      this.host.effects.setCooldownProgress(this.cd.progress);
      const imp = this.t - this.visibleSince >= this.impatienceAfterS && !this.pending;
      if (imp !== this.cd.impatient) {
        this.cd.impatient = imp; this.host.effects.setCooldownImpatient(imp);
        if (!this.pending) { this.override = this.baseFor('cooldown'); anim.setBase(this.override, 0.6, true); }
        this.host.emit({ type: 'cooldown', progress: this.cd.progress, impatient: imp });
      }
    }
    // study loop: small tempo variation per loop (the long loop never repeats exactly)
    if (v === 'study' && this.override === 'study_focus') {
      const tt = anim.baseTime('study_focus');
      if (tt < this.lastStudyT - 1) anim.setBaseTimeScale('study_focus', 0.93 + 0.14 * this.rnd());
      this.lastStudyT = tt;
    }
    // props + loop effects of the visible state (a start clip shows its props itself)
    const def = v && this.available(v) ? FOX_STATE_DEFS[v] : null;
    const starting = !!(this.pending && this.pending.kind === 'start' && !this.pending.switched);
    this.host.effects.reconcileProps(def ? def.props : [], !!def && !starting);
    this.host.effects.setStateFx(def && !starting ? this.loopFx(v!, def) : []);
    this.reactions.update(dt);
  }

  // ---------------------------------------------------------------- internals
  private top(): FoxState | null { return this.activeStates()[0] ?? null; }
  private canPlay(clip: FoxOneShotClip) { return this.host.anim.has(clip) && !(this.host.reducedMotion() && CLIP_META[clip].largeMotion); }
  private baseFor(s: FoxState): FoxBaseClip {
    const def = FOX_STATE_DEFS[s];
    if (s === 'cooldown' && this.cd.impatient && this.host.anim.has('cooldown_wait_impatient')) return 'cooldown_wait_impatient';
    if (this.host.reducedMotion() && def.reducedBase) return def.reducedBase;
    return def.base;
  }
  private loopFx(s: FoxState, def: FoxStateDef) { return s === 'sports' && this.host.reducedMotion() ? [] : def.fx; }
  private refreshBase() { this.host.anim.setBase(this.override ?? this.host.activityBase()); }

  /** Fade out a state clip that is still playing (its state was suspended / left mid-way). */
  private cancelPending() {
    const p = this.pending; this.pending = null;
    if (p && this.host.anim.currentTag === p.tag) this.host.anim.cancelTag(p.tag, DAILY_TUNING.postureFade);
  }

  private makeVisible(state: FoxState, via: FoxOneShotClip | 'none' | undefined, resumed: boolean, cause?: string) {
    const def = FOX_STATE_DEFS[state];
    const prevSeated = !!this.pending && (this.pending.state === 'study' || this.pending.state === 'sleep' || this.pending.state === 'task_writing');
    // a suspended state's START clip is cancelled; a complete / via clip of the state that just ended keeps
    // playing (e.g. wake_start before the alarm loop) and the new loop takes over when it ends
    if (this.pending && this.pending.kind === 'start' && this.pending.state !== state) this.cancelPending();
    const transition = this.pending && this.pending.kind !== 'start' ? this.pending : null;
    this.lastVisibleSeated = this.visibleState === 'study' || this.visibleState === 'sleep' || this.visibleState === 'task_writing';
    this.visibleState = state; this.visibleSince = this.t;
    this.note(state, resumed ? 'resumed' : 'visible', cause);
    if (state === 'alarm') this.host.emit({ type: 'alarm-visual', ringing: true });
    if (!this.available(state)) {
      // documented fallback: no G2 module → activity + mood (sleep → 'resting')
      this.pending = null; this.override = null;
      if (def.fallback.activity !== this.host.getActivity()) this.host.setActivity(def.fallback.activity);
      if (def.fallback.mood !== 'neutral' && def.fallback.activity !== 'resting') this.host.setMood(def.fallback.mood, 2.5);
      this.refreshBase();
      this.host.emit({ type: 'state', state, phase: 'visible', cause, fallback: true });
      return;
    }
    if (this.host.getActivity() === 'resting') this.host.setActivity('idle');
    const clip = via === 'none' ? undefined : via ?? def.start;
    if (transition) {
      // wait for the running transition clip, then start this state (with its own start clip if any)
      const prevThen = transition.then;
      transition.then = () => { prevThen?.(); if (this.visibleState === state && !this.pending) this.startVisible(state, clip); };
      return;
    }
    this.startVisible(state, clip, prevSeated);
  }

  private startVisible(state: FoxState, clip: FoxOneShotClip | undefined, prevSeated = false) {
    const def = FOX_STATE_DEFS[state];
    if (clip && this.canPlay(clip)) {
      const tag = `${clip}@state#${++seq}`;
      const r = this.host.anim.request(clip, { priority: Math.max(def.priority, 30), source: 'event', queue: false, tag });
      if (r === 'played') { this.pending = { kind: 'start', state, tag, clip, switched: false }; return; }
    } else if (clip && this.host.reducedMotion()) this.host.setMood(state === 'sleep' ? 'sleepy' : 'smile', 1.5);
    this.pending = null;
    this.override = this.baseFor(state);
    const seated = state === 'study' || state === 'sleep' || state === 'task_writing' || prevSeated || this.lastVisibleSeated;
    this.host.anim.setBase(this.override, seated ? DAILY_TUNING.postureFade : undefined, true);
  }

  private note(state: FoxState, phase: FoxStatePhase, cause?: string) {
    this.log.push({ t: +this.t.toFixed(3), state, phase, cause });
    if (this.log.length > 200) this.log.splice(0, this.log.length - 200);
    this.host.emit({ type: 'state', state, phase, cause });
  }
}

/**
 * Procedural reactions written after the mixer (ears / tail): used when a tap must not replace the
 * state loop (studying, asleep). Allocation-free impulses; they fade on their own.
 */
export class FoxReactionLayer {
  private ev: { kind: 'ears' | 'ears2' | 'tail'; t: number }[] = [];
  private t = 0;
  readonly log: { t: number; kind: string }[] = [];
  constructor(private ops: FoxBoneOps, private B: Record<string, Bone>) {}
  trigger(kind: 'ears' | 'ears2' | 'tail') { this.ev.push({ kind, t: this.t }); this.log.push({ t: +this.t.toFixed(3), kind }); if (this.log.length > 100) this.log.shift(); }
  get active() { return this.ev.length; }
  update(dt: number) {
    this.t += dt;
    this.ev = this.ev.filter(e => this.t - e.t < (e.kind === 'tail' ? 0.8 : 0.45));
    for (const e of this.ev) {
      const u = this.t - e.t;
      if (e.kind === 'ears' || e.kind === 'ears2') {
        const k = u < 0.06 ? u / 0.06 : u < 0.16 ? 1 - (1.3 * (u - 0.06)) / 0.1 : -0.3 * (1 - Math.min(1, (u - 0.16) / 0.29));
        const b = this.B[e.kind === 'ears' ? 'EAR_L_01' : 'EAR_R_01'], sg = e.kind === 'ears' ? 1 : -1;
        if (b) { this.ops.addLocal(b, 'x', 14 * k); this.ops.addLocal(b, 'y', sg * 7 * k); }
      } else {
        const k = Math.sin(Math.PI * Math.min(1, u / 0.8));
        for (let i = 1; i <= 4; i++) { const b = this.B['TAIL_0' + i]; if (b) this.ops.addLocal(b, 'y', 12 * k * Math.sin(u * 18 - i * 0.7) * (i === 1 ? 0.35 : 0.22) * 2.2); }
      }
    }
  }
}
