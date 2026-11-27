import React, { useState } from 'react'
import { useStore } from '../store/questStore'
import { WorkSubTab, Category } from '../types'
import {
  Search,
  CheckCircle2,
  Trash2,
  Flame,
  Plus,
  Minus,
  Crown,
  ChevronDown,
  ChevronUp,
  Zap,
  Coins
} from 'lucide-react'

interface WorkScreenProps {
  onOpenCreate: () => void
}

export const WorkScreen: React.FC<WorkScreenProps> = ({ onOpenCreate }) => {
  const {
    tasks,
    habits,
    quests,
    toggleTask,
    deleteTask,
    incrementHabit,
    toggleMilestone
  } = useStore()

  const [activeTab, setActiveTab] = useState<WorkSubTab>('tasks')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(quests[0]?.id || null)

  const subTabs = [
    { id: 'tasks' as WorkSubTab, label: 'Nhiệm vụ', count: tasks.filter((t) => !t.completed).length },
    { id: 'habits' as WorkSubTab, label: 'Thói quen', count: habits.length },
    { id: 'quests' as WorkSubTab, label: 'Đại nhiệm vụ', count: quests.length },
    { id: 'completed' as WorkSubTab, label: 'Đã xong', count: tasks.filter((t) => t.completed).length }
  ]

  const categories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'work', label: '💼 Công việc' },
    { id: 'fitness', label: '🏃 Thể lực' },
    { id: 'learning', label: '📚 Học tập' },
    { id: 'mindfulness', label: '🧘 Kỷ luật' }
  ]

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'completed' && !t.completed) return false
    if (activeTab === 'tasks' && t.completed) return false
    if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false
    return true
  })

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px' }}>
      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--lq-ink-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
        <input
          type="text"
          placeholder="Tìm nhiệm vụ, thói quen, mục tiêu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px 10px 38px',
            borderRadius: 12,
            border: '1px solid var(--lq-border)',
            background: 'var(--lq-surface)',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
            color: 'var(--lq-ink)'
          }}
        />
      </div>

      {/* Segmented Sub Tabs */}
      <div style={{
        display: 'flex',
        background: 'var(--lq-surface-subtle)',
        padding: 4,
        borderRadius: 12,
        gap: 4
      }}>
        {subTabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '7px 4px',
                borderRadius: 9,
                fontSize: 11,
                fontWeight: 700,
                background: isActive ? 'var(--lq-surface)' : 'transparent',
                color: isActive ? 'var(--lq-ink)' : 'var(--lq-ink-muted)',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  fontSize: 9,
                  fontWeight: 800,
                  background: isActive ? 'var(--lq-accent)' : 'rgba(0,0,0,0.08)',
                  color: isActive ? '#FFFFFF' : 'inherit',
                  padding: '1px 5px',
                  borderRadius: 6
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {categories.map((c) => {
          const isSelected = selectedCategory === c.id
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              style={{
                padding: '5px 10px',
                borderRadius: 16,
                fontSize: 11,
                fontWeight: 600,
                background: isSelected ? 'var(--lq-primary)' : 'var(--lq-surface)',
                color: isSelected ? '#FFFFFF' : 'var(--lq-ink-muted)',
                border: '1px solid',
                borderColor: isSelected ? 'var(--lq-primary)' : 'var(--lq-border)',
                whiteSpace: 'nowrap'
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* TASKS VIEW */}
      {(activeTab === 'tasks' || activeTab === 'completed') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--lq-ink-muted)' }}>
              Không có nhiệm vụ nào! Bấm "+" bên dưới để tạo mới.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  opacity: task.completed ? 0.6 : 1
                }}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: task.completed ? 'none' : '2px solid var(--lq-border-strong)',
                    background: task.completed
                      ? 'linear-gradient(135deg, #168C78 0%, #116B5C 100%)'
                      : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2
                  }}
                >
                  {task.completed && <CheckCircle2 size={18} color="#FFFFFF" />}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <h4 style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--lq-ink)',
                      textDecoration: task.completed ? 'line-through' : 'none'
                    }}>
                      {task.title}
                    </h4>

                    <button
                      onClick={() => deleteTask(task.id)}
                      style={{ background: 'transparent', color: 'var(--lq-ink-muted)', padding: 2 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {task.description && (
                    <p style={{ fontSize: 11, color: 'var(--lq-ink-muted)', marginTop: 3, lineHeight: 1.35 }}>
                      {task.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: task.priority === 'urgent' ? 'var(--lq-danger)' : 'var(--lq-accent)',
                        background: task.priority === 'urgent' ? 'var(--lq-danger-soft)' : 'var(--lq-accent-soft)',
                        padding: '2px 6px',
                        borderRadius: 6
                      }}>
                        {task.priority === 'urgent' ? 'Khẩn cấp 🔥' : task.priority === 'high' ? 'Ưu tiên' : 'Vừa'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, fontSize: 11, fontWeight: 800 }}>
                      <span style={{ color: 'var(--lq-accent)' }}>+{task.xpReward} XP</span>
                      <span style={{ color: 'var(--lq-reward-ink)' }}>+{task.coinReward} Vàng</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* HABITS VIEW */}
      {activeTab === 'habits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {habits.map((habit) => (
            <div key={habit.id} className="card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--lq-ink)' }}>
                  {habit.title}
                </h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--lq-accent)', fontWeight: 800, fontSize: 12 }}>
                  <Flame size={14} className="animate-pulse-glow" />
                  <span>{habit.streak} ngày</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--lq-ink-muted)' }}>
                  Mục tiêu {habit.targetDaysPerWeek} ngày/tuần &bull; +{habit.xpReward} XP
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!habit.isPositiveOnly && (
                    <button
                      onClick={() => incrementHabit(habit.id, false)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'var(--lq-danger-soft)',
                        color: 'var(--lq-danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800
                      }}
                      title="Ghi nhận vi phạm"
                    >
                      <Minus size={16} />
                    </button>
                  )}

                  <button
                    onClick={() => incrementHabit(habit.id, true)}
                    style={{
                      height: 32,
                      padding: '0 14px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #168C78 0%, #116B5C 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 800,
                      boxShadow: '0 2px 8px rgba(22, 140, 120, 0.25)'
                    }}
                  >
                    <Plus size={14} strokeWidth={3} />
                    <span>+{habit.positiveCount} Thực hiện</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUESTS VIEW (Đại nhiệm vụ / Boss) */}
      {activeTab === 'quests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {quests.map((quest) => {
            const isExpanded = expandedQuestId === quest.id

            return (
              <div key={quest.id} className="card" style={{ padding: '14px', border: '1px solid var(--lq-border-strong)' }}>
                {/* Header */}
                <div
                  onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--lq-accent-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0
                    }}>
                      {quest.badgeIcon}
                    </div>

                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--lq-ink)', lineHeight: 1.3 }}>
                        {quest.title}
                      </h4>
                      <div style={{ fontSize: 11, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
                        {quest.description}
                      </div>
                    </div>
                  </div>

                  <button style={{ background: 'transparent', color: 'var(--lq-ink-muted)', padding: 4 }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: 'var(--lq-ink-muted)' }}>Tiến trình</span>
                    <span style={{ color: 'var(--lq-accent)' }}>{quest.progressPercent}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--lq-surface-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${quest.progressPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #F26B3A 0%, #F6C85F 100%)',
                      borderRadius: 3,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Milestones checklist (when expanded) */}
                {isExpanded && (
                  <div style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid var(--lq-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--lq-ink)', textTransform: 'uppercase' }}>
                      Các mốc quan trọng (Milestones)
                    </div>

                    {quest.milestones.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => toggleMilestone(quest.id, m.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 10,
                          background: m.completed ? 'var(--lq-bg-elevated)' : 'var(--lq-surface-subtle)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          border: m.completed ? 'none' : '1.5px solid var(--lq-border-strong)',
                          background: m.completed ? 'var(--lq-success)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {m.completed && <CheckCircle2 size={14} color="#FFFFFF" />}
                        </div>

                        <span style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--lq-ink)',
                          textDecoration: m.completed ? 'line-through' : 'none',
                          flex: 1
                        }}>
                          {m.title}
                        </span>

                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--lq-accent)' }}>
                          +{m.xpReward} XP
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
