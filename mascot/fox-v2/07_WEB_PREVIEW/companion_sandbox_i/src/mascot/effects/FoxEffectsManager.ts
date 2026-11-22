import { Group, Object3D, Vector3, type Bone } from 'three';
import { FLAME_SOCKET, type FoxClipName, type FoxStreakTier } from '../foxContract';
import { mulberry32 } from '../foxMath';
import { CharOverlay } from './CharOverlay';
import { FX_CATEGORIES, LQ, type Fx, type FxCategory, type FxContext } from './fxCore';
import {
  BeamFx, FlagProp, GlowFx, LightningFx, MedalProp, RainCloudFx, RingFx, TextFx, chargeAura, confetti, puff, sparkle, starBurst, xpOrbs, type CueArgs,
} from './fxLibrary';
import { StreakFlame } from './StreakFlame';
import {
  AlarmClockProp, AlarmRingFx, FocusParticlesFx, MorningLightFx, NotebookProp, PROP_LAYOUT, PencilProp, PillowProp, SleepGlowFx, SleepMatProp,
  SweatDropsFx, TimerProp, ZzzFx, dustStep, shakeLines, softPuff, sweat, type PropFx, type PropHideMode, type PropId, type PropShowMode,
} from './fxLibraryG2';
import {
  AbsorbPulseFx, BadgeFx, ClimaxFx, CloudFx, EnergyRingFx, QuestSymbolFx, RadialBurstFx, RibbonsFx, StrikeFx, energyAccent, softSparkle, sootBurst, xpStream,
} from './fxLibraryG1_1';
import {
  AuraFx, ChallengeTokenProp, ChatBubbleProp, CountdownProp, DEFAULT_TEAM_COLORS, EqualEmblemProp, FriendIconProp, G3_PROPS, GroupEmbersFx, HeartProp, HeartPulseFx,
  LinkLineFx, PawRingFx, PhotoFrameProp, PROP_LAYOUT_G3, TeamMarkersProp, TrophyProp, embersFade, heartsFloat, multiConfetti, speedLines, streaksConverge, symmetricSparks,
} from './fxLibraryG3';
import { VoiceBadgeFx, VoicePingFx, VoiceThinkingFx, VoiceWavesFx } from './fxLibraryI';

// Runtime effects for the Fox, driven by the cues of the animation modules (anim_spec_*.json).
// * One FX root per controller, sibling of the Fox under the companion group → same level scale.
// * Each effect belongs to the one-shot that cued it: an interrupted clip stops its effects within
//   0.25 s and its state changes are resolved (char removed, flame put out, pending level applied).
// * Effects are separate objects (FX_*), removable and invisible to picking; the Fox mesh, rig and
//   materials are never modified. Props are FX_PROP_* (temporary), not cosmetics.

export interface FxCue extends CueArgs { t: number; fx: string; note?: string; stagger?: number; scale?: number; strength?: number; from?: string; prop?: string; mode?: string; phase?: string }
/** G2: props a clip expects to be visible when it starts (it takes them over from the state). */
export interface FxClipProps { start?: readonly string[]; end?: readonly string[] }
/** G2 + Gate I persistent state effects (loops) — owned by a state, not by a one-shot. */
export const STATE_FX = ['focus.particles', 'sweat.drops', 'sleep.z', 'sleep.glow', 'alarm.ring', 'timer.watch', 'voice.waves', 'voice.thinking'] as const;
export type StateFxId = (typeof STATE_FX)[number];
export interface FoxEffectsHooks {
  applyPendingLevel(): void; streakEnded(): void;
  /** Gate G3: a duo / group coordinator may take over a shared cue ('duo.contact', 'burst.heart') — return true when handled. */
  sharedCue?(fx: string, localAnchor: Vector3, tag: string): boolean;
  /** Gate G3: where a link line should point (partner fox / teammate marker), fx-root local; undefined = default teammate side. */
  linkTarget?(out: Vector3): Vector3 | undefined;
}
/** Gate G3 group presentation data (counts / colours only — never names or avatars). */
export interface FxGroupData { members?: number; colors?: readonly string[] }

interface Schedule { clip: FoxClipName; tag: string; cues: FxCue[]; next: number }

export class FoxEffectsManager {
  readonly root = new Group();
  readonly flame: StreakFlame;
  private layers = {} as Record<FxCategory, Group>;
  private visibleCat = Object.fromEntries(FX_CATEGORIES.map(c => [c, true])) as Record<FxCategory, boolean>;
  private active: Fx[] = [];
  private schedules: Schedule[] = [];
  private char: CharOverlay | null = null;
  private storm: CloudFx | null = null;
  private badge: BadgeFx | null = null;
  private enabled = true;
  private reduced = false;
  private rnd = mulberry32(11);
  private streakTier: FoxStreakTier = 'orange';
  private streakOn = false;
  readonly log: { t: number; clip: string; fx: string }[] = [];
  private clock = 0;
  /** Effects clock (s): the time base of `log` entries (tests). */
  get clockTime() { return this.clock; }
  private ctx: FxContext;
  private tmp = new Vector3();

