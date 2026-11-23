import {
  BufferGeometry, CanvasTexture, CircleGeometry, Color, ConeGeometry, CylinderGeometry, DoubleSide, Group, Material, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, NormalBlending, Object3D, PlaneGeometry, RingGeometry, SRGBColorSpace, Shape, ShapeGeometry, SphereGeometry, Sprite,
  SpriteMaterial, TorusGeometry, Vector3, type Bone,
} from 'three';
import { FxParticles, LQ, acquireTex, easeOutBack, releaseTex, smooth01, type Fx, type FxCategory, type FxContext } from './fxCore';

// Gate G2 — reusable daily-life props and effects (study, sports, wake / alarm, sleep, cooldown).
// * Props are FX_PROP_* objects owned by the effects manager: never children of a Fox mesh, never part of
//   the Fox material, skeleton or the (future) cosmetics slots. The pencil sits on the ATT_HAND_R socket
//   like the G1 flag; every other prop lives in the fx root (same level scale as the Fox).
// * Every prop can appear (pop / fade / instant), disappear (poof / fade / burst / instant), be cancelled
//   at any moment and is fully disposed when hidden. Geometry / materials are created per prop.
// * Positions are fx-root local (= Fox local at level scale 1, three.js frame: +x = fox's left, +z = front),
//   measured on the posed rig (anim_spec_g2.json → prop_anchors).

export type PropId = 'notebook' | 'pencil' | 'alarm_clock' | 'pillow' | 'sleep_mat' | 'timer' | 'late_clock'
  // Gate G3 props (fxLibraryG3.ts) — same PropFx life cycle (show / phase / hide / dispose)
  | 'challenge_token' | 'countdown' | 'trophy' | 'equal_emblem' | 'team_markers' | 'photo_frame' | 'heart' | 'chat_bubble' | 'friend_icon';
export type PropShowMode = 'pop' | 'fade' | 'instant';
export type PropHideMode = 'poof' | 'fade' | 'burst' | 'instant';

/** Where each prop sits (fx-root local). Tuned against the measured anchors of anim_spec_g2.json. */
export const PROP_LAYOUT = {
  // G2.1: seated / lying poses sit 0.118 m further back (heel-plant sit-down) — re-measured anchors, anim_spec_g2_1.json
  notebook: { pos: [0, 0.15, 0.095] as const, tiltX: 0.5 },
  alarm_clock: { pos: [-0.5, 0, 0.14] as const, yaw: 0.45, scale: 1.35 },
  pillow: { pos: [-0.16, 0.035, -0.148] as const },
  sleep_mat: { pos: [0.02, 0.003, -0.118] as const },
  timer: { pos: [0.53, 0.8, 0.06] as const },
  late_clock: { pos: [0.52, 0.86, 0.06] as const },
};

const v3 = (x = 0, y = 0, z = 0) => new Vector3(x, y, z);
const std = (color: string, opts: { rough?: number; metal?: number; side?: typeof DoubleSide } = {}) => {
  const m = new MeshStandardMaterial({ color: new Color(color), roughness: opts.rough ?? 0.62, metalness: opts.metal ?? 0, transparent: true });
  if (opts.side !== undefined) m.side = opts.side;
  return m;
};

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; return t;
}

