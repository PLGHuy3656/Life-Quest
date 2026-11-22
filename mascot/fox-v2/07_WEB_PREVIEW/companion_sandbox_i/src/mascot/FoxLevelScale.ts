import { MathUtils, Object3D, PerspectiveCamera, Vector3 } from 'three';
import { critStep } from './foxMath';

// Level growth = ONE uniform scale on ONE model / rig. No growth morphs, no age models.
// Hit proxies are children of the bones, so they scale with the fox; camera framing is computed for
// the largest scale, so every level fits the same frame and the growth stays visible.

export const LEVEL_SCALE_ANCHORS: readonly [level: number, scale: number][] = [[1, 0.8], [10, 0.92], [20, 1.0], [30, 1.1]];
export const FOX_MIN_SCALE = 0.8;
export const FOX_MAX_SCALE = 1.1;

/** Piecewise-linear level → uniform scale (Lv1 0.80 · Lv10 0.92 · Lv20 1.00 · Lv30+ 1.10). */
export function levelToScale(level: number): number {
  const L = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  const A = LEVEL_SCALE_ANCHORS;
  if (L >= A[A.length - 1][0]) return A[A.length - 1][1];
  for (let i = 0; i < A.length - 1; i++) {
    const [l0, s0] = A[i], [l1, s1] = A[i + 1];
    if (L <= l1) return s0 + ((L - l0) / (l1 - l0)) * (s1 - s0);
  }
  return A[0][1];
}

export class FoxLevelScale {
  private level = 20;
  private target = 1;
  private value = 1;
  private vel = 0;
  constructor(private targets: Object3D[]) {}

  setLevel(level: number, immediate = false) {
    this.level = Math.max(1, Math.floor(level));
    this.target = levelToScale(this.level);
    if (immediate) { this.value = this.target; this.vel = 0; this.apply(); }
  }
  getLevel() { return this.level; }
  getScale() { return this.value; }
  getTargetScale() { return this.target; }
  get animating() { return Math.abs(this.value - this.target) > 1e-4; }

  /** Smooth growth (critically damped, ~0.6 s). Uniform scale only. */
  update(dt: number, instant = false) {
    if (instant) { this.value = this.target; this.vel = 0; }
    else if (this.animating || Math.abs(this.vel) > 1e-5) [this.value, this.vel] = critStep(this.value, this.vel, this.target, 9, dt);
    else return;
    this.apply();
  }
  private apply() { for (const t of this.targets) t.scale.setScalar(this.value); }
}

// ------------------------------------------------------------------ camera framing
export type FoxPresentation = 'mini' | 'widget' | 'full';
/** Fit margins per presentation (same values the E2 size QA validated: small 1.2, medium 1.24, large 1.6). */
export const FRAMING_MARGIN: Record<FoxPresentation, number> = { mini: 1.2, widget: 1.24, full: 1.45 };
const VIEW_DIR = new Vector3(0.9, 0.27, 2.6).normalize();
const FRONT_DIR = new Vector3(0.32, 0.18, 2.6).normalize();

/**
 * Places the camera so the fox at FOX_MAX_SCALE (plus hops) fits the viewport. Because the frame is
 * sized for the largest level, a level change never needs a camera move and never clips.
 */
export function frameFoxCamera(camera: PerspectiveCamera, presentation: FoxPresentation, target = new Vector3(), view: 'three_quarter' | 'front' = 'three_quarter') {
  const H = FOX_MAX_SCALE * 1.12, W = FOX_MAX_SCALE * 1.0, margin = FRAMING_MARGIN[presentation];
  const vf = MathUtils.degToRad(camera.fov / 2), hf = Math.atan(Math.tan(vf) * camera.aspect);
  const d = Math.max(((H / 2) * margin) / Math.tan(vf), ((W / 2) * margin) / Math.tan(hf));
  target.set(0, H / 2 - 0.02, 0);
  camera.position.copy(target).addScaledVector(view === 'front' ? FRONT_DIR : VIEW_DIR, d);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  return target;
}