  // ---- G2: reusable props + persistent state effects
  private props = new Map<PropId, PropFx>();
  private stateFx = new Map<StateFxId, Fx>();
  private lowCost = false;
  private cooldownProgress = 0;
  private cooldownImpatient = false;
  // ---- G3: group presentation data, persistent group-streak link, countdown value (application data)
  private groupColors: string[] = [...DEFAULT_TEAM_COLORS].slice(0, 3);
  private groupLink: GroupEmbersFx | null = null;
  private groupLinkOn = false;
  private countdownValue: number | string | null = null;
  private suppressedProps = new Set<PropId>();

  constructor(private fox: Object3D, private bones: Record<string, Bone>, private cuesFor: (clip: FoxClipName) => FxCue[] | undefined, private hooks: FoxEffectsHooks,
    private clipProps: (clip: FoxClipName) => FxClipProps | undefined = () => undefined) {
    this.root.name = 'FOX_FX_ROOT';
    for (const c of FX_CATEGORIES) { const g = new Group(); g.name = 'FX_layer_' + c; this.layers[c] = g; this.root.add(g); }
    const mgr = this; // eslint-disable-line @typescript-eslint/no-this-alias
    this.ctx = { anchor: (n, o) => mgr.anchor(n, o), layer: c => mgr.layers[c], get reducedMotion() { return mgr.reduced; }, rnd: () => mgr.rnd() };
    // G1.1: the flame is held — attached to the ATT_HAND_L socket (bone-local palm offset, see StreakFlame)
    this.flame = new StreakFlame(this.ctx, this.bones[FLAME_SOCKET.bone], this.root);
  }

  // ---------------------------------------------------------------- anchors (fx-root local, scale-free)
  anchor(name: string, out: Vector3): Vector3 {
    const B = this.bones, w = this.tmp;
    const local = (b: Bone, off?: [number, number, number]) => { b.getWorldPosition(out); this.root.worldToLocal(out); if (off) out.add(w.set(...off)); return out; };
    switch (name) {
      case 'head': return local(B.HEAD, [0, 0.22, 0.05]);
      case 'head_top': return local(B.ATT_HAT, [0, 0.02, 0]);
      case 'mouth': return local(B.HEAD, [0, 0.13, 0.2]);
      case 'chest': return local(B.SPINE, [0, 0.06, 0.13]);
      case 'hand_r': return local(B.PAW_R, [0, 0.02, 0.03]);
      case 'paws': { const a = local(B.PAW_L).clone(); local(B.PAW_R); return out.add(a).multiplyScalar(0.5); }
      case 'feet': return out.set(0, 0.01, 0);
      case 'flame': return this.flame.worldAnchor(out);
      // G1.1 anchors
      case 'tail': return local(B.TAIL_04 ?? B.TAIL_03 ?? B.HIPS, [0, 0.02, 0]);
      case 'quest_symbol': return local(B.HEAD, [-0.34, 0.2, 0.22]);
      case 'badge': return this.badge ? this.badge.position(out) : local(B.SPINE, [0, 0.2, 0.3]);
      // G2 anchors (props sit at fixed fx-root positions measured on the posed rig)
      case 'notebook': return out.set(PROP_LAYOUT.notebook.pos[0], PROP_LAYOUT.notebook.pos[1] + 0.02, PROP_LAYOUT.notebook.pos[2]);
      case 'alarm_clock': return out.set(PROP_LAYOUT.alarm_clock.pos[0], 0.11 * PROP_LAYOUT.alarm_clock.scale, PROP_LAYOUT.alarm_clock.pos[2]);
      case 'pillow': return out.set(PROP_LAYOUT.pillow.pos[0], 0.06, PROP_LAYOUT.pillow.pos[2]);
      case 'timer': return out.set(PROP_LAYOUT.timer.pos[0], PROP_LAYOUT.timer.pos[1], PROP_LAYOUT.timer.pos[2]);
      case 'sleep_head': { const h = local(B.HEAD).clone(); local(B.ATT_HAT); return out.add(h).multiplyScalar(0.5).add(w.set(0, 0.2, 0.08)); }
      // G3 anchors
      case 'hand_l': return local(B.PAW_L, [0, 0.02, 0.03]);
      case 'notify': return out.set(...PROP_LAYOUT_G3.notify);
      case 'duo_center': return local(B.ATT_HAT, [0, 0.16, 0.05]);
      case 'teammate': return this.hooks.linkTarget?.(out) ?? out.set(...PROP_LAYOUT_G3.teammate);
      case 'challenge_token': case 'trophy': case 'photo_frame': case 'chat_bubble': case 'friend_icon': case 'heart': {
        const p = this.props.get(name as PropId); if (p && p.shown) return out.copy(p.root.position);
        const fb = { challenge_token: PROP_LAYOUT_G3.token_present, trophy: PROP_LAYOUT_G3.trophy, photo_frame: PROP_LAYOUT_G3.photo, chat_bubble: PROP_LAYOUT_G3.chat, friend_icon: PROP_LAYOUT_G3.friend_hold, heart: PROP_LAYOUT_G3.heart_paw }[name]!;
        return out.set(...fb);
      }
      default: return out.set(0, 0.5, 0);
    }
  }

