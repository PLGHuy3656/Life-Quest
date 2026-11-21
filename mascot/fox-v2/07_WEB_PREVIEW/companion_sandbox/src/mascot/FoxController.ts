import { Bone, CanvasTexture, Camera, Group, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, SkinnedMesh, Skeleton } from 'three';
import { FoxAnimationManager, PRIORITY, type FoxShotResult } from './FoxAnimationManager';
import { FoxEventRegistry, foxEventRegistry, stepsFor, type FoxEventCoverage, type FoxEventName, type FoxEventPayloads, type FoxReactionStep } from './FoxEventMap';
import { FoxFaceController } from './FoxFaceController';
import { FoxHoverLayer, FoxIdleVariation } from './FoxIdleVariation';
import { FoxInteractionManager, type FoxHitTarget } from './FoxInteractionManager';
import { FoxLevelScale } from './FoxLevelScale';
import { FoxLookAtController } from './FoxLookAtController';
import { acquireFoxAsset, type FoxAssetHandle, type FoxAssetInfo, type FoxModuleRequest } from './FoxModelLoader';
import { FoxEffectsManager, type FxCue } from './effects/FoxEffectsManager';
import { sharedFxTextures, type FxCategory } from './effects/fxCore';
import g1Spec from './modules/g1_quest_reward_streak.spec.json';
import { FoxBoneOps } from './foxMath';
import { FoxRenderBinding } from './FoxRenderBinding';
import {
  ACTIVITIES, ACTIVITY_BASE, CLIP_META, FACE_MESHES, FOX_CONTRACT_VERSION, MOODS, PROCEDURAL_BONES, STREAK_TIERS,
  isBaseClip, isOneShotClip, streakTierForDays, type FoxActivity, type FoxBaseClip, type FoxClipName, type FoxMood, type FoxOneShotClip, type FoxStreakTier,
} from './foxContract';

// Public façade of the companion runtime. Renderer-agnostic: it owns the Fox instance, the
// animation stack and the interaction state, and exposes `object3D` + `update(dt)`. A host
// (React Three Fiber in the sandbox, or a plain three.js loop) adds `object3D` to its scene, binds a
// camera + DOM element with attachView(), and calls update() once per rendered frame.

export interface FoxControllerOptions {
  modelUrl: string;
  level?: number;
  mood?: FoxMood;
  activity?: FoxActivity;
  interaction?: boolean;
  lookAt?: boolean;
  idleVariation?: boolean;
  reducedMotion?: boolean;
  seed?: number;
  registry?: FoxEventRegistry;
  /** Soft contact shadow under the feet (default true). */
  shadow?: boolean;
  /** Animation-only GLB modules to bind to the Fox (Gate G1+). Missing / invalid modules are skipped. */
  modules?: readonly FoxModuleRequest[];
  /** Initial streak state (flame + streak_active base loop). */
  streak?: { active: boolean; tier?: FoxStreakTier; days?: number };
  /** Runtime effects on/off (default on). */
  effects?: boolean;
  signal?: AbortSignal;
}

export type FoxPlayResult = FoxShotResult | 'base' | 'substituted';
const MODULE_CUES: Partial<Record<FoxClipName, FxCue[]>> = Object.fromEntries(
  Object.entries((g1Spec as { clips: Record<string, { cues?: FxCue[] }> }).clips).map(([k, v]) => [k, v.cues ?? []]));
export interface FoxEventResult { result: 'handled' | 'coalesced' | 'unknown'; canonical?: string; coverage?: FoxEventCoverage; steps?: FoxReactionStep[]; play?: FoxPlayResult }

export type FoxControllerEvent =
  | { type: 'oneshot-start'; clip: FoxOneShotClip; source: string; tag?: string }
  | { type: 'oneshot-end'; clip: FoxOneShotClip; interrupted: boolean; tag?: string }
  | { type: 'hover'; target: FoxHitTarget }
  | { type: 'tap'; target: 'head' | 'tail'; via: string; result: FoxPlayResult }
  | { type: 'event'; name: string; result: FoxEventResult }
  | { type: 'level'; level: number; scale: number }
  | { type: 'mood'; mood: FoxMood; durationS?: number }
  | { type: 'activity'; activity: FoxActivity }
  | { type: 'paused'; paused: boolean }
  | { type: 'grab'; grabbing: boolean }
  | { type: 'streak'; active: boolean; tier: FoxStreakTier }
  | { type: 'level-applied'; level: number; scale: number };
