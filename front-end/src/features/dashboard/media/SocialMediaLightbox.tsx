import { useEffect, useRef } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { SocialMediaItem } from './mediaValidation'
import styles from './SocialMediaLightbox.module.css'

export interface LightboxMediaItem extends SocialMediaItem {
  sourceTitle?: string
  sourceRoute?: string
  author?: string
  capturedAt?: string
  isDemo?: boolean
}

export interface SocialMediaLightboxProps {
  items: LightboxMediaItem[]
  activeIndex: number
  onSelectIndex: (nextIndex: number) => void
  onClose: () => void
  onNavigate?: (route: string) => void
}

/**
 * Accessible full-resolution lightbox with Escape dismissal, Left/Right keyboard
 * navigation, focus restoration, optional source detail link, and reduced-motion support.
 */
export function SocialMediaLightbox({
  items,
  activeIndex,
  onSelectIndex,
  onClose,
  onNavigate
}: SocialMediaLightboxProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const total = items.length
  const current = items[activeIndex] ?? items[0]

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null
    closeBtnRef.current?.focus()
    return () => {
      previousFocusRef.current?.focus?.()
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowRight' && total > 1) {
        e.preventDefault()
        onSelectIndex((activeIndex + 1) % total)
      } else if (e.key === 'ArrowLeft' && total > 1) {
        e.preventDefault()
        onSelectIndex((activeIndex - 1 + total) % total)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, total, onSelectIndex, onClose])

  if (!current) return null

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh kích thước đầy đủ"
      data-testid="social-media-lightbox"
      onClick={onClose}
    >
      <div className={styles.stage} onClick={(e) => e.stopPropagation()}>
        <div className={styles.topBar}>
          <span className={styles.counter}>
            {activeIndex + 1} / {total}
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng xem ảnh"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.imgFrame}>
          {total > 1 && (
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={() => onSelectIndex((activeIndex - 1 + total) % total)}
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
          )}

          <img src={current.src} alt={current.alt} className={styles.fullImg} />

          {total > 1 && (
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navNext}`}
              onClick={() => onSelectIndex((activeIndex + 1) % total)}
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <p className={styles.caption}>{current.alt}</p>
          {(current.sourceTitle || current.capturedAt || current.author || current.isDemo) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 10,
                fontSize: 12,
                color: 'rgba(255,255,255,0.82)'
              }}
            >
              {current.isDemo && (
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: 999,
                    background: 'rgba(246,200,95,0.22)',
                    color: '#fde68a',
                    fontWeight: 700,
                    fontSize: 11
                  }}
                >
                  Ảnh mẫu (Chờ Media API)
                </span>
              )}
              {current.capturedAt && <span>{current.capturedAt}</span>}
              {current.author && <span>· {current.author}</span>}
              {current.sourceTitle && current.sourceRoute && onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onNavigate(current.sourceRoute!)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    border: '1px solid rgba(255,255,255,0.32)',
                    background: 'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    borderRadius: 999,
                    padding: '3px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  data-testid="lightbox-open-source"
                >
                  <span>{current.sourceTitle}</span>
                  <ArrowUpRight size={13} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
