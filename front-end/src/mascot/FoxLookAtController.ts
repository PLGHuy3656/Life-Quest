import { Bone, Camera, MathUtils, Mesh, Object3D, Quaternion, Raycaster, Vector2, Vector3 } from 'three';
import { LOOK_TUNING as LOOK } from './foxContract';
import { FoxBoneOps, clamp, critStep, smooth } from './foxMath';

// Procedural look-at (post-mixer additive layer). Behaviour identical to the approved E2 viewer:
//   1. raw cursor angle → low-pass (jitter never reaches the head)
//   2. dead zone (±3° yaw, ±2° pitch) around the committed target
//   3. gentle return toward neutral after 2.5 s without pointer activity, or when the pointer leaves
//   4. critically damped spring on the DESIRED head direction; the clip's own head motion is
//      compensated instantly, so tracking never lags behind fast idle head moves
//   5. weight = 1 − Σ(clip weight × headControl): clips that own the head always win

export interface FoxLookInput { camera: Camera; pointerInside: boolean; pointerNdc: Vector2; headControl: number; levelScale: number }

export class FoxLookAtController {
  enabled = true;
  /** Hard multiplier (reduced motion / resting set this below 1). */
  intensity = 1;
  private w = 1; yaw = 0; pitch = 0;
  private vy = 0; private vp = 0;
  private eyeYaw = 0; private eyePitch = 0; private evy = 0; private evp = 0;
  private tYaw = 0; private tPitch = 0; private rawYaw = 0; private rawPitch = 0; private cYaw = 0; private cPitch = 0;
  private still = 0; private rest = 1; private dYaw?: number; private dPitch?: number;
  private ray = new Raycaster();
  private v1 = new Vector3(); private v2 = new Vector3(); private v3 = new Vector3(); private v4 = new Vector3();
  private q1 = new Quaternion(); private q2 = new Quaternion();
  private eyes: { mesh: Mesh; pos: Vector3; right: Vector3; up: Vector3 }[] = [];

  constructor(private root: Object3D, private bones: { NECK: Bone; HEAD: Bone; SPINE: Bone }, eyeMeshes: Mesh[], private ops: FoxBoneOps) {
    root.updateMatrixWorld(true);
    for (const e of eyeMeshes) {
      const p0 = e.getWorldPosition(new Vector3()), par = e.parent as Object3D;
      const toLocal = (d: Vector3) => par.worldToLocal(p0.clone().add(d)).sub(par.worldToLocal(p0.clone())).divideScalar(d.length());
      this.eyes.push({ mesh: e, pos: e.position.clone(), right: toLocal(new Vector3(0.001, 0, 0)), up: toLocal(new Vector3(0, 0.001, 0)) });
    }
  }

  /** Pointer moved by more than the activity threshold: restart the "pointer resting" timer. */
  notifyActivity() { this.still = 0; }
  get weight() { return this.w; }
  /** True while the fox is actually following the cursor. */
  get tracking() { return this.w > 0.5 && this.hasPointer; }
  private hasPointer = false;

  reset() {
    Object.assign(this, { yaw: 0, pitch: 0, vy: 0, vp: 0, eyeYaw: 0, eyePitch: 0, evy: 0, evp: 0, rawYaw: 0, rawPitch: 0, cYaw: 0, cPitch: 0, tYaw: 0, tPitch: 0, still: 0, rest: 1 });
    this.dYaw = this.dPitch = undefined;
    for (const e of this.eyes) e.mesh.position.copy(e.pos);
  }

