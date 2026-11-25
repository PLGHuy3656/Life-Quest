import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import {
  COSMETIC_CATALOG,
  OUTFIT_PRESETS,
  type CosmeticItemId,
  type CosmeticSlot,
  type OutfitPresetId
} from '@/mascot/cosmetics/cosmeticContract'
import type { FoxController, FoxEventResult } from '@/mascot/FoxController'
import type { FoxPoseMode } from '@/mascot/FoxExpressivePose'
import type { FoxEventName, FoxEventPayloads } from '@/mascot/FoxEventMap'
import type { FoxActivity, FoxMood, FoxOneShotClip } from '@/mascot/foxContract'
import { useUiStore } from '@/stores/uiStore'
import { usePrefersReducedMotion } from './environment'

export type VoiceUiPhase =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'suggesting'
  | 'notebook_open'
  | 'writing'
  | 'confirmed'
  | 'retry'
  | 'cancelled'
  | 'permission_denied'

export interface CompanionSettings {
  level: number
  mood: FoxMood
  activity: FoxActivity
  interaction: boolean
  lookAt: boolean
  idleVariation: boolean
}

export interface CompanionEventLog {
  id: number
  at: number
  name: string
  results: { instance: string; result: FoxEventResult }[]
}

export interface CompanionInstanceMeta {
  presentation: string
  label: string
}

export type EquippedCosmeticMap = Partial<Record<CosmeticSlot, CosmeticItemId>>

interface CompanionContextValue {
  settings: CompanionSettings
  update: (patch: Partial<CompanionSettings>) => void
  effectiveReducedMotion: boolean
  modelUrl: string
  /** Effective appearance currently rendered on Fox V2 (persisted + local preview overlay) */
  equippedCosmetics: EquippedCosmeticMap
  /** Confirmed server-persisted outfit (empty while Equipment Persistence API is pending) */
  persistedCosmetics: EquippedCosmeticMap
  /** Temporary local-only visual try-on selections */
  previewCosmetics: EquippedCosmeticMap
  /** True when local preview differs from confirmed persisted equipment */
  hasUnsavedPreview: boolean
  /** Backend equipment persistence capability status */
  equipmentPersistenceStatus: 'PENDING_API' | 'LIVE'
  equipCosmetic: (itemId: CosmeticItemId) => void
  unequipSlot: (slot: CosmeticSlot) => void
  applyOutfit: (presetId: OutfitPresetId) => void
  resetCosmetics: () => void
  restoreEquippedOutfit: () => void
  voicePhase: VoiceUiPhase
  dispatchVoiceEvent: (
    event:
      | 'VOICE_LISTEN_STARTED'
      | 'VOICE_LISTENING'
      | 'VOICE_PROCESSING'
      | 'TASK_SUGGESTION_READY'
      | 'TASK_NOTEBOOK_OPEN'
      | 'TASK_WRITING'
      | 'TASK_CREATED'
      | 'VOICE_RETRY_REQUESTED'
      | 'VOICE_CANCELLED'
      | 'VOICE_PERMISSION_DENIED',
    payload?: Record<string, unknown>
  ) => void
  publish: <E extends FoxEventName>(name: E, payload?: FoxEventPayloads[E]) => void
  setPoseMode: (mode: FoxPoseMode) => void
  playClip: (clip: FoxOneShotClip) => void
  setActivityTempo: (scale: number) => void
  register: (controller: FoxController, meta: CompanionInstanceMeta) => () => void
  activeInstanceCount: number
  eventLog: CompanionEventLog[]
}

