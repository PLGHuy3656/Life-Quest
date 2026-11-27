import React, { useState } from 'react'
import { Flame } from 'lucide-react'

interface HabitsScreenProps {
  onNavigateTab: (tab: 'tasks' | 'habits' | 'quests') => void
}

export const HabitsScreen: React.FC<HabitsScreenProps> = ({ onNavigateTab }) => {
  const [habits, setHabits] = useState([
    {
      id: 'h1',
      title: 'Chạy bộ 20 phút',
      streak: 12,
      chipType: 'c-o',
      days: [true, true, true, true, true, true, false]
    },
    {
      id: 'h2',
      title: 'Đọc 10 trang sách',
      streak: 8,
      chipType: 'c-g',
      days: [true, true, true, true, true, false, false]
    },
    {
      id: 'h3',
      title: 'Uống đủ 2 lít nước',
      streak: 3,
      chipType: 'c-y',
      days: [true, true, true, false, false, false, false]
    },
    {
      id: 'h4',
      title: 'Viết nhật ký',
      streak: 21,
      chipType: 'c-o',
      days: [true, true, true, true, true, true, true]
    }
  ])

  const toggleHabitDay = (habitIndex: number, dayIndex: number) => {
    setHabits((prev) =>
      prev.map((h, i) => {
        if (i !== habitIndex) return h
        const newDays = [...h.days]
        newDays[dayIndex] = !newDays[dayIndex]
        return { ...h, days: newDays }
      })
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      padding: '12px 16px 80px',
      gap: 14
    }}>
      {/* Top Header */}
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--lq-ink)' }}>
        Công việc
      </div>

      {/* Tabs: Task | Habit | Quest */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onNavigateTab('tasks')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: '#FFFFFF',
            border: '1px solid var(--lq-border)',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--lq-ink-secondary)',
            cursor: 'pointer'
          }}
        >
          Task
        </button>

        <button
          onClick={() => onNavigateTab('habits')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: 'var(--lq-accent-soft)',
            border: '1px solid rgba(242, 107, 58, 0.3)',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--lq-accent)',
            cursor: 'pointer'
          }}
        >
          Habit
        </button>

        <button
          onClick={() => onNavigateTab('quests')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: '#FFFFFF',
            border: '1px solid var(--lq-border)',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--lq-ink-secondary)',
            cursor: 'pointer'
          }}
        >
          Quest
        </button>
      </div>

      {/* Habit Overview Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 22,
        padding: '14px 16px',
        border: '1px solid var(--lq-border)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'var(--lq-accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--lq-accent)',
          flexShrink: 0
        }}>
          <Flame size={24} />
        </div>

        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>Thói quen duy trì</b>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
            3/5 thói quen hôm nay
          </div>
        </div>

        <img
          src="/assets/fox/fox-mood-happy-anim.webp"
          alt="Fox Happy"
          style={{ width: 54, height: 'auto', objectFit: 'contain' }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/assets/fox/fox-mood-happy.png'
          }}
        />
      </div>

      {/* Habits List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {habits.map((habit, hIdx) => (
          <div
            key={habit.id}
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              padding: '14px',
              border: '1px solid var(--lq-border)',
              boxShadow: 'var(--shadow)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>{habit.title}</b>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 99,
                background: habit.chipType === 'c-o' ? 'var(--lq-accent-soft)' : habit.chipType === 'c-g' ? 'var(--lq-success-soft)' : 'var(--lq-reward-soft)',
                color: habit.chipType === 'c-o' ? 'var(--lq-accent)' : habit.chipType === 'c-g' ? 'var(--lq-success)' : 'var(--lq-reward-ink)'
              }}>
                {habit.streak} ngày
              </span>
            </div>

            {/* 7 Day Blocks Grid */}
            <div style={{ display: 'flex', gap: 6 }}>
              {habit.days.map((checked, dIdx) => (
                <div
                  key={dIdx}
                  onClick={() => toggleHabitDay(hIdx, dIdx)}
                  style={{
                    flex: 1,
                    height: 28,
                    borderRadius: 8,
                    background: checked ? 'var(--lq-success)' : 'var(--lq-surface-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Ngày ${dIdx + 1}: ${checked ? 'Đã hoàn thành' : 'Chưa check-in'}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default HabitsScreen
