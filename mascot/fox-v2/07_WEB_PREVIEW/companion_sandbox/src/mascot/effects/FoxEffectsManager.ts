import { Group, Object3D, Vector3, type Bone } from 'three';
import { type FoxClipName, type FoxStreakTier } from '../foxContract';
import { mulberry32 } from '../foxMath';
import { CharOverlay } from './CharOverlay';
import { FX_CATEGORIES, LQ, type Fx, type FxCategory, type FxContext } from './fxCore';
import {
  BeamFx, FlagProp, GlowFx, LightningFx, MedalProp, RainCloudFx, RingFx, TextFx, chargeAura, confetti, puff, sparkle, starBurst, xpOrbs, type CueArgs,
} from './fxLibrary';
import { StreakFlame } from './StreakFlame';

// Runtime effects for the Fox, driven by the cues of the animation modules (anim_spec_*.json).
// * One FX root per controller, sibling of the Fox under the companion group → same level scale.
// * Each effect belongs to the one-shot that cued it: an interrupted clip stops its effects within
//   0.25 s and its state changes are resolved (char removed, flame put out, pending level applied).
// * Effects are separate objects (FX_*), removable and invisible to picking; the Fox mesh, rig and
//   materials are never modified. Props are FX_PROP_* (temporary), not cosmetics.

export interface FxCue extends CueArgs { t: number; fx: string; note?: string }
export interface FoxEffectsHooks { applyPendingLevel(): void; streakEnded(): void }

interface Schedule { clip: FoxClipName; tag: string; cues: FxCue[]; next: number }

export class FoxEffectsManager {
  readonly root = new Group();
  readonly flame: StreakFlame;
  private layers = {} as Record<FxCategory, Group>;
  private visibleCat = Object.fromEntries(FX_CATEGORIES.map(c => [c, true])) as Record<FxCategory, boolean>;
  private active: Fx[] = [];
  private schedules: Schedule[] = [];
  private char: CharOverlay | null = null;
  private enabled = true;
  private reduced = false;
  private rnd = mulberry32(11);
  private streakTier: FoxStreakTier = 'orange';
  private streakOn = false;
  readonly log: { t: number; clip: string; fx: string }[] = [];
  private clock = 0;
  private ctx: FxContext;
  private tmp = new Vector3();

  constructor(private fox: Object3D, private bones: Record<string, Bone>, private cuesFor: (clip: FoxClipName) => FxCue[] | undefined, private hooks: FoxEffectsHooks) {
    this.root.name = 'FOX_FX_ROOT';
    for (const c of FX_CATEGORIES) { const g = new Group(); g.name = 'FX_layer_' + c; this.layers[c] = g; this.root.add(g); }
    const mgr = this; // eslint-disable-line @typescript-eslint/no-this-alias
    this.ctx = { anchor: (n, o) => mgr.anchor(n, o), layer: c => mgr.layers[c], get reducedMotion() { return mgr.reduced; }, rnd: () => mgr.rnd() };
    this.flame = new StreakFlame(this.ctx);
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
  setEnabled(on: boolean) { this.enabled = on; this.applyVisibility(); if (!on) this.active.forEach(f => f.stop(true)); }
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
    void clip;
  }
  private resolveInterrupted(s: Schedule) {
    const fired = new Set(s.cues.slice(0, s.next).map(c => c.fx));
    if (fired.has('char.on')) this.char?.fadeOut(0.25);
    if (fired.has('flame.flicker') || fired.has('lightning')) { this.flame.setFlicker(false); }
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
    this.active = this.active.filter(f => { const alive = f.update(dt); if (!alive) f.dispose(); return alive; });
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
      case 'flame.extinguish': this.flame.setFlicker(false); this.flame.extinguish(); return;
      case 'flame.flare': this.flame.flareUp(dur); return;
      case 'char.on': if (!this.char) { this.char = new CharOverlay(this.fox); this.applyVisibility(); } this.char.fadeIn(cue.fade ?? 0.12); return;
      case 'char.off': this.char?.fadeOut(cue.fade ?? 0.6); return;
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
      case 'ring.shockwave': return this.add(new RingFx(ctx, 'feet', '#FFFFFF', 0.15, 0.7, dur), s);
      case 'ring.tier': return this.add(new RingFx(ctx, 'flame', this.flame.colors().mid, 0.05, 0.3, dur, false, 'flame'), s);
      case 'lightning': return this.add(new LightningFx(ctx, this.anchor(cue.target === 'flame' ? 'flame' : 'head', new Vector3()), dur), s);
      default: console.warn(`[fox] unknown effect cue "${cue.fx}"`);
    }
  }

  getStats() {
    const byCategory: Record<string, number> = {};
    for (const f of this.active) byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
    let objects = 0; this.root.traverse(() => objects++);
    return { active: this.active.length, byCategory, pendingSchedules: this.schedules.length, rootObjects: objects, char: this.char ? +this.char.value.toFixed(3) : 0, charMeshes: this.char?.meshCount ?? 0,
      streak: this.streak, enabled: this.enabled, visibility: this.categoryVisibility() };
  }

  /** Stop every transient effect and remove the char overlay immediately (flame state unchanged). */
  clearTransient() { this.active.forEach(f => f.dispose()); this.active = []; this.schedules = []; this.char?.dispose(); this.char = null; this.timers = []; }

  dispose() { this.clearTransient(); this.flame.dispose(); this.root.removeFromParent(); }
}