const CompanionContext = createContext<CompanionContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useCompanion(): CompanionContextValue {
  const ctx = useContext(CompanionContext)
  if (!ctx) throw new Error('useCompanion must be used within CompanionProvider')
  return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOptionalCompanion(): CompanionContextValue | null {
  return useContext(CompanionContext)
}

const MODEL_URL = `${import.meta.env.BASE_URL}models/fox_v2_anim_e2.glb`

const VOICE_EVENT_TO_PHASE: Record<string, VoiceUiPhase> = {
  VOICE_LISTEN_STARTED: 'listening',
  VOICE_LISTENING: 'listening',
  VOICE_PROCESSING: 'processing',
  TASK_SUGGESTION_READY: 'suggesting',
  TASK_NOTEBOOK_OPEN: 'notebook_open',
  TASK_WRITING: 'writing',
  TASK_CREATED: 'confirmed',
  VOICE_RETRY_REQUESTED: 'retry',
  VOICE_CANCELLED: 'cancelled',
  VOICE_PERMISSION_DENIED: 'permission_denied'
}

export function CompanionProvider({ children }: { children: ReactNode }) {
  const osReducedMotion = usePrefersReducedMotion()
  const uiReducedMotion = useUiStore((s) => s.reducedMotion)
  const effectiveReducedMotion = osReducedMotion || uiReducedMotion

  const [settings, setSettings] = useState<CompanionSettings>({
    level: 5,
    mood: 'neutral',
    activity: 'idle',
    interaction: true,
    lookAt: true,
    idleVariation: true
  })

  // Confirmed server-persisted outfit (empty while Backend equipment persistence API is pending)
  const [persistedCosmetics] = useState<EquippedCosmeticMap>({})
  // Temporary local-only preview state (PREVIEW_STATE)
  const [previewCosmetics, setPreviewCosmetics] = useState<EquippedCosmeticMap>({})
  const equipmentPersistenceStatus = 'PENDING_API' as const

  const equippedCosmetics = useMemo<EquippedCosmeticMap>(
    () => ({ ...persistedCosmetics, ...previewCosmetics }),
    [persistedCosmetics, previewCosmetics]
  )

  const hasUnsavedPreview = useMemo(() => {
    const previewKeys = Object.keys(previewCosmetics) as CosmeticSlot[]
    return previewKeys.some((slot) => previewCosmetics[slot] !== persistedCosmetics[slot])
  }, [previewCosmetics, persistedCosmetics])
  const [voicePhase, setVoicePhase] = useState<VoiceUiPhase>('idle')
  const [eventLog, setEventLog] = useState<CompanionEventLog[]>([])
  const [activeInstanceCount, setActiveInstanceCount] = useState(0)

  const instancesRef = useRef(new Map<string, { c: FoxController; meta: CompanionInstanceMeta }>())
  const seqRef = useRef(0)

  const update = useCallback((patch: Partial<CompanionSettings>) => {
    setSettings((prev) => {
      const changed = (Object.keys(patch) as (keyof CompanionSettings)[]).some(
        (k) => patch[k] !== prev[k]
      )
      return changed ? { ...prev, ...patch } : prev
    })
  }, [])

  const publish = useCallback(<E extends FoxEventName>(name: E, payload?: FoxEventPayloads[E]) => {
    const results: CompanionEventLog['results'] = []
    for (const [id, { c }] of instancesRef.current) {
      results.push({ instance: id, result: c.handleEvent(name as string, payload) })
    }
    if (name === 'LEVEL_UP' && payload && typeof (payload as { level?: number }).level === 'number') {
      setSettings((prev) => ({ ...prev, level: (payload as { level: number }).level }))
    }
    setEventLog((prev) => [{ id: ++seqRef.current, at: Date.now(), name, results }, ...prev].slice(0, 15))
  }, [])

  const dispatchVoiceEvent = useCallback(
    (
      event:
        | 'VOICE_LISTEN_STARTED'
        | 'VOICE_LISTENING'
        | 'VOICE_PROCESSING'
        | 'TASK_SUGGESTION_READY'
        | 'TASK_NOTEBOOK_OPEN'
        | 'TASK_WRITING'
        | 'TASK_CREATED'
        | 'VOICE_RETRY_REQUESTED'
        | 'VOICE_CANCELLED'
        | 'VOICE_PERMISSION_DENIED',
      payload?: Record<string, unknown>
    ) => {
      setVoicePhase(VOICE_EVENT_TO_PHASE[event] ?? 'idle')
      publish(event as FoxEventName, payload as never)
    },
    [publish]
  )

  const equipCosmetic = useCallback((itemId: CosmeticItemId) => {
    const def = COSMETIC_CATALOG[itemId]
    if (!def) return
    setPreviewCosmetics((prev) => ({ ...prev, [def.slot]: itemId }))
  }, [])

  const unequipSlot = useCallback((slot: CosmeticSlot) => {
    setPreviewCosmetics((prev) => {
      const next = { ...prev }
      delete next[slot]
      return next
    })
  }, [])

  const applyOutfit = useCallback((presetId: OutfitPresetId) => {
    const preset = OUTFIT_PRESETS[presetId]
    setPreviewCosmetics({ ...(preset as EquippedCosmeticMap) })
  }, [])

  const resetCosmetics = useCallback(() => {
    setPreviewCosmetics({})
  }, [])

  const restoreEquippedOutfit = useCallback(() => {
    setPreviewCosmetics({})
  }, [])

  const setPoseMode = useCallback((mode: FoxPoseMode) => {
    for (const { c } of instancesRef.current.values()) {
      c.setPoseMode(mode)
    }
  }, [])

  const playClip = useCallback((clip: FoxOneShotClip) => {
    for (const { c } of instancesRef.current.values()) {
      c.playClip(clip)
    }
  }, [])

  const setActivityTempo = useCallback((scale: number) => {
    for (const { c } of instancesRef.current.values()) {
      c.setActivityTempo(scale)
    }
  }, [])

  const register = useCallback((controller: FoxController, meta: CompanionInstanceMeta) => {
    instancesRef.current.set(controller.id, { c: controller, meta })
    setActiveInstanceCount(instancesRef.current.size)
    return () => {
      instancesRef.current.delete(controller.id)
      setActiveInstanceCount(instancesRef.current.size)
    }
  }, [])

  // Diagnostic bridge for Playwright QA
  useEffect(() => {
    const w = window as unknown as { __lqMascot?: Record<string, unknown> }
    w.__lqMascot = {
      activeCount: () => instancesRef.current.size,
      equippedCosmetics,
      voicePhase,
      effectiveReducedMotion,
      publish
    }
  }, [equippedCosmetics, voicePhase, effectiveReducedMotion, publish])

  const value = useMemo<CompanionContextValue>(
    () => ({
      settings,
      update,
      effectiveReducedMotion,
      modelUrl: MODEL_URL,
      equippedCosmetics,
      persistedCosmetics,
      previewCosmetics,
      hasUnsavedPreview,
      equipmentPersistenceStatus,
      equipCosmetic,
      unequipSlot,
      applyOutfit,
      resetCosmetics,
      restoreEquippedOutfit,
      voicePhase,
      dispatchVoiceEvent,
      publish,
      setPoseMode,
      playClip,
      setActivityTempo,
      register,
      activeInstanceCount,
      eventLog
    }),
    [
      settings,
      update,
      effectiveReducedMotion,
      equippedCosmetics,
      persistedCosmetics,
      previewCosmetics,
      hasUnsavedPreview,
      equipmentPersistenceStatus,
      equipCosmetic,
      unequipSlot,
      applyOutfit,
      resetCosmetics,
      restoreEquippedOutfit,
      voicePhase,
      dispatchVoiceEvent,
      publish,
      setPoseMode,
      playClip,
      setActivityTempo,
      register,
      activeInstanceCount,
      eventLog
    ]
  )

  return <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>
}
