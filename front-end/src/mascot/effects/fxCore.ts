import {
  BufferAttribute, BufferGeometry, CanvasTexture, Color, NormalBlending, Object3D, Points, ShaderMaterial,
  SRGBColorSpace, Sprite, SpriteMaterial, Texture, Vector2, Vector3, type WebGLRenderer,
} from 'three';

// Shared building blocks for the Fox runtime effects. Everything here is created on demand,
// owned by an effect, and disposed when that effect ends. Nothing touches the Fox materials.

export type FxCategory = 'flame' | 'lightning' | 'char' | 'particles' | 'props' | 'text';
export const FX_CATEGORIES: readonly FxCategory[] = ['flame', 'lightning', 'char', 'particles', 'props', 'text'];

export interface FxContext {
  /** Anchor in fx-root local space (= Fox local space at level scale 1). */
  anchor(name: string, out: Vector3): Vector3;
  layer(cat: FxCategory): Object3D;
  reducedMotion: boolean;
  rnd(): number;
}

export interface Fx {
  readonly category: FxCategory;
  /** Owner (one-shot tag) — interrupted clips stop their effects quickly. */
  owner?: string;
  /** Returns false when finished (the manager then disposes it). */
  update(dt: number): boolean;
  /** Begin a quick fade-out (interrupted / cancelled). */
  stop(fast?: boolean): void;
  dispose(): void;
}

// ------------------------------------------------------------------ shared textures (refcounted)
type TexKey = 'soft' | 'star' | 'spark' | 'ring' | 'rect' | 'drop' | 'heart';   // 'heart': Gate G3 social particles
const texCache = new Map<TexKey, { tex: Texture; refs: number }>();
function drawTex(key: TexKey): Texture {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!;
  g.translate(32, 32);
  if (key === 'soft') { const r = g.createRadialGradient(0, 0, 0, 0, 0, 31); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(-32, -32, 64, 64); }
  if (key === 'star') { g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 11 : 28; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); }
  if (key === 'spark') { g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, r = i % 2 ? 5 : 30; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); const r = g.createRadialGradient(0, 0, 0, 0, 0, 12); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(-12, -12, 24, 24); }
  if (key === 'ring') { g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 26, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 0.35; g.lineWidth = 12; g.stroke(); }
  if (key === 'rect') { g.fillStyle = '#fff'; g.fillRect(-14, -24, 28, 48); }
  if (key === 'heart') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, 24); g.bezierCurveTo(-34, 2, -26, -28, 0, -12); g.bezierCurveTo(26, -28, 34, 2, 0, 24); g.fill(); }
  if (key === 'drop') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -28); g.quadraticCurveTo(14, 4, 0, 26); g.quadraticCurveTo(-14, 4, 0, -28); g.fill(); }
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}
export function acquireTex(key: TexKey) { let e = texCache.get(key); if (!e) { e = { tex: drawTex(key), refs: 0 }; texCache.set(key, e); } e.refs++; return e.tex; }
export function releaseTex(key: TexKey) { const e = texCache.get(key); if (!e) return; if (--e.refs <= 0) { e.tex.dispose(); texCache.delete(key); } }
export const sharedTextureCount = () => texCache.size;
/** Module-wide effect textures (tracked by FoxRenderBinding so unmounted renderers are not retained). */
export const sharedFxTextures = (): Texture[] => [...texCache.values()].map(e => e.tex);

