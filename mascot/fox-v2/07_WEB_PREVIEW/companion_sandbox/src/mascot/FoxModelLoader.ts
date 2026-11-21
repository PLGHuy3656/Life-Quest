import { AnimationClip, Bone, BufferGeometry, Material, Mesh, Object3D, PropertyBinding, Texture } from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CLIP_META, CORE_BASE_CLIPS, CORE_ONE_SHOT_CLIPS, FOX_ASSET_FPS, REQUIRED_BONES, REQUIRED_MORPHS, type FoxClipName } from './foxContract';

// One parsed GLB per URL, shared by every companion instance on the page.
// Instances get a SkeletonUtils clone: their own bones / morph influences, but the SAME
// BufferGeometry, Material and Texture objects — Fox geometry is never duplicated on the CPU.

export type FoxAssetErrorKind = 'network' | 'parse' | 'contract' | 'aborted' | 'module';
export class FoxAssetError extends Error {
  constructor(public kind: FoxAssetErrorKind, message: string, public details: string[] = []) { super(message); this.name = 'FoxAssetError'; }
}

export interface FoxModuleReport { id: string; url: string; ok: boolean; bytes: number; loadMs: number; clips: string[]; tracks: number; boundTracks: number; morphTracks: number; problems: string[] }
export interface FoxAssetInfo { url: string; bytes: number; fetchMs: number; parseMs: number; loadMs: number; fromCache: boolean; triangles: number; meshes: number; modules: FoxModuleReport[] }

export interface FoxAssetHandle {
  /** Per-instance clone (shares geometry / materials / textures with the cached template). */
  scene: Object3D;
  clips: AnimationClip[];
  info: FoxAssetInfo;
  /** Must be called exactly once when the instance is disposed. */
  release(): void;
}

interface CacheEntry { promise: Promise<{ gltf: GLTF; info: Omit<FoxAssetInfo, 'fromCache'> }>; refs: number; disposeTimer?: ReturnType<typeof setTimeout>; settled?: { gltf: GLTF } }
const cache = new Map<string, CacheEntry>();
/** How long an unused parsed GLB stays cached (quick route changes do not re-download). */
let keepAliveMs = 5000;
export const setFoxAssetKeepAlive = (ms: number) => { keepAliveMs = Math.max(0, ms); };

function validateContract(gltf: GLTF): string[] {
  const problems: string[] = [];
  const bones = new Set<string>(), meshes = new Map<string, Mesh[]>();
  gltf.scene.traverse(o => {
    if ((o as Bone).isBone) bones.add(o.name);
    if ((o as Mesh).isMesh) { const k = o.name; meshes.set(k, [...(meshes.get(k) ?? []), o as Mesh]); }
  });
  for (const b of REQUIRED_BONES) if (!bones.has(b)) problems.push(`missing bone ${b}`);
  const clipNames = new Set(gltf.animations.map(c => c.name));
  for (const c of [...CORE_BASE_CLIPS, ...CORE_ONE_SHOT_CLIPS]) if (!clipNames.has(c)) problems.push(`missing clip ${c}`);
  for (const [mesh, morphs] of Object.entries(REQUIRED_MORPHS)) {
    const m = meshes.get(mesh)?.[0];
    if (!m) { problems.push(`missing face mesh ${mesh}`); continue; }
    const dict = m.morphTargetDictionary ?? {};
    for (const mt of morphs) if (!(mt in dict)) problems.push(`missing morph ${mesh}.${mt}`);
  }
  return problems;
}

function countTriangles(root: Object3D) {
  let tris = 0, n = 0;
  root.traverse(o => { const m = o as Mesh; if (!m.isMesh) return; n++; const g = m.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; });
  return { tris: Math.round(tris), meshes: n };
}

