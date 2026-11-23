import type { Material, Mesh, Object3D, Texture } from 'three';

// Why this exists: the Fox geometry / materials are shared by every companion on the page (one
// parsed GLB). Each WebGLRenderer that draws them registers internal 'dispose' listeners on those
// shared objects (geometry buffers, morph textures, material programs). Disposing or losing the
// renderer does NOT remove them, so the cached GLB would keep every unmounted renderer alive
// (measured: ~0.4 MB and +73 listeners per mount/unmount cycle).
//
// A binding wraps one renderer's render() calls, records exactly which listeners that renderer
// added to the shared resources, and removes only those on release(). Other live canvases keep
// their GPU buffers; nothing is re-uploaded.

type Listener = (event: unknown) => void;
type Dispatcher = { _listeners?: Record<string, Listener[]>; removeEventListener(type: string, l: Listener): void };

export class FoxRenderBinding {
  private resources: Dispatcher[] = [];
  private added = new Map<Dispatcher, Set<Listener>>();
  private released = false;

  /** `extra` returns other shared resources drawn by this renderer (e.g. module-wide effect textures). */
  constructor(root: Object3D, private extra: () => object[] = () => []) { this.collect(root); }

  /** Re-scan (call if new shared objects were attached under the root, e.g. future cosmetics). */
  collect(root: Object3D) {
    const set = new Set<Dispatcher>(this.resources);
    root.traverse(o => {
      const m = o as Mesh; if (!m.isMesh) return;
      set.add(m.geometry as unknown as Dispatcher);
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        set.add(mat as unknown as Dispatcher);
        for (const v of Object.values(mat as Material)) if (v && (v as Texture).isTexture) set.add(v as unknown as Dispatcher);
      }
    });
    this.resources = [...set];
  }

  /** Run one render call of the bound renderer and remember the dispose listeners it registered. */
  render(fn: () => void) {
    if (this.released) { fn(); return; }
    const res = this.resources.concat(this.extra() as unknown as Dispatcher[]);
    const before = res.map(r => r._listeners?.dispose?.length ?? 0);
    fn();
    for (let i = 0; i < res.length; i++) {
      const r = res[i], arr = r._listeners?.dispose;
      if (!arr || arr.length <= before[i]) continue;
      let s = this.added.get(r); if (!s) this.added.set(r, (s = new Set()));
      for (let k = before[i]; k < arr.length; k++) s.add(arr[k]);   // listeners are appended during this synchronous call
    }
  }

  /** Remove the listeners this renderer added (call when the renderer / canvas goes away). */
  release() {
    if (this.released) return;
    this.released = true;
    for (const [r, s] of this.added) for (const l of s) r.removeEventListener('dispose', l);
    this.added.clear();
    this.resources = [];
  }

  /** Diagnostics: number of listeners currently tracked. */
  get trackedListeners() { let n = 0; this.added.forEach(s => (n += s.size)); return n; }
}

