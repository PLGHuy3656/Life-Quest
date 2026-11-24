import { create } from 'zustand'
import type { WorkEntityType } from '@/features/work/creationContract'

export type ActiveSheet =
  | null
  | 'quick-create'
  | 'manage-pins'
  | 'search'
  | 'notifications'
  | 'api-status'

const REDUCED_MOTION_KEY = 'lq_reduced_motion'
const PINNED_RAIL_COLLAPSED_KEY = 'lq_pinned_rail_collapsed'

function readReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(REDUCED_MOTION_KEY) === '1'
  } catch {
    return false
  }
}

function getDefaultPinnedRailCollapsed(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const stored = window.localStorage.getItem(PINNED_RAIL_COLLAPSED_KEY)
    if (stored === '0') return false
    if (stored === '1') return true
  } catch {
    // Ignore storage errors
  }
  // FE-04A.3: PinnedTaskRail defaults collapsed for new users and fresh UI state
  return true
}

function persistPinnedRailCollapsed(collapsed: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PINNED_RAIL_COLLAPSED_KEY, collapsed ? '1' : '0')
  } catch {
    // Ignore storage errors
  }
}

export function applyReducedMotionClass(enabled: boolean): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('lq-rm', enabled)
}

interface UiState {
  reducedMotion: boolean
  activeSheet: ActiveSheet
  searchQuery: string
  pinnedRailCollapsed: boolean
  foxRailCollapsed: boolean
  quickCreateDraft: string
  quickCreateEntityType: WorkEntityType
  socialComposerDraft: string
  setReducedMotion: (enabled: boolean) => void
  toggleReducedMotion: () => void
  openSheet: (sheet: Exclude<ActiveSheet, null>) => void
  closeSheet: () => void
  setSearchQuery: (query: string) => void
  setPinnedRailCollapsed: (collapsed: boolean) => void
  togglePinnedRail: () => void
  setFoxRailCollapsed: (collapsed: boolean) => void
  toggleFoxRail: () => void
  setQuickCreateDraft: (draft: string) => void
  setQuickCreateEntityType: (entityType: WorkEntityType) => void
  setSocialComposerDraft: (draft: string) => void
}

const initialReducedMotion = readReducedMotion()
applyReducedMotionClass(initialReducedMotion)

export const useUiStore = create<UiState>((set, get) => ({
  reducedMotion: initialReducedMotion,
  activeSheet: null,
  searchQuery: '',
  pinnedRailCollapsed: getDefaultPinnedRailCollapsed(),
  foxRailCollapsed: false,
  quickCreateDraft: '',
  quickCreateEntityType: 'TASK',
  socialComposerDraft: '',
  setReducedMotion: (enabled) => {
    applyReducedMotionClass(enabled)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(REDUCED_MOTION_KEY, enabled ? '1' : '0')
      } catch {
        // Ignore storage errors
      }
    }
    set({ reducedMotion: enabled })
  },
  toggleReducedMotion: () => {
    get().setReducedMotion(!get().reducedMotion)
  },
  openSheet: (sheet) => set({ activeSheet: sheet }),
  closeSheet: () => set({ activeSheet: null }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setPinnedRailCollapsed: (pinnedRailCollapsed) => {
    persistPinnedRailCollapsed(pinnedRailCollapsed)
    set({ pinnedRailCollapsed })
  },
  togglePinnedRail: () =>
    set((s) => {
      const next = !s.pinnedRailCollapsed
      persistPinnedRailCollapsed(next)
      return { pinnedRailCollapsed: next }
    }),
  setFoxRailCollapsed: (foxRailCollapsed) => set({ foxRailCollapsed }),
  toggleFoxRail: () => set((s) => ({ foxRailCollapsed: !s.foxRailCollapsed })),
  setQuickCreateDraft: (quickCreateDraft) => set({ quickCreateDraft }),
  setQuickCreateEntityType: (quickCreateEntityType) => set({ quickCreateEntityType }),
  setSocialComposerDraft: (socialComposerDraft) => set({ socialComposerDraft })
}))
