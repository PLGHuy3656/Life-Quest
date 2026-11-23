import {
  BufferAttribute, BufferGeometry, Color, DoubleSide, Group, Mesh, NormalBlending, Points, Quaternion, ShaderMaterial, Sprite, SpriteMaterial,
  Vector2, Vector3, type Bone, type Camera, type Object3D, type WebGLRenderer,
} from 'three';
import { FLAME_SOCKET, STREAK_TIER_COLORS, type FoxStreakTier } from '../foxContract';
import { smooth } from '../foxMath';
import { acquireTex, releaseTex, type FxContext } from './fxCore';

// Gate G1.1 — the streak flame is HELD by the Fox.
// * Attachment: every frame the flame base is placed at a palm offset expressed in the LOCAL space of
//   the ATT_HAND_L socket (child of PAW_L), converted to fx-root space. It therefore follows the paw in
//   every clip (streak loop, cheer, petting, walk …) and keeps its placement at every level scale
//   (the fx root carries the level scale; the offset is scaled by the Fox's uniform world scale only,
//   so the exporter's squash-compensation scale on leaf bones never stretches it).
// * The flame body stays upright (flames rise) and leans against the paw's motion (spring), which
//   reads as the fox carrying it.
// * Look: one mesh with three stacked layers (outer tongues, mid, core) in a cel-banded procedural
//   shader (one draw call), a soft glow sprite (one) and a recycled ember emitter (one Points, 14 max).
// States: hidden → lit (loop) → sputter (irregular) / flare (temporary growth, same flame) →
//         snuff (instant, lightning) or extinguish (gentle) → hidden.

