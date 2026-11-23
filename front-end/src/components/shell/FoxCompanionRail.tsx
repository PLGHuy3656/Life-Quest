import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
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
import { MascotSceneBackdrop } from '@/features/dashboard/MascotSceneBackdrop'
import { useOptionalCompanion } from '@/features/mascot/CompanionProvider'
import { FoxCompanionView } from '@/features/mascot/FoxCompanionView'
import { FoxSpeechBubble } from '@/features/mascot/FoxSpeechBubble'
import { evaluateQuestDeadlines } from '@/features/mascot/dialogue/deadlineMonitor'
import { foxDialogueBus } from '@/features/mascot/dialogue/dialogueBus'
import type { ActiveDialogueBubble, DialogueEventType } from '@/features/mascot/dialogue/types'
import { useDocumentVisible } from '@/features/mascot/environment'
import { VoiceAssistantSheet } from '@/features/voice/VoiceAssistantSheet'
import {
  useCreateQuestMutation,
  useQuestsQuery,
  useTodayQuery,
  useUserMeQuery
} from '@/hooks/useDashboardData'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import type { QuestType } from '@/types/domain'
import { addDaysLocal, getTodayLocalDate } from '@/utils/date'
import { FoxPawToggle } from './FoxPawToggle'
import styles from './FoxCompanionRail.module.css'

type QuickHorizon = 'today' | 'tomorrow' | 'week'

const QUICK_CHIPS: { id: QuickHorizon; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'tomorrow', label: 'Ngày mai' },
  { id: 'week', label: 'Tuần này' }
]

const TASK_TYPE_OPTIONS: {
  type: QuestType
  label: string
  dotColor: string
  bg: string
  color: string
}[] = [
  { type: 'SIMPLE', label: 'Task', dotColor: '#2563EB', bg: '#EAF2FE', color: '#1D4ED8' },
  { type: 'FOCUS', label: 'Focus', dotColor: '#F26B3A', bg: '#FFF0E8', color: '#C84B1E' },
  { type: 'DURATION', label: 'Thời lượng', dotColor: '#168C78', bg: '#E8F7F3', color: '#116F5F' },
  { type: 'QUANTITY', label: 'Thói quen', dotColor: '#D49400', bg: '#FEF5DC', color: '#8C6200' }
]

const IDLE_THRESHOLD_MS = 45_000
const DEADLINE_POLL_MS = 60_000
const IDLE_CYCLE: DialogueEventType[] = ['IDLE_CHATTER', 'ENCOURAGEMENT', 'TASK_SUGGESTION']

