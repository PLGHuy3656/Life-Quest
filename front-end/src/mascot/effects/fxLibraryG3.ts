import {
  AdditiveBlending, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, LatheGeometry, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, Quaternion, SRGBColorSpace, Shape, ShapeGeometry, SphereGeometry, Sprite, SpriteMaterial,
  TorusGeometry, TubeGeometry, Vector2, Vector3, type Camera,
} from 'three';
import { FxParticles, LQ, acquireTex, easeOutBack, releaseTex, smooth01, type Fx, type FxCategory, type FxContext } from './fxCore';
import { PropFx, type PropShowMode } from './fxLibraryG2';
import g3Spec from '../modules/g3_challenge_social.spec.json';

// Gate G3 — reusable challenge / group / social props and effects.
// * Same life cycle as the G2 props (PropFx: show pop / fade / instant, phase, hide poof / fade / burst / instant, dispose):
//   removable, cancellable at any moment, fully disposed when gone, FX_PROP_* objects owned by the effects manager.
// * Everything lives in the controller's fx root → follows the uniform level scale; nothing touches the Fox mesh, skeleton,
//   materials or the cosmetics sockets. Pause = the host stops calling update (everything freezes, resumes exactly).
// * No user content: the photo frame is blank (an application texture can be set at runtime), the chat bubble shows dots
//   only, the friend icon is a generic silhouette, team markers are colours / counts from setGroup().
// * Positions are fx-root local (= Fox local at level scale 1; +x = fox's left, +z = front) measured on the posed rig
//   (anim_spec_g3.json → prop_anchors), with fixed fallbacks.

type V3 = [number, number, number];
const A = ((g3Spec as unknown as { prop_anchors?: Record<string, { pos: V3 }> }).prop_anchors ?? {});
const at = (k: string, fb: V3): V3 => (A[k]?.pos ?? fb);
const plus = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Where the G3 props sit (fx-root local). Derived from the measured paw anchors so the fox visibly reaches / presents them. */
export const PROP_LAYOUT_G3 = {
  token_notice: [0.56, 0.86, 0.12] as V3,                                              // the symbol arrives at the fox's left
  token_paw: plus(at('challenge_token_paw', [0.3, 0.29, 0.125]), [0.0, 0.1, 0.02]),     // above the raised left paw
  token_present: plus(at('challenge_token_present', [0.27, 0.27, 0.157]), [-0.04, 0.13, 0.12]),
  token_above: [0.0, 1.1, 0.12] as V3,                                                  // accept / lose: above the head
  countdown: [0.0, 1.12, 0.1] as V3,
  trophy: plus(at('trophy_paw', [0.28, 0.36, 0.14]), [0.12, 0.08, 0.04]),
  emblem_l: [0.52, 0.78, 0.08] as V3, emblem_r: [-0.52, 0.78, 0.08] as V3, equal: [0.0, 1.1, 0.12] as V3,
  photo: plus(at('photo_paw', [0.28, 0.4, 0.12]), [0.17, 0.16, 0.04]),
  heart_start: [-0.5, 0.66, 0.16] as V3,
  heart_paw: plus(at('heart_paw', [-0.28, 0.4, 0.12]), [0.0, 0.06, 0.03]),
  chat: plus(at('chat_paw', [0.3, 0.35, 0.12]), [0.18, 0.4, 0.0]),
  friend_start: [0.42, 0.66, 0.22] as V3,
  friend_hold: (() => { const l = at('friend_icon_l', [0.32, 0.33, 0.1]), r = at('friend_icon_r', [-0.32, 0.33, 0.1]); return [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2 + 0.04, Math.max(l[2], r[2]) + 0.1] as V3; })(),
  notify: [0.55, 0.82, 0.15] as V3,
  team_radius: 0.62, team_y: 0.42,
  teammate: [-0.72, 0.42, 0.32] as V3,                                                 // default teammate direction (fox's right-front)
};

const v3 = (x = 0, y = 0, z = 0) => new Vector3(x, y, z);
const std = (color: string, o: { rough?: number; metal?: number; emissive?: string; ei?: number } = {}) =>
  new MeshStandardMaterial({ color: new Color(color), roughness: o.rough ?? 0.55, metalness: o.metal ?? 0, emissive: new Color(o.emissive ?? '#000000'), emissiveIntensity: o.ei ?? 0, transparent: true });
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; return t;
}
/** Billboard: keep an object facing the camera that renders it. */
function faceCam(o: Object3D) { o.onBeforeRender = (_r, _s, cam: Camera) => { o.quaternion.copy(cam.quaternion); if (o.parent) o.quaternion.premultiply(o.parent.getWorldQuaternion(TMPQ).invert()); }; }
const TMPQ = new Quaternion();
function heartShape(s = 1) {
  const h = new Shape();
  h.moveTo(0, -0.5 * s); h.bezierCurveTo(-0.75 * s, 0.0, -0.55 * s, 0.62 * s, 0, 0.28 * s); h.bezierCurveTo(0.55 * s, 0.62 * s, 0.75 * s, 0.0, 0, -0.5 * s);
  return h;
}
const lerpV = (a: Vector3, b: V3, k: number) => a.lerp(v3(...b), k);

// =============================================================== props
/** Glowing challenge token (coin with a crossed-swords-like double chevron emblem). Phases: paw · present · flash · fade_out. */
export class ChallengeTokenProp extends PropFx {
  private disc: Group = new Group(); private goal: V3; private glow: Sprite; private gMat: SpriteMaterial; private flash = 0; private dim = 0; private face: MeshStandardMaterial;
  constructor(parent: Object3D, clip?: string) {
    super('challenge_token', parent, 1);
    this.goal = clip === 'challenge_invite' ? PROP_LAYOUT_G3.token_notice : PROP_LAYOUT_G3.token_above;
    this.root.position.set(...this.goal);
    const emblem = canvasTex(128, 128, g => {
      const r = g.createRadialGradient(64, 64, 8, 64, 64, 62); r.addColorStop(0, '#FFE08A'); r.addColorStop(1, '#F26B3A');
      g.fillStyle = r; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#FFFFFF'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#FFFFFF'; g.lineJoin = 'round';
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(64 + s * 30, 34); g.lineTo(64 + s * 6, 64); g.lineTo(64 + s * 30, 94); g.lineTo(64 + s * 18, 94); g.lineTo(64 - s * 6, 64); g.lineTo(64 + s * 18, 34); g.closePath(); g.fill(); }
    });
    this.texs.push(emblem);
    this.face = new MeshStandardMaterial({ map: emblem, roughness: 0.35, metalness: 0.1, emissive: new Color('#FF9A3C'), emissiveIntensity: 0.35, transparent: true });
    const rim = std('#FFC94A', { rough: 0.3, metal: 0.7, emissive: '#FF8A1F', ei: 0.25 });
    const cyl = this.mesh(new CylinderGeometry(0.075, 0.075, 0.016, 36), rim, this.disc); cyl.rotation.x = Math.PI / 2;
    for (const z of [0.0085, -0.0085]) { const f = this.mesh(new CylinderGeometry(0.066, 0.066, 0.001, 36), this.face, this.disc); f.rotation.x = Math.PI / 2; f.position.z = z; if (z < 0) f.rotation.y = Math.PI; }
    this.root.add(this.disc);
    this.gMat = new SpriteMaterial({ map: acquireTex('soft'), color: new Color('#FFB35C'), transparent: true, depthWrite: false, blending: AdditiveBlending });
    this.glow = new Sprite(this.gMat); this.glow.scale.setScalar(0.32); this.glow.renderOrder = 11; this.root.add(this.glow);
  }
  override phase(p: string) {
    if (p === 'paw') this.goal = PROP_LAYOUT_G3.token_paw;
    if (p === 'present') this.goal = PROP_LAYOUT_G3.token_present;
    if (p === 'flash') this.flash = 1;
    if (p === 'fade_out') this.dim = 1;
  }
  protected override animate(dt: number) {
    lerpV(this.root.position, this.goal, 1 - Math.exp(-7 * dt));
    this.disc.rotation.y = Math.sin(this.t * 1.6) * 0.5;
    this.disc.position.y = 0.012 * Math.sin(this.t * 2.4);
    this.flash = Math.max(0, this.flash - dt * 2.2);
    const d = this.dimK += (this.dim - this.dimK) * (1 - Math.exp(-2.2 * dt));
    this.face.emissiveIntensity = 0.35 + 1.4 * this.flash - 0.3 * d;
    this.gMat.opacity = (0.55 + 0.45 * this.flash) * (1 - 0.8 * d) * this.visibility;
    this.glow.scale.setScalar(0.32 + 0.25 * this.flash);
    for (const m of this.mats) m.userData.alpha = 1 - 0.7 * d;
  }
  private dimK = 0;
  override dispose() { super.dispose(); this.gMat.dispose(); releaseTex('soft'); }
}

