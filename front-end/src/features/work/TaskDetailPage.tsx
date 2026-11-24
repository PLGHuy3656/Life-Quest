import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Archive,
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Edit3,
  Flag,
  FolderKanban,
  Milestone as MilestoneIcon,
  MoreHorizontal,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Tag,
  Timer,
  Trash2,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { QUEST_TYPE_META } from '@/components/ui/questIconMeta'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState, ErrorBanner, LoadingSkeleton } from '@/components/ui/StateViews'
import { foxDialogueBus } from '@/features/mascot/dialogue/dialogueBus'
import {
  useGoalMilestonesQuery,
  useQuestMutations,
  useWorkGoalsQuery,
  useWorkQuestByIdQuery
} from '@/hooks/useWorkData'
import { useAuthStore } from '@/stores/authStore'
import {
  computeRemainingMs,
  formatTimerMMSS,
  useFocusSessionStore
} from '@/stores/focusSessionStore'
import type { ProofRequirement, QuestType } from '@/types/domain'
import { TASK_CATEGORY_OPTIONS, validateCreationTitle } from './creationContract'
import { FoxPawPinButton } from './FoxPawPinButton'
import { TaskEvidenceSection } from './TaskEvidenceSection'
import {
  classifyDetailTimingState,
  formatFullDateTime,
  formatRemainingDuration,
  getDetailTimingLabel,
  getPriorityMeta,
  getQuestStatusLabel,
  toDatetimeLocalValue
} from './taskUtils'
import styles from './WorkPage.module.css'

/**
 * FE-04B.1 Refined Task Detail Page (/work/tasks/:taskId).
 * Information order:
 * 1. Task Overview (Breadcrumb, Title, restrained status, Start/Due timing above fold, Fox-paw pin, Edit + Overflow menu)
 * 2. Description
 * 3. Focus Session V1
 * 4. Adaptive Local Evidence Preview
 * 5. Relationships & Metadata (neutral restrained text/icons)
 * 6. Activity Information (createdAt / updatedAt only)
 */
