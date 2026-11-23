import { useState, type FormEvent } from 'react'
import { CalendarDays, Clock, Send, Sparkles, Sun } from 'lucide-react'
import { FoxCompanionView } from '@/features/mascot/FoxCompanionView'
import { useCreateQuestMutation } from '@/hooks/useDashboardData'
import { useAuthStore } from '@/stores/authStore'
import type { TodayData, UserMe } from '@/types/domain'
import { addDaysLocal, getTodayLocalDate } from '@/utils/date'
import { MascotSceneBackdrop } from './MascotSceneBackdrop'
import styles from './MascotHeroPanel.module.css'

type QuickHorizon = 'today' | 'tomorrow' | 'week'

const QUICK_CHIPS: { id: QuickHorizon; label: string; Icon: typeof Sun }[] = [
  { id: 'today', label: 'Hôm nay', Icon: Sun },
  { id: 'tomorrow', label: 'Ngày mai', Icon: Clock },
  { id: 'week', label: 'Tuần này', Icon: CalendarDays }
]

function getVietnameseGreeting(hour: number): string {
  if (hour < 12) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export interface MascotHeroPanelProps {
  user?: UserMe
  today?: TodayData
}

export function MascotHeroPanel({ user, today }: MascotHeroPanelProps) {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const createQuest = useCreateQuestMutation()

  const [prompt, setPrompt] = useState('')
  const [horizon, setHorizon] = useState<QuickHorizon>('today')
  const [feedback, setFeedback] = useState<{ kind: 'info' | 'ok' | 'err'; text: string } | null>(
    null
  )

  const displayName = user?.profile?.displayName?.trim() || user?.username?.trim() || 'Bạn'
  const greetingPrefix = getVietnameseGreeting(new Date().getHours())

  const supportingLine = today
    ? `Hôm nay đã hoàn thành ${today.summary.completedTasks}/${today.summary.totalTasks} nhiệm vụ — cùng Fox giữ nhịp thật nhẹ nhàng nhé.`
    : 'Fox luôn sẵn sàng đồng hành cùng những bước tiến nhỏ mỗi ngày của bạn.'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    const title = prompt.trim()
    if (title.length < 3) {
      setFeedback({ kind: 'err', text: 'Nhập ít nhất 3 ký tự để thêm nhiệm vụ mới.' })
      return
    }

    if (!isAuthenticated) {
      setFeedback({
        kind: 'info',
        text: 'Đăng nhập tài khoản để lưu nhiệm vụ này vào danh sách của bạn.'
      })
      return
    }

    const baseDate = getTodayLocalDate()
    const targetDate =
      horizon === 'today'
        ? baseDate
        : horizon === 'tomorrow'
          ? addDaysLocal(baseDate, 1)
          : addDaysLocal(baseDate, 7)

    try {
      await createQuest.mutateAsync({
        title,
        type: 'SIMPLE',
        dueAt: `${targetDate}T23:59:00.000Z`
      })
      setPrompt('')
      setFeedback({ kind: 'ok', text: `Đã thêm "${title}" vào danh sách của bạn!` })
    } catch (err) {
      setFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Không thể lưu nhiệm vụ lúc này.'
      })
    }
  }

  return (
    <section
      className={styles.panel}
      data-testid="mascot-hero-panel"
      aria-label="Bạn đồng hành Fox V2 và lời chào"
    >
      <div className={styles.greetingBlock} data-testid="mascot-greeting-block">
        <span className={styles.companionPill}>
          <Sparkles size={12} aria-hidden="true" />
          <span>Góc đồng hành cùng Fox</span>
        </span>
        <h1 className={styles.greetingTitle}>
          {greetingPrefix}, {displayName}!
        </h1>
        <p className={styles.greetingSub}>{supportingLine}</p>
      </div>

      <div className={styles.mascotStageWrap} data-testid="mascot-decorated-stage">
        <MascotSceneBackdrop />
        <div className={styles.foxCanvasLayer}>
          <FoxCompanionView
            presentation="widget"
            label="Bạn đồng hành Cáo V2"
            className={styles.foxCanvasTransparent}
          />
        </div>
      </div>

      <div className={styles.promptBox} data-testid="mascot-prompt-box">
        <div className={styles.promptHeader}>
          <span className={styles.promptIcon} aria-hidden="true">
            <Sparkles size={14} />
          </span>
          <h2 className={styles.promptTitle}>Hôm nay bạn muốn làm gì?</h2>
        </div>

        <form className={styles.promptForm} onSubmit={handleSubmit}>
          <label htmlFor="mascot-quick-prompt" className="sr-only">
            Hôm nay bạn muốn làm gì?
          </label>
          <input
            id="mascot-quick-prompt"
            className={styles.promptInput}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: Đọc 15 trang sách, chạy bộ 20 phút..."
            maxLength={100}
          />
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={createQuest.isPending}
            aria-label="Gửi nhiệm vụ mới"
          >
            <Send size={14} aria-hidden="true" />
            <span>Thêm</span>
          </button>
        </form>

        <div className={styles.chipsRow} role="group" aria-label="Chọn mốc thời gian nhanh">
          {QUICK_CHIPS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`${styles.quickChip} ${horizon === id ? styles.quickChipActive : ''}`.trim()}
              aria-pressed={horizon === id}
              onClick={() => setHorizon(id)}
            >
              <Icon size={12} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {feedback && (
          <div
            className={`${styles.feedbackNote} ${
              feedback.kind === 'err'
                ? styles.feedbackError
                : feedback.kind === 'ok'
                  ? styles.feedbackSuccess
                  : ''
            }`.trim()}
            role={feedback.kind === 'err' ? 'alert' : 'status'}
          >
            {feedback.text}
          </div>
        )}
      </div>
    </section>
  )
}
