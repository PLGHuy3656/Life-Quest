import React, { useState } from 'react'

export const CalendarScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week')
  const [selectedDay, setSelectedDay] = useState(27)

  // 30 days of Nov 2026
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  const dotsOnDays = [3, 9, 14, 20, 30]

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
          Lịch
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setViewMode('month')}
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              background: viewMode === 'month' ? 'var(--lq-accent-soft)' : '#FFFFFF',
              border: viewMode === 'month' ? '1px solid rgba(242, 107, 58, 0.3)' : '1px solid var(--lq-border)',
              fontWeight: 700,
              fontSize: 12,
              color: viewMode === 'month' ? 'var(--lq-accent)' : 'var(--lq-ink-secondary)',
              cursor: 'pointer'
            }}
          >
            Tháng
          </button>

          <button
            onClick={() => setViewMode('week')}
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              background: viewMode === 'week' ? 'var(--lq-accent-soft)' : '#FFFFFF',
              border: viewMode === 'week' ? '1px solid rgba(242, 107, 58, 0.3)' : '1px solid var(--lq-border)',
              fontWeight: 700,
              fontSize: 12,
              color: viewMode === 'week' ? 'var(--lq-accent)' : 'var(--lq-ink-secondary)',
              cursor: 'pointer'
            }}
          >
            Tuần
          </button>
        </div>
      </div>

      {/* Calendar Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 22,
        padding: '16px',
        border: '1px solid var(--lq-border)',
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <b style={{ fontSize: 15, color: 'var(--lq-ink)' }}>Tháng 11, 2026</b>
        </div>

        {/* Days of week header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 2,
          textAlign: 'center',
          marginBottom: 6
        }}>
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
            <span key={d} style={{ fontSize: 11, fontWeight: 700, color: 'var(--lq-ink-muted)' }}>
              {d}
            </span>
          ))}
        </div>

        {/* Month grid days */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 2,
          textAlign: 'center'
        }}>
          {/* Empty offset for Nov 1 2026 (Sunday -> 6 empty cells) */}
          <div /><div /><div /><div /><div /><div />

          {days.map((dayNum) => {
            const isSelected = selectedDay === dayNum
            const hasDot = dotsOnDays.includes(dayNum)

            return (
              <div
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                style={{
                  height: 38,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  background: isSelected ? 'var(--lq-accent)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'var(--lq-ink)',
                  transition: 'background 0.15s ease'
                }}
              >
                <span>{dayNum}</span>
                {hasDot && !isSelected && (
                  <i style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'var(--lq-success)',
                    display: 'block',
                    marginTop: 1
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Day Schedule */}
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--lq-ink)', marginTop: 4 }}>
        Thứ Sáu, {selectedDay}/11
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Task 1 */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '12px 14px',
          border: '1px solid var(--lq-border)',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid var(--lq-border)',
            flexShrink: 0
          }} />

          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13.5, color: 'var(--lq-ink)' }}>Ôn Chương 3 – Giải tích</b>
            <div style={{ fontSize: 11.5, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
              19:00
            </div>
          </div>

          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 99,
            background: 'var(--lq-danger-soft)',
            color: 'var(--lq-danger)'
          }}>
            Cao
          </span>
        </div>

        {/* Task 2 */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '12px 14px',
          border: '1px solid var(--lq-border)',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid var(--lq-border)',
            flexShrink: 0
          }} />

          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13.5, color: 'var(--lq-ink)' }}>Chạy bộ 20 phút</b>
            <div style={{ fontSize: 11.5, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
              20:30
            </div>
          </div>

          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 99,
            background: 'var(--lq-success-soft)',
            color: 'var(--lq-success)'
          }}>
            Habit
          </span>
        </div>

        {/* Task 3 */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '12px 14px',
          border: '1px solid var(--lq-border)',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid var(--lq-border)',
            flexShrink: 0
          }} />

          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13.5, color: 'var(--lq-ink)' }}>Viết nhật ký</b>
            <div style={{ fontSize: 11.5, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
              22:00
            </div>
          </div>

          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 99,
            background: 'var(--lq-success-soft)',
            color: 'var(--lq-success)'
          }}>
            Habit
          </span>
        </div>
      </div>
    </div>
  )
}
export default CalendarScreen
