import { memo, useEffect, useRef } from 'react'
import { ArrowUpRight, Compass, Flame, Lock, Sparkles, Trophy } from 'lucide-react'
import type { ChatImageItem, ChatMessage, Conversation } from './messengerTypes'
import styles from './MessagesPage.module.css'

export interface ChatTimelineProps {
  conversation: Conversation
  messages: ChatMessage[]
  onOpenImage: (images: ChatImageItem[], index: number, author: string, timeLabel: string) => void
  onNavigateQuest: (route: string) => void
}

export const ChatTimeline = memo(function ChatTimeline({
  conversation,
  messages,
  onOpenImage,
  onNavigateQuest
}: ChatTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'auto', block: 'end' })
  }, [conversation.id, messages.length])

  if (messages.length === 0) {
    return (
      <div
        className={styles.timelineEmpty}
        role="log"
        aria-live="polite"
        data-testid="messenger-empty-timeline"
      >
        <div className={`${styles.emptyAvatar} ${styles[`tone_${conversation.avatarTone}`]}`}>
          {conversation.avatarInitials}
        </div>
        <h3 className={styles.emptyTitle}>Bắt đầu trò chuyện với {conversation.title}</h3>
        <p className={styles.emptySub}>
          Gửi lời chào, chia sẻ khoảnh khắc học tập hoặc mời bạn cùng hoàn thành Quest.
          <br />
          <em>(FE-06A đang chạy mô phỏng cục bộ — chưa gửi lên máy chủ.)</em>
        </p>
      </div>
    )
  }

  return (
    <div
      className={styles.timeline}
      role="log"
      aria-live="polite"
      aria-label={`Lịch sử tin nhắn với ${conversation.title}`}
      data-testid="messenger-timeline"
    >
      {messages.map((msg, idx) => {
        const prev = idx > 0 ? messages[idx - 1] : null
        const next = idx < messages.length - 1 ? messages[idx + 1] : null
        const showDateSep = !prev || prev.dateGroupLabel !== msg.dateGroupLabel

        if (msg.kind === 'SYSTEM') {
          return (
            <div key={msg.id} className={styles.messageBlock}>
              {showDateSep && (
                <div className={styles.dateSeparator} role="separator">
                  <span>{msg.dateGroupLabel}</span>
                </div>
              )}
              <div className={styles.systemNotice} data-testid="messenger-system-notice">
                <Sparkles size={13} aria-hidden="true" />
                <span>{msg.text}</span>
              </div>
            </div>
          )
        }

        const isGroupedWithPrev =
          !showDateSep &&
          prev !== null &&
          prev.kind !== 'SYSTEM' &&
          prev.senderId === msg.senderId

        const isGroupedWithNext =
          next !== null &&
          next.kind !== 'SYSTEM' &&
          next.dateGroupLabel === msg.dateGroupLabel &&
          next.senderId === msg.senderId

        const showSenderHeader =
          !msg.isSelf && conversation.type === 'GROUP' && !isGroupedWithPrev

        return (
          <div
            key={msg.id}
            className={`${styles.messageBlock} ${isGroupedWithPrev ? styles.messageGrouped : ''}`.trim()}
            data-testid="messenger-message-row"
            data-grouped={isGroupedWithPrev ? 'true' : 'false'}
            data-self={msg.isSelf ? 'true' : 'false'}
          >
            {showDateSep && (
              <div className={styles.dateSeparator} role="separator">
                <span>{msg.dateGroupLabel}</span>
              </div>
            )}

            <div className={`${styles.bubbleRow} ${msg.isSelf ? styles.bubbleRowSelf : ''}`.trim()}>
              {!msg.isSelf && (
                <div className={styles.rowAvatarSlot} aria-hidden="true">
                  {!isGroupedWithNext && (
                    <span className={`${styles.miniAvatar} ${styles[`tone_${msg.senderTone}`]}`}>
                      {msg.senderInitials}
                    </span>
                  )}
                </div>
              )}

              <div className={`${styles.bubbleStack} ${msg.isSelf ? styles.bubbleStackSelf : ''}`.trim()}>
                {showSenderHeader && (
                  <span className={styles.senderName}>{msg.senderName}</span>
                )}

                {/* Text / Mixed Text Bubble */}
                {msg.text && (
                  <div
                    className={`${styles.bubble} ${msg.isSelf ? styles.bubbleSelf : styles.bubbleIncoming} ${isGroupedWithPrev ? styles.bubbleContTop : ''} ${isGroupedWithNext ? styles.bubbleContBottom : ''}`.trim()}
                  >
                    <p className={styles.bubbleText}>{msg.text}</p>
                  </div>
                )}

                {/* Image / Multi-Image Locket-Style Grid */}
                {msg.images && msg.images.length > 0 && (
                  <div
                    className={`${styles.mediaGrid} ${msg.images.length > 1 ? styles.mediaGridMulti : ''}`.trim()}
                    data-testid="messenger-media-grid"
                  >
                    {msg.images.map((img, imgIdx) => (
                      <button
                        key={img.id}
                        type="button"
                        className={styles.mediaThumbBtn}
                        onClick={() =>
                          onOpenImage(msg.images!, imgIdx, msg.senderName, msg.timeLabel)
                        }
                        aria-label={`Xem ảnh: ${img.alt}`}
                        data-testid={`messenger-image-${img.id}`}
                      >
                        <img src={img.src} alt={img.alt} className={styles.mediaThumbImg} />
                        {img.isLocalObjectUrl && (
                          <span className={styles.localImgTag}>Cục bộ</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Embedded Quest Invitation Preview Card */}
                {msg.kind === 'QUEST_INVITE' && msg.questInvite && (
                  <div className={styles.embeddedCard} data-testid="messenger-quest-invite-card">
                    <div className={styles.embeddedHead}>
                      <span className={styles.embeddedIconPeach} aria-hidden="true">
                        <Compass size={14} />
                      </span>
                      <span className={styles.embeddedType}>Lời mời Quest • Xem trước (FE-06B)</span>
                    </div>
                    <div className={styles.embeddedTitle}>{msg.questInvite.title}</div>
                    <div className={styles.embeddedMeta}>
                      Từ {msg.questInvite.inviterName} • {msg.questInvite.participantCount} người • Hạn{' '}
                      {msg.questInvite.deadlineLabel}
                    </div>
                    <div className={styles.embeddedActions}>
                      <button
                        type="button"
                        className={styles.embeddedBtnPrimary}
                        onClick={() => onNavigateQuest(msg.questInvite!.targetRoute)}
                      >
                        <span>Mở mục Quest</span>
                        <ArrowUpRight size={13} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={styles.embeddedBtnDisabled}
                        disabled
                        title="Xác nhận tham gia Quest đang chờ Backend Invitation API (FE-06B)"
                      >
                        <Lock size={11} aria-hidden="true" />
                        <span>Tham gia (Chờ API)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Embedded Duo / Group Challenge Preview Card */}
                {msg.kind === 'CHALLENGE' && msg.challenge && (
                  <div className={styles.embeddedCard} data-testid="messenger-challenge-card">
                    <div className={styles.embeddedHead}>
                      <span className={styles.embeddedIconGold} aria-hidden="true">
                        <Trophy size={14} />
                      </span>
                      <span className={styles.embeddedType}>
                        Thử thách {msg.challenge.mode === 'GROUP' ? 'Nhóm' : 'Đôi'} • Xem trước (FE-06B)
                      </span>
                    </div>
                    <div className={styles.embeddedTitle}>{msg.challenge.title}</div>
                    <div className={styles.embeddedMeta}>
                      {msg.challenge.goalLabel} • {msg.challenge.durationLabel}
                    </div>
                    <div className={styles.embeddedStatusRow}>
                      <Flame size={12} aria-hidden="true" />
                      <span>{msg.challenge.progressLabel}</span>
                    </div>
                  </div>
                )}

                {/* Timestamp & Honest Local Simulation Label (no fabricated read receipts) */}
                {!isGroupedWithNext && (
                  <div className={styles.msgFooter}>
                    <span className={styles.msgTime}>{msg.timeLabel}</span>
                    {msg.isLocalPreviewSimulation && (
                      <span
                        className={styles.localSimBadge}
                        data-testid="messenger-local-sim-badge"
                      >
                        Mô phỏng cục bộ (chưa gửi máy chủ)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
})
