import React, { useState } from 'react'
import { Plus, UserPlus, Users, X, Check, Search, Sparkles } from 'lucide-react'

interface MessagesScreenProps {
  onOpenChat: (contactName: string) => void
}

interface ThreadItem {
  id: string
  name: string
  type: 'friend' | 'group'
  avatarBg: string
  avatarText: string
  lastMessage: string
  time: string
  unread: number
}

interface InviteItem {
  id: string
  name: string
  type: 'friend' | 'group'
  avatarBg: string
  avatarText: string
  note: string
}

const INITIAL_THREADS: ThreadItem[] = [
  {
    id: 'm1',
    name: 'Hà My',
    type: 'friend',
    avatarBg: '#F26B3A',
    avatarText: 'HM',
    lastMessage: 'Mai học nhóm lúc 8h nhé 📚',
    time: '19:12',
    unread: 2
  },
  {
    id: 'm2',
    name: 'Nhóm Ôn Thi',
    type: 'group',
    avatarBg: '#168C78',
    avatarText: 'OT',
    lastMessage: 'Huy: đã nộp đề số 2',
    time: '18:45',
    unread: 1
  },
  {
    id: 'm3',
    name: 'Quang Minh',
    type: 'friend',
    avatarBg: '#4B2E83',
    avatarText: 'QM',
    lastMessage: 'Quest chạy 5K cùng nhau?',
    time: '16:20',
    unread: 0
  },
  {
    id: 'm4',
    name: 'Fox Squad',
    type: 'group',
    avatarBg: '#16324A',
    avatarText: 'FS',
    lastMessage: 'Chuỗi nhóm đạt 7 ngày! 🎉',
    time: 'Hôm qua',
    unread: 0
  }
]

const INITIAL_INVITES: InviteItem[] = [
  {
    id: 'inv-1',
    name: 'Linh Chi',
    type: 'friend',
    avatarBg: '#A855F7',
    avatarText: 'LC',
    note: 'Muốn kết bạn để cùng giữ chuỗi học mỗi ngày 🔥'
  },
  {
    id: 'inv-2',
    name: 'CLB Chạy Bộ Sáng',
    type: 'group',
    avatarBg: '#E69A28',
    avatarText: 'CB',
    note: 'Quang Minh đã mời bạn tham gia nhóm (6 thành viên)'
  }
]

