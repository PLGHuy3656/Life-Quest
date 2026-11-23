import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, DoubleSide, Group, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, NormalBlending, PlaneGeometry,
  SRGBColorSpace, ShaderMaterial, SphereGeometry, Sprite, SpriteMaterial, Vector3, type Camera, type Texture,
} from 'three';
import { FxParticles, LQ, acquireTex, easeOutBack, releaseTex, smooth01, type Fx, type FxCategory, type FxContext } from './fxCore';
import { LightningFx } from './fxLibrary';

// Gate G1.1 effect library (cinematic polish). Same contract as fxLibrary.ts: every effect owns its
// geometry / materials / textures and disposes them when it ends; positions are fx-root space
// (follows the level scale); nothing touches the Fox. Draw calls are kept low: one mesh per effect
// where possible (merged quads), one Points per particle burst.

const v3 = (x = 0, y = 0, z = 0) => new Vector3(x, y, z);

abstract class TimedFx implements Fx {
  owner?: string;
  protected t = 0; protected fade = 1; protected stopping = false;
  constructor(readonly category: FxCategory, protected duration: number) {}
  protected abstract frame(t: number, u: number, alpha: number): void;
  update(dt: number) {
    this.t += dt;
    if (this.stopping) this.fade = Math.max(0, this.fade - dt / 0.25);
    const u = this.t / this.duration;
    if (u >= 1 || this.fade <= 0) return false;
    this.frame(this.t, u, this.fade);
    return true;
  }
  stop() { this.stopping = true; }
  abstract dispose(): void;
}

function canvasTex(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void): Texture {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d')!;
  draw(g, size); const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}

/** Billboard helper: rotate a mesh so its +Z faces the camera (full billboard). */
function faceCamera(m: Mesh) {
  m.onBeforeRender = (_r, _s, cam: Camera) => { m.quaternion.copy(cam.quaternion); if (m.parent) { const pq = m.parent.getWorldQuaternion(m.quaternion.clone()).invert(); m.quaternion.premultiply(pq); } };
}

// ------------------------------------------------------------------ quest
/** Floating quest symbol: appear (pop + bob) → activate (pulse when pointed at) → fly (along the pointing line). */
export class QuestSymbolFx implements Fx {
  readonly category: FxCategory = 'props'; owner?: string;
  private m: Mesh; private tex: Texture; private mat: MeshBasicMaterial; private glow: Sprite; private gMat: SpriteMaterial;
  private t = 0; private ending = false; private s = 0; private base: Vector3; private trail: FxParticles | null = null;
  constructor(private ctx: FxContext, private phases: [number, string][], private until: number) {
    this.tex = canvasTex(128, (g, S) => {
      g.translate(S / 2, S / 2); g.rotate(Math.PI / 4);
      const r = 40; g.fillStyle = LQ.teal; g.strokeStyle = '#FFFFFF'; g.lineWidth = 9;
      g.beginPath(); g.roundRect(-r, -r, 2 * r, 2 * r, 16); g.fill(); g.stroke(); g.rotate(-Math.PI / 4);
      g.fillStyle = LQ.yellow; g.beginPath();                                        // compass star
      for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 4, rr = i % 2 ? 9 : 30; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      g.closePath(); g.fill(); g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(0, 0, 6, 0, Math.PI * 2); g.fill();
    });
    this.mat = new MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false, side: DoubleSide });
    this.m = new Mesh(new PlaneGeometry(0.17, 0.17), this.mat); this.m.renderOrder = 24; this.m.name = 'FX_PROP_quest_symbol'; faceCamera(this.m);
    this.gMat = new SpriteMaterial({ map: acquireTex('soft'), color: new Color(LQ.mint), transparent: true, depthWrite: false, opacity: 0 });
    this.glow = new Sprite(this.gMat); this.glow.renderOrder = 23;
    this.base = ctx.anchor('quest_symbol', v3());
    this.m.position.copy(this.base); this.glow.position.copy(this.base); this.m.scale.setScalar(0.001);
    ctx.layer('props').add(this.glow, this.m);
  }
  private phase(): [string, number] { let p = 'appear', t0 = 0; for (const [t, n] of this.phases) if (this.t >= t) { p = n; t0 = t; } return [p, this.t - t0]; }
  get position() { return this.m.position; }
  update(dt: number) {
    this.t += dt; if (this.t > this.until) this.ending = true;
    const [ph, pt] = this.phase(), rm = this.ctx.reducedMotion;
    this.s = this.ending ? Math.max(0, this.s - dt / 0.2) : Math.min(1, this.s + dt / 0.3);
    let k = easeOutBack(this.s), glow = 0.25;
    const bob = rm ? 0 : Math.sin(this.t * 4.2) * 0.012;
    if (ph === 'appear') this.m.position.set(this.base.x, this.base.y + bob, this.base.z);
    if (ph === 'activate') { const pulse = Math.max(0, 1 - pt / 0.35); k *= 1 + 0.35 * pulse; glow = 0.25 + 0.6 * pulse; this.m.position.set(this.base.x, this.base.y + bob, this.base.z); }
    if (ph === 'fly') {
      const u = smooth01(pt / 0.45);
      this.m.position.set(this.base.x - 0.55 * u, this.base.y + 0.22 * u, this.base.z + 0.45 * u);   // along the pointing line (fox's right-front, up)
      k *= 1 - 0.65 * u; this.mat.opacity = 1 - smooth01((pt - 0.3) / 0.2); glow = 0.4 * (1 - u);
      if (!this.trail && !rm) {
        const from = this.m.position.clone();
        this.trail = new FxParticles('particles', { count: 10, tex: 'spark', colors: [LQ.mint, '#FFFFFF', LQ.yellow], life: [0.3, 0.55], size: [0.02, 0.035], delay: [0, 0.4],
          spawn: () => {}, path: (i, uu, out) => { const e = Math.min(1, (i / 10) * 0.9 + uu * 0.15); out.set(from.x - 0.55 * e, from.y + 0.22 * e + 0.02 * Math.sin(i), from.z + 0.45 * e); } },
        this.ctx, this.ctx.layer('particles'));
      }
    }
    this.m.scale.setScalar(Math.max(0.001, k));
    this.glow.position.copy(this.m.position); this.glow.scale.setScalar(0.26 * k); this.gMat.opacity = glow * this.s;
    if (this.trail && !this.trail.update(dt)) { this.trail.dispose(); this.trail = null; }
    return !(this.ending && this.s <= 0 && !this.trail);
  }
  stop() { this.ending = true; this.trail?.stop(); }
  dispose() { this.trail?.dispose(); this.m.removeFromParent(); this.glow.removeFromParent(); this.m.geometry.dispose(); this.mat.dispose(); this.tex.dispose(); this.gMat.dispose(); releaseTex('soft'); }
}