  private target(dt: number, inp: FoxLookInput) {
    if (!inp.pointerInside) { this.tYaw = 0; this.tPitch = 0; return; }
    const { HEAD } = this.bones;
    this.ray.setFromCamera(inp.pointerNdc, inp.camera);
    const head = HEAD.getWorldPosition(this.v1).add(this.v2.set(0, 0.18 * inp.levelScale, 0));
    const n = inp.camera.getWorldDirection(this.v3);
    const o = this.ray.ray.origin, dir = this.ray.ray.direction;
    const t = n.dot(this.v4.copy(head).sub(o)) / n.dot(dir);
    const p = this.ray.ray.at(Math.max(0.1, t), this.v4);
    const d = this.root.worldToLocal(p).sub(this.root.worldToLocal(this.v2.copy(head)));
    const yaw = clamp(MathUtils.radToDeg(Math.atan2(d.x, d.z)), -LOOK.yawMax, LOOK.yawMax);
    const pitch = clamp(MathUtils.radToDeg(Math.atan2(d.y, Math.hypot(d.x, d.z))), -LOOK.pitchDown, LOOK.pitchUp);
    this.rawYaw = smooth(this.rawYaw, yaw, LOOK.inputRate, dt); this.rawPitch = smooth(this.rawPitch, pitch, LOOK.inputRate, dt);
    const dz = (v: number, c: number, band: number) => { const e = v - c; return Math.abs(e) <= band ? c : c + e - Math.sign(e) * band; };
    this.cYaw = dz(this.rawYaw, this.cYaw, LOOK.deadYaw); this.cPitch = dz(this.rawPitch, this.cPitch, LOOK.deadPitch);
    this.still += dt;
    const resting = this.still > LOOK.restDelay;
    this.rest = smooth(this.rest, resting ? LOOK.restKeep : 1, resting ? LOOK.restRate : 6, dt);
    this.tYaw = this.cYaw * this.rest; this.tPitch = this.cPitch * this.rest;
  }

  /** Head direction relative to the upper body (SPINE), degrees. */
  private headYawPitch(): [number, number] {
    const qh = this.bones.HEAD.getWorldQuaternion(this.q1), qs = this.bones.SPINE.getWorldQuaternion(this.q2);
    const f = this.v3.set(0, 0, 1).applyQuaternion(qs.invert().multiply(qh));
    return [MathUtils.radToDeg(Math.atan2(f.x, f.z)), MathUtils.radToDeg(Math.atan2(f.y, Math.hypot(f.x, f.z)))];
  }

  update(dt: number, inp: FoxLookInput) {
    this.hasPointer = inp.pointerInside && this.enabled;
    const pointerIn = this.hasPointer;
    this.target(dt, { ...inp, pointerInside: pointerIn });
    const allowed = this.enabled ? (1 - inp.headControl) * this.intensity : 0;
    this.w = smooth(this.w, allowed, 10, dt);
    const cy = this.headYawPitch();
    const om = pointerIn ? LOOK.omega : LOOK.returnOmega, eom = pointerIn ? LOOK.eyeOmega : LOOK.returnOmega * 1.6;
    if (this.dYaw === undefined || this.dPitch === undefined) { this.dYaw = cy[0]; this.dPitch = cy[1]; }
    [this.dYaw, this.vy] = critStep(this.dYaw, this.vy, pointerIn ? this.tYaw : cy[0], om, dt);
    [this.dPitch, this.vp] = critStep(this.dPitch, this.vp, pointerIn ? this.tPitch : cy[1], om, dt);
    [this.eyeYaw, this.evy] = critStep(this.eyeYaw, this.evy, pointerIn ? this.tYaw : 0, eom, dt);
    [this.eyePitch, this.evp] = critStep(this.eyePitch, this.evp, pointerIn ? this.tPitch : 0, eom, dt);
    const w = this.w;
    const yawAdd = clamp(cy[0] + (this.dYaw - cy[0]) * w, -LOOK.yawMax, LOOK.yawMax) - cy[0];
    const pitAdd = clamp(cy[1] + (this.dPitch - cy[1]) * w, -LOOK.pitchDown, LOOK.pitchUp) - cy[1];
    this.yaw = yawAdd; this.pitch = pitAdd;
    if (w > 1e-4 && (Math.abs(yawAdd) > 1e-3 || Math.abs(pitAdd) > 1e-3)) {
      this.ops.addRootRot(this.bones.NECK, yawAdd * LOOK.neck, pitAdd * LOOK.neckPitch);
      this.ops.addRootRot(this.bones.HEAD, yawAdd * LOOK.head, pitAdd * LOOK.headPitch);
    }
    for (const e of this.eyes) {
      const ex = clamp(this.eyeYaw / LOOK.yawMax, -1, 1) * LOOK.eyeX * w, ey = clamp(this.eyePitch / LOOK.pitchUp, -1, 1) * LOOK.eyeY * w;
      e.mesh.position.copy(e.pos).addScaledVector(e.right, ex).addScaledVector(e.up, ey);
    }
  }

  /** Total head direction relative to the upper body (tests / debug). */
  headDirection() { return this.headYawPitch(); }
}