// ------------------------------------------------------------------ particle renderer (one shader for every burst)
const P_VERT = /* glsl */`
attribute vec3 aColor; attribute float aAlpha; attribute float aSize; attribute float aRot;
uniform float uHalfH; varying vec3 vColor; varying float vAlpha; varying float vRot;
void main() {
  vColor = aColor; vAlpha = aAlpha; vRot = aRot;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float s = length(modelMatrix[1].xyz);                       // follows the level scale
  gl_PointSize = aSize * s * projectionMatrix[1][1] * uHalfH / max(0.05, -mv.z);
}`;
const P_FRAG = /* glsl */`
uniform sampler2D uMap; varying vec3 vColor; varying float vAlpha; varying float vRot;
void main() {
  vec2 c = gl_PointCoord - 0.5; float cs = cos(vRot), sn = sin(vRot);
  vec2 uv = vec2(cs * c.x - sn * c.y, sn * c.x + cs * c.y) + 0.5;
  vec4 t = texture2D(uMap, uv);
  if (t.a * vAlpha < 0.01) discard;
  gl_FragColor = vec4(vColor * t.rgb, t.a * vAlpha);
  #include <colorspace_fragment>
}`;
const tmpV2 = new Vector2();

export interface ParticleSpec {
  count: number; tex: TexKey; colors: string[]; additive?: boolean;
  life: [number, number]; size: [number, number];
  spawn(i: number, p: Vector3, v: Vector3, rnd: () => number): void;
  gravity?: number; drag?: number; spin?: number; delay?: [number, number];
  grow?: number; fadeIn?: number;
  /** Path mode (XP orbs): position along a curve instead of physics. u = 0..1 */
  path?(i: number, u: number, out: Vector3): void;
  onArrive?(i: number): void;
  /** G1.1: per-particle base size (e.g. orb head vs trail). */
  sizeFn?(i: number): number;
}

