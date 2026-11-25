import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useMessengerStore } from '@/stores/messengerStore'
import { FloatingBubbleDock } from './FloatingBubbleDock'
import { FloatingChatWindow } from './FloatingChatWindow'
import styles from './FloatingChat.module.css'

export interface FloatingChatHostProps {
  /** Whether FoxCompanionRail is currently rendered on the right desktop column */
  isFoxVisible: boolean
}

const UNAUTHENTICATED_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/loading'
]

export function FloatingChatHost({ isFoxVisible }: FloatingChatHostProps) {
  const location = useLocation()

  // Account isolation: bind floating chat state to authenticated user ID (or preview-guest in hybrid mode)
  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const prevWasAuthRef = useRef<boolean>(Boolean(accessToken.trim()))

  const floatingEnabled = useMessengerStore((s) => s.floatingEnabled)
  const activeFloatingConvId = useMessengerStore((s) => s.activeFloatingConvId)
  const openBubbleIds = useMessengerStore((s) => s.openBubbleIds)
  const dockSide = useMessengerStore((s) => s.dockSide)
  const minimizeFloatingChat = useMessengerStore((s) => s.minimizeFloatingChat)
  const closeConversationBubble = useMessengerStore((s) => s.closeConversationBubble)
  const syncAccountScope = useMessengerStore((s) => s.syncAccountScope)
  const clearPrivateSession = useMessengerStore((s) => s.clearPrivateSession)

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 700
  )

  const bubbleRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const registerBubbleRef = useCallback((convId: string, el: HTMLButtonElement | null) => {
    if (el) {
      bubbleRefs.current.set(convId, el)
    } else {
      bubbleRefs.current.delete(convId)
    }
  }, [])

  // Sync account scope & enforce logout cleanup
  useEffect(() => {
    const isNowAuth = Boolean(accessToken.trim())
    if (prevWasAuthRef.current && !isNowAuth) {
      clearPrivateSession()
    } else {
      const nextScope = isNowAuth && userId ? `user_${userId}` : 'preview-guest'
      syncAccountScope(nextScope)
    }
    prevWasAuthRef.current = isNowAuth
  }, [accessToken, userId, syncAccountScope, clearPrivateSession])

  // Track mobile breakpoint (< 700px) for full-sheet responsive floating chat window
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700)
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isUnauthenticatedRoute = UNAUTHENTICATED_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(`${p}/`)
  )
  const isMessagesRoute =
    location.pathname === '/messages' || location.pathname.startsWith('/messages/')

  const handleMinimize = useCallback(() => {
    const prevActive = activeFloatingConvId
    minimizeFloatingChat()
    // Restore keyboard focus to the corresponding bubble button
    if (prevActive) {
      requestAnimationFrame(() => {
        bubbleRefs.current.get(prevActive)?.focus()
      })
    }
  }, [activeFloatingConvId, minimizeFloatingChat])

  // Never mount on unauthenticated routes or when globally disabled
  if (isUnauthenticatedRoute || !floatingEnabled || openBubbleIds.length === 0) {
    return null
  }

  // On the full Messenger route: keep compact dock state, hide expanded floating window to avoid duplicate chat windows.
  // When navigating away, activeFloatingConvId is still intact in store, so the floating window restores seamlessly!
  const showExpandedWindow = Boolean(activeFloatingConvId) && !isMessagesRoute

  return (
    <div
      className={styles.hostRoot}
      data-testid="floating-chat-host"
      data-messenger-coexistence={isMessagesRoute ? 'collapsed' : 'active'}
    >
      <FloatingBubbleDock
        compactMode={isMessagesRoute}
        onRegisterBubbleRef={registerBubbleRef}
      />

      {showExpandedWindow && activeFloatingConvId && (
        <FloatingChatWindow
          conversationId={activeFloatingConvId}
          dockSide={dockSide}
          isFoxVisible={isFoxVisible}
          isMobile={isMobile}
          onMinimize={handleMinimize}
          onClose={closeConversationBubble}
        />
      )}
    </div>
  )
}
