import React, { useState } from 'react'
import { IconClose, IconCalendar, IconSparkles } from './Icons'

export const CreateGoalModal = ({ isOpen, onClose, onSubmit, userId }) => {
  const today = new Date().toISOString().split('T')[0]
  const defaultDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [dueDate, setDueDate] = useState(defaultDue)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validation matching backend
    if (!title.trim() || title.trim().length < 3) {
      setError('Tiêu đề nhiệm vụ phải có ít nhất 3 ký tự.')
      return
    }

    if (title.trim().length > 100) {
      setError('Tiêu đề nhiệm vụ không được vượt quá 100 ký tự.')
      return
    }

    const start = new Date(startDate)
    const due = new Date(dueDate)

    if (start >= due) {
      setError('Ngày bắt đầu phải trước ngày hạn chót (Start date must be before due date).')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        userId,
        title: title.trim(),
        description: description.trim(),
        startDate: start.toISOString(),
        dueDate: due.toISOString()
      })
      // Reset form
      setTitle('')
      setDescription('')
      setStartDate(today)
      setDueDate(defaultDue)
      onClose()
    } catch (err) {
      setError(err.message || 'Không thể tạo nhiệm vụ. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Modal Handlebar for Mobile Feel */}
        <div className="modal-handlebar" />

        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="quest-badge badge-active">Quest Mới</span>
            <h2 className="modal-title">Tạo Nhiệm Vụ Mới</h2>
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

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Tiêu đề */}
          <div className="form-group">
            <label className="form-label">
              Tên nhiệm vụ / Mục tiêu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Chạy bộ 5km mỗi sáng, Học 20 từ vựng..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
            <span className="form-hint">{title.length}/100 ký tự (tối thiểu 3)</span>
          </div>

          {/* Mô tả */}
          <div className="form-group">
            <label className="form-label">Chi tiết nhiệm vụ / Phần thưởng</label>
            <textarea
              className="form-textarea"
              placeholder="Ghi chú điều kiện hoàn thành hoặc cách thức thực hiện..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
            <span className="form-hint">{description.length}/500 ký tự</span>
          </div>

          {/* Ngày bắt đầu & Hạn chót */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">
                <IconCalendar className="w-3.5 h-3.5 inline mr-1" />
                Bắt đầu
              </label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <IconCalendar className="w-3.5 h-3.5 inline mr-1" />
                Hạn chót
              </label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Reward Preview */}
          <div className="quest-reward-preview">
            <IconSparkles className="w-4 h-4 text-amber-400" />
            <span>Phần thưởng khi hoàn thành: <strong>+150 XP</strong> &amp; <strong>+50 Vàng 🪙</strong></span>
          </div>

          {/* Submit Action */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang tạo...' : '⚔️ Nhận Nhiệm Vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
