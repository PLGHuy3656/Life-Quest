import { useState, type FormEvent } from 'react'
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
  const closeSheet = useUiStore((s) => s.closeSheet)
  const searchQuery = useUiStore((s) => s.searchQuery)
  const setSearchQuery = useUiStore((s) => s.setSearchQuery)

  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)
  const isAuthenticated = Boolean(accessToken.trim())

  const createQuest = useCreateQuestMutation()
  const { createGoal } = useGoalMutations()
  const pinQuest = usePinQuestMutation()

  const [entityType, setEntityType] = useState<WorkEntityType>('TASK')
  const [title, setTitle] = useState('')
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
      if (entityType === 'QUEST') {
        const today = getTodayLocalDate()
        await createGoal.mutateAsync({
          title: title.trim(),
          description: '',
          startDate: `${today}T00:00:00.000Z`,
          dueDate: `${addDaysLocal(today, 30)}T23:59:59.000Z`
        })
      } else {
        await createQuest.mutateAsync({ title: title.trim(), type: questType })
      }
      setTitle('')
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
        subtitle="Kết nối trực tiếp POST /api/v1/quests khi đã đăng nhập Backend."
        onClose={closeSheet}
      >
        <form className={styles.form} onSubmit={handleCreateSubmit}>
          <div className={styles.field}>
            <label htmlFor="lq-entity-type" className={styles.label}>
              Loại mục (Entity)
            </label>
            <select
              id="lq-entity-type"
              className={styles.select}
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value as WorkEntityType)
                setFormError(null)
              }}
            >
              {WORK_ENTITY_OPTIONS.map((opt) => (
                <option key={opt.type} value={opt.type}>
                  {opt.label} · {opt.viLabel} ({opt.capability})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="lq-quest-title" className={styles.label}>
              Tiêu đề
            </label>
            <input
              id="lq-quest-title"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Đọc 10 trang sách buổi tối"
              maxLength={100}
            />
          </div>

          {entityType === 'TASK' && (
            <div className={styles.field}>
              <label htmlFor="lq-quest-type" className={styles.label}>
                Phân loại nhiệm vụ (Category)
              </label>
              <select
                id="lq-quest-type"
                className={styles.select}
                value={questType}
                onChange={(e) => setQuestType(e.target.value as QuestType)}
              >
                {TASK_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isAuthenticated && (
            <div className={styles.infoBox}>
              Bạn đang ở chế độ Hybrid Preview (chưa đăng nhập). Hệ thống sẽ không giả lập tạo thành
              công; gửi biểu mẫu sẽ báo lỗi <code>AUTHENTICATION_REQUIRED</code>.
            </div>
          )}

          {formError && <div className={styles.errorText}>{formError}</div>}

          <div className={styles.actions}>
            <Button variant="ghost" onClick={closeSheet}>
              Hủy
            </Button>
            <Button type="submit" variant="accent" disabled={createQuest.isPending}>
              {createQuest.isPending ? 'Đang gửi...' : 'Tạo nhiệm vụ'}
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
