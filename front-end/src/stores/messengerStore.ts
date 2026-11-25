import { create } from 'zustand'
import {
  PREVIEW_CONVERSATIONS,
  PREVIEW_MESSAGES_BY_CONVERSATION
} from '@/features/messages/messengerFixtures'
import type {
  ChatImageItem,
  ChatMessage,
  Conversation,
  LocalAttachmentDraft
} from '@/features/messages/messengerTypes'

export type DockSide = 'left' | 'right'

export interface FloatingChatPersistedPrefs {
  enabled: boolean
  dockSide: DockSide
  normalizedY: number
  openBubbleIds: string[]
}

const STORAGE_PREFIX = 'lq_floating_chat_prefs_v1::'
export const DEFAULT_DOCK_SIDE: DockSide = 'left'
export const DEFAULT_NORMALIZED_Y = 0.82
export const MAX_VISIBLE_BUBBLES = 3

function getDefaultBubbleIds(): string[] {
  return PREVIEW_CONVERSATIONS.slice(0, 2).map((c) => c.id)
}

function clampNormalizedY(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_NORMALIZED_Y
  return Math.max(0, Math.min(1, Number(value.toFixed(4))))
}

function getStorageKey(scopeKey: string): string {
  return `${STORAGE_PREFIX}${scopeKey}`
}

function isSafeConversationId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= 80 && /^[a-zA-Z0-9_-]+$/.test(id)
}

function loadPrefsForScope(scopeKey: string): FloatingChatPersistedPrefs {
  const fallback: FloatingChatPersistedPrefs = {
    enabled: true,
    dockSide: DEFAULT_DOCK_SIDE,
    normalizedY: DEFAULT_NORMALIZED_Y,
    openBubbleIds: getDefaultBubbleIds()
  }

  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(getStorageKey(scopeKey))
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<FloatingChatPersistedPrefs>
    const validIds = new Set(PREVIEW_CONVERSATIONS.map((c) => c.id))
    const openBubbleIds = Array.isArray(parsed.openBubbleIds)
      ? parsed.openBubbleIds.filter((id): id is string => isSafeConversationId(id) && validIds.has(id))
      : fallback.openBubbleIds

    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      dockSide: parsed.dockSide === 'right' || parsed.dockSide === 'left' ? parsed.dockSide : DEFAULT_DOCK_SIDE,
      normalizedY:
        typeof parsed.normalizedY === 'number'
          ? clampNormalizedY(parsed.normalizedY)
          : DEFAULT_NORMALIZED_Y,
      openBubbleIds
    }
  } catch {
    return fallback
  }
}

function savePrefsForScope(scopeKey: string, prefs: FloatingChatPersistedPrefs): void {
  if (typeof window === 'undefined') return
  try {
    // Security rule: ONLY safe UI preferences and validated conversation IDs are stored.
    // Never store private message bodies, drafts, or access tokens.
    const payload: FloatingChatPersistedPrefs = {
      enabled: prefs.enabled,
      dockSide: prefs.dockSide,
      normalizedY: clampNormalizedY(prefs.normalizedY),
      openBubbleIds: prefs.openBubbleIds.filter(isSafeConversationId)
    }
    window.localStorage.setItem(getStorageKey(scopeKey), JSON.stringify(payload))
  } catch {
    // Ignore storage quota or private browsing errors cleanly
  }
}

function clonePreviewConversations(): Conversation[] {
  return PREVIEW_CONVERSATIONS.map((c) => ({
    ...c,
    members: c.members.map((m) => ({ ...m })),
    sharedQuests: c.sharedQuests.map((q) => ({ ...q }))
  }))
}

function clonePreviewMessages(): Record<string, ChatMessage[]> {
  const out: Record<string, ChatMessage[]> = {}
  for (const [k, list] of Object.entries(PREVIEW_MESSAGES_BY_CONVERSATION)) {
    out[k] = list.map((m) => ({ ...m }))
  }
  return out
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function nowTimeLabel(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const createdObjectUrls = new Set<string>()

function revokeAllObjectUrls(): void {
  for (const url of createdObjectUrls) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      // Ignore in test environments
    }
  }
  createdObjectUrls.clear()
}

