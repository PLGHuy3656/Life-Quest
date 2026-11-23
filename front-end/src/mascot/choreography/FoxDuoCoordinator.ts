import { Quaternion, Vector3, type Bone } from 'three';
import type { FoxController } from '../FoxController';
import { PRIORITY } from '../FoxAnimationManager';
import { CLIP_META } from '../foxContract';
import { FxParticles, LQ } from '../effects/fxCore';
import { RadialBurstFx } from '../effects/fxLibraryG1_1';
import { HeartPulseFx, heartsFloat } from '../effects/fxLibraryG3';
import g3Spec from '../modules/g3_challenge_social.spec.json';
import type { FoxChoreographyManager, FoxCoordinator } from './FoxChoreographyManager';

// Gate G3 — duo high-five coordination for two independent Fox controllers (or one: solo fallback).
// Contract (anim_spec_g3.json): duo_celebrate (partner on the fox's LEFT, left paw) / duo_celebrate_mirror (partner on the
// RIGHT, right paw), same timing, contact at clip time `contact.t`. Contact points are local to each Fox (fx-root space,
// measured on the posed rig: prop_anchors.duo_contact_l_head / _r_head = paw tip = ATT_HAND bone head).
//  1. layout(): the left fox (A, viewer's left) and the right fox (B) are placed so their paw tips meet at the stage
//     origin, whatever their level scales (horizontal / depth exact; height differs when the scales differ).
//  2. start(): both clips start in the same tick (frame-locked: same dt every frame afterwards).
//  3. level difference: the contact happens in the air, so the height difference of two levels is absorbed by the jump:
//     while BOTH foxes are airborne (spec window) the smaller fox jumps higher (+70 % of the gap) and the larger one a
//     little lower (−30 %), as a smooth bump that is zero at take-off and landing (feet never move on the floor);
//     the remainder is closed by rotating the high-five arm at the shoulder (≤ maxCorrectionDeg, smooth weight over the
//     contact window). The mixer rewrites the arm every frame, so nothing accumulates; both vanish outside their windows.
//  4. shared cues: one contact sparkle at the paws' midpoint, one heart / starburst above the pair (instead of two).
//  5. cancel('a' | 'b' | 'both'): a cancelled fox stops (its effects / props are cleaned by its own manager); the other
//     continues as a solo performance (local effects). Solo mode = B missing from the start.
//  6. report: start ticks, clip-time difference every frame, paw distance / vertical gap at the contact frame.

type Side = 'a' | 'b';
type V3 = [number, number, number];
const SPEC = g3Spec as unknown as { clips: Record<string, { contact?: { t: number; window: [number, number]; airborne?: [number, number] } }>; prop_anchors?: Record<string, { pos: V3 }> };
const CONTACT = SPEC.clips.duo_celebrate?.contact ?? { t: 35 / 24, window: [31 / 24, 38 / 24] as [number, number] };
/** Frames where both feet are off the floor around the contact (measured on the blend by export_glb_g3.py). */
const AIR: [number, number] = CONTACT.airborne ?? [28 / 24, 43 / 24];
const anchor = (k: string, fb: V3) => new Vector3(...(SPEC.prop_anchors?.[k]?.pos ?? fb));
/** Paw-tip contact points (fx-root local, scale 1). */
export const DUO_CONTACT_LOCAL = {
  left: anchor('duo_contact_l_head', [0.335, 0.27, 0.02]),     // fox whose partner is on its left: left paw tip
  right: anchor('duo_contact_r_head', [-0.335, 0.27, 0.02]),
};
/** Surface-to-surface: paw tips stop ~2.4 cm apart (paw mesh beyond the tip ≈ 1.2 cm each side) at level scale 1. */
export const DUO_PAW_GAP = 0.024;

export interface DuoOptions { maxCorrectionDeg?: number; priority?: number }
export interface DuoReport {
  mode: 'duo' | 'solo'; startTicks: number[]; maxClipTimeDeltaS: number; contact: { measured: boolean; tA?: number; tB?: number; distanceMm?: number; verticalMm?: number; horizontalMm?: number; depthMm?: number; correctionDegA?: number; correctionDegB?: number };
  cancelled: Side[]; sharedContact: number; sharedHeart: number; heightCompensationMm?: number;
}

