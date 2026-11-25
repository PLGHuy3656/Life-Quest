import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent
} from 'react'
import { ArrowDownRight } from 'lucide-react'
import styles from './ChibiFoxWidget.module.css'

export interface ChibiFoxWidgetProps {
  visible: boolean
}

interface ChibiPrefs {
  normX: number
  normY: number
  size: number
}

interface LookVector {
  x: number // -1..1
  y: number // -1..1
  facingRight: boolean
}

const STORAGE_KEY = 'lq_chibi_fox_prefs_v1'
const DEFAULT_PREFS: ChibiPrefs = { normX: 0.98, normY: 0.94, size: 74 }
const MIN_SIZE = 52
const MAX_SIZE = 128
const SIZE_STEP = 12
const EDGE_MARGIN = 16
const HEADER_SAFE_TOP = 84
const MOBILE_NAV_SAFE_BOTTOM = 86
const DESKTOP_SAFE_BOTTOM = 18
const DRAG_THRESHOLD_PX = 5

const CHIBI_QUOTES = [
  'Mình vẫn ở đây cổ vũ bạn nè! 🦊',
  'Kéo mình đi đâu cũng được nha~',
  'Rê chuột lên để chỉnh cỡ mình nhé 🍁',
  'Cố lên, từng bước nhỏ mỗi ngày!'
]

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function loadPrefs(): ChibiPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<ChibiPrefs>
    return {
      normX:
        typeof parsed.normX === 'number' && Number.isFinite(parsed.normX)
          ? clamp(parsed.normX, 0, 1)
          : DEFAULT_PREFS.normX,
      normY:
        typeof parsed.normY === 'number' && Number.isFinite(parsed.normY)
          ? clamp(parsed.normY, 0, 1)
          : DEFAULT_PREFS.normY,
      size:
        typeof parsed.size === 'number' && Number.isFinite(parsed.size)
          ? clamp(Math.round(parsed.size), MIN_SIZE, MAX_SIZE)
          : DEFAULT_PREFS.size
    }
  } catch {
    return DEFAULT_PREFS
  }
}

function savePrefs(prefs: ChibiPrefs): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore private browsing / quota errors
  }
}