  // ---------------------------------------------------------------- state
  setStreak(active: boolean, tier?: FoxStreakTier) {
    if (tier) { this.streakTier = tier; this.flame.setTier(tier, !this.streakOn); }
    this.streakOn = active;
    if (active) this.flame.ignite(); else if (!this.flame.extinguishing) this.flame.hide();
  }
  get streak() { return { active: this.streakOn, tier: this.streakTier, flameVisible: this.flame.visible, colors: this.flame.colors() }; }
  setReducedMotion(on: boolean) { this.reduced = on; }
  setEnabled(on: boolean) { this.enabled = on; this.applyVisibility(); if (!on) { this.active.forEach(f => f.stop(true)); this.stateFx.forEach(f => f.stop()); } }
  get isEnabled() { return this.enabled; }
  setCategoryVisible(cat: FxCategory, on: boolean) { this.visibleCat[cat] = on; this.applyVisibility(); }
  categoryVisibility() { return { ...this.visibleCat }; }
  private applyVisibility() {
    for (const c of FX_CATEGORIES) this.layers[c].visible = this.enabled && this.visibleCat[c];
    if (this.char) this.char.visible = this.enabled && this.visibleCat.char;
  }

  /** Gentle put-out (reduced motion / substituted streak_lost): no lightning, no char. */
  extinguishGently() { this.flame.extinguish(); this.streakOn = false; }

  // ---------------------------------------------------------------- clip coupling
  onShotStart(clip: FoxClipName, tag: string) {
    for (const id of this.clipProps(clip)?.start ?? []) { const p = this.props.get(id as PropId); if (p && p.shown) p.owner = tag; }   // G2: the clip takes its props over
    const cues = this.cuesFor(clip);
    if (!cues?.length) return;
    this.schedules.push({ clip, tag, cues: [...cues].sort((a, b) => a.t - b.t), next: 0 });
  }
  onShotEnd(clip: FoxClipName, interrupted: boolean, tag: string) {
    const s = this.schedules.find(x => x.tag === tag);
    if (s) {
      if (interrupted) this.resolveInterrupted(s);
      else while (s.next < s.cues.length) this.fire(s.cues[s.next++], s);   // last-frame cues (e.g. streak.end)
      this.schedules.splice(this.schedules.indexOf(s), 1);
    }
    if (interrupted) for (const f of this.active) if (f.owner === tag) f.stop(true);
    // G3: a clip's own props never outlive it (interrupted or not); G2 props go back to the state (reconcileProps decides)
    for (const p of this.props.values()) if (p.owner === tag) { if ((G3_PROPS as readonly string[]).includes(p.id)) this.hideProp(p.id, interrupted ? 'instant' : 'fade'); p.owner = null; }
    void clip;
  }
  private resolveInterrupted(s: Schedule) {
    const fired = new Set(s.cues.slice(0, s.next).map(c => c.fx));
    if (fired.has('char.on')) this.char?.fadeOut(0.25);
    if (fired.has('countdown.begin') && !fired.has('countdown.end')) this.hideProp('countdown', 'instant');
    if (s.clip === 'group_streak_lost') { this.flame.extinguish(); this.setGroupStreak(false); if (!fired.has('streak.end')) this.hooks.streakEnded(); }
    if (fired.has('flame.flicker') || fired.has('flame.sputter') || fired.has('lightning') || fired.has('lightning.strike')) { this.flame.setFlicker(false); }
    if (s.clip === 'streak_lost') { this.flame.extinguish(); if (!fired.has('streak.end')) this.hooks.streakEnded(); }
    if (s.clip === 'level_up' && !fired.has('level.apply')) this.hooks.applyPendingLevel();
  }

  private timers: { at: number; fn: () => void }[] = [];
  private after(delay: number, fn: () => void) { this.timers.push({ at: this.clock + delay, fn }); }

  update(dt: number, current: { tag: string | null; time: number | null }) {
    this.clock += dt;
    if (this.timers.length) { const due = this.timers.filter(t => t.at <= this.clock); this.timers = this.timers.filter(t => t.at > this.clock); due.forEach(t => t.fn()); }
    for (const s of this.schedules) {
      if (s.tag !== current.tag || current.time === null) continue;
      while (s.next < s.cues.length && s.cues[s.next].t <= current.time + 1e-6) this.fire(s.cues[s.next++], s);
    }
    this.flame.update(dt);
    if (this.char) { this.char.update(dt); if (!this.char.active) { this.char.dispose(); this.char = null; } }
    this.active = this.active.filter(f => { const alive = f.update(dt); if (!alive) { f.dispose(); if (f === this.storm) this.storm = null; if (f === this.badge) this.badge = null; } return alive; });
    // G2 props + state effects
    for (const [id, p] of this.props) { p.update(dt); if (p.done) { p.dispose(); this.props.delete(id); } }
    for (const [id, f] of this.stateFx) { if (!f.update(dt)) { f.dispose(); this.stateFx.delete(id); } }
    const tm = this.props.get('timer') as TimerProp | undefined; if (tm) { tm.setProgress(this.cooldownProgress); tm.setImpatient(this.cooldownImpatient); }
    if (this.groupLink && !this.groupLink.update(dt)) { this.groupLink.dispose(); this.groupLink = null; }
  }