const VERT = /* glsl */`
attribute float aLayer; varying vec2 vUv; varying float vLayer;
uniform float uLean;
void main(){
  vUv = uv; vLayer = aLayer;
  vec3 p = position;
  p.x += uLean * p.y * p.y * 2.2;                       // tip leans, base stays in the palm
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const FRAG = /* glsl */`
uniform float uTime, uIntensity, uOut, uSputter, uSeed; uniform vec3 uCore, uMid, uEdge; varying vec2 vUv; varying float vLayer;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<3;i++){ s+=a*n2(p); p*=2.07; a*=0.5; } return s; }
// stylised flame silhouette: a rounded teardrop body plus two animated side tongues (union),
// all licking upward with a noise wobble that grows towards the tip
float tear(vec2 p, float x0, float y0, float w, float h){
  float y = (p.y - y0) / h; if (y <= 0.0 || y >= 1.0) return 0.0;
  float width = w * pow(sin(1.5708 * min(1.0, y * 2.2)), 0.55) * pow(1.0 - y, 0.85);
  return 1.0 - smoothstep(0.82, 1.0, abs(p.x - x0) / max(width, 0.01));
}
float shape(vec2 uv, float t, float k, float speed){
  vec2 p = vec2(uv.x * 2.0 - 1.0, uv.y);
  p.x += (fbm(vec2(p.y * 2.4 - t * speed, k * 3.1 + uSeed)) - 0.5) * 0.5 * p.y;
  float main = tear(p, 0.0, 0.0, 0.86, 0.9 + 0.08 * sin(t * 4.3 + k));
  float l = tear(p, -0.42, 0.14, 0.36, 0.5 + 0.12 * sin(t * 3.1 + k * 1.7));
  float r = tear(p, 0.44, 0.1, 0.34, 0.58 + 0.1 * sin(t * 2.6 + 1.3 + k));
  float m = max(main, max(l, r));
  return m * smoothstep(0.0, 0.03, uv.y);
}
void main(){
  float L = vLayer;                                   // 0 outer · 1 mid · 2 core
  float t = uTime;
  float m = shape(vUv, t, L, 2.2 + 0.7 * L);
  float sp = uSputter * (0.5 + 0.5 * sin(t * 37.0 + uSeed)) * step(0.55, n2(vec2(t * 9.0, 1.7)));   // irregular gutter
  float a = m * uIntensity * (1.0 - 0.55 * sp);
  if (a < 0.02) discard;
  vec3 col = L < 0.5 ? uEdge : (L < 1.5 ? uMid : mix(uMid, uCore, 0.85));
  // cel shading: a darker rim on the outer layer for readability on light UIs
  if (L < 0.5) col *= mix(0.78, 1.0, smoothstep(0.2, 0.6, m));
  col = mix(col, vec3(0.42, 0.40, 0.40), uOut);
  gl_FragColor = vec4(col, min(1.0, a * (L < 0.5 ? 1.15 : 1.35)));
  #include <colorspace_fragment>
}`;
const E_VERT = /* glsl */`
attribute float aAlpha; attribute float aSize; uniform float uHalfH; varying float vA;
void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
  float s = length(modelMatrix[1].xyz); gl_PointSize = aSize * s * projectionMatrix[1][1] * uHalfH / max(0.05, -mv.z); }`;
const E_FRAG = /* glsl */`
uniform sampler2D uMap; uniform vec3 uCol; uniform vec3 uCol2; varying float vA;
void main(){ vec4 t = texture2D(uMap, gl_PointCoord); float a = t.a * vA; if (a < 0.01) discard; gl_FragColor = vec4(mix(uCol2, uCol, vA), a);
  #include <colorspace_fragment>
}`;

const W = 0.17, H = 0.27;                             // flame size at scale 1 (in the palm of the chibi paw)
const EMBERS = 14;
const tmpV2 = new Vector2();

export class StreakFlame {
  readonly group = new Group();
  private body: Group; private mesh: Mesh; private mat: ShaderMaterial; private glow: Sprite; private glowMat: SpriteMaterial;
  private embers: Points; private eMat: ShaderMaterial; private ePos: Float32Array; private eVel: Float32Array; private eAge: Float32Array; private eLife: Float32Array;
  private tier: FoxStreakTier = 'orange';
  private target = { core: new Color(), mid: new Color(), edge: new Color() };
  private t = 0; private lit = 0; private litTarget = 0; private out = 0;
  private flareT = 0; private flareDur = 1; private flareScale = 1.8; private sputter = 0; private snuffT = -1;
  private emitT = 0; private eNext = 0;
  private lean = 0; private leanV = 0; private prev = new Vector3(); private hasPrev = false;
  private v = new Vector3(); private q = new Quaternion(); private s = new Vector3(); private off = new Vector3(...FLAME_SOCKET.offset);
  extinguishing = false;

  constructor(private ctx: FxContext, private socket: Bone | undefined, private root: Object3D) {
    this.group.name = 'FX_streak_flame';
    this.body = new Group(); this.body.name = 'FX_flame_body';
    // three layered quads (outer tongues, mid, core), one geometry / one draw call
    const g = new BufferGeometry();
    const pos: number[] = [], uv: number[] = [], layer: number[] = [], idx: number[] = [];
    const L = [[1.0, 1.0, 0], [0.74, 0.82, 0.002], [0.44, 0.56, 0.004]];
    L.forEach(([sw, sh, z], i) => {
      const w = (W * sw) / 2, hh = H * sh, b = pos.length / 3;
      pos.push(-w, 0, z, w, 0, z, w, hh, z, -w, hh, z); uv.push(0, 0, 1, 0, 1, 1, 0, 1); layer.push(i, i, i, i);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
    g.setAttribute('aLayer', new BufferAttribute(new Float32Array(layer), 1));
    g.setIndex(idx);
    this.mat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: DoubleSide,
      uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 }, uOut: { value: 0 }, uSputter: { value: 0 }, uLean: { value: 0 }, uSeed: { value: 3.7 },
        uCore: { value: new Color() }, uMid: { value: new Color() }, uEdge: { value: new Color() } } });
    this.mesh = new Mesh(g, this.mat); this.mesh.renderOrder = 15; this.mesh.name = 'FX_flame_layers'; this.mesh.raycast = () => {};
    this.mesh.onBeforeRender = (_r, _s, cam: Camera) => {   // billboard about the vertical axis: the flame always stands upright
      const v = this.v; cam.getWorldPosition(v); this.group.worldToLocal(v);
      this.body.rotation.set(0, Math.atan2(v.x, v.z), 0);
    };
    this.glowMat = new SpriteMaterial({ map: acquireTex('soft'), transparent: true, depthWrite: false, blending: NormalBlending, opacity: 0 });
    this.glow = new Sprite(this.glowMat); this.glow.position.y = H * 0.32; this.glow.renderOrder = 14; this.glow.name = 'FX_flame_glow';
    // recycled embers (one draw call, never re-allocated)
    this.ePos = new Float32Array(EMBERS * 3); this.eVel = new Float32Array(EMBERS * 3); this.eAge = new Float32Array(EMBERS).fill(9); this.eLife = new Float32Array(EMBERS).fill(1);
    const eg = new BufferGeometry();
    eg.setAttribute('position', new BufferAttribute(this.ePos, 3));
    eg.setAttribute('aAlpha', new BufferAttribute(new Float32Array(EMBERS), 1));
    eg.setAttribute('aSize', new BufferAttribute(new Float32Array(EMBERS), 1));
    this.eMat = new ShaderMaterial({ vertexShader: E_VERT, fragmentShader: E_FRAG, transparent: true, depthWrite: false,
      uniforms: { uMap: { value: acquireTex('soft') }, uHalfH: { value: 300 }, uCol: { value: new Color() }, uCol2: { value: new Color() } } });
    this.embers = new Points(eg, this.eMat); this.embers.frustumCulled = false; this.embers.renderOrder = 16; this.embers.name = 'FX_flame_embers';
    this.embers.onBeforeRender = (r: WebGLRenderer) => { r.getDrawingBufferSize(tmpV2); this.eMat.uniforms.uHalfH.value = tmpV2.y * 0.5; };
    this.body.add(this.mesh);
    this.group.add(this.glow, this.body);
    ctx.layer('flame').add(this.group, this.embers);          // embers live in fx-root space (they stay behind when the paw moves)
    this.group.visible = false; this.embers.visible = false;
    this.setTier('orange', true);
    this.follow();
  }

  // ---------------------------------------------------------------- attachment
  /** Socket point: palm offset in ATT_HAND_L local space → fx-root space. */
  private follow() {
    const p = this.group.position;
    if (!this.socket) { p.set(...FLAME_SOCKET.fallback); return; }
    this.socket.getWorldPosition(this.v); this.socket.getWorldQuaternion(this.q); this.root.getWorldScale(this.s);
    this.v.add(this.off.set(...FLAME_SOCKET.offset).applyQuaternion(this.q).multiplyScalar(this.s.y));   // bone-local offset, Fox scale only
    this.root.worldToLocal(p.copy(this.v));
  }
  /** fx-root position of the flame centre (anchor for lightning, smoke, sparkle). */
  worldAnchor(out: Vector3) { return out.copy(this.group.position).add(this.v.set(0, H * 0.4 * this.sizeNow(), 0)); }
  /** Base of the flame (palm point) in fx-root space — tests use it for the attachment check. */
  basePoint(out: Vector3) { return out.copy(this.group.position); }

  // ---------------------------------------------------------------- state
  setTier(tier: FoxStreakTier, instant = false) {
    this.tier = tier;
    const c = STREAK_TIER_COLORS[tier];
    this.target.core.set(c.core); this.target.mid.set(c.mid); this.target.edge.set(c.edge);
    if (instant) for (const k of ['core', 'mid', 'edge'] as const) (this.uni(k)).copy(this.target[k]);
  }
  private uni(k: 'core' | 'mid' | 'edge') { return this.mat.uniforms[k === 'core' ? 'uCore' : k === 'mid' ? 'uMid' : 'uEdge'].value as Color; }
  getTier() { return this.tier; }
  get visible() { return this.group.visible && this.lit > 0.02; }
  get flaring() { return this.flareT > 0; }
  colors() { return { core: '#' + this.uni('core').getHexString(), mid: '#' + this.uni('mid').getHexString(), edge: '#' + this.uni('edge').getHexString() }; }

  ignite() { this.extinguishing = false; this.snuffT = -1; this.out = 0; this.litTarget = 1; this.group.visible = true; this.embers.visible = true; this.follow(); }
  hide() { this.litTarget = 0; }
  setFlicker(on: boolean) { this.sputter = on ? 1 : 0; }
  /** Temporary growth of the SAME flame (no duplicate); returns to the tier size afterwards. */
  flareUp(duration: number, scale = 1.8) { this.flareDur = Math.max(0.2, duration); this.flareT = this.flareDur; this.flareScale = scale; }
  /** Lightning: out at once (≈ 0.1 s collapse). */
  snuff() { this.extinguishing = true; this.litTarget = 0; this.snuffT = 0; this.sputter = 0; this.flareT = 0; }
  /** Gentle put-out (reduced motion). */
  extinguish() { this.extinguishing = true; this.litTarget = 0; }

  private sizeNow() {
    const u = this.flareT > 0 ? 1 - this.flareT / this.flareDur : 1;
    const flare = this.flareT > 0 ? Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 0.8 : 0;   // grows fast, settles slowly
    return this.lit * (1 + (this.flareScale - 1) * flare);
  }

  update(dt: number) {
    this.t += dt;
    // hidden (no streak): no work at all — in particular no forced world-matrix update of the paw chain,
    // so a Fox without an active streak behaves exactly like Gate F / G1 (look-at timing included)
    if (!this.group.visible && !this.embers.visible && this.litTarget === 0) { this.hasPrev = false; return; }
    const u = this.mat.uniforms, rm = this.ctx.reducedMotion;
    u.uTime.value = this.t * (rm ? 0.45 : 1);
    for (const k of ['core', 'mid', 'edge'] as const) this.uni(k).lerp(this.target[k], 1 - Math.exp(-6 * dt));
    if (this.snuffT >= 0) { this.snuffT += dt; this.lit = Math.max(0, 1 - this.snuffT / 0.1); this.out = Math.min(1, this.snuffT / 0.06); }
    else if (this.extinguishing) { this.out = Math.min(1, this.out + dt / 0.35); this.lit = Math.max(0, this.lit - dt / 0.5); }
    else this.lit = smooth(this.lit, this.litTarget, 7, dt);
    if (this.flareT > 0) this.flareT = Math.max(0, this.flareT - dt);
    // attachment + lean (spring against the paw velocity)
    this.follow();
    const p = this.group.position;
    if (this.hasPrev && dt > 0) {
      const vx = (p.x - this.prev.x) / dt;
      const target = Math.max(-0.35, Math.min(0.35, -vx * 0.9));
      this.leanV += ((target - this.lean) * 60 - this.leanV * 9) * dt; this.lean += this.leanV * dt;
    }
    this.prev.copy(p); this.hasPrev = true;
    u.uLean.value = rm ? 0 : this.lean;
    // irregular sputter: intensity dips at random-looking moments (deterministic in time)
    const sp = this.sputter ? Math.max(0, Math.sin(this.t * 13.7) * Math.sin(this.t * 5.3 + 1.1)) : 0;
    const gutter = this.sputter ? (Math.sin(this.t * 31) > 0.6 ? 0.45 : 1) * (1 - 0.5 * sp) : 1;
    const breathe = rm ? 1 : 1 + 0.04 * Math.sin(this.t * 3.1) + 0.025 * Math.sin(this.t * 7.9);
    const size = Math.max(0.001, this.sizeNow() * breathe * (this.sputter ? 0.85 + 0.15 * gutter : 1));
    this.body.scale.set(size * (1 + 0.04 * Math.sin(this.t * 5.7)), size, size);
    u.uIntensity.value = Math.min(1, this.lit * 1.1) * gutter;
    u.uOut.value = this.out; u.uSputter.value = this.sputter;
    this.glowMat.color.copy(this.uni('mid'));
    const flareGlow = this.flareT > 0 ? 0.6 : 0;
    this.glowMat.opacity = 0.3 * this.lit * gutter * (1 + flareGlow) * (1 - this.out);
    this.glow.scale.setScalar(0.3 * (0.7 + 0.5 * size));
    this.glow.position.y = H * 0.32 * size;
    if (this.lit < 0.01 && this.litTarget === 0) this.group.visible = false;
    this.updateEmbers(dt, size);
  }

  private updateEmbers(dt: number, size: number) {
    const rm = this.ctx.reducedMotion, aA = this.embers.geometry.getAttribute('aAlpha') as BufferAttribute, aS = this.embers.geometry.getAttribute('aSize') as BufferAttribute;
    (this.eMat.uniforms.uCol.value as Color).copy(this.uni('core')); (this.eMat.uniforms.uCol2.value as Color).copy(this.uni('mid'));
    this.emitT -= dt;
    const emitting = this.group.visible && this.lit > 0.5 && !this.extinguishing;
    if (emitting && this.emitT <= 0) {
      this.emitT = (rm ? 0.6 : 0.16) / (this.flareT > 0 ? 2.5 : 1);
      const i = this.eNext; this.eNext = (this.eNext + 1) % EMBERS;
      const r = this.ctx.rnd, p = this.group.position;
      this.ePos[i * 3] = p.x + (r() - 0.5) * 0.05 * size; this.ePos[i * 3 + 1] = p.y + H * (0.35 + 0.3 * r()) * size; this.ePos[i * 3 + 2] = p.z + (r() - 0.5) * 0.04;
      this.eVel[i * 3] = (r() - 0.5) * 0.08; this.eVel[i * 3 + 1] = 0.16 + r() * 0.12; this.eVel[i * 3 + 2] = (r() - 0.5) * 0.05;
      this.eAge[i] = 0; this.eLife[i] = 0.55 + r() * 0.5;
    }
    let any = false;
    for (let i = 0; i < EMBERS; i++) {
      this.eAge[i] += dt;
      const u = this.eAge[i] / this.eLife[i];
      if (u >= 1) { aA.array[i] = 0; continue; }
      any = true;
      const k = i * 3, wob = Math.sin((this.t + i) * 9) * 0.03;
      this.ePos[k] += (this.eVel[k] + wob) * dt; this.ePos[k + 1] += this.eVel[k + 1] * dt; this.ePos[k + 2] += this.eVel[k + 2] * dt;
      aA.array[i] = Math.min(1, u * 8) * (1 - u) * (1 - this.out);
      aS.array[i] = 0.016 * (1 - 0.5 * u);
    }
    (this.embers.geometry.getAttribute('position') as BufferAttribute).needsUpdate = true; aA.needsUpdate = aS.needsUpdate = true;
    this.embers.visible = any || emitting;
  }

  dispose() {
    this.group.removeFromParent(); this.embers.removeFromParent();
    this.mesh.geometry.dispose(); this.mat.dispose(); this.glowMat.dispose(); this.embers.geometry.dispose(); this.eMat.dispose();
    releaseTex('soft'); releaseTex('soft');
  }
}