async function loadEntry(url: string) {
  const t0 = performance.now();
  let res: Response;
  try { res = await fetch(url); } catch (e) { throw new FoxAssetError('network', `Could not download the Fox model (${url})`, [String(e)]); }
  if (!res.ok) throw new FoxAssetError('network', `Fox model request failed: HTTP ${res.status} (${url})`);
  const buf = await res.arrayBuffer();
  const t1 = performance.now();
  const base = url.slice(0, url.lastIndexOf('/') + 1);
  const gltf = await new Promise<GLTF>((resolve, reject) =>
    new GLTFLoader().parse(buf, base, resolve, err => reject(new FoxAssetError('parse', 'The Fox model file could not be parsed', [String((err as unknown as Error)?.message ?? err)]))));
  const t2 = performance.now();
  const problems = validateContract(gltf);
  if (problems.length) throw new FoxAssetError('contract', `The Fox model does not match the runtime contract (${problems.length} problems)`, problems);
  const { tris, meshes } = countTriangles(gltf.scene);
  return { gltf, info: { url, bytes: buf.byteLength, fetchMs: t1 - t0, parseMs: t2 - t1, loadMs: t2 - t0, triangles: tris, meshes, modules: [] as FoxModuleReport[] } };
}

// ------------------------------------------------------------------ animation-only modules
interface ModuleEntry { promise: Promise<{ clips: AnimationClip[]; bytes: number; loadMs: number }> }
const moduleCache = new Map<string, ModuleEntry>();

async function fetchGltf(url: string) {
  let res: Response;
  try { res = await fetch(url); } catch (e) { throw new FoxAssetError('network', `Could not download ${url}`, [String(e)]); }
  if (!res.ok) throw new FoxAssetError('network', `HTTP ${res.status} (${url})`);
  const buf = await res.arrayBuffer();
  const base = url.slice(0, url.lastIndexOf('/') + 1);
  const gltf = await new Promise<GLTF>((resolve, reject) =>
    new GLTFLoader().parse(buf, base, resolve, err => reject(new FoxAssetError('parse', `${url} could not be parsed`, [String((err as unknown as Error)?.message ?? err)]))));
  return { gltf, bytes: buf.byteLength };
}

function loadModule(url: string) {
  let e = moduleCache.get(url);
  if (!e) {
    e = {
      promise: (async () => {
        const t0 = performance.now();
        const { gltf, bytes } = await fetchGltf(url);
        // the module's own nodes (armature + 1-triangle morph carriers) are discarded: only the clips are kept
        disposeTemplate(gltf);
        return { clips: gltf.animations, bytes, loadMs: performance.now() - t0 };
      })(),
    };
    e.promise.catch(() => moduleCache.delete(url));
    moduleCache.set(url, e);
  }
  return e.promise;
}

/**
 * Proves that every track of a module clip binds to the loaded Fox: the target node exists, the
 * property exists on it, and morph-weight tracks carry exactly one value per morph target of that
 * mesh (same count as the Fox). Durations are checked against the contract (±1 frame).
 */
export function bindModuleClips(scene: Object3D, clips: AnimationClip[], expected: readonly FoxClipName[], id: string, url: string, bytes = 0, loadMs = 0): { report: FoxModuleReport; clips: AnimationClip[] } {
  const problems: string[] = [];
  let tracks = 0, bound = 0, morph = 0;
  const byName = new Map(clips.map(c => [c.name, c]));
  for (const name of expected) {
    const clip = byName.get(name);
    if (!clip) { problems.push(`clip ${name} missing from module`); continue; }
    const meta = CLIP_META[name];
    if (Math.abs(clip.duration - meta.durationS) > 1 / FOX_ASSET_FPS + 1e-3) problems.push(`${name}: duration ${clip.duration.toFixed(4)} s ≠ contract ${meta.durationS.toFixed(4)} s`);
    for (const tr of clip.tracks) {
      tracks++;
      const p = PropertyBinding.parseTrackName(tr.name);
      const node = PropertyBinding.findNode(scene, p.nodeName) as (Object3D & { morphTargetInfluences?: number[] }) | null;
      if (!node) { problems.push(`${name}: track ${tr.name} → node "${p.nodeName}" not found on the Fox`); continue; }
      if (p.propertyName === 'morphTargetInfluences') {
        morph++;
        const n = node.morphTargetInfluences?.length ?? 0;
        const per = tr.values.length / tr.times.length;
        if (!n || per !== n) { problems.push(`${name}: ${tr.name} has ${per} weights per key, Fox mesh has ${n} morph targets`); continue; }
      } else if (!(p.propertyName in node)) { problems.push(`${name}: ${tr.name} → property ${p.propertyName} missing`); continue; }
      bound++;
    }
  }
  const ok = problems.length === 0;
  return { report: { id, url, ok, bytes, loadMs, clips: expected.filter(n => byName.has(n)), tracks, boundTracks: bound, morphTracks: morph, problems: problems.slice(0, 20) }, clips: ok ? expected.map(n => byName.get(n)!).filter(Boolean) : [] };
}

