import { Bone, BufferGeometry, Material, Matrix4, Object3D, Skeleton, SkinnedMesh, Texture, type Mesh } from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  COSMETIC_CATALOG, COSMETIC_SLOTS, HAND_BUSY_CLIPS, OUTFIT_PRESETS, SLOT_ATTACH, SLOT_DEFAULTS, isCosmeticSlot,
  type CosmeticItemDef, type CosmeticResult, type CosmeticSlot, type EquippedItem, type OutfitPresetId, type OutfitSpec,
} from './cosmeticContract';

// Gate H1 — persistent cosmetic runtime for one Fox instance.
//
// Asset path: one parsed GLB per item URL, shared by every Fox on the page (ref-counted, disposed after a keep-alive).
// Instance path: a new SkinnedMesh on the SHARED geometry / materials, bound to THIS Fox's bones by joint name with the
// item's own inverse bind matrices. Nothing about the Fox (skeleton, materials, clips, controller contracts) is changed;
// default accessories are only hidden (Object3D.visible) while an item replaces them.

export type FoxCosmeticEvent =
  | { type: 'cosmetic'; op: 'equip' | 'unequip'; slot: CosmeticSlot; id: string; replaced?: string | null }
  | { type: 'cosmetic'; op: 'error'; slot?: CosmeticSlot; id: string; reason: string; detail?: string }
  | { type: 'cosmetic'; op: 'hand-busy'; slot: CosmeticSlot; id: string; busy: boolean; cause: string };

interface Template { gltf: GLTF; mesh: SkinnedMesh; jointNames: string[]; boneInverses: Matrix4[]; bytes: number; loadMs: number }
interface TemplateEntry { promise: Promise<Template>; refs: number; settled?: Template; disposeTimer?: ReturnType<typeof setTimeout> }
const templates = new Map<string, TemplateEntry>();
let keepAliveMs = 5000;
export const setCosmeticKeepAlive = (ms: number) => { keepAliveMs = Math.max(0, ms); };
/** Diagnostics: cached item GLBs. */
export const cosmeticCacheState = () => [...templates.entries()].map(([url, e]) => ({ url, refs: e.refs, loaded: !!e.settled, pendingDispose: !!e.disposeTimer }));
/** Test hook: drop unused cached item GLBs now. */
export function purgeCosmeticCache() { for (const [url, e] of templates) if (e.refs === 0 && e.settled) { if (e.disposeTimer) clearTimeout(e.disposeTimer); disposeGltf(e.settled.gltf); templates.delete(url); } }

class CosmeticLoadError extends Error { constructor(public reason: 'load-failed' | 'contract', msg: string) { super(msg); } }

async function loadTemplate(url: string): Promise<Template> {
  const t0 = performance.now();
  let res: Response;
  try { res = await fetch(url); } catch (e) { throw new CosmeticLoadError('load-failed', `network: ${String(e)}`); }
  if (!res.ok) throw new CosmeticLoadError('load-failed', `HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const base = url.slice(0, url.lastIndexOf('/') + 1);
  const gltf = await new Promise<GLTF>((resolve, reject) => new GLTFLoader().parse(buf, base, resolve, err => reject(new CosmeticLoadError('load-failed', `parse: ${String((err as unknown as Error)?.message ?? err)}`))));
  const skinned: SkinnedMesh[] = [];
  gltf.scene.traverse(o => { if ((o as SkinnedMesh).isSkinnedMesh) skinned.push(o as SkinnedMesh); });
  // contract: exactly one skinned mesh (glTF may split it into primitives = sibling SkinnedMeshes sharing one skeleton)
  if (!skinned.length) { disposeGltf(gltf); throw new CosmeticLoadError('contract', 'no skinned mesh in the item file'); }
  const sk = skinned[0].skeleton;
  if (skinned.some(m => m.skeleton !== sk)) { disposeGltf(gltf); throw new CosmeticLoadError('contract', 'item primitives use different skeletons'); }
  gltf.scene.updateMatrixWorld(true);
  return { gltf, mesh: skinned[0], jointNames: sk.bones.map(b => b.name), boneInverses: sk.boneInverses.map(m => m.clone()), bytes: buf.byteLength, loadMs: performance.now() - t0 };
}

function acquireTemplate(url: string): Promise<Template> {
  let e = templates.get(url);
  if (!e) {
    const created: TemplateEntry = { promise: loadTemplate(url), refs: 0 };
    created.promise.then(t => { created.settled = t; }, () => templates.delete(url));
    templates.set(url, created); e = created;
  }
  e.refs++;
  if (e.disposeTimer) { clearTimeout(e.disposeTimer); e.disposeTimer = undefined; }
  const entry = e;
  return entry.promise.catch(err => { entry.refs--; throw err; });
}
function releaseTemplate(url: string) {
  const e = templates.get(url); if (!e) return;
  e.refs = Math.max(0, e.refs - 1);
  if (e.refs === 0 && e.settled) e.disposeTimer = setTimeout(() => { if (e.refs === 0 && e.settled) { disposeGltf(e.settled.gltf); templates.delete(url); } }, keepAliveMs);
}
function disposeGltf(gltf: GLTF) {
  const geos = new Set<BufferGeometry>(), mats = new Set<Material>(), texs = new Set<Texture>();
  gltf.scene.traverse(o => {
    const m = o as Mesh; if (!m.isMesh) return; geos.add(m.geometry);
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) { mats.add(mat); for (const v of Object.values(mat as unknown as Record<string, unknown>)) if (v && (v as Texture).isTexture) texs.add(v as Texture); }
  });
  gltf.scene.traverse(o => { const s = o as SkinnedMesh; if (s.isSkinnedMesh) s.skeleton.dispose(); });
  geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); texs.forEach(t => t.dispose());
}

interface Equipped { def: CosmeticItemDef; url: string; root: Object3D; meshes: SkinnedMesh[]; skeleton: Skeleton; busy: string | null }
export interface CosmeticHost {
  fox: Object3D;
  bones: Record<string, Bone>;
  objs: Record<string, Object3D>;
  baseUrl: string;
  /** Current one-shot clip (hand-busy clip rules). */
  currentClip(): string | null;
  /** Streak flame held in the left paw. */
  flameVisible(): boolean;
  /** New shared resources were attached under the Fox (render bindings must re-scan). */
  resourcesChanged(): void;
  emit(e: FoxCosmeticEvent): void;
}

export class FoxCosmeticManager {
  /** Slot → equipped item. */
  private slots = new Map<CosmeticSlot, Equipped>();
  /** Slot → in-flight equip (latest request wins). */
  private pending = new Map<CosmeticSlot, { id: string; seq: number }>();
  private seq = 0;
  private disposed = false;
  private hidden = new Map<string, Set<string>>();     // approved mesh name → reasons it is hidden (item ids / slot defaults)
  private registry: Record<string, CosmeticItemDef> = { ...COSMETIC_CATALOG };
  /** Statistics for validation. */
  readonly stats = { equips: 0, unequips: 0, failures: 0, skeletonsCreated: 0, skeletonsDisposed: 0 };

  constructor(private host: CosmeticHost) {}

  // ------------------------------------------------------------------ catalogue
  /** Register an extra item definition (e.g. tests, future library items). */
  register(def: CosmeticItemDef) { this.registry[def.id] = def; }
  getItemDef(id: string): CosmeticItemDef | undefined { return this.registry[id]; }
  items() { return Object.values(this.registry); }

  // ------------------------------------------------------------------ API
  async equip(id: string): Promise<CosmeticResult> {
    if (this.disposed) return { ok: false, id, reason: 'disposed' };
    const def = this.registry[id];
    if (!def) { this.fail(id, undefined, 'unknown-item'); return { ok: false, id, reason: 'unknown-item' }; }
    const slot = def.slot;
    if (this.slots.get(slot)?.def.id === id && !this.pending.has(slot)) return { ok: true, slot, id, replaced: null };
    const mySeq = ++this.seq;
    this.pending.set(slot, { id, seq: mySeq });
    const url = this.host.baseUrl + def.path;
    let tpl: Template;
    try { tpl = await acquireTemplate(url); } catch (e) {
      if (this.pending.get(slot)?.seq === mySeq) this.pending.delete(slot);
      const reason = e instanceof CosmeticLoadError ? e.reason : 'load-failed';
      this.fail(id, slot, reason, String((e as Error)?.message ?? e));
      return { ok: false, id, slot, reason, detail: String((e as Error)?.message ?? e) };   // slot keeps what it had (default accessory stays visible)
    }
    if (this.disposed || this.pending.get(slot)?.seq !== mySeq) { releaseTemplate(url); return { ok: false, id, slot, reason: this.disposed ? 'disposed' : 'superseded' }; }
    this.pending.delete(slot);
    // bind by joint name to THIS fox's skeleton
    const missing = tpl.jointNames.filter(n => !this.host.bones[n]);
    if (missing.length) { releaseTemplate(url); this.fail(id, slot, 'contract', `joints not on the Fox: ${missing.join(', ')}`); return { ok: false, id, slot, reason: 'contract', detail: `joints not on the Fox: ${missing.join(', ')}` }; }
    const skeleton = new Skeleton(tpl.jointNames.map(n => this.host.bones[n]), tpl.boneInverses.map(m => m.clone()));
    this.stats.skeletonsCreated++;
    const root = new Object3D(); root.name = `COSMETIC_${slot}_${id}`;
    const meshes: SkinnedMesh[] = [];
    tpl.gltf.scene.traverse(o => {
      const t = o as SkinnedMesh; if (!t.isSkinnedMesh) return;
      const m = new SkinnedMesh(t.geometry, t.material);          // shared geometry / material (no CPU copy)
      m.name = t.name; m.frustumCulled = false; m.renderOrder = t.renderOrder;
      m.bind(skeleton, t.bindMatrix.clone());
      m.userData.cosmetic = { id, slot };
      root.add(m); meshes.push(m);
    });
    // cross-slot conflicts (equipping wins), then replace the slot
    const removed: string[] = [];
    for (const [s, e] of [...this.slots]) {
      if (s === slot) continue;
      if (def.excludes?.includes(e.def.id) || def.excludes?.includes(s) || e.def.excludes?.includes(id) || e.def.excludes?.includes(slot)) { this.remove(s); removed.push(e.def.id); }
    }
    const replaced = this.slots.get(slot)?.def.id ?? null;
    if (replaced) this.remove(slot, true);
    // the skin is attached at the Fox root (same space as the Fox's own skinned meshes)
    this.host.fox.add(root);
    const eq: Equipped = { def, url, root, meshes, skeleton, busy: null };
    this.slots.set(slot, eq);
    this.applyHides();
    this.stats.equips++;
    this.updateHandBusy(true);
    this.host.resourcesChanged();
    this.host.emit({ type: 'cosmetic', op: 'equip', slot, id, replaced });
    return { ok: true, slot, id, replaced, removed: removed.length ? removed : undefined };
  }

  /** Unequip by item id or slot. The slot default (scarf / backpack) comes back. */
  unequip(idOrSlot: string): boolean {
    const slot = isCosmeticSlot(idOrSlot) ? idOrSlot : [...this.slots.entries()].find(([, e]) => e.def.id === idOrSlot)?.[0];
    this.pending.forEach((p, s) => { if (p.id === idOrSlot || s === idOrSlot) this.pending.delete(s); });
    if (!slot || !this.slots.has(slot)) return false;
    this.remove(slot);
    return true;
  }

  /** Apply a preset or a slot map. Slots not named go back to their default; `null` empties a slot (defaults return). */
  async setOutfit(outfit: OutfitPresetId | OutfitSpec): Promise<CosmeticResult[]> {
    const spec: OutfitSpec = typeof outfit === 'string' ? ((OUTFIT_PRESETS as Record<string, OutfitSpec>)[outfit] ?? null)! : outfit;
    if (!spec) return [{ ok: false, id: String(outfit), reason: 'unknown-item' }];
    for (const s of COSMETIC_SLOTS) if (!(s in spec) || spec[s] === null) { this.unequip(s); }
    const jobs = Object.entries(spec).filter((e): e is [CosmeticSlot, string] => isCosmeticSlot(e[0]) && typeof e[1] === 'string').map(([, id]) => this.equip(id));
    return Promise.all(jobs);
  }
  resetOutfit() { for (const s of COSMETIC_SLOTS) this.unequip(s); }

  getEquippedItems(): EquippedItem[] {
    const out: EquippedItem[] = [];
    for (const s of COSMETIC_SLOTS) {
      const e = this.slots.get(s);
      if (e) out.push({ slot: s, id: e.def.id, default: false, visibility: e.busy ? 'hidden-hand-busy' : 'visible', fixture: e.def.fixture });
      else if (this.pending.has(s)) out.push({ slot: s, id: this.pending.get(s)!.id, default: false, visibility: 'loading' });
      else if (SLOT_DEFAULTS[s]) out.push({ slot: s, id: SLOT_DEFAULTS[s]!.id, default: true, visibility: 'visible' });
    }
    return out;
  }
  /** Persistable outfit (slot → item id); restore with setOutfit(). */
  serialize(): OutfitSpec { return Object.fromEntries([...this.slots].map(([s, e]) => [s, e.def.id])); }

  /** Per-frame: hand-busy visibility (temporary props win over HAND items, for that time only). */
  update() { this.updateHandBusy(false); }

  /** Diagnostics / validation access. */
  debugSlot(slot: CosmeticSlot) { const e = this.slots.get(slot); return e ? { id: e.def.id, root: e.root, meshes: e.meshes, skeleton: e.skeleton, busy: e.busy } : null; }
  get hiddenMeshes() { return [...this.hidden.entries()].filter(([, r]) => r.size).map(([n]) => n); }

  dispose() {
    if (this.disposed) return;
    for (const s of [...this.slots.keys()]) this.remove(s, true);
    this.pending.clear();
    this.disposed = true;
    this.applyHides();
  }

  // ------------------------------------------------------------------ internals
  private remove(slot: CosmeticSlot, silent = false) {
    const e = this.slots.get(slot); if (!e) return;
    this.slots.delete(slot);
    e.root.removeFromParent();
    e.skeleton.dispose(); this.stats.skeletonsDisposed++;          // per-instance bone texture (if any)
    releaseTemplate(e.url);                                          // shared geometry is disposed with the template
    this.applyHides();
    this.stats.unequips++;
    if (!silent) this.host.emit({ type: 'cosmetic', op: 'unequip', slot, id: e.def.id });
  }

  private applyHides() {
    const want = new Map<string, Set<string>>();
    const add = (mesh: string, why: string) => { let s = want.get(mesh); if (!s) want.set(mesh, (s = new Set())); s.add(why); };
    if (!this.disposed) for (const [slot, e] of this.slots) {
      for (const m of SLOT_DEFAULTS[slot]?.meshes ?? []) add(m, e.def.id);
      for (const m of e.def.hides) add(m, e.def.id);
    }
    const names = new Set([...this.hidden.keys(), ...want.keys()]);
    for (const n of names) {
      const o = this.host.objs[n]; if (!o) continue;
      o.visible = !(want.get(n)?.size);
    }
    this.hidden = want;
  }

  private handBusyCause(slot: 'HAND_LEFT' | 'HAND_RIGHT'): string | null {
    const clip = this.host.currentClip();
    if (clip && HAND_BUSY_CLIPS[slot].includes(clip)) return `clip:${clip}`;
    if (slot === 'HAND_LEFT' && this.host.flameVisible()) return 'prop:streak_flame';
    // any temporary prop parented under the paw socket / paw bone
    const att = SLOT_ATTACH[slot];
    for (const bn of [att.socket, att.deformBone]) {
      const b = this.host.bones[bn]; if (!b) continue;
      for (const c of b.children) if (!(c as Bone).isBone && c.visible) return `prop:${c.name || 'socket-prop'}`;
    }
    return null;
  }

  private updateHandBusy(force: boolean) {
    for (const slot of ['HAND_LEFT', 'HAND_RIGHT'] as const) {
      const e = this.slots.get(slot); if (!e) continue;
      const cause = this.handBusyCause(slot);
      if (!force && (cause === null) === (e.busy === null)) { e.busy = cause; continue; }
      e.busy = cause;
      e.root.visible = cause === null;
      this.host.emit({ type: 'cosmetic', op: 'hand-busy', slot, id: e.def.id, busy: cause !== null, cause: cause ?? 'free' });
    }
  }

  private fail(id: string, slot: CosmeticSlot | undefined, reason: string, detail?: string) {
    this.stats.failures++;
    console.warn(`[fox] cosmetic ${id} not equipped: ${reason}${detail ? ` (${detail})` : ''}`);
    this.host.emit({ type: 'cosmetic', op: 'error', slot, id, reason, detail });
  }
}
