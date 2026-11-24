import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Check, Info, Plus, Search, User, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { useGoalMutations } from '@/hooks/useWorkData'
import { useAuthStore } from '@/stores/authStore'
import type { Goal } from '@/types/domain'
import { addDaysLocal, getTodayLocalDate } from '@/utils/date'
import {
  COLLAB_PREVIEW_FRIENDS,
  type QuestMode
} from './questUtils'
import styles from './WorkPage.module.css'

export interface QuestCreateSheetProps {
  open: boolean
  editingGoal?: Goal | null
  initialTitle?: string
  onClose: () => void
  onCreated?: (goal: Goal) => void
  onRequestFirstTask?: (goal: Goal) => void
}

/**
 * Shared FE-04C Quest Creation & Edit Sheet (backed by verified Goal API).
 * - Supports Personal and Collaborative mode selection.
 * - In Collaborative mode, exposes Friend Search & Selection UI with an honest
 *   PENDING API boundary (never fabricates sent invitations or membership records).
 * - Prevents duplicate submissions and offers optional "Thêm Task đầu tiên" after API confirmation.
 */
export function QuestCreateSheet({
  open,
  editingGoal = null,
  initialTitle = '',
  onClose,
  onCreated,
  onRequestFirstTask
}: QuestCreateSheetProps) {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const goalMut = useGoalMutations()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<QuestMode>('personal')
  const [startDate, setStartDate] = useState(getTodayLocalDate())
  const [dueDate, setDueDate] = useState(addDaysLocal(getTodayLocalDate(), 30))
  const [friendSearch, setFriendSearch] = useState('')
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [createdGoal, setCreatedGoal] = useState<Goal | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setCreatedGoal(null)
    if (editingGoal) {
      setTitle(editingGoal.title)
      setDescription(editingGoal.description ?? '')
      setStartDate(editingGoal.startDate.slice(0, 10))
      setDueDate(editingGoal.dueDate.slice(0, 10))
      setMode('personal')
      setSelectedFriendIds([])
    } else if (initialTitle.trim()) {
      setTitle(initialTitle.trim())
    }
  }, [open, editingGoal, initialTitle])

  const filteredFriends = useMemo(() => {
    const q = friendSearch.trim().toLowerCase()
    if (!q) return COLLAB_PREVIEW_FRIENDS
    return COLLAB_PREVIEW_FRIENDS.filter(
      (f) => f.displayName.toLowerCase().includes(q) || f.username.toLowerCase().includes(q)
    )
  }, [friendSearch])

  const isSubmitting = goalMut.createGoal.isPending || goalMut.updateGoal.isPending

  const toggleFriend = (id: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setError(null)

    const cleanTitle = title.trim()
    if (cleanTitle.length < 3 || cleanTitle.length > 100) {
      setError('Tiêu đề hành trình cần từ 3 đến 100 ký tự.')
      return
    }
    if (dueDate <= startDate) {
      setError('Ngày hạn hoàn thành phải lớn hơn ngày bắt đầu.')
      return
    }
    if (!isAuthenticated) {
      setError('Đang ở chế độ xem trước — đăng nhập tài khoản để tạo và lưu hành trình lên máy chủ.')
      return
    }

    try {
      const payload = {
        title: cleanTitle,
        description: description.trim(),
        startDate: `${startDate}T00:00:00.000Z`,
        dueDate: `${dueDate}T23:59:59.000Z`
      }
      if (editingGoal) {
        await goalMut.updateGoal.mutateAsync({ goalId: editingGoal.id, input: payload })
        onClose()
      } else {
        const result = await goalMut.createGoal.mutateAsync(payload)
        setTitle('')
        setDescription('')
        setSelectedFriendIds([])
        setCreatedGoal(result)
        onCreated?.(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu hành trình.')
    }
  }

  return (
    <Sheet
      open={open}
      title={editingGoal ? 'Chỉnh sửa hành trình' : 'Tạo hành trình (Quest) mới'}
      onClose={onClose}
    >
      {createdGoal ? (
        <div className={styles.stack} data-testid="quest-created-followup">
          <div className={styles.evidenceActionNotice} role="status">
            <strong>Đã tạo hành trình “{createdGoal.title}”!</strong>
            <br />
            Bạn có thể thêm nhiệm vụ đầu tiên ngay bây giờ hoặc mở chi tiết hành trình để quản lý.
          </div>
          <div className={styles.btnGroup} style={{ justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onClose}>
              Để sau
            </Button>
            {onRequestFirstTask && (
              <Button
                variant="accent"
                onClick={() => {
                  const target = createdGoal
                  onClose()
                  onRequestFirstTask(target)
                }}
                data-testid="quest-add-first-task-btn"
              >
                <Plus size={14} aria-hidden="true" /> Thêm Task đầu tiên
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit} data-testid="quest-create-form">
          {error && (
            <div className={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          {/* Mode Selector: Personal vs Collaborative */}
          {!editingGoal && (
            <div className={styles.field}>
              <span className={styles.label}>Chế độ hành trình</span>
              <div className={styles.modeToggleRow} role="group" aria-label="Chọn chế độ hành trình">
                <button
                  type="button"
                  aria-pressed={mode === 'personal'}
                  className={`${styles.modeToggleBtn} ${mode === 'personal' ? styles.modeToggleActive : ''}`}
                  onClick={() => setMode('personal')}
                  data-testid="quest-mode-personal"
                >
                  <User size={14} aria-hidden="true" />
                  <span>Cá nhân</span>
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'collaborative'}
                  className={`${styles.modeToggleBtn} ${mode === 'collaborative' ? styles.modeToggleActive : ''}`}
                  onClick={() => setMode('collaborative')}
                  data-testid="quest-mode-collaborative"
                >
                  <Users size={14} aria-hidden="true" />
                  <span>Cộng tác cùng bạn bè</span>
                </button>
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="quest-create-title" className={styles.label}>
              Tên hành trình (3–100 ký tự)
            </label>
            <input
              id="quest-create-title"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Hoàn thành đồ án LifeQuest"
              maxLength={100}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="quest-create-desc" className={styles.label}>
              Mô tả mục tiêu
            </label>
            <textarea
              id="quest-create-desc"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mục tiêu chính và tiêu chí hoàn thành của hành trình..."
              maxLength={500}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="quest-create-start" className={styles.label}>
                Ngày bắt đầu
              </label>
              <input
                id="quest-create-start"
                type="date"
                className={styles.input}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="quest-create-due" className={styles.label}>
                Hạn hoàn thành
              </label>
              <input
                id="quest-create-due"
                type="date"
                className={styles.input}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Collaborative Friend Invite Picker (Honest PENDING API Boundary) */}
          {mode === 'collaborative' && !editingGoal && (
            <div className={styles.collabInviteBox} data-testid="quest-friend-invite-picker">
              <div className={styles.itemRow}>
                <strong style={{ fontSize: 13, color: '#16324a' }}>Mời bạn bè tham gia</strong>
                <span className={styles.pendingPill}>INVITE API: PENDING</span>
              </div>

              <div className={styles.searchWrap}>
                <Search size={13} className={styles.searchIcon} aria-hidden="true" />
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder="Tìm bạn bè theo tên hoặc username..."
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  aria-label="Tìm bạn bè để mời"
                />
              </div>

              <div className={styles.friendPickerList}>
                {filteredFriends.map((friend) => {
                  const selected = selectedFriendIds.includes(friend.id)
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      className={`${styles.friendPickerRow} ${selected ? styles.friendPickerSelected : ''}`}
                      onClick={() => toggleFriend(friend.id)}
                      aria-pressed={selected}
                    >
                      <span
                        className={styles.memberAvatar}
                        style={{ background: friend.accentColor }}
                        aria-hidden="true"
                      >
                        {friend.initials}
                      </span>
                      <span className={styles.friendPickerInfo}>
                        <strong>{friend.displayName}</strong>
                        <span>@{friend.username}</span>
                      </span>
                      <span className={styles.friendCheckMark}>
                        {selected ? <Check size={14} aria-hidden="true" /> : 'Chọn'}
                      </span>
                    </button>
                  )
                })}
              </div>

              <p className={styles.focusDisclaimer}>
                <Info size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                Backend hiện tạo hành trình qua <code>POST /api/v1/goals</code> (cá nhân). Lời mời{' '}
                {selectedFriendIds.length > 0 ? `(${selectedFriendIds.length} bạn đã chọn) ` : ''}
                chưa được gửi đi cho đến khi Backend bổ sung Friendship &amp; Quest Collaboration API.
              </p>
            </div>
          )}

          <div className={styles.btnGroup} style={{ justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={isSubmitting}
              data-testid="quest-submit-btn"
            >
              {isSubmitting
                ? 'Đang lưu...'
                : editingGoal
                  ? 'Lưu thay đổi'
                  : 'Tạo hành trình'}
            </Button>
          </div>
        </form>
      )}
    </Sheet>
  )
}
