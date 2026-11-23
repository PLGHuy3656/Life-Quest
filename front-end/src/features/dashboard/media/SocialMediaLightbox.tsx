import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { SocialMediaItem } from './mediaValidation'
import styles from './SocialMediaLightbox.module.css'

export interface SocialMediaLightboxProps {
  items: SocialMediaItem[]
  activeIndex: number
  onSelectIndex: (nextIndex: number) => void
  onClose: () => void
}

/**
 * Accessible full-resolution lightbox with Escape dismissal, Left/Right keyboard
 * navigation, backdrop click close, and reduced-motion support.
 */
export function SocialMediaLightbox({
  items,
  activeIndex,
  onSelectIndex,
  onClose
}: SocialMediaLightboxProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const total = items.length
  const current = items[activeIndex] ?? items[0]

  useEffect(() => {
    closeBtnRef.current?.focus()
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

        <p className={styles.caption}>{current.alt}</p>
      </div>
    </div>
  )
}