// ------------------------------------------------------------------ prop base
export abstract class PropFx {
  readonly root = new Group();
  owner: string | null = null;
  protected geos: BufferGeometry[] = [];
  protected mats: Material[] = [];
  protected texs: CanvasTexture[] = [];
  protected t = 0;
  private s = 0;                       // 0 hidden … 1 shown
  private target = 0;
  private mode: PropShowMode | PropHideMode = 'instant';
  private dur = 0.25;
  private baseScale = 1;
  /** Fully gone (hidden and finished) → the manager disposes it. */
  done = false;
  /** G3: kept alive but not drawn (e.g. per-fox team markers replaced by a shared group effect). */
  suppressed = false;
  constructor(readonly id: PropId, parent: Object3D, baseScale = 1) {
    this.root.name = `FX_PROP_${id}`; this.root.userData.fxProp = true; this.baseScale = baseScale;
    this.root.scale.setScalar(0.001); parent.add(this.root);
  }
  protected mesh(geo: BufferGeometry, mat: Material, parent: Object3D = this.root) {
    this.geos.push(geo); if (!this.mats.includes(mat)) this.mats.push(mat);
    const m = new Mesh(geo, mat); m.castShadow = false; m.renderOrder = 12; parent.add(m); return m;
  }
  get shown() { return this.target === 1; }
  get visibility() { return this.s; }
  show(mode: PropShowMode = 'pop') { this.target = 1; this.mode = mode; this.dur = mode === 'pop' ? 0.28 : mode === 'fade' ? 0.45 : 0; this.done = false; if (mode === 'instant') this.s = 1; }
  hide(mode: PropHideMode = 'fade') { if (this.target === 0 && this.s === 0) { this.done = true; return; } this.target = 0; this.mode = mode; this.dur = mode === 'poof' ? 0.22 : mode === 'burst' ? 0.3 : mode === 'fade' ? 0.4 : 0; if (mode === 'instant') this.s = 0; }
  phase(_p: string) { /* per prop */ }
  update(dt: number) {
    this.t += dt;
    if (this.dur <= 0) this.s = this.target; else this.s = this.target ? Math.min(1, this.s + dt / this.dur) : Math.max(0, this.s - dt / this.dur);
    let k = 1, a = 1;
    if (this.target === 1) { if (this.mode === 'pop') k = easeOutBack(this.s); else { k = 0.9 + 0.1 * smooth01(this.s); a = smooth01(this.s); } }
    else if (this.mode === 'burst') { k = 1 + 0.35 * (1 - this.s); a = this.s; }
    else if (this.mode === 'poof') { k = this.s; a = Math.min(1, this.s * 1.5); }
    else { k = 0.92 + 0.08 * this.s; a = smooth01(this.s); }
    this.root.scale.setScalar(Math.max(0.001, k * this.baseScale));
    for (const m of this.mats) (m as MeshStandardMaterial).opacity = a * ((m.userData.alpha as number | undefined) ?? 1);
    this.root.visible = this.s > 0.001 && !this.suppressed;
    this.animate(dt);
    if (this.target === 0 && this.s <= 0) this.done = true;
  }
  protected animate(_dt: number) { /* per prop */ }
  dispose() { this.root.removeFromParent(); this.geos.forEach(g => g.dispose()); this.mats.forEach(m => m.dispose()); this.texs.forEach(t => t.dispose()); }
}

// ------------------------------------------------------------------ notebook (opens / closes)
export class NotebookProp extends PropFx {
  private left = new Group(); private right = new Group(); private open = 0; private openTgt = 0;
  constructor(parent: Object3D) {
    super('notebook', parent, 1.15);
    const L = PROP_LAYOUT.notebook;
    this.root.position.set(...L.pos); this.root.rotation.x = L.tiltX;
    const pageTex = canvasTex(128, 176, g => {
      g.fillStyle = '#FFFBF2'; g.fillRect(0, 0, 128, 176);
      g.strokeStyle = 'rgba(22,140,120,0.35)'; g.lineWidth = 2; for (let y = 28; y < 170; y += 16) { g.beginPath(); g.moveTo(10, y); g.lineTo(118, y); g.stroke(); }
      g.strokeStyle = 'rgba(242,107,58,0.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(22, 8); g.lineTo(22, 170); g.stroke();
      g.strokeStyle = 'rgba(22,50,74,0.75)'; g.lineWidth = 3; g.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const y = 26 + i * 16, w = 40 + ((i * 37) % 50); g.beginPath(); g.moveTo(30, y - 3); for (let x = 30; x < 30 + w; x += 6) g.lineTo(x, y - 3 - 3 * Math.sin(x * 0.7)); g.stroke(); }
      g.fillStyle = '#F6C85F'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 6 : 13; g.lineTo(96 + Math.cos(a) * r, 140 + Math.sin(a) * r); } g.fill();
    });
    this.texs.push(pageTex);
    const page = new MeshStandardMaterial({ map: pageTex, roughness: 0.85, transparent: true });
    const cover = std(LQ.teal, { rough: 0.55 }), edge = std('#F3E9D6', { rough: 0.9 }), spineM = std(LQ.orange, { rough: 0.5 });
    const W = 0.115, D = 0.16;
    for (const [grp, sx] of [[this.left, -1], [this.right, 1]] as const) {
      const cv = this.mesh(new PlaneGeometry(W + 0.006, D + 0.01), cover, grp); cv.rotation.x = -Math.PI / 2; cv.position.set(sx * (W / 2 + 0.002), -0.0045, 0);
      (cv.material as MeshStandardMaterial).side = DoubleSide;
      const blk = this.mesh(new PlaneGeometry(W, D), edge, grp); blk.rotation.x = -Math.PI / 2; blk.position.set(sx * W / 2, -0.002, 0);
      const pg = this.mesh(new PlaneGeometry(W, D), page, grp); pg.rotation.x = -Math.PI / 2; pg.position.set(sx * W / 2, 0.0005, 0);
      this.root.add(grp);
    }
    const spine = this.mesh(new CylinderGeometry(0.006, 0.006, D + 0.01, 10), spineM); spine.rotation.x = Math.PI / 2; spine.position.y = -0.003;
    this.setOpen(0);
  }
  private setOpen(o: number) {
    // closed: the left half folds onto the right half (cover outwards); open: both halves flat with a slight V
    this.left.rotation.z = -(1 - o) * Math.PI * 0.98 + o * 0.12;
    this.right.rotation.z = -o * 0.12;
  }
  override phase(p: string) { if (p === 'open') this.openTgt = 1; if (p === 'close') this.openTgt = 0; }
  override show(mode: PropShowMode = 'pop') { super.show(mode); if (mode === 'instant' || mode === 'fade') { this.openTgt = 1; } }
  protected override animate(dt: number) {
    this.open += (this.openTgt - this.open) * (1 - Math.exp(-16 * dt));
    this.setOpen(this.open);
  }
}

