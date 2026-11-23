import {
  CanvasTexture, CircleGeometry, Color, DoubleSide, Group, Mesh, MeshBasicMaterial,
  RingGeometry, SRGBColorSpace, Sprite, SpriteMaterial, Vector3,
} from 'three';
import { LQ, acquireTex, easeOutBack, releaseTex, smooth01, type Fx, type FxCategory, type FxContext } from './fxCore';

// Gate I — Voice Assistant & Task Creation runtime VFX.
// All effects live under FOX_FX_ROOT (uniform level scale), use normal alpha blending,
// respect reducedMotion & lowCost, and dispose every geometry / material / texture cleanly.

const v3 = (x = 0, y = 0, z = 0) => new Vector3(x, y, z);

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Persistent listening loop effect: soft expanding teal/mint acoustic rings near the head. */
export class VoiceWavesFx implements Fx {
  readonly category: FxCategory = 'particles';
  owner?: string;
  private rings: { m: Mesh; age: number; dur: number }[] = [];
  private geo = new RingGeometry(0.84, 1.0, 36);
  private t = 0;
  private acc = 0;
  private stopping = false;
  private interval: number;

  constructor(private ctx: FxContext, low: boolean) {
    this.interval = low ? 1.15 : 0.65;
    this.acc = this.interval * 0.8;
  }

  update(dt: number) {
    this.t += dt;
    if (!this.stopping) {
      this.acc += dt;
      if (this.acc >= this.interval) {
        this.acc = 0;
        this.spawn();
      }
    }
    for (const r of this.rings) {
      r.age += dt;
      const u = Math.min(1, r.age / r.dur);
      r.m.scale.setScalar(0.08 + 0.24 * u);
      (r.m.material as MeshBasicMaterial).opacity = 0.65 * Math.sin(Math.min(1, u * 1.4) * Math.PI * 0.5) * (1 - u);
    }
    this.rings = this.rings.filter(r => {
      if (r.age < r.dur) return true;
      r.m.removeFromParent();
      (r.m.material as MeshBasicMaterial).dispose();
      return false;
    });
    return !this.stopping || this.rings.length > 0;
  }

  private spawn() {
    const o = this.ctx.anchor('head', v3());
    const mat = new MeshBasicMaterial({ color: new Color(LQ.teal), transparent: true, depthWrite: false, side: DoubleSide });
    const m = new Mesh(this.geo, mat);
    m.position.copy(o).add(v3(0, 0.06, -0.05));
    m.renderOrder = 14;
    m.name = 'FX_voice_wave';
    this.ctx.layer('particles').add(m);
    this.rings.push({ m, age: 0, dur: 1.15 });
  }

  stop() { this.stopping = true; }
  dispose() {
    for (const r of this.rings) {
      r.m.removeFromParent();
      (r.m.material as MeshBasicMaterial).dispose();
    }
    this.rings = [];
    this.geo.dispose();
  }
}

/** Persistent voice processing loop effect: three gentle pulsing thought dots above the head. */
export class VoiceThinkingFx implements Fx {
  readonly category: FxCategory = 'particles';
  owner?: string;
  private g = new Group();
  private geo = new CircleGeometry(0.024, 20);
  private dots: { m: Mesh; mat: MeshBasicMaterial; idx: number }[] = [];
  private t = 0;
  private a = 0;
  private stopping = false;

  constructor(private ctx: FxContext) {
    this.g.name = 'FX_voice_thinking';
    const colors = [LQ.teal, LQ.mint, LQ.gold];
    for (let i = 0; i < 3; i++) {
      const mat = new MeshBasicMaterial({ color: new Color(colors[i]), transparent: true, depthWrite: false, side: DoubleSide });
      const m = new Mesh(this.geo, mat);
      m.position.set((i - 1) * 0.068, 0, 0);
      m.renderOrder = 22;
      this.g.add(m);
      this.dots.push({ m, mat, idx: i });
    }
    ctx.layer('particles').add(this.g);
  }

  update(dt: number) {
    this.t += dt;
    this.a = this.stopping ? Math.max(0, this.a - dt / 0.25) : Math.min(1, this.a + dt / 0.25);
    const o = this.ctx.anchor('head_top', v3());
    this.g.position.copy(o).add(v3(0, 0.14, 0.04));
    for (const d of this.dots) {
      const ph = this.t * 4.5 - d.idx * 0.85;
      const b = this.ctx.reducedMotion ? 0 : Math.max(0, Math.sin(ph));
      d.m.position.y = 0.022 * b;
      const sc = 0.85 + 0.35 * b;
      d.m.scale.setScalar(sc);
      d.mat.opacity = this.a * (0.55 + 0.45 * b);
    }
    return this.a > 0 || !this.stopping;
  }

