import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Maximize2, Minus, Users, X } from 'lucide-react'
import {
  SocialMediaLightbox,
  type LightboxMediaItem
} from '@/features/dashboard/media/SocialMediaLightbox'
import { useMessengerStore, type DockSide } from '@/stores/messengerStore'
import { ChatTimeline } from '../ChatTimeline'
import { MessageComposer } from '../MessageComposer'
import type { ChatImageItem } from '../messengerTypes'
import styles from './FloatingChat.module.css'

export interface FloatingChatWindowProps {
  conversationId: string
  dockSide: DockSide
  isFoxVisible: boolean
  isMobile: boolean
  onMinimize: () => void
  onClose: (convId: string) => void
}

const EMPTY_MESSAGES: never[] = []
const EMPTY_ATTACHMENTS: never[] = []

export function FloatingChatWindow({
  conversationId,
  dockSide,
  isFoxVisible: _isFoxVisible,
  isMobile,
  onMinimize,
  onClose
}: FloatingChatWindowProps) {
  const navigate = useNavigate()

  // Targeted selectors prevent unrelated store updates from rerendering the window or bubbles
  const conversation = useMessengerStore((s) =>
    s.conversations.find((c) => c.id === conversationId) ?? null
  )
  const messages = useMessengerStore((s) => s.messagesByConv[conversationId] ?? EMPTY_MESSAGES)
  const draft = useMessengerStore((s) => s.draftsByConv[conversationId] ?? '')
  const attachments = useMessengerStore(
    (s) => s.attachmentsByConv[conversationId] ?? EMPTY_ATTACHMENTS
  )
  const setDraft = useMessengerStore((s) => s.setDraft)
  const addAttachments = useMessengerStore((s) => s.addAttachments)
  const removeAttachment = useMessengerStore((s) => s.removeAttachment)
  const sendLocalPreviewMessage = useMessengerStore((s) => s.sendLocalPreviewMessage)
  const selectMessengerConversation = useMessengerStore((s) => s.selectMessengerConversation)

  const [lightboxState, setLightboxState] = useState<{
    items: LightboxMediaItem[]
    activeIndex: number
  } | null>(null)

  // Escape minimizes floating chat window cleanly (unless lightbox is open)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lightboxState) {
        e.preventDefault()
        onMinimize()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxState, onMinimize])

  const handleOpenImage = useCallback(
    (images: ChatImageItem[], index: number, author: string, timeLabel: string) => {
      const items: LightboxMediaItem[] = images.map((img) => ({
        id: img.id,
        src: img.src,
        alt: img.alt,
        source: img.isLocalObjectUrl ? 'UPLOAD_PREVIEW' : 'MOCK_ILLUSTRATION',
        author,
        capturedAt: timeLabel,
        isDemo: true
      }))
      setLightboxState({ items, activeIndex: index })
    },
    []
  )

  const handleOpenFullMessenger = () => {
    selectMessengerConversation(conversationId)
    navigate(`/messages?conv=${encodeURIComponent(conversationId)}`)
  }

  if (!conversation) return null

  // Anchor the floating chat window snugly beside the bubble dock on either edge.
  void _isFoxVisible
  const desktopStyle: CSSProperties = isMobile
    ? {}
    : dockSide === 'left'
      ? { left: 74, bottom: 18 }
      : { right: 74, bottom: 18 }

  return (
    <>
      {isMobile && (
        <div
          className={styles.mobileBackdrop}
          onClick={onMinimize}
          aria-hidden="true"
          data-testid="floating-chat-mobile-backdrop"
        />
      )}

      <section
        className={`${styles.chatWindow} ${isMobile ? styles.chatWindowMobile : ''}`.trim()}
        style={desktopStyle}
        role="dialog"
        aria-label={`Cửa sổ trò chuyện nổi với ${conversation.title}`}
        aria-modal={isMobile ? 'true' : 'false'}
        data-testid="floating-chat-window"
        data-conversation-id={conversation.id}
        data-dock-side={dockSide}
        data-fox-safe="true"
      >
        <header className={styles.windowHeader} data-testid="floating-chat-window-header">
          <div className={styles.windowHeaderLeft}>
            <span
              className={`${styles.windowAvatar} ${styles[`tone_${conversation.avatarTone}`]}`}
              aria-hidden="true"
            >
              {conversation.type === 'GROUP' && conversation.groupBadges
                ? conversation.groupBadges[0]
                : conversation.avatarInitials}
            </span>

            <div className={styles.windowMeta}>
              <h2 className={styles.windowTitle}>{conversation.title}</h2>
              <span className={styles.windowSub}>
                {conversation.type === 'GROUP' ? (
                  <>
                    <Users size={11} aria-hidden="true" />
                    <span>{conversation.members.length} thành viên</span>
                  </>
                ) : (
                  <span>{conversation.subtitle}</span>
                )}
                <span className={styles.previewPill}>PREVIEW</span>
              </span>
            </div>
          </div>

          <div className={styles.windowActions}>
            <button
              type="button"
              className={styles.windowIconBtn}
              onClick={handleOpenFullMessenger}
              aria-label="Mở trong Tin nhắn đầy đủ"
              title="Mở toàn màn hình"
              data-testid="floating-chat-open-full-btn"
            >
              <Maximize2 size={15} aria-hidden="true" />
            </button>

            <button
              type="button"
              className={styles.windowIconBtn}
              onClick={onMinimize}
              aria-label={`Thu nhỏ trò chuyện ${conversation.title}`}
              title="Thu nhỏ thành bong bóng (Esc)"
              data-testid="floating-chat-minimize-btn"
            >
              <Minus size={16} aria-hidden="true" />
            </button>

            <button
              type="button"
              className={styles.windowIconBtn}
              onClick={() => onClose(conversation.id)}
              aria-label={`Đóng bong bóng ${conversation.title}`}
              title="Đóng bong bóng này"
              data-testid="floating-chat-close-btn"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className={styles.windowBody}>
          <ChatTimeline
            conversation={conversation}
            messages={messages}
            onOpenImage={handleOpenImage}
            onNavigateQuest={(route) => {
              onMinimize()
              navigate(route)
            }}
          />

          <MessageComposer
            conversationTitle={conversation.title}
            draft={draft}
            attachments={attachments}
            onDraftChange={(next) => setDraft(conversation.id, next)}
            onAddFiles={(files) => addAttachments(conversation.id, files)}
            onRemoveAttachment={(attId) => removeAttachment(conversation.id, attId)}
            onSend={() => sendLocalPreviewMessage(conversation.id)}
          />
        </div>
      </section>

      {lightboxState && (
        <SocialMediaLightbox
          items={lightboxState.items}
          activeIndex={lightboxState.activeIndex}
          onSelectIndex={(idx) =>
            setLightboxState((prev) => (prev ? { ...prev, activeIndex: idx } : null))
          }
          onClose={() => setLightboxState(null)}
          onNavigate={(route) => {
            setLightboxState(null)
            onMinimize()
            navigate(route)
          }}
        />
      )}
    </>
  )
}