const tmp = { a: new Vector3(), b: new Vector3(), s: new Vector3(), t: new Vector3(), q: new Quaternion(), pq: new Quaternion(), pqi: new Quaternion(), v: new Vector3(), w: new Vector3() };

export class FoxDuoCoordinator implements FoxCoordinator {
  readonly kind = 'duo';
  private tags: Partial<Record<Side, string>> = {};
  private running: Record<Side, boolean> = { a: false, b: false };
  private done = false;
  private started = false;
  private baseY: Record<Side, number> = { a: 0, b: 0 };
  private maxRad: number;
  private priority: number;
  readonly report: DuoReport;

  /** a = the fox on the viewer's LEFT (its partner is on its left), b = on the viewer's right; b = null → solo. */
  constructor(private mgr: FoxChoreographyManager, private a: FoxController, private b: FoxController | null, opts: DuoOptions = {}) {
    this.maxRad = ((opts.maxCorrectionDeg ?? 14) * Math.PI) / 180;
    this.priority = opts.priority ?? PRIORITY.important;
    this.report = { mode: b ? 'duo' : 'solo', startTicks: [], maxClipTimeDeltaS: 0, contact: { measured: false }, cancelled: [], sharedContact: 0, sharedHeart: 0 };
    a.duoPartnerSide = 'left'; if (b) b.duoPartnerSide = 'right';
    mgr.attach(this);
  }

  get active() { return !this.done; }
  get mode() { return this.report.mode; }

  /** Place both foxes so the paw tips meet at the stage origin (x, z) — uses each fox's TARGET level scale. */
  layout(centerX = 0, centerZ = 0) {
    const sa = this.a.getState().targetScale, idA = this.mgr.idOf(this.a)!;
    if (!this.b) { this.mgr.place(idA, centerX, centerZ); return; }
    const sb = this.b.getState().targetScale, idB = this.mgr.idOf(this.b)!;
    const cl = DUO_CONTACT_LOCAL.left, cr = DUO_CONTACT_LOCAL.right, g = DUO_PAW_GAP * (sa + sb) / 2;
    this.mgr.place(idA, centerX - sa * cl.x - g / 2, centerZ - sa * cl.z);
    this.mgr.place(idB, centerX - sb * cr.x + g / 2, centerZ - sb * cr.z);
  }

  /** Start both clips in one tick (or the solo clip). Shared cues are routed through this coordinator. */
  start() {
    this.started = true;
    this.baseY = { a: this.a.object3D.position.y, b: this.b?.object3D.position.y ?? 0 };
    const parts: [Side, FoxController][] = this.b ? [['a', this.a], ['b', this.b]] : [['a', this.a]];
    for (const [s, c] of parts) {
      c.setSharedCueHandler((fx, local, tag) => this.onSharedCue(s, fx, local, tag));
      c.setLinkTargetProvider(null);
    }
    const res = this.mgr.startTogether(parts.map(([s, c]) => () => {
      const tag = `DUO-${s}#${Math.round(performance.now())}`;
      const r = c.playDuo({ side: s === 'a' ? 'left' : 'right', priority: this.priority, tag });
      if (r === 'played') { this.tags[s] = tag; this.running[s] = true; }
      return r;
    }));
    this.report.startTicks = parts.map(() => res.tick);
    if (!this.running.a && !this.running.b) this.finish();
    return res.results;
  }

  /** Cancel one participant (the other continues solo) or both. */
  cancel(which: Side | 'both' = 'both') {
    for (const s of (which === 'both' ? ['a', 'b'] : [which]) as Side[]) {
      const c = s === 'a' ? this.a : this.b; if (!c) continue;
      if (this.running[s] && this.tags[s]) c.cancel(this.tags[s]);
      this.running[s] = false; this.report.cancelled.push(s);
      c.setSharedCueHandler(null);
    }
    if (this.report.mode === 'duo' && (this.running.a !== this.running.b)) this.report.mode = 'solo';
    if (!this.running.a && !this.running.b) this.finish();
  }

  participantRemoved(id: string) {
    if (this.mgr.idOf(this.a) === id) this.cancel('a');
    if (this.b && this.mgr.idOf(this.b) === id) this.cancel('b');
  }

  // ---------------------------------------------------------------- per frame (after the controllers updated)
  postUpdate(dt = 1 / 60) {
    if (this.done || !this.started) return;
    for (const s of ['a', 'b'] as Side[]) {
      const c = s === 'a' ? this.a : this.b; if (!c || !this.running[s]) continue;
      if (c.shot.tag !== this.tags[s]) { this.running[s] = false; c.setSharedCueHandler(null); }      // finished or interrupted by a higher priority
    }
    if (!this.running.a && !this.running.b) { this.finish(); return; }
    const both = this.running.a && this.running.b && this.b;
    const ta = this.a.shot.time ?? 0, tb = this.b?.shot.time ?? ta;
    if (both) this.report.maxClipTimeDeltaS = Math.max(this.report.maxClipTimeDeltaS, Math.abs(ta - tb));
    if (!both) { this.settleHeights(dt); return; }                          // partner gone mid-air: glide back to the floor height (no pop)
    // the correction is applied once per ADVANCED frame (a paused / frozen fox keeps its corrected pose; nothing accumulates)
    if (ta === this.lastT) return;
    this.lastT = ta;
    // airborne height compensation (different levels): smooth bump, zero at take-off / landing
    {
      const sa = this.a.scale, sb = this.b!.scale, gap = sb * DUO_CONTACT_LOCAL.right.y - sa * DUO_CONTACT_LOCAL.left.y;    // > 0: B's paw is higher
      const u = (ta - AIR[0]) / (AIR[1] - AIR[0]), bump = u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
      const up = gap > 0 ? 'a' : 'b', g = Math.abs(gap);
      this.a.object3D.position.y = this.baseY.a + bump * (up === 'a' ? 0.7 * g : -0.3 * g);
      this.b!.object3D.position.y = this.baseY.b + bump * (up === 'b' ? 0.7 * g : -0.3 * g);
      this.a.object3D.updateMatrixWorld(true); this.b!.object3D.updateMatrixWorld(true);
      this.report.heightCompensationMm = +(g * 1000).toFixed(1);
    }
    // contact correction (both foxes present): weight 0 → 1 → 0 over the contact window
    const [w0, w1] = CONTACT.window, t = ta;
    if (t < w0 - 0.25 || t > w1 + 0.25) return;
    const ramp = (x: number) => Math.min(1, Math.max(0, x));
    const w = t < CONTACT.t ? ramp((t - (w0 - 0.25)) / (CONTACT.t - (w0 - 0.25))) : ramp(((w1 + 0.25) - t) / ((w1 + 0.25) - CONTACT.t));
    const pa = this.pawWorld(this.a, 'L', tmp.a), pb = this.pawWorld(this.b!, 'R', tmp.b);
    const mid = tmp.v.copy(pa).add(pb).multiplyScalar(0.5);
    const da = this.reach(this.a, 'L', tmp.w.set(pa.x, mid.y, pa.z), w), db = this.reach(this.b!, 'R', tmp.w.set(pb.x, mid.y, pb.z), w);
    if (!this.report.contact.measured && t >= CONTACT.t) {
      const qa = this.pawWorld(this.a, 'L', new Vector3()), qb = this.pawWorld(this.b!, 'R', new Vector3());
      this.report.contact = { measured: true, tA: +ta.toFixed(4), tB: +tb.toFixed(4), distanceMm: +(qa.distanceTo(qb) * 1000).toFixed(1), verticalMm: +(Math.abs(qa.y - qb.y) * 1000).toFixed(1),
        horizontalMm: +(Math.abs(qa.x - qb.x) * 1000).toFixed(1), depthMm: +(Math.abs(qa.z - qb.z) * 1000).toFixed(1), correctionDegA: +da.toFixed(2), correctionDegB: +db.toFixed(2) };
    }
  }

  private lastT = -1;
  private pawWorld(c: FoxController, s: 'L' | 'R', out: Vector3) { const b = c.getBone(`ATT_HAND_${s}`); return b ? b.getWorldPosition(out) : out.set(0, 0, 0); }

