import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Heart,
  LogOut,
  Plus,
  ShieldAlert,
  Users,
} from 'lucide-react'
import {
  BookSpine,
  FoxStage,
  MilestonePill,
  MomentChip,
  MountedPhoto,
  PaperPage,
  PassportStamp,
  PrivacyPill,
  RouteLine,
  WashiTape,
} from '@/features/journal/JournalPrimitives'
import jStyles from '@/features/journal/journal.module.css'
import type { AlbumRecord, PhotoRecord } from './albumStore'
import styles from './AlbumPage.module.css'

export function OpenBookView({
  album,
  photos,
  isSharedMode,
  onOpenPhoto,
  onEditAlbum,
  onUploadClick,
  onRemoveFromAlbum,
  onToggleCheer,
  onLeaveGroup,
}: {
  album: AlbumRecord
  photos: PhotoRecord[]
  isSharedMode: boolean
  onOpenPhoto: (photoId: string) => void
  onEditAlbum: () => void
  onUploadClick: () => void
  onRemoveFromAlbum: (photoId: string) => void
  onToggleCheer: (photoId: string) => void
  onLeaveGroup: () => void
}) {
  const [chapterIdx, setChapterIdx] = useState(0)
  const [isTurning, setIsTurning] = useState(false)

  useEffect(() => {
    setChapterIdx(0)
  }, [album.id])

  const chapters = album.chapters.length > 0 ? album.chapters : ['Chương 1']
  const safeIdx = Math.min(chapterIdx, chapters.length - 1)

  const goChapter = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(chapters.length - 1, nextIdx))
    if (clamped === safeIdx) return
    setIsTurning(true)
    setChapterIdx(clamped)
    window.setTimeout(() => setIsTurning(false), 240)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft') goChapter(safeIdx - 1)
      if (e.key === 'ArrowRight') goChapter(safeIdx + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  // Revoked access state (e.g. after leaving group or unfriending)
  if (album.revokedForViewer) {
    return (
      <section
        style={{
          background: '#FBF7EF',
          border: '1px solid rgba(22,50,74,0.14)',
          borderRadius: 22,
          padding: 36,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
        data-testid="album-access-revoked"
      >
        <ShieldAlert size={28} color="#B84317" aria-hidden="true" />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Không còn quyền xem album này</h2>
        <p style={{ margin: 0, fontSize: 13, color: '#5A6B7A', maxWidth: 420 }}>
          Bạn đã rời khỏi nhóm hoặc quyền truy cập đã được thu hồi. Các liên kết ảnh tạm thời đã hết
          hạn.
        </p>
        <Link to="/album" className={styles.ctaBtn} style={{ textDecoration: 'none' }}>
          Quay lại Sổ kỷ niệm
        </Link>
      </section>
    )
  }

  // Filter out PRIVATE photos in shared view (photo visibility always overrides album visibility!)
  const visiblePhotos = isSharedMode
    ? photos.filter((p) => p.visibility !== 'PRIVATE')
    : photos

  const chapterPhotos = visiblePhotos.filter((p) => p.chapterIndex === safeIdx)
  const displayPhotos = chapterPhotos.length > 0 ? chapterPhotos : visiblePhotos.slice(0, 2)
  const leftPhoto = displayPhotos[0] ?? null
  const rightPhotos = displayPhotos.slice(1, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-testid="open-book-view">
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/album" className={styles.modeBtn}>
            <ArrowLeft size={14} aria-hidden="true" /> Tất cả sổ
          </Link>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            {isSharedMode ? `Album của ${album.ownerName} — ${album.title}` : album.title}
          </h2>
          <PrivacyPill visibility={album.visibility} />
          {isSharedMode && <span className={jStyles.previewChip}>Chỉ đọc (Bạn bè)</span>}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!isSharedMode && (
            <>
              <button type="button" className={styles.modeBtn} onClick={onEditAlbum} data-testid="book-edit-album-btn">
                <Edit3 size={14} aria-hidden="true" /> Sửa bìa sổ
              </button>
              <button type="button" className={styles.ctaBtn} onClick={onUploadClick}>
                <Plus size={14} aria-hidden="true" /> Thêm ảnh
              </button>
            </>
          )}
          {album.visibility === 'GROUP' && (
            <button
              type="button"
              className={styles.modeBtn}
              style={{ color: '#b42318' }}
              onClick={onLeaveGroup}
              data-testid="leave-group-album-btn"
            >
              <LogOut size={14} aria-hidden="true" /> Rời nhóm
            </button>
          )}
        </div>
      </div>

      {/* Two-Page Open Book (Desktop/Tablet) -> Single-Page (Mobile) */}
      <div className={styles.bookShell}>
        <div
          className={`${styles.bookSpread} ${isTurning ? styles.bookTurning : ''}`.trim()}
          aria-live="polite"
        >
          {/* LEFT PAGE */}
          <PaperPage side="left" className={styles.pageInner}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#5A6B7A', textTransform: 'uppercase' }}>
                  CHƯƠNG {safeIdx + 1} · {chapters[safeIdx]}
                </span>
                {album.questTitle && <MilestonePill label={album.questTitle} />}
              </div>

              <RouteLine />

              {leftPhoto ? (
                <div style={{ position: 'relative' }}>
                  <WashiTape tone="orange" angle={-7} style={{ top: -8, left: 24 }} />
                  <button
                    type="button"
                    onClick={() => !leftPhoto.isDeletedSource && onOpenPhoto(leftPhoto.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      cursor: leftPhoto.isDeletedSource ? 'default' : 'pointer',
                      textAlign: 'left',
                    }}
                    data-testid={`book-photo-${leftPhoto.id}`}
                  >
                    <MountedPhoto
                      illustrationKey={leftPhoto.illustrationKey}
                      imageUrl={leftPhoto.localPreviewUrl}
                      alt={leftPhoto.title}
                      visibility={leftPhoto.visibility}
                      isDeletedSource={leftPhoto.isDeletedSource}
                      onRemoveDeleted={() => onRemoveFromAlbum(leftPhoto.id)}
                    />
                  </button>
                  <div style={{ marginTop: 10 }}>
                    <strong style={{ fontSize: 15 }}>{leftPhoto.title}</strong>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#5A6B7A' }}>
                      {leftPhoto.caption}
                    </p>
                    {leftPhoto.handNote && (
                      <div className={jStyles.handNote} style={{ marginTop: 6 }}>
                        &ldquo;{leftPhoto.handNote}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: 20, textAlign: 'center' }} data-testid="empty-book-state">
                  <FoxStage mood="happy" compact caption="Trang sổ này đang chờ bức ảnh đầu tiên!" />
                  {!isSharedMode && (
                    <button type="button" className={styles.ctaBtn} style={{ marginTop: 12 }} onClick={onUploadClick}>
                      <Plus size={14} /> Thêm ảnh vào chương này
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: '#5A6B7A' }}>
              <span>Trang {safeIdx * 2 + 1}</span>
              <span>{leftPhoto?.dateLabel ?? album.createdAtLabel}</span>
            </div>
          </PaperPage>

          {/* SPINE (Hidden cleanly on mobile single-page via grid) */}
          <BookSpine />

          {/* RIGHT PAGE */}
          <PaperPage side="right" className={styles.pageInner}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={jStyles.handNote}>
                  {album.description || 'Ghi dấu từng bước nhỏ mỗi ngày.'}
                </span>
                <PassportStamp top="LIFEQUEST" bottom={`CH.${safeIdx + 1}`} />
              </div>

              {rightPhotos.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                  {rightPhotos.map((ph) => (
                    <div key={ph.id} style={{ position: 'relative' }}>
                      <WashiTape tone="teal" angle={6} style={{ top: -7, right: 16 }} />
                      <button
                        type="button"
                        onClick={() => !ph.isDeletedSource && onOpenPhoto(ph.id)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: 0,
                          border: 'none',
                          background: 'transparent',
                          cursor: ph.isDeletedSource ? 'default' : 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <MountedPhoto
                          illustrationKey={ph.illustrationKey}
                          imageUrl={ph.localPreviewUrl}
                          alt={ph.title}
                          visibility={ph.visibility}
                          isDeletedSource={ph.isDeletedSource}
                          onRemoveDeleted={() => onRemoveFromAlbum(ph.id)}
                        />
                      </button>
                      <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 700 }}>{ph.title}</div>
                      {ph.sharedAsMoment && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <MomentChip />
                          <button
                            type="button"
                            className={styles.modeBtn}
                            style={{ minHeight: 28, padding: '2px 8px', fontSize: 11 }}
                            onClick={() => onToggleCheer(ph.id)}
                          >
                            <Heart size={11} fill={ph.cheeredByMe ? '#F26B3A' : 'none'} color="#F26B3A" />
                            {ph.cheerCount}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    border: '1.5px dashed rgba(22,50,74,0.16)',
                    borderRadius: 14,
                    padding: 18,
                    textAlign: 'center',
                    color: '#5A6B7A',
                    fontSize: 12.5,
                  }}
                >
                  <p style={{ margin: 0 }}>
                    Bạn chỉ thấy các ảnh được chia sẻ theo đúng quyền xem. Ảnh &ldquo;Chỉ mình
                    tôi&rdquo; không bao giờ xuất hiện ở chế độ xem chung.
                  </p>
                  {leftPhoto?.sharedAsMoment && (
                    <button
                      type="button"
                      className={styles.modeBtn}
                      style={{ marginTop: 10 }}
                      onClick={() => onToggleCheer(leftPhoto.id)}
                    >
                      <Heart
                        size={13}
                        fill={leftPhoto.cheeredByMe ? '#F26B3A' : 'none'}
                        color="#F26B3A"
                      />
                      Cổ vũ Moment ({leftPhoto.cheerCount})
                    </button>
                  )}
                </div>
              )}

              {/* Group Album Member List */}
              {album.members && album.members.length > 0 && (
                <div
                  style={{
                    marginTop: 6,
                    padding: 12,
                    borderRadius: 14,
                    background: 'rgba(22,50,74,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <strong style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Users size={13} /> Thành viên nhóm ({album.members.length})
                  </strong>
                  {album.members.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: '#274258',
                      }}
                    >
                      <span>
                        <strong>{m.name}</strong> ·{' '}
                        {m.role === 'OWNER'
                          ? 'Chủ nhóm'
                          : m.role === 'CAN_ADD'
                            ? 'Được thêm ảnh'
                            : 'Chỉ xem'}
                      </span>
                      <span>{m.photoCount} ảnh</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: '#5A6B7A' }}>
              <span>Dữ liệu minh họa · Sổ kỷ niệm</span>
              <span>Trang {safeIdx * 2 + 2}</span>
            </div>
          </PaperPage>
        </div>

        {/* Chapter Tabs (Vertical right rail on desktop/tablet, Horizontal row on mobile) */}
        <div
          className={styles.chapterTabsRail}
          role="tablist"
          aria-label="Chương trong sổ kỷ niệm"
          data-testid="book-chapter-tabs"
        >
          {chapters.map((ch, idx) => (
            <button
              key={ch}
              type="button"
              role="tab"
              aria-selected={safeIdx === idx}
              data-testid={`chapter-tab-${idx}`}
              className={`${styles.chapterTabBtn} ${safeIdx === idx ? styles.chapterTabActive : ''}`.trim()}
              onClick={() => goChapter(idx)}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Page Turn Controls */}
      <div className={styles.bookControls}>
        <button
          type="button"
          className={styles.modeBtn}
          disabled={safeIdx <= 0}
          onClick={() => goChapter(safeIdx - 1)}
          data-testid="book-prev-page"
        >
          <ChevronLeft size={15} /> Chương trước
        </button>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#5A6B7A' }}>
          Chương {safeIdx + 1} / {chapters.length}: {chapters[safeIdx]}
        </span>
        <button
          type="button"
          className={styles.modeBtn}
          disabled={safeIdx >= chapters.length - 1}
          onClick={() => goChapter(safeIdx + 1)}
          data-testid="book-next-page"
        >
          Chương sau <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