/** Countdown badge above the head. Shows the application's value (setValue) or, without data, abstract pulse dots. */
export class CountdownProp extends PropFx {
  private label: Sprite; private lMat: SpriteMaterial; private tex: CanvasTexture; private canvas: HTMLCanvasElement; private pulse = 0; private shown_: string | null = null;
  private ring: Mesh; private ringMat: MeshBasicMaterial; private dots = 3; value: number | string | null = null;
  constructor(parent: Object3D) {
    super('countdown', parent, 1);
    this.root.position.set(...PROP_LAYOUT_G3.countdown);
    this.canvas = document.createElement('canvas'); this.canvas.width = this.canvas.height = 128;
    this.tex = new CanvasTexture(this.canvas); this.tex.colorSpace = SRGBColorSpace; this.texs.push(this.tex);
    this.lMat = new SpriteMaterial({ map: this.tex, transparent: true, depthWrite: false }); this.label = new Sprite(this.lMat); this.label.scale.setScalar(0.17); this.label.renderOrder = 30; this.root.add(this.label);
    this.ringMat = new MeshBasicMaterial({ map: acquireTex('ring'), color: new Color(LQ.orange), transparent: true, depthWrite: false, side: DoubleSide });
    this.ring = new Mesh(new PlaneGeometry(0.26, 0.26), this.ringMat); this.ring.renderOrder = 29; faceCam(this.ring); this.root.add(this.ring); this.geos.push(this.ring.geometry);
    this.draw();
  }
  /** step = 3, 2, 1 from the clip's pulses (only used when the application gave no value). */
  pulseStep(step: number) { this.pulse = 1; this.dots = Math.max(0, Math.min(3, step)); this.draw(); }
  setValue(v: number | string | null) { this.value = v; this.draw(); }
  private draw() {
    const txt = this.value === null || this.value === undefined ? null : String(this.value);
    const key = `${txt}|${this.dots}`; if (key === this.shown_) return; this.shown_ = key;
    const g = this.canvas.getContext('2d')!; g.clearRect(0, 0, 128, 128);
    g.fillStyle = '#FFF6E9'; g.beginPath(); g.arc(64, 64, 56, 0, Math.PI * 2); g.fill();
    g.lineWidth = 8; g.strokeStyle = LQ.orange; g.stroke();
    if (txt !== null) { g.fillStyle = LQ.navy; g.font = '800 68px "Plus Jakarta Sans", ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt.slice(0, 3), 64, 68); }
    else for (let i = 0; i < 3; i++) { g.fillStyle = i < this.dots ? LQ.orange : 'rgba(22,50,74,0.18)'; g.beginPath(); g.arc(34 + i * 30, 64, 11, 0, Math.PI * 2); g.fill(); }
    this.tex.needsUpdate = true;
  }
  protected override animate(dt: number) {
    this.pulse = Math.max(0, this.pulse - dt * 2.5);
    const k = 1 + 0.25 * easeOutBack(this.pulse) * this.pulse;
    this.label.scale.setScalar(0.17 * k);
    this.ring.scale.setScalar(1 + 0.6 * (1 - this.pulse)); this.ringMat.opacity = this.pulse * this.visibility;
    this.lMat.opacity = this.visibility;
  }
  override dispose() { super.dispose(); this.ringMat.dispose(); releaseTex('ring'); this.lMat.dispose(); }
}

/** Floating golden trophy (lathe cup, handles, base) with an animated highlight sweep (phase 'shine'). */
export class TrophyProp extends PropFx {
  private cup = new Group(); private shineT = -1; private sweep: Mesh; private sMat: MeshBasicMaterial;
  constructor(parent: Object3D) {
    super('trophy', parent, 1);
    this.root.position.set(...PROP_LAYOUT_G3.trophy);
    const gold = std('#FFC94A', { rough: 0.28, metal: 0.75, emissive: '#B86E00', ei: 0.25 }), dark = std('#B98A2E', { rough: 0.4, metal: 0.6 }), star = std('#FFFFFF', { rough: 0.3, emissive: '#FFF3C2', ei: 0.6 });
    const prof = [new Vector2(0.0, 0.0), new Vector2(0.045, 0.0), new Vector2(0.045, 0.012), new Vector2(0.018, 0.022), new Vector2(0.012, 0.055), new Vector2(0.02, 0.07),
      new Vector2(0.055, 0.09), new Vector2(0.066, 0.13), new Vector2(0.068, 0.165), new Vector2(0.062, 0.168), new Vector2(0.0, 0.15)];
    this.mesh(new LatheGeometry(prof, 32), gold, this.cup);
    for (const s of [-1, 1]) { const h = this.mesh(new TorusGeometry(0.03, 0.007, 8, 20, Math.PI), gold, this.cup); h.position.set(s * 0.066, 0.128, 0); h.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; }
    const base = this.mesh(new CylinderGeometry(0.05, 0.056, 0.022, 28), dark, this.cup); base.position.y = -0.011;
    const st = this.mesh(new ExtrudeGeometry((() => { const s = new Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.011 : 0.026; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } return s; })(), { depth: 0.004, bevelEnabled: false }), star, this.cup);
    st.position.set(0, 0.115, 0.064);
    this.cup.position.y = -0.08; this.root.add(this.cup);
    this.sMat = new MeshBasicMaterial({ map: acquireTex('soft'), color: new Color('#FFFFFF'), transparent: true, depthWrite: false, blending: AdditiveBlending });
    this.sweep = new Mesh(new PlaneGeometry(0.05, 0.26), this.sMat); this.sweep.renderOrder = 14; this.sweep.rotation.z = -0.5; this.sweep.position.z = 0.075; this.root.add(this.sweep); this.geos.push(this.sweep.geometry);
  }
  override phase(p: string) { if (p === 'shine') this.shineT = 0; }
  protected override animate(dt: number) {
    this.cup.rotation.y = 0.35 * Math.sin(this.t * 1.2);
    this.root.position.y = PROP_LAYOUT_G3.trophy[1] + 0.012 * Math.sin(this.t * 2.2);
    if (this.shineT >= 0) { this.shineT += dt / 0.7; if (this.shineT > 1) this.shineT = -1; }
    const u = Math.max(0, this.shineT); this.sweep.position.x = -0.09 + 0.18 * u; this.sMat.opacity = this.shineT >= 0 ? Math.sin(Math.PI * u) * 0.9 * this.visibility : 0;
  }
  override dispose() { super.dispose(); this.sMat.dispose(); releaseTex('soft'); }
}

/** Two equally bright emblems (left / right) and an equal sign that appears between them (phase 'equal'). */
export class EqualEmblemProp extends PropFx {
  private eq = new Group(); private eqK = 0; private eqT = 0; private ems: Group[] = [];
  constructor(parent: Object3D) {
    super('equal_emblem', parent, 1);
    const tex = canvasTex(128, 128, g => {
      const r = g.createRadialGradient(64, 64, 8, 64, 64, 60); r.addColorStop(0, '#FFFFFF'); r.addColorStop(0.5, LQ.yellow); r.addColorStop(1, LQ.orange);
      g.fillStyle = r; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#FFFFFF'; g.lineWidth = 6; g.stroke();
      g.fillStyle = '#FFFFFF'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 14 : 32; g.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); } g.fill();
    });
    this.texs.push(tex);
    const mat = new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: DoubleSide });
    for (const p of [PROP_LAYOUT_G3.emblem_l, PROP_LAYOUT_G3.emblem_r]) {
      const g = new Group(); g.position.set(...p); const m = this.mesh(new PlaneGeometry(0.16, 0.16), mat, g); faceCam(m); this.root.add(g); this.ems.push(g);
    }
    const bar = std(LQ.teal, { rough: 0.5, emissive: LQ.teal, ei: 0.3 });
    for (const y of [0.022, -0.022]) { const b = this.mesh(new CylinderGeometry(0.012, 0.012, 0.11, 12), bar, this.eq); b.rotation.z = Math.PI / 2; b.position.y = y; }
    this.eq.position.set(...PROP_LAYOUT_G3.equal); this.eq.scale.setScalar(0.001); this.root.add(this.eq);
  }
  override phase(p: string) { if (p === 'equal') this.eqT = 1; }
  protected override animate(dt: number) {
    this.eqK = Math.min(1, this.eqK + dt * 3.5 * this.eqT);
    this.eq.scale.setScalar(Math.max(0.001, easeOutBack(this.eqK)));
    this.ems.forEach((g, i) => { g.position.y = (i ? PROP_LAYOUT_G3.emblem_r : PROP_LAYOUT_G3.emblem_l)[1] + 0.015 * Math.sin(this.t * 2.2); g.scale.setScalar(1 + 0.06 * Math.sin(this.t * 4)); });   // identical pulse: equally bright
  }
}