  stop() { this.stopping = true; }
  dispose() {
    this.g.removeFromParent();
    this.geo.dispose();
    for (const d of this.dots) d.mat.dispose();
  }
}

/** One-shot soft ping ring when voice listening starts. */
export class VoicePingFx implements Fx {
  readonly category: FxCategory = 'particles';
  owner?: string;
  private geo = new RingGeometry(0.8, 1.0, 32);
  private mat: MeshBasicMaterial;
  private m: Mesh;
  private t = 0;
  private stopping = false;

  constructor(ctx: FxContext, at: string, private dur = 0.75) {
    this.mat = new MeshBasicMaterial({ color: new Color(LQ.mint), transparent: true, depthWrite: false, side: DoubleSide });
    this.m = new Mesh(this.geo, this.mat);
    this.m.renderOrder = 20;
    this.m.name = 'FX_voice_ping';
    this.m.position.copy(ctx.anchor(at, v3())).add(v3(0, 0.08, 0.02));
    ctx.layer('particles').add(this.m);
  }

  update(dt: number) {
    this.t += dt * (this.stopping ? 3 : 1);
    const u = Math.min(1, this.t / this.dur);
    this.m.scale.setScalar(0.05 + 0.22 * easeOutBack(u));
    this.mat.opacity = (1 - smooth01((u - 0.35) / 0.65)) * 0.85;
    return u < 1;
  }

  stop() { this.stopping = true; }
  dispose() { this.m.removeFromParent(); this.geo.dispose(); this.mat.dispose(); }
}

/** One-shot warm badge above head / notebook (idea star, checkmark, retry '?'). */
export class VoiceBadgeFx implements Fx {
  readonly category: FxCategory = 'text';
  owner?: string;
  private tex: CanvasTexture;
  private mat: SpriteMaterial;
  private s: Sprite;
  private glowMat: SpriteMaterial;
  private glow: Sprite;
  private g = new Group();
  private t = 0;
  private stopping = false;

  constructor(private ctx: FxContext, kind: 'idea' | 'check' | 'retry', at: string, private dur = 1.1) {
    const bg = kind === 'check' ? LQ.teal : kind === 'idea' ? LQ.gold : LQ.orange;
    const glyph = kind === 'check' ? '✓' : kind === 'idea' ? '★' : '?';
    this.tex = canvasTex(128, 128, g => {
      g.fillStyle = bg;
      g.beginPath();
      g.arc(64, 64, 52, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 8;
      g.strokeStyle = '#FFFFFF';
      g.stroke();
      g.fillStyle = '#FFFFFF';
      g.font = '900 66px "Plus Jakarta Sans", ui-rounded, system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(glyph, 64, 68);
    });
    this.glowMat = new SpriteMaterial({ map: acquireTex('soft'), color: new Color(bg), transparent: true, depthWrite: false });
    this.glow = new Sprite(this.glowMat);
    this.glow.scale.set(0.24, 0.24, 1);
    this.glow.renderOrder = 27;
    this.mat = new SpriteMaterial({ map: this.tex, transparent: true, depthWrite: false });
    this.s = new Sprite(this.mat);
    this.s.renderOrder = 28;
    this.g.name = `FX_voice_${kind}`;
    this.g.add(this.glow, this.s);
    this.g.position.copy(ctx.anchor(at, v3())).add(v3(0, kind === 'check' ? 0.18 : 0.15, 0.06));
    ctx.layer('text').add(this.g);
  }

  update(dt: number) {
    this.t += dt * (this.stopping ? 3 : 1);
    const u = Math.min(1, this.t / this.dur);
    const pop = u < 0.22 ? easeOutBack(u / 0.22) : 1;
    const fade = u > 0.72 ? 1 - smooth01((u - 0.72) / 0.28) : 1;
    const sc = 0.125 * pop;
    this.s.scale.set(sc, sc, 1);
    this.glow.scale.set(sc * 1.9, sc * 1.9, 1);
    this.mat.opacity = fade;
    this.glowMat.opacity = fade * 0.45;
    if (!this.ctx.reducedMotion) this.g.position.y += 0.04 * dt;
    return u < 1;
  }

  stop() { this.stopping = true; }
  dispose() {
    this.g.removeFromParent();
    this.mat.dispose();
    this.glowMat.dispose();
    this.tex.dispose();
    releaseTex('soft');
  }
}
