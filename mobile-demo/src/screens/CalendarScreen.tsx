import React, { useState } from 'react'
import { Check, Clock, X, Calendar as CalendarIcon } from 'lucide-react'

interface CalendarTask {
  id: string
  title: string
  time: string
  tag: string
  tagType: 'danger' | 'success' | 'accent' | 'reward'
  done: boolean
}

const INITIAL_SCHEDULE: Record<number, CalendarTask[]> = {
  3: [
    { id: 'd3-1', title: 'Nộp báo cáo tuần môn Thiết kế UI', time: '10:00', tag: 'Cao', tagType: 'danger', done: false },
    { id: 'd3-2', title: 'Đọc 20 trang sách', time: '21:00', tag: 'Habit', tagType: 'success', done: false }
  ],
  9: [
    { id: 'd9-1', title: 'Họp nhóm đồ án LifeQuest', time: '14:30', tag: 'Nhóm', tagType: 'accent', done: false }
  ],
  14: [
    { id: 'd14-1', title: 'Kiểm tra giữa kỳ Giải tích', time: '08:00', tag: 'Quan trọng', tagType: 'danger', done: false },
    { id: 'd14-2', title: 'Chạy bộ 3km công viên', time: '17:30', tag: 'Habit', tagType: 'success', done: false }
  ],
  20: [
    { id: 'd20-1', title: 'Hoàn thiện prototype Mobile', time: '16:00', tag: 'Quest', tagType: 'reward', done: false }
  ],
  27: [
    { id: 'd27-1', title: 'Ôn Chương 3 – Giải tích', time: '19:00', tag: 'Cao', tagType: 'danger', done: false },
    { id: 'd27-2', title: 'Chạy bộ 20 phút', time: '20:30', tag: 'Habit', tagType: 'success', done: false },
    { id: 'd27-3', title: 'Viết nhật ký', time: '22:00', tag: 'Habit', tagType: 'success', done: false }
  ],
  28: [
    { id: 'd28-1', title: 'Review tiến độ tuần cùng Fox', time: '09:30', tag: 'Quest', tagType: 'reward', done: false },
    { id: 'd28-2', title: 'Dọn dẹp góc học tập', time: '15:00', tag: 'Habit', tagType: 'success', done: false }
  ],
  30: [
    { id: 'd30-1', title: 'Tổng kết mục tiêu Tháng 11', time: '20:00', tag: 'Quan trọng', tagType: 'accent', done: false }
  ]
}

// Nov 1, 2026 is Sunday (0). Map day number (1..30) to Vietnamese weekday label.
const getVietnameseWeekday = (dayNum: number): string => {
  const date = new Date(2026, 10, dayNum) // Month 10 = November
  const names = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return names[date.getDay()]
}

const getTagColors = (type: CalendarTask['tagType']) => {
  switch (type) {
    case 'danger':
      return { bg: 'var(--lq-danger-soft)', color: 'var(--lq-danger)' }
    case 'success':
      return { bg: 'var(--lq-success-soft)', color: 'var(--lq-success)' }
    case 'reward':
      return { bg: 'var(--lq-reward-soft)', color: 'var(--lq-reward-ink)' }
    default:
      return { bg: 'var(--lq-accent-soft)', color: 'var(--lq-accent)' }
  }
}

