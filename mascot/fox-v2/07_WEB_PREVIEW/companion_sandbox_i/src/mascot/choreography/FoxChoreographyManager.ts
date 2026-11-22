import { Group, Vector3, type Object3D } from 'three';
import type { FoxController } from '../FoxController';
import { FX_CATEGORIES, type Fx, type FxCategory, type FxContext } from '../effects/fxCore';
import { mulberry32 } from '../foxMath';

// Gate G3 — reusable multi-mascot coordination layer.
// * Renderer-agnostic, like FoxController: several Fox instances share ONE three.js scene (no extra canvas, no copy of the
//   Fox geometry — every instance is a SkeletonUtils clone sharing the cached GLB geometry / materials / textures).
// * The manager owns: participant registry, relative placement, synchronised starts (same update tick), the shared VFX
//   layer (effects that belong to the pair / group, not to one fox), coordinator life cycle, cancellation and cleanup.
// * Each fox keeps its own controller, mixer, effects and event registry: a coordinator never replaces them, it only
//   starts their clips together and post-processes the frame (e.g. FoxDuoCoordinator's paw-contact correction).
// * Host loop: manager.update(dt) — updates every participant, then the coordinators' post-update hooks, then the
//   shared VFX. (A host that updates the controllers itself calls manager.postUpdate(dt) after them.)

export interface FoxCoordinator {
  readonly kind: string;
  /** After all participants were updated this tick (bones final for the frame). */
  postUpdate(dt: number): void;
  /** A participant was removed / disposed: stop whatever involves it. */
  participantRemoved(id: string): void;
  dispose(): void;
  readonly active: boolean;
}

export interface FoxParticipantInfo { id: string; controller: FoxController; slot: number }

export class FoxChoreographyManager {
  /** Add to the host scene (stage origin). Shared, pair-level and group-level effects live here (world units = metres). */
  readonly root = new Group();
  private parts = new Map<string, FoxParticipantInfo>();
  private coords = new Set<FoxCoordinator>();
  private sharedFx: Fx[] = [];
  private layers = {} as Record<FxCategory, Group>;
  private reduced = false;
  private rnd = mulberry32(23);
  private tick = 0;
  readonly log: { tick: number; what: string; detail?: unknown }[] = [];
  /** FxContext for shared effects: anchors are explicit world points (anchor names resolve to the stage origin). */
  readonly ctx: FxContext;

  constructor() {
    this.root.name = 'FOX_CHOREO_ROOT';
    for (const c of FX_CATEGORIES) { const g = new Group(); g.name = 'CHOREO_layer_' + c; this.layers[c] = g; this.root.add(g); }
    const mgr = this; // eslint-disable-line @typescript-eslint/no-this-alias
    this.ctx = { anchor: (_n, o) => o.set(0, 0.5, 0), layer: c => mgr.layers[c], get reducedMotion() { return mgr.reduced; }, rnd: () => mgr.rnd() };
  }

  // ---------------------------------------------------------------- participants
  add(id: string, controller: FoxController): FoxParticipantInfo {
    if (this.parts.has(id)) throw new Error(`[fox] choreography participant "${id}" already registered`);
    const info = { id, controller, slot: this.parts.size };
    this.parts.set(id, info);
    return info;
  }
  remove(id: string) {
    const p = this.parts.get(id); if (!p) return;
    for (const c of this.coords) c.participantRemoved(id);
    p.controller.setSharedCueHandler(null); p.controller.setLinkTargetProvider(null);
    this.parts.delete(id);
  }
  get(id: string) { return this.parts.get(id)?.controller; }
  idOf(c: FoxController) { for (const p of this.parts.values()) if (p.controller === c) return p.id; return undefined; }
  get participants() { return [...this.parts.values()]; }

  /** Relative placement on the stage (metres, yaw in radians). The Fox's own level scale is applied inside its controller. */
  place(id: string, x: number, z = 0, yaw = 0) {
    const c = this.get(id); if (!c) return;
    c.object3D.position.set(x, 0, z); c.object3D.rotation.set(0, yaw, 0); c.object3D.updateMatrixWorld(true);
  }

  // ---------------------------------------------------------------- synchronisation
  /** Run several starts in ONE tick (same update): the clips then advance on identical dt, frame-locked. */
  startTogether<T>(starts: (() => T)[]): { tick: number; results: T[] } {
    const results = starts.map(fn => fn());
    this.log.push({ tick: this.tick, what: 'start-together', detail: results });
    return { tick: this.tick, results };
  }

  // ---------------------------------------------------------------- coordinators
  attach<C extends FoxCoordinator>(c: C): C { this.coords.add(c); return c; }
  detach(c: FoxCoordinator) { if (this.coords.delete(c)) c.dispose(); }
  get coordinators() { return [...this.coords]; }

  // ---------------------------------------------------------------- shared effects
  addShared(fx: Fx | null) { if (fx) this.sharedFx.push(fx); return fx; }
  /** Convert a point from a fox's fx-root local space to stage (manager root) space. */
  toStage(controller: FoxController, local: Vector3, out = new Vector3()) {
    const fxRoot = controller.effects.root; out.copy(local); fxRoot.localToWorld(out); this.root.worldToLocal(out); return out;
  }
  layer(c: FxCategory): Object3D { return this.layers[c]; }
  setReducedMotion(on: boolean) { this.reduced = on; }

  // ---------------------------------------------------------------- per frame
  /** Update every participant, then the coordinators, then the shared effects. */
  update(dt: number) {
    for (const p of this.parts.values()) p.controller.update(dt);
    this.postUpdate(dt);
  }
  /** For hosts that update the controllers themselves. */
  postUpdate(dt: number) {
    this.tick++;
    for (const c of [...this.coords]) { c.postUpdate(dt); if (!c.active) this.detach(c); }
    this.sharedFx = this.sharedFx.filter(f => { const alive = f.update(dt); if (!alive) f.dispose(); return alive; });
  }
  /** Stop every coordinator and shared effect (participants keep running their own state). */
  cancelAll() { for (const c of [...this.coords]) this.detach(c); this.sharedFx.forEach(f => f.dispose()); this.sharedFx = []; }

  stats() {
    let objects = 0; this.root.traverse(() => objects++);
    return { participants: this.parts.size, coordinators: [...this.coords].map(c => c.kind), sharedFx: this.sharedFx.length, rootObjects: objects, tick: this.tick };
  }
  dispose() { this.cancelAll(); for (const id of [...this.parts.keys()]) this.remove(id); this.root.removeFromParent(); }
}
