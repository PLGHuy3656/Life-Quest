import React from 'react'

interface QuestsScreenProps {
  onNavigateTab: (tab: 'tasks' | 'habits' | 'quests') => void
  onSelectQuest: (questId: string) => void
}

export const QuestsScreen: React.FC<QuestsScreenProps> = ({
  onNavigateTab,
  onSelectQuest
}) => {
  const quests = [
    {
      id: 'q1',
      title: 'Chinh phục kỳ thi cuối kỳ',
      category: 'Học tập',
      progress: 72,
      milestonesCount: 5,
      deadline: 'hạn 5/12',
      gradient: 'linear-gradient(135deg, #16324A, #1E7F8C)',
      barColor: 'var(--lq-success)'
    },
    {
      id: 'q2',
      title: 'Chạy 5K đầu tiên',
      category: 'Sức khỏe',
      progress: 40,
      milestonesCount: 3,
      deadline: 'hạn 31/12',
      gradient: 'linear-gradient(135deg, #F26B3A, #F6C85F)',
      barColor: 'var(--lq-accent)'
    },
    {
      id: 'q3',
      title: 'Tết này về quê',
      category: 'Gia đình',
      progress: 15,
      milestonesCount: 4,
      deadline: 'hạn 29/1',
      gradient: 'linear-gradient(135deg, #C1121F, #E9B949)',
      barColor: 'var(--lq-danger)'
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
            background: '#FFFFFF',
            border: '1px solid var(--lq-border)',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--lq-ink-secondary)',
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
            background: 'var(--lq-accent-soft)',
            border: '1px solid rgba(242, 107, 58, 0.3)',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--lq-accent)',
            cursor: 'pointer'
          }}
        >
          Quest
        </button>
      </div>

      {/* Quest Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {quests.map((q) => (
          <div
            key={q.id}
            onClick={() => onSelectQuest(q.id)}
            style={{
              background: '#FFFFFF',
              borderRadius: 22,
              overflow: 'hidden',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--lq-border)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Gradient Banner */}
            <div style={{
              height: 84,
              background: q.gradient,
              display: 'flex',
              alignItems: 'flex-end',
              padding: '10px 14px'
            }}>
              <span style={{
                background: '#FFFFFF',
                color: 'var(--lq-primary)',
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 99
              }}>
                {q.category}
              </span>
            </div>

            {/* Quest Content */}
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: 15, color: 'var(--lq-ink)' }}>{q.title}</b>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lq-ink-muted)' }}>
                  {q.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{
                height: 8,
                borderRadius: 99,
                background: 'var(--lq-surface-subtle)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${q.progress}%`,
                  background: q.barColor,
                  borderRadius: 99
                }} />
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lq-ink-muted)' }}>
                {q.milestonesCount} cột mốc · {q.deadline}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default QuestsScreen
