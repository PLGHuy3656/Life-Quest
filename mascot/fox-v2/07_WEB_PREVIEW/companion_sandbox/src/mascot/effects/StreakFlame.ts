import { Color, DoubleSide, Group, Mesh, NormalBlending, PlaneGeometry, ShaderMaterial, Sprite, SpriteMaterial, Vector3, type Camera } from 'three';
import { STREAK_TIER_COLORS, type FoxStreakTier } from '../foxContract';
import { smooth } from '../foxMath';
import { FxParticles, acquireTex, releaseTex, type FxContext } from './fxCore';

// The streak flame: a small procedural flame floating beside the Fox (not on it), in the four
// LifeQuest streak tiers. Billboarded shader quad + additive glow + rising embers. It is a separate
// object under the fx root: removable, never part of the Fox mesh or material.
// States: hidden → lit (loop) → flicker / flare → extinguish (shrinks, greys out, smoke) → hidden.

const VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const FRAG = /* glsl */`
uniform float uTime, uIntensity, uOut, uFlicker; uniform vec3 uCore, uMid, uEdge; varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*n2(p); p*=2.03; a*=0.5; } return s; }
void main(){
  float y = vUv.y; float x = vUv.x * 2.0 - 1.0;
  float n = fbm(vec2(x * 2.2, y * 3.2 - uTime * 2.6));
  float lick = fbm(vec2(x * 4.0 + 7.0, y * 5.0 - uTime * 4.1));
  float w = mix(0.92, 0.07, pow(y, 1.35)) * (0.85 + 0.3 * n);
  float d = abs(x + (n - 0.5) * 0.4 * y) / max(w, 0.02);
  float body = 1.0 - smoothstep(0.72, 1.0, d);
  float base = smoothstep(0.0, 0.16, y);
  float top = 1.0 - smoothstep(0.5 + 0.38 * lick, 0.98, y);
  float a = body * base * top * uIntensity * (1.0 - 0.35 * uFlicker * n);
  float heat = clamp((1.0 - d) * (1.2 - y), 0.0, 1.0);
  // light UIs: keep the body in the saturated tier colours, only a small bright core near the base
  vec3 col = mix(uEdge, uMid, smoothstep(0.0, 0.3, heat));
  col = mix(col, mix(uMid, uCore, 0.75), smoothstep(0.55, 0.9, heat) * (1.0 - smoothstep(0.35, 0.7, y)));
  a = min(1.0, a * 1.25);
  col = mix(col, vec3(0.42, 0.40, 0.40), uOut);
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

export class StreakFlame {
  readonly group = new Group();
  private mesh: Mesh; private mat: ShaderMaterial; private glow: Sprite; private glowMat: SpriteMaterial;
  private tier: FoxStreakTier = 'orange';
  private target = { core: new Color(), mid: new Color(), edge: new Color() };
  private t = 0; private lit = 0; private litTarget = 0; private out = 0; private flare = 0; private flareT = 0; private flicker = 0;
  private embersT = 0; private embers: FxParticles[] = [];
  private tmp = new Vector3();
  extinguishing = false;
  /** Beside the head, in front of the ear silhouette (3/4 and front views), inside every frame margin. */
  readonly base = new Vector3(0.45, 0.6, 0.22);

  constructor(private ctx: FxContext) {
    this.group.name = 'FX_streak_flame';
    this.mat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: DoubleSide,
      uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 }, uOut: { value: 0 }, uFlicker: { value: 0 }, uCore: { value: new Color() }, uMid: { value: new Color() }, uEdge: { value: new Color() } } });
    const g = new PlaneGeometry(0.2, 0.3); g.translate(0, 0.13, 0);
    this.mesh = new Mesh(g, this.mat); this.mesh.renderOrder = 15; this.mesh.name = 'FX_flame_core';
    this.mesh.onBeforeRender = (_r, _s, cam: Camera) => {   // billboard around the vertical axis (keeps the flame upright)
      const v = this.tmp; cam.getWorldPosition(v); this.mesh.parent!.worldToLocal(v);
      this.mesh.rotation.set(0, Math.atan2(v.x - this.mesh.position.x, v.z - this.mesh.position.z), 0);
    };
    this.glowMat = new SpriteMaterial({ map: acquireTex('soft'), transparent: true, depthWrite: false, blending: NormalBlending, opacity: 0 });
    this.glow = new Sprite(this.glowMat); this.glow.scale.set(0.34, 0.34, 1); this.glow.position.y = 0.11; this.glow.renderOrder = 14;
    this.group.add(this.glow, this.mesh);
    this.group.position.copy(this.base);
    this.group.visible = false;
    this.setTier('orange', true);
    ctx.layer('flame').add(this.group);
  }

  setTier(tier: FoxStreakTier, instant = false) {
    this.tier = tier;
    const c = STREAK_TIER_COLORS[tier];
    this.target.core.set(c.core); this.target.mid.set(c.mid); this.target.edge.set(c.edge);
    if (instant) { (this.mat.uniforms.uCore.value as Color).copy(this.target.core); (this.mat.uniforms.uMid.value as Color).copy(this.target.mid); (this.mat.uniforms.uEdge.value as Color).copy(this.target.edge); }
  }
  getTier() { return this.tier; }
  get visible() { return this.group.visible && this.lit > 0.02; }
  /** Uniform colours currently shown (tests). */
  colors() { return { core: '#' + (this.mat.uniforms.uCore.value as Color).getHexString(), mid: '#' + (this.mat.uniforms.uMid.value as Color).getHexString(), edge: '#' + (this.mat.uniforms.uEdge.value as Color).getHexString() }; }

  ignite() { this.extinguishing = false; this.out = 0; this.litTarget = 1; this.group.visible = true; }
  hide() { this.litTarget = 0; }
  setFlicker(on: boolean) { this.flicker = on ? 1 : 0; }
  flareUp(duration: number) { this.flare = 1; this.flareT = duration; }
  extinguish() { this.extinguishing = true; this.litTarget = 0; }
  worldAnchor(out: Vector3) { return out.copy(this.group.position).add(new Vector3(0, 0.12, 0)); }

  update(dt: number) {
    this.t += dt;
    const u = this.mat.uniforms;
    u.uTime.value = this.t * (this.ctx.reducedMotion ? 0.45 : 1);
    for (const k of ['uCore', 'uMid', 'uEdge'] as const) (u[k].value as Color).lerp(this.target[k === 'uCore' ? 'core' : k === 'uMid' ? 'mid' : 'edge'], 1 - Math.exp(-6 * dt));
    if (this.extinguishing) { this.out = Math.min(1, this.out + dt / 0.35); this.lit = Math.max(0, this.lit - dt / 0.5); }
    else this.lit = smooth(this.lit, this.litTarget, 7, dt);
    if (this.flareT > 0) { this.flareT -= dt; if (this.flareT <= 0) this.flare = 0; }
    const flare = this.flareT > 0 ? Math.sin(Math.min(1, this.flareT) * Math.PI) * this.flare : 0;
    const flick = this.flicker ? 0.55 + 0.45 * Math.abs(Math.sin(this.t * 23) * Math.sin(this.t * 7.3)) : 1;
    const bob = this.ctx.reducedMotion ? 0 : Math.sin(this.t * 2.2) * 0.012;
    const scale = this.lit * (1 + 0.75 * flare) * (this.extinguishing ? 1 - 0.5 * this.out : 1);
    this.group.position.set(this.base.x, this.base.y + bob, this.base.z);
    this.mesh.scale.setScalar(Math.max(0.001, scale));
    u.uIntensity.value = Math.min(1, this.lit * 1.15) * flick;
    u.uOut.value = this.out; u.uFlicker.value = this.flicker;
    this.glowMat.color.copy(u.uMid.value as Color);
    this.glowMat.opacity = 0.32 * this.lit * flick * (1 + 0.6 * flare) * (1 - this.out);
    this.glow.scale.setScalar(0.34 * (0.8 + 0.4 * scale));
    if (this.lit < 0.01 && this.litTarget === 0) this.group.visible = false;
    // embers (small, sparse; fewer under reduced motion)
    this.embersT -= dt;
    if (this.group.visible && this.lit > 0.5 && !this.extinguishing && this.embersT <= 0) {
      this.embersT = this.ctx.reducedMotion ? 1.2 : 0.45 - 0.3 * flare;
      const p0 = this.group.position.clone();
      const mid = '#' + (u.uMid.value as Color).getHexString(), core = '#' + (u.uCore.value as Color).getHexString();
      this.embers.push(new FxParticles('flame', { count: flare > 0.1 ? 6 : 2, tex: 'soft', colors: [mid, core], additive: true, life: [0.6, 1.1], size: [0.012, 0.022],
        spawn: (_i, p, v, r) => { p.copy(p0).add(new Vector3((r() - 0.5) * 0.06, 0.08 + r() * 0.06, (r() - 0.5) * 0.04)); v.set((r() - 0.5) * 0.08, 0.18 + r() * 0.12, (r() - 0.5) * 0.05); },
        drag: 0.8, grow: 0.4 }, this.ctx, this.ctx.layer('flame')));
    }
    this.embers = this.embers.filter(e => { const alive = e.update(dt); if (!alive) e.dispose(); return alive; });
  }

  dispose() {
    this.embers.forEach(e => e.dispose()); this.embers = [];
    this.group.removeFromParent(); this.mesh.geometry.dispose(); this.mat.dispose(); this.glowMat.dispose(); releaseTex('soft');
  }
}