export interface MessengerStoreState {
  // Account scope (prevents cross-account state leaks)
  accountScope: string
  // Shared messaging state (reused by MessagesPage and FloatingChatHost)
  conversations: Conversation[]
  messagesByConv: Record<string, ChatMessage[]>
  draftsByConv: Record<string, string>
  attachmentsByConv: Record<string, LocalAttachmentDraft[]>
  selectedMessengerId: string | null
  // Floating chat state machine
  floatingEnabled: boolean
  openBubbleIds: string[]
  activeFloatingConvId: string | null
  dockCollapsed: boolean
  dockSide: DockSide
  normalizedY: number
  // Shared messaging actions
  selectMessengerConversation: (id: string) => void
  toggleMuteConversation: (id: string) => void
  setDraft: (convId: string, next: string) => void
  addAttachments: (convId: string, files: FileList | File[]) => void
  removeAttachment: (convId: string, attId: string) => void
  sendLocalPreviewMessage: (convId: string) => void
  // Floating chat actions
  openFloatingConversation: (convId: string, options?: { expand?: boolean; forceEnable?: boolean }) => void
  toggleFloatingConversation: (convId: string) => void
  minimizeFloatingChat: () => void
  toggleDockCollapsed: () => void
  setDockCollapsed: (collapsed: boolean) => void
  closeConversationBubble: (convId: string) => void
  closeAllBubbles: () => void
  reorderBubbleToFront: (convId: string) => void
  setFloatingEnabled: (enabled: boolean) => void
  setDockPosition: (side: DockSide, normalizedY: number) => void
  resetBubblePosition: () => void
  // Account isolation & lifecycle
  syncAccountScope: (scopeKey: string) => void
  clearPrivateSession: () => void
}

const initialScope = 'preview-guest'
const initialPrefs = loadPrefsForScope(initialScope)