export function ChibiFoxWidget({ visible }: ChibiFoxWidgetProps) {
  const [prefs, setPrefs] = useState<ChibiPrefs>(() => loadPrefs())
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 900
  }))
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isHopping, setIsHopping] = useState(false)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [quoteVisible, setQuoteVisible] = useState(false)
  const [look, setLook] = useState<LookVector>({ x: 0, y: 0, facingRight: false })

  const rootRef = useRef<HTMLDivElement>(null)
  const suppressClickUntilRef = useRef(0)
  const quoteTimerRef = useRef<number | null>(null)
  const hopTimerRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Page-wide smooth mouse-tracking look-at (throttled via requestAnimationFrame)
  useEffect(() => {
    if (!visible) return
    const onPointerMove = (e: PointerEvent) => {
      if (rafRef.current !== null) return
      const clientX = e.clientX
      const clientY = e.clientY
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null
        const el = rootRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = clientX - cx
        const dy = clientY - cy
        const normLookX = clamp(dx / 260, -1, 1)
        const normLookY = clamp(dy / 240, -1, 1)
        setLook((prev) => {
          // Small hysteresis (24px) prevents jittery left/right flipping right above Fox
          const nextFacingRight =
            dx > 24 ? true : dx < -24 ? false : prev.facingRight
          if (
            Math.abs(prev.x - normLookX) < 0.02 &&
            Math.abs(prev.y - normLookY) < 0.02 &&
            prev.facingRight === nextFacingRight
          ) {
            return prev
          }
          return { x: normLookX, y: normLookY, facingRight: nextFacingRight }
        })
      })
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [visible])

  useEffect(() => {
    return () => {
      if (quoteTimerRef.current) window.clearTimeout(quoteTimerRef.current)
      if (hopTimerRef.current) window.clearTimeout(hopTimerRef.current)
    }
  }, [])

  const updatePrefs = (updater: (prev: ChibiPrefs) => ChibiPrefs) => {
    setPrefs((prev) => {
      const next = updater(prev)
      savePrefs(next)
      return next
    })
  }

  const bounds = useMemo(() => {
    const isNarrow = viewport.w < 1024
    const minX = EDGE_MARGIN
    const maxX = Math.max(minX, viewport.w - prefs.size - EDGE_MARGIN)
    const minY = isNarrow ? 68 : HEADER_SAFE_TOP
    const bottomInset = isNarrow ? MOBILE_NAV_SAFE_BOTTOM : DESKTOP_SAFE_BOTTOM
    const maxY = Math.max(minY, viewport.h - prefs.size - bottomInset)
    return { minX, maxX, minY, maxY }
  }, [viewport.w, viewport.h, prefs.size])

  const computedX = Math.round(bounds.minX + (bounds.maxX - bounds.minX) * prefs.normX)
  const computedY = Math.round(bounds.minY + (bounds.maxY - bounds.minY) * prefs.normY)

  const displayX = dragPos ? dragPos.x : computedX
  const displayY = dragPos ? dragPos.y : computedY

  const handleDragStart = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const startX = e.clientX
    const startY = e.clientY
    const originX = computedX
    const originY = computedY
    let moved = false
    let lastX = originX
    let lastY = originY

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (!moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
        moved = true
      }
      lastX = clamp(originX + dx, bounds.minX, bounds.maxX)
      lastY = clamp(originY + dy, bounds.minY, bounds.maxY)
      setDragPos({ x: lastX, y: lastY })
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      if (!moved) {
        setDragPos(null)
        return
      }
      suppressClickUntilRef.current = Date.now() + 220
      const spanX = Math.max(1, bounds.maxX - bounds.minX)
      const spanY = Math.max(1, bounds.maxY - bounds.minY)
      const nextNormX = Number(clamp((lastX - bounds.minX) / spanX, 0, 1).toFixed(4))
      const nextNormY = Number(clamp((lastY - bounds.minY) / spanY, 0, 1).toFixed(4))
      setDragPos(null)
      updatePrefs((prev) => ({ ...prev, normX: nextNormX, normY: nextNormY }))
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const handleResizeStart = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const startX = e.clientX
    const startY = e.clientY
    const startSize = prefs.size
    setIsResizing(true)

    const onMove = (ev: PointerEvent) => {
      const delta = Math.round((ev.clientX - startX + (ev.clientY - startY)) / 2)
      const nextSize = clamp(startSize + delta, MIN_SIZE, MAX_SIZE)
      updatePrefs((prev) => ({ ...prev, size: nextSize }))
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      setIsResizing(false)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const handleChibiClick = () => {
    if (Date.now() < suppressClickUntilRef.current) return
    setQuoteIdx((prev) => (quoteVisible ? (prev + 1) % CHIBI_QUOTES.length : prev))
    setQuoteVisible(true)
    setIsHopping(true)
    if (hopTimerRef.current) window.clearTimeout(hopTimerRef.current)
    hopTimerRef.current = window.setTimeout(() => setIsHopping(false), 500)
    if (quoteTimerRef.current) window.clearTimeout(quoteTimerRef.current)
    quoteTimerRef.current = window.setTimeout(() => setQuoteVisible(false), 3400)
  }

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      updatePrefs((p) => ({ ...p, normX: clamp(p.normX - 0.08, 0, 1) }))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      updatePrefs((p) => ({ ...p, normX: clamp(p.normX + 0.08, 0, 1) }))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      updatePrefs((p) => ({ ...p, normY: clamp(p.normY - 0.08, 0, 1) }))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      updatePrefs((p) => ({ ...p, normY: clamp(p.normY + 0.08, 0, 1) }))
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      updatePrefs((p) => ({ ...p, size: clamp(p.size + SIZE_STEP, MIN_SIZE, MAX_SIZE) }))
    } else if (e.key === '-') {
      e.preventDefault()
      updatePrefs((p) => ({ ...p, size: clamp(p.size - SIZE_STEP, MIN_SIZE, MAX_SIZE) }))
    } else if (e.key === 'Home') {
      e.preventDefault()
      updatePrefs(() => DEFAULT_PREFS)
    }
  }

  if (!visible) return null

  const alignQuoteLeft = displayX < viewport.w / 2
  const flipX = look.facingRight ? -1 : 1
  const tiltY = Number((look.x * 18).toFixed(1))
  const tiltX = Number((-look.y * 11).toFixed(1))
  const tiltZ = Number((look.x * 4.5).toFixed(1))
  const shiftX = Number((look.x * 3).toFixed(1))
  const shiftY = Number((look.y * 2).toFixed(1))

  return (
    <div
      ref={rootRef}
      className={`${styles.chibiRoot} ${dragPos || isResizing ? styles.chibiDragging : ''}`.trim()}
      style={{ left: displayX, top: displayY }}
      data-testid="chibi-fox-widget"
      data-size={prefs.size}
      data-facing={look.facingRight ? 'right' : 'left'}
    >
      {/* Always-mounted smooth enter/exit speech bubble */}
      <div
        className={`${styles.chibiQuote} ${alignQuoteLeft ? styles.chibiQuoteLeft : styles.chibiQuoteRight} ${quoteVisible ? styles.chibiQuoteVisible : ''}`.trim()}
        role="status"
        aria-live="polite"
        aria-hidden={!quoteVisible}
        data-testid="chibi-fox-quote"
        data-visible={quoteVisible ? 'true' : 'false'}
      >
        {CHIBI_QUOTES[quoteIdx]}
      </div>

      {/* Transparent Draggable Chibi Fox with Breathing, Hop & Page-Wide Cursor Look-At */}
      <button
        type="button"
        className={`${styles.chibiBody} ${isHopping ? styles.chibiHop : ''}`.trim()}
        style={{ width: prefs.size, height: prefs.size }}
        onPointerDown={handleDragStart}
        onClick={handleChibiClick}
        onKeyDown={handleKeyDown}
        aria-label={`Cáo Chibi đồng hành (${prefs.size}px) — kéo để đổi vị trí, dùng phím mũi tên hoặc +/- để chỉnh cỡ`}
        title="Kéo để di chuyển • Rê chuột để chỉnh kích cỡ"
        data-testid="chibi-fox-body"
      >
        <span className={styles.chibiShadow} aria-hidden="true" />
        <span
          className={styles.chibiLookLayer}
          style={{
            transform: `translate3d(${shiftX}px, ${shiftY}px, 0) rotateY(${tiltY}deg) rotateX(${tiltX}deg) rotateZ(${tiltZ}deg) scaleX(${flipX})`
          }}
        >
          <img
            src="/fox_poster.png"
            alt="Cáo Chibi LifeQuest"
            className={styles.chibiImg}
            draggable={false}
          />
        </span>
      </button>

      {/* Corner Drag-to-Resize Handle */}
      <button
        type="button"
        className={styles.resizeHandle}
        onPointerDown={handleResizeStart}
        aria-label="Kéo góc để thay đổi kích cỡ Cáo Chibi"
        title="Kéo để chỉnh kích cỡ"
        data-testid="chibi-fox-resize-handle"
      >
        <ArrowDownRight size={12} aria-hidden="true" />
      </button>
    </div>
  )
}