export class FxParticles implements Fx {
  owner?: string;
  readonly points: Points;
  private n: number; private pos: Float32Array; private vel: Float32Array; private life: Float32Array; private age: Float32Array;
  private size0: Float32Array; private rot: Float32Array; private spinv: Float32Array; private arrived: Uint8Array;
  private aAlpha: BufferAttribute; private aSize: BufferAttribute; private aRot: BufferAttribute; private aPos: BufferAttribute;
  private fading = 1; private stopping = false;
  constructor(readonly category: FxCategory, private spec: ParticleSpec, ctx: FxContext, parent: Object3D) {
    const n = (this.n = Math.max(1, Math.round(spec.count * (ctx.reducedMotion ? 0.5 : 1))));
    this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.age = new Float32Array(n);
    this.size0 = new Float32Array(n); this.rot = new Float32Array(n); this.spinv = new Float32Array(n); this.arrived = new Uint8Array(n);
    const col = new Float32Array(n * 3), p = new Vector3(), v = new Vector3(), c = new Color(), rnd = ctx.rnd;
    for (let i = 0; i < n; i++) {
      spec.spawn(i, p, v, rnd); p.toArray(this.pos, i * 3); v.toArray(this.vel, i * 3);
      this.life[i] = spec.life[0] + (spec.life[1] - spec.life[0]) * rnd();
      this.age[i] = spec.delay ? -(spec.delay[0] + (spec.delay[1] - spec.delay[0]) * rnd()) : 0;
      this.size0[i] = spec.sizeFn ? spec.sizeFn(i) : spec.size[0] + (spec.size[1] - spec.size[0]) * rnd();
      this.rot[i] = rnd() * Math.PI * 2; this.spinv[i] = (rnd() - 0.5) * 2 * (spec.spin ?? 0);
      c.set(spec.colors[Math.floor(rnd() * spec.colors.length)]); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const g = new BufferGeometry();
    g.setAttribute('position', (this.aPos = new BufferAttribute(this.pos, 3)));
    g.setAttribute('aColor', new BufferAttribute(col, 3));
    g.setAttribute('aAlpha', (this.aAlpha = new BufferAttribute(new Float32Array(n), 1)));
    g.setAttribute('aSize', (this.aSize = new BufferAttribute(new Float32Array(n), 1)));
    g.setAttribute('aRot', (this.aRot = new BufferAttribute(this.rot, 1)));
    const m = new ShaderMaterial({ vertexShader: P_VERT, fragmentShader: P_FRAG, transparent: true, depthWrite: false,
      blending: NormalBlending, uniforms: { uMap: { value: acquireTex(spec.tex) }, uHalfH: { value: 300 } } });
    this.points = new Points(g, m); this.points.frustumCulled = false; this.points.renderOrder = 20; this.points.name = 'FX_particles';
    this.points.onBeforeRender = (r: WebGLRenderer) => { r.getDrawingBufferSize(tmpV2); m.uniforms.uHalfH.value = tmpV2.y * 0.5; };
    parent.add(this.points);
    this.update(0);
  }
  update(dt: number) {
    const s = this.spec, g = s.gravity ?? 0, drag = s.drag ?? 0, tmp = new Vector3();
    if (this.stopping) this.fading = Math.max(0, this.fading - dt / 0.25);
    let alive = 0;
    for (let i = 0; i < this.n; i++) {
      this.age[i] += dt;
      const a = this.age[i], L = this.life[i], u = a / L;
      if (a < 0 || u >= 1) { this.aAlpha.array[i] = 0; if (a < 0) alive++; continue; }
      alive++;
      const k = i * 3;
      if (s.path) { s.path(i, u, tmp); this.pos[k] = tmp.x; this.pos[k + 1] = tmp.y; this.pos[k + 2] = tmp.z; if (u > 0.97 && !this.arrived[i]) { this.arrived[i] = 1; s.onArrive?.(i); } }
      else {
        this.vel[k + 1] -= g * dt;
        const d = Math.exp(-drag * dt); this.vel[k] *= d; this.vel[k + 1] *= d; this.vel[k + 2] *= d;
        this.pos[k] += this.vel[k] * dt; this.pos[k + 1] += this.vel[k + 1] * dt; this.pos[k + 2] += this.vel[k + 2] * dt;
      }
      this.rot[i] += this.spinv[i] * dt;
      const fi = s.fadeIn ?? 0.1;
      this.aAlpha.array[i] = Math.min(1, u / fi) * (1 - Math.pow(u, 3)) * this.fading;
      this.aSize.array[i] = this.size0[i] * (1 + ((s.grow ?? 1) - 1) * u);
    }
    this.aPos.needsUpdate = this.aAlpha.needsUpdate = this.aSize.needsUpdate = this.aRot.needsUpdate = true;
    return alive > 0 && this.fading > 0;
  }
  stop() { this.stopping = true; }
  dispose() {
    this.points.removeFromParent(); this.points.geometry.dispose(); (this.points.material as ShaderMaterial).dispose(); releaseTex(this.spec.tex);
  }
}

// ------------------------------------------------------------------ text label (canvas sprite)
export function makeTextSprite(text: string, bg: string, fg: string, height = 0.12) {
  const c = document.createElement('canvas'); const g = c.getContext('2d')!;
  const font = '800 64px "Plus Jakarta Sans", ui-rounded, system-ui, sans-serif';
  g.font = font; const w = Math.ceil(g.measureText(text).width) + 72;
  c.width = w; c.height = 112; g.font = font;
  g.fillStyle = bg; const r = 50; g.beginPath(); g.moveTo(r, 6); g.arcTo(w - 6, 6, w - 6, 106, r); g.arcTo(w - 6, 106, 6, 106, r); g.arcTo(6, 106, 6, 6, r); g.arcTo(6, 6, w - 6, 6, r); g.closePath(); g.fill();
  g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.stroke();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, 60);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace;
  const s = new Sprite(new SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false }));
  s.scale.set((height * w) / 112, height, 1); s.renderOrder = 40; s.name = 'FX_text';
  return s;
}
export function disposeSprite(s: Sprite) { s.removeFromParent(); s.material.map?.dispose(); s.material.dispose(); }

export const smooth01 = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
export const easeOutBack = (x: number) => { const c = 1.9, t = Math.min(1, Math.max(0, x)) - 1; return 1 + (c + 1) * t * t * t + c * t * t; };
export const LQ = { orange: '#F26B3A', teal: '#168C78', yellow: '#F6C85F', mint: '#9BE3C8', pink: '#FF7AA8', navy: '#16324A', cream: '#FFF6E9', gold: '#FFC94A' };
export { Vector3 };
