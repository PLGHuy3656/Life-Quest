import { AnimationAction, AnimationClip, AnimationMixer, Bone, LoopOnce, LoopRepeat, Mesh, Object3D, Quaternion } from 'three';
import { BASE_CLIPS, CLIP_META, MIX_TUNING, isOneShotClip, type FoxBaseClip, type FoxClipName, type FoxOneShotClip } from './foxContract';

// Animation state management: one persistent base layer (idle / walk / run cross-fade) and one
// one-shot layer with priorities, a small queue and cross-faded interruption. The mixer weights are
// driven explicitly every frame (no implicit three.js fades) so they always sum to 1.

export type FoxShotSource = 'api' | 'interaction' | 'event' | 'ambient';
export interface FoxShotRequest { priority?: number; source?: FoxShotSource; queue?: boolean; ttlS?: number; tag?: string }
export type FoxShotResult = 'played' | 'queued' | 'debounced' | 'rejected' | 'merged' | 'unknown' | 'unavailable';

export const PRIORITY = { ambient: 0, context: 10, interaction: 20, normal: 20, important: 30, urgent: 45, major: 50, critical: 60 } as const;

interface ShotSlot { name: FoxOneShotClip; action: AnimationAction; t: number; w: number; priority: number; source: FoxShotSource; tag?: string; fadingOut: boolean; fadeT: number; fadeFromW: number; fadeDur?: number }
interface Queued { name: FoxOneShotClip; priority: number; source: FoxShotSource; expires: number; tag?: string; count: number }

export interface FoxAnimListener { onShotStart?(name: FoxOneShotClip, source: FoxShotSource, tag?: string): void; onShotEnd?(name: FoxOneShotClip, interrupted: boolean, tag?: string): void }

export class FoxAnimationManager {
  readonly mixer: AnimationMixer;
  private actions = {} as Record<FoxClipName, AnimationAction>;
  private base: FoxBaseClip = 'idle';
  // every base clip of the contract (core + G1 + G2) — built from BASE_CLIPS so a new module never yields NaN weights
  private baseW = Object.fromEntries(BASE_CLIPS.map(b => [b, b === 'idle' ? 1 : 0])) as Record<FoxBaseClip, number>;
  private baseFadeS: number = MIX_TUNING.baseFade;
  private baseScale = {} as Partial<Record<FoxBaseClip, number>>;
  /** Base clips actually present (core + loaded modules). */
  private bases: FoxBaseClip[] = [];
  private phase = 0;
  private shots: ShotSlot[] = [];
  private queue: Queued[] = [];
  private time = 0;
  private shotWeight = 0;
  private idleTempo = 1;
  private activityTempo = 1;
  private listeners = new Set<FoxAnimListener>();
  private restore: { save(): void; restore(): void }[] = [];
  static readonly QUEUE_MAX = 4;

  constructor(private root: Object3D, clips: AnimationClip[], proceduralBones: Bone[], faceMeshes: Mesh[]) {
    this.mixer = new AnimationMixer(root);
    for (const clip of clips) {
      if (!(clip.name in CLIP_META)) continue;
      this.actions[clip.name as FoxClipName] = this.mixer.clipAction(clip);
    }
    this.bases = BASE_CLIPS.filter(b => !!this.actions[b]);
    for (const b of this.bases) { const a = this.actions[b]; a.setLoop(LoopRepeat, Infinity); a.play(); }
    // procedural layers write some bones / morphs after the mixer: hand the mixer's own values back first
    for (const bone of proceduralBones) { const q = new Quaternion(); this.restore.push({ save: () => q.copy(bone.quaternion), restore: () => bone.quaternion.copy(q) }); }
    for (const m of faceMeshes) {
      const inf = m.morphTargetInfluences; if (!inf) continue;
      const buf = new Float32Array(inf.length);
      this.restore.push({ save: () => { for (let i = 0; i < inf.length; i++) buf[i] = inf[i]; }, restore: () => { for (let i = 0; i < inf.length; i++) inf[i] = buf[i]; } });
    }
    this.save();
  }

