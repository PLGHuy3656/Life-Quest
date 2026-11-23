import { useState, type FormEvent } from 'react'
import {
  Camera,
  Heart,
  Lock,
  MessageCircle,
  Send,
  Share2,
  Smile,
  Sparkles
} from 'lucide-react'
import { SOCIAL_MOCK_ASSETS } from '@/assets/social'
import { QUEST_TYPE_META } from '@/components/ui/questIconMeta'
import {
  SOCIAL_CAPABILITY_MATRIX,
  type SocialFeedPost
} from '@/services/api/socialContracts'
import type { PrivacyMode } from '@/types/domain'
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
 * Approved Social-First Home Dashboard feed (FE-03.5I).
 * Clearly separates LIVE / PENDING / UNAVAILABLE capabilities — never fakes
 * real social posting, reactions, comments, or sharing while Backend Social API is PENDING.
 */
export function SocialFeedSection({ expandedWide, userInitial }: SocialFeedSectionProps) {
  const [composerText, setComposerText] = useState('')
  const [composerPrivacy, setComposerPrivacy] = useState<PrivacyMode>('FRIENDS')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({
    'social-feed-1': true
  })
  const [statusBanner, setStatusBanner] = useState<{
    status: 'PENDING' | 'UNAVAILABLE'
    text: string
  } | null>(null)

  const handleComposerSubmit = (e: FormEvent) => {
    e.preventDefault()
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

  return (
    <section
      className={`${styles.column} ${expandedWide ? styles.columnWide : ''}`.trim()}
      data-testid="social-feed-section"
      aria-label="Bảng tin Bạn bè LifeQuest"
    >
      {/* Approved Compact 2-Row Facebook-Style Composer */}
      <form
        className={styles.composerCard}
        onSubmit={handleComposerSubmit}
        data-testid="social-composer-card"
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
            disabled={!composerText.trim()}
            aria-label="Đăng bài chia sẻ"
          >
            <Send size={13} aria-hidden="true" />
            <span>Đăng</span>
          </button>
        </div>

        <div className={styles.composerToolbar}>
          <div className={styles.toolbarLeft}>
            <button
              type="button"
              className={styles.toolChip}
              onClick={() => showCapabilityStatus('photoUpload')}
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

          <span
            className={styles.previewTag}
            title={SOCIAL_CAPABILITY_MATRIX.friendsFeed.note}
          >
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

      {/* Central Social Feed Cards */}
      <div className={styles.feedList}>
        {SOCIAL_PREVIEW_POSTS.map((post) => {
          const asset = SOCIAL_MOCK_ASSETS[post.illustrationKey]
          const typeMeta = QUEST_TYPE_META[post.questType]
          const TypeIcon = typeMeta.Icon
          const commentsOpen = Boolean(openComments[post.id])

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

              <div className={styles.mediaWrap}>
                <img src={asset.src} alt={post.illustrationAlt} className={styles.mediaImg} />
                <span className={styles.previewWatermark}>Ảnh minh họa • Preview</span>
              </div>

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