// ------------------------------------------------------------------ pencil (right-paw socket)
export class PencilProp extends PropFx {
  constructor(socket: Bone) {
    super('pencil', socket);
    const body = std('#F6C85F', { rough: 0.5 }), wood = std('#E9C79A', { rough: 0.8 }), lead = std('#2E3440', { rough: 0.4 });
    const ferrule = std('#C9CED6', { rough: 0.3, metal: 0.6 }), eraser = std(LQ.pink, { rough: 0.7 });
    const g = new Group(); this.root.add(g);
    this.mesh(new CylinderGeometry(0.0075, 0.0075, 0.085, 6), body, g).position.y = 0;
    const tipW = this.mesh(new ConeGeometry(0.0075, 0.02, 6), wood, g); tipW.position.y = 0.0525;
    const tipL = this.mesh(new ConeGeometry(0.0028, 0.008, 6), lead, g); tipL.position.y = 0.0605;
    const fe = this.mesh(new CylinderGeometry(0.008, 0.008, 0.01, 10), ferrule, g); fe.position.y = -0.0475;
    const er = this.mesh(new CylinderGeometry(0.0078, 0.0078, 0.012, 10), eraser, g); er.position.y = -0.0585;
    // the socket bone points down the paw: the pencil crosses the palm, tip toward the notebook page
    g.position.set(0.0, -0.012, 0.012); g.rotation.set(0.9, 0, 0.75);
  }
}

// ------------------------------------------------------------------ alarm clock (ringing / stopped / floating late clock)
export class AlarmClockProp extends PropFx {
  private body = new Group(); private hh: Mesh; private mh: Mesh; private ringing = false; private squash = 0; private wob = 0; private race = false;
  constructor(parent: Object3D, readonly floating = false) {
    super(floating ? 'late_clock' : 'alarm_clock', parent, floating ? 1.0 : PROP_LAYOUT.alarm_clock.scale);
    const L = floating ? PROP_LAYOUT.late_clock : PROP_LAYOUT.alarm_clock;
    this.root.position.set(L.pos[0], L.pos[1], L.pos[2]); if (!floating) this.root.rotation.y = PROP_LAYOUT.alarm_clock.yaw;
    this.root.add(this.body);
    const R = 0.072, red = std(floating ? LQ.teal : LQ.orange, { rough: 0.45 }), gold = std(LQ.gold, { rough: 0.35, metal: 0.4 }), dark = std(LQ.navy, { rough: 0.5 });
    const faceTex = canvasTex(128, 128, g => {
      g.fillStyle = '#FFF8EC'; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
      g.fillStyle = LQ.navy; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = i % 3 ? 50 : 47; g.beginPath(); g.arc(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, i % 3 ? 2.5 : 5, 0, Math.PI * 2); g.fill(); }
    });
    this.texs.push(faceTex);
    const yc = floating ? 0 : 0.105;
    const case_ = this.mesh(new CylinderGeometry(R, R, 0.05, 32), red, this.body); case_.rotation.x = Math.PI / 2; case_.position.y = yc;
    const rim = this.mesh(new TorusGeometry(R - 0.004, 0.006, 8, 32), gold, this.body); rim.position.set(0, yc, 0.026);
    const face = this.mesh(new CircleGeometry(R - 0.008, 32), new MeshStandardMaterial({ map: faceTex, roughness: 0.7, transparent: true }), this.body); face.position.set(0, yc, 0.0262);
    this.hh = this.mesh(new PlaneGeometry(0.008, 0.035), dark, this.body); this.hh.geometry.translate(0, 0.0175, 0); this.hh.position.set(0, yc, 0.028);
    this.mh = this.mesh(new PlaneGeometry(0.006, 0.05), dark, this.body); this.mh.geometry.translate(0, 0.025, 0); this.mh.position.set(0, yc, 0.029);
    const pin = this.mesh(new CircleGeometry(0.006, 12), gold, this.body); pin.position.set(0, yc, 0.03);
    for (const sx of [-1, 1]) {
      const bell = this.mesh(new SphereGeometry(0.03, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold, this.body);
      bell.position.set(sx * 0.045, yc + R - 0.004, 0); bell.rotation.z = -sx * 0.6;
      if (!floating) { const leg = this.mesh(new CylinderGeometry(0.006, 0.004, 0.04, 8), dark, this.body); leg.position.set(sx * 0.04, 0.022, 0); leg.rotation.z = sx * 0.4; }
    }
    const btn = this.mesh(new CylinderGeometry(0.012, 0.012, 0.012, 12), dark, this.body); btn.position.set(0, yc + R + 0.004, 0);
    const ham = this.mesh(new CylinderGeometry(0.003, 0.003, 0.03, 6), dark, this.body); ham.position.set(0, yc + R + 0.018, 0);
    this.setHands(0.3);
  }
  private setHands(t: number) { this.mh.rotation.z = -t * Math.PI * 2; this.hh.rotation.z = -t * Math.PI * 2 / 12 - 1.2; }
  setRinging(on: boolean) { this.ringing = on; }
  get isRinging() { return this.ringing; }
  stopHit() { this.ringing = false; this.squash = 1; }
  setRacing(on: boolean) { this.race = on; }
  override phase(p: string) { if (p === 'ring') this.setRinging(true); if (p === 'stop') this.stopHit(); if (p === 'race') this.setRacing(true); }
  protected override animate(dt: number) {
    const t = this.t;
    this.wob = this.ringing ? Math.min(1, this.wob + dt / 0.08) : Math.max(0, this.wob - dt / 0.15);
    this.squash = Math.max(0, this.squash - dt / 0.3);
    const sh = this.wob * Math.sin(t * 2 * Math.PI * 14);
    this.body.rotation.z = 0.13 * sh;
    this.body.position.y = this.floating ? 0.012 * Math.sin(t * 3) : 0.006 * this.wob * Math.abs(Math.sin(t * 2 * Math.PI * 7));
    const sq = this.squash * Math.sin(Math.min(1, this.squash) * Math.PI);
    this.body.scale.set(1 + 0.18 * sq, 1 - 0.25 * sq, 1 + 0.12 * sq);
    if (this.floating) this.body.rotation.z = 0.12 * Math.sin(t * 5);
    this.setHands(this.race ? t * 1.6 : 0.3 + (this.ringing ? 0 : 0));
  }
}

