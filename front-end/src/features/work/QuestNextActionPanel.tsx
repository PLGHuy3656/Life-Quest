import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Plus,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Quest } from '@/types/domain'
import type { QuestMemberPreview } from './questUtils'
import {
  classifyTaskTimeState,
  formatFullDateTime,
  formatRemainingDuration,
  sortTasksActionFirst
} from './taskUtils'
import styles from './QuestJourney.module.css'

export interface QuestNextActionPanelProps {
  tasks: Quest[]
  isCollaborative: boolean
  currentUserId: string
  members?: QuestMemberPreview[]
  assigneeMap?: Record<string, string>
  onOpenTask: (task: Quest) => void
  onAddTask: () => void
}

function getUrgencyLabel(state: ReturnType<typeof classifyTaskTimeState>): string {
  switch (state) {
    case 'overdue':
      return 'Quá hạn'
    case 'due_soon':
      return 'Sắp đến hạn'
    case 'starting_soon':
      return 'Sắp bắt đầu'
    case 'today':
      return 'Hôm nay'
    case 'upcoming':
      return 'Sắp tới'
    default:
      return 'Chưa đặt lịch'
  }
}

/**
 * FE-04C.2 QuestNextActionPanel — immediately answers "What must I do now?"
 * - Strictly distinguishes starting_soon (startAt) from due_soon / overdue (dueAt).
 * - In collaborative Quests, prioritizes Tasks assigned to the current user while
 *   allowing instant toggle to Team Tasks and never hiding urgent team alerts.
 */
