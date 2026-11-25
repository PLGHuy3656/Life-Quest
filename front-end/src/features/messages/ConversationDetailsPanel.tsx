import {
  ArrowUpRight,
  Bell,
  BellOff,
  Compass,
  Flame,
  Image as ImageIcon,
  Lock,
  UserPlus,
  Users,
  X
} from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import type { ChatImageItem, Conversation } from './messengerTypes'
import styles from './MessagesPage.module.css'

export interface ConversationDetailsPanelProps {
  conversation: Conversation
  sharedImages: ChatImageItem[]
  onClose: () => void
  onToggleMute: (conversationId: string) => void
  onOpenImage: (images: ChatImageItem[], index: number) => void
  onNavigate: (route: string) => void
}

export function ConversationDetailsPanel({
  conversation,
  sharedImages,
  onClose,
  onToggleMute,
  onOpenImage,
  onNavigate
}: ConversationDetailsPanelProps) {
  const isGroup = conversation.type === 'GROUP'

  return (
    <aside
      className={styles.detailsPanel}
      aria-label="Chi tiết cuộc trò chuyện"
      data-testid="messenger-details-panel"
    >
      <div className={styles.detailsTopBar}>
        <h2 className={styles.detailsHeading}>Chi tiết</h2>
        <button
          type="button"
          className={styles.iconActionBtn}
          onClick={onClose}
          aria-label="Đóng bảng chi tiết"
          data-testid="messenger-close-details-btn"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.detailsScroll}>
        {/* Identity Summary */}
        <div className={styles.detailsIdentity}>
          {isGroup && conversation.groupBadges ? (
            <span className={styles.groupAvatarLg} aria-hidden="true">
              <span className={`${styles.groupAvatarPrimary} ${styles[`tone_${conversation.avatarTone}`]}`}>
                {conversation.groupBadges[0]}
              </span>
              <span className={styles.groupAvatarSecondary}>{conversation.groupBadges[1]}</span>
            </span>
          ) : (
            <span
              className={`${styles.avatarCircleLg} ${styles[`tone_${conversation.avatarTone}`]}`}
              aria-hidden="true"
            >
              {conversation.avatarInitials}
            </span>
          )}
          <h3 className={styles.detailsTitle}>{conversation.title}</h3>
          <p className={styles.detailsSub}>{conversation.subtitle}</p>

          <div className={styles.detailsQuickRow}>
            <button
              type="button"
              className={styles.detailsQuickBtn}
              onClick={() => onToggleMute(conversation.id)}
              aria-pressed={conversation.muted}
              data-testid="messenger-mute-btn"
            >
              {conversation.muted ? (
                <>
                  <BellOff size={15} aria-hidden="true" />
                  <span>Đang tắt</span>
                </>
              ) : (
                <>
                  <Bell size={15} aria-hidden="true" />
                  <span>Thông báo</span>
                </>
              )}
            </button>

            {isGroup ? (
              <button
                type="button"
                className={styles.detailsQuickBtnDisabled}
                disabled
                title="Thêm thành viên vào nhóm đang chờ Backend Group API (FE-06B)"
              >
                <UserPlus size={15} aria-hidden="true" />
                <span>Thêm (Chờ API)</span>
              </button>
            ) : (
              <button
                type="button"
                className={styles.detailsQuickBtn}
                onClick={() => onNavigate('/profile')}
                data-testid="messenger-profile-shortcut-btn"
              >
                <ArrowUpRight size={15} aria-hidden="true" />
                <span>Hồ sơ</span>
              </button>
            )}
          </div>
        </div>

        {/* Streak Preview Section (FE-06C boundary) */}
        <section className={styles.detailsSection} aria-label="Trạng thái chuỗi">
          <div className={styles.detailsSecHead}>
            <Flame size={14} className={styles.accentIcon} aria-hidden="true" />
            <span>{isGroup ? 'Chuỗi nhóm' : 'Chuỗi tình bạn'}</span>
            <Chip tone="neutral">FE-06C</Chip>
          </div>
          <p className={styles.detailsNote}>
            {conversation.streakLabel}. Số ngày chuỗi và hiệu ứng Fox chỉ cập nhật từ Backend Streak
            API — không tự cộng từ tin nhắn cục bộ.
          </p>
        </section>

        {/* Group Members List */}
        {isGroup && (
          <section className={styles.detailsSection} aria-label="Thành viên nhóm">
            <div className={styles.detailsSecHead}>
              <Users size={14} className={styles.accentIcon} aria-hidden="true" />
              <span>Thành viên ({conversation.members.length})</span>
            </div>
            <ul className={styles.memberList}>
              {conversation.members.map((m) => (
                <li key={m.id} className={styles.memberRow}>
                  <span
                    className={`${styles.miniAvatar} ${styles[`tone_${m.tone}`]}`}
                    aria-hidden="true"
                  >
                    {m.initials}
                  </span>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{m.name}</span>
                    <span className={styles.memberTag}>{m.tagline}</span>
                  </div>
                  {m.role === 'OWNER' && <span className={styles.ownerBadge}>Trưởng nhóm</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Shared Photos Gallery */}
        <section className={styles.detailsSection} aria-label="Ảnh đã chia sẻ">
          <div className={styles.detailsSecHead}>
            <ImageIcon size={14} className={styles.accentIcon} aria-hidden="true" />
            <span>Ảnh chia sẻ ({sharedImages.length})</span>
          </div>
          {sharedImages.length === 0 ? (
            <p className={styles.detailsNote}>Chưa có ảnh nào trong cuộc trò chuyện này.</p>
          ) : (
            <div className={styles.sharedMediaGrid} data-testid="messenger-shared-media-grid">
              {sharedImages.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  className={styles.sharedMediaBtn}
                  onClick={() => onOpenImage(sharedImages, i)}
                  aria-label={`Mở ảnh chia sẻ: ${img.alt}`}
                >
                  <img src={img.src} alt={img.alt} className={styles.sharedMediaImg} />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Shared Quests Preview */}
        <section className={styles.detailsSection} aria-label="Quest chung">
          <div className={styles.detailsSecHead}>
            <Compass size={14} className={styles.accentIcon} aria-hidden="true" />
            <span>Quest đồng hành ({conversation.sharedQuests.length})</span>
          </div>
          {conversation.sharedQuests.length === 0 ? (
            <p className={styles.detailsNote}>Chưa có Quest chung nào.</p>
          ) : (
            <div className={styles.sharedQuestList}>
              {conversation.sharedQuests.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className={styles.sharedQuestItem}
                  onClick={() => onNavigate(q.route)}
                >
                  <span className={styles.sharedQuestTitle}>{q.title}</span>
                  <span className={styles.sharedQuestMeta}>
                    <Lock size={11} aria-hidden="true" />
                    <span>{q.statusLabel}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  )
}