// ------------------------------------------------------------------ pillow + sleeping mat
export class PillowProp extends PropFx {
  private pill: Mesh; private squash = 0;
  constructor(parent: Object3D) {
    super('pillow', parent);
    this.root.position.set(...PROP_LAYOUT.pillow.pos);
    const tex = canvasTex(128, 64, g => { g.fillStyle = '#FFF6E9'; g.fillRect(0, 0, 128, 64); g.fillStyle = 'rgba(155,227,200,0.9)'; for (let x = 6; x < 128; x += 22) g.fillRect(x, 0, 8, 64); });
    this.texs.push(tex);
    this.pill = this.mesh(new SphereGeometry(1, 28, 14), new MeshStandardMaterial({ map: tex, roughness: 0.95, transparent: true }));
    this.pill.scale.set(0.19, 0.04, 0.13);
    this.pill.position.y = 0.0;
  }
  plop() { this.squash = 1; }
  override phase(p: string) { if (p === 'plop') this.plop(); }
  protected override animate(dt: number) {
    this.squash = Math.max(0, this.squash - dt / 0.45);
    const s = Math.sin(this.squash * Math.PI) * this.squash;
    this.pill.scale.set(0.19 * (1 + 0.1 * s), 0.04 * (1 - 0.3 * s), 0.13 * (1 + 0.1 * s));
  }
}

export class SleepMatProp extends PropFx {
  constructor(parent: Object3D) {
    super('sleep_mat', parent);
    this.root.position.set(...PROP_LAYOUT.sleep_mat.pos);
    const W = 1.08, H = 0.62, r = 0.14, s = new Shape();
    s.moveTo(-W / 2 + r, -H / 2); s.lineTo(W / 2 - r, -H / 2); s.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + r); s.lineTo(W / 2, H / 2 - r);
    s.quadraticCurveTo(W / 2, H / 2, W / 2 - r, H / 2); s.lineTo(-W / 2 + r, H / 2); s.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - r); s.lineTo(-W / 2, -H / 2 + r); s.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2);
    const geo = new ShapeGeometry(s, 8);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + W / 2) / W, (uv.getY(i) + H / 2) / H);
    const tex = canvasTex(256, 148, g => {
      g.fillStyle = '#BFE8DC'; g.fillRect(0, 0, 256, 148);
      g.strokeStyle = '#FFF6E9'; g.lineWidth = 5; g.setLineDash([10, 7]); g.strokeRect(12, 12, 232, 124); g.setLineDash([]);
      g.fillStyle = 'rgba(255,246,233,0.85)';
      for (const [x, y, rr] of [[40, 40, 7], [210, 36, 5], [190, 112, 8], [60, 110, 5], [128, 74, 4]] as const) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? rr * 0.45 : rr; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.fill(); }
    });
    this.texs.push(tex);
    const m = this.mesh(geo, new MeshStandardMaterial({ map: tex, roughness: 1, transparent: true, polygonOffset: true, polygonOffsetFactor: -1 }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 1;
  }
}

