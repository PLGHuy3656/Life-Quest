import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Camera,
  Heart,
  ImagePlus,
  Lock,
  MessageCircle,
  Send,
  Share2,
  Smile,
  Sparkles,
  Trash2
} from 'lucide-react'
import { SOCIAL_MOCK_ASSETS } from '@/assets/social'
import { QUEST_TYPE_META } from '@/components/ui/questIconMeta'
import {
  SOCIAL_CAPABILITY_MATRIX,
  type SocialFeedPost
} from '@/services/api/socialContracts'
import { useUiStore } from '@/stores/uiStore'
import type { PrivacyMode } from '@/types/domain'
import { SocialMediaGrid } from './media/SocialMediaGrid'
import {
  ALLOWED_IMAGE_ACCEPT,
  MAX_COMPOSER_IMAGES,
  validateImageFiles,
  type SocialMediaItem
} from './media/mediaValidation'
import styles from './SocialFeedSection.module.css'

const SOCIAL_PREVIEW_POSTS: SocialFeedPost[] = [
  {
    id: 'social-feed-1',
    authorName: 'Minh Anh',
    authorTag: '@minhanh',
    avatarTone: 'teal',
    timeLabel: '24 phút trước',
    visibility: 'FRIENDS',
    questBadge: 'Focus 25p',
    questType: 'FOCUS',
    caption:
      'Hoàn thành phiên tập trung 25 phút đầu ngày cho môn Kiến trúc phần mềm — giữ chuỗi 6 ngày liên tiếp không bị ngắt quãng!',
    illustrationKey: 'study-corner',
    illustrationAlt: 'Minh họa góc học tập buổi sáng cùng sổ tay và đèn bàn',
    likeCount: 8,
    comments: [
      {
        id: 'c-1',
        author: 'Đức Khá',
        text: 'Đỉnh quá, giữ nhịp sáng sớm cực hiệu quả luôn!',
        timeLabel: '12 phút trước'
      }
    ],
    isPreviewFixture: true
  },
  {
    id: 'social-feed-2',
    authorName: 'Đức Khá',
    authorTag: '@duckha',
    avatarTone: 'coral',
    timeLabel: '1 giờ trước',
    visibility: 'FRIENDS',
    questBadge: 'Milestone ✓',
    questType: 'PROGRESS',
    caption:
      'Vừa chốt xong cột mốc API Auth & Today trên nhánh develop. Cảm giác tick xong checklist cuối cùng thật sự nhẹ cả người.',
    illustrationKey: 'milestone-moment',
    illustrationAlt: 'Minh họa hành trình hoàn thành cột mốc trên đỉnh đồi sáng sớm',
    likeCount: 12,
    comments: [
      {
        id: 'c-2',
        author: 'Lan Vy',
        text: 'Chúc mừng mốc mới nha! Chuẩn bị đồng bộ Social feed thôi.',
        timeLabel: '40 phút trước'
      }
    ],
    isPreviewFixture: true
  },
  {
    id: 'social-feed-3',
    authorName: 'Lan Vy',
    authorTag: '@lanvy',
    avatarTone: 'navy',
    timeLabel: '2 giờ trước',
    visibility: 'FRIENDS',
    questBadge: 'Chạy bộ 20p',
    questType: 'DURATION',
    caption:
      'Trời sáng nay mát lắm, chạy nhẹ 20 phút quanh công viên rồi về uống nước ấm. Một buổi sáng đầy năng lượng!',
    illustrationKey: 'morning-run',
    illustrationAlt: 'Minh họa cung đường chạy bộ công viên buổi sáng',
    likeCount: 15,
    comments: [],
    isPreviewFixture: true
  },
  {
    id: 'social-feed-4',
    authorName: 'Hoàng Nam',
    authorTag: '@hoangnam',
    avatarTone: 'gold',
    timeLabel: '3 giờ trước',
    visibility: 'PRIVATE',
    questBadge: '2.0 Lít nước',
    questType: 'QUANTITY',
    caption:
      'Nhật ký riêng tư: Đã uống đủ 1.5/2.0 lít nước trước 15h chiều — đặt bình nước ngay cạnh bàn học giúp nhớ uống đều hơn hẳn.',
    illustrationKey: 'hydration-habit',
    illustrationAlt: 'Minh họa thói quen uống đủ nước mỗi ngày với lá bạc hà',
    likeCount: 4,
    comments: [],
    isPreviewFixture: true
  }
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'LQ'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export interface SocialFeedSectionProps {
  expandedWide: boolean
  userInitial: string
}

/**
 * Approved Social-First Home Dashboard feed (FE-03.5I + FE-03.5J adaptive local media).
 * - Compact composer before media selection; expands smoothly when editing local images.
 * - Instant URL.createObjectURL previews with guaranteed URL.revokeObjectURL cleanup.
 * - Reuses SocialMediaGrid + SocialMediaLightbox for both composer & demonstration posts.
 * - Never fabricates Backend upload or post creation success.
 */
export function SocialFeedSection({ expandedWide, userInitial }: SocialFeedSectionProps) {
  const composerText = useUiStore((s) => s.socialComposerDraft)
  const setComposerText = useUiStore((s) => s.setSocialComposerDraft)

  const [composerPrivacy, setComposerPrivacy] = useState<PrivacyMode>('FRIENDS')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<SocialMediaItem[]>([])
  const [mediaErrors, setMediaErrors] = useState<string[]>([])
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null)
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({
    'social-feed-1': true
  })
  const [statusBanner, setStatusBanner] = useState<{
    status: 'PENDING' | 'UNAVAILABLE'
    text: string
  } | null>(null)

  const addFileInputRef = useRef<HTMLInputElement>(null)
  const replaceFileInputRef = useRef<HTMLInputElement>(null)
  const activeObjectUrlsRef = useRef<Set<string>>(new Set())

  // Revoke every remaining object URL on unmount to guarantee zero memory leaks
  useEffect(() => {
    const urls = activeObjectUrlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const revokeObjectUrl = (url: string) => {
    if (activeObjectUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url)
      activeObjectUrlsRef.current.delete(url)
    }
  }

  const handleAddFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const { valid, errors } = validateImageFiles(files, selectedMedia.length)
    setMediaErrors(errors)

    if (valid.length > 0) {
      const nextItems: SocialMediaItem[] = valid.map((file, idx) => {
        const objectUrl = URL.createObjectURL(file)
        activeObjectUrlsRef.current.add(objectUrl)
        return {
          id: `local-media-${Date.now()}-${idx}`,
          src: objectUrl,
          alt: composerText.trim() || `Ảnh xem trước: ${file.name}`,
          isObjectUrl: true,
          fileName: file.name,
          fileSize: file.size
        }
      })
      setSelectedMedia((prev) => [...prev, ...nextItems])
    }

    // Reset input value so selecting the same file again triggers onChange
    e.target.value = ''
  }

  const handleRequestReplace = (id: string) => {
    setReplaceTargetId(id)
    replaceFileInputRef.current?.click()
  }

  const handleReplaceFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !replaceTargetId) return

    const { valid, errors } = validateImageFiles([files[0]], 0)
    setMediaErrors(errors)

    if (valid.length > 0) {
      const file = valid[0]
      const newUrl = URL.createObjectURL(file)
      activeObjectUrlsRef.current.add(newUrl)

      setSelectedMedia((prev) =>
        prev.map((item) => {
          if (item.id !== replaceTargetId) return item
          if (item.isObjectUrl) revokeObjectUrl(item.src)
          return {
            ...item,
            src: newUrl,
            alt: composerText.trim() || `Ảnh xem trước: ${file.name}`,
            isObjectUrl: true,
            fileName: file.name,
            fileSize: file.size
          }
        })
      )
    }

    setReplaceTargetId(null)
    e.target.value = ''
  }

  const handleRemoveMedia = (id: string) => {
    setSelectedMedia((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target?.isObjectUrl) revokeObjectUrl(target.src)
      return prev.filter((item) => item.id !== id)
    })
    setMediaErrors([])
  }

  const handleClearAllMedia = () => {
    selectedMedia.forEach((item) => {
      if (item.isObjectUrl) revokeObjectUrl(item.src)
    })
    setSelectedMedia([])
    setMediaErrors([])
  }

  const handleComposerSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (selectedMedia.length > 0) {
      const uploadCap = SOCIAL_CAPABILITY_MATRIX.photoUpload
      setStatusBanner({
        status: 'UNAVAILABLE',
        text: `${uploadCap.status}: Đã xem trước ${selectedMedia.length} ảnh cục bộ — ${uploadCap.note}`
      })
      return
    }
    const cap = SOCIAL_CAPABILITY_MATRIX.createPost
    setStatusBanner({
      status: 'PENDING',
      text: `${cap.status}: ${cap.label} (${cap.endpoint}) — ${cap.note}`
    })
  }

  const handleCycleMood = () => {
    const moods = ['Tập trung ✨', 'Vượt mốc 🎯', 'Đầy năng lượng 🔥', null]
    const nextIdx = (moods.indexOf(selectedMood) + 1) % moods.length
    setSelectedMood(moods[nextIdx])
  }

  const showCapabilityStatus = (key: keyof typeof SOCIAL_CAPABILITY_MATRIX) => {
    const cap = SOCIAL_CAPABILITY_MATRIX[key]
    setStatusBanner({
      status: cap.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'PENDING',
      text: `${cap.status}: ${cap.label}${cap.endpoint ? ` (${cap.endpoint})` : ''} — ${cap.note}`
    })
  }

  const canSubmit = composerText.trim().length > 0 || selectedMedia.length > 0

  return (
    <section
      className={`${styles.column} ${expandedWide ? styles.columnWide : ''}`.trim()}
      data-testid="social-feed-section"
      aria-label="Bảng tin Bạn bè LifeQuest"
    >
      {/* Hidden accessible file inputs for Add & Replace */}
      <input
        ref={addFileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-label="Chọn ảnh minh chứng từ thiết bị"
        data-testid="social-media-file-input"
        onChange={handleAddFilesChange}
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label="Thay thế ảnh minh chứng"
        data-testid="social-media-replace-input"
        onChange={handleReplaceFileChange}
      />

      {/* Approved Compact 2-Row Facebook-Style Composer (expands only while editing media) */}
      <form
        className={styles.composerCard}
        onSubmit={handleComposerSubmit}
        data-testid="social-composer-card"
        data-has-media={selectedMedia.length > 0 ? '1' : '0'}
      >
        <div className={styles.composerRow}>
          <span className={`${styles.composerAvatar} ${styles.avatar_teal}`} aria-hidden="true">
            {userInitial}
          </span>
          <label htmlFor="lq-social-composer" className="sr-only">
            Chia sẻ khoảnh khắc hoàn thành nhiệm vụ cùng bạn bè
          </label>
          <input
            id="lq-social-composer"
            className={styles.composerInput}
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            placeholder="Bạn vừa hoàn thành gì? Chia sẻ khoảnh khắc cùng bạn bè..."
          />
          <button
            type="submit"
            className={styles.postBtn}
            disabled={!canSubmit}
            aria-label="Đăng bài chia sẻ"
          >
            <Send size={13} aria-hidden="true" />
            <span>Đăng</span>
          </button>
        </div>

        {/* Expanded local media preview drawer (only shown when user selects image(s)) */}
        {selectedMedia.length > 0 && (
          <div className={styles.mediaDrawer} data-testid="composer-media-drawer">
            <div className={styles.mediaDrawerHead}>
              <span className={styles.mediaDrawerLabel}>
                Xem trước cục bộ ({selectedMedia.length}/{MAX_COMPOSER_IMAGES} ảnh • chưa tải lên máy chủ)
              </span>
              <div className={styles.mediaDrawerTools}>
                {selectedMedia.length < MAX_COMPOSER_IMAGES && (
                  <button
                    type="button"
                    className={styles.drawerToolBtn}
                    onClick={() => addFileInputRef.current?.click()}
                  >
                    <ImagePlus size={12} aria-hidden="true" />
                    <span>Thêm ảnh</span>
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.drawerToolBtn} ${styles.drawerClearBtn}`.trim()}
                  onClick={handleClearAllMedia}
                >
                  <Trash2 size={12} aria-hidden="true" />
                  <span>Xóa tất cả</span>
                </button>
              </div>
            </div>

            <SocialMediaGrid
              items={selectedMedia}
              editable
              onRemoveItem={handleRemoveMedia}
              onReplaceItem={handleRequestReplace}
            />
          </div>
        )}

        {mediaErrors.length > 0 && (
          <div className={styles.mediaErrorBox} role="alert" data-testid="social-media-error">
            {mediaErrors.map((msg) => (
              <div key={msg}>{msg}</div>
            ))}
          </div>
        )}

        <div className={styles.composerToolbar}>
          <div className={styles.toolbarLeft}>
            <button
              type="button"
              className={`${styles.toolChip} ${selectedMedia.length > 0 ? styles.toolChipActive : ''}`.trim()}
              onClick={() => addFileInputRef.current?.click()}
              data-testid="composer-add-photo-btn"
            >
              <Camera size={13} color="#168C78" aria-hidden="true" />
              <span>Ảnh minh chứng</span>
            </button>

            <button
              type="button"
              className={`${styles.toolChip} ${selectedMood ? styles.toolChipActive : ''}`.trim()}
              onClick={handleCycleMood}
            >
              <Smile size={13} color="#D49400" aria-hidden="true" />
              <span>{selectedMood ?? 'Cảm xúc'}</span>
            </button>

            <button
              type="button"
              className={styles.privacyChip}
              onClick={() =>
                setComposerPrivacy((p) => (p === 'FRIENDS' ? 'PRIVATE' : 'FRIENDS'))
              }
              title="Chế độ hiển thị bài viết"
            >
              <Lock size={11} aria-hidden="true" />
              <span>{composerPrivacy === 'FRIENDS' ? 'Bạn bè' : 'Riêng tư'}</span>
            </button>
          </div>

          <span className={styles.previewTag} title={SOCIAL_CAPABILITY_MATRIX.friendsFeed.note}>
            <Sparkles size={10} aria-hidden="true" />
            <span>Xem trước • PENDING</span>
          </span>
        </div>
      </form>

      {statusBanner && (
        <div
          className={`${styles.toast} ${
            statusBanner.status === 'UNAVAILABLE' ? styles.toastUnavailable : ''
          }`.trim()}
          role="status"
          data-testid="social-capability-status"
        >
          {statusBanner.text}
        </div>
      )}

      {/* Central Social Feed Cards reusing SocialMediaGrid + SocialMediaLightbox */}
      <div className={styles.feedList}>
        {SOCIAL_PREVIEW_POSTS.map((post) => {
          const asset = SOCIAL_MOCK_ASSETS[post.illustrationKey]
          const typeMeta = QUEST_TYPE_META[post.questType]
          const TypeIcon = typeMeta.Icon
          const commentsOpen = Boolean(openComments[post.id])

          const postMedia: SocialMediaItem[] = [
            {
              id: `${post.id}-media-0`,
              src: asset.src,
              alt: post.illustrationAlt,
              aspectRatio: 2, // 360x180 original SVG illustration
              isPreviewFixture: true
            }
          ]

          return (
            <article key={post.id} className={styles.postCard} data-testid="social-feed-post">
              <div className={styles.postHead}>
                <div className={styles.authorRow}>
                  <span
                    className={`${styles.avatar} ${styles[`avatar_${post.avatarTone}`]}`}
                    aria-hidden="true"
                  >
                    {getInitials(post.authorName)}
                  </span>
                  <div>
                    <div className={styles.authorLine}>
                      <span className={styles.authorName}>{post.authorName}</span>
                      <span className={styles.authorTag}>{post.authorTag}</span>
                    </div>
                    <div className={styles.metaLine}>
                      <span>{post.timeLabel}</span>
                      <span>•</span>
                      <span className={styles.privacyTag}>
                        <Lock size={10} aria-hidden="true" />
                        <span>{post.visibility === 'FRIENDS' ? 'Chỉ bạn bè' : 'Riêng tư'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={styles.questBadge}
                  style={{ background: typeMeta.softBg, color: typeMeta.color }}
                >
                  <TypeIcon size={12} strokeWidth={2.25} aria-hidden="true" />
                  <span>{post.questBadge}</span>
                </span>
              </div>

              <p className={styles.caption}>{post.caption}</p>

              <SocialMediaGrid items={postMedia} />

              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => showCapabilityStatus('reactions')}
                >
                  <Heart size={15} aria-hidden="true" />
                  <span>{post.likeCount} Cổ vũ</span>
                </button>

                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() =>
                    setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                  }
                  aria-expanded={commentsOpen}
                >
                  <MessageCircle size={15} aria-hidden="true" />
                  <span>{post.comments.length} Bình luận</span>
                </button>

                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => showCapabilityStatus('sharePost')}
                >
                  <Share2 size={15} aria-hidden="true" />
                  <span>Chia sẻ</span>
                </button>
              </div>

              {commentsOpen && (
                <div className={styles.commentsBox}>
                  {post.comments.map((c) => (
                    <div key={c.id} className={styles.commentItem}>
                      <span className={styles.commentAuthor}>{c.author}</span>
                      <span className={styles.commentText}>{c.text}</span>
                      <span className={styles.commentTime}>{c.timeLabel}</span>
                    </div>
                  ))}
                  <form
                    className={styles.commentForm}
                    onSubmit={(e) => {
                      e.preventDefault()
                      showCapabilityStatus('comments')
                    }}
                  >
                    <input
                      className={styles.commentInput}
                      placeholder="Bình luận sẽ mở khi đồng bộ Social API (PENDING)..."
                      aria-label={`Bình luận cho bài của ${post.authorName}`}
                    />
                    <button type="submit" className={styles.commentSendBtn}>
                      Gửi
                    </button>
                  </form>
                </div>
              )}
            </article>
          )
        })}
      </div>

      <div className={styles.paginationWrap}>
        <button
          type="button"
          className={styles.loadMoreBtn}
          onClick={() => showCapabilityStatus('friendsFeed')}
        >
          Tải thêm bài viết (PENDING • Cursor Pagination)
        </button>
      </div>
    </section>
  )
}
