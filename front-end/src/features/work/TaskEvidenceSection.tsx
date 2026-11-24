import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Camera, ImagePlus, Share2, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  ALLOWED_IMAGE_ACCEPT,
  validateImageFiles,
  type SocialMediaItem
} from '@/features/dashboard/media/mediaValidation'
import { SocialMediaGrid } from '@/features/dashboard/media/SocialMediaGrid'
import { foxDialogueBus } from '@/features/mascot/dialogue/dialogueBus'
import type { ProofRequirement } from '@/types/domain'
import { getProofLabel } from './taskUtils'
import styles from './WorkPage.module.css'

export interface TaskEvidenceSectionProps {
  proofRequirement: ProofRequirement
}

/**
 * FE-04B.1 Adaptive Local Evidence Preview Section.
 * - Reuses SocialMediaGrid / SocialImagePreview / SocialMediaLightbox & mediaValidation
 *   without coupling Task Detail to Social Feed publishing.
 * - Revokes all URL.createObjectURL() handles on remove, replace, and unmount.
 * - Clearly labels LOCAL PREVIEW vs PENDING BACKEND Upload API.
 */
export function TaskEvidenceSection({ proofRequirement }: TaskEvidenceSectionProps) {
  const [items, setItems] = useState<SocialMediaItem[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [replacingId, setReplacingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const itemsRef = useRef<SocialMediaItem[]>([])

  itemsRef.current = items

  const safeRevokeObjectUrl = (src: string) => {
    if (typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(src)
    }
  }

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        if (item.isObjectUrl) safeRevokeObjectUrl(item.src)
      }
    }
  }, [])

  const triggerPicker = (replaceId: string | null = null) => {
    setReplacingId(replaceId)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const baseCount = replacingId ? Math.max(0, items.length - 1) : items.length
    const result = validateImageFiles(files, baseCount)
    setErrors(result.errors)

    if (result.valid.length === 0) {
      setReplacingId(null)
      return
    }

    const created: SocialMediaItem[] = result.valid.map((file, idx) => ({
      id: `evidence-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      src: URL.createObjectURL(file),
      alt: `Ảnh minh chứng cục bộ: ${file.name}`,
      isObjectUrl: true,
      fileName: file.name,
      fileSize: file.size
    }))

    if (replacingId) {
      const replacement = created[0]
      for (let i = 1; i < created.length; i += 1) {
        safeRevokeObjectUrl(created[i].src)
      }
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== replacingId) return item
          if (item.isObjectUrl) safeRevokeObjectUrl(item.src)
          return replacement
        })
      )
      setReplacingId(null)
    } else {
      setItems((prev) => [...prev, ...created])
    }

    foxDialogueBus.emit({ event: 'EVIDENCE_SELECTED' })
  }

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target?.isObjectUrl) safeRevokeObjectUrl(target.src)
      return prev.filter((i) => i.id !== id)
    })
  }

  const handleClearAll = () => {
    for (const item of items) {
      if (item.isObjectUrl) safeRevokeObjectUrl(item.src)
    }
    setItems([])
    setErrors([])
    setActionNotice(null)
  }

  const handleSubmitEvidence = () => {
    setActionNotice(
      `Đã chuẩn bị ${items.length} ảnh minh chứng cục bộ. Tính năng nộp ảnh lên máy chủ đang chờ Backend Media Upload API — chưa có dữ liệu nào được tải lên.`
    )
  }

  const handleShareSocial = () => {
    setActionNotice(
      `Đã chuẩn bị ${items.length} ảnh để chia sẻ. Tính năng đăng minh chứng lên Social Feed đang chờ Backend Social Publish API — bài đăng chưa được gửi.`
    )
  }

  return (
    <section
      className={styles.evidenceSection}
      aria-label="Ảnh minh chứng"
      data-testid="task-evidence-boundary"
    >
      <div className={styles.evidenceHeader}>
        <div className={styles.evidenceTitleGroup}>
          <Camera size={15} className={styles.focusIcon} aria-hidden="true" />
          <h2 className={styles.sectionHeading}>Ảnh minh chứng</h2>
          <span className={styles.quietBadge}>{getProofLabel(proofRequirement)}</span>
        </div>

        <div className={styles.btnGroup}>
          <span className={styles.pendingPill}>
            {items.length > 0 ? 'XEM TRƯỚC CỤC BỘ • CHƯA TẢI LÊN' : 'UPLOAD: PENDING API'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => triggerPicker(null)}
            data-testid="evidence-select-btn"
          >
            <ImagePlus size={14} aria-hidden="true" /> Chọn ảnh
          </Button>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              aria-label="Xóa toàn bộ ảnh minh chứng cục bộ"
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
        multiple={!replacingId}
        className="sr-only"
        aria-label="Chọn ảnh minh chứng cục bộ"
        data-testid="evidence-file-input"
        onChange={handleFileChange}
      />

      {errors.length > 0 && (
        <div className={styles.errorBox} role="alert">
          {errors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <div className={styles.evidencePreviewWrap} data-testid="evidence-preview-grid">
          <SocialMediaGrid
            items={items}
            editable
            suppressSocialDialogue
            onRemoveItem={handleRemove}
            onReplaceItem={(id) => triggerPicker(id)}
          />
          <div className={styles.evidenceActionBar} data-testid="evidence-action-bar">
            <Button
              variant="accent"
              size="sm"
              onClick={handleSubmitEvidence}
              data-testid="evidence-submit-btn"
            >
              <Upload size={14} aria-hidden="true" /> Nộp minh chứng
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleShareSocial}
              data-testid="evidence-share-social-btn"
            >
              <Share2 size={14} aria-hidden="true" /> Đăng lên Social
            </Button>
          </div>

          {actionNotice && (
            <div className={styles.evidenceActionNotice} role="status" data-testid="evidence-action-notice">
              {actionNotice}
            </div>
          )}

          <p className={styles.evidenceNote}>
            Ảnh đang hiển thị ở chế độ <strong>xem trước cục bộ (chưa tải lên máy chủ)</strong> và
            chưa tự động đăng lên bảng tin Social cho đến khi Backend hoàn tất Media Upload &amp;
            Social Publish API.
          </p>
        </div>
      ) : (
        <p className={styles.evidenceNote}>
          {proofRequirement === 'NONE'
            ? 'Nhiệm vụ này không yêu cầu minh chứng. Bạn vẫn có thể chọn ảnh cục bộ để xem trước bố cục (chưa tải lên máy chủ).'
            : 'Chọn ảnh từ thiết bị để xem trước cục bộ (JPG, PNG, WebP, GIF, AVIF ≤ 8 MB). Lưu trữ lên máy chủ đang chờ Backend Media Upload API.'}
        </p>
      )}
    </section>
  )
}