// ------------------------------------------------------------------ cooldown timer (hourglass + progress ring)
export class TimerProp extends PropFx {
  private sandTop: Mesh; private sandBot: Mesh; private ring: Mesh; private ringMat: MeshBasicMaterial;
  private glass = new Group(); private progress = 0; private shown_ = 0; private flash = 0; private flip = 0; private impatient = 0;
  constructor(parent: Object3D) {
    super('timer', parent);
    this.root.position.set(...PROP_LAYOUT.timer.pos);
    const disc = this.mesh(new CircleGeometry(0.085, 40), new MeshBasicMaterial({ color: new Color('#FFFFFF'), transparent: true, depthWrite: false }));
    (disc.material as Material).userData.alpha = 0.78; disc.position.z = -0.012;
    const track = this.mesh(new RingGeometry(0.072, 0.084, 48), new MeshBasicMaterial({ color: new Color('#DCEFEA'), transparent: true, depthWrite: false, side: DoubleSide }));
    track.position.z = -0.011;
    this.ringMat = new MeshBasicMaterial({ color: new Color(LQ.teal), transparent: true, depthWrite: false, side: DoubleSide });
    this.mats.push(this.ringMat);
    // one ring geometry (clockwise from 12 o'clock); progress = draw range, no per-frame allocation
    const rg = new RingGeometry(0.072, 0.084, TimerProp.SEG, 1, Math.PI / 2, -Math.PI * 2); this.geos.push(rg);
    this.ring = new Mesh(rg, this.ringMat); this.ring.position.z = -0.010; this.ring.renderOrder = 13; this.root.add(this.ring);
    const wood = std('#B9824D', { rough: 0.7 }), glassM = std('#E8F6FF', { rough: 0.15 }), sand = std(LQ.orange, { rough: 0.8 });
    glassM.userData.alpha = 0.45;
    for (const y of [0.052, -0.052]) { const cap = this.mesh(new CylinderGeometry(0.03, 0.03, 0.01, 20), wood, this.glass); cap.position.y = y; }
    for (const sx of [-1, 1]) { const post = this.mesh(new CylinderGeometry(0.003, 0.003, 0.1, 6), wood, this.glass); post.position.set(sx * 0.026, 0, 0); }
    const top = this.mesh(new ConeGeometry(0.022, 0.045, 20, 1, true), glassM, this.glass); top.position.y = 0.024; top.rotation.x = Math.PI;
    const bot = this.mesh(new ConeGeometry(0.022, 0.045, 20, 1, true), glassM, this.glass); bot.position.y = -0.024;
    this.sandTop = this.mesh(new ConeGeometry(0.018, 0.036, 16), sand, this.glass); this.sandTop.geometry.translate(0, -0.018, 0); this.sandTop.rotation.x = Math.PI; this.sandTop.position.y = 0.006;
    this.sandBot = this.mesh(new ConeGeometry(0.019, 0.036, 16), sand, this.glass); this.sandBot.geometry.translate(0, 0.018, 0); this.sandBot.position.y = -0.046;
    this.root.add(this.glass);
    this.setProgress(0);
  }
  /** 0..1 (data from the application; the runtime never invents durations). */
  setProgress(p: number) { this.progress = Math.min(1, Math.max(0, p)); }
  setImpatient(on: boolean) { this.impatient = on ? 1 : 0; }
  ding() { this.flash = 1; this.flip = 1; }
  override phase(p: string) { if (p === 'ding') this.ding(); }
  get value() { return this.progress; }
  protected override animate(dt: number) {
    this.shown_ += (this.progress - this.shown_) * (1 - Math.exp(-6 * dt));
    const p = this.shown_;
    (this.ring.geometry as BufferGeometry).setDrawRange(0, Math.round(TimerProp.SEG * p) * 6);
    this.sandTop.scale.setScalar(Math.max(0.001, Math.cbrt(1 - p)));
    this.sandBot.scale.setScalar(Math.max(0.001, Math.cbrt(p)));
    this.flash = Math.max(0, this.flash - dt / 0.5); this.flip = Math.max(0, this.flip - dt / 0.45);
    this.ringMat.color.set(this.flash > 0 ? (Math.sin(this.t * 40) > 0 ? LQ.gold : LQ.teal) : LQ.teal);
    this.glass.rotation.z = (1 - this.flip) * 0 + this.flip * Math.PI * (1 - this.flip) * 0.5 + 0.08 * this.impatient * Math.sin(this.t * 9);
    this.root.position.y = PROP_LAYOUT.timer.pos[1] + 0.012 * Math.sin(this.t * 2.2);
    this.root.rotation.y = 0.18 * Math.sin(this.t * 0.9);
  }
  static readonly SEG = 64;
}