/** Energy accent: a short swirl of sparks gathering on a point (pointing paw). */
export function energyAccent(ctx: FxContext, at: string, count = 10): Fx {
  const c = ctx.anchor(at, v3());
  return new FxParticles('particles', { count, tex: 'spark', colors: [LQ.mint, '#FFFFFF', LQ.yellow], life: [0.35, 0.55], size: [0.022, 0.04], delay: [0, 0.15],
    spawn: () => {}, path: (i, u, out) => { const a = i * 2.4 + u * 5, r = 0.09 * (1 - u); out.set(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r * 0.7 + 0.02 * u, c.z + 0.02); }, fadeIn: 0.15 },
  ctx, ctx.layer('particles'));
}

/** Cartoon radial burst (speed lines) — one merged mesh, billboarded. */
export class RadialBurstFx extends TimedFx {
  private m: Mesh; private mat: MeshBasicMaterial;
  constructor(ctx: FxContext, at: string, duration: number, color = LQ.yellow, n = 14) {
    super('particles', duration);
    const pos: number[] = [], idx: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (i % 2) * 0.08, c = Math.cos(a), s = Math.sin(a), w = i % 2 ? 0.012 : 0.02, r0 = 0.0, r1 = i % 2 ? 0.75 : 1;
      const b = pos.length / 3;
      pos.push(c * r0 - s * w, s * r0 + c * w, 0, c * r1 - s * w * 0.2, s * r1 + c * w * 0.2, 0, c * r1 + s * w * 0.2, s * r1 - c * w * 0.2, 0, c * r0 + s * w, s * r0 - c * w, 0);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3)); g.setIndex(idx);
    this.mat = new MeshBasicMaterial({ color: new Color(color), transparent: true, depthWrite: false, side: DoubleSide });
    this.m = new Mesh(g, this.mat); this.m.renderOrder = 19; this.m.name = 'FX_radial_burst'; faceCamera(this.m);
    this.m.position.copy(ctx.anchor(at, v3())); ctx.layer('particles').add(this.m);
  }
  protected frame(_t: number, u: number, a: number) {
    const e = 1 - Math.pow(1 - u, 3);
    this.m.scale.setScalar(0.12 + 0.42 * e);
    this.mat.opacity = a * (1 - smooth01((u - 0.35) / 0.65));
  }
  dispose() { this.m.removeFromParent(); this.m.geometry.dispose(); this.mat.dispose(); }
}

// ------------------------------------------------------------------ clouds
type CloudKind = 'small' | 'storm';
/** Stylised cloud above the head. small: light grey, fades on its own (quest_failed).
 *  storm: dark, forms puff by puff, inner flickers before the strike, exposes its bottom as the bolt origin. */