function disposeTemplate(gltf: GLTF) {
  const geos = new Set<BufferGeometry>(), mats = new Set<Material>(), texs = new Set<Texture>();
  gltf.scene.traverse(o => {
    const m = o as Mesh; if (!m.isMesh) return;
    geos.add(m.geometry);
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      mats.add(mat);
      for (const v of Object.values(mat as unknown as Record<string, unknown>)) if (v && (v as Texture).isTexture) texs.add(v as Texture);
    }
  });
  geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); texs.forEach(t => t.dispose());
}

export interface FoxModuleRequest { id: string; url: string; clips: readonly FoxClipName[] }

/** Load (or reuse) the Fox GLB (+ animation-only modules) and return a per-instance clone. */
export async function acquireFoxAsset(url: string, signal?: AbortSignal, modules: readonly FoxModuleRequest[] = []): Promise<FoxAssetHandle> {
  let entry = cache.get(url);
  const fromCache = !!entry?.settled;
  if (!entry) {
    const created: CacheEntry = { promise: loadEntry(url), refs: 0 };
    created.promise.then(r => { created.settled = { gltf: r.gltf }; }, () => cache.delete(url));
    cache.set(url, created);
    entry = created;
  }
  entry.refs++;
  if (entry.disposeTimer) { clearTimeout(entry.disposeTimer); entry.disposeTimer = undefined; }
  let result;
  try { result = await entry.promise; } catch (e) { entry.refs--; throw e; }
  if (signal?.aborted) { releaseRef(url); throw new FoxAssetError('aborted', 'Fox load aborted'); }
  const scene = cloneSkinned(result.gltf.scene);
  scene.name = 'FOX_V2_INSTANCE';
  // modules: shared parse, validated against this Fox; a failing module is dropped (core Fox still works)
  const reports: FoxModuleReport[] = [];
  const clips = [...result.gltf.animations];
  for (const m of modules) {
    try {
      const mod = await loadModule(m.url);
      const b = bindModuleClips(scene, mod.clips, m.clips, m.id, m.url, mod.bytes, mod.loadMs);
      reports.push(b.report);
      if (b.report.ok) clips.push(...b.clips);
      else console.warn(`[fox] animation module ${m.id} rejected`, b.report.problems);
    } catch (e) {
      reports.push({ id: m.id, url: m.url, ok: false, bytes: 0, loadMs: 0, clips: [], tracks: 0, boundTracks: 0, morphTracks: 0, problems: [String((e as Error)?.message ?? e)] });
      console.warn(`[fox] animation module ${m.id} unavailable`, e);
    }
  }
  if (signal?.aborted) { releaseRef(url); throw new FoxAssetError('aborted', 'Fox load aborted'); }
  let released = false;
  return {
    scene,
    clips,
    info: { ...result.info, fromCache, modules: reports },
    release: () => { if (released) return; released = true; releaseRef(url); },
  };
}

function releaseRef(url: string) {
  const e = cache.get(url); if (!e) return;
  e.refs = Math.max(0, e.refs - 1);
  if (e.refs === 0 && e.settled) {
    e.disposeTimer = setTimeout(() => { if (e.refs === 0 && e.settled) { disposeTemplate(e.settled.gltf); cache.delete(url); } }, keepAliveMs);
  }
}

/** Test / diagnostics: what is cached right now. */
export function foxAssetCacheState() {
  return [...cache.entries()].map(([url, e]) => ({ url, refs: e.refs, loaded: !!e.settled, pendingDispose: !!e.disposeTimer }));
}
/** Immediately drops unused cached GLBs (used by the mount/unmount test). */
export function purgeFoxAssetCache() {
  for (const [url, e] of cache) if (e.refs === 0 && e.settled) { if (e.disposeTimer) clearTimeout(e.disposeTimer); disposeTemplate(e.settled.gltf); cache.delete(url); }
}