// ------------------------------------------------------------------ persistent state effects (loops)
/** A continuous emitter (state effect). Emits small particle bursts at a rate; stops gracefully. */
export abstract class StreamFx implements Fx {
  owner?: string;
  protected bursts: FxParticles[] = [];
  protected t = 0; protected acc = 0; protected stopping = false;
  constructor(readonly category: FxCategory, protected ctx: FxContext, protected interval: number) {}
  protected abstract burst(): FxParticles | null;
  update(dt: number) {
    this.t += dt;
    if (!this.stopping) { this.acc += dt; while (this.acc >= this.interval) { this.acc -= this.interval; const b = this.burst(); if (b) this.bursts.push(b); } }
    this.bursts = this.bursts.filter(b => { const a = b.update(dt); if (!a) b.dispose(); return a; });
    return !this.stopping || this.bursts.length > 0;
  }
  stop() { this.stopping = true; for (const b of this.bursts) b.stop(); }
  dispose() { this.bursts.forEach(b => b.dispose()); this.bursts = []; }
}

export class FocusParticlesFx extends StreamFx {
  constructor(ctx: FxContext, low: boolean) { super('particles', ctx, low ? 1.4 : 0.55); }
  protected burst() {
    const o = this.ctx.anchor('notebook', v3());
    return new FxParticles('particles', { count: 2, tex: 'soft', colors: [LQ.mint, LQ.gold, '#FFFFFF'], additive: true, life: [1.6, 2.4], size: [0.014, 0.026],
      spawn: (_i, p, v, r) => { p.copy(o).add(v3((r() - 0.5) * 0.18, 0.02, (r() - 0.5) * 0.08)); v.set((r() - 0.5) * 0.04, 0.09 + r() * 0.05, 0.01); },
      drag: 0.4, grow: 0.6, fadeIn: 0.3 }, this.ctx, this.ctx.layer('particles'));
  }
}

export class SweatDropsFx extends StreamFx {
  private side = 1;
  constructor(ctx: FxContext, low: boolean) { super('particles', ctx, low ? 1.4 : 0.7); }
  protected burst() {
    const o = this.ctx.anchor('head', v3()); const s = (this.side = -this.side);
    return sweat(this.ctx, o.add(v3(s * 0.2, 0.02, 0.06)), 1, s);
  }
}

export function sweat(ctx: FxContext, o: Vector3, count: number, side = 0) {
  return new FxParticles('particles', { count, tex: 'drop', colors: ['#9FD8FF', '#CDEBFF', '#FFFFFF'], life: [0.6, 0.85], size: [0.03, 0.045],
    spawn: (_i, p, v, r) => { const sd = side || (r() < 0.5 ? -1 : 1); p.copy(o).add(v3((r() - 0.5) * 0.04, (r() - 0.5) * 0.03, 0)); v.set(sd * (0.18 + r() * 0.15), 0.35 + r() * 0.2, 0.05 + r() * 0.05); },
    gravity: 1.6, drag: 0.6, fadeIn: 0.05 }, ctx, ctx.layer('particles'));
}

