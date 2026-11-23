import {
  NormalBlending, BufferGeometry, CatmullRomCurve3, Color, CylinderGeometry, DoubleSide, Group, LineCurve3, Mesh, MeshBasicMaterial,
  Object3D, PlaneGeometry, ShaderMaterial, SphereGeometry, Sprite, SpriteMaterial, TubeGeometry, Vector3, CurvePath, type Bone,
} from 'three';
import { FxParticles, LQ, acquireTex, disposeSprite, easeOutBack, makeTextSprite, releaseTex, smooth01, type Fx, type FxCategory, type FxContext } from './fxCore';

// Transient effect implementations, one factory per cue id. All geometry / materials are created
// per effect and disposed when it ends; positions are in fx-root space (follows the level scale).

export interface CueArgs { duration?: number; until?: number; count?: number; at?: string; travel?: number; target?: string; fade?: number; socket?: string; follow?: [number, string][] }

/** Generic timed effect with a fade envelope around a custom per-frame function. */
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

// ------------------------------------------------------------------ particles presets
const v3 = (x = 0, y = 0, z = 0) => new Vector3(x, y, z);
export function sparkle(ctx: FxContext, at: string, count = 12): Fx {
  const o = ctx.anchor(at, v3());
  return new FxParticles('particles', { count, tex: 'spark', colors: [LQ.gold, '#FFFFFF', LQ.yellow], additive: true, life: [0.5, 0.95], size: [0.03, 0.06],
    spawn: (_i, p, v, r) => { p.copy(o).add(v3((r() - 0.5) * 0.12, (r() - 0.5) * 0.12, (r() - 0.5) * 0.1)); const a = r() * Math.PI * 2; v.set(Math.cos(a) * 0.35, 0.2 + r() * 0.4, Math.sin(a) * 0.2); },
    gravity: 0.6, drag: 2.5, spin: 4, grow: 0.3 }, ctx, ctx.layer('particles'));
}
export function confetti(ctx: FxContext, count = 70, duration = 2.4): Fx {
  return new FxParticles('particles', { count, tex: 'rect', colors: [LQ.orange, LQ.teal, LQ.yellow, LQ.mint, LQ.pink, '#FFFFFF'], life: [duration * 0.7, duration], size: [0.025, 0.04],
    spawn: (_i, p, v, r) => { p.set((r() - 0.5) * 0.2, 0.95 + r() * 0.1, (r() - 0.5) * 0.15); const a = r() * Math.PI * 2, s = 0.5 + r() * 0.7; v.set(Math.cos(a) * s * 0.7, 0.9 + r() * 0.9, Math.sin(a) * s * 0.4); },
    gravity: 1.8, drag: 1.6, spin: 9, fadeIn: 0.02 }, ctx, ctx.layer('particles'));
}
export function starBurst(ctx: FxContext, at: string, count = 12): Fx {
  const o = ctx.anchor(at, v3());
  return new FxParticles('particles', { count, tex: 'star', colors: [LQ.gold, LQ.yellow, '#FFFFFF'], additive: true, life: [0.7, 1.0], size: [0.04, 0.07],
    spawn: (i, p, v) => { p.copy(o); const a = (i / count) * Math.PI * 2; v.set(Math.cos(a) * 0.55, Math.sin(a) * 0.55 + 0.1, 0.05); },
    drag: 3.2, spin: 3, grow: 0.5, fadeIn: 0.05 }, ctx, ctx.layer('particles'));
}
export function puff(ctx: FxContext, at: string, kind: 'sigh' | 'cough' | 'smoke' | 'soot', count = 6, duration = 1.2): Fx {
  const o = ctx.anchor(at, v3());
  const col = kind === 'sigh' ? ['#FFFFFF', '#EEF4F7'] : kind === 'cough' ? ['#8A817C', '#6E6560'] : kind === 'smoke' ? ['#9A9490', '#C9C4C0', '#77706B'] : ['#2E2420', '#46382F'];
  if (kind === 'soot') return new FxParticles('particles', { count, tex: 'soft', colors: col, life: [0.5, duration], size: [0.02, 0.04],
    spawn: (_i, p, v, r) => { const a = r() * Math.PI * 2; p.set(Math.cos(a) * 0.2, 0.2 + r() * 0.45, Math.sin(a) * 0.15); v.set(Math.cos(a) * (0.6 + r() * 0.6), 0.3 + r() * 0.5, Math.sin(a) * 0.5); },
    gravity: 1.6, drag: 1.5 }, ctx, ctx.layer('particles'));
  return new FxParticles('particles', { count, tex: 'soft', colors: col, life: [duration * 0.6, duration], size: kind === 'smoke' ? [0.07, 0.12] : [0.04, 0.07],
    spawn: (_i, p, v, r) => { p.copy(o).add(v3((r() - 0.5) * 0.04, (r() - 0.5) * 0.03, 0)); v.set((r() - 0.5) * 0.1, kind === 'smoke' ? 0.25 + r() * 0.2 : 0.06, kind === 'smoke' ? 0 : 0.22 + r() * 0.1); },
    drag: 1.2, grow: kind === 'smoke' ? 2.4 : 1.8, delay: [0, kind === 'smoke' ? 0.5 : 0.15], fadeIn: 0.15 }, ctx, ctx.layer('particles'));
}
export function xpOrbs(ctx: FxContext, count = 14, travel = 0.55, onArrive?: () => void): Fx {
  const chest = ctx.anchor('chest', v3()), starts: Vector3[] = [], ctrl: Vector3[] = [];
  for (let i = 0; i < count; i++) {
    starts.push(v3(0.45 + ctx.rnd() * 0.3, 0.85 + ctx.rnd() * 0.3, 0.25 + ctx.rnd() * 0.25));
    ctrl.push(v3(0.15 + ctx.rnd() * 0.25, 1.05 + ctx.rnd() * 0.2, 0.45));
  }
  const tmp = v3();
  return new FxParticles('particles', { count, tex: 'soft', colors: [LQ.gold, '#FFE9A6', LQ.mint], additive: true, life: [travel, travel * 1.25], size: [0.05, 0.08], delay: [0, 0.45],
    spawn: () => {}, path: (i, u, out) => {
      const e = u * u * (3 - 2 * u), a = starts[i], b = ctrl[i];
      out.copy(a).multiplyScalar((1 - e) * (1 - e)).add(tmp.copy(b).multiplyScalar(2 * (1 - e) * e)).add(v3().copy(chest).multiplyScalar(e * e));
    }, onArrive: () => onArrive?.(), fadeIn: 0.15 }, ctx, ctx.layer('particles'));
}
export function chargeAura(ctx: FxContext, duration: number): Fx {
  const c = ctx.anchor('chest', v3());
  return new FxParticles('particles', { count: 40, tex: 'soft', colors: [LQ.gold, '#FFFFFF', LQ.yellow], additive: true, life: [0.5, 0.8], size: [0.025, 0.045], delay: [0, Math.max(0.05, duration - 0.6)],
    spawn: () => {}, path: (i, u, out) => {
      const a = i * 2.399, r = 0.42 * (1 - u * u), h = 0.1 + (i % 7) * 0.08;
      out.set(c.x + Math.cos(a + u * 2) * r, h + (c.y - h) * u, c.z + Math.sin(a + u * 2) * r * 0.7);
    }, fadeIn: 0.2 }, ctx, ctx.layer('particles'));
}

