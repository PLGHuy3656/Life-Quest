import { useState, type MouseEvent } from 'react'
import { RefreshCw, X } from 'lucide-react'
import {
  classifyAspectRatio,
  type ImageOrientation,
  type SocialMediaItem
} from './mediaValidation'
import styles from './SocialImagePreview.module.css'

export interface SocialImagePreviewProps {
  item: SocialMediaItem
  isSingle?: boolean
  overflowCount?: number
  editable?: boolean
  onOpen: (triggerEl: HTMLButtonElement | null) => void
  onRemove?: () => void
  onReplace?: () => void
}

/**
 * Reusable single media tile with intrinsic aspect-ratio preservation (zero
 * stretching/distortion), keyboard accessibility, optional +N overflow badge,
 * and optional Remove/Replace controls in composer edit mode.
 */
export function SocialImagePreview({
  item,
  isSingle = false,
  overflowCount = 0,
  editable = false,
  onOpen,
  onRemove,
  onReplace
}: SocialImagePreviewProps) {
  const [measuredRatio, setMeasuredRatio] = useState<number | undefined>(item.aspectRatio)

  const ratio = measuredRatio ?? item.aspectRatio
  const orientation: ImageOrientation = ratio
    ? classifyAspectRatio(ratio, 1)
    : 'landscape'

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setMeasuredRatio(img.naturalWidth / img.naturalHeight)
    }
  }

  const handleActionClick = (e: MouseEvent, cb?: () => void) => {
    e.stopPropagation()
    cb?.()
  }

  const singleClass = isSingle
    ? orientation === 'portrait'
      ? styles.singlePortrait
      : orientation === 'square'
        ? styles.singleSquare
        : styles.singleLandscape
    : styles.gridTile

  return (
    <div
      className={`${styles.wrap} ${singleClass}`.trim()}
      data-testid="social-image-preview"
      data-orientation={orientation}
      data-single={isSingle ? '1' : '0'}
    >
      <button
        type="button"
        className={styles.openBtn}
        onClick={(e) => onOpen(e.currentTarget)}
        aria-label={
          overflowCount > 0
            ? `Xem thêm ${overflowCount} ảnh: ${item.alt}`
            : `Xem ảnh kích thước đầy đủ: ${item.alt}`
        }
      >
        <img
          src={item.src}
          alt={item.alt}
          className={isSingle && orientation === 'portrait' ? styles.imgContain : styles.imgCover}
          onLoad={handleImgLoad}
        />

        {overflowCount > 0 && (
          <span className={styles.overflowOverlay} data-testid="social-media-overflow-badge">
            +{overflowCount}
          </span>
        )}
      </button>

      {item.isPreviewFixture && (
        <span className={styles.previewWatermark}>Ảnh minh họa • Preview</span>
      )}

      {editable && (
        <div className={styles.editActions}>
          {onReplace && (
            <button
              type="button"
              className={styles.editBtn}
              onClick={(e) => handleActionClick(e, onReplace)}
              aria-label={`Thay ảnh ${item.fileName ?? item.alt}`}
              title="Thay ảnh này"
            >
              <RefreshCw size={13} aria-hidden="true" />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              className={`${styles.editBtn} ${styles.removeBtn}`.trim()}
              onClick={(e) => handleActionClick(e, onRemove)}
              aria-label={`Xóa ảnh ${item.fileName ?? item.alt}`}
              title="Xóa ảnh này"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