  // ================================================================ G2 props & state effects
  private makeProp(id: PropId, clip?: string): PropFx {
    const L = this.layers.props;
    switch (id) {
      // G3
      case 'challenge_token': return new ChallengeTokenProp(L, clip);
      case 'countdown': { const c = new CountdownProp(L); c.setValue(this.countdownValue); return c; }
      case 'trophy': return new TrophyProp(L);
      case 'equal_emblem': return new EqualEmblemProp(L);
      case 'team_markers': return new TeamMarkersProp(L, this.groupColors);
      case 'photo_frame': return new PhotoFrameProp(L);
      case 'heart': return new HeartProp(L);
      case 'chat_bubble': return new ChatBubbleProp(L);
      case 'friend_icon': return new FriendIconProp(L);
      case 'notebook': return new NotebookProp(L);
      case 'pencil': return new PencilProp(this.bones.ATT_HAND_R);
      case 'alarm_clock': return new AlarmClockProp(L);
      case 'late_clock': return new AlarmClockProp(L, true);
      case 'pillow': return new PillowProp(L);
      case 'sleep_mat': return new SleepMatProp(L);
      case 'timer': return new TimerProp(L);
    }
  }
  showProp(id: PropId, mode: PropShowMode = 'pop', owner: string | null = null, clip?: string) {
    let p = this.props.get(id);
    if (p && !p.shown && (G3_PROPS as readonly string[]).includes(id)) { p.dispose(); this.props.delete(id); p = undefined; }   // G3 props restart fresh (layout depends on the clip)
    if (!p) { p = this.makeProp(id, clip); this.props.set(id, p); }
    p.suppressed = this.suppressedProps.has(id);
    if (!p.shown) p.show(this.reduced && mode === 'pop' ? 'fade' : mode);
    p.owner = owner;
    return p;
  }
  hideProp(id: PropId, mode: PropHideMode = 'fade') {
    const p = this.props.get(id); if (!p || !p.shown) return;
    p.hide(mode); p.owner = null;
    if (mode === 'poof' && this.enabled) this.add(softPuff(this.ctx, id === 'pencil' ? 'hand_r' : id, 5, '#FFF6E9'));
    if (mode === 'burst' && this.enabled) this.add(sparkle(this.ctx, id, 10));
  }
  propPhase(id: PropId, phase: string) { this.props.get(id)?.phase(phase); }
  /** Props currently shown (owner = one-shot tag, or null = the state). */
  propState() { return [...this.props.values()].filter(p => p.shown).map(p => ({ id: p.id, owner: p.owner, visibility: +p.visibility.toFixed(2) })); }
  getProp<T extends PropFx = PropFx>(id: PropId) { return this.props.get(id) as T | undefined; }
  /**
   * Keep exactly the props the visible state needs: unowned props that are not required fade out;
   * required props that are missing fade in (unless the state's start clip is about to show them).
   */
  reconcileProps(required: readonly string[], allowShow: boolean) {
    for (const p of this.props.values()) if (p.shown && p.owner === null && !required.includes(p.id)) this.hideProp(p.id, 'fade');
    if (allowShow) for (const id of required) { const p = this.props.get(id as PropId); if (!p || !p.shown) this.showProp(id as PropId, 'fade'); }
  }
  /** Persistent loop effects of the visible state (e.g. Z letters while asleep). */
  setStateFx(ids: readonly string[]) {
    for (const [id, f] of this.stateFx) if (!ids.includes(id)) { f.stop(); }
    if (!this.enabled) return;
    for (const id of ids as StateFxId[]) {
      const cur = this.stateFx.get(id);
      if (cur && !(cur as unknown as { stopping?: boolean }).stopping) continue;
      if (cur) { cur.dispose(); this.stateFx.delete(id); }
      const f = this.makeStateFx(id); if (f) this.stateFx.set(id, f);
    }
  }
  activeStateFx() { return [...this.stateFx.entries()].filter(([, f]) => !(f as unknown as { stopping?: boolean }).stopping).map(([id]) => id); }
  private makeStateFx(id: StateFxId): Fx | null {
    const ctx = this.ctx, low = this.lowCost || this.reduced;
    switch (id) {
      case 'focus.particles': return new FocusParticlesFx(ctx, low);
      case 'sweat.drops': return new SweatDropsFx(ctx, low);
      case 'sleep.z': return new ZzzFx(ctx, low ? 2.4 : 1.6);
      case 'sleep.glow': return low ? null : new SleepGlowFx(ctx);
      case 'alarm.ring': return new AlarmRingFx(ctx, () => this.props.get('alarm_clock') as AlarmClockProp | undefined, Infinity, low);
      case 'timer.watch': return null;           // the timer prop itself is the visual
      case 'voice.waves': return new VoiceWavesFx(ctx, low);
      case 'voice.thinking': return new VoiceThinkingFx(ctx);
    }
  }
  /** Cooldown progress as DATA (0..1) from the application; drives the timer ring + sand. */
  setCooldownProgress(p: number) { this.cooldownProgress = Math.min(1, Math.max(0, p)); }
  setCooldownImpatient(on: boolean) { this.cooldownImpatient = on; }
  get cooldown() { return { progress: this.cooldownProgress, impatient: this.cooldownImpatient, timerVisible: !!this.props.get('timer')?.shown }; }
  // ================================================================ G3 data APIs (presentation only)
  /** Team markers: member count (1–8) and display colours. Re-applied to the markers on their next appearance. */
  setGroup(d: FxGroupData) {
    const n = Math.max(1, Math.min(8, Math.round(d.members ?? d.colors?.length ?? this.groupColors.length)));
    const base = d.colors?.length ? [...d.colors] : [...DEFAULT_TEAM_COLORS];
    this.groupColors = Array.from({ length: n }, (_, i) => base[i % base.length]);
    const m = this.props.get('team_markers'); if (m && !m.shown) { m.dispose(); this.props.delete('team_markers'); }
  }
  get group() { return { members: this.groupColors.length, colors: [...this.groupColors], linked: this.groupLinkOn, markersVisible: !!this.props.get('team_markers')?.shown,
    flamesLit: (this.props.get('team_markers') as TeamMarkersProp | undefined)?.flamesLit ?? 0 }; }
  /** Persistent group-streak link: team markers with small linked flames + ember arcs into the (single) streak flame. */
  setGroupStreak(on: boolean) {
    if (on === this.groupLinkOn) return;
    this.groupLinkOn = on;
    if (on) {
      const m = this.showProp('team_markers', this.reduced ? 'fade' : 'pop', 'group-streak') as TeamMarkersProp; m.phase('flames');
      if (this.enabled) { this.groupLink?.dispose(); this.groupLink = new GroupEmbersFx(this.ctx, () => this.props.get('team_markers') as TeamMarkersProp | undefined, this.lowCost || this.reduced); }
    } else {
      this.groupLink?.stop();
      const m = this.props.get('team_markers'); if (m && m.owner === 'group-streak') { m.phase('flames_fade'); this.after(0.9, () => { if (!this.groupLinkOn && this.props.get('team_markers')?.owner === 'group-streak') this.hideProp('team_markers', 'fade'); }); }
    }
  }
  /** G3: keep a prop's logic but do not draw it (multi-fox group mode draws one shared group effect instead). */
  setPropSuppressed(id: PropId, on: boolean) { if (on) this.suppressedProps.add(id); else this.suppressedProps.delete(id); const p = this.props.get(id); if (p) p.suppressed = on; }
  /** Countdown value to display (application data, e.g. 3 / 2 / 1 / 'GO'); null = abstract pulses. The mascot never runs the countdown. */
  setCountdownValue(v: number | string | null) { this.countdownValue = v; (this.props.get('countdown') as CountdownProp | undefined)?.setValue(v); }
  get countdownState() { const c = this.props.get('countdown') as CountdownProp | undefined; return { visible: !!c?.shown, value: this.countdownValue }; }

