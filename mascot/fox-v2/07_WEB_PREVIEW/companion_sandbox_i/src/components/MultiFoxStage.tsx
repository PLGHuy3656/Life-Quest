import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PerspectiveCamera } from 'three';
import { FoxChoreographyManager, FoxController, type FoxRenderBinding } from '../mascot';
import { useCompanion } from './CompanionContext';
import { FoxStage, MODULES } from './FoxCanvas';

// Gate G3 technical stage: several Fox instances in ONE canvas / ONE three.js scene, driven by one FoxChoreographyManager.
// Each fox is a SkeletonUtils clone of the shared GLB (no geometry copy). Exposes window.__g3multi for the test scripts.

export interface MultiFoxApi { manager: FoxChoreographyManager; foxes: FoxController[]; gl: { info: { render: { calls: number; triangles: number }; memory: { geometries: number; textures: number }; programs?: unknown[] | null } }; setCount(n: number): void; camera: PerspectiveCamera }
declare global { interface Window { __g3multi?: MultiFoxApi & { ready: boolean } } }

export function MultiFoxStage({ count, levels, label }: { count: number; levels: number[]; label: string }) {
  return (
    <div className="fox-canvas g3-multi" role="img" aria-label={label} data-status="ready">
      <Canvas frameloop="always" flat dpr={[1, 2]} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: new URLSearchParams(location.search).has('capture') }}
        camera={{ fov: 30, near: 0.05, far: 50, position: [0, 0.95, 4.3] }}>
        <FoxStage />
        <MultiRig count={count} levels={levels} />
      </Canvas>
    </div>
  );
}

function MultiRig({ count, levels }: { count: number; levels: number[] }) {
  const { gl, camera, scene } = useThree();
  const env = useCompanion();
  const mgr = useMemo(() => new FoxChoreographyManager(), []);
  const [foxes, setFoxes] = useState<FoxController[]>([]);
  const binding = useRef<FoxRenderBinding | null>(null);
  const [n, setN] = useState(count);

  useEffect(() => { scene.add(mgr.root); return () => { mgr.dispose(); }; }, [mgr, scene]);
  useEffect(() => { (camera as PerspectiveCamera).lookAt(0, 0.5, 0); }, [camera]);
  useEffect(() => {
    const ac = new AbortController(); const made: FoxController[] = [];
    (async () => {
      for (let i = 0; i < n; i++) {
        const c = await FoxController.create({ modelUrl: env.modelUrl, signal: ac.signal, level: levels[i] ?? 20, interaction: false, lookAt: false, idleVariation: false, seed: 7 + i, modules: MODULES });
        if (ac.signal.aborted) { c.dispose(); return; }
        made.push(c); scene.add(c.object3D); mgr.add(`fox${i}`, c);
      }
      made.forEach((_c, i) => mgr.place(`fox${i}`, (i - (n - 1) / 2) * 0.85));
      binding.current = made[0]?.bindRenderer() ?? null;
      setFoxes(made);
    })().catch(e => console.error('[fox] multi stage load failed', e));
    return () => { ac.abort(); binding.current?.release(); binding.current = null; made.forEach((c, i) => { mgr.remove(`fox${i}`); c.dispose(); }); setFoxes([]); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, env.modelUrl]);
  useEffect(() => { foxes.forEach((c, i) => c.setLevel(levels[i] ?? 20, { immediate: true })); }, [foxes, levels]);
  useEffect(() => { foxes.forEach(c => c.setReducedMotion(env.effectiveReducedMotion)); mgr.setReducedMotion(env.effectiveReducedMotion); }, [foxes, env.effectiveReducedMotion, mgr]);
  useEffect(() => {
    window.__g3multi = { manager: mgr, foxes, gl: gl as unknown as MultiFoxApi['gl'], setCount: setN, camera: camera as PerspectiveCamera, ready: foxes.length === n && n > 0 };
  }, [mgr, foxes, gl, n, camera]);

  useFrame((state, dt) => {
    // tests drive the foxes deterministically (debug.step + postUpdate) and only need the host to keep drawing
    if (!(window as unknown as { __g3multiHold?: boolean }).__g3multiHold) mgr.update(dt);
    const draw = () => state.gl.render(state.scene, state.camera);
    if (binding.current) binding.current.render(draw); else draw();
  }, 1);
  return null;
}
