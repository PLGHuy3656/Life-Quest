import { Bone, Box3, Camera, CapsuleGeometry, Mesh, MeshBasicMaterial, Object3D, Raycaster, SphereGeometry, Vector2, Vector3 } from 'three';
import { LOOK_TUNING } from './foxContract';

// Pointer interaction through real raycasting against bone-attached hit proxies (head ellipsoid,
// four tail capsules). The body mesh occludes the tail. Proxies are children of the bones, so they
// follow the animation AND the level scale automatically.
//
// Noise control: picks only run when the pointer moved ≥ 3 px (or 120 ms passed), hover enter is
// immediate but hover exit waits 120 ms (no flicker on the silhouette edge), taps need < 6 px of
// travel, each target has a 0.6 s tap cooldown, and a head "stroke" needs 40 px of drag.

export type FoxHitTarget = 'head' | 'tail' | 'none';
export interface FoxPick { target: FoxHitTarget; point?: Vector3; distance?: number; blocked?: 'body' }
export interface FoxInteractionCallbacks {
  onHover?(target: FoxHitTarget): void;
  onTap?(target: 'head' | 'tail', via: 'click' | 'stroke' | 'keyboard'): void;
  onGrab?(grabbing: boolean): void;
  onActivity?(): void;
}

const MOVE_PX = LOOK_TUNING.moveThresholdPx;

export class FoxInteractionManager {
  enabled = true;
  readonly pointerNdc = new Vector2();
  pointerInside = false;
  hover: FoxHitTarget = 'none';
  pointerDown = false;
  readonly proxies: { head: Mesh | null; tail: Mesh[] } = { head: null, tail: [] };
  /** Picking cost (ms) — exposed for the performance report. */
  readonly stats = { picks: 0, pickMsTotal: 0, pickMsMax: 0, taps: 0, ignoredTaps: 0 };

  private el: HTMLElement | null = null;
  private camera: Camera | null = null;
  private ray = new Raycaster();
  private px = new Vector2(); private lastPickPx = new Vector2(-1e9, -1e9); private lastActivityPx = new Vector2(-1e9, -1e9);
  private lastPickT = 0; private needPick = false; private hoverExitAt = 0;
  private down: { target: 'head' | 'tail'; x: number; y: number; stroke: number; fired: boolean; pointerId: number } | null = null;
  private cooldownUntil: Record<'head' | 'tail', number> = { head: 0, tail: 0 };
  private touchLeaveTimer: ReturnType<typeof setTimeout> | null = null;
  private off: (() => void)[] = [];

  constructor(private root: Object3D, private bones: Record<string, Bone>, private body: Object3D | null, private tailMeshes: Mesh[], private headObj: Object3D, private cb: FoxInteractionCallbacks = {}) {
    this.buildProxies();
  }

