import React, { useState } from 'react'
import { IconClose, IconCalendar, IconArchive, IconPause, IconPlay, IconCheck } from './Icons'

export const GoalDetailModal = ({
  goal,
  isOpen,
  onClose,
  onUpdate,
  onArchive,
  onPause,
  onResume,
  onComplete
}) => {
  if (!isOpen || !goal) return null

  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(goal.title || '')
  const [description, setDescription] = useState(goal.description || '')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim() || title.trim().length < 3) {
      setError('Tiêu đề phải có tối thiểu 3 ký tự')
      return
    }

    setIsSaving(true)
    try {
      await onUpdate(goal.id, {
        title: title.trim(),
        description: description.trim()
      })
      setIsEditing(false)
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật')
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handlebar" />

        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className={`quest-badge badge-${goal.status.toLowerCase()}`}>
              {goal.status}
            </span>
            <h2 className="modal-title">Chi Tiết Nhiệm Vụ</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="modal-alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {!isEditing ? (
          <div className="detail-content">
            <div className="detail-section">
              <h3 className="detail-heading">{goal.title}</h3>
              <p className="detail-desc">
                {goal.description || 'Chưa có ghi chú hoặc mô tả chi tiết cho nhiệm vụ này.'}
              </p>
            </div>

            <div className="detail-meta-grid">
              <div className="detail-meta-box">
                <span className="meta-box-label">Ngày bắt đầu</span>
                <span className="meta-box-val">{formatDate(goal.startDate)}</span>
              </div>
              <div className="detail-meta-box">
                <span className="meta-box-label">Hạn chót hoàn thành</span>
                <span className="meta-box-val text-amber-400">{formatDate(goal.dueDate)}</span>
              </div>
            </div>

            <div className="detail-info-row">
              <span>Mã ID: <code>{goal.id}</code></span>
            </div>

            {/* Actions Bar */}
            <div className="detail-actions-list">
              {goal.status === 'ACTIVE' && (
                <>
                  <button
                    className="action-btn btn-complete w-full"
                    onClick={() => {
                      onComplete(goal)
                      onClose()
                    }}
                  >
                    <IconCheck className="w-4 h-4" />
                    <span>Hoàn thành nhiệm vụ (+150 XP)</span>
                  </button>
                  <button
                    className="action-btn btn-secondary w-full"
                    onClick={() => {
                      onPause(goal)
                      onClose()
                    }}
                  >
                    <IconPause className="w-4 h-4" />
                    <span>Tạm dừng</span>
                  </button>
                </>
              )}

              {goal.status === 'PAUSE' && (
                <button
                  className="action-btn btn-resume w-full"
                  onClick={() => {
                    onResume(goal)
                    onClose()
                  }}
                >
                  <IconPlay className="w-4 h-4" />
                  <span>Tiếp tục thực hiện</span>
                </button>
              )}

              {goal.status !== 'ARCHIVED' && goal.status !== 'COMPLETED' && (
                <div className="flex gap-2 w-full">
                  <button
                    className="btn-modal-cancel flex-1"
                    onClick={() => setIsEditing(true)}
                  >
                    Sửa thông tin
                  </button>

                  <button
                    className="action-btn btn-archive flex-1 justify-center"
                    onClick={() => {
                      onArchive(goal)
                      onClose()
                    }}
                  >
                    <IconArchive className="w-4 h-4 inline mr-1" />
                    Lưu trữ
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="modal-form">
            <div className="form-group">
              <label className="form-label">Tiêu đề</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-modal-submit"
                disabled={isSaving}
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