export const useMessengerStore = create<MessengerStoreState>((set, get) => {
  const persistCurrentPrefs = (next: Partial<FloatingChatPersistedPrefs>) => {
    const state = get()
    savePrefsForScope(state.accountScope, {
      enabled: next.enabled ?? state.floatingEnabled,
      dockSide: next.dockSide ?? state.dockSide,
      normalizedY: next.normalizedY ?? state.normalizedY,
      openBubbleIds: next.openBubbleIds ?? state.openBubbleIds
    })
  }

  return {
    accountScope: initialScope,
    conversations: clonePreviewConversations(),
    messagesByConv: clonePreviewMessages(),
    draftsByConv: {},
    attachmentsByConv: {},
    selectedMessengerId: PREVIEW_CONVERSATIONS[0]?.id ?? null,

    floatingEnabled: initialPrefs.enabled,
    openBubbleIds: initialPrefs.openBubbleIds,
    activeFloatingConvId: null,
    dockCollapsed: false,
    dockSide: initialPrefs.dockSide,
    normalizedY: initialPrefs.normalizedY,

    selectMessengerConversation: (id) =>
      set((state) => {
        const needsUnreadClear = state.conversations.some((c) => c.id === id && c.unreadCount > 0)
        if (state.selectedMessengerId === id && !needsUnreadClear) return state
        return {
          selectedMessengerId: id,
          conversations: needsUnreadClear
            ? state.conversations.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
            : state.conversations
        }
      }),

    toggleMuteConversation: (id) =>
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, muted: !c.muted } : c
        )
      })),

    setDraft: (convId, next) =>
      set((state) => ({
        draftsByConv: { ...state.draftsByConv, [convId]: next }
      })),

    addAttachments: (convId, files) => {
      const list = Array.from(files)
      const nextItems: LocalAttachmentDraft[] = []
      for (const file of list) {
        if (!file.type.startsWith('image/')) continue
        const objectUrl = URL.createObjectURL(file)
        createdObjectUrls.add(objectUrl)
        nextItems.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          fileName: file.name,
          objectUrl,
          sizeLabel: formatFileSize(file.size)
        })
      }
      if (nextItems.length === 0) return
      set((state) => ({
        attachmentsByConv: {
          ...state.attachmentsByConv,
          [convId]: [...(state.attachmentsByConv[convId] ?? []), ...nextItems].slice(0, 4)
        }
      }))
    },

    removeAttachment: (convId, attId) =>
      set((state) => ({
        attachmentsByConv: {
          ...state.attachmentsByConv,
          [convId]: (state.attachmentsByConv[convId] ?? []).filter((a) => a.id !== attId)
        }
      })),

    sendLocalPreviewMessage: (convId) => {
      const state = get()
      const conv = state.conversations.find((c) => c.id === convId)
      if (!conv) return
      const text = (state.draftsByConv[convId] ?? '').trim()
      const atts = state.attachmentsByConv[convId] ?? []
      if (!text && atts.length === 0) return

      const images: ChatImageItem[] = atts.map((att) => ({
        id: att.id,
        src: att.objectUrl,
        alt: att.fileName,
        isLocalObjectUrl: true
      }))

      const newMsg: ChatMessage = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        conversationId: convId,
        senderId: 'u-self',
        senderName: 'Bạn',
        senderInitials: 'LQ',
        senderTone: 'navy',
        isSelf: true,
        timeLabel: nowTimeLabel(),
        dateGroupLabel: 'Hôm nay',
        kind: text && images.length > 0 ? 'MIXED' : images.length > 0 ? 'IMAGE' : 'TEXT',
        text: text || undefined,
        images: images.length > 0 ? images : undefined,
        isLocalPreviewSimulation: true
      }

      set((prev) => ({
        messagesByConv: {
          ...prev.messagesByConv,
          [convId]: [...(prev.messagesByConv[convId] ?? []), newMsg]
        },
        draftsByConv: { ...prev.draftsByConv, [convId]: '' },
        attachmentsByConv: { ...prev.attachmentsByConv, [convId]: [] },
        conversations: prev.conversations.map((c) =>
          c.id === convId
            ? {
                ...c,
                lastMessagePreview: text || `Đã chọn ${images.length} ảnh (mô phỏng cục bộ)`,
                lastActivityLabel: 'Vừa xong'
              }
            : c
        )
      }))
    },

    openFloatingConversation: (convId, options) => {
      const state = get()
      const expand = options?.expand ?? true
      const forceEnable = options?.forceEnable ?? false
      if (!state.floatingEnabled && !forceEnable) {
        // When globally disabled, do not auto-reopen bubbles unless user explicitly re-enables
        return
      }
      if (!state.conversations.some((c) => c.id === convId)) return

      const nextEnabled = forceEnable ? true : state.floatingEnabled
      const nextBubbleIds = [convId, ...state.openBubbleIds.filter((id) => id !== convId)]

      set((prev) => ({
        floatingEnabled: nextEnabled,
        openBubbleIds: nextBubbleIds,
        activeFloatingConvId: expand ? convId : prev.activeFloatingConvId,
        conversations: expand
          ? prev.conversations.map((c) =>
              c.id === convId && c.unreadCount > 0 ? { ...c, unreadCount: 0 } : c
            )
          : prev.conversations
      }))
      persistCurrentPrefs({ enabled: nextEnabled, openBubbleIds: nextBubbleIds })
    },

    toggleFloatingConversation: (convId) => {
      const state = get()
      if (!state.floatingEnabled) return
      if (state.activeFloatingConvId === convId) {
        set({ activeFloatingConvId: null })
        return
      }
      const nextBubbleIds = state.openBubbleIds.includes(convId)
        ? state.openBubbleIds
        : [convId, ...state.openBubbleIds]
      set((prev) => ({
        openBubbleIds: nextBubbleIds,
        activeFloatingConvId: convId,
        conversations: prev.conversations.map((c) =>
          c.id === convId && c.unreadCount > 0 ? { ...c, unreadCount: 0 } : c
        )
      }))
      persistCurrentPrefs({ openBubbleIds: nextBubbleIds })
    },

    minimizeFloatingChat: () => {
      // Minimize collapses the active floating window into a bubble.
      // Does NOT close the bubble and does NOT disable floating chat.
      set({ activeFloatingConvId: null })
    },

    toggleDockCollapsed: () => {
      set((state) => {
        const nextCollapsed = !state.dockCollapsed
        return {
          dockCollapsed: nextCollapsed,
          activeFloatingConvId: nextCollapsed ? null : state.activeFloatingConvId
        }
      })
    },

    setDockCollapsed: (collapsed) => {
      set((state) => ({
        dockCollapsed: collapsed,
        activeFloatingConvId: collapsed ? null : state.activeFloatingConvId
      }))
    },

    closeConversationBubble: (convId) => {
      const state = get()
      const nextBubbleIds = state.openBubbleIds.filter((id) => id !== convId)
      const nextActive = state.activeFloatingConvId === convId ? null : state.activeFloatingConvId
      set({
        openBubbleIds: nextBubbleIds,
        activeFloatingConvId: nextActive
      })
      persistCurrentPrefs({ openBubbleIds: nextBubbleIds })
    },

    closeAllBubbles: () => {
      set({
        openBubbleIds: [],
        activeFloatingConvId: null
      })
      persistCurrentPrefs({ openBubbleIds: [] })
    },

    reorderBubbleToFront: (convId) => {
      const state = get()
      if (!state.openBubbleIds.includes(convId)) return
      const nextBubbleIds = [convId, ...state.openBubbleIds.filter((id) => id !== convId)]
      set({ openBubbleIds: nextBubbleIds })
      persistCurrentPrefs({ openBubbleIds: nextBubbleIds })
    },

    setFloatingEnabled: (enabled) => {
      const state = get()
      const nextOpenBubbles =
        enabled && state.openBubbleIds.length === 0 ? getDefaultBubbleIds() : state.openBubbleIds
      set({
        floatingEnabled: enabled,
        activeFloatingConvId: enabled ? state.activeFloatingConvId : null,
        openBubbleIds: nextOpenBubbles
      })
      persistCurrentPrefs({ enabled, openBubbleIds: nextOpenBubbles })
    },

    setDockPosition: (side, normalizedY) => {
      const clamped = clampNormalizedY(normalizedY)
      set({ dockSide: side, normalizedY: clamped })
      persistCurrentPrefs({ dockSide: side, normalizedY: clamped })
    },

    resetBubblePosition: () => {
      set({ dockSide: DEFAULT_DOCK_SIDE, normalizedY: DEFAULT_NORMALIZED_Y })
      persistCurrentPrefs({ dockSide: DEFAULT_DOCK_SIDE, normalizedY: DEFAULT_NORMALIZED_Y })
    },

    syncAccountScope: (scopeKey) => {
      const state = get()
      if (state.accountScope === scopeKey) return
      // Account switched: wipe previous account's in-memory drafts/attachments/messages
      // and load ONLY the new account's safe persisted preferences.
      revokeAllObjectUrls()
      const prefs = loadPrefsForScope(scopeKey)
      set({
        accountScope: scopeKey,
        conversations: clonePreviewConversations(),
        messagesByConv: clonePreviewMessages(),
        draftsByConv: {},
        attachmentsByConv: {},
        selectedMessengerId: PREVIEW_CONVERSATIONS[0]?.id ?? null,
        floatingEnabled: prefs.enabled,
        openBubbleIds: prefs.openBubbleIds,
        activeFloatingConvId: null,
        dockCollapsed: false,
        dockSide: prefs.dockSide,
        normalizedY: prefs.normalizedY
      })
    },

    clearPrivateSession: () => {
      // Logout cleanup: immediately clear all in-memory messages, drafts, attachments,
      // and close any expanded floating chat window so no private data leaks.
      revokeAllObjectUrls()
      const guestPrefs = loadPrefsForScope('preview-guest')
      set({
        accountScope: 'preview-guest',
        conversations: clonePreviewConversations(),
        messagesByConv: clonePreviewMessages(),
        draftsByConv: {},
        attachmentsByConv: {},
        selectedMessengerId: PREVIEW_CONVERSATIONS[0]?.id ?? null,
        floatingEnabled: guestPrefs.enabled,
        openBubbleIds: guestPrefs.openBubbleIds,
        activeFloatingConvId: null,
        dockCollapsed: false,
        dockSide: guestPrefs.dockSide,
        normalizedY: guestPrefs.normalizedY
      })
    }
  }
})
