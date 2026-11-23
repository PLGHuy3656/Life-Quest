import { create } from 'zustand'

export type ActiveSheet =
  | null
  | 'quick-create'
  | 'manage-pins'
  | 'search'
  | 'notifications'
  | 'api-status'

const REDUCED_MOTION_KEY = 'lq_reduced_motion'

function readReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(REDUCED_MOTION_KEY) === '1'
  } catch {
    return false
  }
}

function getDefaultPinnedRailCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  // Compact desktop (1024px–1199px) defaults pinned rail collapsed so Center content stays spacious
  return window.innerWidth >= 1024 && window.innerWidth < 1200
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
  setPinnedRailCollapsed: (pinnedRailCollapsed) => set({ pinnedRailCollapsed }),
  togglePinnedRail: () => set((s) => ({ pinnedRailCollapsed: !s.pinnedRailCollapsed })),
  setFoxRailCollapsed: (foxRailCollapsed) => set({ foxRailCollapsed }),
  toggleFoxRail: () => set((s) => ({ foxRailCollapsed: !s.foxRailCollapsed })),
  setQuickCreateDraft: (quickCreateDraft) => set({ quickCreateDraft }),
  setSocialComposerDraft: (socialComposerDraft) => set({ socialComposerDraft })
}))
