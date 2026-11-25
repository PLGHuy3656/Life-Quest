import { BellOff, Lock, MessageSquarePlus, Search, Users, X } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import type { Conversation, ConversationFilter } from './messengerTypes'
import styles from './MessagesPage.module.css'

export interface ConversationSidebarProps {
  conversations: Conversation[]
  selectedId: string | null
  searchQuery: string
  filter: ConversationFilter
  onSearchChange: (q: string) => void
  onFilterChange: (f: ConversationFilter) => void
  onSelectConversation: (id: string) => void
  onNewConversationHint: () => void
}

const FILTER_OPTIONS: readonly { id: ConversationFilter; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'DIRECT', label: 'Cá nhân' },
  { id: 'GROUP', label: 'Nhóm' }
]

export function ConversationSidebar({
  conversations,
  selectedId,
  searchQuery,
  filter,
  onSearchChange,
  onFilterChange,
  onSelectConversation,
  onNewConversationHint
}: ConversationSidebarProps) {
  return (
    <aside
      className={styles.sidebar}
      aria-label="Danh sách cuộc trò chuyện"
      data-testid="messenger-sidebar"
    >
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarTitleRow}>
          <h1 className={styles.sidebarHeading}>Tin nhắn</h1>
          <Chip tone="reward">PREVIEW</Chip>
        </div>

        <button
          type="button"
          className={styles.newChatBtn}
          onClick={onNewConversationHint}
          aria-label="Tạo cuộc trò chuyện mới (Chờ Backend API)"
          title="Tạo nhóm / trò chuyện mới (FE-06B • Chờ Backend API)"
          data-testid="messenger-new-chat-btn"
        >
          <MessageSquarePlus size={15} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.searchWrap}>
        <Search size={14} className={styles.searchIcon} aria-hidden="true" />
        <input
          type="search"
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm bạn bè hoặc nhóm..."
          aria-label="Tìm kiếm cuộc trò chuyện"
          data-testid="messenger-search-input"
        />
        {searchQuery && (
          <button
            type="button"
            className={styles.searchClearBtn}
            onClick={() => onSearchChange('')}
            aria-label="Xóa từ khóa tìm kiếm"
          >
            <X size={13} aria-hidden="true" />
          </button>
        )}
      </div>

      <div
        className={styles.filterBar}
        role="tablist"
        aria-label="Lọc danh sách hội thoại"
        data-testid="messenger-filter-bar"
      >
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.filterPill} ${active ? styles.filterPillActive : ''}`.trim()}
              onClick={() => onFilterChange(opt.id)}
              data-testid={`messenger-filter-${opt.id.toLowerCase()}`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      <div className={styles.conversationList} role="list" data-testid="messenger-conversation-list">
        {conversations.length === 0 ? (
          <div className={styles.sidebarEmpty} data-testid="messenger-search-empty">
            <Search size={20} aria-hidden="true" />
            <p>Không tìm thấy hội thoại phù hợp.</p>
            {(searchQuery || filter !== 'ALL') && (
              <button
                type="button"
                className={styles.inlineLinkBtn}
                onClick={() => {
                  onSearchChange('')
                  onFilterChange('ALL')
                }}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = conv.id === selectedId
            const isUnread = conv.unreadCount > 0
            return (
              <button
                key={conv.id}
                type="button"
                role="listitem"
                aria-current={isSelected ? 'true' : undefined}
                className={`${styles.convItem} ${isSelected ? styles.convItemSelected : ''} ${isUnread ? styles.convItemUnread : ''} ${conv.muted ? styles.convItemMuted : ''}`.trim()}
                onClick={() => onSelectConversation(conv.id)}
                data-testid={`messenger-conv-item-${conv.id}`}
                data-conv-type={conv.type}
              >
                <span className={styles.avatarWrap} aria-hidden="true">
                  {conv.type === 'GROUP' && conv.groupBadges ? (
                    <span className={styles.groupAvatar}>
                      <span className={`${styles.groupAvatarPrimary} ${styles[`tone_${conv.avatarTone}`]}`}>
                        {conv.groupBadges[0]}
                      </span>
                      <span className={styles.groupAvatarSecondary}>{conv.groupBadges[1]}</span>
                    </span>
                  ) : (
                    <span className={`${styles.avatarCircle} ${styles[`tone_${conv.avatarTone}`]}`}>
                      {conv.avatarInitials}
                    </span>
                  )}
                </span>

                <span className={styles.convBody}>
                  <span className={styles.convTopRow}>
                    <span className={styles.convTitleWrap}>
                      {conv.type === 'GROUP' && (
                        <Users size={12} className={styles.groupTitleIcon} aria-hidden="true" />
                      )}
                      <span className={styles.convTitle}>{conv.title}</span>
                    </span>
                    <span className={styles.convTime}>{conv.lastActivityLabel}</span>
                  </span>

                  <span className={styles.convBottomRow}>
                    <span className={styles.convPreview}>{conv.lastMessagePreview}</span>
                    <span className={styles.convBadges}>
                      {conv.muted && (
                        <BellOff
                          size={12}
                          className={styles.mutedIcon}
                          aria-label="Đã tắt thông báo"
                        />
                      )}
                      {isUnread && (
                        <span
                          className={styles.unreadBadge}
                          aria-label={`${conv.unreadCount} tin nhắn chưa đọc`}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                </span>
              </button>
            )
          })
        )}
      </div>

      <div className={styles.sidebarFooterNote} role="note">
        <Lock size={12} aria-hidden="true" />
        <span>Chế độ xem trước cục bộ • Chờ Messaging API</span>
      </div>
    </aside>
  )
}