export class CloudFx implements Fx {
  readonly category: FxCategory = 'props'; owner?: string;
  private g = new Group(); private mat: MeshBasicMaterial; private geo: SphereGeometry; private puffs: { x: number; y: number; r: number }[] = [];
  private inst: InstancedMesh; private m4 = new Matrix4();
  private inner?: Sprite; private iMat?: SpriteMaterial; private drops: FxParticles | null = null;
  private t = 0; private fade = 0; private ending = false; private dropT = 0.4;
  constructor(private ctx: FxContext, private kind: CloudKind, private until: number, at?: Vector3) {
    const storm = kind === 'storm';
    // opaque puffs (depth-written) so overlapping spheres never show through each other; the cloud fades by shrinking
    this.mat = new MeshBasicMaterial({ color: new Color(storm ? '#5E6672' : '#C7CED6'), transparent: true, opacity: 1, depthWrite: true });
    this.geo = new SphereGeometry(1, 14, 10);
    const P = storm ? [[-0.11, 0, 0.07], [-0.04, 0.03, 0.085], [0.04, 0.035, 0.09], [0.11, 0.005, 0.07], [0.0, -0.025, 0.07], [-0.07, -0.03, 0.06], [0.07, -0.03, 0.06]]
      : [[-0.05, 0, 0.045], [0.01, 0.015, 0.055], [0.06, 0, 0.04], [0.005, -0.015, 0.04]];
    // all puffs in one InstancedMesh (one draw call)
    P.forEach(([x, y, r]) => this.puffs.push({ x, y, r }));
    this.inst = new InstancedMesh(this.geo, this.mat, P.length); this.inst.renderOrder = 12; this.inst.frustumCulled = false; this.g.add(this.inst);
    if (storm) {
      this.iMat = new SpriteMaterial({ map: acquireTex('soft'), color: new Color('#DDF1FF'), transparent: true, depthWrite: false, opacity: 0, blending: AdditiveBlending });
      this.inner = new Sprite(this.iMat); this.inner.scale.setScalar(0.22); this.inner.renderOrder = 13; this.g.add(this.inner);
    }
    if (at) this.g.position.copy(at); else this.g.position.copy(ctx.anchor('head_top', v3())).add(v3(0.03, storm ? 0.26 : 0.2, 0.04));
    this.g.name = storm ? 'FX_storm_cloud' : 'FX_small_cloud';
    ctx.layer('props').add(this.g);
  }
  /** fx-root point under the cloud (lightning origin). */
  bottom(out: Vector3) { return out.copy(this.g.position).add(v3(0, -0.06, 0.02)); }
  update(dt: number) {
    this.t += dt; if (this.t > this.until) this.ending = true;
    const storm = this.kind === 'storm';
    this.fade = this.ending ? Math.max(0, this.fade - dt / (storm ? 0.5 : 0.7)) : Math.min(1, this.fade + dt / 0.3);
    this.mat.opacity = Math.min(1, this.fade * 3);
    const life = storm ? 1 : 1 - 0.35 * smooth01((this.t - 0.6) / Math.max(0.1, this.until - 0.6));   // the small cloud shrinks away on its own
    this.puffs.forEach((pf, i) => {                                             // puffs appear one after another (cloud forming)
      const born = easeOutBack(Math.min(1, Math.max(0, (this.t - i * (storm ? 0.07 : 0.05)) / 0.3)));
      const k = Math.max(0.0001, pf.r * born * life * smooth01(this.fade * 1.4) * (1 + 0.04 * Math.sin(this.t * 3 + i)));
      this.m4.makeScale(k, k, k).setPosition(pf.x, pf.y, 0); this.inst.setMatrixAt(i, this.m4);
    });
    this.inst.instanceMatrix.needsUpdate = true;
    this.g.position.x += Math.sin(this.t * 1.7) * 0.0004;
    if (this.inner && this.iMat) this.iMat.opacity = this.fade * (this.t > 0.35 && !this.ending ? Math.max(0, Math.sin(this.t * 23) * Math.sin(this.t * 5.1)) * 0.55 : 0);
    if (!storm && !this.ending && !this.ctx.reducedMotion) {                    // a few slow drops, then nothing
      this.dropT -= dt;
      if (this.dropT <= 0 && this.t < this.until - 0.4 && !this.drops) {
        this.dropT = 9; const o = this.g.position.clone();
        this.drops = new FxParticles('particles', { count: 4, tex: 'drop', colors: ['#9CC6EA'], life: [0.35, 0.45], size: [0.016, 0.02], delay: [0, 0.8],
          spawn: (_i, p, v, r) => { p.copy(o).add(v3((r() - 0.5) * 0.08, -0.03, 0)); v.set(0, -0.7, 0); } }, this.ctx, this.ctx.layer('props'));
      }
    }
    if (this.drops && !this.drops.update(dt)) { this.drops.dispose(); this.drops = null; }
    return !(this.ending && this.fade <= 0 && !this.drops);
  }
  stop() { this.ending = true; this.drops?.stop(); }
  dispose() { this.drops?.dispose(); this.g.removeFromParent(); this.geo.dispose(); this.mat.dispose(); if (this.iMat) { this.iMat.dispose(); releaseTex('soft'); } }
}

/** Lightning from a given origin (storm cloud) to the target (flame in the paw) + impact star. */
export class StrikeFx implements Fx {
  readonly category: FxCategory = 'lightning'; owner?: string;
  private bolt: LightningFx; private star: Sprite; private sMat: SpriteMaterial; private t = 0;
  constructor(private ctx: FxContext, from: Vector3, to: Vector3, duration: number) {
    this.bolt = new LightningFx(ctx, to, duration, from);
    this.sMat = new SpriteMaterial({ map: acquireTex('spark'), color: new Color('#FFF6B0'), transparent: true, depthWrite: false, opacity: 0 });
    this.star = new Sprite(this.sMat); this.star.position.copy(to); this.star.renderOrder = 32; ctx.layer('lightning').add(this.star);
  }
  update(dt: number) {
    this.t += dt; const alive = this.bolt.update(dt);
    const u = this.t / 0.3; this.sMat.opacity = this.ctx.reducedMotion ? 0 : Math.max(0, 1 - u);
    this.star.scale.setScalar(0.1 + 0.22 * Math.min(1, u * 2)); this.star.material.rotation = this.t * 4;
    return alive || this.t < 0.3;
  }
  stop() { this.bolt.stop(); }
  dispose() { this.bolt.dispose(); this.star.removeFromParent(); this.sMat.dispose(); releaseTex('spark'); }
}

/** Soot burst at the paw (cartoon: dark puffs + specks thrown outward, quickly gone). */
export function sootBurst(ctx: FxContext, at: string, count = 14): Fx {
  const o = ctx.anchor(at, v3());
  return new FxParticles('particles', { count, tex: 'soft', colors: ['#2E2420', '#46382F', '#5A4C43'], life: [0.35, 0.7], size: [0.025, 0.05],
    spawn: (_i, p, v, r) => { const a = r() * Math.PI * 2; p.copy(o); v.set(Math.cos(a) * (0.35 + r() * 0.35), 0.15 + r() * 0.45, Math.sin(a) * 0.25); },
    gravity: 0.6, drag: 3.5, grow: 1.8, fadeIn: 0.02 }, ctx, ctx.layer('particles'));
}

// ------------------------------------------------------------------ rewards
/** XP stream: orbs on curved cubic paths from the fox's upper left into the chest, each with a short
 *  trail (lagged copies). One Points draw call. The fox's head in receive_xp follows this timeline. */
export function xpStream(ctx: FxContext, count: number, travel: number, stagger: number, onArrive?: () => void): Fx {
  const chest = ctx.anchor('chest', v3()), head = ctx.anchor('head', v3());
  const TRAIL = 4, P0: Vector3[] = [], P1: Vector3[] = [], P2: Vector3[] = [], D: number[] = [];
  for (let i = 0; i < count; i++) {
    const r = ctx.rnd, k = i / Math.max(1, count - 1);
    P0.push(v3(0.42 + 0.22 * r(), head.y + 0.18 + 0.16 * r(), 0.12 + 0.2 * r()));                       // upper left of the fox (+x)
    P1.push(v3(0.62 + 0.15 * r(), head.y - 0.05 + 0.1 * r(), 0.45 + 0.15 * r()));                       // swing out and forward
    P2.push(v3(0.12 - 0.3 * k + 0.08 * r(), chest.y + 0.1 + 0.05 * r(), 0.42));                          // sweep across in front
    D.push(k * stagger);
  }
  const n = count * TRAIL, tmp = v3();
  return new FxParticles('particles', { count: n, tex: 'soft', colors: [LQ.gold, '#FFE9A6', LQ.mint], additive: true, life: [travel, travel], size: [0.02, 0.02],
    spawn: () => {}, delay: [0, 0],
    path: (j: number, u: number, out: Vector3) => {
      const i = Math.floor(j / TRAIL), lag = (j % TRAIL) * 0.045;
      const tt = Math.min(1, Math.max(0, (u * travel - D[i] - lag) / (travel - stagger)));
      const e = tt * tt * (3 - 2 * tt), w = 1 - e;
      out.copy(P0[i]).multiplyScalar(w * w * w).add(tmp.copy(P1[i]).multiplyScalar(3 * w * w * e)).add(tmp.copy(P2[i]).multiplyScalar(3 * w * e * e)).add(tmp.copy(chest).multiplyScalar(e * e * e));
      if (tt <= 0 || tt >= 1) out.y += 50;                                      // not launched yet / already absorbed: parked out of view
    },
    onArrive: (j: number) => { if (j === n - 1) onArrive?.(); }, fadeIn: 0.05,
    sizeFn: (j: number) => (j % TRAIL === 0 ? 0.1 : 0.068 - 0.014 * (j % TRAIL)),
  } as never, ctx, ctx.layer('particles'));
}