export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))

  const questQuery = useWorkQuestByIdQuery(taskId)
  const quest = questQuery.data ?? null
  const goalsQuery = useWorkGoalsQuery()
  const goals = goalsQuery.data ?? []
  const milestonesQuery = useGoalMilestonesQuery(quest?.goalId ?? null)
  const questMut = useQuestMutations()

  const [actionError, setActionError] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuWrapRef = useRef<HTMLDivElement>(null)

  // Full Edit Sheet state
  const [editOpen, setEditOpen] = useState(false)
  const [qTitle, setQTitle] = useState('')
  const [qDesc, setQDesc] = useState('')
  const [qType, setQType] = useState<QuestType>('SIMPLE')
  const [qPriority, setQPriority] = useState<number>(2)
  const [qStartLocal, setQStartLocal] = useState('')
  const [qDueLocal, setQDueLocal] = useState('')
  const [qGoalId, setQGoalId] = useState('')
  const [qMilestoneId, setQMilestoneId] = useState('')
  const [qProof, setQProof] = useState<ProofRequirement>('NONE')

  const formMilestonesQuery = useGoalMilestonesQuery(qGoalId || null)

  // Live compact Focus button state synced with shared Focus store
  const focusTaskId = useFocusSessionStore((s) => s.taskId)
  const focusStatus = useFocusSessionStore((s) => s.status)
  const focusPresetMinutes = useFocusSessionStore((s) => s.presetMinutes)
  const focusRemainingAtAnchorMs = useFocusSessionStore((s) => s.remainingAtAnchorMs)
  const focusStartedAtMs = useFocusSessionStore((s) => s.startedAtMs)
  const focusSyncTick = useFocusSessionStore((s) => s.syncTick)
  const [focusNowMs, setFocusNowMs] = useState(() => Date.now())

  const isFocusForThisTask = Boolean(quest?.id && focusTaskId === quest.id)
  const isFocusRunningHere = isFocusForThisTask && focusStatus === 'running'

  useEffect(() => {
    if (!isFocusRunningHere) return
    const sync = () => {
      const now = Date.now()
      setFocusNowMs(now)
      focusSyncTick(now)
    }
    sync()
    const id = window.setInterval(sync, 1000)
    return () => window.clearInterval(id)
  }, [focusSyncTick, isFocusRunningHere])

  const focusClockLabel = isFocusForThisTask
    ? formatTimerMMSS(
        computeRemainingMs(
          {
            status: focusStatus,
            remainingAtAnchorMs: focusRemainingAtAnchorMs,
            startedAtMs: focusStartedAtMs
          },
          isFocusRunningHere ? focusNowMs : Date.now()
        )
      )
    : formatTimerMMSS(focusPresetMinutes * 60 * 1000)

  // Contextual Fox reaction when opening a valid Task Detail page (never interrupts urgent deadlines)
  useEffect(() => {
    if (!quest?.id) return
    foxDialogueBus.emit({ event: 'TASK_DETAIL_OPENED' })
  }, [quest?.id])

  // Close overflow menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const runLiveAction = async (fn: () => Promise<unknown>) => {
    setActionError(null)
    if (!isAuthenticated) {
      setActionError('Đang ở chế độ xem trước — đăng nhập tài khoản để lưu thay đổi lên máy chủ.')
      return
    }
    try {
      await fn()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Thao tác thất bại.')
    }
  }

  const handleTogglePin = async () => {
    if (!quest) return
    setActionError(null)
    try {
      if (quest.isPinned) {
        await questMut.unpinQuest.mutateAsync(quest.id)
      } else {
        await questMut.pinQuest.mutateAsync(quest.id)
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể cập nhật ghim.')
    }
  }

  const startInlineTitleEdit = () => {
    if (!quest) return
    setDraftTitle(quest.title)
    setEditingTitle(true)
    setActionError(null)
  }

  const saveInlineTitle = async (e: FormEvent) => {
    e.preventDefault()
    if (!quest) return
    const err = validateCreationTitle(draftTitle)
    if (err) {
      setActionError(err)
      return
    }
    await runLiveAction(async () => {
      await questMut.updateQuest.mutateAsync({
        questId: quest.id,
        input: { title: draftTitle.trim() }
      })
      setEditingTitle(false)
    })
  }

  const openEditSheet = () => {
    if (!quest) return
    setMenuOpen(false)
    setQTitle(quest.title)
    setQDesc(quest.description ?? '')
    setQType(quest.type)
    setQPriority(quest.priority >= 1 && quest.priority <= 3 ? quest.priority : 2)
    setQStartLocal(toDatetimeLocalValue(quest.startAt))
    setQDueLocal(toDatetimeLocalValue(quest.dueAt))
    setQGoalId(quest.goalId ?? '')
    setQMilestoneId(quest.milestoneId ?? '')
    setQProof(quest.proofRequirement)
    setActionError(null)
    setEditOpen(true)
  }

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!quest) return
    const err = validateCreationTitle(qTitle)
    if (err) {
      setActionError(err)
      return
    }
    await runLiveAction(async () => {
      await questMut.updateQuest.mutateAsync({
        questId: quest.id,
        input: {
          title: qTitle.trim(),
          description: qDesc.trim(),
          type: qType,
          priority: qPriority,
          startAt: qStartLocal ? new Date(qStartLocal).toISOString() : null,
          dueAt: qDueLocal ? new Date(qDueLocal).toISOString() : null,
          goalId: qGoalId || null,
          milestoneId: qGoalId && qMilestoneId ? qMilestoneId : null,
          proofRequirement: qProof
        }
      })
      setEditOpen(false)
    })
  }

  const handleConfirmDelete = () => {
    if (!quest) return
    void runLiveAction(async () => {
      await questMut.deleteQuest.mutateAsync(quest.id)
      setConfirmDelete(false)
      navigate('/work/tasks')
    })
  }

  if (questQuery.isLoading) {
    return (
      <div className={styles.stack} data-testid="task-detail-page">
        <LoadingSkeleton height={40} />
        <LoadingSkeleton height={210} />
        <LoadingSkeleton height={140} />
      </div>
    )
  }

  if (questQuery.error) {
    return (
      <div className={styles.stack} data-testid="task-detail-page">
        <div className={styles.breadcrumbBar}>
          <Link to="/work/tasks" className={styles.backLink}>
            <ArrowLeft size={14} aria-hidden="true" /> Quay lại Nhiệm vụ
          </Link>
        </div>
        <ErrorBanner error={questQuery.error} onRetry={() => questQuery.refetch()} />
      </div>
    )
  }

  if (!quest) {
    return (
      <div className={styles.stack} data-testid="task-detail-page">
        <div className={styles.breadcrumbBar}>
          <Link to="/work/tasks" className={styles.backLink}>
            <ArrowLeft size={14} aria-hidden="true" /> Quay lại Nhiệm vụ
          </Link>
        </div>
        <Card>
          <EmptyState
            title="Không tìm thấy nhiệm vụ"
            description="Nhiệm vụ này có thể đã bị xóa hoặc đường dẫn không tồn tại trong tài khoản của bạn."
          />
        </Card>
      </div>
    )
  }

  const typeMeta = QUEST_TYPE_META[quest.type]
  const priorityMeta = getPriorityMeta(quest.priority)
  const timingState = classifyDetailTimingState(quest)
  const remainingLabel = quest.completedAt ? null : formatRemainingDuration(quest.dueAt)
  const linkedGoal = goals.find((g) => g.id === quest.goalId) ?? null
  const linkedMilestone =
    (milestonesQuery.data ?? []).find((m) => m.id === quest.milestoneId) ?? null
  const estMinutes = quest.estimatedDurationSeconds
    ? Math.max(1, Math.round(quest.estimatedDurationSeconds / 60))
    : null

  const isUrgentTone = timingState === 'overdue'
  const isSoonTone = timingState === 'due_soon' || timingState === 'starting_soon'

  return (
    <div className={styles.stack} data-testid="task-detail-page" data-quest-id={quest.id}>
      {/* Breadcrumb & Back Navigation */}
      <nav className={styles.breadcrumbBar} aria-label="Điều hướng chi tiết nhiệm vụ">
        <Link to="/work/tasks" className={styles.backLink} data-testid="task-detail-back">
          <ArrowLeft size={14} aria-hidden="true" /> Nhiệm vụ
        </Link>
        <span className={styles.breadcrumbSep} aria-hidden="true">
          /
        </span>
        <span className={styles.breadcrumbCurrent}>Chi tiết</span>
      </nav>

      {actionError && (
        <div className={styles.errorBox} role="alert">
          {actionError}
        </div>
      )}

      {/* 1. Primary Task Overview & 2. Description (Above-the-Fold Priority) */}
      <Card>
        <div className={styles.detailTopControls}>
          {/* Single restrained status indicator — strong color ONLY for urgency/overdue */}
          <span
            className={`${styles.detailStatusIndicator} ${
              isUrgentTone
                ? styles.statusDanger
                : isSoonTone
                  ? styles.statusWarning
                  : styles.statusNeutral
            }`}
            data-testid="detail-timing-status"
            data-timing={timingState}
          >
            <span className={styles.summaryDot} aria-hidden="true" />
            {quest.status === 'ARCHIVED'
              ? getQuestStatusLabel(quest.status, quest.completedAt)
              : getDetailTimingLabel(timingState)}
          </span>

          <div className={styles.detailTopActions}>
            <FoxPawPinButton
              pinned={quest.isPinned}
              taskTitle={quest.title}
              disabled={questMut.pinQuest.isPending || questMut.unpinQuest.isPending}
              onToggle={() => void handleTogglePin()}
            />

            {quest.status === 'ACTIVE' && (
              <Button variant="ghost" size="sm" onClick={openEditSheet} data-testid="detail-edit-btn">
                <Edit3 size={13} aria-hidden="true" /> Sửa
              </Button>
            )}

            {/* Compact Overflow Menu for secondary management (Archive / Restore / Delete) */}
            <div className={styles.overflowWrap} ref={menuWrapRef}>
              <button
                type="button"
                className={styles.iconActionBtn}
                aria-label="Tùy chọn khác"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                data-testid="detail-overflow-btn"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreHorizontal size={16} aria-hidden="true" />
              </button>

              {menuOpen && (
                <div className={styles.overflowMenu} role="menu" data-testid="detail-overflow-menu">
                  {quest.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      role="menuitem"
                      className={styles.overflowItem}
                      onClick={() => {
                        setMenuOpen(false)
                        void runLiveAction(() => questMut.archiveQuest.mutateAsync(quest.id))
                      }}
                    >
                      <Archive size={14} aria-hidden="true" /> Lưu trữ nhiệm vụ
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className={styles.overflowItem}
                      onClick={() => {
                        setMenuOpen(false)
                        void runLiveAction(() => questMut.restoreQuest.mutateAsync(quest.id))
                      }}
                    >
                      <RotateCcw size={14} aria-hidden="true" /> Khôi phục nhiệm vụ
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className={`${styles.overflowItem} ${styles.overflowItemDanger}`}
                    onClick={() => {
                      setMenuOpen(false)
                      setConfirmDelete(true)
                    }}
                  >
                    <Trash2 size={14} aria-hidden="true" /> Xóa nhiệm vụ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dominant Task Title (Inline Editable) */}
        {editingTitle ? (
          <form className={styles.inlineTitleForm} onSubmit={saveInlineTitle}>
            <input
              aria-label="Chỉnh sửa tên nhiệm vụ"
              className={styles.input}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              maxLength={100}
              autoFocus
            />
            <Button type="submit" variant="primary" size="sm">
              <Check size={14} /> Lưu
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingTitle(false)}>
              <X size={14} />
            </Button>
          </form>
        ) : (
          <div className={styles.detailTitleRow}>
            <h1 className={styles.detailPageTitle}>{quest.title}</h1>
            {quest.status === 'ACTIVE' && (
              <button
                type="button"
                className={styles.inlineEditBtn}
                onClick={startInlineTitleEdit}
                aria-label="Sửa nhanh tiêu đề"
                title="Sửa nhanh tiêu đề"
              >
                <Edit3 size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Prominent Timing Strip (Start & Deadline immediately visible above the fold) */}
        <div className={styles.timingHeroStrip} data-testid="detail-timing-strip">
          <div className={styles.timingCell}>
            <span className={styles.timingLabel}>
              <PlayCircle size={13} aria-hidden="true" /> Bắt đầu
            </span>
            <span className={styles.timingValue}>{formatFullDateTime(quest.startAt)}</span>
          </div>

          <div className={styles.timingDivider} aria-hidden="true" />

          <div className={styles.timingCell}>
            <span className={styles.timingLabel}>
              <CalendarClock size={13} aria-hidden="true" /> Hạn hoàn thành
            </span>
            <span
              className={`${styles.timingValue} ${
                isUrgentTone ? styles.textDanger : isSoonTone ? styles.textAccent : ''
              }`}
            >
              {formatFullDateTime(quest.dueAt)}
              {remainingLabel && (
                <span className={styles.remainingTag}> ({remainingLabel})</span>
              )}
            </span>
          </div>

          <div className={styles.timingDivider} aria-hidden="true" />

          <div className={styles.timingActionCell}>
            <button
              type="button"
              className={`${styles.focusGridBtn} ${
                isFocusRunningHere ? styles.focusGridBtnRunning : ''
              }`}
              onClick={() => navigate(`/work/tasks/${quest.id}/focus`)}
              data-testid="detail-focus-launch-btn"
              aria-label={`Mở trang tập trung cho ${quest.title} (${focusClockLabel})`}
            >
              <Timer size={15} aria-hidden="true" />
              <span className={styles.focusGridBtnText}>
                {isFocusRunningHere
                  ? 'Đang tập trung'
                  : isFocusForThisTask && focusStatus === 'paused'
                    ? 'Tiếp tục'
                    : 'Tập trung'}
              </span>
              <span className={styles.focusGridClock} data-testid="detail-focus-clock">
                {focusClockLabel}
              </span>
            </button>
          </div>
        </div>

        {/* Destructive Delete Confirmation (Inline, safe) */}
        {confirmDelete && (
          <div className={styles.focusConfirmBar} role="alertdialog" aria-label="Xác nhận xóa nhiệm vụ">
            <span>Xóa vĩnh viễn nhiệm vụ &ldquo;{quest.title}&rdquo;?</span>
            <div className={styles.btnGroup}>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmDelete}>
                Xác nhận xóa
              </Button>
            </div>
          </div>
        )}

        {/* 2. Description */}
        <div className={styles.detailDescriptionBlock}>
          <p className={styles.detailDescription}>
            {quest.description?.trim() || 'Chưa có mô tả chi tiết cho nhiệm vụ này.'}
          </p>
        </div>

        {/* Honest Primary Completion Boundary */}
        <div className={styles.completionBoundary}>
          <Button
            variant="ghost"
            size="sm"
            disabled
            title="Hoàn thành nhiệm vụ & cộng XP đang chờ Backend Execution API"
            aria-label="Hoàn thành nhiệm vụ (chờ Execution API)"
          >
            <CheckCircle2 size={14} aria-hidden="true" /> Hoàn thành nhiệm vụ
          </Button>
          <span className={styles.completionHint}>
            Chờ Backend Execution API — không giả lập hoàn thành hay cộng XP.
          </span>
        </div>
      </Card>

      {/* 3. Adaptive Local Evidence Preview */}
      <Card>
        <TaskEvidenceSection proofRequirement={quest.proofRequirement} />
      </Card>

      {/* 5. Relationships & Metadata (Neutral, restrained text/icons — no rainbow pills) */}
      <Card>
        <h2 className={styles.sectionHeading} style={{ marginBottom: 10 }}>
          Liên kết &amp; Thông tin
        </h2>
        <dl className={styles.metaDefinitionList} data-testid="detail-metadata-section">
          <div className={styles.metaRow}>
            <dt className={styles.metaTerm}>
              <FolderKanban size={13} aria-hidden="true" /> Hành trình (Quest / Goal)
            </dt>
            <dd className={styles.metaVal}>
              {linkedGoal ? (
                <Link
                  to={`/work/quests/${linkedGoal.id}`}
                  className={styles.inlineLink}
                  data-testid="task-parent-quest-link"
                >
                  {linkedGoal.title}
                </Link>
              ) : (
                'Không gắn hành trình'
              )}
            </dd>
          </div>

          <div className={styles.metaRow}>
            <dt className={styles.metaTerm}>
              <MilestoneIcon size={13} aria-hidden="true" /> Cột mốc
            </dt>
            <dd className={styles.metaVal}>
              {linkedMilestone
                ? `#${linkedMilestone.position} ${linkedMilestone.title}`
                : quest.milestoneId
                  ? 'Đang tải cột mốc...'
                  : 'Không gắn cột mốc'}
            </dd>
          </div>

          <div className={styles.metaRow}>
            <dt className={styles.metaTerm}>
              <Tag size={13} aria-hidden="true" /> Phân loại
            </dt>
            <dd className={styles.metaVal}>{typeMeta.label}</dd>
          </div>

          <div className={styles.metaRow}>
            <dt className={styles.metaTerm}>
              <Flag size={13} aria-hidden="true" /> Mức ưu tiên
            </dt>
            <dd className={styles.metaVal}>{priorityMeta.label}</dd>
          </div>

          <div className={styles.metaRow}>
            <dt className={styles.metaTerm}>
              <Timer size={13} aria-hidden="true" /> Thời lượng ước tính
            </dt>
            <dd className={styles.metaVal}>
              {estMinutes ? `${estMinutes} phút` : 'Chưa đặt thời lượng'}
            </dd>
          </div>

          <div className={styles.metaRow}>
            <dt className={styles.metaTerm}>
              <Sparkles size={13} aria-hidden="true" /> Phần thưởng dự kiến
            </dt>
            <dd className={styles.metaVal}>
              +{quest.xpReward} XP · +{quest.coinReward}{' '}
              <Coins size={12} style={{ display: 'inline', verticalAlign: '-1px' }} aria-hidden="true" />{' '}
              <span className={styles.quietInlineNote}>(chỉ đọc)</span>
            </dd>
          </div>
        </dl>

        {/* 6. Activity Information (Verified timestamps only — no fabricated timeline) */}
        <div className={styles.activityFooter} style={{ marginTop: 12 }}>
          <span>
            <Clock size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> Tạo lúc:{' '}
            {formatFullDateTime(quest.createdAt)}
          </span>
          <span>Cập nhật: {formatFullDateTime(quest.updatedAt)}</span>
        </div>
      </Card>

      {/* Full Edit Sheet */}
      <Sheet open={editOpen} title="Chỉnh sửa nhiệm vụ" onClose={() => setEditOpen(false)}>
        <form className={styles.form} onSubmit={submitEdit}>
          <div className={styles.field}>
            <label htmlFor="detail-q-title" className={styles.label}>
              Tên nhiệm vụ (3–100 ký tự)
            </label>
            <input
              id="detail-q-title"
              className={styles.input}
              value={qTitle}
              onChange={(e) => setQTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="detail-q-desc" className={styles.label}>
              Mô tả chi tiết
            </label>
            <textarea
              id="detail-q-desc"
              className={styles.textarea}
              value={qDesc}
              onChange={(e) => setQDesc(e.target.value)}
              maxLength={500}
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="detail-q-start" className={styles.label}>
                Thời gian bắt đầu
              </label>
              <input
                id="detail-q-start"
                type="datetime-local"
                className={styles.input}
                value={qStartLocal}
                onChange={(e) => setQStartLocal(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="detail-q-due" className={styles.label}>
                Hạn hoàn thành
              </label>
              <input
                id="detail-q-due"
                type="datetime-local"
                className={styles.input}
                value={qDueLocal}
                onChange={(e) => setQDueLocal(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="detail-q-type" className={styles.label}>
                Phân loại (Category)
              </label>
              <select
                id="detail-q-type"
                className={styles.select}
                value={qType}
                onChange={(e) => setQType(e.target.value as QuestType)}
              >
                {TASK_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="detail-q-priority" className={styles.label}>
                Mức ưu tiên
              </label>
              <select
                id="detail-q-priority"
                className={styles.select}
                value={qPriority}
                onChange={(e) => setQPriority(Number(e.target.value))}
              >
                <option value={1}>Ưu tiên cao</option>
                <option value={2}>Trung bình</option>
                <option value={3}>Nhẹ nhàng</option>
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="detail-q-goal" className={styles.label}>
                Gắn hành trình (Quest)
              </label>
              <select
                id="detail-q-goal"
                className={styles.select}
                value={qGoalId}
                onChange={(e) => {
                  setQGoalId(e.target.value)
                  setQMilestoneId('')
                }}
              >
                <option value="">Không gắn hành trình</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="detail-q-milestone" className={styles.label}>
                Gắn cột mốc
              </label>
              <select
                id="detail-q-milestone"
                className={styles.select}
                value={qMilestoneId}
                onChange={(e) => setQMilestoneId(e.target.value)}
                disabled={!qGoalId}
              >
                <option value="">Không gắn cột mốc</option>
                {(formMilestonesQuery.data ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.position} {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="detail-q-proof" className={styles.label}>
              Yêu cầu minh chứng
            </label>
            <select
              id="detail-q-proof"
              className={styles.select}
              value={qProof}
              onChange={(e) => setQProof(e.target.value as ProofRequirement)}
            >
              <option value="NONE">Không cần minh chứng</option>
              <option value="OPTIONAL">Tùy chọn</option>
              <option value="REQUIRED">Bắt buộc</option>
            </select>
          </div>
          <div className={styles.btnGroup} style={{ justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="accent" disabled={questMut.updateQuest.isPending}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  )
}