  addListener(l: FoxAnimListener) { this.listeners.add(l); return () => this.listeners.delete(l); }

  // ---------------------------------------------------------------- base layer
  /** Cross-fade the base layer to `name` (fadeS defaults to MIX_TUNING.baseFade). */
  setBase(name: FoxBaseClip, fadeS?: number, restart = false) {
    const n = this.actions[name] ? name : 'idle';
    if (n !== this.base) this.baseFadeS = fadeS ?? MIX_TUNING.baseFade;
    // G2 state loops start from their first frame when they fade in from zero weight
    if (restart && n !== this.base && (this.baseW[n] ?? 0) < 1e-3) this.actions[n].time = 0;
    this.base = n;
  }
  /**
   * G2: switch the base layer at once and start the loop at `time` (used while a one-shot covers the
   * base at full weight, so the state loop begins exactly where the start clip ends).
   */
  setBaseInstant(name: FoxBaseClip, time = 0) {
    if (!this.actions[name]) { this.setBase(name); return; }
    this.base = name;
    for (const b of this.bases) this.baseW[b] = b === name ? 1 : 0;
    const a = this.actions[name]; a.time = Math.min(time, a.getClip().duration);
  }
  /** Per-base playback speed (runtime variation of long loops; 1 = authored tempo). */
  setBaseTimeScale(name: FoxBaseClip, s: number) { this.baseScale[name] = s; }
  baseTime(name: FoxBaseClip) { return this.actions[name]?.time ?? 0; }
  /** Is this clip loaded (core GLB or a validated module)? */
  has(name: FoxClipName) { return !!this.actions[name]; }
  available(): FoxClipName[] { return Object.keys(this.actions) as FoxClipName[]; }
  getBase() { return this.base; }
  setIdleTempo(s: number) { this.idleTempo = s; }
  setActivityTempo(s: number) { this.activityTempo = s; }
  get idleTime() { return this.actions.idle.time; }

  // ---------------------------------------------------------------- one-shot layer
  get current(): ShotSlot | undefined { const s = this.shots[this.shots.length - 1]; return s && !s.fadingOut ? s : undefined; }
  get currentShot(): FoxOneShotClip | null { return this.current?.name ?? null; }
  get currentTag(): string | null { return this.current?.tag ?? null; }
  get oneShotWeight() { return this.shotWeight; }
  get queued() { return this.queue.map(q => ({ name: q.name, priority: q.priority, source: q.source, count: q.count })); }

  request(name: string, req: FoxShotRequest = {}): FoxShotResult {
    if (!isOneShotClip(name)) return 'unknown';
    if (!this.actions[name]) return 'unavailable';
    const priority = req.priority ?? PRIORITY.normal, source = req.source ?? 'api';
    const cur = this.current;
    if (cur) {
      if (cur.name === name && cur.t < CLIP_META[name].durationS * 0.7) return 'debounced';   // repeated clicks
      // higher priority interrupts; equal priority only replaces a user interaction with a new
      // user interaction (petting again). Everything else waits in the queue or is dropped.
      const interrupts = priority > cur.priority || (priority === cur.priority && source === 'interaction' && cur.source === 'interaction');
      if (!interrupts) {
        if (!req.queue) return 'rejected';
        return this.enqueue(name, priority, source, req.ttlS ?? 8, req.tag);
      }
      cur.fadingOut = true; cur.fadeT = 0; cur.fadeFromW = cur.w;                                  // cross-fade out
      this.emitEnd(cur.name, true, cur.tag);
    }
    this.start(name, priority, source, req.tag);
    return 'played';
  }

  private enqueue(name: FoxOneShotClip, priority: number, source: FoxShotSource, ttlS: number, tag?: string): FoxShotResult {
    const same = this.queue.find(q => q.name === name);
    if (same) { same.count++; same.priority = Math.max(same.priority, priority); same.expires = this.time + ttlS; return 'merged'; }
    this.queue.push({ name, priority, source, expires: this.time + ttlS, tag, count: 1 });
    this.queue.sort((a, b) => b.priority - a.priority);
    if (this.queue.length > FoxAnimationManager.QUEUE_MAX) this.queue.length = FoxAnimationManager.QUEUE_MAX;   // lowest priority dropped
    return 'queued';
  }

  private seq = 0;
  private start(name: FoxOneShotClip, priority: number, source: FoxShotSource, tag?: string) {
    tag = tag ?? `${name}#${++this.seq}`;                      // every shot has a tag (effects follow it)
    // a fading-out slot of the same clip shares the action: retire it first
    const dup = this.shots.findIndex(s => s.name === name);
    if (dup >= 0) { this.shots[dup].action.stop(); this.shots.splice(dup, 1); }
    const a = this.actions[name];
    a.reset(); a.setLoop(LoopOnce, 1); a.clampWhenFinished = true; a.setEffectiveTimeScale(1); a.setEffectiveWeight(0); a.play();
    this.shots.push({ name, action: a, t: 0, w: 0, priority, source, tag, fadingOut: false, fadeT: 0, fadeFromW: 0 });
    for (const l of this.listeners) l.onShotStart?.(name, source, tag);
  }

  private emitEnd(name: FoxOneShotClip, interrupted: boolean, tag?: string) { for (const l of this.listeners) l.onShotEnd?.(name, interrupted, tag); }

  /** G2: fade out the shot with this tag (if it is the current one) — e.g. a state's start clip when the state is left mid-way. */
  cancelTag(tag: string, fadeS: number = MIX_TUNING.interruptFade) {
    this.queue = this.queue.filter(q => q.tag !== tag);
    const cur = this.current;
    if (!cur || cur.tag !== tag) return false;
    cur.fadingOut = true; cur.fadeT = 0; cur.fadeFromW = cur.w; cur.fadeDur = fadeS;
    this.emitEnd(cur.name, true, cur.tag);
    return true;
  }

  /** Stop every one-shot immediately (and clear the queue). */
  cancelOneShots() {
    for (const s of this.shots) { s.action.stop(); if (!s.fadingOut) this.emitEnd(s.name, true, s.tag); }
    this.shots = []; this.queue = []; this.shotWeight = 0;
  }

  // ---------------------------------------------------------------- per-frame
  /** Restore procedural targets, drive weights, run the mixer and snapshot its output. */
  update(dt: number) {
    this.time += dt;
    for (const r of this.restore) r.restore();
    this.updateWeights(dt);
    this.actions.idle.setEffectiveTimeScale(this.idleTempo * this.activityTempo);
    this.invalidateMixerCache();
    this.mixer.update(dt);
    this.root.updateMatrixWorld(true);
    this.save();
  }

  private save() { for (const r of this.restore) r.save(); }

  // three's PropertyMixer only writes a property when its accumulated value changed since the last
  // write; invalidating the previous accumulation guarantees every bound property is rewritten from
  // the clips each update (procedural layers then add on top).
  private invalidateMixerCache() {
    const bindings = (this.mixer as unknown as { _bindings: { valueSize: number; buffer: Float64Array | number[] }[] })._bindings;
    for (const pm of bindings) { const n = pm.valueSize; (pm.buffer as Float64Array).fill(NaN, n, 3 * n); }
  }

  private updateWeights(dt: number) {
    const { fadeIn, fadeOut, interruptFade } = MIX_TUNING;
    const baseFade = this.baseFadeS;
    for (const b of this.bases) {
      const tgt = b === this.base ? 1 : 0, d = dt / baseFade;
      this.baseW[b] = tgt > this.baseW[b] ? Math.min(tgt, this.baseW[b] + d) : Math.max(tgt, this.baseW[b] - d);
    }
    const tot = this.bases.reduce((s, b) => s + this.baseW[b], 0) || 1;
    // walk and run share one normalised phase so the feet stay in step during the blend
    const ww = this.baseW.walk / tot, rw = this.baseW.run / tot, loc = ww + rw;
    const walk = this.actions.walk, run = this.actions.run;
    if (loc > 0) { const dur = (ww * walk.getClip().duration + rw * run.getClip().duration) / loc; this.phase = (this.phase + dt / dur) % 1; }
    walk.time = this.phase * walk.getClip().duration; run.time = this.phase * run.getClip().duration;

    // one-shots: current ramps in/out, interrupted ones fade from their weight at interruption
    for (const s of [...this.shots]) {
      const D = s.action.getClip().duration;
      s.t += dt;
      if (s.fadingOut) {
        s.fadeT += dt; s.w = s.fadeFromW * Math.max(0, 1 - s.fadeT / (s.fadeDur ?? interruptFade));
        if (s.w <= 0 || s.t >= D) this.retire(s, false);
      } else {
        s.w = Math.min(1, s.t / fadeIn, Math.max(0, (D - s.t) / fadeOut));
        if (s.t >= D) { this.retire(s, true); this.emitEnd(s.name, false, s.tag); }
      }
    }
    let sum = this.shots.reduce((a, s) => a + s.w, 0);
    if (sum > 1) { for (const s of this.shots) s.w /= sum; sum = 1; }
    this.shotWeight = sum;
    for (const b of this.bases) {
      const a = this.actions[b]; a.enabled = true; a.setEffectiveWeight((this.baseW[b] / tot) * (1 - sum));
      if (b === 'walk' || b === 'run') a.setEffectiveTimeScale(0);   // walk / run time is driven by the shared phase
      else if (b !== 'idle') a.setEffectiveTimeScale(this.baseScale[b] ?? 1);
    }
    for (const s of this.shots) s.action.setEffectiveWeight(s.w);

    // queue: expire, then start the next one when the layer is free
    this.queue = this.queue.filter(q => q.expires > this.time);
    if (!this.current && this.queue.length) { const q = this.queue.shift()!; this.start(q.name, q.priority, q.source, q.tag); }
  }

  private retire(s: ShotSlot, _finished: boolean) { s.action.stop(); this.shots.splice(this.shots.indexOf(s), 1); }

  // ---------------------------------------------------------------- queries
  /** Effective weight of every clip this frame. */
  weights(): Record<FoxClipName, number> {
    const tot = this.bases.reduce((s, b) => s + this.baseW[b], 0) || 1;
    const out = Object.fromEntries(Object.keys(CLIP_META).map(k => [k, 0])) as Record<FoxClipName, number>;
    for (const b of this.bases) out[b] = (this.baseW[b] / tot) * (1 - this.shotWeight);
    for (const s of this.shots) out[s.name] += s.w;
    return out;
  }
  /** Σ weight × clip.headControl / faceControl (how much the clips own the head / face). */
  control(kind: 'headControl' | 'faceControl') {
    const w = this.weights(); let s = 0;
    for (const n of Object.keys(w) as FoxClipName[]) s += w[n] * CLIP_META[n][kind];
    return Math.min(1, s);
  }
  baseWeight(b: FoxBaseClip) { const tot = this.bases.reduce((s, x) => s + this.baseW[x], 0) || 1; return this.baseW[b] / tot; }
  /** Current playback time (s) of the active one-shot, or null. */
  get currentTime() { return this.current?.t ?? null; }
  /** Locomotion ground speed (m/s, before level scale) for scrolling floors. */
  groundSpeed() {
    const w = this.weights();
    return w.walk * (CLIP_META.walk.speedMps ?? 0) + w.run * (CLIP_META.run.speedMps ?? 0);
  }

  dispose() {
    this.listeners.clear(); this.queue = []; this.shots = [];
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
  }
}
