import { memo } from 'react'
import { X } from 'lucide-react'
import type { DockSide } from '@/stores/messengerStore'
import type { Conversation } from '../messengerTypes'
import styles from './FloatingChat.module.css'

export interface FloatingChatBubbleProps {
  conversation: Conversation
  isActive: boolean
  dockSide: DockSide
  onActivate: (convId: string) => void
  onClose: (convId: string) => void
  buttonRef?: (el: HTMLButtonElement | null) => void
}

export const FloatingChatBubble = memo(function FloatingChatBubble({
  conversation,
  isActive,
  dockSide,
  onActivate,
  onClose,
  buttonRef
}: FloatingChatBubbleProps) {
  const unreadText =
    conversation.unreadCount > 0
      ? `, ${conversation.unreadCount} tin nhắn chưa đọc (chế độ xem trước)`
      : ''
  const typeLabel = conversation.type === 'GROUP' ? 'Nhóm' : 'Trò chuyện với'
  const ariaLabel = `${typeLabel} ${conversation.title}${unreadText}${isActive ? ' — đang mở' : ''}`

  return (
    <div
      className={styles.bubbleItem}
      data-testid={`floating-chat-bubble-${conversation.id}`}
      data-active={isActive ? 'true' : 'false'}
      data-conversation-type={conversation.type}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.bubbleBtn} ${styles[`tone_${conversation.avatarTone}`]} ${isActive ? styles.bubbleBtnActive : ''}`.trim()}
        onClick={() => onActivate(conversation.id)}
        aria-label={ariaLabel}
        aria-pressed={isActive}
        data-testid={`floating-chat-bubble-btn-${conversation.id}`}
      >
        {/* Subtle signature Fox-ear silhouette peeking above bubble */}
        <svg
          className={`${styles.foxEars} ${isActive ? styles.foxEarsVisible : ''}`.trim()}
          viewBox="0 0 48 14"
          width="44"
          height="13"
          aria-hidden="true"
        >
          <path d="M5 13 L10 1 L18 10 Z" fill="#e55a28" stroke="#fff7ec" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M8.5 11 L11 4.5 L15 9.5 Z" fill="#ffe6cc" />
          <path d="M43 13 L38 1 L30 10 Z" fill="#e55a28" stroke="#fff7ec" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M39.5 11 L37 4.5 L33 9.5 Z" fill="#ffe6cc" />
        </svg>

        {conversation.type === 'GROUP' && conversation.groupBadges ? (
          <span className={styles.groupAvatarWrap} aria-hidden="true">
            <span className={styles.groupPrimary}>{conversation.groupBadges[0]}</span>
            <span className={styles.groupSecondary}>{conversation.groupBadges[1]}</span>
          </span>
        ) : (
          <span aria-hidden="true">{conversation.avatarInitials}</span>
        )}

        {conversation.unreadCount > 0 && (
          <span
            className={styles.unreadBadge}
            aria-label={`${conversation.unreadCount} tin nhắn chưa đọc`}
            data-testid={`floating-chat-unread-${conversation.id}`}
          >
            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
          </span>
        )}
      </button>

      {/* Non-nested sibling close control for accessibility */}
      <button
        type="button"
        className={styles.bubbleCloseBtn}
        onClick={(e) => {
          e.stopPropagation()
          onClose(conversation.id)
        }}
        aria-label={`Đóng bong bóng ${conversation.title}`}
        title={`Đóng bong bóng ${conversation.title}`}
        data-testid={`floating-chat-bubble-close-${conversation.id}`}
      >
        <X size={11} aria-hidden="true" />
      </button>

      <span
        className={`${styles.bubbleTooltip} ${dockSide === 'left' ? styles.tooltipRight : styles.tooltipLeft}`}
        role="tooltip"
      >
        {conversation.title}
        {conversation.unreadCount > 0 ? ` (${conversation.unreadCount} mới)` : ''}
      </span>
    </div>
  )
})