type Listener = (e: FoxControllerEvent) => void;

// ------------------------------------------------------------------ shared contact shadow
let shadowShared: { geo: PlaneGeometry; mat: MeshBasicMaterial; tex: CanvasTexture; refs: number } | null = null;
function acquireShadow() {
  if (!shadowShared) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
    const r = g.createRadialGradient(64, 64, 4, 64, 64, 62); r.addColorStop(0, 'rgba(90,60,40,0.30)'); r.addColorStop(1, 'rgba(90,60,40,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    const tex = new CanvasTexture(c);
    shadowShared = { geo: new PlaneGeometry(0.7, 0.6), mat: new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }), tex, refs: 0 };
  }
  shadowShared.refs++;
  const m = new Mesh(shadowShared.geo, shadowShared.mat);
  m.rotation.x = -Math.PI / 2; m.position.y = 0.002; m.name = 'FOX_ContactShadow'; m.renderOrder = -1;
  return m;
}
function releaseShadow() {
  if (!shadowShared) return;
  if (--shadowShared.refs <= 0) { shadowShared.geo.dispose(); shadowShared.mat.dispose(); shadowShared.tex.dispose(); shadowShared = null; }
}

let instanceCounter = 0;

export class FoxController {
  static readonly contractVersion = FOX_CONTRACT_VERSION;

  /** Add this to the host scene. Contains the Fox instance and its contact shadow. */
  readonly object3D = new Group();
  readonly id = `fox-${++instanceCounter}`;
  readonly assetInfo: FoxAssetInfo;

  private asset: FoxAssetHandle;
  private fox: Object3D;
  private bones: Record<string, Bone> = {};
  private objs: Record<string, Object3D> = {};
  private anim: FoxAnimationManager;
  private look: FoxLookAtController;
  private idle: FoxIdleVariation;
  private hoverLayer: FoxHoverLayer;
  private face: FoxFaceController;
  private interaction: FoxInteractionManager;
  private level: FoxLevelScale;
  private registry: FoxEventRegistry;
  private shadow: Mesh | null = null;
  private camera: Camera | null = null;
  private bindings = new Set<FoxRenderBinding>();

  private listeners = new Set<Listener>();
  private activity: FoxActivity = 'idle';
  private moodBeforeRest: FoxMood = 'neutral';
  private reducedMotion = false;
  private lookAtOn = true;
  private idleVariationOn = true;
  private paused = false;
  private skipNextDt = false;
  private disposed = false;
  private lastEventAt = new Map<string, number>();
  private coalesced = new Map<string, number>();
  private deferredMoods = new Map<string, { mood: FoxMood; durationS?: number }[]>();
  private clock = 0;
  private eventSeq = 0;
  readonly effects: FoxEffectsManager;
  private streakActive = false;
  private streakTier: FoxStreakTier = 'orange';
  private pendingLevel: number | null = null;

  /** Load the model (shared cache) and build a controller. Rejects with FoxAssetError on failure. */
  static async create(opts: FoxControllerOptions): Promise<FoxController> {
    const asset = await acquireFoxAsset(opts.modelUrl, opts.signal, opts.modules ?? []);
    try { return new FoxController(asset, opts); } catch (e) { asset.release(); throw e; }
  }

