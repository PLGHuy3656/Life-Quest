import React, { useState } from 'react'
import { useStore } from '../store/questStore'
import { QuestCard } from '../components/QuestCard'
import { Plus, Search, Filter, Sparkles } from 'lucide-react'
import { QuestCategory, QuestType } from '../types'

interface QuestsScreenProps {
  onOpenNewQuest: () => void
}

type FilterTab = 'all' | 'daily' | 'habit' | 'quest' | 'completed'

export const QuestsScreen: React.FC<QuestsScreenProps> = ({ onOpenNewQuest }) => {
  const { quests, toggleQuest, deleteQuest } = useStore()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filterTabs = [
    { id: 'all' as FilterTab, label: 'Tất cả' },
    { id: 'daily' as FilterTab, label: 'Hàng ngày' },
    { id: 'habit' as FilterTab, label: 'Thói quen' },
    { id: 'quest' as FilterTab, label: 'Nhiệm vụ' },
    { id: 'completed' as FilterTab, label: 'Đã xong' }
  ]

  const categories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'fitness', label: '🏃 Thể lực' },
    { id: 'learning', label: '📚 Học tập' },
    { id: 'work', label: '💼 Công việc' },
    { id: 'mindfulness', label: '🧘 Kỷ luật' },
    { id: 'social', label: '🤝 Xã hội' }
  ]

  const filteredQuests = quests.filter((q) => {
    // Search match
    if (search.trim() && !q.title.toLowerCase().includes(search.toLowerCase())) {
      return false
    }

    // Category match
    if (selectedCategory !== 'all' && q.category !== selectedCategory) {
      return false
    }

    // Tab match
    if (activeTab === 'completed') return q.completed
    if (activeTab === 'daily') return q.type === 'daily'
    if (activeTab === 'habit') return q.type === 'habit'
    if (activeTab === 'quest') return q.type === 'quest' || q.type === 'milestone'

    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px', position: 'relative', minHeight: '100%' }}>
      {/* Top Search & Filter Bar */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Search size={18} color="var(--ink-muted)" style={{ position: 'absolute', left: 14 }} />
        <input
          type="text"
          placeholder="Tìm kiếm nhiệm vụ, mục tiêu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: '#FFFFFF',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
            boxShadow: 'var(--shadow-sm)'
          }}
        />
      </div>

      {/* Segmented Sub Tabs */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-subtle)',
        padding: 4,
        borderRadius: 14,
        overflowX: 'auto',
        gap: 4
      }}>
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                background: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--ink-secondary)',
                boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Category Pills (Horizontal scrolling) */}
      <div style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        paddingBottom: 2
      }}>
        {categories.map((c) => {
          const isSelected = selectedCategory === c.id
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: isSelected ? 'var(--primary)' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : 'var(--ink-secondary)',
                border: '1px solid',
                borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                whiteSpace: 'nowrap'
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Quest List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        {filteredQuests.length === 0 ? (
          <div className="card" style={{
            textAlign: 'center',
            padding: '36px 20px',
            color: 'var(--ink-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{ fontSize: 36 }}>🦊✨</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
              Không tìm thấy nhiệm vụ nào!
            </div>
            <div style={{ fontSize: 12, maxWidth: 240, lineHeight: 1.4 }}>
              Hãy thử tìm kiếm với từ khóa khác hoặc bấm nút "+" bên dưới để tạo mục tiêu mới.
            </div>
          </div>
        ) : (
          filteredQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onToggle={toggleQuest}
              onDelete={deleteQuest}
            />
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onOpenNewQuest}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-h) + 18px + var(--safe-bottom))',
          right: 'calc(50% - 200px + 16px)',
          width: 52,
          height: 52,
          borderRadius: 26,
          background: 'linear-gradient(135deg, #F26B3A 0%, #DE5A2A 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-float)',
          zIndex: 35
        }}
        title="Thêm nhiệm vụ mới"
      >
        <Plus size={26} strokeWidth={3} />
      </button>
    </div>
  )
}