  /** Low-cost effects for small displays: fewer particles, no light rays, no sleep glow. */
  setLowCost(on: boolean) { this.lowCost = on; }
  get isLowCost() { return this.lowCost; }
  /** Remove every G2 prop and state effect immediately (dispose / hard reset). */
  clearProps() {
    for (const p of this.props.values()) p.dispose(); this.props.clear(); for (const f of this.stateFx.values()) f.dispose(); this.stateFx.clear();
    this.groupLink?.dispose(); this.groupLink = null; this.groupLinkOn = false;
  }

  private add(fx: Fx | null, s?: Schedule) { if (!fx) return; fx.owner = s?.tag; this.active.push(fx); }

  private fire(cue: FxCue, s: Schedule) {
    this.log.push({ t: +this.clock.toFixed(3), clip: s.clip, fx: cue.fx });
    if (this.log.length > 200) this.log.splice(0, this.log.length - 200);
    const visual = this.enabled;
    const dur = cue.duration ?? 1, until = cue.until !== undefined ? cue.until - cue.t : dur;
    switch (cue.fx) {
      // ---- logic cues (always run, even with effects disabled)
      case 'level.apply': this.hooks.applyPendingLevel(); return;
      case 'streak.end': this.hooks.streakEnded(); return;
      case 'flame.loop': return;
      case 'flame.flicker': this.flame.setFlicker(true); this.after(until, () => this.flame.setFlicker(false)); return;
      case 'flame.sputter': this.flame.setFlicker(true); this.after(until, () => this.flame.setFlicker(false)); return;
      case 'flame.snuff': this.flame.setFlicker(false); this.flame.snuff(); return;
      case 'flame.extinguish': this.flame.setFlicker(false); this.flame.extinguish(); return;
      case 'flame.flare': this.flame.flareUp(dur, cue.scale ?? 1.8); return;
      case 'char.on': if (!this.char) { this.char = new CharOverlay(this.fox); this.applyVisibility(); } this.char.fadeIn(cue.fade ?? 0.12, cue.strength); return;
      case 'char.off': this.char?.fadeOut(cue.fade ?? 0.6); return;
      // ---- G3 logic cues
      case 'group.link.on': this.setGroupStreak(true); return;
      case 'group.link.off': this.setGroupStreak(false); return;
      case 'beat': return;                                                                   // synchronisation marker only
    }
    if (!visual) return;
    const ctx = this.ctx;
    switch (cue.fx) {
      case 'sparkle': return this.add(sparkle(ctx, cue.at ?? 'head', cue.count ?? 12), s);
      case 'confetti': return this.add(confetti(ctx, cue.count ?? 70, dur), s);
      case 'burst.exclaim': return this.add(new TextFx(ctx, '!', LQ.orange, '#FFFFFF', 'head_top', new Vector3(0.12, 0.08, 0.05), dur, 0.11), s);
      case 'burst.star_ring': this.add(new RingFx(ctx, 'chest', LQ.gold, 0.1, 0.55, dur, false), s); return this.add(starBurst(ctx, 'chest', 10), s);
      case 'burst.stars': return this.add(starBurst(ctx, cue.at ?? 'paws', cue.count ?? 12), s);
      case 'prop.flag': return this.add(new FlagProp(this.bones[cue.socket ?? 'ATT_HAND_R'], until), s);
      case 'prop.medal': return this.add(new MedalProp(ctx, (cue.follow ?? []).map(([t, m]) => [t - cue.t, m] as [number, string]), until), s);
      case 'cloud.rain': return this.add(new RainCloudFx(ctx, until), s);
      case 'puff.sigh': return this.add(puff(ctx, 'mouth', 'sigh', 6, 1.2), s);
      case 'puff.cough': return this.add(puff(ctx, 'mouth', 'cough', 5, 0.9), s);
      case 'smoke': return this.add(puff(ctx, 'flame', 'smoke', cue.count ?? 8, dur), s);
      case 'soot.shake': return this.add(puff(ctx, 'chest', 'soot', cue.count ?? 18, dur), s);
      case 'xp.orbs': return this.add(xpOrbs(ctx, cue.count ?? 14, cue.travel ?? 0.55), s);
      case 'glow.absorb': return this.add(new GlowFx(ctx, 'chest', LQ.gold, 0.25, dur, 2.2), s);
      case 'text.plus_xp': return this.add(new TextFx(ctx, '+XP', LQ.teal, '#FFFFFF', 'head', new Vector3(0.26, 0.05, 0.05), dur, 0.09), s);
      case 'aura.charge': return this.add(chargeAura(ctx, until), s);
      case 'beam.level': this.add(new BeamFx(ctx, dur), s); return this.add(new RingFx(ctx, 'feet', LQ.gold, 0.12, 0.5, dur * 0.8), s);
      case 'text.level_up': return this.add(new TextFx(ctx, 'LÊN CẤP!', LQ.orange, '#FFFFFF', 'head_top', new Vector3(0, 0.17, 0.05), dur, 0.11), s);
      case 'ring.shockwave': return this.add(cue.at ? new RingFx(ctx, cue.at, LQ.gold, 0.06, 0.22, dur, false) : new RingFx(ctx, 'feet', '#FFFFFF', 0.15, 0.7, dur), s);
      case 'ring.tier': return this.add(new RingFx(ctx, 'flame', this.flame.colors().mid, 0.05, 0.3, dur, false, 'flame'), s);
      case 'lightning': return this.add(new LightningFx(ctx, this.anchor(cue.target === 'flame' ? 'flame' : 'head', new Vector3()), dur), s);
      // ---- G1.1 cinematic effects (data-driven from anim_spec_g1_1.json cues)
      case 'quest.symbol': return this.add(new QuestSymbolFx(ctx, (cue.follow ?? []).map(([t, m]) => [t - cue.t, m] as [number, string]), until), s);
      case 'energy.accent': return this.add(energyAccent(ctx, cue.at ?? 'hand_r', cue.count ?? 10), s);
      case 'burst.radial': return this.add(new RadialBurstFx(ctx, cue.at ?? 'chest', dur), s);
      case 'cloud.small': return this.add(new CloudFx(ctx, 'small', until), s);
      case 'sparkle.soft': return this.add(softSparkle(ctx, cue.at ?? 'hand_r', cue.count ?? 6), s);
      case 'xp.stream': return this.add(xpStream(ctx, cue.count ?? 9, cue.travel ?? 0.95, cue.stagger ?? 0.32), s);
      case 'pulse.absorb': return this.add(new AbsorbPulseFx(ctx, cue.at ?? 'chest', dur), s);
      case 'ring.energy': return this.add(new EnergyRingFx(ctx, until), s);
      case 'ribbons.rise': return this.add(new RibbonsFx(ctx, dur), s);
      case 'flash.climax': return this.add(new ClimaxFx(ctx, cue.at ?? 'chest', dur), s);
      case 'badge': { const b = new BadgeFx(ctx, (cue.follow ?? []).map(([t, m]) => [t - cue.t, m] as [number, string]), until); this.badge = b; return this.add(b, s); }
      case 'badge.shine': this.badge?.shine(dur); return;
      case 'cloud.storm': {
        // above the flame paw (beside the head), so the bolt falls clear of the face
        let at: Vector3 | undefined;
        if (cue.at === 'flame') { const f = this.anchor('flame', new Vector3()), h = this.anchor('head_top', new Vector3()); at = new Vector3(f.x + 0.03, Math.max(h.y + 0.14, f.y + 0.42), f.z + 0.02); }
        const c = new CloudFx(ctx, 'storm', until, at); this.storm = c; return this.add(c, s);
      }
      case 'lightning.strike': {
        const to = this.anchor(cue.target ?? 'flame', new Vector3());
        const from = this.storm ? this.storm.bottom(new Vector3()) : to.clone().add(new Vector3(0.1, 0.9, 0));
        return this.add(new StrikeFx(ctx, from, to, dur), s);
      }
      case 'soot.burst': return this.add(sootBurst(ctx, cue.at ?? 'flame', cue.count ?? 14), s);
      // ---- G2 daily-life cues (anim_spec_g2.json)
      case 'prop.show': {
        const p = this.showProp(cue.prop as PropId, (cue.mode as PropShowMode) ?? 'pop', s.tag, s.clip);
        if (cue.prop === 'team_markers' && s.clip === 'group_streak_lost') p.phase('flames');     // the linked flames are lit when the loss begins
        return;
      }
      case 'prop.hide': { this.hideProp(cue.prop as PropId, (cue.mode as PropHideMode) ?? 'fade'); return; }
      case 'prop.phase': { this.propPhase(cue.prop as PropId, cue.phase ?? ''); return; }
      case 'alarm.ring': return this.add(new AlarmRingFx(ctx, () => this.props.get('alarm_clock') as AlarmClockProp | undefined, until, this.lowCost || this.reduced), s);
      case 'alarm.stop': { (this.props.get('alarm_clock') as AlarmClockProp | undefined)?.stopHit(); this.stateFx.get('alarm.ring')?.stop(); return; }
      case 'clock.late': { const c = this.showProp('late_clock', 'pop', s.tag) as AlarmClockProp; c.setRacing(true); this.after(until, () => this.hideProp('late_clock', 'poof')); return; }
      case 'light.morning': return this.add(new MorningLightFx(ctx, dur, this.lowCost), s);
      case 'puff.yawn': return this.add(puff(ctx, 'mouth', 'sigh', 5, dur), s);
      case 'puff.pant': return this.add(puff(ctx, 'mouth', 'sigh', 4, dur), s);
      case 'puff.soft': { (this.props.get('pillow') as PillowProp | undefined)?.plop(); return this.add(softPuff(ctx, cue.at ?? 'pillow', cue.count ?? 6), s); }
      case 'sweat.burst': return this.add(sweat(ctx, this.anchor(cue.at ?? 'head', new Vector3()).add(new Vector3(0, 0.02, 0.06)), cue.count ?? 4), s);
      case 'sweat.flick': return this.add(sweat(ctx, this.anchor(cue.at ?? 'hand_r', new Vector3()), cue.count ?? 4, -1), s);
      case 'dust.step': return this.add(dustStep(ctx, cue.count ?? 6), s);
      case 'shake.lines': return this.add(shakeLines(ctx), s);
      case 'note.giggle': return this.add(new TextFx(ctx, 'hì hì', LQ.pink, '#FFFFFF', 'mouth', new Vector3(-0.2, 0.12, 0.05), 1.2, 0.07), s);
      case 'timer.ding': { (this.props.get('timer') as TimerProp | undefined)?.ding(); return; }
      case 'sleep.z': { const z = this.stateFx.get('sleep.z') as ZzzFx | undefined; if (z) z.puffNow(); else { const one = new ZzzFx(ctx, 99); one.puffNow(); one.stop(); this.add(one, s); } return; }   // a single Z that ends by itself
      // ---- G3 challenge / group / social cues (anim_spec_g3.json)
      case 'ring.paw': return this.add(new PawRingFx(ctx, cue.at ?? 'hand_l', until), s);
      case 'pulse.out': return this.add(new RingFx(ctx, cue.at ?? 'chest', LQ.orange, 0.05, 0.3, dur, false), s);
      case 'streaks.converge': return this.add(streaksConverge(ctx, dur), s);
      case 'aura.ready': return this.add(new AuraFx(ctx, '#FF9A3C', until, 0.9, false), s);
      case 'aura.victory': return this.add(new AuraFx(ctx, LQ.gold, until, 1.15, true), s);
      case 'aura.team': if (this.hooks.sharedCue?.('aura.team', this.anchor('chest', new Vector3()), s.tag)) return; return this.add(new AuraFx(ctx, '#7FC8FF', until, 1.1, true), s);
      case 'countdown.begin': { this.showProp('countdown', 'pop', s.tag, s.clip); return; }
      case 'countdown.pulse': { const c = (this.props.get('countdown') as CountdownProp | undefined) ?? (this.showProp('countdown', 'pop', s.tag, s.clip) as CountdownProp); c.pulseStep((cue as { step?: number }).step ?? 0); return; }
      case 'countdown.end': { this.hideProp('countdown', 'burst'); return; }
      case 'ring.ground': return this.add(new RingFx(ctx, 'feet', LQ.orange, 0.12, 0.6, dur), s);
      case 'speed.lines': return this.add(speedLines(ctx, dur), s);
      case 'flash.start': return this.add(new ClimaxFx(ctx, 'chest', dur), s);
      case 'starburst.gold': this.add(new RadialBurstFx(ctx, cue.at ?? 'chest', dur, LQ.gold, 18), s); return this.add(starBurst(ctx, cue.at ?? 'chest', 14), s);
      case 'dust.small': return this.add(dustStep(ctx, cue.count ?? 5), s);
      case 'spark.motivation': this.add(energyAccent(ctx, cue.at ?? 'hand_r', 10), s); return this.add(softSparkle(ctx, cue.at ?? 'hand_r', 6), s);
      case 'sparks.symmetric': { for (const f of symmetricSparks(ctx)) this.add(f, s); return; }
      case 'duo.contact': {
        const p = this.anchor(cue.at ?? 'hand_l', new Vector3());
        if (this.hooks.sharedCue?.('duo.contact', p, s.tag)) return;
        this.add(sparkle(ctx, cue.at ?? 'hand_l', 14), s); return this.add(new RadialBurstFx(ctx, cue.at ?? 'hand_l', 0.4, LQ.yellow, 12), s);
      }
      case 'burst.heart': {
        const p = this.anchor('duo_center', new Vector3());
        if (this.hooks.sharedCue?.('burst.heart', p, s.tag)) return;
        this.add(new HeartPulseFx(ctx, p, 0.9, '#FF6F9C', 0.16), s); return this.add(heartsFloat(ctx, p, 5), s);
      }
      case 'confetti.multi': if (this.hooks.sharedCue?.('confetti.multi', this.anchor('chest', new Vector3()), s.tag)) return; return this.add(multiConfetti(ctx, this.groupColors, cue.count ?? 70, dur), s);
      case 'team.orbit': { const m = this.props.get('team_markers'); m?.phase('orbit'); this.after(until, () => this.props.get('team_markers')?.phase('still')); return; }
      case 'burst.team': if (this.hooks.sharedCue?.('burst.team', this.anchor('chest', new Vector3()), s.tag)) return; this.add(new RadialBurstFx(ctx, 'chest', dur, LQ.gold, 18), s); return this.add(multiConfetti(ctx, this.groupColors, 24, 1.2), s);
      case 'glow.warm': return this.add(new GlowFx(ctx, cue.at ?? 'chest', '#FFC9A3', 0.3, until, 1.6), s);
      case 'hearts.float': return this.add(heartsFloat(ctx, this.anchor(cue.at ?? 'chest', new Vector3()), cue.count ?? 4), s);
      case 'link.line': return this.add(new LinkLineFx(ctx, this.anchor(cue.at ?? 'hand_r', new Vector3()), this.anchor('teammate', new Vector3()), until), s);
      case 'group.flames.fade': { const m = this.props.get('team_markers') as TeamMarkersProp | undefined; if (m) { m.setFadeStagger(cue.stagger ?? 0.25); m.phase('flames_fade'); } return; }
      case 'group.ring.break': { this.props.get('team_markers')?.phase('break'); return this.add(new RadialBurstFx(ctx, 'feet', dur, '#FFE2B0', 12), s); }
      case 'embers.fade': return this.add(embersFade(ctx, this.anchor(cue.at ?? 'flame', new Vector3()), cue.count ?? 6, dur), s);
      case 'sparkle.greet': return this.add(softSparkle(ctx, cue.at ?? 'notify', cue.count ?? 6), s);
      case 'pulse.heart': return this.add(new HeartPulseFx(ctx, this.anchor(cue.at ?? 'notify', new Vector3()), dur), s);
      case 'highlight': return this.add(new RingFx(ctx, cue.at ?? 'chest', LQ.mint, 0.05, 0.2, dur, false), s);
      case 'pulse.gentle': return this.add(new RingFx(ctx, cue.at ?? 'chest', '#FFD9C2', 0.06, 0.32, dur, false), s);
      case 'sparkle.return': return this.add(softSparkle(ctx, cue.at ?? 'chest', cue.count ?? 6), s);
      // ---- Gate I voice assistant cues (anim_spec_i.json)
      case 'voice.ping': return this.add(new VoicePingFx(ctx, cue.at ?? 'head_top', dur), s);
      case 'voice.idea': return this.add(new VoiceBadgeFx(ctx, 'idea', cue.at ?? 'head_top', dur), s);
      case 'voice.check': return this.add(new VoiceBadgeFx(ctx, 'check', cue.at ?? 'notebook', dur), s);
      case 'voice.retry_cue': return this.add(new VoiceBadgeFx(ctx, 'retry', cue.at ?? 'head_top', dur), s);
      default: console.warn(`[fox] unknown effect cue "${cue.fx}"`);
    }
  }