  private constructor(asset: FoxAssetHandle, opts: FoxControllerOptions) {
    this.asset = asset; this.assetInfo = asset.info; this.fox = asset.scene;
    this.registry = opts.registry ?? foxEventRegistry;
    this.object3D.name = 'FOX_COMPANION'; this.object3D.add(this.fox);
    this.fox.traverse(o => {
      if (o.name && !(o.name in this.objs)) this.objs[o.name] = o;
      if ((o as Mesh).isMesh) o.frustumCulled = false;   // skinned bounds do not follow the pose
      if ((o as Bone).isBone) this.bones[o.name] = o as Bone;
    });
    const meshOf = (n: string) => { const o = this.objs[n]; return o && (o as Mesh).isMesh ? (o as Mesh) : null; };
    const meshList = (n: string) => { const o = this.objs[n]; if (!o) return [] as Mesh[]; if ((o as Mesh).isMesh) return [o as Mesh]; return o.children.filter(c => (c as Mesh).isMesh) as Mesh[]; };
    const faceMeshes = FACE_MESHES.map(meshOf).filter((m): m is Mesh => !!m && !!m.morphTargetInfluences);
    const eyes = ['FOX_Eye_L', 'FOX_Eye_R'].map(meshOf).filter((m): m is Mesh => !!m);
    const ops = new FoxBoneOps(this.fox);

    this.anim = new FoxAnimationManager(this.fox, asset.clips, PROCEDURAL_BONES.map(n => this.bones[n]), faceMeshes);
    this.anim.addListener({
      onShotStart: (clip, source, tag) => { if (tag) this.effects.onShotStart(clip, tag); this.emit({ type: 'oneshot-start', clip, source, tag }); },
      onShotEnd: (clip, interrupted, tag) => {
        if (tag) this.effects.onShotEnd(clip, interrupted, tag);
        if (clip === 'level_up') this.applyPendingLevel();      // safety: never leave a level pending
        this.emit({ type: 'oneshot-end', clip, interrupted, tag }); this.flushDeferredMoods(tag);
      },
    });
    this.look = new FoxLookAtController(this.fox, { NECK: this.bones.NECK, HEAD: this.bones.HEAD, SPINE: this.bones.SPINE }, eyes, ops);
    this.idle = new FoxIdleVariation(ops, this.bones, eyes, opts.seed);
    this.hoverLayer = new FoxHoverLayer(ops, this.bones);
    this.face = new FoxFaceController(faceMeshes);
    // proxies are built at scale 1 (before the level scale is applied) and then follow the bones
    this.interaction = new FoxInteractionManager(this.fox, this.bones, this.objs.FOX_Body ?? null, meshList('FOX_Tail'), this.objs.FOX_Head ?? this.bones.HEAD, {
      onHover: t => this.emit({ type: 'hover', target: t }),
      onTap: (t, via) => this.onTap(t, via),
      onGrab: g => this.emit({ type: 'grab', grabbing: g }),
      onActivity: () => this.look.notifyActivity(),
    });
    if (opts.shadow !== false) { this.shadow = acquireShadow(); this.object3D.add(this.shadow); }
    this.effects = new FoxEffectsManager(this.fox, this.bones, clip => MODULE_CUES[clip], {
      applyPendingLevel: () => this.applyPendingLevel(),
      streakEnded: () => this.setStreak({ active: false }),
    });
    this.object3D.add(this.effects.root);
    this.level = new FoxLevelScale(this.shadow ? [this.fox, this.shadow, this.effects.root] : [this.fox, this.effects.root]);
    this.level.setLevel(opts.level ?? 20, true);

    this.setReducedMotion(!!opts.reducedMotion);
    this.setInteractionEnabled(opts.interaction ?? true);
    this.setLookAtEnabled(opts.lookAt ?? true);
    this.setIdleVariationEnabled(opts.idleVariation ?? true);
    if (opts.mood) this.setMood(opts.mood);
    if (opts.effects === false) this.effects.setEnabled(false);
    if (opts.streak) this.setStreak(opts.streak);
    this.setActivity(opts.activity ?? 'idle');
    this.update(0);
  }

