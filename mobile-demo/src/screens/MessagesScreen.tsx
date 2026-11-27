import React, { useState } from 'react'
import { Plus } from 'lucide-react'

interface MessagesScreenProps {
  onOpenChat: (contactName: string) => void
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ onOpenChat }) => {
  const [activeTab, setActiveTab] = useState<'my' | 'group' | 'invites'>('my')

  const threads = [
    {
      id: 'm1',
      name: 'Hà My',
      avatarBg: '#F26B3A',
      avatarText: 'MA',
      lastMessage: 'Mai học nhóm lúc 8h nhé 📚',
      unread: 2
    },
    {
      id: 'm2',
      name: 'Nhóm Ôn Thi',
      avatarBg: '#168C78',
      avatarText: 'GB',
      lastMessage: 'Huy: đã nộp đề số 2',
      unread: 1
    },
    {
      id: 'm3',
      name: 'Quang Minh',
      avatarBg: '#4B2E83',
      avatarText: 'QM',
      lastMessage: 'Quest chạy 5K cùng nhau?',
      unread: 0
    },
    {
      id: 'm4',
      name: 'Fox Squad',
      avatarBg: '#16324A',
      avatarText: 'FS',
      lastMessage: 'Chuỗi nhóm đạt 7 ngày! 🎉',
      unread: 0
    }
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      padding: '12px 16px 80px',
      gap: 14
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Tin nhắn
        </div>

        <button
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '1px solid var(--lq-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--lq-ink)'
          }}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Tabs: Của tôi | Nhóm | Lời mời */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => setActiveTab('my')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: activeTab === 'my' ? 'var(--lq-accent-soft)' : '#FFFFFF',
            border: activeTab === 'my' ? '1px solid rgba(242, 107, 58, 0.3)' : '1px solid var(--lq-border)',
            fontWeight: 700,
            fontSize: 13,
            color: activeTab === 'my' ? 'var(--lq-accent)' : 'var(--lq-ink-secondary)',
            cursor: 'pointer'
          }}
        >
          Của tôi
        </button>

        <button
          onClick={() => setActiveTab('group')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: activeTab === 'group' ? 'var(--lq-accent-soft)' : '#FFFFFF',
            border: activeTab === 'group' ? '1px solid rgba(242, 107, 58, 0.3)' : '1px solid var(--lq-border)',
            fontWeight: 700,
            fontSize: 13,
            color: activeTab === 'group' ? 'var(--lq-accent)' : 'var(--lq-ink-secondary)',
            cursor: 'pointer'
          }}
        >
          Nhóm
        </button>

        <button
          onClick={() => setActiveTab('invites')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: activeTab === 'invites' ? 'var(--lq-accent-soft)' : '#FFFFFF',
            border: activeTab === 'invites' ? '1px solid rgba(242, 107, 58, 0.3)' : '1px solid var(--lq-border)',
            fontWeight: 700,
            fontSize: 13,
            color: activeTab === 'invites' ? 'var(--lq-accent)' : 'var(--lq-ink-secondary)',
            cursor: 'pointer'
          }}
        >
          Lời mời
        </button>
      </div>

      {/* Message Threads List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {threads.map((thread) => (
          <div
            key={thread.id}
            onClick={() => onOpenChat(thread.name)}
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              padding: '12px 14px',
              border: '1px solid var(--lq-border)',
              boxShadow: 'var(--shadow)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              transition: 'transform 0.1s ease'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: thread.avatarBg,
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {thread.avatarText}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>{thread.name}</b>
              <div style={{
                fontSize: 12,
                color: 'var(--lq-ink-muted)',
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {thread.lastMessage}
              </div>
            </div>

            {/* Unread Badge */}
            {thread.unread > 0 && (
              <span style={{
                background: 'var(--lq-accent)',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 99
              }}>
                {thread.unread}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
export default MessagesScreen