/** Rising "Z" letters while asleep (one shared canvas texture per effect). */
export class ZzzFx implements Fx {
  readonly category: FxCategory = 'text'; owner?: string;
  private tex: CanvasTexture; private zs: { s: Sprite; age: number; dx: number }[] = []; private t = 0; private acc = 0; private stopping = false;
  constructor(private ctx: FxContext, private interval = 1.6) {
    this.tex = canvasTex(96, 96, g => { g.font = '900 78px "Plus Jakarta Sans", ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 12; g.strokeStyle = '#FFFFFF'; g.strokeText('Z', 48, 52); g.fillStyle = '#5B6BB5'; g.fillText('Z', 48, 52); });
    this.acc = interval * 0.6;
  }
  update(dt: number) {
    this.t += dt;
    if (!this.stopping) { this.acc += dt; if (this.acc >= this.interval) { this.acc = 0; this.spawn(); } }
    for (const z of this.zs) {
      z.age += dt; const u = z.age / 2.4;
      z.s.position.x += (0.05 + 0.03 * z.dx) * dt; z.s.position.y += 0.1 * dt; z.s.position.x += Math.sin(z.age * 3) * 0.02 * dt;
      const k = 0.05 + 0.06 * Math.min(1, u * 1.5); z.s.scale.set(k, k, 1);
      z.s.material.opacity = Math.min(1, z.age / 0.3) * (1 - smooth01((u - 0.6) / 0.4)) * (this.stopping ? Math.max(0, 1 - (this.t - this.stopT) / 0.3) : 1);
      z.s.material.rotation = 0.25 * Math.sin(z.age * 2);
    }
    this.zs = this.zs.filter(z => { const alive = z.age < 2.4 && z.s.material.opacity > 0.001; if (!alive) { z.s.removeFromParent(); z.s.material.dispose(); } return alive; });
    return !this.stopping || this.zs.length > 0;
  }
  private stopT = 0;
  private spawn() {
    const s = new Sprite(new SpriteMaterial({ map: this.tex, transparent: true, depthWrite: false })); s.renderOrder = 30; s.name = 'FX_zzz';
    const o = this.ctx.anchor('sleep_head', v3()); s.position.copy(o); s.scale.set(0.05, 0.05, 1);
    this.ctx.layer('text').add(s); this.zs.push({ s, age: 0, dx: this.ctx.rnd() });
  }
  /** Emit one Z right now (cue 'sleep.z'). */
  puffNow() { this.spawn(); }
  stop() { if (!this.stopping) { this.stopping = true; this.stopT = this.t; } }
  dispose() { for (const z of this.zs) { z.s.removeFromParent(); z.s.material.dispose(); } this.zs = []; this.tex.dispose(); }
}

/** Soft night-light glow around the sleeping fox, pulsing with the breath. */
export class SleepGlowFx implements Fx {
  readonly category: FxCategory = 'particles'; owner?: string;
  private s: Sprite; private mat: SpriteMaterial; private t = 0; private a = 0; private stopping = false;
  constructor(ctx: FxContext) {
    this.mat = new SpriteMaterial({ map: acquireTex('soft'), color: new Color('#B9C6FF'), transparent: true, depthWrite: false, blending: NormalBlending });
    this.s = new Sprite(this.mat); this.s.position.set(0, 0.22, -0.18); this.s.scale.set(1.25, 0.8, 1); this.s.renderOrder = -2; this.s.name = 'FX_sleep_glow';
    ctx.layer('particles').add(this.s);
  }
  update(dt: number) {
    this.t += dt; this.a = this.stopping ? Math.max(0, this.a - dt / 0.5) : Math.min(1, this.a + dt / 1.2);
    this.mat.opacity = this.a * (0.32 + 0.08 * Math.sin((this.t * 2 * Math.PI) / 4));
    return this.a > 0 || !this.stopping;
  }
  stop() { this.stopping = true; }
  dispose() { this.s.removeFromParent(); this.mat.dispose(); releaseTex('soft'); }
}

/** Warm morning light: a soft sun glow behind the fox + a few slow rays (glow only in low-cost mode). */
export class MorningLightFx implements Fx {
  readonly category: FxCategory = 'particles'; owner?: string;
  private g = new Group(); private glow: Sprite; private gm: SpriteMaterial; private rays: Mesh[] = []; private rm: MeshBasicMaterial | null = null; private rg: PlaneGeometry | null = null;
  private t = 0; private stopping = false; private a = 0;
  constructor(ctx: FxContext, private duration: number, low: boolean) {
    this.gm = new SpriteMaterial({ map: acquireTex('soft'), color: new Color('#FFE6A3'), transparent: true, depthWrite: false });
    this.glow = new Sprite(this.gm); this.glow.scale.set(1.5, 1.5, 1); this.glow.renderOrder = -3; this.g.add(this.glow);
    if (!low) {
      const tex = acquireTex('soft');
      this.rm = new MeshBasicMaterial({ map: tex, color: new Color('#FFF1C9'), transparent: true, depthWrite: false, side: DoubleSide });
      this.rg = new PlaneGeometry(0.09, 1.3); this.rg.translate(0, 0.65, 0);
      for (let i = 0; i < 6; i++) { const m = new Mesh(this.rg, this.rm); m.rotation.z = -0.9 + i * 0.36; m.renderOrder = -3; this.g.add(m); this.rays.push(m); }
    }
    this.g.position.set(-0.55, 0.95, -0.45); this.g.name = 'FX_morning_light';
    ctx.layer('particles').add(this.g);
  }
  update(dt: number) {
    this.t += dt;
    if (this.t > this.duration) this.stopping = true;
    this.a = this.stopping ? Math.max(0, this.a - dt / 0.8) : Math.min(1, this.a + dt / 0.6);
    this.gm.opacity = 0.55 * this.a;
    if (this.rm) this.rm.opacity = 0.22 * this.a;
    this.rays.forEach((r, i) => { r.rotation.z = -0.9 + i * 0.36 + 0.04 * Math.sin(this.t * 0.8 + i); });
    this.g.rotation.z = 0.05 * this.t;
    return this.a > 0 || !this.stopping;
  }
  stop() { this.stopping = true; }
  dispose() { this.g.removeFromParent(); this.gm.dispose(); releaseTex('soft'); if (this.rm) { this.rm.dispose(); releaseTex('soft'); } this.rg?.dispose(); }
}

/** Alarm ringing visual: vibration arcs around the clock + drives the clock shake while alive. */
export class AlarmRingFx implements Fx {
  readonly category: FxCategory = 'particles'; owner?: string;
  private rings: { m: Mesh; age: number }[] = []; private geo = new RingGeometry(0.85, 1, 32, 1, -0.7, 1.4); private mats: MeshBasicMaterial[] = [];
  private t = 0; private acc = 0; private stopping = false;
  constructor(private ctx: FxContext, private clock: () => AlarmClockProp | undefined, private until = Infinity, low = false) { this.interval = low ? 0.5 : 0.28; this.clock()?.setRinging(true); }
  private interval: number;
  update(dt: number) {
    this.t += dt; if (this.t > this.until) this.stop();
    if (!this.stopping) { this.acc += dt; if (this.acc >= this.interval) { this.acc = 0; this.spawn(); } this.clock()?.setRinging(true); }
    for (const r of this.rings) { r.age += dt; const u = r.age / 0.5; r.m.scale.setScalar(0.08 + 0.1 * u); (r.m.material as MeshBasicMaterial).opacity = 0.9 * (1 - u); }
    this.rings = this.rings.filter(r => { if (r.age < 0.5) return true; r.m.removeFromParent(); (r.m.material as MeshBasicMaterial).dispose(); return false; });
    return !this.stopping || this.rings.length > 0;
  }
  private spawn() {
    const c = this.ctx.anchor('alarm_clock', v3());
    for (const side of [1, -1]) {
      const mat = new MeshBasicMaterial({ color: new Color(LQ.orange), transparent: true, depthWrite: false, side: DoubleSide });
      const m = new Mesh(this.geo, mat); m.position.copy(c); m.rotation.z = side > 0 ? 0 : Math.PI; m.renderOrder = 16; m.name = 'FX_alarm_ring';
      this.ctx.layer('particles').add(m); this.rings.push({ m, age: 0 });
    }
  }
  stop() { if (!this.stopping) { this.stopping = true; this.clock()?.setRinging(false); } }
  dispose() { for (const r of this.rings) { r.m.removeFromParent(); (r.m.material as MeshBasicMaterial).dispose(); } this.rings = []; this.geo.dispose(); this.mats.forEach(m => m.dispose()); }
}

// ------------------------------------------------------------------ one-shot G2 particle cues
export function dustStep(ctx: FxContext, count = 6): Fx {
  return new FxParticles('particles', { count, tex: 'soft', colors: ['#E9D8C4', '#F4E8DA'], life: [0.35, 0.6], size: [0.03, 0.05],
    spawn: (_i, p, v, r) => { const a = r() * Math.PI * 2; p.set(Math.cos(a) * 0.08, 0.01, 0.03 + Math.sin(a) * 0.05); v.set(Math.cos(a) * 0.3, 0.08 + r() * 0.06, Math.sin(a) * 0.2); },
    drag: 3, grow: 1.8, fadeIn: 0.05 }, ctx, ctx.layer('particles'));
}
export function softPuff(ctx: FxContext, at: string, count = 6, color = '#FFFFFF'): Fx {
  const o = ctx.anchor(at, v3());
  return new FxParticles('particles', { count, tex: 'soft', colors: [color, '#F3F6FA'], life: [0.5, 0.9], size: [0.04, 0.07],
    spawn: (_i, p, v, r) => { const a = r() * Math.PI * 2; p.copy(o).add(v3(Math.cos(a) * 0.08, 0.02, Math.sin(a) * 0.06)); v.set(Math.cos(a) * 0.25, 0.06 + r() * 0.08, Math.sin(a) * 0.15); },
    drag: 3, grow: 1.6, fadeIn: 0.08 }, ctx, ctx.layer('particles'));
}
export function shakeLines(ctx: FxContext): Fx {
  const o = ctx.anchor('chest', v3());
  return new FxParticles('particles', { count: 8, tex: 'rect', colors: ['#FFFFFF', '#FFE9D6'], life: [0.25, 0.4], size: [0.018, 0.026],
    spawn: (i, p, v) => { const s = i % 2 ? 1 : -1; p.copy(o).add(v3(s * 0.26, -0.08 + (i >> 1) * 0.06, 0.05)); v.set(s * 0.5, 0, 0); },
    drag: 6, fadeIn: 0.02 }, ctx, ctx.layer('particles'));
}

export type { Object3D };