// ------------------------------------------------------------------ text / sprites
export class TextFx extends TimedFx {
  private s: Sprite; private base: Vector3;
  constructor(ctx: FxContext, text: string, bg: string, fg: string, at: string, offset: Vector3, duration: number, h = 0.12) {
    super('text', duration);
    this.s = makeTextSprite(text, bg, fg, h); this.base = ctx.anchor(at, v3()).add(offset);
    this.s.position.copy(this.base); ctx.layer('text').add(this.s);
  }
  protected frame(t: number, u: number, a: number) {
    const pop = easeOutBack(t / 0.28);
    this.s.position.set(this.base.x, this.base.y + 0.08 * u, this.base.z);
    this.s.material.opacity = a * (1 - smooth01((u - 0.78) / 0.22));
    const k = Math.max(0.001, pop); this.s.scale.set((this.s.scale.x / (this.s.userData.k || 1)) * k, (this.s.scale.y / (this.s.userData.k || 1)) * k, 1); this.s.userData.k = k;
  }
  dispose() { disposeSprite(this.s); }
}

export class GlowFx extends TimedFx {
  private s: Sprite; private mat: SpriteMaterial;
  constructor(ctx: FxContext, at: string, color: string, size: number, duration: number, private grow = 2) {
    super('particles', duration);
    this.mat = new SpriteMaterial({ map: acquireTex('soft'), color: new Color(color), transparent: true, depthWrite: false, blending: NormalBlending });
    this.s = new Sprite(this.mat); this.s.position.copy(ctx.anchor(at, v3())); this.s.scale.setScalar(size); this.s.renderOrder = 18; this.s.userData.size = size;
    ctx.layer('particles').add(this.s);
  }
  protected frame(_t: number, u: number, a: number) { this.s.scale.setScalar(this.s.userData.size * (1 + (this.grow - 1) * u)); this.mat.opacity = a * Math.sin(Math.PI * Math.min(1, u * 1.2)) * 0.9; }
  dispose() { this.s.removeFromParent(); this.mat.dispose(); releaseTex('soft'); }
}

