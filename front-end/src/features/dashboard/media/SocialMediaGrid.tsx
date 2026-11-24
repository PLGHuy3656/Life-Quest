import { useEffect, useRef, useState } from 'react'
import { foxDialogueBus } from '@/features/mascot/dialogue/dialogueBus'
import { SocialImagePreview } from './SocialImagePreview'
import { SocialMediaLightbox } from './SocialMediaLightbox'
import type { SocialMediaItem } from './mediaValidation'
import styles from './SocialMediaGrid.module.css'

export interface SocialMediaGridProps {
  items: SocialMediaItem[]
  editable?: boolean
  suppressSocialDialogue?: boolean
  onRemoveItem?: (id: string) => void
  onReplaceItem?: (id: string) => void
}

/**
 * Adaptive photo layout grid (1, 2, 3, or 4+ with +N overflow overlay)
 * paired with an accessible full-resolution lightbox and focus return.
 */
export function SocialMediaGrid({
  items,
  editable = false,
  suppressSocialDialogue = false,
  onRemoveItem,
  onReplaceItem
}: SocialMediaGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const returnFocusRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    return () => {
      foxDialogueBus.setPauseReason({ lightboxOpen: false })
    }
  }, [])

  if (items.length === 0) return null

  const visibleItems = items.slice(0, 4)
  const extraCount = Math.max(0, items.length - 4)

  const layoutKind =
    items.length === 1
      ? 'single'
      : items.length === 2
        ? 'two'
        : items.length === 3
          ? 'three'
          : 'fourPlus'

  const handleOpen = (index: number, triggerEl: HTMLButtonElement | null) => {
    returnFocusRef.current = triggerEl
    setLightboxIndex(index)
    foxDialogueBus.setPauseReason({ lightboxOpen: true })
    if (!suppressSocialDialogue) {
      foxDialogueBus.emit({ event: 'SOCIAL_MEDIA_VIEWED' })
    }
  }

  const handleClose = () => {
    setLightboxIndex(null)
    foxDialogueBus.setPauseReason({ lightboxOpen: false })
    // Restore keyboard focus cleanly to the triggering tile
    queueMicrotask(() => {
      returnFocusRef.current?.focus()
    })
  }

  return (
    <>
      <div
        className={`${styles.grid} ${styles[layoutKind]}`.trim()}
        data-testid="social-media-grid"
        data-layout={layoutKind}
        data-count={items.length}
      >
        {visibleItems.map((item, idx) => (
          <div
            key={item.id}
            className={
              layoutKind === 'three' && idx === 0 ? styles.threeHeroSlot : styles.slot
            }
          >
            <SocialImagePreview
              item={item}
              isSingle={items.length === 1}
              overflowCount={idx === 3 ? extraCount : 0}
              editable={editable}
              onOpen={(el) => handleOpen(idx, el)}
              onRemove={onRemoveItem ? () => onRemoveItem(item.id) : undefined}
              onReplace={onReplaceItem ? () => onReplaceItem(item.id) : undefined}
            />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <SocialMediaLightbox
          items={items}
          activeIndex={lightboxIndex}
          onSelectIndex={setLightboxIndex}
          onClose={handleClose}
        />
      )}
    </>
  )
}
