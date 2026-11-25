import { Bone, Euler, MathUtils, Object3D, Quaternion, Vector3 } from 'three';

/** Frame-rate independent exponential smoothing toward a target. */
export const smooth = (cur: number, tgt: number, rate: number, dt: number) => cur + (tgt - cur) * (1 - Math.exp(-rate * dt));
export const clamp = MathUtils.clamp;

/** Critically damped spring step (4 sub-steps): no overshoot, no velocity jumps. Returns [x, v]. */
export function critStep(x: number, v: number, target: number, omega: number, dt: number): [number, number] {
  const k = omega * omega, c = 2 * omega, h = dt / 4;
  for (let i = 0; i < 4; i++) { v += (k * (target - x) - c * v) * h; x += v * h; }
  return [x, v];
}

/** Attack / hold / release envelope with smootherstep edges. */
export function envelope(u: number, attack: number, hold: number, release: number) {
  if (u < attack) return MathUtils.smootherstep(u, 0, attack);
  if (u < attack + hold) return 1;
  if (u < attack + hold + release) return 1 - MathUtils.smootherstep(u, attack + hold, attack + hold + release);
  return 0;
}

/** Small deterministic PRNG (seedable idle variation and tests). */
export function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Additive bone rotations expressed in the character's root frame, applied after the mixer.
 * Allocation-free (shared temporaries); identical maths to the approved E2 viewer.
 */
export class FoxBoneOps {
  private rq = new Quaternion();
  private rqInv = new Quaternion();
  private dW = new Quaternion();
  private qW = new Quaternion();
  private pW = new Quaternion();
  private e = new Euler();
  private axis = new Vector3();

  constructor(private root: Object3D) {}

  private rootQuat() { this.root.getWorldQuaternion(this.rq); this.rqInv.copy(this.rq).invert(); }

  private applyWorldDelta(bone: Bone) {
    bone.getWorldQuaternion(this.qW);
    (bone.parent as Object3D).getWorldQuaternion(this.pW);
    bone.quaternion.copy(this.pW.invert().multiply(this.dW.multiply(this.qW)));
    bone.updateMatrixWorld(true);
  }

  /** Yaw (left/right) and pitch (up) in degrees, around the root's up / right axes. */
  addRootRot(bone: Bone, yawDeg: number, pitchUpDeg: number) {
    this.rootQuat();
    this.e.set(MathUtils.degToRad(-pitchUpDeg), MathUtils.degToRad(yawDeg), 0, 'YXZ');
    this.dW.setFromEuler(this.e);
    this.dW.premultiply(this.rq).multiply(this.rqInv);
    this.applyWorldDelta(bone);
  }

  /** Rotation about an armature (Blender) axis in the root frame: X→X, Y→−Z, Z→Y (glTF Y-up). */
  addLocal(bone: Bone, axisBlender: 'x' | 'y' | 'z', deg: number) {
    this.rootQuat();
    if (axisBlender === 'x') this.axis.set(1, 0, 0); else if (axisBlender === 'y') this.axis.set(0, 0, -1); else this.axis.set(0, 1, 0);
    this.axis.applyQuaternion(this.rq);
    this.dW.setFromAxisAngle(this.axis, MathUtils.degToRad(deg));
    this.applyWorldDelta(bone);
  }
}
