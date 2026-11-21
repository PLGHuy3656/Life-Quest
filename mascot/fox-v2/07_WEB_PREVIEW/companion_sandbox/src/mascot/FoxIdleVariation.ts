import { Bone, Mesh } from 'three';
import { IDLE_VARIATION as IV, type IdleEventType } from './foxContract';
import { FoxBoneOps, envelope, mulberry32, smooth } from './foxMath';

// Idle variation layer: small seeded procedural events on top of the 6 s idle clip (blink, ear
// twitch, glance, tail flick, tempo drift). Runtime logic instead of a longer clip.
// It never competes with anything important: the gate closes (with a 0.25 s fade) whenever idle is
// not the dominant base, a one-shot is playing or queued, the pointer hovers / holds the fox, or
// the companion is resting / in reduced-motion mode.

export interface FoxIdleGate { idleWeight: number; oneShotWeight: number; oneShotActive: boolean; hovering: boolean; pointerDown: boolean; tracking: boolean; idleTime: number }
interface ActiveEv { type: IdleEventType; t0: number; dur: number; side: number; double?: boolean }

export class FoxIdleVariation {
  enabled = true;
  private w = 0; private t = 0; private lastIdleTime = 0;
  private next = {} as Record<IdleEventType, number>;
  private active: ActiveEv[] = [];
  readonly log: { t: number; type: string; side?: number; double?: boolean; v?: number }[] = [];
  private rand: () => number;
  /** Idle clip time scale for the current loop (re-drawn whenever the idle clip wraps). */
  tempo = 1;

  constructor(private ops: FoxBoneOps, private B: Record<string, Bone>, private eyes: Mesh[], seed: number = IV.seedDefault) {
    this.rand = mulberry32(seed);
    for (const k of Object.keys(IV.events) as IdleEventType[]) this.schedule(k);
  }

  private rr(a: number, b: number) { return a + (b - a) * this.rand(); }
  private schedule(type: IdleEventType) { const [a, b] = IV.events[type].intervalS; this.next[type] = this.t + this.rr(a, b); }
  get weight() { return this.w; }
  get activeEvents() { return this.active.map(e => e.type); }

  update(dt: number, g: FoxIdleGate) {
    const open = this.enabled && g.idleWeight > 0.9 && !g.oneShotActive && !g.hovering && !g.pointerDown ? 1 : 0;
    this.w = smooth(this.w, open * (1 - g.oneShotWeight), 12, dt);
    this.t += dt;
    if (g.idleTime < this.lastIdleTime - 1) {   // the idle clip wrapped
      this.tempo = this.rr(IV.idleTimeScale.min, IV.idleTimeScale.max);
      this.log.push({ t: +this.t.toFixed(2), type: 'tempo', v: +this.tempo.toFixed(3) });
    }
    this.lastIdleTime = g.idleTime;
    if (!this.enabled) this.tempo = 1;
    for (const type of Object.keys(IV.events) as IdleEventType[]) {
      if (this.t < this.next[type]) continue;
      this.schedule(type);
      if (!open || this.w < 0.5) continue;                   // gate closed (or still fading in): skip, do not queue
      if (type === 'glance' && g.tracking) continue;          // the cursor already gives the fox something to look at
      const e = IV.events[type];
      const dur = Array.isArray(e.durationS) ? this.rr(e.durationS[0], e.durationS[1]) : (e.durationS as number);
      const ev: ActiveEv = { type, t0: this.t, dur, side: this.rand() < 0.5 ? -1 : 1 };
      if (type === 'blink' && this.rand() < IV.events.blink.doubleChance) ev.double = true;
      this.active.push(ev);
      this.log.push({ t: +this.t.toFixed(2), type, side: ev.side, double: !!ev.double });
      if (this.log.length > 200) this.log.splice(0, this.log.length - 200);
    }
    this.active = this.active.filter(ev => this.t - ev.t0 < ev.dur + (ev.double ? 0.3 : 0));
    const w = this.w; if (w < 1e-3) return;
    const B = this.B, ops = this.ops;
    for (const ev of this.active) {
      const u = this.t - ev.t0;
      if (ev.type === 'ear_twitch') {
        const E = IV.events.ear_twitch;
        const k = u < 0.06 ? u / 0.06 : u < 0.14 ? 1 - (1.25 * (u - 0.06)) / 0.08 : -0.25 * (1 - Math.min(1, (u - 0.14) / 0.18));
        const b = B[ev.side < 0 ? 'EAR_R_01' : 'EAR_L_01'];
        ops.addLocal(b, 'x', E.forwardDeg * k * w); ops.addLocal(b, 'y', (ev.side < 0 ? -1 : 1) * E.outDeg * k * w);
      } else if (ev.type === 'glance') {
        const E = IV.events.glance, k = envelope(u, 0.4, ev.dur - 0.9, 0.5);
        ops.addRootRot(B.NECK, ev.side * E.yawDeg * k * w, 0); ops.addLocal(B.NECK, 'y', ev.side * E.rollDeg * k * w);
      } else if (ev.type === 'tail_flick') {
        const E = IV.events.tail_flick, k = Math.sin(Math.PI * Math.min(1, u / ev.dur));
        for (let i = 1; i <= 4; i++) ops.addLocal(B['TAIL_0' + i], 'y', E.amplitudeDeg * k * w * Math.sin(u * 16 - i * 0.7) * (i === 1 ? 0.35 : 0.22) * 2.2);
      }
    }
  }

  /** Runs after the face layer: adds the idle blink unless an expression hides the eyes. */
  applyBlink(faceOverride: number) {
    if (this.w < 1e-3 || faceOverride > 0.5) return;
    const d = IV.events.blink.durationS;
    const one = (x: number) => (x < 0 || x > d ? 0 : x < d * 0.3 ? x / (d * 0.3) : x < d * 0.45 ? 1 : 1 - (x - d * 0.45) / (d * 0.55));
    let b = 0;
    for (const ev of this.active) if (ev.type === 'blink') { const u = this.t - ev.t0; b = Math.max(b, one(u), ev.double ? one(u - d - 0.05) : 0); }
    if (b <= 0) return;
    for (const m of this.eyes) {
      const D = m.morphTargetDictionary!, inf = m.morphTargetInfluences!;
      if ((inf[D.hide] ?? 0) > 0.5) continue;
      inf[D.Blink] = Math.max(inf[D.Blink], b * this.w);
    }
  }

  reset() { this.active = []; this.w = 0; this.tempo = 1; }
}

/** Hover feedback (ears perk toward the hand, tail sways) — subtle, yields to one-shots. */
export class FoxHoverLayer {
  private head = 0; private tail = 0; private t = 0;
  constructor(private ops: FoxBoneOps, private B: Record<string, Bone>) {}
  update(dt: number, hover: 'head' | 'tail' | 'none', oneShotWeight: number, intensity: number) {
    this.t += dt;
    const free = (1 - oneShotWeight) * intensity;
    this.head = smooth(this.head, hover === 'head' ? free : 0, 8, dt);
    this.tail = smooth(this.tail, hover === 'tail' ? free : 0, 8, dt);
    if (this.head > 1e-3) for (const s of ['L', 'R']) this.ops.addLocal(this.B['EAR_' + s + '_01'], 'x', 9 * this.head);
    if (this.tail > 1e-3) for (let i = 1; i <= 4; i++) this.ops.addLocal(this.B['TAIL_0' + i], 'y', 4 * this.tail * Math.sin(this.t * 11 - i * 0.6) * (i === 1 ? 0.35 : 0.22) * 4);
  }
}