/** Symbolic teammates: coloured emblem markers on a ring around the fox (count / colours = group data). Phases:
 *  orbit (rotate with the beat) · still · flames (small linked flames on each) · flames_fade (one by one) · break (ring breaks apart). */
export class TeamMarkersProp extends PropFx {
  private ring = new Group(); private markers: { g: Group; flame: Sprite; fMat: SpriteMaterial; fk: number; fTarget: number; out: number }[] = [];
  private orbit = 0; private brk = -1; private ringLine: Mesh; private lineMat: MeshBasicMaterial; private fadeStagger = 0.25; private fadeT = -1;
  constructor(parent: Object3D, colors: readonly string[]) {
    super('team_markers', parent, 1);
    const n = Math.max(1, Math.min(8, colors.length));
    for (let i = 0; i < n; i++) {
      const g = new Group(); const a = Math.PI * (0.15 + 0.7 * (n === 1 ? 0.5 : i / (n - 1)));        // a semicircle behind / around the fox
      g.position.set(Math.cos(a) * PROP_LAYOUT_G3.team_radius, PROP_LAYOUT_G3.team_y + 0.05 * Math.sin(i), -Math.sin(a) * PROP_LAYOUT_G3.team_radius * 0.55);
      const c = new Color(colors[i]);
      const disc = this.mesh(new SphereGeometry(0.045, 20, 14), std(colors[i], { rough: 0.4, emissive: colors[i], ei: 0.35 }), g);
      disc.scale.set(1, 1, 0.45);
      const ring = this.mesh(new TorusGeometry(0.05, 0.006, 8, 28), std('#FFFFFF', { rough: 0.3, emissive: '#FFFFFF', ei: 0.4 }), g); faceCam(ring);
      const fMat = new SpriteMaterial({ map: acquireTex('soft'), color: c.clone().lerp(new Color('#FFB040'), 0.6), transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 });
      const flame = new Sprite(fMat); flame.position.y = 0.075; flame.scale.set(0.06, 0.09, 1); flame.renderOrder = 15; g.add(flame);
      this.ring.add(g); this.markers.push({ g, flame, fMat, fk: 0, fTarget: 0, out: 0 });
    }
    this.lineMat = new MeshBasicMaterial({ map: acquireTex('ring'), color: new Color('#FFE2B0'), transparent: true, depthWrite: false, side: DoubleSide, opacity: 0.0 });
    this.ringLine = new Mesh(new PlaneGeometry(2 * PROP_LAYOUT_G3.team_radius, 2 * PROP_LAYOUT_G3.team_radius), this.lineMat); this.ringLine.rotation.x = -Math.PI / 2;
    this.ringLine.position.y = 0.02; this.ringLine.renderOrder = 9; this.root.add(this.ringLine); this.geos.push(this.ringLine.geometry);
    this.root.add(this.ring);
  }
  get count() { return this.markers.length; }
  /** Marker position in fx-root space (the props layer has an identity transform). */
  markerLocal(i: number, out: Vector3) {
    const m = this.markers[i % this.markers.length]; this.ring.updateMatrix(); this.root.updateMatrix();
    return out.copy(m.g.position).applyMatrix4(this.ring.matrix).applyMatrix4(this.root.matrix);
  }
  override phase(p: string) {
    if (p === 'orbit') this.orbit = 1;
    if (p === 'still') this.orbit = 0;
    if (p === 'flames') this.markers.forEach(m => (m.fTarget = 1));
    if (p === 'flames_fade') this.fadeT = 0;
    if (p === 'break') this.brk = 0;
  }
  setFadeStagger(s: number) { this.fadeStagger = s; }
  protected override animate(dt: number) {
    this.ring.rotation.y += this.orbit * dt * 0.9;
    if (this.fadeT >= 0) { this.fadeT += dt; this.markers.forEach((m, i) => { if (this.fadeT > i * this.fadeStagger) m.fTarget = 0; }); }
    if (this.brk >= 0) this.brk = Math.min(1, this.brk + dt / 0.9);
    const linked = this.markers.some(m => m.fk > 0.05);
    this.lineMat.opacity = (this.brk >= 0 ? (1 - this.brk) : (linked ? 0.55 : 0.0)) * this.visibility;
    this.ringLine.scale.setScalar(this.brk >= 0 ? 1 + 0.5 * this.brk : 1);
    this.markers.forEach((m, i) => {
      m.fk += (m.fTarget - m.fk) * (1 - Math.exp(-6 * dt));
      const fl = 0.85 + 0.15 * Math.sin(this.t * 13 + i * 2.1);
      m.flame.scale.set(0.06 * fl, 0.09 * (0.9 + 0.2 * Math.sin(this.t * 9 + i)), 1); m.fMat.opacity = m.fk * this.visibility;
      m.g.position.y += Math.sin(this.t * 2 + i) * 0.0004;
      if (this.brk >= 0) { m.out = this.brk; m.g.scale.setScalar(Math.max(0.001, 1 - 0.5 * this.brk)); }
    });
    if (this.brk >= 0) this.ring.scale.setScalar(1 + 0.45 * smooth01(this.brk));
  }
  get flamesLit() { return this.markers.filter(m => m.fk > 0.5).length; }
  override dispose() { super.dispose(); this.markers.forEach(m => { m.fMat.dispose(); releaseTex('soft'); }); this.lineMat.dispose(); releaseTex('ring'); }
}

