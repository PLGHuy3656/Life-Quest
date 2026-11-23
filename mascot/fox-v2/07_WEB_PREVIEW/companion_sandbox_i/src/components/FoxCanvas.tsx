import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Component, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ANIMATION_MODULES, FoxController, FoxAssetError, frameFoxCamera, type FoxControllerEvent, type FoxPresentation } from '../mascot';

// animation-only modules bound to the Fox (Gate G1+); ?modules=0 disables them (fallback test)
// regression runs of earlier gates may restrict the module set (window.__foxModuleFilter = ['g1_quest_reward_streak'])
const MODULE_FILTER = (window as unknown as { __foxModuleFilter?: string[] }).__foxModuleFilter;
export const MODULES = new URLSearchParams(location.search).get('modules') === '0' ? [] : ANIMATION_MODULES.filter(m => !MODULE_FILTER || MODULE_FILTER.includes(m.id)).map(m => ({ id: m.id, url: `${import.meta.env.BASE_URL}${m.path}`, clips: m.clips }));
import { useCompanion } from './CompanionContext';
import { hasWebGL, useDocumentVisible, useInView } from './environment';
import { FoxFallback } from './FoxFallback';

// One component for all three presentations (Dashboard Mini, Companion Widget, Full view).
// It hosts a FoxController inside a React Three Fiber canvas. Rendering stops completely
// (frameloop 'never') when the canvas is scrolled offscreen or the tab is hidden, and the
// controller is paused so no animation time accumulates.

export interface FoxCanvasProps {
  presentation: FoxPresentation;
  label: string;
  orbit?: boolean;
  className?: string;
  style?: CSSProperties;
  onEvent?(e: FoxControllerEvent): void;
  onController?(c: FoxController | null): void;
  /** Force the render loop off (e.g. a minimised widget). */
  suspended?: boolean;
  children?: ReactNode;
}

type Status = { kind: 'loading' } | { kind: 'ready' } | { kind: 'error'; error: unknown };

export function FoxCanvas(props: FoxCanvasProps) {
  const { presentation, label, className, style, suspended, children } = props;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const visible = useDocumentVisible();
  const active = inView && visible && !suspended;
  // diagnostics: every active/inactive transition (why a canvas stopped rendering)
  useEffect(() => {
    const w = window as unknown as { __foxActiveLog?: unknown[] };
    (w.__foxActiveLog ??= []).push({ t: Math.round(performance.now()), presentation, active, inView, visible, suspended: !!suspended });
  }, [active, inView, visible, suspended, presentation]);
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [retry, setRetry] = useState(0);
  const webgl = hasWebGL();

  if (!webgl) return <div className={`fox-canvas ${className ?? ''}`} style={style}><FoxFallback reason="webgl" presentation={presentation} /></div>;

  return (
    <div ref={ref} className={`fox-canvas ${className ?? ''}`} style={style} data-presentation={presentation} data-active={active ? '1' : '0'} data-status={status.kind}
      role="img" aria-label={label} tabIndex={-1}>
      <CanvasErrorBoundary fallback={<FoxFallback reason="webgl" presentation={presentation} />}>
        <Canvas key={retry} frameloop={active ? 'always' : 'never'} flat dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: presentation === 'mini' ? 'low-power' : 'default', preserveDrawingBuffer: new URLSearchParams(location.search).has('capture') }}
          camera={{ fov: 30, near: 0.05, far: 50, position: [0.9, 0.75, 2.6] }}
          onCreated={({ gl }) => { gl.domElement.tabIndex = 0; gl.domElement.setAttribute('aria-label', `${label}. Enter: vuốt đầu, T: chạm đuôi`); }}>
          <FoxStage />
          <FoxRig {...props} active={active} onStatus={setStatus} />
        </Canvas>
      </CanvasErrorBoundary>
      {status.kind === 'loading' && <div className="fox-loading" aria-live="polite"><span className="dot" /><span className="dot" /><span className="dot" /></div>}
      {status.kind === 'error' && <FoxFallback reason="load" presentation={presentation} error={status.error} onRetry={() => { setStatus({ kind: 'loading' }); setRetry(r => r + 1); }} />}
      {children}
    </div>
  );
}

export function FoxStage() {
  // same light rig as the approved E2 viewer (NoToneMapping via `flat`, sRGB output)
  return (
    <>
      <hemisphereLight args={[0xfff6ee, 0xe8d6c8, 1.6]} />
      <directionalLight color={0xfff1e4} intensity={1.8} position={[-1.5, 2.5, 2.2]} />
      <directionalLight color={0xffffff} intensity={0.8} position={[2, 1.2, 2]} />
      <directionalLight color={0xffe9d6} intensity={1.3} position={[0.5, 2, -2.4]} />
      <directionalLight color={0xfff4ea} intensity={0.8} position={[-1.2, 1.0, -2.0]} />
    </>
  );
}

interface RigProps extends FoxCanvasProps { active: boolean; onStatus(s: Status): void }