function getVietnameseGreeting(hour: number): string {
  if (hour < 12) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

export interface FoxCompanionRailProps {
  /** Omit 3D canvas on /wardrobe so the full-stage Wardrobe Fox remains the sole WebGL context */
  hideCanvas?: boolean
}

/**
 * Shared Desktop RIGHT FoxCompanionPanel promoted into AppShell (FE-03.5I + FOX-D03).
 * - Persists across all application routes without remounting Fox V2 WebGL.
 * - Integrates the FOX-D03 contextual dialogue engine (idle chatter, dashboard & social
 *   reactions, verified task creation, and timezone-safe deadline warnings).
 */
export function FoxCompanionRail({ hideCanvas = false }: FoxCompanionRailProps) {
  const location = useLocation()
  const documentVisible = useDocumentVisible()
  const collapsed = useUiStore((s) => s.foxRailCollapsed)
  const toggleCollapsed = useUiStore((s) => s.toggleFoxRail)
  const prompt = useUiStore((s) => s.quickCreateDraft)
  const setPrompt = useUiStore((s) => s.setQuickCreateDraft)
  const activeSheet = useUiStore((s) => s.activeSheet)
  const openSheet = useUiStore((s) => s.openSheet)

  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const companion = useOptionalCompanion()
  const userQuery = useUserMeQuery()
  const todayQuery = useTodayQuery()
  const questsQuery = useQuestsQuery()
  const createQuest = useCreateQuestMutation()

  const [horizon, setHorizon] = useState<QuickHorizon>('today')
  const [typeIdx, setTypeIdx] = useState(0)
  const [highPriority, setHighPriority] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'info' | 'ok' | 'err'; text: string } | null>(
    null
  )
  const [activeDialogue, setActiveDialogue] = useState<ActiveDialogueBubble | null>(() =>
    foxDialogueBus.getActive()
  )

  const lastHandledEventIdRef = useRef<number>(0)
  const lastEmptyShownRef = useRef<boolean>(false)
  const lastErrorShownRef = useRef<string | null>(null)
  const lastRouteRef = useRef<string>(location.pathname)
  const lastSheetRef = useRef<typeof activeSheet>(activeSheet)
  const idleIdxRef = useRef<number>(0)
  const lastForwardedGateIIdRef = useRef<string | null>(null)

  // Subscribe to centralized dialogue bus
  useEffect(() => {
    return foxDialogueBus.subscribe((bubble) => {
      setActiveDialogue(bubble)
      if (
        bubble?.gateIEvent &&
        bubble.instanceId !== lastForwardedGateIIdRef.current &&
        bubble.event !== 'APP_GREETING' &&
        bubble.event !== 'TASK_CREATED'
      ) {
        lastForwardedGateIIdRef.current = bubble.instanceId
        companion?.publish(bubble.gateIEvent as never)
      }
    })
  }, [companion])

  // Keep engine pause flags synchronized with UI state
  useEffect(() => {
    foxDialogueBus.setPauseReason({
      foxCollapsed: collapsed,
      modalOpen: activeSheet !== null || voiceOpen,
      pageHidden: !documentVisible
    })
  }, [collapsed, activeSheet, voiceOpen, documentVisible])

  // Track user typing focus cleanly without leaking listeners
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (isEditableElement(e.target)) {
        foxDialogueBus.setPauseReason({ typing: true })
      }
    }
    const onFocusOut = () => {
      const stillTyping = isEditableElement(document.activeElement)
      foxDialogueBus.setPauseReason({ typing: stillTyping })
    }
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      foxDialogueBus.setPauseReason({ typing: false })
    }
  }, [])

  // Idle chatter timer (only fires after meaningful inactivity; auto-cleaned on unmount)
  useEffect(() => {
    let timer: number | null = null
    const scheduleIdle = () => {
      if (timer !== null) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (!foxDialogueBus.isIdlePaused()) {
          const nextEvt = IDLE_CYCLE[idleIdxRef.current % IDLE_CYCLE.length]
          idleIdxRef.current += 1
          foxDialogueBus.emit({ event: nextEvt })
        }
        scheduleIdle()
      }, IDLE_THRESHOLD_MS)
    }

    const onActivity = () => scheduleIdle()
    scheduleIdle()
    window.addEventListener('pointerdown', onActivity, { passive: true })
    window.addEventListener('keydown', onActivity, { passive: true })

    return () => {
      if (timer !== null) window.clearTimeout(timer)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
    }
  }, [])

  // React to verified CompanionProvider events (APP_GREETING, TASK_CREATED, TASK_COMPLETED)
  const latestEvent = companion?.eventLog[0]
  useEffect(() => {
    if (!latestEvent || latestEvent.id <= lastHandledEventIdRef.current) return
    lastHandledEventIdRef.current = latestEvent.id

    if (latestEvent.name === 'APP_GREETING') {
      foxDialogueBus.emit({ event: 'APP_GREETING', dedupeKey: `greeting-${latestEvent.id}` })
    } else if (latestEvent.name === 'TASK_CREATED') {
      foxDialogueBus.emit({ event: 'TASK_CREATED', dedupeKey: `task-created-${latestEvent.id}` })
    } else if (latestEvent.name === 'TASK_COMPLETED') {
      foxDialogueBus.emit({
        event: 'TASK_COMPLETED',
        dedupeKey: `task-completed-${latestEvent.id}`
      })
    }
  }, [latestEvent])

  // Meaningful route transition reaction (not on initial mount)
  useEffect(() => {
    if (location.pathname !== lastRouteRef.current) {
      lastRouteRef.current = location.pathname
      foxDialogueBus.emit({ event: 'ROUTE_SWITCHED' })
    }
  }, [location.pathname])

  // Meaningful Dashboard sheet open reaction
  useEffect(() => {
    if (activeSheet && activeSheet !== lastSheetRef.current) {
      if (activeSheet === 'manage-pins' || activeSheet === 'quick-create') {
        foxDialogueBus.emit({ event: 'DASHBOARD_ACTION' })
      }
    }
    lastSheetRef.current = activeSheet
  }, [activeSheet])

  // Verified empty task list state
  const isEmptyQuests = questsQuery.isSuccess && questsQuery.data.data.length === 0
  useEffect(() => {
    if (isEmptyQuests && !lastEmptyShownRef.current) {
      lastEmptyShownRef.current = true
      foxDialogueBus.emit({ event: 'EMPTY_TASKS', dedupeKey: 'empty-tasks-initial' })
    } else if (!isEmptyQuests) {
      lastEmptyShownRef.current = false
    }
  }, [isEmptyQuests])

  // Verified Backend error state
  const backendErrorKey = questsQuery.error
    ? questsQuery.error instanceof Error
      ? questsQuery.error.message
      : 'backend-error'
    : null
  useEffect(() => {
    if (backendErrorKey && lastErrorShownRef.current !== backendErrorKey) {
      lastErrorShownRef.current = backendErrorKey
      foxDialogueBus.emit({ event: 'BACKEND_ERROR', dedupeKey: `err:${backendErrorKey}` })
    } else if (!backendErrorKey) {
      lastErrorShownRef.current = null
    }
  }, [backendErrorKey])

  // Timezone-safe deadline monitor (60m / 15m / overdue) for verified active quests
  const questsList = questsQuery.data?.data
  const questsSource = questsQuery.data?.source
  useEffect(() => {
    if (!questsList || questsList.length === 0 || questsSource !== 'LIVE') return

    const checkDeadlines = () => {
      const candidates = evaluateQuestDeadlines(questsList, Date.now())
      for (const candidate of candidates) {
        foxDialogueBus.emit({
          event: candidate.event,
          dedupeKey: candidate.dedupeKey,
          taskTitle: candidate.questTitle,
          actionRoute: '/work',
          actionLabel: 'Mở nhiệm vụ'
        })
      }
    }

    checkDeadlines()
    const intervalId = window.setInterval(checkDeadlines, DEADLINE_POLL_MS)
    return () => window.clearInterval(intervalId)
  }, [questsList, questsSource])

  const dismissDialogue = useCallback(() => {
    foxDialogueBus.dismiss()
  }, [])

  const selectedType = TASK_TYPE_OPTIONS[typeIdx]
  const hasDraft = prompt.trim().length > 0
  const user = userQuery.data?.data
  const today = todayQuery.data?.data
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
        type: selectedType.type,
        priority: highPriority ? 1 : 2,
        dueAt: `${targetDate}T23:59:00.000Z`
      })
      setPrompt('')
      setFeedback({ kind: 'ok', text: `Đã thêm "${title}" vào danh sách của bạn!` })
    } catch (err) {
      foxDialogueBus.emit({ event: 'BACKEND_ERROR' })
      setFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Không thể lưu nhiệm vụ lúc này.'
      })
    }
  }

  return (
    <div
      className={collapsed ? styles.railCollapsedWrap : styles.railExpandedWrap}
      role="region"
      data-testid="shared-fox-rail"
      data-state={collapsed ? 'collapsed' : 'expanded'}
      aria-label="Bạn đồng hành Fox V2"
    >
      {collapsed && (
        <div className={styles.collapsedStrip}>
          <FoxPawToggle
            direction="right"
            collapsed
            label="Mở rộng Fox Companion"
            onClick={toggleCollapsed}
          />

          <button
            type="button"
            className={styles.foxMiniBadge}
            onClick={toggleCollapsed}
            aria-label="Mở góc đồng hành Fox V2"
            title={hasDraft ? 'Mở lại Fox (đang có bản nháp chưa gửi)' : 'Mở lại Fox Companion'}
          >
            <Sparkles size={16} aria-hidden="true" />
            {hasDraft && <span className={styles.draftDot} aria-label="Có bản nháp chưa gửi" />}
          </button>

          <button
            type="button"
            className={styles.miniMicBtn}
            onClick={() => setVoiceOpen(true)}
            aria-label="Mở Trợ lý Giọng nói Fox V2"
            title="Ghi âm cùng Trợ lý Fox"
          >
            <Mic size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Kept mounted & visually hidden when collapsed to preserve Quick Create draft & WebGL context */}
      <div className={collapsed ? styles.hiddenPreserve : styles.panel}>
        <div className={styles.topBar}>
          <span className={styles.companionPill}>
            <Sparkles size={11} aria-hidden="true" />
            <span>Fox đồng hành</span>
          </span>
          <FoxPawToggle
            direction="right"
            collapsed={false}
            label="Thu gọn Fox Companion"
            onClick={toggleCollapsed}
          />
        </div>

        <div className={styles.greetingBlock} data-testid="mascot-greeting-block">
          <h2 className={styles.greetingTitle}>
            {greetingPrefix}, {displayName}!
          </h2>
          <p className={styles.greetingSub}>{supportingLine}</p>
        </div>

        {!hideCanvas ? (
          <div className={styles.stageWrap} data-testid="mascot-decorated-stage">
            <MascotSceneBackdrop />
            <FoxSpeechBubble
              dialogue={activeDialogue}
              visible={!collapsed}
              onDismiss={dismissDialogue}
            />
            <div className={styles.canvasLayer}>
              <FoxCompanionView
                presentation="widget"
                label="Bạn đồng hành Cáo V2"
                suspended={collapsed}
                className={styles.canvasTransparent}
              />
            </div>
          </div>
        ) : (
          <div className={styles.wardrobeNotice}>
            Fox V2 đang hiển thị ở sân khấu chính của Tủ đồ để giữ đúng 1 ngữ cảnh WebGL.
          </div>
        )}

        <div className={styles.promptBox} data-testid="mascot-prompt-box">
          <h3 className={styles.promptTitle}>Hôm nay bạn muốn làm gì?</h3>

          <form className={styles.promptForm} onSubmit={handleSubmit}>
            <div className={styles.pillBar}>
              <button
                type="button"
                className={styles.typePill}
                style={{ background: selectedType.bg, color: selectedType.color }}
                onClick={() => setTypeIdx((i) => (i + 1) % TASK_TYPE_OPTIONS.length)}
                aria-label={`Chọn loại nhiệm vụ: ${selectedType.label}`}
                title="Nhấn để đổi loại nhiệm vụ"
              >
                <span
                  className={styles.typeDot}
                  style={{ background: selectedType.dotColor }}
                  aria-hidden="true"
                />
                <span>{selectedType.label}</span>
                <ChevronDown size={11} aria-hidden="true" />
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
                  <AlignLeft size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`${styles.iconToolBtn} ${highPriority ? styles.starred : ''}`.trim()}
                  onClick={() => setHighPriority((v) => !v)}
                  aria-pressed={highPriority}
                  aria-label="Đánh dấu ưu tiên cao"
                >
                  <Star size={14} fill={highPriority ? '#F6C85F' : 'none'} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.micToolBtn}
                  onClick={() => setVoiceOpen(true)}
                  aria-label="Ghi âm tạo nhiệm vụ bằng giọng nói"
                  data-testid="mascot-prompt-mic-btn"
                >
                  <Mic size={14} aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.sendCircleBtn}
              disabled={createQuest.isPending}
              aria-label="Gửi nhiệm vụ mới"
            >
              <Send size={15} aria-hidden="true" />
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
                <Clock size={11} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
            <button
              type="button"
              className={styles.moreChipBtn}
              onClick={() => openSheet('quick-create')}
              aria-label="Tùy chọn lịch khác"
            >
              <MoreHorizontal size={13} aria-hidden="true" />
            </button>
          </div>

          {feedback && (
            <div
              className={`${styles.notice} ${
                feedback.kind === 'err'
                  ? styles.noticeErr
                  : feedback.kind === 'ok'
                    ? styles.noticeOk
                    : ''
              }`.trim()}
              role={feedback.kind === 'err' ? 'alert' : 'status'}
            >
              {feedback.text}
            </div>
          )}
        </div>
      </div>

      {voiceOpen && <VoiceAssistantSheet open={voiceOpen} onClose={() => setVoiceOpen(false)} />}
    </div>
  )
}