/** Expanding ring (ground shockwave, tier ring, star ring halo). */
export class RingFx extends TimedFx {
  private m: Mesh; private mat: MeshBasicMaterial;
  constructor(ctx: FxContext, at: string, color: string, r0: number, r1: number, duration: number, horizontal = true, cat: FxCategory = 'particles') {
    super(cat, duration);
    this.mat = new MeshBasicMaterial({ map: acquireTex('ring'), color: new Color(color), transparent: true, depthWrite: false, blending: NormalBlending, side: DoubleSide });
    this.m = new Mesh(new PlaneGeometry(1, 1), this.mat); this.m.renderOrder = 17;
    this.m.position.copy(ctx.anchor(at, v3())); if (horizontal) this.m.rotation.x = -Math.PI / 2;
    this.m.userData = { r0, r1 }; ctx.layer(cat).add(this.m);
  }
  protected frame(_t: number, u: number, a: number) { const e = 1 - Math.pow(1 - u, 3); this.m.scale.setScalar(2 * (this.m.userData.r0 + (this.m.userData.r1 - this.m.userData.r0) * e)); this.mat.opacity = a * (1 - u); }
  dispose() { this.m.removeFromParent(); this.m.geometry.dispose(); this.mat.dispose(); releaseTex('ring'); }
}

