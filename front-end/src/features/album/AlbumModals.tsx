import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Heart,
  Lock,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import {
  ClothCover,
  EvidenceChip,
  JournalIllustration,
  MomentChip,
  MountedPhoto,
  PrivacyPill,
  type ClothColor,
  type MediaVisibility,
  type SampleIllustrationKey,
} from '@/features/journal/JournalPrimitives'
import jStyles from '@/features/journal/journal.module.css'
import type { AlbumCoverStyle, AlbumRecord, PhotoRecord } from './albumStore'
import styles from './AlbumPage.module.css'

const CLOTH_COLORS: Array<{ id: ClothColor; label: string; hex: string }> = [
  { id: 'navy', label: 'Navy', hex: '#1C3A54' },
  { id: 'teal', label: 'Teal', hex: '#14594F' },
  { id: 'plum', label: 'Plum', hex: '#4A3A5C' },
  { id: 'sand', label: 'Sand', hex: '#8C7B66' },
  { id: 'rust', label: 'Rust', hex: '#8E4A30' },
]

const COVER_ART_OPTIONS: Array<{ id: SampleIllustrationKey; label: string }> = [
  { id: 'sunrise-run', label: 'Bình minh' },
  { id: 'mountain-summit', label: 'Đỉnh núi' },
  { id: 'study-desk', label: 'Góc học tập' },
  { id: 'book-shelf', label: 'Kệ sách' },
  { id: 'morning-coffee', label: 'Cà phê sáng' },
  { id: 'group-run', label: 'Chạy nhóm' },
]

const VISIBILITY_META: Record<MediaVisibility, { label: string; desc: string; audience: string }> = {
  PRIVATE: {
    label: 'Chỉ mình tôi',
    desc: 'Chỉ bạn thấy ảnh/album này',
    audience: 'chỉ mình bạn',
  },
  FRIENDS: {
    label: 'Bạn bè',
    desc: 'Bạn bè hiện tại trên LifeQuest có thể xem',
    audience: '18 bạn bè hiện tại',
  },
  GROUP: {
    label: 'Nhóm',
    desc: 'Thành viên trong nhóm chung có thể xem',
    audience: '4 thành viên trong nhóm',
  },
}

/* ============================================================================
 * 1. ConfirmVisibilityDialog (alertdialog — mandatory when widening privacy)
 * ============================================================================ */