  getStats() {
    const byCategory: Record<string, number> = {};
    for (const f of this.active) byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
    let objects = 0; this.root.traverse(() => objects++);
    return { active: this.active.length, byCategory, pendingSchedules: this.schedules.length, rootObjects: objects, char: this.char ? +this.char.value.toFixed(3) : 0, charMeshes: this.char?.meshCount ?? 0,
      streak: this.streak, enabled: this.enabled, visibility: this.categoryVisibility(),
      props: this.propState(), stateFx: this.activeStateFx(), cooldown: this.cooldown, lowCost: this.lowCost, group: this.group, groupEmbers: !!this.groupLink, countdown: this.countdownState };
  }

  /** Stop every transient effect and remove the char overlay immediately (flame state unchanged). */
  clearTransient() { this.active.forEach(f => f.dispose()); this.active = []; this.schedules = []; this.char?.dispose(); this.char = null; this.timers = []; this.storm = null; this.badge = null; this.flame.setFlicker(false); }

  dispose() { this.clearTransient(); this.clearProps(); this.flame.dispose(); this.root.removeFromParent(); }
  /** G3: transient one-shot effects only (used by the choreography layer when a participant is cancelled). */
  stopOwned(tag: string) { for (const f of this.active) if (f.owner === tag) f.stop(true); }
}

