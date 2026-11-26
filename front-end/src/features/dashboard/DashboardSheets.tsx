import { useState, type FormEvent } from 'react'
import { Calendar, Clock, Info, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Sheet } from '@/components/ui/Sheet'
import {
  TASK_CATEGORY_OPTIONS,
  validateCreationTitle,
  WORK_ENTITY_OPTIONS,
  type WorkEntityType
} from '@/features/work/creationContract'
import { useCreateQuestMutation, usePinQuestMutation } from '@/hooks/useDashboardData'
import { useGoalMutations } from '@/hooks/useWorkData'
import { authApi } from '@/services/api/authApi'
import { API_CONFIG } from '@/services/api/config'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import type { Quest, QuestType } from '@/types/domain'
import { addDaysLocal, getTodayLocalDate } from '@/utils/date'
import { MAX_PINNED_CARDS } from './PinnedBoard'
import styles from './DashboardSheets.module.css'

export function DashboardSheets({ quests }: { quests: Quest[] }) {
  const activeSheet = useUiStore((s) => s.activeSheet)
  if (!activeSheet) return null
  return <DashboardSheetsInner quests={quests} activeSheet={activeSheet} />
}

function DashboardSheetsInner({
  quests,
  activeSheet
}: {
  quests: Quest[]
  activeSheet: NonNullable<ReturnType<typeof useUiStore.getState>['activeSheet']>
}) {
  const closeSheet = useUiStore((s) => s.closeSheet)
  const searchQuery = useUiStore((s) => s.searchQuery)
  const setSearchQuery = useUiStore((s) => s.setSearchQuery)
  const entityType = useUiStore((s) => s.quickCreateEntityType)
  const setEntityType = useUiStore((s) => s.setQuickCreateEntityType)
  const title = useUiStore((s) => s.quickCreateDraft)
  const setTitle = useUiStore((s) => s.setQuickCreateDraft)
  const dueDate = useUiStore((s) => s.quickCreateDate)
  const setDueDate = useUiStore((s) => s.setQuickCreateDate)
  const dueTime = useUiStore((s) => s.quickCreateTime)
  const setDueTime = useUiStore((s) => s.setQuickCreateTime)

  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)
  const isAuthenticated = Boolean(accessToken.trim())

  const createQuest = useCreateQuestMutation()
  const { createGoal } = useGoalMutations()
  const pinQuest = usePinQuestMutation()

  const [questType, setQuestType] = useState<QuestType>('SIMPLE')
  const [formError, setFormError] = useState<string | null>(null)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  const pinnedCount = quests.filter((q) => q.isPinned).length

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (createQuest.isPending || createGoal.isPending) return
    setFormError(null)
    const err = validateCreationTitle(title)
    if (err) {
      setFormError(err)
      return
    }
    if (entityType === 'HABIT') {
      setFormError('Tạo Thói quen (Habit) đang chờ Backend Habit API (PENDING).')
      return
    }
    try {
      const today = getTodayLocalDate()
      const resolvedDate = dueDate || today
      const resolvedTime = dueTime || '23:59'
      if (entityType === 'QUEST') {
        await createGoal.mutateAsync({
          title: title.trim(),
          description: '',
          startDate: `${today}T00:00:00.000Z`,
          dueDate: `${dueDate || addDaysLocal(today, 30)}T${resolvedTime}:00.000Z`
        })
      } else {
        await createQuest.mutateAsync({
          title: title.trim(),
          type: questType,
          dueAt: `${resolvedDate}T${resolvedTime}:00.000Z`
        })
      }
      setTitle('')
      setDueDate('')
      setDueTime('')
      closeSheet()
    } catch (submitErr) {
      setFormError(submitErr instanceof Error ? submitErr.message : 'Không thể tạo mục mới.')
    }
  }

  const handlePinToggle = async (quest: Quest) => {
    setFormError(null)
    if (!quest.isPinned && pinnedCount >= MAX_PINNED_CARDS) {
      setFormError(`Bảng ghim chỉ hiển thị tối đa ${MAX_PINNED_CARDS} nhiệm vụ.`)
      return
    }
    try {
      await pinQuest.mutateAsync({ questId: quest.id, nextPinned: !quest.isPinned })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể cập nhật ghim.')
    }
  }

  const handleLiveLogin = async (e: FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthLoading(true)
    try {
      const res = await authApi.login({ email: loginEmail.trim(), password: loginPassword })
      setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user
      })
      setLoginPassword('')
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Đăng nhập thất bại.')
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <>
      <Sheet
        open={activeSheet === 'quick-create'}
        title="Tạo nhiệm vụ nhanh"
        subtitle="Chọn loại mục, đặt ngày giờ và bắt đầu ngay cùng Fox V2."
        onClose={closeSheet}
      >
        <form className={styles.form} onSubmit={handleCreateSubmit}>
          {/* Segmented Entity Selector */}
          <div className={styles.field}>
            <span className={styles.label}>Loại mục</span>
            <div className={styles.entityPillGrid} role="radiogroup" aria-label="Loại mục">
              {WORK_ENTITY_OPTIONS.map((opt) => {
                const active = entityType === opt.type
                return (
                  <button
                    key={opt.type}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`${styles.entityPillBtn} ${active ? styles.entityPillActive : ''}`.trim()}
                    onClick={() => {
                      setEntityType(opt.type as WorkEntityType)
                      setFormError(null)
                    }}
                  >
                    <span
                      className={styles.entityPillDot}
                      style={{ background: opt.dotColor }}
                      aria-hidden="true"
                    />
                    <span className={styles.entityPillLabel}>{opt.label}</span>
                    <span className={styles.entityPillSub}>{opt.viLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title Input */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="lq-quest-title" className={styles.label}>
                Tiêu đề
              </label>
              <span className={styles.charCount}>{title.length}/100</span>
            </div>
            <input
              id="lq-quest-title"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                entityType === 'QUEST'
                  ? 'Ví dụ: Đạt IELTS 6.5 trong 3 tháng'
                  : entityType === 'HABIT'
                    ? 'Ví dụ: Uống đủ 2 lít nước mỗi ngày'
                    : 'Ví dụ: Đọc 10 trang sách buổi tối'
              }
              maxLength={100}
            />
          </div>

          {/* Task Category Chips */}
          {entityType === 'TASK' && (
            <div className={styles.field}>
              <span className={styles.label}>Phân loại</span>
              <div className={styles.categoryChipRow} role="radiogroup" aria-label="Phân loại nhiệm vụ">
                {TASK_CATEGORY_OPTIONS.map((opt) => {
                  const active = questType === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`${styles.categoryChip} ${active ? styles.categoryChipActive : ''}`.trim()}
                      onClick={() => setQuestType(opt.value as QuestType)}
                    >
                      {opt.label.replace(/\s*\([^)]*\)/g, '')}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Date & Time Picker */}
          <div className={styles.scheduleCard}>
            <div className={styles.scheduleCardHead}>
              <span className={styles.scheduleCardTitle}>
                <Calendar size={14} aria-hidden="true" />
                <span>Ngày &amp; giờ thực hiện</span>
              </span>
              <div className={styles.presetDayRow}>
                {[
                  { label: 'Hôm nay', value: getTodayLocalDate() },
                  { label: 'Ngày mai', value: addDaysLocal(getTodayLocalDate(), 1) },
                  { label: 'Tuần này', value: addDaysLocal(getTodayLocalDate(), 7) }
                ].map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    className={`${styles.presetDayBtn} ${(dueDate || getTodayLocalDate()) === d.value ? styles.presetDayBtnActive : ''}`.trim()}
                    onClick={() => setDueDate(d.value)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.dateTimeGrid}>
              <label className={styles.dateTimeField}>
                <span>Ngày</span>
                <input
                  type="date"
                  className={styles.input}
                  value={dueDate || getTodayLocalDate()}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>
              <label className={styles.dateTimeField}>
                <span>Giờ</span>
                <input
                  type="time"
                  className={styles.input}
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </label>
            </div>

            <div className={styles.quickTimeChips}>
              <Clock size={12} color="#7c6d5f" aria-hidden="true" />
              {['09:00', '14:00', '18:00', '21:00'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.quickTimeBtn} ${dueTime === t ? styles.quickTimeBtnActive : ''}`.trim()}
                  onClick={() => setDueTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {!isAuthenticated && (
            <div className={styles.previewNotice}>
              <Info size={15} color="#b84317" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
              <span>
                Bạn chưa đăng nhập Backend — đăng nhập tài khoản để lưu nhiệm vụ mới lên máy chủ.
              </span>
            </div>
          )}

          {formError && <div className={styles.errorText}>{formError}</div>}

          <div className={styles.actions}>
            <Button variant="ghost" onClick={closeSheet}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={createQuest.isPending || createGoal.isPending}
            >
              <Sparkles size={14} aria-hidden="true" />
              <span>
                {createQuest.isPending || createGoal.isPending
                  ? 'Đang lưu...'
                  : entityType === 'QUEST'
                    ? 'Tạo Quest'
                    : entityType === 'HABIT'
                      ? 'Tạo thói quen'
                      : 'Tạo nhiệm vụ'}
              </span>
            </Button>
          </div>
        </form>
      </Sheet>

      <Sheet
        open={activeSheet === 'manage-pins'}
        title="Quản lý ghim"
        subtitle={`Chọn tối đa ${MAX_PINNED_CARDS} nhiệm vụ hiển thị trên Bảng ghim (POST/DELETE /api/v1/quests/:id/pin).`}
        onClose={closeSheet}
      >
        {formError && <div className={styles.errorText}>{formError}</div>}
        <div className={styles.form}>
          {quests.map((q) => (
            <div key={q.id} className={styles.row}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{q.title}</span>
              <Button
                variant={q.isPinned ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handlePinToggle(q)}
                disabled={pinQuest.isPending}
              >
                {q.isPinned ? 'Bỏ ghim' : 'Ghim'}
              </Button>
            </div>
          ))}
        </div>
      </Sheet>

      <Sheet
        open={activeSheet === 'search'}
        title="Tìm kiếm nhiệm vụ"
        subtitle="Lọc danh sách hiện tại hoặc truyền ?search=... tới GET /api/v1/quests."
        onClose={closeSheet}
      >
        <div className={styles.field}>
          <label htmlFor="lq-search-input" className={styles.label}>
            Từ khóa
          </label>
          <input
            id="lq-search-input"
            className={styles.input}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nhập tên nhiệm vụ..."
          />
        </div>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => setSearchQuery('')}>
            Xóa bộ lọc
          </Button>
          <Button variant="primary" onClick={closeSheet}>
            Áp dụng
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={activeSheet === 'notifications'}
        title="Thông báo"
        subtitle="Chưa có Notification API trên nhánh Backend develop."
        onClose={closeSheet}
      >
        <div className={styles.infoBox}>
          <Chip tone="danger">UNAVAILABLE</Chip>
          <p style={{ marginTop: 8 }}>
            Module thông báo chưa được triển khai trên Backend. Phần này sẽ kết nối ở các giai đoạn
            tiếp theo sau khi có hợp đồng API chính thức.
          </p>
        </div>
      </Sheet>

      <Sheet
        open={activeSheet === 'api-status'}
        title="Trạng thái Backend & Live/Mock"
        subtitle={`VITE_API_BASE_URL = ${API_CONFIG.baseUrl} • Mode = ${API_CONFIG.dataMode.toUpperCase()}`}
        onClose={closeSheet}
      >
        <div className={styles.infoBox}>
          <div>
            <strong>Trạng thái phiên:</strong>{' '}
            {isAuthenticated
              ? `Đang kết nối LIVE (${user?.email ?? 'Authenticated'})`
              : 'Chưa đăng nhập — đang hiển thị MOCK PREVIEW cho màn hình xem trước'}
          </div>
          <div style={{ marginTop: 6 }}>
            <strong>Nguyên tắc FE-01:</strong> Không tự động fallback sang Mock khi API thật báo lỗi;
            mọi thao tác ghi đều yêu cầu phiên thật.
          </div>
        </div>

        {isAuthenticated ? (
          <div className={styles.actions}>
            <Button variant="ghost" onClick={clearSession}>
              Ngắt phiên LIVE
            </Button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleLiveLogin}>
            <div className={styles.field}>
              <label htmlFor="lq-dev-email" className={styles.label}>
                Email tài khoản Backend (POST /api/v1/auth/login)
              </label>
              <input
                id="lq-dev-email"
                type="email"
                className={styles.input}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="lq-dev-pass" className={styles.label}>
                Mật khẩu
              </label>
              <input
                id="lq-dev-pass"
                type="password"
                className={styles.input}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            {authError && <div className={styles.errorText}>{authError}</div>}
            <div className={styles.actions}>
              <Button type="submit" variant="primary" disabled={authLoading}>
                {authLoading ? 'Đang đăng nhập...' : 'Kết nối LIVE Backend'}
              </Button>
            </div>
          </form>
        )}
      </Sheet>
    </>
  )
}
