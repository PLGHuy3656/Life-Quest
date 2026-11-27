import React from 'react'
import { TabId } from '../../types'
import { Home, MessageSquare, Calendar, CheckSquare, Plus } from 'lucide-react'

interface BottomNavProps {
  currentTab: TabId
  onSelectTab: (tab: TabId) => void
  onOpenCreate: () => void
  pendingTasksCount?: number
  unreadMessagesCount?: number
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
  pendingTasksCount = 2,
  unreadMessagesCount = 3
}) => {
  return (
    <nav style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      background: 'rgba(250, 249, 246, 0.98)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(22, 50, 74, 0.1)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-around',
      paddingTop: 8,
      zIndex: 50,
      boxShadow: '0 -4px 20px rgba(22, 50, 74, 0.05)'
    }}>
      {/* 1. Trang chủ */}
      <button
        onClick={() => onSelectTab('dashboard')}
        style={{
          border: 'none',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          fontSize: 11,
          fontWeight: 700,
          color: currentTab === 'dashboard' ? 'var(--lq-accent)' : 'var(--lq-ink-muted)',
          cursor: 'pointer',
          width: 64,
          padding: 0
        }}
      >
        <Home size={22} strokeWidth={currentTab === 'dashboard' ? 2.5 : 2} />
        <span>Trang chủ</span>
      </button>

      {/* 2. Tin nhắn */}
      <button
        onClick={() => onSelectTab('messages')}
        style={{
          border: 'none',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          fontSize: 11,
          fontWeight: 700,
          color: currentTab === 'messages' ? 'var(--lq-accent)' : 'var(--lq-ink-muted)',
          cursor: 'pointer',
          width: 64,
          padding: 0,
          position: 'relative'
        }}
      >
        <div style={{ position: 'relative' }}>
          <MessageSquare size={22} strokeWidth={currentTab === 'messages' ? 2.5 : 2} />
          {unreadMessagesCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -2,
              right: -5,
              background: 'var(--lq-accent)',
              color: '#FFFFFF',
              fontSize: 9,
              fontWeight: 800,
              width: 14,
              height: 14,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #FAF9F6'
            }}>
              {unreadMessagesCount}
            </span>
          )}
        </div>
        <span>Tin nhắn</span>
      </button>

      {/* 3. Center FAB: Create Sheet (+) */}
      <button
        onClick={onOpenCreate}
        style={{
          border: 'none',
          width: 54,
          height: 54,
          borderRadius: '50%',
          background: 'var(--lq-accent)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -20,
          boxShadow: '0 8px 22px rgba(242, 107, 58, 0.45)',
          cursor: 'pointer',
          transition: 'transform 0.15s ease'
        }}
        title="Tạo mới nhiệm vụ, thói quen, mục tiêu"
      >
        <Plus size={28} strokeWidth={2.8} />
      </button>

      {/* 4. Lịch */}
      <button
        onClick={() => onSelectTab('calendar')}
        style={{
          border: 'none',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          fontSize: 11,
          fontWeight: 700,
          color: currentTab === 'calendar' ? 'var(--lq-accent)' : 'var(--lq-ink-muted)',
          cursor: 'pointer',
          width: 64,
          padding: 0
        }}
      >
        <Calendar size={22} strokeWidth={currentTab === 'calendar' ? 2.5 : 2} />
        <span>Lịch</span>
      </button>

      {/* 5. Công việc */}
      <button
        onClick={() => onSelectTab('work')}
        style={{
          border: 'none',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          fontSize: 11,
          fontWeight: 700,
          color: (currentTab === 'work' || currentTab === 'tasks') ? 'var(--lq-accent)' : 'var(--lq-ink-muted)',
          cursor: 'pointer',
          width: 64,
          padding: 0,
          position: 'relative'
        }}
      >
        <div style={{ position: 'relative' }}>
          <CheckSquare size={22} strokeWidth={(currentTab === 'work' || currentTab === 'tasks') ? 2.5 : 2} />
          {pendingTasksCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -2,
              right: -5,
              background: 'var(--lq-accent)',
              color: '#FFFFFF',
              fontSize: 9,
              fontWeight: 800,
              width: 14,
              height: 14,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #FAF9F6'
            }}>
              {pendingTasksCount}
            </span>
          )}
        </div>
        <span>Công việc</span>
      </button>
    </nav>
  )
}
export default BottomNav