  // ================================================================ required API
  /** Play a clip. Base clips (idle / walk / run) change the activity; one-shots go through priorities
   *  (default priority 30 "important": above user interactions, below major LifeQuest events). */
  play(clip: FoxClipName, opts: { priority?: number; queue?: boolean } = {}): FoxPlayResult {
    if (this.disposed) return 'rejected';
    if (clip === 'streak_active') { this.setStreak({ active: true }); return this.anim.has(clip) ? 'base' : 'unavailable'; }
    if (isBaseClip(clip)) { this.setActivity(clip as FoxActivity); return 'base'; }
    if (!isOneShotClip(clip)) { console.warn(`[fox] unknown clip "${clip}"`); return 'unknown'; }
    return this.playOneShot(clip, opts.priority ?? PRIORITY.important, 'api', opts.queue ?? false);
  }

  /** Persistent mood (face). With durationS it is a temporary pulse that returns to the persistent mood. */
  setMood(mood: FoxMood, opts: { durationS?: number } = {}) {
    if (!(MOODS as readonly string[]).includes(mood)) { console.warn(`[fox] unknown mood "${mood}"`); return; }
    if (this.activity === 'resting' && !opts.durationS) { this.moodBeforeRest = mood; return; }
    this.face.setMood(mood, opts.durationS);
    this.emit({ type: 'mood', mood, durationS: opts.durationS });
  }

  /** Uniform growth: Lv1 0.80 · Lv10 0.92 · Lv20 1.00 · Lv30+ 1.10. */
  setLevel(level: number, opts: { immediate?: boolean } = {}) {
    this.level.setLevel(level, opts.immediate ?? this.reducedMotion);
    this.emit({ type: 'level', level: this.level.getLevel(), scale: this.level.getTargetScale() });
  }

  /** Persistent base behaviour. 'resting' is a documented fallback (no sleep clip in E2). */
  setActivity(activity: FoxActivity) {
    if (!(ACTIVITIES as readonly string[]).includes(activity)) { console.warn(`[fox] unknown activity "${activity}"`); return; }
    const prev = this.activity;
    this.activity = activity;
    this.anim.setBase(this.baseFor(activity));
    this.anim.setActivityTempo(activity === 'resting' ? 0.8 : 1);
    if (activity === 'resting' && prev !== 'resting') { this.moodBeforeRest = this.face.persistentMood; this.face.setMood('sleepy'); }
    if (activity !== 'resting' && prev === 'resting') this.face.setMood(this.moodBeforeRest);
    this.applyLayerFlags();
    if (prev !== activity) this.emit({ type: 'activity', activity });
  }

  setInteractionEnabled(on: boolean) { this.interaction.enabled = on; if (!on) this.interaction.update(); }
  setLookAtEnabled(on: boolean) { this.lookAtOn = on; this.applyLayerFlags(); }
  setIdleVariationEnabled(on: boolean) { this.idleVariationOn = on; this.applyLayerFlags(); }
  /** Reduced motion: no idle variation, no look-at, large-motion clips replaced by face reactions, instant growth. */
  setReducedMotion(on: boolean) { this.reducedMotion = on; this.effects.setReducedMotion(on); this.applyLayerFlags(); }

  /**
   * Streak state (Gate G1): shows the streak flame in its tier colour and, while the activity is idle,
   * uses the streak_active base loop. `days` picks the tier (3–6 orange · 7–13 blue · 14–29 purple · 30+ crimson).
   */
  setStreak(s: { active: boolean; tier?: FoxStreakTier; days?: number }) {
    const tier = s.tier && (STREAK_TIERS as readonly string[]).includes(s.tier) ? s.tier : typeof s.days === 'number' ? streakTierForDays(s.days) : this.streakTier;
    const changed = s.active !== this.streakActive || tier !== this.streakTier;
    this.streakActive = s.active; this.streakTier = tier;
    this.effects.setStreak(s.active, tier);
    this.anim.setBase(this.baseFor(this.activity));
    if (changed) this.emit({ type: 'streak', active: s.active, tier });
  }
  getStreak() { return { active: this.streakActive, tier: this.streakTier, flameVisible: this.effects.streak.flameVisible }; }
  /** All runtime effects on / off (logic cues such as the level change still run). */
  setEffectsEnabled(on: boolean) { this.effects.setEnabled(on); }
  /** Per-category effect visibility: flame · lightning · char · particles · props · text. */
  setEffectVisible(category: FxCategory, on: boolean) { this.effects.setCategoryVisible(category, on); }
  /** Clips available on this instance (core + validated modules). */
  availableClips() { return this.anim.available(); }

  pause() { if (this.paused) return; this.paused = true; this.emit({ type: 'paused', paused: true }); }
  resume() { if (!this.paused) return; this.paused = false; this.skipNextDt = true; this.emit({ type: 'paused', paused: false }); }
  get isPaused() { return this.paused; }

  /** Semantic LifeQuest event (business layer). Reactions come from the typed event registry. */
  handleEvent<E extends FoxEventName>(name: E, ...payload: undefined extends FoxEventPayloads[E] ? [FoxEventPayloads[E]?] : [FoxEventPayloads[E]]): FoxEventResult;
  handleEvent(name: string, payload?: unknown): FoxEventResult;
  handleEvent(name: string, payload?: unknown): FoxEventResult {
    if (this.disposed) return { result: 'unknown' };
    const spec = this.registry.get(name);
    if (!spec) {
      console.warn(`[fox] no reaction registered for event "${name}"`);
      const r: FoxEventResult = { result: 'unknown' }; this.emit({ type: 'event', name, result: r }); return r;
    }
    const canonical = this.registry.canonical(name)!;
    const last = this.lastEventAt.get(canonical);
    if (last !== undefined && spec.cooldownS && this.clock - last < spec.cooldownS) {
      this.coalesced.set(canonical, (this.coalesced.get(canonical) ?? 0) + 1);
      const r: FoxEventResult = { result: 'coalesced', canonical, coverage: spec.coverage }; this.emit({ type: 'event', name, result: r }); return r;
    }
    this.lastEventAt.set(canonical, this.clock);
    const steps = stepsFor(spec, this.reducedMotion, c => this.anim.has(c));
    const tag = `${canonical}#${++this.eventSeq}`;
    const hasPlay = steps.some(s => s.kind === 'play');
    if (hasPlay && this.activity === 'resting' && spec.priority >= PRIORITY.normal) this.setActivity('idle');
    let play: FoxPlayResult | undefined;
    for (const s of steps) {
      if (s.kind === 'level') {
        const lv = (payload as { level?: number } | undefined)?.level;
        if (typeof lv !== 'number') continue;
        // with the level_up clip the growth happens at its apex cue ('level.apply'); otherwise now
        if (steps.some(x => x.kind === 'play' && x.clip === 'level_up') && !this.reducedMotion) this.pendingLevel = lv; else this.setLevel(lv);
      }
      else if (s.kind === 'streak') { const d = (payload as { days?: number } | undefined)?.days; this.setStreak({ active: s.active, days: typeof d === 'number' ? d : undefined }); }
      else if (s.kind === 'activity') this.setActivity(s.activity);
      else if (s.kind === 'play') play = this.playOneShot(s.clip, spec.priority, 'event', true, tag);
      else if (s.kind === 'mood') {
        // a mood that follows a clip waits until that clip ends (clips own the face while they play)
        if (play === 'played' || play === 'queued' || play === 'merged') this.deferMood(tag, s.mood, s.durationS);
        else this.setMood(s.mood, { durationS: s.durationS });
      }
    }
    const r: FoxEventResult = { result: 'handled', canonical, coverage: spec.coverage, steps, play };
    this.emit({ type: 'event', name, result: r });
    return r;
  }

  /** Releases everything this instance owns (listeners, mixer, proxies, skeleton textures, shared-asset ref). */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    [...this.bindings].forEach(b => b.release());
    this.effects.dispose();
    this.interaction.dispose();
    this.anim.dispose();
    this.listeners.clear();
    const skeletons = new Set<Skeleton>();
    this.fox.traverse(o => { if ((o as SkinnedMesh).isSkinnedMesh) skeletons.add((o as SkinnedMesh).skeleton); });
    skeletons.forEach(s => s.dispose());
    this.object3D.removeFromParent();
    this.object3D.clear();
    if (this.shadow) { this.shadow = null; releaseShadow(); }
    this.asset.release();   // shared geometry is disposed by the loader when the last instance is gone
  }
  get isDisposed() { return this.disposed; }

  // ================================================================ host integration
  /** Bind the camera and the DOM element that receives pointer events (the canvas). */
  attachView(view: { camera: Camera; domElement: HTMLElement }) { this.camera = view.camera; this.interaction.attach(view.domElement, view.camera); }
  setCamera(camera: Camera) { this.camera = camera; this.interaction.setCamera(camera); }
  detachView() { this.interaction.detach(); this.camera = null; }

  /**
   * One binding per renderer that draws this fox. Wrap every render call with binding.render(...)
   * and call binding.release() when that renderer is destroyed: it removes the renderer's internal
   * listeners from the SHARED geometry / materials (otherwise the cached GLB keeps dead renderers alive).
   */
  bindRenderer(): FoxRenderBinding {
    const b = new FoxRenderBinding(this.object3D, sharedFxTextures);
    const release = b.release.bind(b);
    b.release = () => { release(); this.bindings.delete(b); };
    this.bindings.add(b);
    return b;
  }

  on(fn: Listener) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }

  /** Advance one frame. Call from the host render loop (dt in seconds). */
  update(dt: number) {
    if (this.disposed || this.paused) return;
    if (this.skipNextDt) { dt = 1 / 60; this.skipNextDt = false; }
    dt = Math.min(Math.max(dt, 0), 0.1);
    this.clock += dt;
    this.level.update(dt, this.reducedMotion);
    this.anim.setIdleTempo(this.idle.tempo);
    this.anim.update(dt);
    this.effects.update(dt, { tag: this.anim.currentTag, time: this.anim.currentTime });
    const shotW = this.anim.oneShotWeight;
    this.idle.update(dt, {
      idleWeight: this.anim.baseWeight('idle') + this.anim.baseWeight('streak_active'), oneShotWeight: shotW, oneShotActive: !!this.anim.currentShot || this.anim.queued.length > 0,
      hovering: this.interaction.hover !== 'none', pointerDown: this.interaction.pointerDown, tracking: this.look.tracking, idleTime: this.anim.idleTime,
    });
    if (this.camera) this.look.update(dt, { camera: this.camera, pointerInside: this.interaction.pointerInside, pointerNdc: this.interaction.pointerNdc, headControl: this.anim.control('headControl'), levelScale: this.level.getScale() });
    this.hoverLayer.update(dt, this.interaction.hover, shotW, this.reducedMotion ? 0.5 : 1);
    this.face.update(dt, this.anim.control('faceControl'));
    this.idle.applyBlink(this.face.override);
    this.interaction.update();
  }

  // ================================================================ state / diagnostics
  getState() {
    const w = this.anim.weights();
    return {
      id: this.id, level: this.level.getLevel(), scale: +this.level.getScale().toFixed(4), targetScale: this.level.getTargetScale(),
      mood: this.face.visibleMood, persistentMood: this.face.persistentMood, activity: this.activity, base: this.anim.getBase(),
      oneShot: this.anim.currentShot, oneShotWeight: +this.anim.oneShotWeight.toFixed(3), queue: this.anim.queued,
      weights: Object.fromEntries(Object.entries(w).map(([k, v]) => [k, +v.toFixed(3)])) as Record<FoxClipName, number>,
      lookWeight: +this.look.weight.toFixed(3), lookYaw: +this.look.yaw.toFixed(2), lookPitch: +this.look.pitch.toFixed(2), headDirection: this.look.headDirection(),
      hover: this.interaction.hover, pointerInside: this.interaction.pointerInside, idleVariationWeight: +this.idle.weight.toFixed(3), idleEvents: this.idle.activeEvents,
      paused: this.paused, reducedMotion: this.reducedMotion, interaction: this.interaction.enabled, lookAt: this.lookAtOn, idleVariation: this.idleVariationOn,
      groundSpeed: this.anim.groundSpeed() * this.level.getScale(),
      streak: this.getStreak(), pendingLevel: this.pendingLevel, effectsEnabled: this.effects.isEnabled,
    };
  }
  getStats() {
    const s = this.interaction.stats;
    return { asset: this.assetInfo, modules: this.assetInfo.modules, effects: this.effects.getStats(), availableClips: this.anim.available().length, picks: s.picks, pickMsAvg: s.picks ? s.pickMsTotal / s.picks : 0, pickMsMax: s.pickMsMax, taps: s.taps, ignoredTaps: s.ignoredTaps, coalescedEvents: Object.fromEntries(this.coalesced) };
  }
  /** Debug / test hooks — not part of the integration contract. */
  get debug() {
    return {
      /** Deterministic stepping for tests: advances one frame even while paused (pause() first to stop the host loop driving it). */
      step: (dt: number) => { const p = this.paused; this.paused = false; this.skipNextDt = false; this.update(dt); this.paused = p; },
      effects: this.effects, camera: this.camera, fox: this.fox, bones: this.bones, objs: this.objs, anim: this.anim, look: this.look, idle: this.idle, interaction: this.interaction, face: this.face, level: this.level };
  }

  // ================================================================ internals
  private baseFor(activity: FoxActivity): FoxBaseClip {
    if (activity === 'idle' && this.streakActive && this.anim.has('streak_active')) return 'streak_active';
    return ACTIVITY_BASE[activity];
  }
  private applyPendingLevel() {
    if (this.pendingLevel === null) return;
    const lv = this.pendingLevel; this.pendingLevel = null;
    this.setLevel(lv);
    this.emit({ type: 'level-applied', level: this.level.getLevel(), scale: this.level.getTargetScale() });
  }
  private applyLayerFlags() {
    const resting = this.activity === 'resting';
    this.look.enabled = this.lookAtOn && !this.reducedMotion && !resting;
    this.idle.enabled = this.idleVariationOn && !this.reducedMotion && !resting;
  }

  private playOneShot(clip: FoxOneShotClip, priority: number, source: 'api' | 'interaction' | 'event', queue: boolean, tag?: string): FoxPlayResult {
    if (!this.anim.has(clip)) return 'unavailable';
    if (this.reducedMotion && CLIP_META[clip].largeMotion) {
      // documented substitution: keep the emotional read (and the state change) without hops / jumps / flashes
      const face: Partial<Record<FoxOneShotClip, [FoxMood, number]>> = { tail_touch: ['surprised', 1.4], streak_lost: ['sad', 3], quest_start: ['proud', 2], achievement_unlock: ['proud', 2.5], level_up: ['proud', 2.5] };
      const [m, d] = face[clip] ?? ['happy', 2];
      this.face.setMood(m, d);
      if (clip === 'streak_lost') { this.effects.extinguishGently(); this.setStreak({ active: false }); }
      if (clip === 'level_up') this.applyPendingLevel();
      if (clip === 'streak_cheer') this.effects.flame.flareUp(1.2);
      return 'substituted';
    }
    const r = this.anim.request(clip, { priority, source, queue, tag });
    if (clip === 'level_up' && (r === 'rejected' || r === 'debounced')) this.applyPendingLevel();
    return r;
  }

  private onTap(target: 'head' | 'tail', via: string) {
    if (this.activity === 'resting') this.setActivity('idle');
    const clip: FoxOneShotClip = target === 'head' ? 'head_pet' : 'tail_touch';
    const result = this.playOneShot(clip, PRIORITY.interaction, 'interaction', false);
    this.emit({ type: 'tap', target, via, result });
  }

  private deferMood(tag: string, mood: FoxMood, durationS?: number) {
    const l = this.deferredMoods.get(tag) ?? []; l.push({ mood, durationS }); this.deferredMoods.set(tag, l);
  }
  private flushDeferredMoods(tag?: string) {
    if (!tag) return;
    const l = this.deferredMoods.get(tag); if (!l) return;
    this.deferredMoods.delete(tag);
    for (const m of l) this.setMood(m.mood, { durationS: m.durationS });
  }

  private emit(e: FoxControllerEvent) { for (const l of this.listeners) { try { l(e); } catch (err) { console.error('[fox] listener error', err); } } }
}
