import React from 'react'
import { useStore } from '../store/questStore'
import { FoxCompanionCard } from '../components/FoxCompanionCard'
import { QuestCard } from '../components/QuestCard'
import { Zap, Play, Plus, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react'
import { TabType } from '../components/BottomNav'

interface HomeScreenProps {
  onNavigateTab: (tab: TabType) => void
  onOpenNewQuest: () => void
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateTab,
  onOpenNewQuest
}) => {
  const { player, quests, toggleQuest } = useStore()

  const dailyQuests = quests.filter((q) => q.type === 'daily' || q.pinned)
  const completedCount = dailyQuests.filter((q) => q.completed).length
  const totalCount = dailyQuests.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px' }}>
      {/* Daily Progress Overview Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #16324A 0%, #1E4261 100%)',
        color: '#FFFFFF',
        padding: '18px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(242, 107, 58, 0.35) 0%, rgba(22, 50, 74, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Nhiệm Vụ Hôm Nay
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              {completedCount === totalCount && totalCount > 0
                ? 'Tuyệt vời! Đã xong hết!'
                : `Hoàn thành ${completedCount}/${totalCount} mục tiêu`}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <Zap size={14} color="#F6C85F" fill="#F6C85F" />
            <span>{progressPercent}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 8,
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 10
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #F26B3A 0%, #F6C85F 100%)',
            borderRadius: 4,
            transition: 'width 0.4s ease'
          }} />
        </div>

        <div style={{ fontSize: 12, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} color="#F6C85F" />
          <span>Còn lại {totalCount - completedCount} việc để nhận thưởng Streak 7 ngày!</span>
        </div>
      </div>

      {/* Interactive Fox Companion Card */}
      <FoxCompanionCard />

      {/* Quick Action / Focus Mode CTA */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10
      }}>
        <button
          onClick={() => onNavigateTab('focus')}
          style={{
            background: 'linear-gradient(135deg, #16324A 0%, #204566 100%)',
            color: '#FFFFFF',
            padding: '14px',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 12px rgba(22, 50, 74, 0.15)',
            textAlign: 'left'
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Play size={18} fill="#FFFFFF" color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Tập Trung</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Pomodoro 25p</div>
          </div>
        </button>

        <button
          onClick={onOpenNewQuest}
          style={{
            background: 'linear-gradient(135deg, #F26B3A 0%, #DE5A2A 100%)',
            color: '#FFFFFF',
            padding: '14px',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 12px rgba(242, 107, 58, 0.25)',
            textAlign: 'left'
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Plus size={20} strokeWidth={3} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Thêm Quest</div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>Nhận ngay XP</div>
          </div>
        </button>
      </div>

      {/* Today's Active Quests Section */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          padding: '0 4px'
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>
            Nhiệm Vụ Ưu Tiên
          </h3>
          <button
            onClick={() => onNavigateTab('quests')}
            style={{
              background: 'transparent',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <span>Xem tất cả ({quests.length})</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dailyQuests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--ink-secondary)' }}>
              Chưa có nhiệm vụ nào hôm nay! Bấm "+ Thêm Quest" để tạo ngay nhé.
            </div>
          ) : (
            dailyQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onToggle={toggleQuest}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