const SUGGESTED_FRIENDS = [
  { id: 'sf-1', name: 'Tuấn Kiệt', handle: '@tuankiet.lq', avatarBg: '#2563EB', avatarText: 'TK' },
  { id: 'sf-2', name: 'Bảo Ngọc', handle: '@baongoc.fox', avatarBg: '#DB2777', avatarText: 'BN' },
  { id: 'sf-3', name: 'Đức Anh', handle: '@ducanh.dev', avatarBg: '#0D9488', avatarText: 'DA' }
]

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ onOpenChat }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'group' | 'invites'>('all')
  const [threads, setThreads] = useState<ThreadItem[]>(INITIAL_THREADS)
  const [invites, setInvites] = useState<InviteItem[]>(INITIAL_INVITES)

  // Interactive (+) Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'friend' | 'group'>('friend')
  const [friendQuery, setFriendQuery] = useState('')
  const [sentFriendIds, setSentFriendIds] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['Hà My', 'Quang Minh'])
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2200)
  }

  const handleAcceptInvite = (inv: InviteItem) => {
    setInvites((prev) => prev.filter((i) => i.id !== inv.id))
    const newThread: ThreadItem = {
      id: `accepted-${inv.id}`,
      name: inv.name,
      type: inv.type,
      avatarBg: inv.avatarBg,
      avatarText: inv.avatarText,
      lastMessage: inv.type === 'group' ? 'Bạn vừa tham gia nhóm 🎉' : 'Hai bạn đã trở thành bạn bè! 👋',
      time: 'Vừa xong',
      unread: 1
    }
    setThreads((prev) => [newThread, ...prev])
    showToast(`Đã chấp nhận lời mời từ ${inv.name}!`)
  }

  const handleDeclineInvite = (invId: string) => {
    setInvites((prev) => prev.filter((i) => i.id !== invId))
  }

  const handleAddFriendByQuery = () => {
    const clean = friendQuery.trim()
    if (!clean) return
    showToast(`Đã gửi lời mời kết bạn tới "${clean}"!`)
    setFriendQuery('')
  }

  const handleToggleMember = (name: string) => {
    setSelectedMembers((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    )
  }

  const handleCreateGroup = () => {
    const clean = groupName.trim()
    if (!clean) return
    const initials = clean
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'NH'

    const newGroup: ThreadItem = {
      id: `grp-${Date.now()}`,
      name: clean,
      type: 'group',
      avatarBg: '#168C78',
      avatarText: initials,
      lastMessage: `Nhóm mới với ${selectedMembers.length + 1} thành viên ✨`,
      time: 'Vừa xong',
      unread: 0
    }
    setThreads((prev) => [newGroup, ...prev])
    setGroupName('')
    setIsNewModalOpen(false)
    setActiveTab('group')
    showToast(`Đã tạo nhóm "${clean}" thành công!`)
  }

  const filteredThreads = threads.filter((t) => {
    if (activeTab === 'friends') return t.type === 'friend'
    if (activeTab === 'group') return t.type === 'group'
    return true
  })

  const tabs: { id: 'all' | 'friends' | 'group' | 'invites'; label: string; count?: number }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'friends', label: 'Bạn bè' },
    { id: 'group', label: 'Nhóm' },
    { id: 'invites', label: 'Lời mời', count: invites.length }
  ]

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        padding: '12px 16px 96px',
        gap: 14
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Tin nhắn
        </div>

        {/* Interactive (+) Circle Button */}
        <button
          onClick={() => setIsNewModalOpen(true)}
          title="Thêm bạn bè hoặc tạo nhóm trò chuyện mới"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #FF9357 0%, #F26B3A 100%)',
            border: '2px solid #FFFFFF',
            boxShadow: '0 3px 0 #C4491F, 0 6px 14px rgba(242, 107, 58, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#FFFFFF'
          }}
          aria-label="Tạo cuộc trò chuyện hoặc nhóm mới"
        >
          <Plus size={20} strokeWidth={2.8} />
        </button>
      </div>

      {/* Toast Feedback */}
      {toastMsg && (
        <div
          className="animate-fade-in"
          style={{
            background: 'var(--lq-success)',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 700,
            padding: '8px 12px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(22, 140, 120, 0.25)'
          }}
        >
          <Sparkles size={14} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 4 Filter Tabs: Tất cả | Bạn bè | Nhóm | Lời mời */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap'
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                position: 'relative',
                padding: '6px 12px',
                borderRadius: 999,
                background: isActive ? 'var(--lq-accent-soft)' : '#FFFFFF',
                border: isActive
                  ? '1.5px solid rgba(242, 107, 58, 0.38)'
                  : '1px solid var(--lq-border)',
                fontWeight: isActive ? 800 : 700,
                fontSize: 12.5,
                color: isActive ? 'var(--lq-accent)' : 'var(--lq-ink-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  style={{
                    background: '#E53935',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 900,
                    minWidth: 16,
                    height: 16,
                    padding: '0 4px',
                    borderRadius: 99,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content Area: Invites Tab vs Threads List */}
      {activeTab === 'invites' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {invites.length === 0 ? (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 20,
                padding: '28px 16px',
                textAlign: 'center',
                border: '1px solid var(--lq-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8
              }}
            >
              <img
                src="/assets/fox/fox-cp1-anim.webp"
                alt="Fox"
                style={{ width: 78, height: 78, objectFit: 'contain' }}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = '/assets/fox/fox-cp1.png'
                }}
              />
              <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>Chưa có lời mời mới</b>
              <span style={{ fontSize: 12, color: 'var(--lq-ink-muted)' }}>
                Bấm nút <b>+</b> ở góc trên để kết bạn hoặc tạo nhóm học tập mới!
              </span>
            </div>
          ) : (
            invites.map((inv) => (
              <div
                key={inv.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  padding: '13px 14px',
                  border: '1px solid var(--lq-border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: inv.avatarBg,
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {inv.avatarText}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>{inv.name}</b>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 99,
                          background: inv.type === 'group' ? 'var(--lq-success-soft)' : 'var(--lq-accent-soft)',
                          color: inv.type === 'group' ? 'var(--lq-success)' : 'var(--lq-accent)'
                        }}
                      >
                        {inv.type === 'group' ? 'Nhóm' : 'Bạn bè'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
                      {inv.note}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleAcceptInvite(inv)}
                    style={{
                      flex: 1,
                      height: 36,
                      borderRadius: 12,
                      background: 'var(--lq-accent)',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      cursor: 'pointer'
                    }}
                  >
                    <Check size={14} strokeWidth={3} />
                    <span>Chấp nhận</span>
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(inv.id)}
                    style={{
                      flex: 1,
                      height: 36,
                      borderRadius: 12,
                      background: 'var(--lq-surface-subtle)',
                      color: 'var(--lq-ink-secondary)',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredThreads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => onOpenChat(thread.name)}
              style={{
                background: '#FFFFFF',
                borderRadius: 20,
                padding: '12px 14px',
                border: '1px solid var(--lq-border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                transition: 'transform 0.1s ease'
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  position: 'relative',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: thread.avatarBg,
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {thread.avatarText}
                {thread.type === 'group' && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 17,
                      height: 17,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      border: '1.5px solid #EAE2D6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#168C78'
                    }}
                  >
                    <Users size={10} />
                  </span>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>{thread.name}</b>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--lq-ink-muted)' }}>
                    {thread.time}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--lq-ink-muted)',
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {thread.lastMessage}
                </div>
              </div>

              {/* Unread Badge */}
              {thread.unread > 0 && (
                <span
                  style={{
                    background: 'var(--lq-accent)',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 99,
                    flexShrink: 0
                  }}
                >
                  {thread.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Interactive (+) Modal: Kết bạn mới / Tạo nhóm mới */}
      {isNewModalOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsNewModalOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(22, 50, 74, 0.48)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)'
            }}
          />

          {/* Modal Card */}
          <div
            className="animate-fade-in"
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              maxWidth: 348,
              background: '#FAF8F4',
              borderRadius: 24,
              border: '1.5px solid #EAE2D6',
              boxShadow: '0 20px 48px rgba(22, 50, 74, 0.28)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '15px 16px 12px',
                background: '#FFFFFF',
                borderBottom: '1px solid #EFE8DD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <b style={{ fontSize: 16, fontWeight: 800, color: 'var(--lq-ink)' }}>
                Trò chuyện mới
              </b>
              <button
                onClick={() => setIsNewModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#F4EFE8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--lq-ink)',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode Switcher: Kết bạn | Tạo nhóm */}
            <div style={{ padding: '12px 14px 4px', display: 'flex', gap: 8 }}>
              <button
                onClick={() => setModalMode('friend')}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 12,
                  background: modalMode === 'friend' ? 'var(--lq-accent)' : '#FFFFFF',
                  color: modalMode === 'friend' ? '#FFFFFF' : 'var(--lq-ink-secondary)',
                  border: modalMode === 'friend' ? 'none' : '1px solid var(--lq-border)',
                  fontSize: 12.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <UserPlus size={15} />
                <span>Kết bạn mới</span>
              </button>
              <button
                onClick={() => setModalMode('group')}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 12,
                  background: modalMode === 'group' ? 'var(--lq-accent)' : '#FFFFFF',
                  color: modalMode === 'group' ? '#FFFFFF' : 'var(--lq-ink-secondary)',
                  border: modalMode === 'group' ? 'none' : '1px solid var(--lq-border)',
                  fontSize: 12.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Users size={15} />
                <span>Tạo nhóm mới</span>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {modalMode === 'friend' ? (
                <>
                  {/* Search / Add Friend Input */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#FFFFFF',
                      border: '1.5px solid #E5DDD0',
                      borderRadius: 14,
                      padding: '6px 8px 6px 12px'
                    }}
                  >
                    <Search size={16} color="var(--lq-ink-muted)" />
                    <input
                      type="text"
                      value={friendQuery}
                      onChange={(e) => setFriendQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddFriendByQuery()
                      }}
                      placeholder="Nhập tên hoặc @handle bạn bè..."
                      style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: 'var(--lq-ink)'
                      }}
                    />
                    <button
                      onClick={handleAddFriendByQuery}
                      style={{
                        background: 'var(--lq-primary)',
                        color: '#FFFFFF',
                        fontSize: 11.5,
                        fontWeight: 800,
                        padding: '6px 10px',
                        borderRadius: 10,
                        cursor: 'pointer'
                      }}
                    >
                      Gửi
                    </button>
                  </div>

                  {/* Suggested Friends */}
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--lq-ink-muted)' }}>
                    Gợi ý bạn đồng hành
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {SUGGESTED_FRIENDS.map((sf) => {
                      const isSent = sentFriendIds.includes(sf.id)
                      return (
                        <div
                          key={sf.id}
                          style={{
                            background: '#FFFFFF',
                            borderRadius: 14,
                            padding: '9px 11px',
                            border: '1px solid var(--lq-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: sf.avatarBg,
                              color: '#FFFFFF',
                              fontSize: 12,
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {sf.avatarText}
                          </div>
                          <div style={{ flex: 1 }}>
                            <b style={{ fontSize: 13, color: 'var(--lq-ink)', display: 'block' }}>{sf.name}</b>
                            <span style={{ fontSize: 11, color: 'var(--lq-ink-muted)' }}>{sf.handle}</span>
                          </div>
                          <button
                            onClick={() => {
                              if (isSent) return
                              setSentFriendIds((prev) => [...prev, sf.id])
                              showToast(`Đã gửi lời mời kết bạn tới ${sf.name}!`)
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 99,
                              background: isSent ? 'var(--lq-success-soft)' : 'var(--lq-accent-soft)',
                              color: isSent ? 'var(--lq-success)' : 'var(--lq-accent)',
                              fontSize: 11.5,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            {isSent ? 'Đã gửi ✓' : '+ Kết bạn'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  {/* Create New Group Form */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--lq-ink-secondary)', marginBottom: 5 }}>
                      Tên nhóm mới
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="VD: Nhóm Chạy Bộ 5K..."
                      style={{
                        width: '100%',
                        height: 42,
                        borderRadius: 12,
                        background: '#FFFFFF',
                        border: '1.5px solid #E5DDD0',
                        padding: '0 12px',
                        outline: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--lq-ink)'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--lq-ink-secondary)', marginBottom: 6 }}>
                      Chọn thành viên ({selectedMembers.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['Hà My', 'Quang Minh', 'Tuấn Kiệt', 'Linh Chi', 'Bảo Ngọc'].map((member) => {
                        const checked = selectedMembers.includes(member)
                        return (
                          <button
                            key={member}
                            type="button"
                            onClick={() => handleToggleMember(member)}
                            style={{
                              padding: '6px 11px',
                              borderRadius: 99,
                              background: checked ? 'var(--lq-accent-soft)' : '#FFFFFF',
                              border: checked
                                ? '1.5px solid var(--lq-accent)'
                                : '1px solid var(--lq-border)',
                              color: checked ? 'var(--lq-accent)' : 'var(--lq-ink-secondary)',
                              fontSize: 12,
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer'
                            }}
                          >
                            {checked && <Check size={12} strokeWidth={3} />}
                            <span>{member}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleCreateGroup}
                    disabled={!groupName.trim()}
                    style={{
                      marginTop: 4,
                      height: 44,
                      borderRadius: 14,
                      background: groupName.trim() ? 'var(--lq-accent)' : '#D8D1C7',
                      color: '#FFFFFF',
                      fontSize: 13.5,
                      fontWeight: 800,
                      boxShadow: groupName.trim() ? '0 3px 0 #C4491F' : 'none',
                      cursor: groupName.trim() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Tạo nhóm ngay
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessagesScreen
