import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Flag,
  FolderPlus,
  Grid,
  PawPrint,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  ClothCover,
  EvidenceChip,
  FoxStage,
  JournalIllustration,
  MomentChip,
  MountedPhoto,
  PrivacyPill,
  type MediaVisibility,
} from '@/features/journal/JournalPrimitives'
import { useMockProfileStore } from '@/stores/mockProfileStore'
import jStyles from '@/features/journal/journal.module.css'
import {
  AddToAlbumModal,
  AlbumFormModal,
  AlbumUploadModal,
  ConfirmVisibilityDialog,
  PhotoDetailModal,
} from './AlbumModals'
import { OpenBookView } from './OpenBookView'
import {
  isWideningVisibility,
  useAlbumStore,
  type AlbumRecord,
  type PhotoRecord,
  type PhotoSourceType,
} from './albumStore'
import styles from './AlbumPage.module.css'

type AlbumMode = 'overview' | 'gallery' | 'timeline' | 'book'
type PreviewState = 'normal' | 'loading' | 'empty' | 'error'

export function AlbumPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { albumId } = useParams<{ albumId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const albums = useAlbumStore((s) => s.albums)
  const photos = useAlbumStore((s) => s.photos)
  const createAlbum = useAlbumStore((s) => s.createAlbum)
  const updateAlbum = useAlbumStore((s) => s.updateAlbum)
  const deleteAlbum = useAlbumStore((s) => s.deleteAlbum)
  const addUploadedPhotos = useAlbumStore((s) => s.addUploadedPhotos)
  const addPhotosToAlbum = useAlbumStore((s) => s.addPhotosToAlbum)
  const removePhotoFromAlbum = useAlbumStore((s) => s.removePhotoFromAlbum)
  const setPhotosVisibility = useAlbumStore((s) => s.setPhotosVisibility)
  const deletePhotos = useAlbumStore((s) => s.deletePhotos)
  const toggleCheerPhoto = useAlbumStore((s) => s.toggleCheerPhoto)
  const leaveGroupAlbum = useAlbumStore((s) => s.leaveGroupAlbum)

  const isSharedRoute = location.pathname.startsWith('/album/shared/')
  const mode: AlbumMode = albumId
    ? 'book'
    : location.pathname.startsWith('/album/gallery')
      ? 'gallery'
      : location.pathname.startsWith('/album/timeline')
        ? 'timeline'
        : 'overview'

  const [overviewFilter, setOverviewFilter] = useState<'all' | 'mine' | 'group' | 'quest'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [gallerySourceFilter, setGallerySourceFilter] = useState<'ALL' | PhotoSourceType>('ALL')
  const [galleryVisFilter, setGalleryVisFilter] = useState<'ALL' | MediaVisibility>('ALL')
  const [timelineMonth, setTimelineMonth] = useState<string>('ALL')
  const [timelineStyle, setTimelineStyle] = useState<'board' | 'list'>('board')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [previewState, setPreviewState] = useState<PreviewState>('normal')
  const mockProfile = useMockProfileStore((s) => s.profile)

  // Modals state
  const [albumModalOpen, setAlbumModalOpen] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<AlbumRecord | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false)
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null)
  const [pendingVisConfirm, setPendingVisConfirm] = useState<{
    photoIds: string[]
    from: MediaVisibility
    to: MediaVisibility
  } | null>(null)
  const [undoToast, setUndoToast] = useState<{
    message: string
    photoIds: string[]
    previousVis: MediaVisibility
  } | null>(null)
  const undoTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'create') {
      setEditingAlbum(null)
      setAlbumModalOpen(true)
      setSearchParams({}, { replace: true })
    } else if (action === 'upload') {
      setUploadModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const triggerUndoToast = (message: string, photoIds: string[], previousVis: MediaVisibility) => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current)
    setUndoToast({ message, photoIds, previousVis })
    undoTimerRef.current = window.setTimeout(() => setUndoToast(null), 5000)
  }

  const handleRequestVisibilityChange = (
    photoIds: string[],
    from: MediaVisibility,
    to: MediaVisibility,
  ) => {
    if (isWideningVisibility(from, to)) {
      setPendingVisConfirm({ photoIds, from, to })
      return
    }
    // Narrowing applies immediately with 5-second Undo
    setPhotosVisibility(photoIds, to)
    triggerUndoToast('Đã thu hẹp quyền xem ảnh — áp dụng ngay.', photoIds, from)
  }

  const activePhotos = useMemo(() => photos.filter((p) => !p.isDeletedSource), [photos])

  const photoCountByAlbum = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of activePhotos) {
      for (const id of p.albumIds) {
        map.set(id, (map.get(id) ?? 0) + 1)
      }
    }
    return map
  }, [activePhotos])

  const filteredAlbums = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const list = albums.filter((a) => {
      if (overviewFilter === 'mine' && a.ownerId !== 'self') return false
      if (overviewFilter === 'group' && a.visibility !== 'GROUP') return false
      if (overviewFilter === 'quest' && !a.questTitle) return false
      if (
        q &&
        !a.title.toLowerCase().includes(q) &&
        !(a.questTitle?.toLowerCase().includes(q) ?? false) &&
        !a.description.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })
    return [...list].sort(
      (a, b) => (photoCountByAlbum.get(b.id) ?? 0) - (photoCountByAlbum.get(a.id) ?? 0),
    )
  }, [albums, overviewFilter, searchQuery, photoCountByAlbum])

  const recentMemories = useMemo(() => activePhotos.slice(0, 5), [activePhotos])
  const evidenceCount = useMemo(
    () => activePhotos.filter((p) => p.sourceType === 'EVIDENCE').length,
    [activePhotos],
  )

  const filteredGalleryPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (gallerySourceFilter !== 'ALL' && p.sourceType !== gallerySourceFilter) return false
      if (galleryVisFilter !== 'ALL' && p.visibility !== galleryVisFilter) return false
      return true
    })
  }, [photos, gallerySourceFilter, galleryVisFilter])

  const galleryGroupedByMonth = useMemo(() => {
    const map = new Map<string, PhotoRecord[]>()
    for (const ph of filteredGalleryPhotos) {
      const list = map.get(ph.monthGroup) ?? []
      list.push(ph)
      map.set(ph.monthGroup, list)
    }
    return Array.from(map.entries())
  }, [filteredGalleryPhotos])

  const availableTimelineMonths = useMemo(() => {
    const counts = new Map<string, number>()
    for (const ph of activePhotos) {
      counts.set(ph.monthGroup, (counts.get(ph.monthGroup) ?? 0) + 1)
    }
    return Array.from(counts.entries())
  }, [activePhotos])

  const filteredTimelinePhotos = useMemo(() => {
    return activePhotos.filter((ph) => {
      if (timelineMonth !== 'ALL' && ph.monthGroup !== timelineMonth) return false
      return true
    })
  }, [activePhotos, timelineMonth])

  const timelineGroups = useMemo(() => {
    const map = new Map<string, PhotoRecord[]>()
    for (const ph of filteredTimelinePhotos) {
      const list = map.get(ph.monthGroup) ?? []
      list.push(ph)
      map.set(ph.monthGroup, list)
    }
    return Array.from(map.entries())
  }, [filteredTimelinePhotos])

  const currentBookAlbum = albumId ? albums.find((a) => a.id === albumId) ?? null : null
  const activePhoto = activePhotoId ? photos.find((p) => p.id === activePhotoId) ?? null : null

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className={`${jStyles.journalSurface} ${styles.albumWrap}`} data-testid="album-page">
      {/* Clean 2-Row Album Header & Toolbar */}
      <header className={styles.heroHeader}>
        <div className={styles.heroHeaderTop}>
          <div className={styles.heroLeft}>
            <h1 className={styles.heroTitle}>Album kỷ niệm của {mockProfile.displayName}</h1>
            <div className={styles.heroMetaLine}>
              <span>{activePhotos.length} kỷ niệm</span>
              <span>·</span>
              <span>{albums.length} cuốn sổ</span>
              <span>·</span>
              <span>{evidenceCount} minh chứng Task</span>
            </div>
          </div>

          <div className={styles.heroCtaRow}>
            <button
              type="button"
              className={styles.modeBtn}
              onClick={() => setUploadModalOpen(true)}
              data-testid="album-upload-btn"
            >
              <Upload size={14} aria-hidden="true" /> Thêm ảnh
            </button>
            <button
              type="button"
              className={styles.ctaBtn}
              data-testid="album-create-btn"
              onClick={() => {
                setEditingAlbum(null)
                setAlbumModalOpen(true)
              }}
            >
              <FolderPlus size={14} aria-hidden="true" /> Tạo album
            </button>
          </div>
        </div>

        <div className={styles.controlsStrip}>
          <nav className={styles.modeCapsule} aria-label="Chế độ xem Album">
            <Link
              to="/album"
              className={`${styles.modeTab} ${mode === 'overview' || mode === 'book' ? styles.modeTabActive : ''}`.trim()}
              data-testid="album-nav-overview"
            >
              <BookOpen size={14} aria-hidden="true" /> Sổ lưu niệm
            </Link>
            <Link
              to="/album/gallery"
              className={`${styles.modeTab} ${mode === 'gallery' ? styles.modeTabActive : ''}`.trim()}
              data-testid="album-nav-gallery"
            >
              <Grid size={14} aria-hidden="true" /> Thư viện
            </Link>
            <Link
              to="/album/timeline"
              className={`${styles.modeTab} ${mode === 'timeline' ? styles.modeTabActive : ''}`.trim()}
              data-testid="album-nav-timeline"
            >
              <Clock size={14} aria-hidden="true" /> Dòng thời gian
            </Link>
          </nav>

          {mode === 'overview' && (
            <>
              <span className={styles.toolbarDivider} aria-hidden="true" />
              <div className={styles.overviewFilterChips} role="group" aria-label="Lọc sổ kỷ niệm">
                {(
                  [
                    { id: 'all', label: 'Tất cả' },
                    { id: 'mine', label: 'Của tôi' },
                    { id: 'group', label: 'Nhóm' },
                    { id: 'quest', label: 'Quest' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setOverviewFilter(f.id)}
                    className={`${styles.filterChipBtn} ${overviewFilter === f.id ? styles.filterChipActive : ''}`.trim()}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <label className={styles.searchPill}>
                <Search size={14} color="#6B7885" aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm album, Quest..."
                  aria-label="Tìm kiếm album và Quest"
                />
              </label>
            </>
          )}
        </div>
      </header>

      {/* Special Preview States */}
      {previewState === 'loading' ? (
        <section
          style={{
            background: '#FBF7EF',
            borderRadius: 20,
            padding: 28,
            border: '1px solid rgba(22,50,74,0.12)',
          }}
          data-testid="album-loading-state"
          aria-busy="true"
        >
          <div style={{ height: 180, borderRadius: 16, background: 'rgba(22,50,74,0.08)' }} />
          <p style={{ marginTop: 12, fontSize: 13, color: '#5A6B7A' }}>
            Đang mở trang Sổ kỷ niệm...
          </p>
        </section>
      ) : previewState === 'error' ? (
        <section
          role="alert"
          data-testid="album-error-state"
          style={{
            background: '#FBF7EF',
            borderRadius: 22,
            padding: 36,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertTriangle size={28} color="#B84317" aria-hidden="true" />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Không thể tải Sổ kỷ niệm</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#5A6B7A' }}>
            Kết nối tới dịch vụ lưu trữ tạm thời gián đoạn. Vui lòng thử lại.
          </p>
          <button type="button" className={styles.ctaBtn} onClick={() => setPreviewState('normal')}>
            <RefreshCw size={14} /> Thử lại
          </button>
        </section>
      ) : previewState === 'empty' ? (
        <section
          data-testid="album-empty-state"
          style={{
            background: '#FBF7EF',
            borderRadius: 22,
            padding: 36,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <FoxStage mood="camp" compact caption="Chưa có bức ảnh nào trong thư viện!" />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Mở cuốn Sổ kỷ niệm đầu tiên</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#5A6B7A', maxWidth: 420 }}>
            Lưu giữ minh chứng Task (luôn riêng tư mặc định) và kỷ niệm Quest vào sổ tay hành trình
            của bạn.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={styles.ctaBtn} onClick={() => setUploadModalOpen(true)}>
              <Upload size={14} /> Thêm ảnh đầu tiên
            </button>
            <button
              type="button"
              className={styles.modeBtn}
              onClick={() => {
                setEditingAlbum(null)
                setAlbumModalOpen(true)
              }}
            >
              <Plus size={14} /> Tạo album mới
            </button>
          </div>
        </section>
      ) : mode === 'book' && currentBookAlbum ? (
        /* OPEN BOOK / QUEST JOURNAL VIEW (D-C2) */
        <OpenBookView
          album={currentBookAlbum}
          photos={photos.filter((p) => p.albumIds.includes(currentBookAlbum.id))}
          isSharedMode={isSharedRoute || currentBookAlbum.ownerId !== 'self'}
          onOpenPhoto={(id) => setActivePhotoId(id)}
          onEditAlbum={() => {
            setEditingAlbum(currentBookAlbum)
            setAlbumModalOpen(true)
          }}
          onUploadClick={() => setUploadModalOpen(true)}
          onRemoveFromAlbum={(pid) => removePhotoFromAlbum(pid, currentBookAlbum.id)}
          onToggleCheer={toggleCheerPhoto}
          onLeaveGroup={() => leaveGroupAlbum(currentBookAlbum.id)}
        />
      ) : mode === 'gallery' ? (
        /* GALLERY VIEW (J-Gallery) */
        <div className={styles.galleryLayout} data-testid="album-gallery-view">
          <aside className={styles.filterSidebar} aria-label="Bộ lọc thư viện ảnh">
            <div className={styles.filterSection}>
              <div className={styles.filterGroupTitle}>Loại ảnh</div>
              <div className={styles.filterOptionList}>
                {(
                  [
                    { id: 'ALL', label: 'Tất cả ảnh', count: photos.length },
                    {
                      id: 'EVIDENCE',
                      label: 'Minh chứng Task',
                      count: photos.filter((p) => p.sourceType === 'EVIDENCE').length,
                    },
                    {
                      id: 'QUEST_MEMORY',
                      label: 'Kỷ niệm Quest',
                      count: photos.filter((p) => p.sourceType === 'QUEST_MEMORY').length,
                    },
                    {
                      id: 'NORMAL',
                      label: 'Ảnh thường',
                      count: photos.filter((p) => p.sourceType === 'NORMAL').length,
                    },
                  ] as const
                ).map((opt) => {
                  const active = gallerySourceFilter === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setGallerySourceFilter(opt.id)}
                      className={`${styles.filterOptionBtn} ${active ? styles.filterOptionActive : ''}`.trim()}
                    >
                      <span>{opt.label}</span>
                      <span className={styles.filterOptionCount}>{opt.count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={styles.filterDivider} />

            <div className={styles.filterSection}>
              <div className={styles.filterGroupTitle}>Quyền xem</div>
              <div className={styles.filterOptionList}>
                {(
                  [
                    { id: 'ALL', label: 'Mọi quyền xem', count: photos.length },
                    {
                      id: 'PRIVATE',
                      label: 'Chỉ mình tôi',
                      count: photos.filter((p) => p.visibility === 'PRIVATE').length,
                    },
                    {
                      id: 'FRIENDS',
                      label: 'Bạn bè',
                      count: photos.filter((p) => p.visibility === 'FRIENDS').length,
                    },
                    {
                      id: 'GROUP',
                      label: 'Nhóm',
                      count: photos.filter((p) => p.visibility === 'GROUP').length,
                    },
                  ] as const
                ).map((opt) => {
                  const active = galleryVisFilter === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setGalleryVisFilter(opt.id)}
                      className={`${styles.filterOptionBtn} ${active ? styles.filterOptionActive : ''}`.trim()}
                    >
                      <span>{opt.label}</span>
                      <span className={styles.filterOptionCount}>{opt.count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          <div className={styles.galleryMain}>
            <div className={styles.galleryTopBar}>
              <div className={styles.gallerySummary}>
                <strong>{filteredGalleryPhotos.length} ảnh</strong>
                <span>· Mới nhất</span>
                {(gallerySourceFilter !== 'ALL' || galleryVisFilter !== 'ALL') && (
                  <button
                    type="button"
                    className={styles.clearFilterBtn}
                    onClick={() => {
                      setGallerySourceFilter('ALL')
                      setGalleryVisFilter('ALL')
                    }}
                  >
                    Đặt lại bộ lọc
                  </button>
                )}
              </div>

              <button
                type="button"
                className={`${styles.modeBtn} ${selectMode ? styles.modeBtnActive : ''}`.trim()}
                aria-pressed={selectMode}
                data-testid="gallery-select-mode-btn"
                onClick={() => {
                  setSelectMode((v) => !v)
                  setSelectedIds([])
                }}
              >
                {selectMode ? 'Xong chọn nhiều' : 'Chọn nhiều ảnh'}
              </button>
            </div>

            {galleryGroupedByMonth.length === 0 ? (
              <div className={styles.galleryEmptyBox}>
                <strong>Không có ảnh nào khớp bộ lọc</strong>
                <p>Thử đổi loại ảnh hoặc quyền xem để hiển thị thêm kỷ niệm.</p>
                <button
                  type="button"
                  className={styles.modeBtn}
                  onClick={() => {
                    setGallerySourceFilter('ALL')
                    setGalleryVisFilter('ALL')
                  }}
                >
                  Xem tất cả ảnh
                </button>
              </div>
            ) : (
              <div className={styles.galleryMonthList}>
                {galleryGroupedByMonth.map(([month, items]) => (
                  <section key={month} className={styles.galleryMonthGroup}>
                    <div className={styles.galleryMonthHeader}>
                      <h3>{month}</h3>
                      <span>{items.length} ảnh</span>
                    </div>
                    <div className={styles.photoGrid}>
                      {items.map((ph) => {
                        const checked = selectedIds.includes(ph.id)
                        return (
                          <button
                            key={ph.id}
                            type="button"
                            className={`${styles.photoTileBtn} ${checked ? styles.photoTileSelected : ''}`.trim()}
                            data-testid={`gallery-photo-${ph.id}`}
                            onClick={() => {
                              if (selectMode) toggleSelect(ph.id)
                              else if (!ph.isDeletedSource) setActivePhotoId(ph.id)
                            }}
                          >
                            <div className={styles.photoTileFrame}>
                              {selectMode && (
                                <span
                                  className={`${styles.selectBadge} ${checked ? styles.selectBadgeChecked : ''}`.trim()}
                                  aria-hidden="true"
                                >
                                  <PawPrint
                                    size={14}
                                    fill={checked ? 'currentColor' : 'none'}
                                    strokeWidth={checked ? 2 : 1.9}
                                  />
                                </span>
                              )}
                              {!selectMode && !ph.isDeletedSource && ph.sourceType === 'EVIDENCE' && (
                                <span className={styles.memEvidencePill}>
                                  <Check size={10} aria-hidden="true" /> Minh chứng
                                </span>
                              )}
                              <MountedPhoto
                                illustrationKey={ph.illustrationKey}
                                imageUrl={ph.localPreviewUrl}
                                alt={ph.title}
                                visibility={ph.isDeletedSource ? undefined : ph.visibility}
                                corners={false}
                                isDeletedSource={ph.isDeletedSource}
                                className={styles.galleryPhotoImg}
                              />
                            </div>
                            <div className={styles.photoTileCaption}>
                              <strong>{ph.title}</strong>
                              <span>{ph.dateLabel}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {selectMode && selectedIds.length > 0 && (
              <div className={styles.bulkBar} data-testid="gallery-bulk-bar">
                <strong>Đã chọn {selectedIds.length} ảnh</strong>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={styles.modeBtn}
                    style={{ minHeight: 34, padding: '4px 10px', fontSize: 12 }}
                    onClick={() => setAddToAlbumOpen(true)}
                  >
                    <FolderPlus size={13} /> Thêm vào album
                  </button>
                  <button
                    type="button"
                    className={styles.modeBtn}
                    style={{ minHeight: 34, padding: '4px 10px', fontSize: 12 }}
                    onClick={() =>
                      handleRequestVisibilityChange(selectedIds, 'PRIVATE', 'FRIENDS')
                    }
                  >
                    Đổi quyền xem
                  </button>
                  <button
                    type="button"
                    className={styles.modeBtn}
                    style={{ minHeight: 34, padding: '4px 10px', fontSize: 12, color: '#b42318' }}
                    onClick={() => {
                      deletePhotos(selectedIds)
                      setSelectedIds([])
                    }}
                  >
                    <Trash2 size={13} /> Xóa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : mode === 'timeline' ? (
        /* TIMELINE VIEW (Polaroid Memory Pinboard + List toggle) */
        <div className={styles.timelineBoardWrap} data-testid="album-timeline-view">
          {/* Compact Single-Row Month Selector + View Switch */}
          <div className={styles.monthSelectorBar}>
            <div className={styles.boardFilterPills} role="group" aria-label="Xem theo tháng">
              <span className={styles.monthSelectorLabel}>Xem theo tháng:</span>
              <button
                type="button"
                aria-pressed={timelineMonth === 'ALL'}
                onClick={() => setTimelineMonth('ALL')}
                className={`${styles.monthTabBtn} ${timelineMonth === 'ALL' ? styles.monthTabActive : ''}`.trim()}
              >
                Tất cả ({activePhotos.length})
              </button>
              {availableTimelineMonths.map(([month, count]) => (
                <button
                  key={month}
                  type="button"
                  aria-pressed={timelineMonth === month}
                  onClick={() => setTimelineMonth(month)}
                  className={`${styles.monthTabBtn} ${timelineMonth === month ? styles.monthTabActive : ''}`.trim()}
                >
                  {month} <span className={styles.monthTabCount}>{count}</span>
                </button>
              ))}
            </div>

            <div className={styles.boardViewSwitch} role="group" aria-label="Kiểu hiển thị dòng thời gian">
              <button
                type="button"
                aria-pressed={timelineStyle === 'board'}
                onClick={() => setTimelineStyle('board')}
                className={`${styles.boardSwitchBtn} ${timelineStyle === 'board' ? styles.boardSwitchActive : ''}`.trim()}
              >
                Bảng ghim
              </button>
              <button
                type="button"
                aria-pressed={timelineStyle === 'list'}
                onClick={() => setTimelineStyle('list')}
                className={`${styles.boardSwitchBtn} ${timelineStyle === 'list' ? styles.boardSwitchActive : ''}`.trim()}
              >
                Danh sách
              </button>
            </div>
          </div>

          {timelineGroups.length === 0 ? (
            <div className={styles.galleryEmptyBox}>
              <strong>Chưa có kỷ niệm nào trong tháng này</strong>
              <p>Chọn tháng khác để xem toàn bộ bảng kỷ niệm của bạn.</p>
              <button
                type="button"
                className={styles.modeBtn}
                onClick={() => setTimelineMonth('ALL')}
              >
                Xem toàn bộ
              </button>
            </div>
          ) : timelineStyle === 'board' ? (
            /* POLAROID PINBOARD VIEW (Synced Warm Journal Paper Canvas) */
            <div className={styles.memoryBoardCanvas}>
              {/* Continuous delicate warm thread running down the board */}
              <svg
                className={styles.boardThreadSvg}
                viewBox="0 0 1000 900"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M 180 42 C 420 110, 740 80, 780 220 C 820 360, 210 380, 240 530 C 270 680, 690 660, 760 850"
                  fill="none"
                  stroke="rgba(242, 107, 58, 0.48)"
                  strokeWidth="2.2"
                  strokeDasharray="6 7"
                />
                <path
                  d="M 210 155 Q 370 118 495 190 T 760 150"
                  fill="none"
                  stroke="rgba(22, 50, 74, 0.14)"
                  strokeWidth="1.4"
                />
                <path
                  d="M 240 560 Q 450 510 610 595 T 820 555"
                  fill="none"
                  stroke="rgba(22, 50, 74, 0.14)"
                  strokeWidth="1.4"
                />
              </svg>

              <div className={styles.boardClusters}>
                {timelineGroups.map(([month, items], gIdx) => (
                  <section key={month} className={styles.boardMonthCluster}>
                    <div className={styles.boardDatePillRow}>
                      <span className={styles.boardPinDot} aria-hidden="true" />
                      <span className={styles.boardDatePill}>
                        <span>{month}</span>
                        <span className={styles.boardDatePillMeta}>· {items.length} ảnh</span>
                      </span>
                    </div>

                    <div className={styles.boardScatterGrid}>
                      {items.map((ph, pIdx) => {
                        const isQuest = ph.sourceType === 'QUEST_MEMORY'
                        const tiltCls =
                          pIdx % 4 === 0
                            ? styles.pinTiltA
                            : pIdx % 4 === 1
                              ? styles.pinTiltB
                              : pIdx % 4 === 2
                                ? styles.pinTiltC
                                : styles.pinTiltD
                        const noteTone =
                          isQuest
                            ? styles.stickyDark
                            : pIdx % 3 === 0
                              ? styles.stickyYellow
                              : pIdx % 3 === 1
                                ? styles.stickyPink
                                : styles.stickyMint
                        const showSticky = pIdx % 2 === 0 || isQuest
                        return (
                          <div
                            key={ph.id}
                            className={`${styles.boardClusterItem} ${pIdx % 2 === 1 ? styles.boardItemOffset : ''}`.trim()}
                          >
                            <button
                              type="button"
                              className={`${styles.boardPolaroid} ${tiltCls}`}
                              onClick={() => setActivePhotoId(ph.id)}
                            >
                              <span className={styles.polaroidTopTab} aria-hidden="true" />
                              <div className={styles.boardPolaroidImg}>
                                <MountedPhoto
                                  illustrationKey={ph.illustrationKey}
                                  imageUrl={ph.localPreviewUrl}
                                  alt={ph.title}
                                  visibility={ph.visibility}
                                  corners={false}
                                  className={styles.boardPhotoInner}
                                />
                              </div>
                              <div className={styles.boardPolaroidFoot}>
                                <span className={styles.boardAuthorDot}>
                                  {mockProfile.displayName.slice(0, 1).toUpperCase()}
                                </span>
                                <div className={styles.boardPolaroidMeta}>
                                  <strong>{ph.title}</strong>
                                  <span>{ph.dateLabel}</span>
                                </div>
                              </div>
                            </button>

                            {showSticky && (
                              <button
                                type="button"
                                className={`${styles.boardStickyNote} ${noteTone}`}
                                onClick={() => setActivePhotoId(ph.id)}
                              >
                                <span className={styles.stickyAuthor}>
                                  {isQuest ? (
                                    <>
                                      <Flag size={10} aria-hidden="true" /> Cột mốc Quest
                                    </>
                                  ) : (
                                    <>
                                      <PawPrint size={10} aria-hidden="true" />{' '}
                                      {gIdx === 0 && pIdx === 2 ? 'Gia Huy' : mockProfile.displayName}
                                    </>
                                  )}
                                </span>
                                <span className={styles.stickyText}>{ph.caption}</span>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            /* CLASSIC EDITORIAL LIST VIEW */
            <div className={styles.timelineTrack}>
              {timelineGroups.map(([month, items], gIdx) => (
                <section
                  key={month}
                  id={`timeline-month-${gIdx}`}
                  className={styles.timelineMonthBlock}
                >
                  <div className={styles.timelineChapterRow}>
                    <span className={styles.timelineChapterPill}>
                      <Flag size={11} aria-hidden="true" />
                      <span>Chương · {month}</span>
                    </span>
                    <span className={styles.timelineChapterCount}>{items.length} kỷ niệm</span>
                  </div>

                  <div className={styles.timelineEntries}>
                    {items.map((ph) => {
                      const isQuest = ph.sourceType === 'QUEST_MEMORY'
                      const linkedAlbum = albums.find((a) => ph.albumIds.includes(a.id))
                      const [dayPart, timePart] = ph.dateLabel.split('·').map((s) => s.trim())
                      return (
                        <div key={ph.id} className={styles.timelineRow}>
                          <div className={styles.timelineDateCol}>
                            <strong>{dayPart}</strong>
                            {timePart && <span>{timePart}</span>}
                          </div>

                          <span
                            className={`${styles.timelineNode} ${isQuest ? styles.timelineNodeQuest : ''}`.trim()}
                            aria-hidden="true"
                          >
                            {isQuest ? <Flag size={10} /> : <PawPrint size={10} />}
                          </span>

                          <article
                            className={`${styles.timelineItem} ${isQuest ? styles.timelineItemQuest : ''}`.trim()}
                          >
                            <button
                              type="button"
                              className={styles.timelineThumbBtn}
                              onClick={() => setActivePhotoId(ph.id)}
                            >
                              <MountedPhoto
                                illustrationKey={ph.illustrationKey}
                                imageUrl={ph.localPreviewUrl}
                                alt={ph.title}
                                visibility={ph.visibility}
                                corners={false}
                                className={styles.timelineThumbImg}
                              />
                            </button>

                            <div className={styles.timelineBody}>
                              {isQuest && (
                                <span className={styles.timelineQuestEyebrow}>
                                  <Flag size={10} aria-hidden="true" /> Cột mốc Quest
                                </span>
                              )}
                              <button
                                type="button"
                                className={styles.timelineTitleBtn}
                                onClick={() => setActivePhotoId(ph.id)}
                              >
                                {ph.title}
                              </button>
                              <p className={styles.timelineCaption}>{ph.caption}</p>
                              <div className={styles.timelineMetaRow}>
                                {ph.sourceType === 'EVIDENCE' && <EvidenceChip />}
                                {ph.sharedAsMoment && <MomentChip />}
                                {linkedAlbum && (
                                  <Link
                                    to={
                                      linkedAlbum.ownerId === 'self'
                                        ? `/album/${linkedAlbum.id}`
                                        : `/album/shared/${linkedAlbum.id}`
                                    }
                                    className={styles.timelineAlbumLink}
                                  >
                                    <BookOpen size={11} aria-hidden="true" /> {linkedAlbum.title}
                                  </Link>
                                )}
                              </div>
                            </div>
                          </article>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ALBUM OVERVIEW SHELF (Uniform clean bookshelf) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} data-testid="album-overview-view">
          <div className={styles.sectionHeadRow}>
            <h2 className={styles.sectionHeading}>Các cuốn sổ</h2>
            <span className={styles.sortHint}>{filteredAlbums.length} cuốn</span>
          </div>

          <div className={styles.bentoShelfGrid}>
            {filteredAlbums.map((alb, idx) => {
              const albumPhotos = activePhotos.filter((p) => p.albumIds.includes(alb.id))
              const count = albumPhotos.length
              const tiltClass = idx % 2 === 0 ? styles.coverTiltLeft : styles.coverTiltRight
              const openAlbum = () =>
                navigate(alb.ownerId === 'self' ? `/album/${alb.id}` : `/album/shared/${alb.id}`)

              return (
                <article key={alb.id} className={styles.bookSlot}>
                  <button
                    type="button"
                    className={styles.bookTriggerBtn}
                    data-testid={`album-card-${alb.id}`}
                    onClick={openAlbum}
                  >
                    {alb.isAutoEvidence ? (
                      <div className={styles.evidenceBookCard}>
                        <span className={styles.evidenceClip} aria-hidden="true" />
                        <div className={styles.evidenceTopRow}>
                          <span className={styles.evidenceLabel}>Tự gom từ Task</span>
                        </div>
                        <div className={styles.evidenceChecklist}>
                          {(albumPhotos.length > 0
                            ? albumPhotos.slice(0, 3)
                            : [
                                { id: 'e1', title: 'Hoàn thành nhiệm vụ hằng ngày', dateLabel: 'Hôm nay' },
                              ]
                          ).map((item) => (
                            <div key={item.id} className={styles.evidenceRow}>
                              <span className={styles.evidenceRowLeft}>
                                <CheckCircle2 size={13} color="#168C78" aria-hidden="true" />
                                <span>{item.title}</span>
                              </span>
                              <span className={styles.evidenceDate}>{item.dateLabel}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <ClothCover color={alb.coverColor} bookmark className={styles.stdBookCover}>
                        <div className={`${styles.stdCoverFrame} ${tiltClass}`}>
                          <span className={styles.coverTape} aria-hidden="true" />
                          <div className={styles.stdCoverImgWrap}>
                            <JournalIllustration kind={alb.coverIllustration} alt={`Bìa ${alb.title}`} />
                          </div>
                        </div>
                        <div className={styles.stdCoverFoot}>
                          {alb.members && alb.members.length > 0 ? (
                            <div className={styles.memberAvatarStack} aria-label={`${alb.members.length} thành viên`}>
                              {alb.members.slice(0, 3).map((m) => (
                                <span key={m.id} className={styles.memberMiniBubble}>
                                  {m.initials}
                                </span>
                              ))}
                              {alb.members.length > 3 && (
                                <span className={styles.memberMiniBubble}>+{alb.members.length - 3}</span>
                              )}
                            </div>
                          ) : (
                            <div className={styles.coverProgressDots} aria-hidden="true">
                              {alb.chapters.slice(0, 5).map((ch, cIdx) => (
                                <span
                                  key={ch}
                                  className={`${styles.coverDot} ${cIdx < Math.max(1, count) ? styles.coverDotActive : ''}`.trim()}
                                />
                              ))}
                            </div>
                          )}
                          <span className={styles.coverCountHint}>{count} ảnh</span>
                        </div>
                      </ClothCover>
                    )}

                    <div className={styles.bookBelowMeta}>
                      <div className={styles.bookBelowTop}>
                        <strong className={styles.bookBelowTitle}>{alb.title}</strong>
                        <PrivacyPill visibility={alb.visibility} />
                      </div>
                      <div className={styles.bookBelowSub}>
                        {count} ảnh
                        {alb.members?.length
                          ? ` · ${alb.members.length} thành viên`
                          : alb.isAutoEvidence
                            ? ' · Tự gom'
                            : ` · ${alb.chapters.length} chương`}
                      </div>
                    </div>
                  </button>
                </article>
              )
            })}

            <button
              type="button"
              className={styles.newBookCard}
              onClick={() => {
                setEditingAlbum(null)
                setAlbumModalOpen(true)
              }}
            >
              <FolderPlus size={22} color="#F26B3A" aria-hidden="true" />
              <span>Mở cuốn sổ mới</span>
              <span style={{ fontSize: 12, color: '#6B7885', fontWeight: 500, textAlign: 'center' }}>
                Tạo album mới cho hành trình của bạn
              </span>
            </button>
          </div>

          {/* Bottom Recent Memories Staggered Scrapbook Strip (matching reference) */}
          {recentMemories.length > 0 && (
            <section className={styles.recentMemoriesSection} aria-label="Kỷ niệm gần đây">
              <div className={styles.sectionHeadRow}>
                <h2 className={styles.sectionHeading}>Kỷ niệm gần đây</h2>
                <Link to="/album/timeline" className={styles.timelineLink}>
                  Xem dòng thời gian →
                </Link>
              </div>
              <div className={styles.recentMemoriesCard}>
                <div className={styles.recentMemoriesGrid}>
                  {recentMemories.map((ph, idx) => {
                    const slotClass =
                      idx === 0
                        ? styles.memSlot0
                        : idx === 1
                          ? styles.memSlot1
                          : idx === 2
                            ? styles.memSlot2
                            : idx === 3
                              ? styles.memSlot3
                              : styles.memSlot4
                    return (
                      <button
                        key={ph.id}
                        type="button"
                        className={`${styles.recentMemoryItem} ${slotClass}`}
                        onClick={() => setActivePhotoId(ph.id)}
                      >
                        <div className={styles.recentMemoryFrame}>
                          <MountedPhoto
                            illustrationKey={ph.illustrationKey}
                            imageUrl={ph.localPreviewUrl}
                            alt={ph.title}
                            visibility={ph.visibility}
                            corners={false}
                            className={styles.recentMemoryPhoto}
                          />
                          {ph.sourceType === 'EVIDENCE' && (
                            <span className={styles.memEvidencePill}>
                              <Check size={10} aria-hidden="true" /> Minh chứng
                            </span>
                          )}
                        </div>
                        <div className={styles.recentMemoryCaption}>
                          <strong>{ph.title}</strong>
                          <span>{ph.dateLabel}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Sweeping dotted orange adventure trail + milestone flag */}
                <div className={styles.memoryTrailRow} aria-hidden="true">
                  <svg
                    className={styles.memoryTrailSvg}
                    viewBox="0 0 640 52"
                    preserveAspectRatio="none"
                  >
                    <path
                      className={styles.memoryTrailPath}
                      d="M 12 8 C 68 38, 128 6, 198 22 C 276 42, 372 48, 452 24 C 516 4, 574 6, 632 34"
                      fill="none"
                      stroke="#F26B3A"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeDasharray="3 8"
                    />
                  </svg>
                  <div className={styles.memoryMilestoneEnd}>
                    <svg className={styles.memoryFlagPole} viewBox="0 0 22 28" aria-hidden="true">
                      <line x1="4" y1="26" x2="4" y2="3" stroke="#16324A" strokeWidth="2.2" strokeLinecap="round" />
                      <path d="M5 4 L20 7.5 L5 13 Z" fill="#F26B3A" />
                    </svg>
                    <span className={styles.memoryMilestonePill}>Epic 2 hoàn thành · +200 XP</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modals */}
      <AlbumFormModal
        open={albumModalOpen}
        editingAlbum={editingAlbum}
        onSave={(data) => {
          if (editingAlbum) {
            updateAlbum(editingAlbum.id, data)
          } else {
            const created = createAlbum(data)
            navigate(`/album/${created.id}`)
          }
          setAlbumModalOpen(false)
        }}
        onDelete={(id) => {
          deleteAlbum(id)
          setAlbumModalOpen(false)
          navigate('/album')
        }}
        onClose={() => setAlbumModalOpen(false)}
      />

      <AlbumUploadModal
        open={uploadModalOpen}
        albums={albums}
        onSaveUploads={(items) => {
          addUploadedPhotos(items)
        }}
        onClose={() => setUploadModalOpen(false)}
      />

      <AddToAlbumModal
        open={addToAlbumOpen}
        photoCount={selectedIds.length}
        hasPrivatePhoto={photos.some((p) => selectedIds.includes(p.id) && p.visibility === 'PRIVATE')}
        albums={albums}
        onAdd={(targetAlbumId) => {
          addPhotosToAlbum(selectedIds, targetAlbumId)
          setSelectedIds([])
          setSelectMode(false)
        }}
        onClose={() => setAddToAlbumOpen(false)}
      />

      <PhotoDetailModal
        photo={activePhoto}
        photos={photos.filter((p) => !p.isDeletedSource)}
        albums={albums}
        onSelectPhoto={(id) => setActivePhotoId(id)}
        onRequestVisibilityChange={(ph, next) =>
          handleRequestVisibilityChange([ph.id], ph.visibility, next)
        }
        onToggleCheer={toggleCheerPhoto}
        onDeletePhoto={(id) => deletePhotos([id])}
        onClose={() => setActivePhotoId(null)}
      />

      <ConfirmVisibilityDialog
        open={Boolean(pendingVisConfirm)}
        fromVisibility={pendingVisConfirm?.from ?? 'PRIVATE'}
        toVisibility={pendingVisConfirm?.to ?? 'FRIENDS'}
        itemCount={pendingVisConfirm?.photoIds.length ?? 1}
        onConfirm={() => {
          if (pendingVisConfirm) {
            setPhotosVisibility(pendingVisConfirm.photoIds, pendingVisConfirm.to)
          }
          setPendingVisConfirm(null)
        }}
        onCancel={() => setPendingVisConfirm(null)}
      />

      {/* 5-second Undo Toast on Narrowing Visibility */}
      {undoToast && (
        <div className={jStyles.undoToast} role="status" data-testid="privacy-undo-toast">
          <span>{undoToast.message}</span>
          <button
            type="button"
            className={jStyles.undoBtn}
            onClick={() => {
              setPhotosVisibility(undoToast.photoIds, undoToast.previousVis)
              setUndoToast(null)
            }}
          >
            Hoàn tác
          </button>
        </div>
      )}
    </div>
  )
}