/** Blank Polaroid-style frame (no user photo is shipped; setPicture() takes an application texture). Phase 'shine'. */
export class PhotoFrameProp extends PropFx {
  private body = new Group(); private shineT = -1; private sweep: Mesh; private sMat: MeshBasicMaterial; private pic: MeshStandardMaterial;
  constructor(parent: Object3D) {
    super('photo_frame', parent, 1);
    this.root.position.set(...PROP_LAYOUT_G3.photo);
    const W = 0.2, H = 0.24;
    const paper = std('#FFFDF8', { rough: 0.8 });
    const placeholder = canvasTex(128, 128, g => { const r = g.createLinearGradient(0, 0, 128, 128); r.addColorStop(0, '#CDEFF6'); r.addColorStop(1, '#FCE3D3'); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.arc(88, 38, 14, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(22,140,120,0.35)'; g.beginPath(); g.moveTo(0, 128); g.lineTo(40, 70); g.lineTo(70, 100); g.lineTo(96, 76); g.lineTo(128, 128); g.fill(); });
    this.texs.push(placeholder);
    this.pic = new MeshStandardMaterial({ map: placeholder, roughness: 0.6, transparent: true });
    const back = this.mesh(new PlaneGeometry(W, H), paper, this.body); back.position.z = 0;
    (back.material as MeshStandardMaterial).side = DoubleSide;
    const img = this.mesh(new PlaneGeometry(W * 0.84, W * 0.84), this.pic, this.body); img.position.set(0, (H - W) / 2 + 0.005, 0.002);
    this.body.rotation.set(-0.08, -0.35, 0.12); this.root.add(this.body);
    this.sMat = new MeshBasicMaterial({ map: acquireTex('soft'), color: new Color('#FFFFFF'), transparent: true, depthWrite: false, blending: AdditiveBlending });
    this.sweep = new Mesh(new PlaneGeometry(0.06, 0.34), this.sMat); this.sweep.rotation.z = -0.6; this.sweep.position.z = 0.004; this.sweep.renderOrder = 14; this.body.add(this.sweep); this.geos.push(this.sweep.geometry);
  }
  /** Application data hook: show a picture (the texture stays owned by the caller). */
  setPicture(tex: import('three').Texture | null) { this.pic.map = tex ?? this.texs[0]; this.pic.needsUpdate = true; }
  override phase(p: string) { if (p === 'shine') this.shineT = 0; }
  protected override animate(dt: number) {
    this.body.position.y = 0.01 * Math.sin(this.t * 2.1); this.body.rotation.z = 0.12 + 0.04 * Math.sin(this.t * 1.4);
    if (this.shineT >= 0) { this.shineT += dt / 0.75; if (this.shineT > 1) this.shineT = -1; }
    const u = Math.max(0, this.shineT); this.sweep.position.x = -0.13 + 0.26 * u; this.sMat.opacity = this.shineT >= 0 ? Math.sin(Math.PI * u) * 0.85 * this.visibility : 0;
  }
  override show(mode: PropShowMode = 'pop') { super.show(mode); }
  override dispose() { super.dispose(); this.sMat.dispose(); releaseTex('soft'); }
}

/** Floating 3D heart (extruded). Phase 'to_paw' glides into the reaching paw; hide('burst') pops it. */
export class HeartProp extends PropFx {
  private h: Mesh; private goal: V3 = PROP_LAYOUT_G3.heart_start;
  constructor(parent: Object3D) {
    super('heart', parent, 1);
    this.root.position.set(...PROP_LAYOUT_G3.heart_start);
    this.h = this.mesh(new ExtrudeGeometry(heartShape(0.12), { depth: 0.03, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 3, curveSegments: 16 }),
      std('#FF5C8A', { rough: 0.35, emissive: '#FF2E6A', ei: 0.35 }));
    this.h.geometry.center();
  }
  override phase(p: string) { if (p === 'to_paw') this.goal = PROP_LAYOUT_G3.heart_paw; }
  protected override animate(dt: number) {
    lerpV(this.root.position, this.goal, 1 - Math.exp(-6 * dt));
    const beat = Math.pow(Math.max(0, Math.sin(this.t * 7.5)), 6);
    this.h.scale.setScalar(1 + 0.12 * beat); this.h.rotation.y = 0.3 * Math.sin(this.t * 1.8);
  }
}

/** Chat bubble with typing dots — never text. Phases: typing · done (dots settle into a tick + soft highlight). */
export class ChatBubbleProp extends PropFx {
  private dots: Mesh[] = []; private typing = 0; private tick: Mesh; private tickK = 0; private doneK = 0;
  constructor(parent: Object3D) {
    super('chat_bubble', parent, 1);
    this.root.position.set(...PROP_LAYOUT_G3.chat);
    const s = new Shape(); const w = 0.2, h = 0.13, r = 0.05;
    s.moveTo(-w / 2 + r, -h / 2); s.lineTo(-0.02, -h / 2); s.lineTo(-0.055, -h / 2 - 0.045); s.lineTo(-0.045, -h / 2); s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const g = new Group(); g.rotation.y = 0.25; this.root.add(g);              // faces the front / default camera (groups cannot billboard via onBeforeRender)
    this.mesh(new ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 }), std('#FFFFFF', { rough: 0.5 }), g);
    const outline = this.mesh(new ShapeGeometry(s), new MeshBasicMaterial({ color: new Color(LQ.teal), transparent: true, side: DoubleSide }), g); outline.scale.setScalar(1.08); outline.position.z = -0.004;
    const dm = std(LQ.navy, { rough: 0.5 });
    for (let i = 0; i < 3; i++) { const d = this.mesh(new SphereGeometry(0.013, 12, 8), dm, g); d.position.set(-0.045 + i * 0.045, 0, 0.022); this.dots.push(d); }
    this.tick = this.mesh(new TubeGeometry(new CatmullRomCurve3([v3(-0.035, 0.0, 0.024), v3(-0.01, -0.025, 0.024), v3(0.04, 0.03, 0.024)]), 12, 0.008, 6), std(LQ.teal, { rough: 0.4, emissive: LQ.teal, ei: 0.3 }), g);
    this.tick.scale.setScalar(0.001);
  }
  override phase(p: string) { if (p === 'typing') { this.typing = 1; this.doneK = 0; } if (p === 'done') { this.typing = 0; this.doneK = 1; } }
  protected override animate(dt: number) {
    this.dots.forEach((d, i) => { const b = this.typing * Math.max(0, Math.sin(this.t * 9 - i * 0.9)); d.position.y = 0.012 * b; d.scale.setScalar(Math.max(0.001, 1 - this.tickK)); });
    this.tickK += (this.doneK - this.tickK) * (1 - Math.exp(-8 * dt)); this.tick.scale.setScalar(Math.max(0.001, easeOutBack(this.tickK)));
    this.root.position.y = PROP_LAYOUT_G3.chat[1] + 0.008 * Math.sin(this.t * 2.3);
  }
}

/** Generic friend symbol (silhouette in a round badge, never an avatar). Phases: hold (moves to the paws at the chest) · glow. */
export class FriendIconProp extends PropFx {
  private goal: V3 = PROP_LAYOUT_G3.friend_start; private glow: Sprite; private gMat: SpriteMaterial; private gk = 0; private gT = 0;
  constructor(parent: Object3D) {
    super('friend_icon', parent, 0.8);
    this.root.position.set(...PROP_LAYOUT_G3.friend_start);
    const tex = canvasTex(128, 128, g => { g.fillStyle = LQ.cream; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill(); g.lineWidth = 7; g.strokeStyle = LQ.teal; g.stroke();
      g.fillStyle = LQ.teal; g.beginPath(); g.arc(64, 50, 18, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(64, 98, 32, 22, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#FF7AA8'; g.beginPath(); g.moveTo(96, 34); g.bezierCurveTo(84, 24, 86, 14, 96, 20); g.bezierCurveTo(106, 14, 108, 24, 96, 34); g.fill(); });
    this.texs.push(tex);
    const m = this.mesh(new PlaneGeometry(0.13, 0.13), new MeshBasicMaterial({ map: tex, transparent: true, side: DoubleSide, depthWrite: false }));
    faceCam(m);
    this.gMat = new SpriteMaterial({ map: acquireTex('soft'), color: new Color('#FFE3A3'), transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 });
    this.glow = new Sprite(this.gMat); this.glow.scale.setScalar(0.3); this.glow.renderOrder = 11; this.root.add(this.glow);
  }
  override phase(p: string) { if (p === 'hold') this.goal = PROP_LAYOUT_G3.friend_hold; if (p === 'glow') this.gT = 1; }
  protected override animate(dt: number) {
    lerpV(this.root.position, this.goal, 1 - Math.exp(-5 * dt));
    this.gk += (this.gT - this.gk) * (1 - Math.exp(-4 * dt)); this.gMat.opacity = this.gk * (0.6 + 0.2 * Math.sin(this.t * 5)) * this.visibility;
  }
  override dispose() { super.dispose(); this.gMat.dispose(); releaseTex('soft'); }
}

// =============================================================== transient effects
abstract class TimedFxG3 implements Fx {
  owner?: string; protected t = 0; protected fade = 1; protected stopping = false;
  constructor(readonly category: FxCategory, protected duration: number) {}
  protected abstract frame(t: number, u: number, alpha: number): void;
  update(dt: number) { this.t += dt; if (this.stopping) this.fade = Math.max(0, this.fade - dt / 0.25); const u = this.t / this.duration; if (u >= 1 || this.fade <= 0) return false; this.frame(this.t, u, this.fade); return true; }
  stop() { this.stopping = true; }
  abstract dispose(): void;
}

/** Orange energy ring that follows a paw (the anchor is re-read every frame). */
export class PawRingFx extends TimedFxG3 {
  private g = new Group(); private mats: MeshBasicMaterial[] = []; private geos: BufferGeometry[] = []; private p = v3();
  constructor(private ctx: FxContext, private at: string, duration: number, color = LQ.orange) {
    super('particles', duration);
    for (let i = 0; i < 2; i++) {
      const mat = new MeshBasicMaterial({ color: new Color(i ? '#FFD25E' : color), transparent: true, depthWrite: false, blending: AdditiveBlending });
      const geo = new TorusGeometry(0.07 + i * 0.02, 0.006 - i * 0.002, 8, 40); const m = new Mesh(geo, mat); m.renderOrder = 18; m.rotation.x = Math.PI / 2 + i * 0.5;
      this.g.add(m); this.mats.push(mat); this.geos.push(geo);
    }
    ctx.layer('particles').add(this.g);
  }
  protected frame(t: number, u: number, a: number) {
    this.ctx.anchor(this.at, this.p); this.g.position.copy(this.p);
    this.g.rotation.y = t * 3.2; this.g.children[1].rotation.z = -t * 4;
    const k = smooth01(t / 0.25) * (1 - smooth01((u - 0.85) / 0.15));
    this.mats.forEach((m, i) => (m.opacity = a * k * (0.85 - 0.25 * i) * (0.8 + 0.2 * Math.sin(t * 10 + i))));
    this.g.scale.setScalar(0.8 + 0.2 * k);
  }
  dispose() { this.g.removeFromParent(); this.mats.forEach(m => m.dispose()); this.geos.forEach(g => g.dispose()); }
}

/** Soft aura around the fox (ready / victory / team) — a breathing sprite plus a slow flat floor ring. */
export class AuraFx extends TimedFxG3 {
  private s: Sprite; private mat: SpriteMaterial; private ring: Mesh; private rMat: MeshBasicMaterial;
  constructor(ctx: FxContext, color: string, duration: number, private size = 1.0, ring = true) {
    super('particles', duration);
    this.mat = new SpriteMaterial({ map: acquireTex('soft'), color: new Color(color), transparent: true, depthWrite: false, blending: AdditiveBlending });
    this.s = new Sprite(this.mat); this.s.position.copy(ctx.anchor('chest', v3())).add(v3(0, 0.12, -0.15)); this.s.renderOrder = 4; this.s.scale.setScalar(size);
    ctx.layer('particles').add(this.s);
    this.rMat = new MeshBasicMaterial({ map: acquireTex('ring'), color: new Color(color), transparent: true, depthWrite: false, side: DoubleSide, opacity: 0 });
    this.ring = new Mesh(new PlaneGeometry(1.1 * size, 1.1 * size), this.rMat); this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.01; this.ring.renderOrder = 5; this.ring.visible = ring;
    ctx.layer('particles').add(this.ring);
  }
  protected frame(t: number, u: number, a: number) {
    const k = smooth01(t / 0.35) * (1 - smooth01((u - 0.8) / 0.2));
    this.mat.opacity = a * k * (0.32 + 0.1 * Math.sin(t * 4)); this.s.scale.setScalar(this.size * (1 + 0.05 * Math.sin(t * 3)));
    this.rMat.opacity = a * k * 0.55; this.ring.rotation.z = t * 0.8; this.ring.scale.setScalar(1 + 0.04 * Math.sin(t * 5));
  }
  dispose() { this.s.removeFromParent(); this.mat.dispose(); releaseTex('soft'); this.ring.removeFromParent(); this.ring.geometry.dispose(); this.rMat.dispose(); releaseTex('ring'); }
}

/** Glowing curved connection line from an anchor toward a target point, with travelling light dots. */
export class LinkLineFx extends TimedFxG3 {
  private tube: Mesh; private mat: MeshBasicMaterial; private dots: FxParticles;
  constructor(ctx: FxContext, from: Vector3, to: Vector3, duration: number, color = '#FFB38A') {
    super('particles', duration);
    const mid = from.clone().lerp(to, 0.5).add(v3(0, 0.12, 0.05));
    const curve = new CatmullRomCurve3([from.clone(), mid, to.clone()]);
    this.mat = new MeshBasicMaterial({ color: new Color(color), transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 });
    this.tube = new Mesh(new TubeGeometry(curve, 32, 0.006, 6), this.mat); this.tube.renderOrder = 16; ctx.layer('particles').add(this.tube);
    this.dots = new FxParticles('particles', { count: 6, tex: 'heart', colors: ['#FF8FB1', '#FFFFFF'], life: [0.9, 1.2], size: [0.02, 0.03], delay: [0, duration * 0.6],
      spawn: () => {}, path: (_i, u, out) => out.copy(curve.getPoint(u)), fadeIn: 0.2 }, ctx, ctx.layer('particles'));
  }
  protected frame(t: number, u: number, a: number) { this.mat.opacity = a * smooth01(t / 0.3) * (1 - smooth01((u - 0.8) / 0.2)) * 0.8; }
  override update(dt: number) { const r = super.update(dt); const d = this.dots.update(dt); return r || (d && !this.stopping); }
  override stop() { super.stop(); this.dots.stop(); }
  dispose() { this.tube.removeFromParent(); this.tube.geometry.dispose(); this.mat.dispose(); this.dots.dispose(); }
}

/** A heart sprite that pops and fades (greeting pulse). */
export class HeartPulseFx extends TimedFxG3 {
  private s: Sprite; private mat: SpriteMaterial;
  constructor(ctx: FxContext, at: Vector3, duration: number, color = '#FF6F9C', private size = 0.12) {
    super('particles', duration);
    this.mat = new SpriteMaterial({ map: acquireTex('heart'), color: new Color(color), transparent: true, depthWrite: false });
    this.s = new Sprite(this.mat); this.s.position.copy(at); this.s.renderOrder = 22; ctx.layer('particles').add(this.s);
  }
  protected frame(t: number, u: number, a: number) { this.s.scale.setScalar(this.size * Math.max(0.001, easeOutBack(t / 0.25)) * (1 + 0.3 * u)); this.mat.opacity = a * (1 - smooth01((u - 0.5) / 0.5)); this.s.position.y += 0.0008; }
  dispose() { this.s.removeFromParent(); this.mat.dispose(); releaseTex('heart'); }
}

// ---- particle presets
export function heartsFloat(ctx: FxContext, o: Vector3, count = 4): Fx {
  return new FxParticles('particles', { count, tex: 'heart', colors: ['#FF5C8A', '#FF8FB1', '#FFC2D4'], life: [0.9, 1.4], size: [0.03, 0.05], delay: [0, 0.35],
    spawn: (_i, p, v, r) => { p.copy(o).add(v3((r() - 0.5) * 0.08, (r() - 0.5) * 0.04, 0.03)); v.set((r() - 0.5) * 0.18, 0.22 + r() * 0.18, 0.04); },
    drag: 1.2, spin: 1.2, grow: 0.5, fadeIn: 0.12 }, ctx, ctx.layer('particles'));
}
export function streaksConverge(ctx: FxContext, duration: number): Fx {
  const l = ctx.anchor('hand_l', v3()), r = ctx.anchor('hand_r', v3());
  const starts = [v3(l.x + 0.45, l.y + 0.35, l.z + 0.2), v3(r.x - 0.45, r.y + 0.35, r.z + 0.2)], ends = [l, r];
  return new FxParticles('particles', { count: 18, tex: 'spark', colors: [LQ.orange, '#FFD25E', '#FFFFFF'], life: [duration * 0.6, duration], size: [0.025, 0.045], delay: [0, duration * 0.25],
    spawn: () => {}, path: (i, u, out) => { const s = starts[i % 2], e = ends[i % 2], k = u * u * (3 - 2 * u); out.copy(s).lerp(e, k); out.y += 0.08 * Math.sin(Math.PI * u) * ((i % 3) - 1); }, fadeIn: 0.05 },
  ctx, ctx.layer('particles'));
}
export function speedLines(ctx: FxContext, duration: number): Fx {
  return new FxParticles('particles', { count: 14, tex: 'rect', colors: ['#FFFFFF', '#FFE2C2'], life: [duration * 0.5, duration], size: [0.02, 0.03],
    spawn: (i, p, v, r) => { const s = i % 2 ? 1 : -1; p.set(s * (0.32 + r() * 0.15), 0.15 + r() * 0.6, -0.05 - r() * 0.15); v.set(s * 0.15, 0, -1.6 - r()); }, drag: 2, fadeIn: 0.02 },
  ctx, ctx.layer('particles'));
}
export function embersFade(ctx: FxContext, o: Vector3, count = 6, duration = 1.4): Fx {
  return new FxParticles('particles', { count, tex: 'soft', colors: ['#FF8A1F', '#FFD25E', '#E8480F'], life: [duration * 0.6, duration], size: [0.012, 0.022], delay: [0, 0.4],
    spawn: (_i, p, v, r) => { p.copy(o).add(v3((r() - 0.5) * 0.04, 0, (r() - 0.5) * 0.03)); v.set((r() - 0.5) * 0.08, 0.12 + r() * 0.12, 0); }, drag: 1.2, fadeIn: 0.05 },
  ctx, ctx.layer('particles'));
}
export function symmetricSparks(ctx: FxContext): Fx[] {
  return [PROP_LAYOUT_G3.emblem_l, PROP_LAYOUT_G3.emblem_r, PROP_LAYOUT_G3.equal].map((p, k) => new FxParticles('particles', {
    count: k === 2 ? 10 : 8, tex: 'spark', colors: [LQ.gold, '#FFFFFF', LQ.mint], life: [0.5, 0.8], size: [0.025, 0.045],
    spawn: (i, q, v) => { q.set(...p); const a = (i / 8) * Math.PI * 2; v.set(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0.05); }, drag: 3, spin: 3, grow: 0.3, fadeIn: 0.04 },
  ctx, ctx.layer('particles')));
}
export function multiConfetti(ctx: FxContext, colors: readonly string[], count = 70, duration = 2.4): Fx {
  return new FxParticles('particles', { count, tex: 'rect', colors: [...colors, '#FFFFFF', LQ.gold], life: [duration * 0.7, duration], size: [0.025, 0.04],
    spawn: (_i, p, v, r) => { p.set((r() - 0.5) * 0.3, 0.95 + r() * 0.1, (r() - 0.5) * 0.2); const a = r() * Math.PI * 2, s = 0.5 + r() * 0.8; v.set(Math.cos(a) * s * 0.8, 0.9 + r() * 1.0, Math.sin(a) * s * 0.45); },
    gravity: 1.8, drag: 1.6, spin: 9, fadeIn: 0.02 }, ctx, ctx.layer('particles'));
}

/** Persistent group-streak embers: small sparks travel along arcs from every team marker into the (single) streak flame. */
export class GroupEmbersFx implements Fx {
  readonly category: FxCategory = 'flame'; owner?: string;
  private bursts: FxParticles[] = []; private acc = 0; private stopping = false; private i = 0; private tmpA = v3(); private tmpB = v3();
  constructor(private ctx: FxContext, private markers: () => TeamMarkersProp | undefined, private low: boolean) {}
  update(dt: number) {
    const m = this.markers();
    if (!this.stopping && m && m.shown) {
      this.acc += dt;
      const interval = this.low ? 0.9 : 0.35;
      while (this.acc >= interval) {
        this.acc -= interval;
        const k = this.i++ % m.count; const from = m.markerLocal(k, this.tmpA).clone(); const to = this.ctx.anchor('flame', this.tmpB).clone();
        const mid = from.clone().lerp(to, 0.5).add(v3(0, 0.18, 0));
        const curve = new CatmullRomCurve3([from, mid, to]);
        this.bursts.push(new FxParticles('flame', { count: this.low ? 1 : 2, tex: 'soft', colors: ['#FFB040', '#FFE08A', '#FF7A1F'], life: [0.8, 1.0], size: [0.018, 0.028], delay: [0, 0.15],
          spawn: () => {}, path: (_j, u, out) => out.copy(curve.getPoint(u)), fadeIn: 0.15 }, this.ctx, this.ctx.layer('flame')));
      }
    }
    this.bursts = this.bursts.filter(b => { const a = b.update(dt); if (!a) b.dispose(); return a; });
    return !this.stopping || this.bursts.length > 0;
  }
  stop() { this.stopping = true; this.bursts.forEach(b => b.stop()); }
  get active() { return !this.stopping; }
  dispose() { this.bursts.forEach(b => b.dispose()); this.bursts = []; }
}

export const G3_PROPS = ['challenge_token', 'countdown', 'trophy', 'equal_emblem', 'team_markers', 'photo_frame', 'heart', 'chat_bubble', 'friend_icon'] as const;
export type G3PropId = (typeof G3_PROPS)[number];
export const DEFAULT_TEAM_COLORS = ['#3EA2FF', '#9BE3C8', '#F6C85F', '#FF7AA8'] as const;
