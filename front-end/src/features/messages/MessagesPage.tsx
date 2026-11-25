import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Compass,
  Info,
  Lock,
  MessageCircle,
  PanelRight,
  PictureInPicture2,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  SocialMediaLightbox,
  type LightboxMediaItem
} from '@/features/dashboard/media/SocialMediaLightbox'
import { useMessengerStore } from '@/stores/messengerStore'
import { ChatTimeline } from './ChatTimeline'
import { ConversationDetailsPanel } from './ConversationDetailsPanel'
import { ConversationSidebar } from './ConversationSidebar'
import { ChatBubbleSettings } from './floating/ChatBubbleSettings'
import floatingStyles from './floating/FloatingChat.module.css'
import { MessageComposer } from './MessageComposer'
import type {
  ChatImageItem,
  ConversationFilter,
  MessengerViewState
} from './messengerTypes'
import styles from './MessagesPage.module.css'

const EMPTY_MESSAGES: never[] = []
const EMPTY_ATTACHMENTS: never[] = []

export function MessagesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const queryState = searchParams.get('state')
  const queryConvId = searchParams.get('conv')
  const viewState: MessengerViewState =
    queryState === 'empty'
      ? 'EMPTY'
      : queryState === 'pending'
        ? 'PENDING_API'
        : queryState === 'unauthorized'
          ? 'UNAUTHORIZED'
          : 'READY'

  // Shared messaging state (single source of truth with FloatingChatHost)
  const conversations = useMessengerStore((s) => s.conversations)
  const messagesByConv = useMessengerStore((s) => s.messagesByConv)
  const draftsByConv = useMessengerStore((s) => s.draftsByConv)
  const attachmentsByConv = useMessengerStore((s) => s.attachmentsByConv)
  const selectedId = useMessengerStore((s) => s.selectedMessengerId)
  const selectMessengerConversation = useMessengerStore((s) => s.selectMessengerConversation)
  const toggleMuteConversation = useMessengerStore((s) => s.toggleMuteConversation)
  const setDraft = useMessengerStore((s) => s.setDraft)
  const addAttachments = useMessengerStore((s) => s.addAttachments)
  const removeAttachment = useMessengerStore((s) => s.removeAttachment)
  const sendLocalPreviewMessage = useMessengerStore((s) => s.sendLocalPreviewMessage)
  const openFloatingConversation = useMessengerStore((s) => s.openFloatingConversation)

  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<ConversationFilter>('ALL')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [bubbleMenuOpen, setBubbleMenuOpen] = useState(false)
  const [mobilePane, setMobilePane] = useState<'list' | 'chat' | 'details'>('list')
  const [pendingToast, setPendingToast] = useState<string | null>(null)
  const [lightboxState, setLightboxState] = useState<{
    items: LightboxMediaItem[]
    activeIndex: number
  } | null>(null)

  const bubbleMenuWrapRef = useRef<HTMLDivElement>(null)

  // Support deep-link /messages?conv=<id> from FloatingChatWindow "Mở toàn màn hình"
  useEffect(() => {
    if (!queryConvId) return
    const exists = useMessengerStore.getState().conversations.some((c) => c.id === queryConvId)
    if (exists) {
      selectMessengerConversation(queryConvId)
      setMobilePane('chat')
    }
  }, [queryConvId, selectMessengerConversation])

  // Dismiss details drawer on Escape for narrow viewports
  useEffect(() => {
    if (!detailsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && window.innerWidth < 1280) {
        setDetailsOpen(false)
        setMobilePane('chat')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailsOpen])

  // Close floating-bubble settings popover on Escape or outside click
  useEffect(() => {
    if (!bubbleMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBubbleMenuOpen(false)
    }
    const onPointerDown = (e: MouseEvent) => {
      if (bubbleMenuWrapRef.current && !bubbleMenuWrapRef.current.contains(e.target as Node)) {
        setBubbleMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [bubbleMenuOpen])

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return conversations.filter((conv) => {
      if (filter !== 'ALL' && conv.type !== filter) return false
      if (!q) return true
      return (
        conv.title.toLowerCase().includes(q) ||
        conv.lastMessagePreview.toLowerCase().includes(q) ||
        conv.members.some((m) => m.name.toLowerCase().includes(q))
      )
    })
  }, [conversations, filter, searchQuery])

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  )

  const activeMessages = useMemo(
    () => (activeConversation ? (messagesByConv[activeConversation.id] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES),
    [activeConversation, messagesByConv]
  )

  const activeSharedImages = useMemo<ChatImageItem[]>(() => {
    const list: ChatImageItem[] = []
    for (const msg of activeMessages) {
      if (msg.images) list.push(...msg.images)
    }
    return list
  }, [activeMessages])

  const activeDraft = activeConversation ? (draftsByConv[activeConversation.id] ?? '') : ''
  const activeAttachments = activeConversation
    ? (attachmentsByConv[activeConversation.id] ?? EMPTY_ATTACHMENTS)
    : EMPTY_ATTACHMENTS

  const handleSelectConversation = useCallback(
    (id: string) => {
      selectMessengerConversation(id)
      setMobilePane('chat')
    },
    [selectMessengerConversation]
  )

  const handleDraftChange = useCallback(
    (next: string) => {
      if (!selectedId) return
      setDraft(selectedId, next)
    },
    [selectedId, setDraft]
  )

  const handleAddFiles = useCallback(
    (files: FileList) => {
      if (!selectedId) return
      addAttachments(selectedId, files)
    },
    [selectedId, addAttachments]
  )

  const handleRemoveAttachment = useCallback(
    (attId: string) => {
      if (!selectedId) return
      removeAttachment(selectedId, attId)
    },
    [selectedId, removeAttachment]
  )

  const handleSendLocalPreview = useCallback(() => {
    if (!activeConversation) return
    sendLocalPreviewMessage(activeConversation.id)
  }, [activeConversation, sendLocalPreviewMessage])

  const handleOpenImage = useCallback(
    (images: ChatImageItem[], index: number, author?: string, timeLabel?: string) => {
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

  const handleNewConversationHint = useCallback(() => {
    setPendingToast(
      'Tạo nhóm mới & mời bạn bè thuộc FE-06B và đang chờ Backend Messaging API.'
    )
  }, [])

  const handlePopOutBubble = useCallback(() => {
    if (!activeConversation) return
    openFloatingConversation(activeConversation.id, { expand: false, forceEnable: true })
    setPendingToast(
      `Đã ghim "${activeConversation.title}" vào Bong bóng chat nổi (hiển thị xuyên suốt các trang).`
    )
  }, [activeConversation, openFloatingConversation])

  const handleClearStateParam = () => {
    setSearchParams({})
  }

  // Dedicated honest states (Empty / Pending API / Unauthorized)
  if (viewState !== 'READY') {
    return (
      <section
        className={styles.stateShell}
        aria-label="Trạng thái hộp thư Tin nhắn"
        data-testid={`messenger-state-${viewState.toLowerCase()}`}
      >
        <div className={styles.stateCard}>
          <div className={styles.stateIconWrap} aria-hidden="true">
            {viewState === 'UNAUTHORIZED' ? (
              <ShieldAlert size={28} color="#c84b1e" />
            ) : viewState === 'PENDING_API' ? (
              <AlertTriangle size={28} color="#c78a00" />
            ) : (
              <MessageCircle size={28} color="#16324a" />
            )}
          </div>
          <h1 className={styles.stateTitle}>
            {viewState === 'UNAUTHORIZED'
              ? 'Không có quyền truy cập cuộc trò chuyện'
              : viewState === 'PENDING_API'
                ? 'Messaging Backend API đang chờ tích hợp'
                : 'Chưa có cuộc trò chuyện nào'}
          </h1>
          <p className={styles.stateDesc}>
            {viewState === 'UNAUTHORIZED'
              ? 'Bạn không nằm trong danh sách thành viên được ủy quyền của hội thoại này hoặc phiên đăng nhập đã hết hạn.'
              : viewState === 'PENDING_API'
                ? 'Hạ tầng nhắn tin thời gian thực (REST + Socket.IO + Redis) và tải ảnh media đang chờ hoàn thiện ở Backend. Bạn vẫn có thể xem trước giao diện cục bộ.'
                : 'Kết nối bạn bè để trò chuyện riêng tư, chia sẻ khoảnh khắc và cùng nhau giữ chuỗi Quest.'}
          </p>
          <div className={styles.stateActions}>
            <Button variant="primary" size="sm" onClick={handleClearStateParam}>
              <RefreshCw size={14} aria-hidden="true" />
              <span>Quay lại chế độ Xem trước</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/work/quests')}>
              <span>Mở danh sách Quest</span>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div
      className={styles.messengerShell}
      data-testid="messenger-workspace"
      data-mobile-pane={mobilePane}
      data-details-open={detailsOpen ? 'true' : 'false'}
    >
      {/* LEFT: Conversation Sidebar */}
      <div className={`${styles.sidebarCol} ${mobilePane !== 'list' ? styles.mobileHidden : ''}`.trim()}>
        <ConversationSidebar
          conversations={filteredConversations}
          selectedId={selectedId}
          searchQuery={searchQuery}
          filter={filter}
          onSearchChange={setSearchQuery}
          onFilterChange={setFilter}
          onSelectConversation={handleSelectConversation}
          onNewConversationHint={handleNewConversationHint}
        />
      </div>

      {/* CENTER: Active Chat Workspace */}
      <section
        className={`${styles.chatCol} ${mobilePane !== 'chat' ? styles.mobileHidden : ''}`.trim()}
        aria-label="Khung trò chuyện"
        data-testid="messenger-chat-panel"
      >
        {pendingToast && (
          <div className={styles.pendingBanner} role="status" data-testid="messenger-pending-toast">
            <Lock size={13} aria-hidden="true" />
            <span>{pendingToast}</span>
            <button
              type="button"
              className={styles.pendingDismissBtn}
              onClick={() => setPendingToast(null)}
              aria-label="Đóng thông báo"
            >
              Đóng
            </button>
          </div>
        )}

        {activeConversation ? (
          <>
            {/* Conversation Header */}
            <header className={styles.chatHeader} data-testid="messenger-chat-header">
              <div className={styles.chatHeaderLeft}>
                <button
                  type="button"
                  className={styles.mobileBackBtn}
                  onClick={() => setMobilePane('list')}
                  aria-label="Quay lại danh sách hội thoại"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>

                {activeConversation.type === 'GROUP' && activeConversation.groupBadges ? (
                  <span className={styles.groupAvatar} aria-hidden="true">
                    <span
                      className={`${styles.groupAvatarPrimary} ${styles[`tone_${activeConversation.avatarTone}`]}`}
                    >
                      {activeConversation.groupBadges[0]}
                    </span>
                    <span className={styles.groupAvatarSecondary}>
                      {activeConversation.groupBadges[1]}
                    </span>
                  </span>
                ) : (
                  <span
                    className={`${styles.avatarCircle} ${styles[`tone_${activeConversation.avatarTone}`]}`}
                    aria-hidden="true"
                  >
                    {activeConversation.avatarInitials}
                  </span>
                )}

                <div className={styles.chatHeaderInfo}>
                  <h2 className={styles.chatTitle}>{activeConversation.title}</h2>
                  <span className={styles.chatSubtitle}>
                    {activeConversation.type === 'GROUP' ? (
                      <>
                        <Users size={11} aria-hidden="true" />
                        <span>{activeConversation.members.length} thành viên • Xem trước cục bộ</span>
                      </>
                    ) : (
                      <span>{activeConversation.subtitle}</span>
                    )}
                  </span>
                </div>
              </div>

              <div className={styles.chatHeaderActions}>
                <button
                  type="button"
                  className={styles.headerPillBtn}
                  onClick={() => navigate('/work/quests')}
                  title="Mở danh sách Quest"
                >
                  <Compass size={14} aria-hidden="true" />
                  <span className={styles.headerPillLabel}>Quest</span>
                </button>

                <button
                  type="button"
                  className={styles.iconActionBtn}
                  onClick={handlePopOutBubble}
                  aria-label={`Mở bong bóng chat cho ${activeConversation.title}`}
                  title="Ghim vào Bong bóng chat nổi"
                  data-testid="messenger-popout-bubble-btn"
                >
                  <PictureInPicture2 size={16} aria-hidden="true" />
                </button>

                <div ref={bubbleMenuWrapRef} className={floatingStyles.messengerPopoverWrap}>
                  <button
                    type="button"
                    className={`${styles.iconActionBtn} ${bubbleMenuOpen ? styles.iconActionBtnActive : ''}`.trim()}
                    onClick={() => setBubbleMenuOpen((v) => !v)}
                    aria-label="Tùy chọn Bong bóng chat"
                    aria-expanded={bubbleMenuOpen}
                    title="Tùy chọn Bong bóng chat"
                    data-testid="messenger-bubble-settings-btn"
                  >
                    <SlidersHorizontal size={16} aria-hidden="true" />
                  </button>

                  {bubbleMenuOpen && (
                    <div
                      className={floatingStyles.messengerPopover}
                      role="dialog"
                      aria-label="Cài đặt Bong bóng chat"
                      data-testid="messenger-bubble-settings-popover"
                    >
                      <ChatBubbleSettings compact />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className={`${styles.iconActionBtn} ${detailsOpen ? styles.iconActionBtnActive : ''}`.trim()}
                  onClick={() => {
                    const next = !detailsOpen
                    setDetailsOpen(next)
                    if (next) setMobilePane('details')
                  }}
                  aria-label={detailsOpen ? 'Ẩn chi tiết cuộc trò chuyện' : 'Xem chi tiết cuộc trò chuyện'}
                  aria-expanded={detailsOpen}
                  title="Thông tin hội thoại"
                  data-testid="messenger-toggle-details-btn"
                >
                  <PanelRight size={17} aria-hidden="true" />
                </button>
              </div>
            </header>

            {/* Scrollable Message Timeline */}
            <ChatTimeline
              conversation={activeConversation}
              messages={activeMessages}
              onOpenImage={(imgs, idx, author, time) => handleOpenImage(imgs, idx, author, time)}
              onNavigateQuest={(route) => navigate(route)}
            />

            {/* Sticky Bottom Composer */}
            <MessageComposer
              conversationTitle={activeConversation.title}
              draft={activeDraft}
              attachments={activeAttachments}
              onDraftChange={handleDraftChange}
              onAddFiles={handleAddFiles}
              onRemoveAttachment={handleRemoveAttachment}
              onSend={handleSendLocalPreview}
            />
          </>
        ) : (
          <div className={styles.noSelectionState}>
            <Info size={24} aria-hidden="true" />
            <p>Chọn một cuộc trò chuyện ở danh sách bên trái để bắt đầu.</p>
          </div>
        )}
      </section>

      {/* RIGHT: Collapsible Conversation Details Panel */}
      {detailsOpen && activeConversation && (
        <div
          className={`${styles.detailsCol} ${mobilePane !== 'details' ? styles.mobileDetailsOverlay : ''}`.trim()}
        >
          <ConversationDetailsPanel
            conversation={activeConversation}
            sharedImages={activeSharedImages}
            onClose={() => {
              setDetailsOpen(false)
              setMobilePane('chat')
            }}
            onToggleMute={toggleMuteConversation}
            onOpenImage={(imgs, idx) => handleOpenImage(imgs, idx, activeConversation.title)}
            onNavigate={(route) => navigate(route)}
          />
        </div>
      )}

      {/* Reused Accessible Image Lightbox */}
      {lightboxState && (
        <SocialMediaLightbox
          items={lightboxState.items}
          activeIndex={lightboxState.activeIndex}
          onSelectIndex={(idx) =>
            setLightboxState((prev) => (prev ? { ...prev, activeIndex: idx } : null))
          }
          onClose={() => setLightboxState(null)}
          onNavigate={(route) => navigate(route)}
        />
      )}
    </div>
  )
}