/** Absorption pulse: glow + expanding ring facing the camera + quick sparkle. */
export class AbsorbPulseFx extends TimedFx {
  private glow: Sprite; private gMat: SpriteMaterial; private ring: Mesh; private rMat: MeshBasicMaterial;
  constructor(ctx: FxContext, at: string, duration: number) {
    super('particles', duration);
    const c = ctx.anchor(at, v3());
    this.gMat = new SpriteMaterial({ map: acquireTex('soft'), color: new Color(LQ.gold), transparent: true, depthWrite: false });
    this.glow = new Sprite(this.gMat); this.glow.position.copy(c); this.glow.renderOrder = 18;
    this.rMat = new MeshBasicMaterial({ map: acquireTex('ring'), color: new Color('#FFF3C4'), transparent: true, depthWrite: false, side: DoubleSide });
    this.ring = new Mesh(new PlaneGeometry(1, 1), this.rMat); this.ring.position.copy(c); this.ring.renderOrder = 19; faceCamera(this.ring);
    ctx.layer('particles').add(this.glow, this.ring);
  }
  protected frame(_t: number, u: number, a: number) {
    const pulse = Math.sin(Math.PI * Math.min(1, u * 1.6));
    this.glow.scale.setScalar(0.28 + 0.4 * pulse); this.gMat.opacity = a * 0.9 * pulse;
    const e = 1 - Math.pow(1 - u, 2.5); this.ring.scale.setScalar(0.1 + 0.5 * e); this.rMat.opacity = a * (1 - u);
  }
  dispose() { this.glow.removeFromParent(); this.ring.removeFromParent(); this.gMat.dispose(); this.rMat.dispose(); this.ring.geometry.dispose(); releaseTex('soft'); releaseTex('ring'); }
}

/** Animated energy ring at the feet (level_up charge): rune ring that spins faster and brighter. */
export class EnergyRingFx implements Fx {
  readonly category: FxCategory = 'particles'; owner?: string;
  private m: Mesh; private tex: Texture; private mat: MeshBasicMaterial; private m2: Mesh; private mat2: MeshBasicMaterial;
  private t = 0; private s = 0; private ending = false;
  constructor(ctx: FxContext, private until: number) {
    this.tex = canvasTex(256, (g, S) => {
      g.translate(S / 2, S / 2); g.strokeStyle = '#FFFFFF'; g.fillStyle = '#FFFFFF';
      g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 112, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 92, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 24; i++) { g.save(); g.rotate((i / 24) * Math.PI * 2); if (i % 3 === 0) { g.beginPath(); g.moveTo(0, -108); g.lineTo(6, -100); g.lineTo(0, -94); g.lineTo(-6, -100); g.fill(); } else g.fillRect(-1.5, -106, 3, 9); g.restore(); }
    });
    this.mat = new MeshBasicMaterial({ map: this.tex, color: new Color(LQ.gold), transparent: true, depthWrite: false, side: DoubleSide, opacity: 0 });
    this.mat2 = new MeshBasicMaterial({ map: acquireTex('soft'), color: new Color(LQ.yellow), transparent: true, depthWrite: false, side: DoubleSide, opacity: 0 });
    this.m = new Mesh(new PlaneGeometry(0.7, 0.7), this.mat); this.m.rotation.x = -Math.PI / 2; this.m.position.copy(ctx.anchor('feet', v3())); this.m.position.y += 0.004; this.m.renderOrder = 11;
    this.m2 = new Mesh(new PlaneGeometry(0.62, 0.62), this.mat2); this.m2.rotation.x = -Math.PI / 2; this.m2.position.copy(this.m.position); this.m2.position.y -= 0.001; this.m2.renderOrder = 10;
    this.m.name = 'FX_energy_ring'; ctx.layer('particles').add(this.m2, this.m);
  }
  update(dt: number) {
    this.t += dt; if (this.t > this.until) this.ending = true;
    this.s = this.ending ? Math.max(0, this.s - dt / 0.18) : Math.min(1, this.s + dt / 0.35);
    const charge = Math.min(1, this.t / Math.max(0.1, this.until));
    this.m.rotation.z += dt * (0.8 + 6 * charge * charge);
    const k = this.ending ? 1 + 0.6 * (1 - this.s) : easeOutBack(this.s);        // bursts outward at the launch
    this.m.scale.setScalar(Math.max(0.001, k * (0.85 + 0.15 * charge))); this.m2.scale.copy(this.m.scale);
    this.mat.opacity = this.s * (0.55 + 0.4 * charge) * (0.85 + 0.15 * Math.sin(this.t * 18));
    this.mat2.opacity = this.s * 0.35 * charge;
    return !(this.ending && this.s <= 0);
  }
  stop() { this.ending = true; }
  dispose() { this.m.removeFromParent(); this.m2.removeFromParent(); this.m.geometry.dispose(); this.m2.geometry.dispose(); this.mat.dispose(); this.mat2.dispose(); this.tex.dispose(); releaseTex('soft'); }
}

/** Rising light ribbons: three helical strips around the fox (one merged mesh), revealed bottom → top
 *  with a scrolling gradient, plus rising sparks. */
export class RibbonsFx extends TimedFx {
  private m: Mesh; private mat: ShaderMaterial; private sparks: FxParticles | null;
  constructor(ctx: FxContext, duration: number) {
    super('particles', duration);
    const pos: number[] = [], uv: number[] = [], idx: number[] = [], SEG = 48;
    for (let r = 0; r < 3; r++) {
      const ph = (r / 3) * Math.PI * 2, b = pos.length / 3;
      for (let i = 0; i <= SEG; i++) {
        const u = i / SEG, a = ph + u * Math.PI * 2.4, rad = 0.36 - 0.12 * u, y = 0.02 + 1.25 * u, w = 0.035 * (1 - 0.6 * u);
        const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
        pos.push(x, y - w, z, x, y + w, z); uv.push(u, 0, u, 1);
        if (i < SEG) { const k = b + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
    }
    const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3)); g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2)); g.setIndex(idx);
    this.mat = new ShaderMaterial({ transparent: true, depthWrite: false, side: DoubleSide, blending: NormalBlending,
      uniforms: { uHead: { value: 0 }, uTail: { value: 0 }, uA: { value: 1 }, uC1: { value: new Color(LQ.gold) }, uC2: { value: new Color('#FFFFFF') } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uHead, uTail, uA; uniform vec3 uC1, uC2; varying vec2 vUv;
        void main(){ float on = smoothstep(uTail, uTail + 0.08, vUv.x) * (1.0 - smoothstep(uHead - 0.12, uHead, vUv.x));
          float edge = 1.0 - abs(vUv.y * 2.0 - 1.0); float a = on * smoothstep(0.0, 0.5, edge) * uA; if (a < 0.01) discard;
          vec3 c = mix(uC1, uC2, smoothstep(uHead - 0.25, uHead, vUv.x)); gl_FragColor = vec4(c, a * 0.9);
          #include <colorspace_fragment>
        }` });
    this.m = new Mesh(g, this.mat); this.m.renderOrder = 17; this.m.name = 'FX_ribbons'; this.m.position.copy(ctx.anchor('feet', v3())); ctx.layer('particles').add(this.m);
    this.sparks = ctx.reducedMotion ? null : new FxParticles('particles', { count: 22, tex: 'spark', colors: [LQ.gold, '#FFFFFF', LQ.yellow], life: [0.6, 1.0], size: [0.02, 0.04], delay: [0, 0.6],
      spawn: (_i, p, v, r) => { const a = r() * Math.PI * 2; p.set(Math.cos(a) * 0.3, 0.05 + r() * 0.3, Math.sin(a) * 0.3); v.set(-Math.cos(a) * 0.05, 0.7 + r() * 0.5, -Math.sin(a) * 0.05); },
      drag: 0.6, spin: 4, grow: 0.4 }, ctx, ctx.layer('particles'));
  }
  protected frame(t: number, u: number, a: number) {
    this.mat.uniforms.uHead.value = Math.min(1.12, smooth01(u * 1.5) * 1.12);
    this.mat.uniforms.uTail.value = smooth01((u - 0.3) / 0.7) * 1.05;
    this.mat.uniforms.uA.value = a;
    this.m.rotation.y = t * 1.8;
  }
  override update(dt: number) { const r = super.update(dt); if (this.sparks && !this.sparks.update(dt)) { this.sparks.dispose(); this.sparks = null; } return r || !!this.sparks; }
  override stop() { super.stop(); this.sparks?.stop(); }
  dispose() { this.sparks?.dispose(); this.m.removeFromParent(); this.m.geometry.dispose(); this.mat.dispose(); }
}

/** Climax flash at the apex: big soft flash + radial burst + star ring. */
export class ClimaxFx extends TimedFx {
  private glow: Sprite; private gMat: SpriteMaterial; private burst: RadialBurstFx; private stars: FxParticles;
  constructor(ctx: FxContext, at: string, duration: number) {
    super('particles', duration);
    const c = ctx.anchor(at, v3());
    this.gMat = new SpriteMaterial({ map: acquireTex('soft'), color: new Color('#FFF4CF'), transparent: true, depthWrite: false });
    this.glow = new Sprite(this.gMat); this.glow.position.copy(c); this.glow.renderOrder = 21; ctx.layer('particles').add(this.glow);
    this.burst = new RadialBurstFx(ctx, at, duration * 0.9, LQ.gold, 16);
    this.stars = new FxParticles('particles', { count: 12, tex: 'star', colors: [LQ.gold, LQ.yellow, '#FFFFFF'], life: [0.6, 0.9], size: [0.04, 0.07],
      spawn: (i, p, v) => { p.copy(c); const a = (i / 12) * Math.PI * 2; v.set(Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0.1); }, drag: 3.5, spin: 3, grow: 0.4, fadeIn: 0.03 }, ctx, ctx.layer('particles'));
    this.flashK = ctx.reducedMotion ? 0.35 : 1;
  }
  private flashK = 1;
  protected frame(_t: number, u: number, a: number) { const f = Math.max(0, 1 - u * 2.2); this.glow.scale.setScalar(0.35 + 0.7 * (1 - f)); this.gMat.opacity = a * f * 0.9 * this.flashK; }
  override update(dt: number) { const r = super.update(dt); const b = this.burst.update(dt); const s = this.stars.update(dt); return r || b || s; }
  override stop() { super.stop(); this.burst.stop(); this.stars.stop(); }
  dispose() { this.glow.removeFromParent(); this.gMat.dispose(); releaseTex('soft'); this.burst.dispose(); this.stars.dispose(); }
}

// ------------------------------------------------------------------ badge
const BADGE_FRAG = /* glsl */`
uniform sampler2D uMap; uniform float uShine, uA; varying vec2 vUv;
void main(){
  vec4 t = texture2D(uMap, vUv); float a = t.a * uA; if (a < 0.01) discard;
  float band = (vUv.x + vUv.y) * 0.5 - (uShine * 1.6 - 0.3);                  // diagonal band sweeping across
  float s = exp(-pow(band * 9.0, 2.0)) * step(0.0, uShine) * step(uShine, 1.0);
  gl_FragColor = vec4(mix(t.rgb, vec3(1.0), s * 0.85 * t.a), a);
  #include <colorspace_fragment>
}`;
/** Achievement badge: materialise (sparks converge, pop with a glint) → paws → present → chest → dissolve.
 *  Positions follow the paws so the fox visibly holds and presents it; `shine()` runs a focused sweep. */
export class BadgeFx implements Fx {
  readonly category: FxCategory = 'props'; owner?: string;
  private g = new Group(); private face: Mesh; private tex: Texture; private mat: ShaderMaterial; private rib: Mesh; private ribMat: MeshBasicMaterial;
  private t = 0; private s = 0; private ending = false; private shineT = -1; private shineDur = 0.7; private p = v3(); private tmp = v3();
  private sparks: FxParticles | null = null;
  constructor(private ctx: FxContext, private phases: [number, string][], private until: number) {
    this.tex = canvasTex(256, (g, S) => {
      g.translate(S / 2, S / 2);
      const grad = g.createRadialGradient(-30, -30, 10, 0, 0, 110); grad.addColorStop(0, '#FFE9A0'); grad.addColorStop(0.6, '#F6C85F'); grad.addColorStop(1, '#D9962F');
      g.fillStyle = grad; g.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 104 : 116; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
      g.lineWidth = 8; g.strokeStyle = '#FFFFFF'; g.beginPath(); g.arc(0, 0, 84, 0, Math.PI * 2); g.stroke();
      g.fillStyle = LQ.orange; g.beginPath(); g.arc(0, 0, 74, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFF6E9'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 22 : 52; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
    });
    this.mat = new ShaderMaterial({ transparent: true, depthWrite: false, side: DoubleSide, uniforms: { uMap: { value: this.tex }, uShine: { value: -1 }, uA: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }', fragmentShader: BADGE_FRAG });
    this.face = new Mesh(new PlaneGeometry(0.17, 0.17), this.mat); this.face.renderOrder = 26; this.face.name = 'FX_PROP_badge';
    this.ribMat = new MeshBasicMaterial({ color: new Color(LQ.teal), side: DoubleSide, transparent: true });
    const rg = new BufferGeometry();
    rg.setAttribute('position', new BufferAttribute(new Float32Array([-0.05, 0.05, -0.002, -0.015, 0.05, -0.002, -0.03, -0.11, -0.002, -0.05, -0.095, -0.002, 0.015, 0.05, -0.002, 0.05, 0.05, -0.002, 0.05, -0.095, -0.002, 0.03, -0.11, -0.002]), 3));
    rg.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
    this.rib = new Mesh(rg, this.ribMat); this.rib.renderOrder = 25;
    this.g.add(this.rib, this.face); this.g.name = 'FX_PROP_badge_group'; this.g.scale.setScalar(0.001);
    ctx.layer('props').add(this.g);
    // materialise: sparks converge onto the badge point
    const c = this.target('materialize', 0, v3());
    this.sparks = new FxParticles('particles', { count: 16, tex: 'spark', colors: [LQ.gold, '#FFFFFF', LQ.yellow], life: [0.4, 0.55], size: [0.02, 0.035], delay: [0, 0.12],
      spawn: () => {}, path: (i, u, out) => { const a = i * 2.39, r = 0.22 * (1 - u * u); out.set(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, c.z + 0.02); }, fadeIn: 0.1 }, ctx, ctx.layer('particles'));
  }
  private phase(): [string, number] { let p = this.phases[0]?.[1] ?? 'materialize', t0 = 0; for (const [t, n] of this.phases) if (this.t >= t) { p = n; t0 = t; } return [p, this.t - t0]; }
  private target(ph: string, pt: number, out: Vector3) {
    const paws = this.ctx.anchor('paws', this.tmp), chest = this.ctx.anchor('chest', v3());
    paws.z = Math.max(paws.z, chest.z + 0.1);                               // always in front of the body surface
    switch (ph) {
      case 'materialize': return out.copy(chest).add(v3(0, 0.16, 0.24)).add(v3(0, Math.sin(this.t * 3) * 0.01, 0));
      case 'paws': return out.copy(paws).add(v3(0, 0.05, 0.06));
      case 'present': return out.copy(paws).add(v3(0, 0.1, 0.07));             // lifted towards the user
      case 'chest': return out.copy(paws).add(v3(0, 0.04, 0.05));
      case 'dissolve': return out.copy(paws).add(v3(0, 0.04 + 0.1 * pt, 0.05));
      default: return out.copy(paws);
    }
  }
  /** fx-root position (anchor 'badge'). */
  position(out: Vector3) { return out.copy(this.g.position); }
  shine(duration: number) { this.shineT = 0; this.shineDur = duration; }
  update(dt: number) {
    this.t += dt; if (this.t > this.until) this.ending = true;
    const [ph, pt] = this.phase();
    const appear = this.t > 0.32;                                                 // after the sparks converged
    this.s = this.ending || ph === 'dissolve' ? Math.max(0, this.s - dt / 0.3) : appear ? Math.min(1, this.s + dt / 0.22) : 0;
    this.target(ph, pt, this.p);
    if (ph === 'materialize') this.g.position.copy(this.p); else this.g.position.lerp(this.p, 1 - Math.exp(-dt * 22));
    const glint = appear && this.t < 0.6 ? 1 : 0;
    this.g.scale.setScalar(Math.max(0.001, easeOutBack(this.s)));
    this.g.rotation.y = ph === 'materialize' ? Math.sin(this.t * 2.2) * 0.35 : Math.sin(this.t * 1.5) * 0.08;
    if (glint && this.shineT < 0) this.shine(0.45);
    if (this.shineT >= 0) { this.shineT += dt; const u = this.shineT / this.shineDur; this.mat.uniforms.uShine.value = u; if (u > 1) { this.shineT = -1; this.mat.uniforms.uShine.value = -1; } }
    this.mat.uniforms.uA.value = Math.min(1, this.s * 1.5); this.ribMat.opacity = Math.min(1, this.s * 1.5);
    if (this.sparks && !this.sparks.update(dt)) { this.sparks.dispose(); this.sparks = null; }
    return !((this.ending || ph === 'dissolve') && this.s <= 0 && !this.sparks);
  }
  stop() { this.ending = true; this.sparks?.stop(); }
  dispose() { this.sparks?.dispose(); this.g.removeFromParent(); this.face.geometry.dispose(); this.rib.geometry.dispose(); this.mat.dispose(); this.ribMat.dispose(); this.tex.dispose(); }
}

/** Soft sparkle (supportive accent): fewer, slower, mint. */
export function softSparkle(ctx: FxContext, at: string, count = 6): Fx {
  const o = ctx.anchor(at, v3());
  return new FxParticles('particles', { count, tex: 'spark', colors: [LQ.mint, '#FFFFFF'], life: [0.6, 1.0], size: [0.022, 0.035],
    spawn: (_i, p, v, r) => { p.copy(o).add(v3((r() - 0.5) * 0.08, (r() - 0.5) * 0.06, 0.03)); v.set((r() - 0.5) * 0.15, 0.15 + r() * 0.15, 0.03); },
    drag: 2, spin: 2, grow: 0.4 }, ctx, ctx.layer('particles'));
}