export const CalendarScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [selectedDay, setSelectedDay] = useState<number>(27)
  const [modalDay, setModalDay] = useState<number | null>(null)
  const [schedule, setSchedule] = useState<Record<number, CalendarTask[]>>(INITIAL_SCHEDULE)

  const today = 27
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  // Current week around Nov 27, 2026: Mon 23 .. Sun 29
  const currentWeekDays = [23, 24, 25, 26, 27, 28, 29]

  const getPendingCount = (dayNum: number) => {
    const list = schedule[dayNum] || []
    return list.filter((t) => !t.done).length
  }

  const handleOpenDay = (dayNum: number) => {
    setSelectedDay(dayNum)
    setModalDay(dayNum)
  }

  const toggleTaskDone = (dayNum: number, taskId: string) => {
    setSchedule((prev) => {
      const list = prev[dayNum] || []
      return {
        ...prev,
        [dayNum]: list.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
      }
    })
  }

  const activeModalTasks = modalDay !== null ? schedule[modalDay] || [] : []
  const activeModalPending = modalDay !== null ? getPendingCount(modalDay) : 0

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
          Lịch
        </div>

        <div style={{ display: 'flex', gap: 5 }}>
          <button
            onClick={() => setViewMode('month')}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: viewMode === 'month' ? 'var(--lq-accent-soft)' : '#FFFFFF',
              border:
                viewMode === 'month'
                  ? '1.5px solid rgba(242, 107, 58, 0.35)'
                  : '1px solid var(--lq-border)',
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
              padding: '6px 14px',
              borderRadius: 999,
              background: viewMode === 'week' ? 'var(--lq-accent-soft)' : '#FFFFFF',
              border:
                viewMode === 'week'
                  ? '1.5px solid rgba(242, 107, 58, 0.35)'
                  : '1px solid var(--lq-border)',
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

      {/* Main Calendar Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          padding: '18px 14px 16px',
          border: '1.5px solid #EAE2D6',
          boxShadow: '0 4px 0 #E3D9CB, 0 12px 26px rgba(22, 50, 74, 0.07)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            padding: '0 4px'
          }}
        >
          <b style={{ fontSize: 16, fontWeight: 800, color: 'var(--lq-ink)' }}>
            Tháng 11, 2026
          </b>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              color: '#C84032',
              background: 'rgba(229, 57, 53, 0.1)',
              padding: '4px 9px',
              borderRadius: 99
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#E53935',
                display: 'inline-block'
              }}
            />
            Số việc trong ngày
          </span>
        </div>

        {/* Days of week header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
            textAlign: 'center',
            marginBottom: 8
          }}
        >
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
            <span
              key={d}
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: 'var(--lq-ink-muted)'
              }}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Month or Week Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 6,
            textAlign: 'center'
          }}
        >
          {/* Empty offset for Nov 1 2026 (Sunday -> 6 empty cells) only in Month view */}
          {viewMode === 'month' && (
            <>
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
            </>
          )}

          {(viewMode === 'month' ? days : currentWeekDays).map((dayNum) => {
            const isToday = dayNum === today
            const isSelected = selectedDay === dayNum
            const pendingCount = getPendingCount(dayNum)

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => handleOpenDay(dayNum)}
                style={{
                  position: 'relative',
                  height: viewMode === 'week' ? 54 : 44,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  background: isToday
                    ? 'var(--lq-accent)'
                    : isSelected
                    ? 'var(--lq-accent-soft)'
                    : pendingCount > 0
                    ? '#FAF7F2'
                    : 'transparent',
                  border:
                    isSelected && !isToday
                      ? '1.5px solid rgba(242, 107, 58, 0.45)'
                      : pendingCount > 0 && !isToday
                      ? '1px solid #EFE6DA'
                      : '1px solid transparent',
                  color: isToday
                    ? '#FFFFFF'
                    : isSelected
                    ? 'var(--lq-accent)'
                    : 'var(--lq-ink)',
                  boxShadow: isToday ? '0 3px 10px rgba(242, 107, 58, 0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{dayNum}</span>

                {/* Red Notification Count Badge */}
                {pendingCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -3,
                      minWidth: 18,
                      height: 18,
                      padding: '0 4px',
                      borderRadius: 99,
                      background: 'linear-gradient(135deg, #FF4D4F 0%, #D92626 100%)',
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #FFFFFF',
                      boxShadow: '0 2px 6px rgba(217, 38, 38, 0.45)',
                      lineHeight: 1
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Clean Hint Footer inside Calendar Card */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px dashed #EAE2D6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--lq-ink-muted)'
          }}
        >
          <CalendarIcon size={14} color="var(--lq-accent)" />
          <span>Nhấn vào ngày bất kỳ để xem bảng công việc hôm đó</span>
        </div>
      </div>

      {/* Popup Modal Sheet: Bảng hiển thị các công việc của ngày được nhấn */}
      {modalDay !== null && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setModalDay(null)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(22, 50, 74, 0.48)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)'
            }}
          />

          {/* Task Panel Card */}
          <div
            className="animate-fade-in"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 350,
              maxHeight: '72vh',
              background: '#FAF8F4',
              borderRadius: 24,
              border: '1.5px solid #EAE2D6',
              boxShadow: '0 20px 48px rgba(22, 50, 74, 0.28)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 2
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 16px 14px',
                background: '#FFFFFF',
                borderBottom: '1px solid #EFE8DD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <b style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--lq-ink)' }}>
                    {getVietnameseWeekday(modalDay)}, {modalDay}/11
                  </b>
                  {activeModalPending > 0 && (
                    <span
                      style={{
                        background: '#E53935',
                        color: '#FFFFFF',
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 99
                      }}
                    >
                      {activeModalPending} việc
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
                  {modalDay === today ? 'Lịch trình hôm nay' : 'Danh sách công việc trong ngày'}
                </div>
              </div>

              <button
                onClick={() => setModalDay(null)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#F5F1EB',
                  border: '1px solid #E8E0D5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--lq-ink)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                aria-label="Đóng bảng công việc"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Body: Task List or Empty State */}
            <div
              style={{
                padding: '14px 14px 18px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              {activeModalTasks.length === 0 ? (
                <div
                  style={{
                    padding: '24px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 8
                  }}
                >
                  <img
                    src="/assets/fox/fox-cp1-anim.webp"
                    alt="Fox Nghỉ Ngơi"
                    style={{ width: 92, height: 92, objectFit: 'contain' }}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = '/assets/fox/fox-cp1.png'
                    }}
                  />
                  <b style={{ fontSize: 14.5, color: 'var(--lq-ink)' }}>
                    Chưa có công việc nào
                  </b>
                  <span style={{ fontSize: 12, color: 'var(--lq-ink-muted)', lineHeight: 1.4 }}>
                    Ngày {modalDay}/11 đang trống lịch — bạn có thể bấm nút <b>+</b> để thêm nhiệm vụ mới!
                  </span>
                </div>
              ) : (
                activeModalTasks.map((task) => {
                  const tagStyle = getTagColors(task.tagType)
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskDone(modalDay, task.id)}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: 16,
                        padding: '12px 13px',
                        border: task.done
                          ? '1.5px solid rgba(22, 140, 120, 0.35)'
                          : '1px solid var(--lq-border)',
                        boxShadow: '0 2px 8px rgba(22, 50, 74, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 11,
                        cursor: 'pointer',
                        opacity: task.done ? 0.72 : 1,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          width: 23,
                          height: 23,
                          borderRadius: '50%',
                          border: task.done ? 'none' : '2px solid #D3C9BC',
                          background: task.done ? 'var(--lq-success)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          flexShrink: 0
                        }}
                      >
                        {task.done && <Check size={13} strokeWidth={3} />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b
                          style={{
                            fontSize: 13.5,
                            color: 'var(--lq-ink)',
                            textDecoration: task.done ? 'line-through' : 'none',
                            display: 'block'
                          }}
                        >
                          {task.title}
                        </b>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11.5,
                            color: 'var(--lq-ink-muted)',
                            marginTop: 2,
                            fontWeight: 600
                          }}
                        >
                          <Clock size={11} />
                          <span>{task.time}</span>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 99,
                          background: tagStyle.bg,
                          color: tagStyle.color,
                          flexShrink: 0
                        }}
                      >
                        {task.tag}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarScreen
