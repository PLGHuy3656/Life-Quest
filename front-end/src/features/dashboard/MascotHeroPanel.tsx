import { useState, type FormEvent } from 'react'
import {
  AlignLeft,
  ChevronDown,
  Clock,
  Mic,
  MoreHorizontal,
  Send,
  Sparkles,
  Star
} from 'lucide-react'
import { FoxCompanionView } from '@/features/mascot/FoxCompanionView'
import { VoiceAssistantSheet } from '@/features/voice/VoiceAssistantSheet'
import { useCreateQuestMutation } from '@/hooks/useDashboardData'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import type { QuestType, TodayData, UserMe } from '@/types/domain'
import { addDaysLocal, getTodayLocalDate } from '@/utils/date'
import { MascotSceneBackdrop } from './MascotSceneBackdrop'
import styles from './MascotHeroPanel.module.css'

type QuickHorizon = 'today' | 'tomorrow' | 'week'

const QUICK_CHIPS: { id: QuickHorizon; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'tomorrow', label: 'Ngày mai' },
  { id: 'week', label: 'Tuần này' }
]

const TASK_TYPE_OPTIONS: { type: QuestType; label: string; dotColor: string; bg: string; color: string }[] = [
  { type: 'SIMPLE', label: 'Task', dotColor: '#2563EB', bg: '#EAF2FE', color: '#1D4ED8' },
  { type: 'FOCUS', label: 'Focus', dotColor: '#F26B3A', bg: '#FFF0E8', color: '#C84B1E' },
  { type: 'DURATION', label: 'Thời lượng', dotColor: '#168C78', bg: '#E8F7F3', color: '#116F5F' },
  { type: 'QUANTITY', label: 'Thói quen', dotColor: '#D49400', bg: '#FEF5DC', color: '#8C6200' }
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
  const openSheet = useUiStore((s) => s.openSheet)
  const createQuest = useCreateQuestMutation()

  const [prompt, setPrompt] = useState('')
  const [horizon, setHorizon] = useState<QuickHorizon>('today')
  const [typeIdx, setTypeIdx] = useState(0)
  const [highPriority, setHighPriority] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'info' | 'ok' | 'err'; text: string } | null>(
    null
  )

  const selectedType = TASK_TYPE_OPTIONS[typeIdx]
  const displayName = user?.profile?.displayName?.trim() || user?.username?.trim() || 'Bạn'
  const greetingPrefix = getVietnameseGreeting(new Date().getHours())

  const supportingLine = today
    ? `Hôm nay đã hoàn thành ${today.summary.completedTasks}/${today.summary.totalTasks} nhiệm vụ — cùng Fox giữ nhịp thật nhẹ nhàng nhé.`
    : 'Fox luôn sẵn sàng đồng hành cùng những bước tiến nhỏ mỗi ngày của bạn.'

  const handleCycleType = () => {
    setTypeIdx((prev) => (prev + 1) % TASK_TYPE_OPTIONS.length)
  }

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
        type: selectedType.type,
        priority: highPriority ? 1 : 2,
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
        <h2 className={styles.promptTitle}>Hôm nay bạn muốn làm gì?</h2>

        <form className={styles.promptForm} onSubmit={handleSubmit}>
          <div className={styles.pillBar}>
            <button
              type="button"
              className={styles.typePill}
              style={{ background: selectedType.bg, color: selectedType.color }}
              onClick={handleCycleType}
              aria-label={`Chọn loại nhiệm vụ: ${selectedType.label}`}
              title="Nhấn để đổi loại nhiệm vụ"
            >
              <span
                className={styles.typeDot}
                style={{ background: selectedType.dotColor }}
                aria-hidden="true"
              />
              <span>{selectedType.label}</span>
              <ChevronDown size={12} aria-hidden="true" />
            </button>

            <label htmlFor="mascot-quick-prompt" className="sr-only">
              Hôm nay bạn muốn làm gì?
            </label>
            <input
              id="mascot-quick-prompt"
              className={styles.promptInput}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tôi muốn..."
              maxLength={100}
            />

            <div className={styles.inlineTools}>
              <button
                type="button"
                className={styles.iconToolBtn}
                onClick={() => openSheet('quick-create')}
                aria-label="Mở chi tiết tạo nhiệm vụ"
                title="Thêm mô tả & chi tiết"
              >
                <AlignLeft size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.iconToolBtn} ${highPriority ? styles.iconToolBtnStarred : ''}`.trim()}
                onClick={() => setHighPriority((v) => !v)}
                aria-pressed={highPriority}
                aria-label="Đánh dấu ưu tiên cao"
                title={highPriority ? 'Đang bật ưu tiên cao' : 'Đánh dấu ưu tiên cao'}
              >
                <Star
                  size={15}
                  fill={highPriority ? '#F6C85F' : 'none'}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                className={styles.micToolBtn}
                onClick={() => setVoiceOpen(true)}
                aria-label="Ghi âm tạo nhiệm vụ bằng giọng nói"
                title="Ghi âm cùng Trợ lý Fox"
                data-testid="mascot-prompt-mic-btn"
              >
                <Mic size={15} aria-hidden="true" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.sendCircleBtn}
            disabled={createQuest.isPending}
            aria-label="Gửi nhiệm vụ mới"
            title="Thêm nhiệm vụ"
          >
            <Send size={17} aria-hidden="true" />
          </button>
        </form>

        <div className={styles.chipsRow} role="group" aria-label="Chọn mốc thời gian nhanh">
          {QUICK_CHIPS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`${styles.quickChip} ${horizon === id ? styles.quickChipActive : ''}`.trim()}
              aria-pressed={horizon === id}
              onClick={() => setHorizon(id)}
            >
              <Clock size={12} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
          <button
            type="button"
            className={styles.moreChipBtn}
            onClick={() => openSheet('quick-create')}
            aria-label="Tùy chọn lịch khác"
            title="Mở biểu mẫu tạo nhiệm vụ đầy đủ"
          >
            <MoreHorizontal size={14} aria-hidden="true" />
          </button>
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

      {voiceOpen && <VoiceAssistantSheet open={voiceOpen} onClose={() => setVoiceOpen(false)} />}
    </section>
  )
}