  // ---------------------------------------------------------------- proxies
  private buildProxies() {
    this.root.updateMatrixWorld(true);
    const mat = new MeshBasicMaterial({ color: 0x168c78, wireframe: true, transparent: true, opacity: 0.35, depthTest: false });
    mat.visible = false;
    const parentScene = this.root;   // build in root space then re-parent to the bones (keeps world transform)
    const hb = new Box3().setFromObject(this.headObj, true), c = hb.getCenter(new Vector3()), s = hb.getSize(new Vector3());
    const head = new Mesh(new SphereGeometry(1, 20, 14), mat);
    head.scale.set(0.5 * s.x * 0.95, 0.5 * s.y * 1.05, 0.5 * s.z * 0.95);
    parentScene.worldToLocal(c); head.position.copy(c); head.name = 'PROXY_head'; head.userData.target = 'head'; head.renderOrder = 10;
    parentScene.add(head); this.bones.HEAD.attach(head); this.proxies.head = head;

    const pts: Vector3[] = [];
    for (const tail of this.tailMeshes) {
      const n = tail.geometry.attributes.position.count;
      for (let i = 0; i < n; i += 3) { const v = new Vector3(); (tail as Mesh & { getVertexPosition(i: number, v: Vector3): Vector3 }).getVertexPosition(i, v); pts.push(v.applyMatrix4(tail.matrixWorld)); }
    }
    const P = [1, 2, 3, 4].map(i => this.bones['TAIL_0' + i].getWorldPosition(new Vector3()));
    const far = pts.reduce((m, p) => (p.distanceTo(P[0]) > m.distanceTo(P[0]) ? p : m), P[3]); P.push(far);
    for (let i = 0; i < 4; i++) {
      const a = P[i], b = P[i + 1], ab = b.clone().sub(a), L = ab.length(), dir = ab.clone().normalize();
      const ds = pts.filter(p => { const t = p.clone().sub(a).dot(dir); return t > -0.02 && t < L + 0.02; })
        .map(p => p.clone().sub(a).sub(dir.clone().multiplyScalar(p.clone().sub(a).dot(dir))).length()).sort((x, y) => x - y);
      const r = Math.max(0.03, ds.length ? ds[Math.floor(ds.length * 0.85)] : 0.06);
      const cap = new Mesh(new CapsuleGeometry(r, Math.max(0.001, L), 6, 12), mat);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      cap.position.copy(parentScene.worldToLocal(mid)); cap.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir);
      cap.name = 'PROXY_tail_' + (i + 1); cap.userData.target = 'tail'; cap.renderOrder = 10;
      parentScene.add(cap); this.bones['TAIL_0' + (i + 1)].attach(cap); this.proxies.tail.push(cap);
    }
  }

  setProxiesVisible(v: boolean) { for (const p of [this.proxies.head, ...this.proxies.tail]) if (p) (p.material as MeshBasicMaterial).visible = v; }

  // ---------------------------------------------------------------- view binding
  attach(el: HTMLElement, camera: Camera) {
    this.detach();
    this.el = el; this.camera = camera;
    const on = <K extends keyof HTMLElementEventMap>(t: HTMLElement | Window, type: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      t.addEventListener(type, fn as EventListener, opts); this.off.push(() => t.removeEventListener(type, fn as EventListener, opts));
    };
    on(el, 'pointermove', e => this.onMove(e), { passive: true });
    on(el, 'pointerleave', e => this.onLeave(e));
    on(el, 'pointerdown', e => this.onDown(e));
    on(window, 'pointerup', e => this.onUp(e as PointerEvent));
    on(window, 'pointercancel', () => { this.endDown(); });
    on(el, 'keydown', e => this.onKey(e as KeyboardEvent));
  }
  setCamera(camera: Camera) { this.camera = camera; }
  detach() { this.off.forEach(f => f()); this.off = []; this.el = null; this.setHover('none'); this.pointerInside = false; if (this.touchLeaveTimer) clearTimeout(this.touchLeaveTimer); }

  private setFromEvent(e: PointerEvent) {
    const r = this.el!.getBoundingClientRect();
    this.px.set(e.clientX - r.left, e.clientY - r.top);
    this.pointerNdc.set((this.px.x / r.width) * 2 - 1, -(this.px.y / r.height) * 2 + 1);
    this.pointerInside = true;
  }

  private onMove(e: PointerEvent) {
    if (!this.enabled) return;
    if (e.pointerType === 'touch' && !this.down) return;   // touch has no hover; only drags count
    this.setFromEvent(e);
    if (this.px.distanceTo(this.lastActivityPx) > MOVE_PX) { this.lastActivityPx.copy(this.px); this.cb.onActivity?.(); }
    if (this.px.distanceTo(this.lastPickPx) >= MOVE_PX) this.needPick = true;
    if (this.down && this.down.target === 'head' && e.pointerId === this.down.pointerId) {
      this.down.stroke += Math.hypot(e.movementX || 0, e.movementY || 0);
      if (this.down.stroke > 40 && !this.down.fired) { this.down.fired = true; this.tap('head', 'stroke'); }
    }
  }

  private onLeave(e: PointerEvent) {
    if (e.pointerType === 'touch') return;
    this.pointerInside = false; this.setHover('none'); this.cb.onActivity?.();
  }

  private onDown(e: PointerEvent) {
    if (!this.enabled || !this.camera) return;
    this.setFromEvent(e);
    const p = this.pick(this.pointerNdc);
    if (p.target === 'none') return;
    this.down = { target: p.target, x: e.clientX, y: e.clientY, stroke: 0, fired: false, pointerId: e.pointerId };
    this.pointerDown = true; this.cb.onGrab?.(true);
    if (e.pointerType === 'touch' && this.touchLeaveTimer) clearTimeout(this.touchLeaveTimer);
  }

  private onUp(e: PointerEvent) {
    if (!this.down || e.pointerId !== this.down.pointerId) return;
    const moved = Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y);
    if (moved < 6 && !this.down.fired) this.tap(this.down.target, 'click');
    this.endDown();
    if (e.pointerType === 'touch') { this.touchLeaveTimer = setTimeout(() => { this.pointerInside = false; this.setHover('none'); }, 1200); }
  }

  private endDown() { if (this.down) { this.down = null; this.pointerDown = false; this.cb.onGrab?.(false); } }

  private onKey(e: KeyboardEvent) {
    if (!this.enabled) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.tap('head', 'keyboard'); }
    else if (e.key.toLowerCase() === 't') { this.tap('tail', 'keyboard'); }
  }

  private tap(target: 'head' | 'tail', via: 'click' | 'stroke' | 'keyboard') {
    const now = performance.now();
    if (now < this.cooldownUntil[target]) { this.stats.ignoredTaps++; return; }
    this.cooldownUntil[target] = now + 600; this.stats.taps++;
    this.cb.onTap?.(target, via);
  }

  private setHover(t: FoxHitTarget) {
    if (t === this.hover) return;
    this.hover = t; this.cb.onHover?.(t);
    if (this.el) this.el.style.cursor = t === 'head' ? 'grab' : t === 'tail' ? 'pointer' : '';
  }

  // ---------------------------------------------------------------- picking
  pick(ndc: Vector2): FoxPick {
    if (!this.camera || !this.proxies.head) return { target: 'none' };
    const t0 = performance.now();
    this.ray.setFromCamera(ndc, this.camera);
    const hit = this.ray.intersectObjects([this.proxies.head, ...this.proxies.tail], false)[0];
    let out: FoxPick = { target: 'none' };
    if (hit) {
      const target = hit.object.userData.target as 'head' | 'tail';
      out = { target, point: hit.point, distance: hit.distance };
      if (target === 'tail' && this.body) {   // the real body mesh in front of the tail blocks it
        const occ = this.ray.intersectObject(this.body, true)[0];
        if (occ && occ.distance < hit.distance - 0.01) out = { target: 'none', blocked: 'body', point: occ.point };
      }
    }
    const ms = performance.now() - t0;
    this.stats.picks++; this.stats.pickMsTotal += ms; this.stats.pickMsMax = Math.max(this.stats.pickMsMax, ms);
    return out;
  }

  /** Called once per frame (after the pose is final): throttled hover picking with exit hysteresis. */
  update(now = performance.now()) {
    if (!this.enabled) { if (this.hover !== 'none') this.setHover('none'); return; }
    if (!this.pointerInside) return;
    if (!this.needPick && now - this.lastPickT < 120) return;   // moving fox under a still cursor: re-pick at ~8 Hz
    this.needPick = false; this.lastPickT = now; this.lastPickPx.copy(this.px);
    const p = this.pick(this.pointerNdc);
    if (p.target !== 'none') { this.hoverExitAt = 0; this.setHover(p.target); }
    else if (this.hover !== 'none') { if (!this.hoverExitAt) this.hoverExitAt = now + 120; else if (now >= this.hoverExitAt) { this.hoverExitAt = 0; this.setHover('none'); } }
  }

  dispose() {
    this.detach();
    const mats = new Set<MeshBasicMaterial>();
    for (const p of [this.proxies.head, ...this.proxies.tail]) if (p) { p.geometry.dispose(); mats.add(p.material as MeshBasicMaterial); p.removeFromParent(); }
    mats.forEach(m => m.dispose());
    this.proxies.head = null; this.proxies.tail = [];
  }
}