  /** Rotate the ARM bone (shoulder) so the paw tip moves toward `target` (capped, weighted). Returns the applied angle (deg). */
  private reach(c: FoxController, s: 'L' | 'R', target: Vector3, w: number) {
    const arm = c.getBone(`ARM_${s}`) as Bone | undefined; if (!arm || w <= 0) return 0;
    const sh = arm.getWorldPosition(tmp.s), paw = this.pawWorld(c, s, tmp.t);
    const from = paw.sub(sh).normalize(), to = target.clone().sub(sh).normalize();
    const q = tmp.q.setFromUnitVectors(from, to); const ang = 2 * Math.acos(Math.min(1, Math.abs(q.w)));
    if (ang < 1e-5) return 0;
    const k = Math.min(1, this.maxRad / ang) * w;
    q.slerp(new Quaternion(), 1 - k);                                       // identity → q by k
    const parent = arm.parent!; parent.getWorldQuaternion(tmp.pq); tmp.pqi.copy(tmp.pq).invert();
    arm.quaternion.premultiply(tmp.pq).premultiply(q).premultiply(tmp.pqi);  // world-space delta, expressed in the parent space
    arm.updateMatrixWorld(true);
    return (ang * k * 180) / Math.PI;
  }

  // ---------------------------------------------------------------- shared cues
  private sharedTick = { contact: -1, heart: -1 };
  private onSharedCue(s: Side, fx: string, _local: Vector3, _tag: string): boolean {
    const both = this.running.a && this.running.b && this.b;
    if (!both) return false;                                                 // solo: the fox's own (local) effect
    const tick = this.mgr.stats().tick;
    if (fx === 'duo.contact') {
      if (this.sharedTick.contact === tick || this.report.sharedContact > 0) return true;   // the partner already spawned it this tick
      this.sharedTick.contact = tick; this.report.sharedContact++;
      const p = this.mgr.root.worldToLocal(this.pawWorld(this.a, 'L', new Vector3()).add(this.pawWorld(this.b!, 'R', new Vector3())).multiplyScalar(0.5));
      const ctx = { ...this.mgr.ctx, anchor: (_n: string, o: Vector3) => o.copy(p) };
      this.mgr.addShared(new FxParticles('particles', { count: this.mgr.ctx.reducedMotion ? 8 : 18, tex: 'spark', colors: [LQ.gold, '#FFFFFF', LQ.yellow, LQ.pink], life: [0.5, 0.9], size: [0.03, 0.06],
        spawn: (_i, q, v, r) => { q.copy(p); const a = r() * Math.PI * 2; v.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5 + 0.15, (r() - 0.5) * 0.2); }, gravity: 0.5, drag: 2.8, spin: 4, grow: 0.3, fadeIn: 0.03 },
      ctx, this.mgr.layer('particles')));
      this.mgr.addShared(new RadialBurstFx(ctx, 'contact', 0.45, LQ.yellow, 14));
      void s; return true;
    }
    if (fx === 'burst.heart') {
      if (this.report.sharedHeart > 0) return true;
      this.report.sharedHeart++;
      const ha = this.a.getBone('ATT_HAT')!.getWorldPosition(new Vector3()), hb = this.b!.getBone('ATT_HAT')!.getWorldPosition(new Vector3());
      const p = this.mgr.root.worldToLocal(ha.add(hb).multiplyScalar(0.5).add(new Vector3(0, 0.2, 0.05)));
      this.mgr.addShared(new HeartPulseFx(this.mgr.ctx, p, 1.0, '#FF6F9C', 0.22));
      this.mgr.addShared(heartsFloat(this.mgr.ctx, p, 6));
      return true;
    }
    return false;
  }

  private settleHeights(dt: number) {
    const k = 1 - Math.exp(-12 * dt);
    for (const [c, b] of [[this.a, this.baseY.a], [this.b, this.baseY.b]] as [FoxController | null, number][]) {
      if (!c) continue; c.object3D.position.y += (b - c.object3D.position.y) * k; if (Math.abs(c.object3D.position.y - b) < 1e-4) c.object3D.position.y = b; c.object3D.updateMatrixWorld(true);
    }
  }
  private restoreHeights() {
    if (!this.started) return;
    this.a.object3D.position.y = this.baseY.a; this.a.object3D.updateMatrixWorld(true);
    if (this.b) { this.b.object3D.position.y = this.baseY.b; this.b.object3D.updateMatrixWorld(true); }
  }
  private finish() {
    if (this.done) return;
    this.done = true;
    this.restoreHeights();
    this.a.setSharedCueHandler(null); this.b?.setSharedCueHandler(null);
  }
  dispose() { if (this.running.a || this.running.b) this.cancel('both'); this.finish(); }
  /** Clip length (s) — both variants share it. */
  static get durationS() { return CLIP_META.duo_celebrate.durationS; }
}
