import { Vector3 } from 'three';
import type { FoxController } from '../FoxController';
import { PRIORITY } from '../FoxAnimationManager';
import { LQ } from '../effects/fxCore';
import { RadialBurstFx } from '../effects/fxLibraryG1_1';
import { AuraFx, DEFAULT_TEAM_COLORS, multiConfetti } from '../effects/fxLibraryG3';
import type { FoxChoreographyManager, FoxCoordinator } from './FoxChoreographyManager';

// Gate G3 — group effects for one Fox + symbolic teammates, or several Fox instances in one scene.
// * 'symbolic' (default, lightweight displays): ONE fox plays group_victory / group_streak_*; teammates are the fox's own
//   team markers (setGroup: count + colours). No extra Fox instance is required for the effect to read.
// * 'multi': N foxes (where the host can afford it) start the same clip in one tick (frame-locked dance: identical clip
//   time on every frame), laid out on a shallow arc; per-fox team markers are suppressed and replaced by ONE shared group
//   aura and ONE collective burst / confetti at the group centre (shared cues are de-duplicated per tick).
// * Group data are presentation data only (counts / colours); no identity, permission or scoring rule lives here.

export type GroupMode = 'symbolic' | 'multi';
export interface GroupOptions { mode?: GroupMode; members?: number; colors?: readonly string[]; spacing?: number; priority?: number }
export interface GroupReport { mode: GroupMode; participants: number; startTick: number; maxClipTimeDeltaS: number; sharedBursts: number; cancelled: number }

export class FoxGroupEffectCoordinator implements FoxCoordinator {
  readonly kind = 'group';
  private tags = new Map<FoxController, string>();
  private done = false;
  private shared = { aura: 0, burst: 0, confetti: 0 };
  readonly report: GroupReport;
  private colors: string[];

  constructor(private mgr: FoxChoreographyManager, private foxes: FoxController[], private opts: GroupOptions = {}) {
    const mode = opts.mode ?? (foxes.length > 1 ? 'multi' : 'symbolic');
    this.colors = [...(opts.colors ?? DEFAULT_TEAM_COLORS)];
    this.report = { mode, participants: foxes.length, startTick: -1, maxClipTimeDeltaS: 0, sharedBursts: 0, cancelled: 0 };
    mgr.attach(this);
  }
  get active() { return !this.done; }
  get mode() { return this.report.mode; }

  /** Shallow arc, centre fox in front; spacing scales with the largest level scale so heads never overlap. */
  layout(centerX = 0, centerZ = 0) {
    const n = this.foxes.length; if (!n) return;
    const smax = Math.max(...this.foxes.map(f => f.getState().targetScale));
    const sp = (this.opts.spacing ?? 0.82) * smax;
    this.foxes.forEach((f, i) => {
      const u = i - (n - 1) / 2; const id = this.mgr.idOf(f); if (!id) return;
      this.mgr.place(id, centerX + u * sp, centerZ - 0.12 * Math.abs(u) * sp, -0.12 * u);
    });
  }

  /** Play a group clip on every fox in the same tick. clip: 'group_victory' (default) | 'group_streak_active' | 'group_streak_lost'. */
  start(clip: 'group_victory' | 'group_streak_active' | 'group_streak_lost' = 'group_victory') {
    const multi = this.report.mode === 'multi';
    this.foxes.forEach((f, i) => {
      if (multi) { f.setGroup({ members: 1, colors: [this.colors[i % this.colors.length]] }); f.effects.setPropSuppressed('team_markers', true); }
      else f.setGroup({ members: this.opts.members ?? this.colors.length, colors: this.colors });
      f.setSharedCueHandler(multi ? (fx, local) => this.onSharedCue(f, fx, local) : null);
    });
    const ev = { group_victory: 'GROUP_VICTORY', group_streak_active: 'GROUP_STREAK_ACTIVE', group_streak_lost: 'GROUP_STREAK_LOST' }[clip];
    const res = this.mgr.startTogether(this.foxes.map(f => () => {
      const r = f.handleEvent(ev, multi ? undefined : { members: this.opts.members ?? this.colors.length, colors: this.colors });
      const tag = f.shot.tag; if (tag && f.shot.clip === clip) this.tags.set(f, tag);
      return r.play ?? r.result;
    }));
    this.report.startTick = res.tick;
    if (multi && !this.mgr.ctx.reducedMotion) this.shared.aura = 1;
    if (multi) this.mgr.addShared(new AuraFx({ ...this.mgr.ctx, anchor: (_n, o) => o.copy(this.center(new Vector3())) }, '#7FC8FF', 4.4, 1.2 + 0.5 * this.foxes.length, true));
    return res.results;
  }

  cancel(f?: FoxController) {
    for (const x of f ? [f] : [...this.tags.keys()]) { const t = this.tags.get(x); if (t) x.cancel(t); this.tags.delete(x); this.release(x); this.report.cancelled++; }
    if (!this.tags.size) this.finish();
  }
  participantRemoved(id: string) { const f = this.mgr.get(id); if (f) this.cancel(f); }

  postUpdate() {
    if (this.done) return;
    for (const [f, t] of [...this.tags]) if (f.shot.tag !== t) { this.tags.delete(f); this.release(f); }
    if (!this.tags.size) { this.finish(); return; }
    const times = [...this.tags.keys()].map(f => f.shot.time ?? 0);
    this.report.maxClipTimeDeltaS = Math.max(this.report.maxClipTimeDeltaS, Math.max(...times) - Math.min(...times));
  }

  private center(out: Vector3) {
    out.set(0, 0, 0); for (const f of this.foxes) out.add(f.object3D.position); return out.multiplyScalar(1 / Math.max(1, this.foxes.length)).setY(0.45);
  }
  private onSharedCue(_f: FoxController, fx: string, _local: Vector3): boolean {
    const tick = this.mgr.stats().tick;
    if (fx === 'burst.team') {
      if (this.shared.burst === tick) return true; this.shared.burst = tick; this.report.sharedBursts++;
      const c = this.center(new Vector3());
      this.mgr.addShared(new RadialBurstFx({ ...this.mgr.ctx, anchor: (_n, o) => o.copy(c) }, 'c', 0.9, LQ.gold, 20));
      return true;
    }
    if (fx === 'confetti.multi') {
      if (this.shared.confetti === tick) return true; this.shared.confetti = tick;
      const c = this.center(new Vector3()); const fxc = multiConfetti(this.mgr.ctx, this.colors, 50 + 25 * this.foxes.length, 2.4);
      (fxc as unknown as { points: { position: Vector3 } }).points.position.set(c.x, 0, c.z);
      this.mgr.addShared(fxc); return true;
    }
    if (fx === 'aura.team') return true;                                    // one shared group aura instead of N
    return false;
  }
  private release(f: FoxController) { f.setSharedCueHandler(null); f.effects.setPropSuppressed('team_markers', false); }
  private finish() { if (this.done) return; this.done = true; for (const f of this.foxes) this.release(f); }
  dispose() { if (this.tags.size) this.cancel(); this.finish(); }
  static readonly priority = PRIORITY.major;
}