function FoxRig({ presentation, label, orbit, onEvent, onController, active, onStatus }: RigProps) {
  const { camera, gl, size } = useThree();
  const env = useCompanion();
  const [ctrl, setCtrl] = useState<FoxController | null>(null);
  const controls = useRef<OrbitControls | null>(null);
  const target = useRef(new Vector3());
  const perf = useRef({ frames: 0, t0: performance.now(), fps: 0, updMs: 0, renMs: 0, updMax: 0, renMax: 0, samples: 0, totalFrames: 0 });
  const onEventRef = useRef(onEvent); onEventRef.current = onEvent;

  // create / dispose the controller (shared GLB cache: only the first instance downloads)
  useEffect(() => {
    const ac = new AbortController();
    let created: FoxController | null = null;
    const s = env.settings;
    FoxController.create({
      modelUrl: env.modelUrl, signal: ac.signal, level: s.level, mood: s.mood, activity: s.activity,
      interaction: s.interaction, lookAt: s.lookAt, idleVariation: s.idleVariation, reducedMotion: env.effectiveReducedMotion,
      seed: Number(new URLSearchParams(location.search).get('seed') ?? 7), modules: MODULES,
    }).then(c => {
      if (ac.signal.aborted) { c.dispose(); return; }
      created = c; setCtrl(c); onStatus({ kind: 'ready' }); onController?.(c);
    }, err => { if (!(err instanceof FoxAssetError && err.kind === 'aborted')) { console.error('[fox] load failed', err); onStatus({ kind: 'error', error: err }); } });
    return () => { ac.abort(); if (created) { onController?.(null); created.dispose(); } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env.modelUrl]);

  // one render binding per (controller, renderer): releases this renderer's listeners on the shared GLB
  const binding = useMemo(() => ctrl?.bindRenderer() ?? null, [ctrl, gl]);
  useEffect(() => () => binding?.release(), [binding]);

  // registry for diagnostics + business events
  useEffect(() => {
    if (!ctrl) return;
    const off = ctrl.on(e => onEventRef.current?.(e));
    const unreg = env.register(ctrl, {
      presentation, label,
      stats: () => {
        const p = perf.current, i = gl.info;
        return { fps: +p.fps.toFixed(1), updateMs: +p.updMs.toFixed(3), renderMs: +p.renMs.toFixed(3), updateMsMax: +p.updMax.toFixed(3), renderMsMax: +p.renMax.toFixed(3),
          calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs?.length ?? 0,
          frames: p.totalFrames, active, dpr: gl.getPixelRatio(), canvas: [gl.domElement.width, gl.domElement.height] };
      },
    });
    return () => { off(); unreg(); };
  }, [ctrl, env.register, presentation, label, gl, active]);

  // view binding (pointer events + camera) — before OrbitControls so a grab on the fox wins
  useEffect(() => { if (!ctrl) return; ctrl.attachView({ camera, domElement: gl.domElement }); return () => ctrl.detachView(); }, [ctrl, camera, gl]);
  useEffect(() => {
    if (!ctrl || !orbit) return;
    const oc = new OrbitControls(camera, gl.domElement);
    oc.enableDamping = true; oc.enablePan = false; oc.minDistance = 1.2; oc.maxDistance = 7; oc.minPolarAngle = 0.35; oc.maxPolarAngle = 1.62;
    oc.target.copy(target.current); oc.update();
    controls.current = oc;
    const off = ctrl.on(e => { if (e.type === 'grab') oc.enabled = !e.grabbing; });
    return () => { off(); oc.dispose(); controls.current = null; };
  }, [ctrl, orbit, camera, gl]);

  // framing: sized for the largest level so growth never needs a camera move
  useLayoutEffect(() => {
    const cam = camera as PerspectiveCamera;
    cam.aspect = size.width / Math.max(1, size.height);
    frameFoxCamera(cam, presentation, target.current);
    if (controls.current) { controls.current.target.copy(target.current); controls.current.update(); }
  }, [camera, size.width, size.height, presentation]);

  // settings → controller
  const s = env.settings;
  useEffect(() => { ctrl?.setLevel(s.level); }, [ctrl, s.level]);
  useEffect(() => { ctrl?.setMood(s.mood); }, [ctrl, s.mood]);
  useEffect(() => { ctrl?.setActivity(s.activity); }, [ctrl, s.activity]);
  useEffect(() => { ctrl?.setInteractionEnabled(s.interaction); }, [ctrl, s.interaction]);
  useEffect(() => { ctrl?.setLookAtEnabled(s.lookAt); }, [ctrl, s.lookAt]);
  useEffect(() => { ctrl?.setIdleVariationEnabled(s.idleVariation); }, [ctrl, s.idleVariation]);
  useEffect(() => { ctrl?.setReducedMotion(env.effectiveReducedMotion); }, [ctrl, env.effectiveReducedMotion]);
  useEffect(() => { ctrl?.debug.interaction.setProxiesVisible(s.showProxies); }, [ctrl, s.showProxies]);
  useEffect(() => { if (!ctrl) return; if (active) ctrl.resume(); else ctrl.pause(); }, [ctrl, active]);

  // priority 1: this callback owns rendering, so update and render cost can be measured separately
  useFrame((state, dt) => {
    const p = perf.current;
    const t0 = performance.now();
    ctrl?.update(dt);
    controls.current?.update();
    const t1 = performance.now();
    if (binding) binding.render(() => state.gl.render(state.scene, state.camera)); else state.gl.render(state.scene, state.camera);
    const t2 = performance.now();
    const a = 0.1; p.updMs += (t1 - t0 - p.updMs) * a; p.renMs += (t2 - t1 - p.renMs) * a;
    p.updMax = Math.max(p.updMax * 0.995, t1 - t0); p.renMax = Math.max(p.renMax * 0.995, t2 - t1);
    p.frames++; p.totalFrames++;
    const now = performance.now();
    if (now - p.t0 > 500) { p.fps = (p.frames * 1000) / (now - p.t0); p.frames = 0; p.t0 = now; }
  }, 1);

  return ctrl ? <primitive object={ctrl.object3D} dispose={null} /> : null;
}

class CanvasErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch(err: unknown) { console.error('[fox] canvas failed', err); }
  override render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
