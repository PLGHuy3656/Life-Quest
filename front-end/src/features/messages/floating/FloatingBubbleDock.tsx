import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent
} from 'react'
import {
  ArrowLeftRight,
  GripHorizontal,
  PawPrint,
  PowerOff,
  RotateCcw,
  XCircle
} from 'lucide-react'
import {
  MAX_VISIBLE_BUBBLES,
  useMessengerStore,
  type DockSide
} from '@/stores/messengerStore'
import {
  computeSafeDockBounds,
  DOCK_WIDTH_ESTIMATE,
  DRAG_THRESHOLD_PX
} from './dockGeometry'
import { FloatingChatBubble } from './FloatingChatBubble'
import styles from './FloatingChat.module.css'

export interface FloatingBubbleDockProps {
  compactMode?: boolean
  onRegisterBubbleRef: (convId: string, el: HTMLButtonElement | null) => void
}

export function FloatingBubbleDock({
  compactMode = false,
  onRegisterBubbleRef
}: FloatingBubbleDockProps) {
  const conversations = useMessengerStore((s) => s.conversations)
  const openBubbleIds = useMessengerStore((s) => s.openBubbleIds)
  const activeFloatingConvId = useMessengerStore((s) => s.activeFloatingConvId)
  const dockCollapsed = useMessengerStore((s) => s.dockCollapsed)
  const dockSide = useMessengerStore((s) => s.dockSide)
  const normalizedY = useMessengerStore((s) => s.normalizedY)

  const toggleFloatingConversation = useMessengerStore((s) => s.toggleFloatingConversation)
  const toggleDockCollapsed = useMessengerStore((s) => s.toggleDockCollapsed)
  const closeConversationBubble = useMessengerStore((s) => s.closeConversationBubble)
  const closeAllBubbles = useMessengerStore((s) => s.closeAllBubbles)
  const reorderBubbleToFront = useMessengerStore((s) => s.reorderBubbleToFront)
  const openFloatingConversation = useMessengerStore((s) => s.openFloatingConversation)
  const setDockPosition = useMessengerStore((s) => s.setDockPosition)
  const resetBubblePosition = useMessengerStore((s) => s.resetBubblePosition)
  const setFloatingEnabled = useMessengerStore((s) => s.setFloatingEnabled)

  const dockRef = useRef<HTMLDivElement>(null)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 900
  }))
  const [dragCoords, setDragCoords] = useState<{ x: number; bottom: number } | null>(null)
  const dragStateRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originBottom: number
    lastX: number
    lastBottom: number
    moved: boolean
  } | null>(null)
  const suppressClickUntilRef = useRef<number>(0)

  // Track viewport resize cleanly so dock stays inside safe bounds
  useEffect(() => {
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight })
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Close overflow menu on Escape or outside click
  useEffect(() => {
    if (!overflowOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOverflowOpen(false)
    }
    const onPointerDown = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setOverflowOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [overflowOpen])

  const openConversations = useMemo(() => {
    const map = new Map(conversations.map((c) => [c.id, c]))
    return openBubbleIds
      .map((id) => map.get(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
  }, [conversations, openBubbleIds])

  const visibleBubbles = openConversations.slice(0, MAX_VISIBLE_BUBBLES)
  const overflowBubbles = openConversations.slice(MAX_VISIBLE_BUBBLES)
  const totalUnreadCount = useMemo(
    () => openConversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [openConversations]
  )

  // Anchor the dock by its BOTTOM edge (Fox Paw button) using a fixed max-expanded height budget
  // so collapsing/expanding bubbles NEVER shifts the Fox Paw button by even 1px.
  const ANCHOR_HEIGHT_BUDGET = 220
  const bounds = useMemo(
    () => computeSafeDockBounds(viewport.w, viewport.h, ANCHOR_HEIGHT_BUDGET),
    [viewport.w, viewport.h]
  )

  // Convert vertical bounds to bottom-distance bounds:
  // normalizedY = 1 -> bottom-most safe edge (minBottom); normalizedY = 0 -> top-most safe edge (maxBottom)
  const minBottom = Math.max(18, viewport.h - bounds.maxY - ANCHOR_HEIGHT_BUDGET)
  const maxBottom = Math.max(minBottom, viewport.h - bounds.minY - ANCHOR_HEIGHT_BUDGET)

  const snappedX = dockSide === 'left' ? bounds.minX : bounds.maxX
  const snappedBottom = Math.round(maxBottom - (maxBottom - minBottom) * normalizedY)

  const displayX = dragCoords ? dragCoords.x : snappedX
  const displayBottom = dragCoords ? dragCoords.bottom : snappedBottom

  const handleActivateBubble = useCallback(
    (convId: string) => {
      if (Date.now() < suppressClickUntilRef.current) return
      toggleFloatingConversation(convId)
    },
    [toggleFloatingConversation]
  )

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Allow drag from the drag handle or dock background; ignore close buttons/overflow menu
    const target = e.target as HTMLElement
    if (target.closest('[data-no-drag="true"]')) return
    if (e.button !== 0 && e.pointerType === 'mouse') return

    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: snappedX,
      originBottom: snappedBottom,
      lastX: snappedX,
      lastBottom: snappedBottom,
      moved: false
    }

    const onWindowMove = (ev: PointerEvent) => {
      const drag = dragStateRef.current
      if (!drag || drag.pointerId !== ev.pointerId) return
      const dx = ev.clientX - drag.startX
      const dy = ev.clientY - drag.startY
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
        drag.moved = true
      }
      const nextX = Math.max(bounds.minX, Math.min(bounds.maxX, drag.originX + dx))
      const nextBottom = Math.max(minBottom, Math.min(maxBottom, drag.originBottom - dy))
      drag.lastX = nextX
      drag.lastBottom = nextBottom
      setDragCoords({ x: nextX, bottom: nextBottom })
    }

    const onWindowUp = (ev: PointerEvent) => {
      const drag = dragStateRef.current
      if (!drag || drag.pointerId !== ev.pointerId) return
      dragStateRef.current = null
      window.removeEventListener('pointermove', onWindowMove)
      window.removeEventListener('pointerup', onWindowUp)
      window.removeEventListener('pointercancel', onWindowUp)

      if (!drag.moved) {
        setDragCoords(null)
        return
      }

      suppressClickUntilRef.current = Date.now() + 220
      const centerX = drag.lastX + DOCK_WIDTH_ESTIMATE / 2
      const nextSide: DockSide = centerX < viewport.w / 2 ? 'left' : 'right'
      const spanBottom = Math.max(1, maxBottom - minBottom)
      const nextNormY = (maxBottom - drag.lastBottom) / spanBottom

      setDragCoords(null)
      setDockPosition(nextSide, nextNormY)
    }

    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowUp)
  }

  // Keyboard alternative to dragging (accessible non-pointer positioning)
  const handleDragHandleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setDockPosition('left', normalizedY)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setDockPosition('right', normalizedY)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setDockPosition(dockSide, Math.max(0, normalizedY - 0.12))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setDockPosition(dockSide, Math.min(1, normalizedY + 0.12))
    } else if (e.key === 'Home') {
      e.preventDefault()
      resetBubblePosition()
    }
  }

  if (openConversations.length === 0) return null

  return (
    <aside
      ref={dockRef}
      className={`${styles.dock} ${dragCoords ? styles.dockDragging : ''} ${compactMode ? styles.dockCompact : ''}`.trim()}
      style={{ left: displayX, bottom: displayBottom }}
      onPointerDown={handlePointerDown}
      aria-label="Thanh bong bóng trò chuyện nổi"
      data-testid="floating-bubble-dock"
      data-dock-side={dockSide}
      data-dock-collapsed={dockCollapsed ? 'true' : 'false'}
      data-normalized-y={normalizedY}
      data-compact={compactMode ? 'true' : 'false'}
      data-fox-safe="true"
    >
      <div className={styles.overflowWrap}>
        <button
          type="button"
          className={styles.dragHandle}
          onClick={() => {
            if (Date.now() < suppressClickUntilRef.current) return
            setOverflowOpen((v) => !v)
          }}
          onKeyDown={handleDragHandleKeyDown}
          aria-expanded={overflowOpen}
          aria-haspopup="menu"
          aria-label={
            overflowBubbles.length > 0
              ? `Cài đặt bong bóng chat (+${overflowBubbles.length} bong bóng khác) hoặc kéo để di chuyển`
              : 'Cài đặt bong bóng chat hoặc kéo để di chuyển (phím mũi tên để đổi vị trí)'
          }
          title={
            overflowBubbles.length > 0
              ? `Nhấn để mở cài đặt & +${overflowBubbles.length} bong bóng khác • Kéo để di chuyển`
              : 'Nhấn để mở cài đặt • Kéo để di chuyển'
          }
          data-testid="floating-dock-drag-handle"
        >
          <GripHorizontal size={14} aria-hidden="true" />
          {overflowBubbles.length > 0 && (
            <span className={styles.handleOverflowCount} data-testid="floating-dock-overflow-count">
              +{overflowBubbles.length}
            </span>
          )}
        </button>

        {overflowOpen && (
          <div
            className={`${styles.overflowMenu} ${styles.overflowMenuTop} ${dockSide === 'left' ? styles.overflowMenuRight : styles.overflowMenuLeft}`}
            role="menu"
            aria-label="Menu cài đặt và quản lý bong bóng chat"
            data-no-drag="true"
            data-testid="floating-dock-overflow-menu"
          >
            {overflowBubbles.length > 0 && (
              <>
                <div className={styles.overflowTitle}>Bong bóng khác ({overflowBubbles.length})</div>
                {overflowBubbles.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    role="menuitem"
                    className={styles.overflowItem}
                    onClick={() => {
                      reorderBubbleToFront(conv.id)
                      openFloatingConversation(conv.id, { expand: !compactMode })
                      setOverflowOpen(false)
                    }}
                    data-testid={`floating-overflow-item-${conv.id}`}
                  >
                    <span
                      className={`${styles.overflowItemAvatar} ${styles[`tone_${conv.avatarTone}`]}`}
                      aria-hidden="true"
                    >
                      {conv.avatarInitials}
                    </span>
                    <span className={styles.overflowItemName}>{conv.title}</span>
                    {conv.unreadCount > 0 && (
                      <span className={styles.previewPill}>{conv.unreadCount}</span>
                    )}
                  </button>
                ))}
                <div className={styles.overflowDivider} />
              </>
            )}

            <button
              type="button"
              role="menuitem"
              className={styles.overflowActionBtn}
              onClick={() => {
                setDockPosition(dockSide === 'left' ? 'right' : 'left', normalizedY)
                setOverflowOpen(false)
              }}
              data-testid="floating-dock-switch-side-btn"
            >
              <ArrowLeftRight size={14} aria-hidden="true" />
              <span>Chuyển sang cạnh {dockSide === 'left' ? 'phải' : 'trái'}</span>
            </button>

            <button
              type="button"
              role="menuitem"
              className={styles.overflowActionBtn}
              onClick={() => {
                resetBubblePosition()
                setOverflowOpen(false)
              }}
              data-testid="floating-dock-reset-pos-btn"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Đặt lại vị trí mặc định</span>
            </button>

            <button
              type="button"
              role="menuitem"
              className={styles.overflowActionBtn}
              onClick={() => {
                closeAllBubbles()
                setOverflowOpen(false)
              }}
              data-testid="floating-dock-close-all-btn"
            >
              <XCircle size={14} aria-hidden="true" />
              <span>Đóng tất cả bong bóng</span>
            </button>

            <button
              type="button"
              role="menuitem"
              className={`${styles.overflowActionBtn} ${styles.overflowActionDanger}`}
              onClick={() => {
                setFloatingEnabled(false)
                setOverflowOpen(false)
              }}
              data-testid="floating-dock-disable-btn"
            >
              <PowerOff size={14} aria-hidden="true" />
              <span>Tắt Bong bóng chat</span>
            </button>
          </div>
        )}
      </div>

      <div
        className={`${styles.bubbleList} ${dockCollapsed ? styles.bubbleListCollapsed : ''}`.trim()}
        role="list"
        aria-label="Danh sách bong bóng trò chuyện"
        aria-hidden={dockCollapsed}
      >
        {visibleBubbles.map((conv, idx) => (
          <div
            key={conv.id}
            role="listitem"
            className={styles.bubbleSlot}
            style={{ '--bubble-idx': visibleBubbles.length - 1 - idx } as CSSProperties}
          >
            <FloatingChatBubble
              conversation={conv}
              isActive={!compactMode && activeFloatingConvId === conv.id}
              dockSide={dockSide}
              onActivate={handleActivateBubble}
              onClose={closeConversationBubble}
              buttonRef={(el) => onRegisterBubbleRef(conv.id, el)}
            />
          </div>
        ))}
      </div>

      {/* Signature Fox Paw Collapse/Expand Button */}
      <button
        type="button"
        className={`${styles.dockControlBtn} ${dockCollapsed ? styles.dockControlBtnCollapsed : ''}`.trim()}
        onClick={() => {
          if (Date.now() < suppressClickUntilRef.current) return
          setOverflowOpen(false)
          toggleDockCollapsed()
        }}
        aria-expanded={!dockCollapsed}
        aria-label={
          dockCollapsed
            ? `Mở rộng ${openConversations.length} bong bóng chat${totalUnreadCount > 0 ? `, ${totalUnreadCount} tin nhắn chưa đọc` : ''}`
            : 'Thu gọn các bong bóng chat'
        }
        title={dockCollapsed ? 'Mở rộng bong bóng chat' : 'Thu gọn bong bóng chat'}
        data-testid="floating-dock-paw-toggle-btn"
      >
        <PawPrint
          size={18}
          strokeWidth={2.2}
          className={`${styles.pawIcon} ${dockCollapsed ? styles.pawIconCollapsed : ''}`.trim()}
          aria-hidden="true"
        />
        {dockCollapsed && totalUnreadCount > 0 && (
          <span
            className={styles.unreadBadge}
            aria-label={`${totalUnreadCount} tin nhắn chưa đọc`}
            data-testid="floating-dock-collapsed-unread"
          >
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>
    </aside>
  )
}
