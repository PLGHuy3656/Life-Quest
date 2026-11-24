import { create } from 'zustand'

export type FocusPresetMinutes = 15 | 25 | 45
export type FocusSessionStatus = 'idle' | 'running' | 'paused' | 'ended'

export const FOCUS_PRESETS: readonly FocusPresetMinutes[] = [15, 25, 45] as const

export interface FocusSessionState {
  taskId: string | null
  taskTitle: string | null
  presetMinutes: FocusPresetMinutes
  totalMs: number
  remainingAtAnchorMs: number
  startedAtMs: number | null
  status: FocusSessionStatus
  start: (taskId: string, taskTitle: string, minutes?: FocusPresetMinutes, nowMs?: number) => void
  pause: (nowMs?: number) => void
  resume: (nowMs?: number) => void
  reset: (minutes?: FocusPresetMinutes) => void
  end: () => void
  setPreset: (minutes: FocusPresetMinutes) => void
  syncTick: (nowMs?: number) => number
}

export function computeRemainingMs(
  state: Pick<FocusSessionState, 'status' | 'remainingAtAnchorMs' | 'startedAtMs'>,
  nowMs = Date.now()
): number {
  if (state.status !== 'running' || state.startedAtMs === null) {
    return Math.max(0, state.remainingAtAnchorMs)
  }
  const elapsed = Math.max(0, nowMs - state.startedAtMs)
  return Math.max(0, state.remainingAtAnchorMs - elapsed)
}

export function formatTimerMMSS(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const DEFAULT_MINUTES: FocusPresetMinutes = 25
const DEFAULT_MS = DEFAULT_MINUTES * 60 * 1000

/**
 * Shared FE-04B.1 Focus Session Store (V1 local productivity timer).
 * - Enforces a single active session across the entire application.
 * - Uses timestamp-based elapsed calculation (Date.now() anchor) to prevent timer drift
 *   across browser tab backgrounding / visibility changes.
 * - Persists across route navigation within the SPA session.
 * - Does NOT mark tasks completed or award XP/coins/streaks.
 */
export const useFocusSessionStore = create<FocusSessionState>((set, get) => ({
  taskId: null,
  taskTitle: null,
  presetMinutes: DEFAULT_MINUTES,
  totalMs: DEFAULT_MS,
  remainingAtAnchorMs: DEFAULT_MS,
  startedAtMs: null,
  status: 'idle',

  setPreset: (minutes) => {
    const cur = get()
    if (cur.status === 'running' || cur.status === 'paused') return
    const ms = minutes * 60 * 1000
    set({
      presetMinutes: minutes,
      totalMs: ms,
      remainingAtAnchorMs: ms,
      startedAtMs: null,
      status: 'idle'
    })
  },

  start: (taskId, taskTitle, minutes, nowMs = Date.now()) => {
    const preset = minutes ?? get().presetMinutes
    const ms = preset * 60 * 1000
    set({
      taskId,
      taskTitle,
      presetMinutes: preset,
      totalMs: ms,
      remainingAtAnchorMs: ms,
      startedAtMs: nowMs,
      status: 'running'
    })
  },

  pause: (nowMs = Date.now()) => {
    const cur = get()
    if (cur.status !== 'running') return
    const remaining = computeRemainingMs(cur, nowMs)
    set({
      remainingAtAnchorMs: remaining,
      startedAtMs: null,
      status: remaining <= 0 ? 'ended' : 'paused'
    })
  },

  resume: (nowMs = Date.now()) => {
    const cur = get()
    if (cur.status !== 'paused' || cur.remainingAtAnchorMs <= 0) return
    set({
      startedAtMs: nowMs,
      status: 'running'
    })
  },

  reset: (minutes) => {
    const preset = minutes ?? get().presetMinutes
    const ms = preset * 60 * 1000
    set({
      taskId: null,
      taskTitle: null,
      presetMinutes: preset,
      totalMs: ms,
      remainingAtAnchorMs: ms,
      startedAtMs: null,
      status: 'idle'
    })
  },

  end: () => {
    const cur = get()
    const ms = cur.presetMinutes * 60 * 1000
    set({
      taskId: null,
      taskTitle: null,
      totalMs: ms,
      remainingAtAnchorMs: ms,
      startedAtMs: null,
      status: 'ended'
    })
  },

  syncTick: (nowMs = Date.now()) => {
    const cur = get()
    const remaining = computeRemainingMs(cur, nowMs)
    if (cur.status === 'running' && remaining <= 0) {
      set({
        remainingAtAnchorMs: 0,
        startedAtMs: null,
        status: 'ended'
      })
      return 0
    }
    return remaining
  }
}))