export function QuestNextActionPanel({
  tasks,
  isCollaborative,
  currentUserId,
  members = [],
  assigneeMap = {},
  onOpenTask,
  onAddTask
}: QuestNextActionPanelProps) {
  const [scope, setScope] = useState<'mine' | 'team'>('mine')

  const actionableAll = useMemo(() => {
    const activeIncomplete = tasks.filter(
      (t) => !t.deletedAt && t.status !== 'ARCHIVED' && !t.completedAt
    )
    return sortTasksActionFirst(activeIncomplete)
  }, [tasks])

  const myActionable = useMemo(() => {
    if (!isCollaborative) return actionableAll
    return actionableAll.filter((t) => assigneeMap[t.id] === currentUserId)
  }, [actionableAll, assigneeMap, currentUserId, isCollaborative])

  const urgentTeamAlert = useMemo(() => {
    if (!isCollaborative || scope !== 'mine') return null
    return (
      actionableAll.find((t) => {
        if (assigneeMap[t.id] === currentUserId) return false
        const st = classifyTaskTimeState(t)
        return st === 'overdue' || st === 'due_soon'
      }) ?? null
    )
  }, [actionableAll, assigneeMap, currentUserId, isCollaborative, scope])

  const visibleTasks = (isCollaborative && scope === 'mine' ? myActionable : actionableAll).slice(0, 3)

  return (
    <section
      className={styles.nextActionCard}
      aria-label="Việc cần làm ngay trong hành trình"
      data-testid="quest-next-action-panel"
    >
      <div className={styles.nextActionHeader}>
        <div className={styles.nextActionTitleGroup}>
          <span className={styles.nextActionDot} aria-hidden="true" />
          <h2 className={styles.panelHeading}>Cần làm ngay</h2>
          <span className={styles.quietCountPill}>{actionableAll.length} việc đang mở</span>
        </div>

        {isCollaborative && (
          <div className={styles.scopeSwitch} role="group" aria-label="Phạm vi việc ưu tiên">
            <button
              type="button"
              aria-pressed={scope === 'mine'}
              className={`${styles.scopeBtn} ${scope === 'mine' ? styles.scopeBtnActive : ''}`}
              onClick={() => setScope('mine')}
              data-testid="next-action-scope-mine"
            >
              Của tôi ({myActionable.length})
            </button>
            <button
              type="button"
              aria-pressed={scope === 'team'}
              className={`${styles.scopeBtn} ${scope === 'team' ? styles.scopeBtnActive : ''}`}
              onClick={() => setScope('team')}
              data-testid="next-action-scope-team"
            >
              <Users size={12} aria-hidden="true" /> Cả nhóm ({actionableAll.length})
            </button>
          </div>
        )}
      </div>

      {visibleTasks.length === 0 ? (
        <div className={styles.nextActionEmpty} data-testid="quest-next-action-empty">
          <CheckCircle2 size={18} className={styles.tealIcon} aria-hidden="true" />
          <div>
            <strong>
              {tasks.length === 0
                ? 'Hành trình chưa có nhiệm vụ nào'
                : isCollaborative && scope === 'mine' && actionableAll.length > 0
                  ? 'Bạn không có nhiệm vụ tồn đọng — có thể xem việc của cả nhóm'
                  : 'Không còn nhiệm vụ đang mở nào cần xử lý gấp'}
            </strong>
            <p className={styles.mutedSub}>
              {tasks.length === 0
                ? 'Thêm nhiệm vụ đầu tiên để bắt đầu lộ trình chinh phục hành trình này.'
                : 'Tiếp tục giữ nhịp hoặc thêm nhiệm vụ mới cho chặng tiếp theo.'}
            </p>
          </div>
          {tasks.length === 0 && (
            <Button variant="accent" size="sm" onClick={onAddTask}>
              <Plus size={14} aria-hidden="true" /> Thêm Task đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.nextActionList}>
          {visibleTasks.map((task, idx) => {
            const timeState = classifyTaskTimeState(task)
            const remaining = task.dueAt ? formatRemainingDuration(task.dueAt) : null
            const assigneeId = assigneeMap[task.id]
            const assignee = members.find((m) => m.id === assigneeId) ?? null
            const isPrimary = idx === 0
            const isDanger = timeState === 'overdue'
            const isWarn = timeState === 'due_soon' || timeState === 'starting_soon'

            return (
              <div
                key={task.id}
                className={`${styles.nextActionItem} ${isPrimary ? styles.nextActionPrimary : ''}`}
                data-testid="quest-next-action-item"
                data-time-state={timeState}
              >
                <div className={styles.nextActionItemBody}>
                  <div className={styles.nextActionTopLine}>
                    <span
                      className={`${styles.urgencyTag} ${
                        isDanger
                          ? styles.urgencyDanger
                          : isWarn
                            ? styles.urgencyWarn
                            : styles.urgencyNeutral
                      }`}
                    >
                      {getUrgencyLabel(timeState)}
                    </span>
                    {assignee && (
                      <span className={styles.miniAssignee}>
                        <span
                          className={styles.miniAvatar}
                          style={{ background: assignee.accentColor }}
                          aria-hidden="true"
                        >
                          {assignee.initials}
                        </span>
                        {assignee.displayName}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={styles.nextActionTaskTitle}
                    onClick={() => onOpenTask(task)}
                  >
                    {task.title}
                  </button>

                  <div className={styles.nextActionTimingRow}>
                    {task.startAt && (
                      <span>
                        <Clock size={12} aria-hidden="true" /> Bắt đầu: {formatFullDateTime(task.startAt)}
                      </span>
                    )}
                    <span>
                      <CalendarClock size={12} aria-hidden="true" /> Hạn:{' '}
                      <strong className={isDanger ? styles.textDanger : isWarn ? styles.textAccent : ''}>
                        {task.dueAt ? formatFullDateTime(task.dueAt) : 'Chưa đặt hạn'}
                        {remaining ? ` (${remaining})` : ''}
                      </strong>
                    </span>
                  </div>
                </div>

                <Button
                  variant={isPrimary ? 'accent' : 'ghost'}
                  size="sm"
                  onClick={() => onOpenTask(task)}
                  data-testid={`next-action-open-${idx}`}
                >
                  Mở việc <ArrowRight size={13} aria-hidden="true" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Never hide urgent team Tasks when viewing "Của tôi" */}
      {urgentTeamAlert && (
        <div className={styles.urgentTeamCallout} role="status" data-testid="urgent-team-alert">
          <AlertTriangle size={14} aria-hidden="true" />
          <span>
            Nhóm có việc gấp: <strong>{urgentTeamAlert.title}</strong>
          </span>
          <button
            type="button"
            className={styles.inlineActionLink}
            onClick={() => setScope('team')}
          >
            Xem việc cả nhóm
          </button>
        </div>
      )}
    </section>
  )
}
