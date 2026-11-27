import React, { useState } from 'react'
import { useStore } from '../store/questStore'
import { ChevronLeft, ChevronRight, Clock, Plus, CheckCircle2, Calendar as CalIcon } from 'lucide-react'

export const CalendarScreen: React.FC = () => {
  const { schedules } = useStore()
  const [selectedDay, setSelectedDay] = useState(27)

  const daysOfWeek = [
    { dayName: 'T2', date: 24 },
    { dayName: 'T3', date: 25 },
    { dayName: 'T4', date: 26 },
    { dayName: 'T5', date: 27, isToday: true },
    { dayName: 'T6', date: 28 },
    { dayName: 'T7', date: 29 },
    { dayName: 'CN', date: 30 }
  ]

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px' }}>
      {/* Month Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--lq-ink)' }}>
            Tháng 11, 2026
          </h2>
          <div style={{ fontSize: 11, color: 'var(--lq-ink-muted)' }}>
            Lịch trình & Kế hoạch rèn luyện
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--lq-surface)',
            border: '1px solid var(--lq-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--lq-ink)'
          }}>
            <ChevronLeft size={16} />
          </button>
          <button style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--lq-surface)',
            border: '1px solid var(--lq-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--lq-ink)'
          }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Week Selector Pills */}
      <div style={{
        display: 'flex',
        background: 'var(--lq-surface)',
        padding: '10px 6px',
        borderRadius: 16,
        border: '1px solid var(--lq-border)',
        justifyContent: 'space-between'
      }}>
        {daysOfWeek.map((d) => {
          const isSelected = selectedDay === d.date
          return (
            <button
              key={d.date}
              onClick={() => setSelectedDay(d.date)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: 12,
                background: isSelected ? 'var(--lq-primary)' : 'transparent',
                color: isSelected ? '#FFFFFF' : 'var(--lq-ink)',
                minWidth: 42
              }}
            >
              <span style={{ fontSize: 10, opacity: isSelected ? 0.9 : 0.6, fontWeight: 600 }}>
                {d.dayName}
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>
                {d.date}
              </span>
              {d.isToday && (
                <div style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  background: isSelected ? '#FFFFFF' : 'var(--lq-accent)',
                  marginTop: 3
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Daily Timeline */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 2px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--lq-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalIcon size={16} color="var(--lq-accent)" />
            <span>Thời Gian Biểu ({schedules.length} sự kiện)</span>
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {schedules.map((item, idx) => (
            <div
              key={item.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderLeft: `4px solid ${idx % 2 === 0 ? 'var(--lq-accent)' : 'var(--lq-primary)'}`,
                opacity: item.completed ? 0.6 : 1
              }}
            >
              <div style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--lq-ink)',
                minWidth: 50,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <Clock size={12} color="var(--lq-ink-muted)" />
                <span>{item.time}</span>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--lq-ink)',
                  textDecoration: item.completed ? 'line-through' : 'none'
                }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
                  {item.category === 'work' ? 'Công việc' : item.category === 'fitness' ? 'Thể lực' : 'Kỷ luật'}
                </div>
              </div>

              <div style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 8,
                background: item.completed ? 'var(--lq-success-soft)' : 'var(--lq-surface-subtle)',
                color: item.completed ? 'var(--lq-success)' : 'var(--lq-ink-muted)'
              }}>
                {item.completed ? 'Hoàn thành' : 'Sắp tới'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
