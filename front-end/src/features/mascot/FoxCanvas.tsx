import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties
} from 'react'
import { PerspectiveCamera, Vector3 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  ANIMATION_MODULES,
  FoxAssetError,
  FoxController,
  frameFoxCamera,
  type FoxPresentation
} from '@/mascot'
import { CanvasErrorBoundary } from './CanvasErrorBoundary'
import { useCompanion } from './CompanionProvider'
import { hasWebGL, useDocumentVisible, useInView } from './environment'
import { FoxFallback } from './FoxFallback'
import styles from './FoxCanvas.module.css'

const RUNTIME_MODULES = ANIMATION_MODULES.map((m) => ({
  id: m.id,
  url: `${import.meta.env.BASE_URL}${m.path}`,
  clips: m.clips
}))

export interface FoxCanvasProps {
  presentation: FoxPresentation
  label: string
  orbit?: boolean
  suspended?: boolean
  className?: string
  style?: CSSProperties
}

type LoadStatus =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'context-lost' }
  | { kind: 'error'; error: unknown }

export function FoxCanvas({
  presentation,
  label,
  orbit = false,
  suspended = false,
  className = '',
  style
}: FoxCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef)
  const visible = useDocumentVisible()
  const [status, setStatus] = useState<LoadStatus>({ kind: 'loading' })
  const [retryKey, setRetryKey] = useState(0)

  const active = inView && visible && !suspended && status.kind !== 'context-lost'
  const webglAvailable = hasWebGL()

  if (!webglAvailable) {
    return (
      <div
        className={`${styles.stage} ${presentation === 'full' ? styles.full : ''} ${className}`.trim()}
        style={style}
      >
        <FoxFallback reason="webgl" presentation={presentation} />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.stage} ${presentation === 'full' ? styles.full : ''} ${className}`.trim()}
      style={style}
      data-testid="fox-canvas-container"
      data-presentation={presentation}
      data-status={status.kind}
      data-active={active ? '1' : '0'}
      role="img"
      aria-label={label}
    >
      <CanvasErrorBoundary
        fallback={<FoxFallback reason="webgl" presentation={presentation} />}
      >
        <Canvas
          key={retryKey}
          frameloop={active ? 'always' : 'never'}
          flat
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: presentation === 'mini' ? 'low-power' : 'default'
          }}
          camera={{ fov: 30, near: 0.05, far: 50, position: [0.9, 0.75, 2.6] }}
          onCreated={({ gl }) => {
            const dom = gl.domElement
            dom.tabIndex = 0
            dom.setAttribute('aria-label', `${label}. Enter: vuốt đầu, T: chạm đuôi`)
            dom.addEventListener('webglcontextlost', (e) => {
              e.preventDefault()
              setStatus({ kind: 'context-lost' })
            })
            dom.addEventListener('webglcontextrestored', () => {
              setStatus({ kind: 'ready' })
            })
          }}
        >
          <FoxStage />
          <FoxRig
            presentation={presentation}
            label={label}
            orbit={orbit}
            active={active}
            onStatus={setStatus}
          />
        </Canvas>
      </CanvasErrorBoundary>

      {status.kind === 'loading' && (
        <div className={styles.loading} aria-live="polite">
          Đang tải Fox V2 3D...
        </div>
      )}

      {status.kind === 'context-lost' && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <FoxFallback
            reason="context-lost"
            presentation={presentation}
            onRetry={() => {
              setStatus({ kind: 'loading' })
              setRetryKey((k) => k + 1)
            }}
          />
        </div>
      )}

      {status.kind === 'error' && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <FoxFallback
            reason="load"
            presentation={presentation}
            error={status.error}
            onRetry={() => {
              setStatus({ kind: 'loading' })
              setRetryKey((k) => k + 1)
            }}
          />
        </div>
      )}
    </div>
  )
}

function FoxStage() {
  return (
    <>
      <hemisphereLight args={[0xfff6ee, 0xe8d6c8, 1.6]} />
      <directionalLight color={0xfff1e4} intensity={1.8} position={[-1.5, 2.5, 2.2]} />
      <directionalLight color={0xffffff} intensity={0.8} position={[2, 1.2, 2]} />
      <directionalLight color={0xffe9d6} intensity={1.3} position={[0.5, 2, -2.2]} />
    </>
  )
}

function FoxRig({
  presentation,
  label,
  orbit,
  active,
  onStatus
}: {
  presentation: FoxPresentation
  label: string
  orbit: boolean
  active: boolean
  onStatus: (s: LoadStatus) => void
}) {
  const companion = useCompanion()
  const { register } = companion
  const { camera, gl, size } = useThree()
  const [ctrl, setCtrl] = useState<FoxController | null>(null)
  const targetRef = useRef(new Vector3())
  const controlsRef = useRef<OrbitControls | null>(null)

  useEffect(() => {
    const abortController = new AbortController()
    let created: FoxController | null = null
    onStatus({ kind: 'loading' })

    FoxController.create({
      modelUrl: companion.modelUrl,
      modules: RUNTIME_MODULES,
      assetBaseUrl: import.meta.env.BASE_URL,
      lowCostEffects: presentation === 'mini',
      level: companion.settings.level,
      mood: companion.settings.mood,
      activity: companion.settings.activity,
      interaction: companion.settings.interaction,
      lookAt: companion.settings.lookAt,
      idleVariation: companion.settings.idleVariation,
      reducedMotion: companion.effectiveReducedMotion,
      signal: abortController.signal
    }).then(
      (instance: FoxController) => {
        if (abortController.signal.aborted) {
          instance.dispose()
          return
        }
        created = instance
        setCtrl(instance)
        onStatus({ kind: 'ready' })
      },
      (err: unknown) => {
        if (!(err instanceof FoxAssetError && err.kind === 'aborted')) {
          onStatus({ kind: 'error', error: err })
        }
      }
    )

    return () => {
      abortController.abort()
      if (created) {
        created.dispose()
      }
      setCtrl(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companion.modelUrl])

  const binding = useMemo(() => ctrl?.bindRenderer() ?? null, [ctrl])
  useEffect(() => () => binding?.release(), [binding])

  useEffect(() => {
    if (!ctrl) return
    return register(ctrl, { presentation, label })
  }, [ctrl, register, presentation, label])

  useEffect(() => {
    if (!ctrl) return
    ctrl.attachView({ camera, domElement: gl.domElement })
    return () => ctrl.detachView()
  }, [ctrl, camera, gl])

  useEffect(() => {
    if (!ctrl || !orbit) return
    const oc = new OrbitControls(camera, gl.domElement)
    oc.enableDamping = true
    oc.enablePan = false
    oc.minDistance = 1.2
    oc.maxDistance = 6.5
    oc.minPolarAngle = 0.35
    oc.maxPolarAngle = 1.62
    oc.target.copy(targetRef.current)
    oc.update()
    controlsRef.current = oc
    const off = ctrl.on((e) => {
      if (e.type === 'grab') oc.enabled = !e.grabbing
    })
    return () => {
      off()
      oc.dispose()
      controlsRef.current = null
    }
  }, [ctrl, orbit, camera, gl])

  useLayoutEffect(() => {
    const cam = camera as PerspectiveCamera
    cam.aspect = size.width / Math.max(1, size.height)
    frameFoxCamera(cam, presentation, targetRef.current)
    if (controlsRef.current) {
      controlsRef.current.target.copy(targetRef.current)
      controlsRef.current.update()
    }
  }, [camera, size.width, size.height, presentation])

  // Sync settings to FoxController without recreating it
  useEffect(() => {
    ctrl?.setLevel(companion.settings.level)
  }, [ctrl, companion.settings.level])
  useEffect(() => {
    ctrl?.setMood(companion.settings.mood)
  }, [ctrl, companion.settings.mood])
  useEffect(() => {
    ctrl?.setActivity(companion.settings.activity)
  }, [ctrl, companion.settings.activity])
  useEffect(() => {
    ctrl?.setReducedMotion(companion.effectiveReducedMotion)
  }, [ctrl, companion.effectiveReducedMotion])
  useEffect(() => {
    if (!ctrl) return
    if (active) ctrl.resume()
    else ctrl.pause()
  }, [ctrl, active])

  // Sync preview cosmetics onto FoxCosmeticManager
  useEffect(() => {
    if (!ctrl) return
    void ctrl.cosmetics.setOutfit(companion.equippedCosmetics).catch(() => {
      // Non-fatal cosmetic load error isolated from main Fox rig
    })
  }, [ctrl, companion.equippedCosmetics])

  useFrame((state, dt) => {
    ctrl?.update(dt)
    controlsRef.current?.update()
    if (binding) {
      binding.render(() => state.gl.render(state.scene, state.camera))
    } else {
      state.gl.render(state.scene, state.camera)
    }
  }, 1)

  return ctrl ? <primitive object={ctrl.object3D} dispose={null} /> : null
}
