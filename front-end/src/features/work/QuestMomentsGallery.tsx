import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Camera, ImagePlus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  ALLOWED_IMAGE_ACCEPT,
  validateImageFiles,
  type SocialMediaItem
} from '@/features/dashboard/media/mediaValidation'
import { SocialMediaLightbox } from '@/features/dashboard/media/SocialMediaLightbox'
import styles from './QuestJourney.module.css'

export interface QuestMomentItem {
  id: string
  src: string
  alt: string
  caption: string
  authorName: string
  relatedLabel: string
  isObjectUrl: boolean
}

export interface QuestMomentsGalleryProps {
  questTitle: string
  authorName: string
  relatedLabels?: string[]
}

/**
 * FE-04C.2 QuestMomentsGallery — Visual memory & photo moments section for a Quest.
 * - Reuses shared mediaValidation & SocialMediaLightbox without Social Feed coupling.
 * - Revokes all URL.createObjectURL handles on remove, clear, and unmount.
 * - Strictly honest: clearly labeled LOCAL PREVIEW • PENDING MEDIA API, never uploads or posts.
 */
export function QuestMomentsGallery({
  questTitle,
  authorName,
  relatedLabels = []
}: QuestMomentsGalleryProps) {
  const [moments, setMoments] = useState<QuestMomentItem[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [draftCaption, setDraftCaption] = useState('')
  const [selectedRelated, setSelectedRelated] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const momentsRef = useRef<QuestMomentItem[]>([])

  momentsRef.current = moments

  const safeRevoke = (src: string) => {
    if (typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(src)
    }
  }

  useEffect(() => {
    return () => {
      for (const item of momentsRef.current) {
        if (item.isObjectUrl) safeRevoke(item.src)
      }
    }
  }, [])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const result = validateImageFiles(files, moments.length)
    setErrors(result.errors)
    if (result.valid.length === 0) return

    const created: QuestMomentItem[] = result.valid.map((file, idx) => ({
      id: `moment-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      src: URL.createObjectURL(file),
      alt: `Khoảnh khắc hành trình ${questTitle}: ${file.name}`,
      caption: draftCaption.trim() || `Khoảnh khắc cục bộ — ${file.name}`,
      authorName,
      relatedLabel: selectedRelated || questTitle,
      isObjectUrl: true
    }))

    setMoments((prev) => [...prev, ...created])
    setDraftCaption('')
  }

  const handleRemove = (id: string) => {
    setMoments((prev) => {
      const target = prev.find((m) => m.id === id)
      if (target?.isObjectUrl) safeRevoke(target.src)
      return prev.filter((m) => m.id !== id)
    })
  }

  const handleClearAll = () => {
    for (const item of moments) {
      if (item.isObjectUrl) safeRevoke(item.src)
    }
    setMoments([])
    setErrors([])
    setLightboxIndex(null)
  }

  const lightboxItems: SocialMediaItem[] = moments.map((m) => ({
    id: m.id,
    src: m.src,
    alt: m.caption || m.alt,
    isObjectUrl: m.isObjectUrl
  }))

  return (
    <section
      className={styles.momentsCard}
      aria-label="Khoảnh khắc hành trình"
      data-testid="quest-moments-gallery"
    >
      <div className={styles.momentsHeader}>
        <div className={styles.mapHeadingRow}>
          <Camera size={16} className={styles.tealIcon} aria-hidden="true" />
          <h2 className={styles.panelHeading}>Khoảnh khắc hành trình</h2>
          <span className={styles.previewBadge}>
            {moments.length > 0 ? 'XEM TRƯỚC CỤC BỘ • CHƯA TẢI LÊN' : 'MEDIA API: PENDING'}
          </span>
        </div>

        <div className={styles.momentsHeaderActions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
                fileInputRef.current.click()
              }
            }}
            data-testid="moments-add-btn"
          >
            <ImagePlus size={14} aria-hidden="true" /> Chọn ảnh
          </Button>
          {moments.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              aria-label="Xóa toàn bộ khoảnh khắc xem trước"
            >
              <Trash2 size={13} aria-hidden="true" /> Xóa tất cả
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_ACCEPT}
        multiple
        className="sr-only"
        aria-label="Chọn ảnh khoảnh khắc hành trình cục bộ"
        data-testid="moments-file-input"
        onChange={handleFileChange}
      />

      {/* Optional caption & checkpoint tag before picking */}
      <div className={styles.momentsComposerRow}>
        <input
          type="text"
          className={styles.momentsInput}
          placeholder="Ghi chú ngắn cho khoảnh khắc (tùy chọn)..."
          value={draftCaption}
          onChange={(e) => setDraftCaption(e.target.value)}
          maxLength={140}
          aria-label="Chú thích ảnh khoảnh khắc"
        />
        {relatedLabels.length > 0 && (
          <select
            className={styles.momentsSelect}
            value={selectedRelated}
            onChange={(e) => setSelectedRelated(e.target.value)}
            aria-label="Gắn với chặng hoặc nhiệm vụ"
          >
            <option value="">Gắn chung hành trình</option>
            {relatedLabels.map((lbl) => (
              <option key={lbl} value={lbl}>
                {lbl}
              </option>
            ))}
          </select>
        )}
      </div>

      {errors.length > 0 && (
        <div className={styles.momentsError} role="alert">
          {errors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </div>
      )}

      {moments.length === 0 ? (
        <div className={styles.momentsEmpty} data-testid="moments-empty">
          <p className={styles.mutedSub} style={{ margin: 0 }}>
            Chưa có ảnh kỷ niệm nào trong hành trình này. Chọn ảnh từ thiết bị để xem trước thư viện
            khoảnh khắc cục bộ (chưa tải lên máy chủ và không tự động đăng lên bảng tin Social).
          </p>
        </div>
      ) : (
        <div className={styles.momentsGrid} data-testid="moments-grid">
          {moments.map((item, idx) => (
            <figure key={item.id} className={styles.momentTile}>
              <div className={styles.momentThumbWrap}>
                <button
                  type="button"
                  className={styles.momentThumbBtn}
                  onClick={() => setLightboxIndex(idx)}
                  aria-label={`Phóng to ảnh: ${item.caption}`}
                >
                  <img src={item.src} alt={item.alt} className={styles.momentImg} />
                </button>
                <button
                  type="button"
                  className={styles.momentRemoveBtn}
                  onClick={() => handleRemove(item.id)}
                  aria-label={`Xóa ảnh ${item.caption}`}
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
              <figcaption className={styles.momentCaptionBox}>
                <strong className={styles.momentCaptionText}>{item.caption}</strong>
                <span className={styles.momentMeta}>
                  {item.authorName} · {item.relatedLabel}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {lightboxIndex !== null && lightboxItems.length > 0 && (
        <SocialMediaLightbox
          items={lightboxItems}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onSelectIndex={setLightboxIndex}
        />
      )}
    </section>
  )
}