export function ConfirmVisibilityDialog({
  open,
  fromVisibility,
  toVisibility,
  itemCount = 1,
  onConfirm,
  onCancel,
}: {
  open: boolean
  fromVisibility: MediaVisibility
  toVisibility: MediaVisibility
  itemCount?: number
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className={styles.modalBackdrop}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-vis-title"
      data-testid="confirm-visibility-dialog"
    >
      <div className={styles.modalCard} style={{ maxWidth: 440 }}>
        <div className={styles.modalHead}>
          <strong id="confirm-vis-title">Xác nhận mở rộng quyền xem?</strong>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Đóng hộp thoại xác nhận"
            style={{ background: 'transparent', border: 'none', color: '#FBF7EF', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <PrivacyPill visibility={fromVisibility} />
            <span style={{ fontWeight: 800 }}>→</span>
            <PrivacyPill visibility={toVisibility} />
          </div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>
            Thay đổi này sẽ cho phép <strong>{VISIBILITY_META[toVisibility].audience}</strong> xem{' '}
            {itemCount > 1 ? `${itemCount} ảnh này` : 'ảnh này'}.
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              padding: '8px 10px',
              borderRadius: 10,
              background: '#e6f6f2',
              color: '#0e695a',
              fontWeight: 600,
            }}
          >
            Lưu ý an toàn: Thao tác này <strong>KHÔNG</strong> tự động đăng ảnh lên bảng tin
            Moments.
          </p>
        </div>
        <div className={styles.modalFoot}>
          <button type="button" className={styles.modeBtn} onClick={onCancel}>
            Hủy
          </button>
          <button
            type="button"
            className={styles.ctaBtn}
            style={{ background: '#168C78' }}
            data-testid="confirm-visibility-accept"
            onClick={onConfirm}
          >
            Xác nhận mở quyền xem
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
 * 2. Create / Edit Album Modal (J-Create)
 * ============================================================================ */
export function AlbumFormModal({
  open,
  editingAlbum,
  onSave,
  onDelete,
  onClose,
}: {
  open: boolean
  editingAlbum: AlbumRecord | null
  onSave: (data: {
    title: string
    description: string
    coverColor: ClothColor
    coverStyle: AlbumCoverStyle
    visibility: MediaVisibility
    questTitle: string
    coverIllustration: SampleIllustrationKey
  }) => void
  onDelete?: (albumId: string) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverColor, setCoverColor] = useState<ClothColor>('navy')
  const [coverStyle, setCoverStyle] = useState<AlbumCoverStyle>('photo')
  const [coverIllustration, setCoverIllustration] = useState<SampleIllustrationKey>('sunrise-run')
  const [visibility, setVisibility] = useState<MediaVisibility>('FRIENDS')
  const [questTitle, setQuestTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle(editingAlbum?.title ?? '')
    setDescription(editingAlbum?.description ?? '')
    setCoverColor(editingAlbum?.coverColor ?? 'navy')
    setCoverStyle(editingAlbum?.coverStyle ?? 'photo')
    setCoverIllustration(editingAlbum?.coverIllustration ?? 'sunrise-run')
    setVisibility(editingAlbum?.visibility ?? 'FRIENDS')
    setQuestTitle(editingAlbum?.questTitle ?? '')
    setError(null)
  }, [open, editingAlbum])

  if (!open) return null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (title.trim().length < 2) {
      setError('Tên album cần ít nhất 2 ký tự.')
      return
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      coverColor,
      coverStyle,
      visibility,
      questTitle: questTitle.trim(),
      coverIllustration,
    })
  }

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="album-form-title"
      data-testid="album-form-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form className={styles.cleanModalCard} onSubmit={submit}>
        <div className={styles.cleanModalHead}>
          <span className={styles.cleanModalSpacer} aria-hidden="true" />
          <h2 id="album-form-title" className={styles.cleanModalTitle}>
            {editingAlbum ? 'Chỉnh sửa sổ Album' : 'Tạo album mới'}
          </h2>
          <button
            type="button"
            className={styles.cleanCloseBtn}
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className={`${styles.cleanModalBody} ${styles.createAlbumGrid}`}>
          {/* Left: Live Handcrafted Book Preview + Cover Pickers */}
          <div className={styles.createPreviewCol}>
            <div className={styles.createPreviewCard}>
              <ClothCover color={coverColor} bookmark className={styles.createBookPreview}>
                <div className={styles.createPreviewPolaroid}>
                  <span className={styles.coverTape} aria-hidden="true" />
                  <div className={styles.stdCoverImgWrap}>
                    <JournalIllustration kind={coverIllustration} alt="Xem trước bìa album" />
                  </div>
                </div>
                <div className={styles.createPreviewFoot}>
                  <div className={styles.coverProgressDots} aria-hidden="true">
                    <span className={`${styles.coverDot} ${styles.coverDotActive}`} />
                    <span className={styles.coverDot} />
                    <span className={styles.coverDot} />
                  </div>
                  <PrivacyPill visibility={visibility} />
                </div>
              </ClothCover>
              <div className={styles.createPreviewCaption}>
                <strong>{title.trim() || 'Tên sổ kỷ niệm'}</strong>
                <span>{description.trim() || 'Mô tả ngắn về hành trình này...'}</span>
              </div>
            </div>

            <div className={styles.createPickerGroup}>
              <div className={styles.filterGroupTitle}>Màu bìa vải</div>
              <div className={styles.createSwatchRow}>
                {CLOTH_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={`Bìa ${c.label}`}
                    aria-pressed={coverColor === c.id}
                    onClick={() => setCoverColor(c.id)}
                    className={`${styles.createColorDot} ${
                      coverColor === c.id ? styles.createColorDotActive : ''
                    }`.trim()}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>

            <div className={styles.createPickerGroup}>
              <div className={styles.filterGroupTitle}>Ảnh bìa mẫu</div>
              <div className={styles.createArtGrid}>
                {COVER_ART_OPTIONS.map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    aria-label={`Ảnh bìa ${art.label}`}
                    aria-pressed={coverIllustration === art.id}
                    onClick={() => setCoverIllustration(art.id)}
                    className={`${styles.createArtThumb} ${
                      coverIllustration === art.id ? styles.createArtThumbActive : ''
                    }`.trim()}
                  >
                    <JournalIllustration kind={art.id} alt={art.label} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Clean Compact Form Fields */}
          <div className={styles.createFieldsCol}>
            {error && (
              <div role="alert" className={styles.createErrorBox}>
                {error}
              </div>
            )}

            <label className={styles.createField}>
              <span>Tên album</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Chạy 10km đầu tiên"
                maxLength={80}
                className={styles.createInput}
                required
              />
            </label>

            <label className={styles.createField}>
              <span>Mô tả</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi vài dòng cho bìa sổ..."
                rows={2}
                className={styles.createTextarea}
              />
            </label>

            <label className={styles.createField}>
              <span>Liên kết Quest (không bắt buộc)</span>
              <input
                value={questTitle}
                onChange={(e) => setQuestTitle(e.target.value)}
                placeholder="VD: Chạy 10km đầu tiên"
                className={styles.createInput}
              />
            </label>

            <div className={styles.createField} role="radiogroup" aria-label="Quyền xem album">
              <span>Ai xem được album này</span>
              <div className={styles.visCardRow}>
                {(
                  [
                    { id: 'PRIVATE', label: 'Chỉ mình tôi', icon: Lock },
                    { id: 'FRIENDS', label: 'Bạn bè', icon: Users },
                    { id: 'GROUP', label: 'Nhóm', icon: Globe2 },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon
                  const active = visibility === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setVisibility(item.id)}
                      className={`${styles.visCardBtn} ${active ? styles.visCardBtnActive : ''}`.trim()}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className={styles.visHintText}>
                {VISIBILITY_META[visibility].desc}. Ảnh &ldquo;Chỉ mình tôi&rdquo; vẫn luôn ẩn với
                người khác.
              </p>
            </div>

            {editingAlbum && onDelete && !editingAlbum.isAutoEvidence && (
              <div className={styles.createDeleteBox}>
                <strong style={{ fontSize: 12.5, color: '#b42318' }}>Xóa album này</strong>
                <p style={{ margin: '4px 0 8px', fontSize: 11.5, color: '#5A6B7A' }}>
                  Xóa album sẽ KHÔNG xóa ảnh gốc trong Thư viện hay Moments đã chia sẻ.
                </p>
                <button
                  type="button"
                  onClick={() => onDelete(editingAlbum.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 10,
                    border: '1px solid #b42318',
                    background: '#fff',
                    color: '#b42318',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Xóa album
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFoot}>
          <button type="button" className={styles.modeBtn} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className={styles.ctaBtn} data-testid="album-form-submit">
            {editingAlbum ? 'Lưu thay đổi' : 'Tạo album'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ============================================================================
 * 3. Upload Photos Modal (J-Upload — PRIVATE by default, never auto-posts Moment)
 * ============================================================================ */
export function AlbumUploadModal({
  open,
  albums,
  onSaveUploads,
  onClose,
}: {
  open: boolean
  albums: AlbumRecord[]
  onSaveUploads: (items: Array<{
    title: string
    caption: string
    sourceType: 'EVIDENCE' | 'NORMAL'
    visibility: MediaVisibility
    albumIds: string[]
    sharedAsMoment: boolean
    taskTitle?: string | null
    localPreviewUrl?: string | null
  }>) => void
  onClose: () => void
}) {
  const [isEvidence, setIsEvidence] = useState(true)
  const [taskTitle, setTaskTitle] = useState('Chạy bộ 20 phút hôm nay')
  const [selectedAlbumId, setSelectedAlbumId] = useState('')
  const [postAction, setPostAction] = useState<'private' | 'album' | 'moment'>('private')
  const [files, setFiles] = useState<
    Array<{ id: string; name: string; size: string; status: 'done' | 'error'; previewUrl?: string }>
  >([
    { id: 'f-1', name: 'chay-bo-sang.jpg', size: '2.4 MB', status: 'done' },
    { id: 'f-err', name: 'chay-dem-4k.heic', size: '18.2 MB · Quá giới hạn 15 MB', status: 'error' },
  ])
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const validFiles = files.filter((f) => f.status === 'done')

  const handleFileChange = (list: FileList | null) => {
    if (!list || list.length === 0) return
    const next = Array.from(list).map((file, idx) => ({
      id: `local-${Date.now()}-${idx}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      status: (file.size > 15 * 1024 * 1024 ? 'error' : 'done') as 'done' | 'error',
      previewUrl: URL.createObjectURL(file),
    }))
    setFiles((prev) => [...next, ...prev])
  }

  const handleSave = () => {
    if (validFiles.length === 0) return
    onSaveUploads(
      validFiles.map((f) => ({
        title: f.name.replace(/\.[^.]+$/, ''),
        caption: isEvidence
          ? `Minh chứng cục bộ cho Task "${taskTitle}" (Chưa tải lên máy chủ).`
          : 'Ảnh thêm cục bộ ở chế độ xem trước.',
        sourceType: isEvidence ? 'EVIDENCE' : 'NORMAL',
        // Always PRIVATE by default!
        visibility: 'PRIVATE',
        albumIds: postAction === 'album' && selectedAlbumId ? [selectedAlbumId] : [],
        // Never auto-posts to Moment unless user explicitly chose separate share step
        sharedAsMoment: postAction === 'moment',
        taskTitle: isEvidence ? taskTitle : null,
        localPreviewUrl: f.previewUrl ?? null,
      })),
    )
    onClose()
  }

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      data-testid="album-upload-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.cleanModalCard}>
        <div className={styles.cleanModalHead}>
          <span className={styles.cleanModalSpacer} aria-hidden="true" />
          <h2 id="upload-modal-title" className={styles.cleanModalTitle}>
            Thêm ảnh vào Sổ kỷ niệm
          </h2>
          <button
            type="button"
            className={styles.cleanCloseBtn}
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className={`${styles.cleanModalBody} ${styles.uploadGrid}`}>
          {/* Left: Warm Dropzone & File Queue */}
          <div className={styles.uploadDropCol}>
            <div className={styles.uploadDropzone}>
              <span className={styles.uploadIconCircle} aria-hidden="true">
                <Upload size={20} color="#F26B3A" />
              </span>
              <strong>Kéo ảnh vào đây hoặc chọn từ máy</strong>
              <span>JPG, PNG, HEIC · Tối đa 15 MB/ảnh</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e.target.files)}
              />
              <button
                type="button"
                className={styles.modeBtn}
                style={{ marginTop: 6 }}
                onClick={() => fileInputRef.current?.click()}
              >
                Chọn ảnh từ thiết bị
              </button>
            </div>

            <div className={styles.uploadQueueList}>
              {files.map((f) => (
                <div
                  key={f.id}
                  className={`${styles.uploadFileRow} ${f.status === 'error' ? styles.uploadFileError : ''}`.trim()}
                >
                  <div className={styles.uploadFileMeta}>
                    <strong>{f.name}</strong>
                    <span className={f.status === 'error' ? styles.uploadErrText : styles.uploadOkText}>
                      {f.size} {f.status === 'done' ? '· Sẵn sàng' : ''}
                    </span>
                  </div>
                  <div className={styles.uploadFileActions}>
                    {f.status === 'error' && (
                      <button
                        type="button"
                        className={styles.uploadMiniBtn}
                        onClick={() =>
                          setFiles((prev) =>
                            prev.map((item) =>
                              item.id === f.id
                                ? { ...item, status: 'done', size: '3.1 MB (Đã nén)' }
                                : item,
                            ),
                          )
                        }
                      >
                        <RefreshCw size={11} /> Thử lại
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.uploadRemoveBtn}
                      aria-label={`Gỡ ${f.name}`}
                      onClick={() => setFiles((prev) => prev.filter((item) => item.id !== f.id))}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Context & Privacy Guarantees */}
          <div className={styles.createFieldsCol}>
            <div className={styles.uploadEvidenceBox}>
              <label className={styles.uploadEvidenceToggle}>
                <span>Ảnh minh chứng cho Task</span>
                <input
                  type="checkbox"
                  checked={isEvidence}
                  onChange={(e) => setIsEvidence(e.target.checked)}
                />
              </label>
              {isEvidence && (
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  aria-label="Nhiệm vụ liên kết"
                  className={styles.createInput}
                  placeholder="Tên nhiệm vụ liên kết..."
                />
              )}
            </div>

            <div className={styles.uploadPrivacyBox}>
              <div className={styles.uploadPrivacyTop}>
                <strong>Quyền xem mặc định</strong>
                <PrivacyPill visibility="PRIVATE" />
              </div>
              <p>
                Không tự động đăng lên Moments. Muốn chia sẻ cần chọn bước riêng bên dưới.
              </p>
            </div>

            <div className={styles.createField} role="radiogroup" aria-label="Hành động sau khi lưu">
              <span>Sau khi lưu</span>
              <div className={styles.visCardRow}>
                {(
                  [
                    { id: 'private', label: 'Giữ riêng tư', icon: Lock },
                    { id: 'album', label: 'Thêm vào album', icon: BookOpen },
                    { id: 'moment', label: 'Chia sẻ Moment', icon: Sparkles },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon
                  const active = postAction === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPostAction(item.id)}
                      className={`${styles.visCardBtn} ${active ? styles.visCardBtnActive : ''}`.trim()}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>

              {postAction === 'album' && (
                <select
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                  className={styles.createInput}
                  style={{ marginTop: 4 }}
                >
                  <option value="">Chọn album đích...</option>
                  {albums
                    .filter((a) => !a.isAutoEvidence)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({VISIBILITY_META[a.visibility].label})
                      </option>
                    ))}
                </select>
              )}

              <p className={styles.visHintText}>
                {postAction === 'private'
                  ? 'Chỉ lưu an toàn trong Thư viện cá nhân.'
                  : postAction === 'album'
                    ? 'Gắn trực tiếp vào cuốn sổ đã chọn sau khi lưu.'
                    : 'Mở bước xác nhận quyền xem riêng khi đăng Moment.'}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.modalFoot} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className={styles.uploadBackendHint}>
            <AlertTriangle size={12} aria-hidden="true" /> Cần backend: dịch vụ tải ảnh (xem trước cục bộ)
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={styles.modeBtn} onClick={onClose}>
              Hủy
            </button>
            <button
              type="button"
              className={styles.ctaBtn}
              disabled={validFiles.length === 0}
              data-testid="upload-save-btn"
              onClick={handleSave}
            >
              Lưu {validFiles.length} ảnh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
 * 4. Add To Album Modal (J-AddTo — warns when album is wider than photo)
 * ============================================================================ */
export function AddToAlbumModal({
  open,
  photoCount,
  hasPrivatePhoto,
  albums,
  onAdd,
  onClose,
}: {
  open: boolean
  photoCount: number
  hasPrivatePhoto: boolean
  albums: AlbumRecord[]
  onAdd: (albumId: string) => void
  onClose: () => void
}) {
  const [targetId, setTargetId] = useState('')

  useEffect(() => {
    if (open) setTargetId(albums.find((a) => !a.isAutoEvidence)?.id ?? '')
  }, [open, albums])

  if (!open) return null

  const chosen = albums.find((a) => a.id === targetId)

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="add-to-alb-title" data-testid="add-to-album-modal">
      <div className={styles.modalCard} style={{ maxWidth: 460 }}>
        <div className={styles.modalHead}>
          <strong id="add-to-alb-title">Thêm {photoCount} ảnh vào album</strong>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{ background: 'transparent', border: 'none', color: '#FBF7EF', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {albums
              .filter((a) => !a.isAutoEvidence)
              .map((alb) => (
                <label
                  key={alb.id}
                  className={`${styles.radioOption} ${targetId === alb.id ? styles.radioOptionActive : ''}`.trim()}
                >
                  <input
                    type="radio"
                    name="target-album"
                    checked={targetId === alb.id}
                    onChange={() => setTargetId(alb.id)}
                  />
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 13 }}>{alb.title}</strong>
                    <div style={{ marginTop: 3 }}>
                      <PrivacyPill visibility={alb.visibility} />
                    </div>
                  </div>
                </label>
              ))}
          </div>

          {hasPrivatePhoto && chosen && chosen.visibility !== 'PRIVATE' && (
            <div
              style={{
                padding: 10,
                borderRadius: 12,
                background: '#fff4e5',
                color: '#8f4a07',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                gap: 8,
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
              <span>
                Ảnh &ldquo;Chỉ mình tôi&rdquo; vẫn sẽ giữ nguyên chế độ riêng tư và KHÔNG tự động
                hiển thị cho người khác trong album &ldquo;{chosen.title}&rdquo;.
              </span>
            </div>
          )}
        </div>
        <div className={styles.modalFoot}>
          <button type="button" className={styles.modeBtn} onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className={styles.ctaBtn}
            disabled={!targetId}
            onClick={() => {
              if (targetId) onAdd(targetId)
              onClose()
            }}
          >
            Thêm vào album
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
 * 5. Photo Detail Lightbox (J-Detail — role="dialog", keyboard Nav + Esc)
 * ============================================================================ */
export function PhotoDetailModal({
  photo,
  photos,
  albums,
  onSelectPhoto,
  onRequestVisibilityChange,
  onToggleCheer,
  onDeletePhoto,
  onClose,
}: {
  photo: PhotoRecord | null
  photos: PhotoRecord[]
  albums: AlbumRecord[]
  onSelectPhoto: (photoId: string) => void
  onRequestVisibilityChange: (photo: PhotoRecord, next: MediaVisibility) => void
  onToggleCheer: (photoId: string) => void
  onDeletePhoto: (photoId: string) => void
  onClose: () => void
}) {
  const currentIdx = photo ? photos.findIndex((p) => p.id === photo.id) : -1

  useEffect(() => {
    if (!photo) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIdx > 0) onSelectPhoto(photos[currentIdx - 1].id)
      if (e.key === 'ArrowRight' && currentIdx >= 0 && currentIdx < photos.length - 1) {
        onSelectPhoto(photos[currentIdx + 1].id)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [photo, currentIdx, photos, onClose, onSelectPhoto])

  if (!photo) return null

  const linkedAlbums = albums.filter((a) => photo.albumIds.includes(a.id))

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-detail-title"
      data-testid="photo-detail-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.modalCard} style={{ maxWidth: 880 }}>
        <div className={styles.modalHead}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <strong id="photo-detail-title">{photo.title}</strong>
            <span style={{ fontSize: 12, opacity: 0.8 }}>{photo.dateLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className={styles.modeBtn}
              style={{ minHeight: 32, padding: '4px 8px' }}
              disabled={currentIdx <= 0}
              onClick={() => currentIdx > 0 && onSelectPhoto(photos[currentIdx - 1].id)}
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className={styles.modeBtn}
              style={{ minHeight: 32, padding: '4px 8px' }}
              disabled={currentIdx < 0 || currentIdx >= photos.length - 1}
              onClick={() =>
                currentIdx < photos.length - 1 && onSelectPhoto(photos[currentIdx + 1].id)
              }
              aria-label="Ảnh sau"
            >
              <ChevronRight size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng chi tiết ảnh"
              style={{ background: 'transparent', border: 'none', color: '#FBF7EF', cursor: 'pointer', marginLeft: 4 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={`${styles.modalBody} ${styles.modalTwoCol}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <MountedPhoto
              illustrationKey={photo.illustrationKey}
              imageUrl={photo.localPreviewUrl}
              alt={photo.title}
              visibility={photo.visibility}
              isDeletedSource={photo.isDeletedSource}
            />
            {photo.handNote && <div className={jStyles.handNote}>&ldquo;{photo.handNote}&rdquo;</div>}
            <p style={{ margin: 0, fontSize: 13, color: '#274258' }}>{photo.caption}</p>

            {/* Thumbnail Strip */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {photos.slice(0, 6).map((thumb) => (
                <button
                  key={thumb.id}
                  type="button"
                  onClick={() => onSelectPhoto(thumb.id)}
                  aria-label={`Xem ${thumb.title}`}
                  style={{
                    width: 54,
                    height: 40,
                    padding: 0,
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: thumb.id === photo.id ? '2px solid #F26B3A' : '1px solid rgba(22,50,74,0.2)',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                >
                  <MountedPhoto
                    illustrationKey={thumb.illustrationKey}
                    imageUrl={thumb.localPreviewUrl}
                    alt=""
                    corners={false}
                  />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {photo.sourceType === 'EVIDENCE' && <EvidenceChip />}
              {photo.sharedAsMoment && <MomentChip />}
            </div>

            {photo.questTitle && (
              <div style={{ fontSize: 12.5 }}>
                <strong>Quest liên kết:</strong>{' '}
                <Link to="/work/quests" style={{ color: '#B84317', fontWeight: 700 }}>
                  {photo.questTitle}
                </Link>
              </div>
            )}
            {photo.taskTitle && (
              <div style={{ fontSize: 12.5 }}>
                <strong>Task minh chứng:</strong> {photo.taskTitle}
              </div>
            )}
            {linkedAlbums.length > 0 && (
              <div style={{ fontSize: 12.5, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <strong>Trong album:</strong>
                {linkedAlbums.map((a) => (
                  <span
                    key={a.id}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: '#ede6d8',
                      fontSize: 11.5,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <BookOpen size={11} /> {a.title}
                  </span>
                ))}
              </div>
            )}

            {/* Visibility Radiogroup (Widening -> ConfirmDialog, Narrowing -> Immediate + 5s Undo) */}
            <div role="radiogroup" aria-label="Quyền xem của ảnh">
              <div className={styles.filterGroupTitle}>Quyền xem của ảnh</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(
                  [
                    { id: 'PRIVATE', icon: Lock },
                    { id: 'FRIENDS', icon: Users },
                    { id: 'GROUP', icon: Globe2 },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon
                  return (
                    <label
                      key={item.id}
                      className={`${styles.radioOption} ${photo.visibility === item.id ? styles.radioOptionActive : ''}`.trim()}
                      data-testid={`photo-vis-${item.id}`}
                    >
                      <input
                        type="radio"
                        name="photo-detail-visibility"
                        checked={photo.visibility === item.id}
                        onChange={() => {
                          if (photo.visibility !== item.id) {
                            onRequestVisibilityChange(photo, item.id)
                          }
                        }}
                      />
                      <Icon size={15} style={{ marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
                      <div>
                        <strong style={{ fontSize: 12.5 }}>{VISIBILITY_META[item.id].label}</strong>
                        <div style={{ fontSize: 11, color: '#5A6B7A' }}>
                          {VISIBILITY_META[item.id].desc}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {photo.sharedAsMoment && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  background: '#fff1eb',
                  border: '1px solid rgba(242,107,58,0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: '#B84317' }}>
                  <Sparkles size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Đã chia sẻ thành Moment
                </span>
                <button
                  type="button"
                  className={styles.modeBtn}
                  style={{ minHeight: 32, padding: '4px 10px', fontSize: 12 }}
                  onClick={() => onToggleCheer(photo.id)}
                >
                  <Heart
                    size={13}
                    fill={photo.cheeredByMe ? '#F26B3A' : 'none'}
                    color={photo.cheeredByMe ? '#F26B3A' : '#16324A'}
                  />
                  Cổ vũ ({photo.cheerCount})
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onDeletePhoto(photo.id)
                onClose()
              }}
              style={{
                marginTop: 'auto',
                alignSelf: 'flex-start',
                padding: '7px 12px',
                borderRadius: 10,
                border: '1px solid rgba(180,35,24,0.3)',
                background: '#fff',
                color: '#b42318',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              Xóa ảnh này
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
