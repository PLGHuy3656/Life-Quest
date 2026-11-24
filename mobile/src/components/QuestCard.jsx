import React from 'react'
import { IconCheck, IconPause, IconPlay, IconArchive, IconClock, IconCalendar } from './Icons'

export const QuestCard = ({ goal, onComplete, onPause, onResume, onArchive, onClick }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="quest-badge badge-active">⚔️ Đang thực hiện</span>
      case 'PAUSE':
        return <span className="quest-badge badge-pause">⏸️ Tạm dừng</span>
      case 'COMPLETED':
        return <span className="quest-badge badge-completed">✨ Hoàn thành</span>
      case 'ARCHIVED':
        return <span className="quest-badge badge-archived">📦 Lưu trữ</span>
      default:
        return <span className="quest-badge">{status}</span>
    }
  }

  // Format Due Date & Calculate time remaining
  const now = new Date()
  const due = new Date(goal.dueDate)
  const diffTime = due - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let timeRemainingText = ''
  let timeRemainingClass = ''

  if (goal.status === 'COMPLETED') {
    timeRemainingText = 'Đã hoàn thành'
    timeRemainingClass = 'time-success'
  } else if (diffDays < 0) {
    timeRemainingText = `Quá hạn ${Math.abs(diffDays)} ngày`
    timeRemainingClass = 'time-danger'
  } else if (diffDays === 0) {
    timeRemainingText = 'Hạn chót hôm nay!'
    timeRemainingClass = 'time-warning'
  } else {
    timeRemainingText = `Còn ${diffDays} ngày`
    timeRemainingClass = 'time-normal'
  }

  const formatDate = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  }

  return (
    <div className={`quest-card quest-card-${goal.status.toLowerCase()}`}>
      {/* Header Info */}
      <div className="quest-card-header" onClick={() => onClick(goal)}>
        <div className="quest-title-wrap">
          <h3 className="quest-title">{goal.title}</h3>
          {getStatusBadge(goal.status)}
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="quest-desc" onClick={() => onClick(goal)}>
          {goal.description}
        </p>
      )}

      {/* Quest Dates & Progress meta */}
      <div className="quest-meta-row" onClick={() => onClick(goal)}>
        <div className="quest-date-meta">
          <IconCalendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDate(goal.startDate)} - {formatDate(goal.dueDate)}</span>
        </div>

        <div className={`quest-time-badge ${timeRemainingClass}`}>
          <IconClock className="w-3.5 h-3.5" />
          <span>{timeRemainingText}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="quest-actions-row">
        {goal.status === 'ACTIVE' && (
          <>
            <button
              className="action-btn btn-complete"
              onClick={(e) => {
                e.stopPropagation()
                onComplete(goal)
              }}
              title="Hoàn thành nhiệm vụ để nhận EXP"
            >
              <IconCheck className="w-4 h-4" />
              <span>Hoàn thành (+150 XP)</span>
            </button>

            <button
              className="action-btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation()
                onPause(goal)
              }}
              title="Tạm dừng mục tiêu"
            >
              <IconPause className="w-4 h-4" />
              <span>Tạm dừng</span>
            </button>
          </>
        )}

        {goal.status === 'PAUSE' && (
          <button
            className="action-btn btn-resume"
            onClick={(e) => {
              e.stopPropagation()
              onResume(goal)
            }}
            title="Tiếp tục thực hiện"
          >
            <IconPlay className="w-4 h-4" />
            <span>Tiếp tục</span>
          </button>
        )}

        {goal.status !== 'ARCHIVED' && goal.status !== 'COMPLETED' && (
          <button
            className="action-btn btn-archive"
            onClick={(e) => {
              e.stopPropagation()
              onArchive(goal)
            }}
            title="Lưu trữ nhiệm vụ"
          >
            <IconArchive className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