/** Level-up light pillar (additive gradient cylinder). */
export class BeamFx extends TimedFx {
  private m: Mesh; private mat: ShaderMaterial;
  constructor(ctx: FxContext, duration: number) {
    super('particles', duration);
    this.mat = new ShaderMaterial({ transparent: true, depthWrite: false, blending: NormalBlending, side: DoubleSide,
      uniforms: { uA: { value: 0 }, uC: { value: new Color(LQ.gold) }, uT: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform float uA, uT; uniform vec3 uC; varying vec2 vUv; void main(){ float s = 0.55 + 0.45 * sin(vUv.x * 37.7 + uT * 6.0); float a = uA * pow(1.0 - vUv.y, 1.6) * s; gl_FragColor = vec4(uC * (0.8 + 0.6 * (1.0 - vUv.y)), a); }' });
    const g = new CylinderGeometry(0.34, 0.3, 1.7, 40, 1, true); g.translate(0, 0.85, 0);
    this.m = new Mesh(g, this.mat); this.m.renderOrder = 16; ctx.layer('particles').add(this.m);
  }
  protected frame(t: number, u: number, a: number) { this.mat.uniforms.uT.value = t; this.mat.uniforms.uA.value = a * 0.75 * Math.sin(Math.PI * Math.min(1, u * 1.1)); this.m.scale.set(1 - 0.4 * u, smooth01(u * 4), 1 - 0.4 * u); }
  dispose() { this.m.removeFromParent(); this.m.geometry.dispose(); this.mat.dispose(); }
}

/** Stylised lightning bolt (jagged tube + glow tube + impact flash; no flash under reduced motion). */
export class LightningFx extends TimedFx {
  private g = new Group(); private mats: (MeshBasicMaterial | SpriteMaterial)[] = []; private geos: BufferGeometry[] = []; private flash?: Sprite;
  constructor(ctx: FxContext, target: Vector3, duration: number, from?: Vector3) {
    super('lightning', duration);
    // G1.1: optional origin (the storm cloud); G1 default = straight down from above the frame
    const top = from ? from.clone() : v3(target.x + 0.12, 1.75, target.z + 0.05), pts: Vector3[] = [top];
    for (let i = 1; i < 7; i++) { const u = i / 7; pts.push(v3(top.x + (target.x - top.x) * u + (ctx.rnd() - 0.5) * 0.12, top.y + (target.y - top.y) * u, top.z + (target.z - top.z) * u + (ctx.rnd() - 0.5) * 0.06)); }
    pts.push(target.clone());
    const mk = (points: Vector3[], r: number, color: string, opacity: number, _glow: boolean) => {
      const path = new CurvePath<Vector3>(); for (let i = 0; i < points.length - 1; i++) path.add(new LineCurve3(points[i], points[i + 1]));
      const geo = new TubeGeometry(path as unknown as CatmullRomCurve3, points.length * 4, r, 6, false);
      const mat = new MeshBasicMaterial({ color: new Color(color), transparent: true, opacity, depthWrite: false, blending: NormalBlending });
      this.geos.push(geo); this.mats.push(mat); const m = new Mesh(geo, mat); m.renderOrder = 30; this.g.add(m);
    };
    mk(pts, 0.008, '#FFFBE6', 1, false);
    mk(pts, 0.0035, '#3D6DB5', 0.9, false);
    mk(pts, 0.02, '#7CC4FF', ctx.reducedMotion ? 0.2 : 0.45, true);
    const b0 = pts[3], branch = [b0, v3(b0.x - 0.12, b0.y - 0.1, b0.z), v3(b0.x - 0.18, b0.y - 0.22, b0.z + 0.04)];
    mk(branch, 0.004, '#E8F6FF', 0.9, false);
    if (!ctx.reducedMotion) {
      const fm = new SpriteMaterial({ map: acquireTex('soft'), color: new Color('#EAF7FF'), transparent: true, depthWrite: false, blending: NormalBlending });
      this.mats.push(fm); this.flash = new Sprite(fm); this.flash.position.copy(target); this.flash.scale.setScalar(0.42); this.flash.renderOrder = 31; this.g.add(this.flash);
    }
    this.g.name = 'FX_lightning'; ctx.layer('lightning').add(this.g);
  }
  protected frame(t: number, u: number, a: number) {
    const on = u < 0.45 ? (Math.floor(t * 30) % 3 !== 2 ? 1 : 0.35) : 1 - smooth01((u - 0.45) / 0.55);   // two quick pulses, then fade (≤ 3 flashes/s overall)
    this.g.children.forEach((c, i) => { const m = (c as Mesh).material as MeshBasicMaterial; if (c !== this.flash) m.opacity = a * on * (i === 1 ? 0.55 : 1); });
    if (this.flash) { (this.flash.material as SpriteMaterial).opacity = a * Math.max(0, 1 - u * 2.6) * 0.7; this.flash.scale.setScalar(0.42 + 0.3 * u); }
  }
  dispose() { this.g.removeFromParent(); this.geos.forEach(g => g.dispose()); this.mats.forEach(m => m.dispose()); if (this.flash) releaseTex('soft'); }
}

/** Small rain cloud over the head (quest_failed). */
export class RainCloudFx implements Fx {
  readonly category: FxCategory = 'props'; owner?: string;
  private g = new Group(); private mat: MeshBasicMaterial; private geo: SphereGeometry; private rain: FxParticles | null = null;
  private t = 0; private fade = 0; private ending = false; private rainT = 0;
  constructor(private ctx: FxContext, private until: number) {
    this.mat = new MeshBasicMaterial({ color: new Color('#B9C2CC'), transparent: true, opacity: 0, depthWrite: false });
    this.geo = new SphereGeometry(1, 16, 12);
    for (const [x, y, r] of [[-0.07, 0, 0.06], [0, 0.02, 0.075], [0.075, 0, 0.055], [0.03, -0.02, 0.05], [-0.03, -0.02, 0.05]]) { const m = new Mesh(this.geo, this.mat); m.position.set(x, y, 0); m.scale.setScalar(r); m.renderOrder = 12; this.g.add(m); }
    this.g.position.copy(ctx.anchor('head_top', v3())).add(v3(0.02, 0.2, 0.05)); this.g.name = 'FX_rain_cloud';
    ctx.layer('props').add(this.g);
  }
  update(dt: number) {
    this.t += dt; if (this.t > this.until) this.ending = true;
    this.fade = this.ending ? Math.max(0, this.fade - dt / 0.4) : Math.min(1, this.fade + dt / 0.35);
    this.mat.opacity = 0.92 * this.fade; this.g.position.y += Math.sin(this.t * 2.4) * 0.0006; this.g.scale.setScalar(0.6 + 0.4 * easeOutBack(Math.min(1, this.t / 0.35)));
    this.rainT -= dt;
    if (!this.ending && this.rainT <= 0 && this.t > 0.3) {
      this.rainT = 0.5; const o = this.g.position.clone();
      this.rain?.dispose();
      this.rain = new FxParticles('particles', { count: 10, tex: 'drop', colors: ['#7FB6E8', '#A9D2F5'], life: [0.35, 0.5], size: [0.018, 0.026], delay: [0, 0.45],
        spawn: (_i, p, v, r) => { p.copy(o).add(v3((r() - 0.5) * 0.14, -0.04, (r() - 0.5) * 0.05)); v.set(0, -0.9, 0); } }, this.ctx, this.ctx.layer('props'));
    }
    if (this.rain && !this.rain.update(dt)) { this.rain.dispose(); this.rain = null; }
    return !(this.ending && this.fade <= 0 && !this.rain);
  }
  stop() { this.ending = true; this.rain?.stop(); }
  dispose() { this.rain?.dispose(); this.g.removeFromParent(); this.geo.dispose(); this.mat.dispose(); }
}

// ------------------------------------------------------------------ temporary props (NOT cosmetics)
// Props are FX_PROP_* nodes owned by one clip. They may sit on a socket bone but are tagged
// userData.fxProp and removed when the clip ends; Gate H cosmetics will use their own slot nodes.
export class FlagProp implements Fx {
  readonly category: FxCategory = 'props'; owner?: string;
  private g = new Group(); private geos: BufferGeometry[] = []; private mats: MeshBasicMaterial[] = []; private cloth: Mesh; private base: Float32Array;
  private t = 0; private s = 0; private ending = false;
  constructor(socket: Bone, private until: number) {
    const pole = new CylinderGeometry(0.006, 0.006, 0.26, 8); pole.translate(0, 0.13, 0);
    const cloth = new PlaneGeometry(0.13, 0.08, 8, 2); cloth.translate(0.065, 0.2, 0);
    const mp = new MeshBasicMaterial({ color: new Color('#7A4B2A') }), mc = new MeshBasicMaterial({ color: new Color(LQ.orange), side: DoubleSide });
    this.geos.push(pole, cloth); this.mats.push(mp, mc);
    this.g.add(new Mesh(pole, mp)); this.cloth = new Mesh(cloth, mc); this.g.add(this.cloth);
    const star = new Mesh(new PlaneGeometry(0.04, 0.04), new MeshBasicMaterial({ map: acquireTex('star'), color: new Color(LQ.cream), transparent: true, side: DoubleSide }));
    star.position.set(0.06, 0.2, 0.001); this.g.add(star); this.geos.push(star.geometry); this.mats.push(star.material as MeshBasicMaterial);
    this.base = (cloth.attributes.position.array as Float32Array).slice();
    this.g.name = 'FX_PROP_flag'; this.g.userData.fxProp = true; this.g.scale.setScalar(0.001);
    socket.add(this.g);
    // the socket is oriented for cosmetics: compensate so the flag stands upright in the raised paw
    this.g.rotation.set(0, 0, 0.35);
  }
  update(dt: number) {
    this.t += dt; if (this.t > this.until) this.ending = true;
    this.s = this.ending ? Math.max(0, this.s - dt / 0.2) : Math.min(1, this.s + dt / 0.18);
    this.g.scale.setScalar(Math.max(0.001, easeOutBack(this.s)));
    const p = this.cloth.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = this.base[i * 3] ; p.setZ(i, Math.sin(x * 40 - this.t * 9) * 0.012 * (x / 0.13)); }
    p.needsUpdate = true;
    return !(this.ending && this.s <= 0);
  }
  stop() { this.ending = true; }
  dispose() { this.g.removeFromParent(); this.geos.forEach(g => g.dispose()); this.mats.forEach(m => m.dispose()); releaseTex('star'); }
}

export class MedalProp implements Fx {
  readonly category: FxCategory = 'props'; owner?: string;
  private g = new Group(); private geos: BufferGeometry[] = []; private mats: MeshBasicMaterial[] = [];
  private t = 0; private s = 0; private ending = false; private p = v3(); private tmp = v3();
  constructor(private ctx: FxContext, private follow: [number, string][], private until: number) {
    const disc = new CylinderGeometry(0.055, 0.055, 0.012, 32); disc.rotateX(Math.PI / 2);
    const rim = new CylinderGeometry(0.062, 0.062, 0.008, 32); rim.rotateX(Math.PI / 2);
    const ribbonL = new PlaneGeometry(0.03, 0.09); ribbonL.translate(-0.018, 0.08, -0.008);
    const ribbonR = new PlaneGeometry(0.03, 0.09); ribbonR.translate(0.018, 0.08, -0.009);
    const star = new PlaneGeometry(0.06, 0.06); star.translate(0, 0, 0.0075);
    const add = (geo: BufferGeometry, mat: MeshBasicMaterial) => { this.geos.push(geo); this.mats.push(mat); const m = new Mesh(geo, mat); m.renderOrder = 13; this.g.add(m); return m; };
    add(rim, new MeshBasicMaterial({ color: new Color('#E0A21F') }));
    add(disc, new MeshBasicMaterial({ color: new Color(LQ.gold) }));
    add(ribbonL, new MeshBasicMaterial({ color: new Color(LQ.teal), side: DoubleSide }));
    add(ribbonR, new MeshBasicMaterial({ color: new Color(LQ.orange), side: DoubleSide }));
    add(star, new MeshBasicMaterial({ map: acquireTex('star'), color: new Color('#FFF4CF'), transparent: true }));
    this.g.name = 'FX_PROP_medal'; this.g.userData.fxProp = true; this.g.scale.setScalar(0.001);
    ctx.layer('props').add(this.g);
  }
  update(dt: number) {
    this.t += dt; if (this.t > this.until) this.ending = true;
    const mode = [...this.follow].reverse().find(([t]) => this.t >= t)?.[1] ?? 'front_rise';
    const tgt = this.tmp;
    if (mode === 'front_rise') { const u = smooth01(this.t / 0.7); tgt.set(0, 0.28 + 0.26 * u, 0.36); this.g.rotation.y = (1 - u) * Math.PI * 2; }
    else if (mode === 'paws') { this.ctx.anchor('paws', tgt).add(v3(0, 0.07, 0.2)); /* in front of the belly: the paws sit inside the torso silhouette */ this.g.rotation.y *= 0.85; }
    else { const k = this.t - (this.follow.find(([, m]) => m === 'fly_away')?.[0] ?? this.t); tgt.copy(this.p).add(v3(0.1 * k, 0.9 * k, 0.05 * k)); this.g.rotation.y += dt * 9; }
    this.p.lerp(tgt, mode === 'paws' ? 1 - Math.exp(-18 * dt) : 1);
    this.g.position.copy(this.p);
    this.s = this.ending ? Math.max(0, this.s - dt / 0.25) : Math.min(1, this.s + dt / 0.3);
    this.g.scale.setScalar(Math.max(0.001, 1.3 * easeOutBack(this.s)));
    return !(this.ending && this.s <= 0);
  }
  stop() { this.ending = true; }
  dispose() { this.g.removeFromParent(); this.geos.forEach(g => g.dispose()); this.mats.forEach(m => m.dispose()); releaseTex('star'); }
}

export type { Object3D };
