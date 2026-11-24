import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  ChevronRight,
  Circle,
  Clock,
  RotateCcw,
  Search,
  SlidersHorizontal
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { QUEST_TYPE_META } from '@/components/ui/questIconMeta'
import { EmptyState, ErrorBanner, LoadingSkeleton } from '@/components/ui/StateViews'
import {
  useQuestMutations,
  useWorkGoalsQuery,
  useWorkQuestsQuery
} from '@/hooks/useWorkData'
import type { Goal, Quest } from '@/types/domain'
import { FoxPawPinButton } from './FoxPawPinButton'
import { WorkHubSwitcher } from './WorkHubSwitcher'
import {
  classifyTaskTimeState,
  filterQuestsByBucket,
  formatDueLabel,
  formatStartLabel,
  getPriorityMeta,
  groupTasksActionFirst,
  sortQuests,
  type TaskFilterBucket,
  type TaskSortKey
} from './taskUtils'
import styles from './WorkPage.module.css'

const FILTER_OPTIONS: { key: TaskFilterBucket; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'overdue', label: 'Quá hạn' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'archived', label: 'Lưu trữ' }
]

interface TaskCardRowProps {
  quest: Quest
  linkedGoal: Goal | null
  nowMs: number
  onOpenDetail: (questId: string) => void
  onTogglePin: (quest: Quest) => void
  pinDisabled?: boolean
}

function TaskCardRow({
  quest,
  linkedGoal,
  nowMs,
  onOpenDetail,
  onTogglePin,
  pinDisabled = false
}: TaskCardRowProps) {
  const typeMeta = QUEST_TYPE_META[quest.type]
  const TypeIcon = typeMeta.Icon
  const timeState = classifyTaskTimeState(quest, nowMs)
  const startLabel = formatStartLabel(quest.startAt, nowMs)
  const dueLabel = formatDueLabel(quest.dueAt, nowMs)
  const priorityMeta = getPriorityMeta(quest.priority)

  const isUrgent = timeState === 'overdue' || timeState === 'due_soon'
  const isStartingSoon = timeState === 'starting_soon'

  return (
    <article
      data-testid="task-card"
      data-quest-id={quest.id}
      data-pinned={quest.isPinned ? 'true' : 'false'}
      data-time-state={timeState}
      className={`${styles.taskCard} ${
        timeState === 'overdue' && quest.status === 'ACTIVE'
          ? styles.taskCardOverdue
          : quest.isPinned
            ? styles.taskCardPinned
            : ''
      }`}
    >
      <div className={styles.taskLeftControls}>
        <button
          type="button"
          disabled
          className={styles.checkPendingBtn}
          title="Hoàn thành nhiệm vụ & cộng XP chờ Backend Execution API (PENDING)"
          aria-label={`Hoàn thành ${quest.title} (chờ Execution API)`}
        >
          <Circle size={12} aria-hidden="true" />
        </button>

        <span
          className={styles.typeIconWrap}
          style={{ background: typeMeta.softBg, color: typeMeta.color }}
          title={typeMeta.label}
        >
          <TypeIcon size={15} strokeWidth={2.2} aria-hidden="true" />
        </span>
      </div>

      {/* Low-noise 3-tier hierarchy: PRIMARY title -> SECONDARY start/due -> TERTIARY quiet metadata */}
      <button
        type="button"
        className={styles.taskMainBtn}
        onClick={() => onOpenDetail(quest.id)}
        aria-label={`Mở chi tiết nhiệm vụ ${quest.title}`}
      >
        <div className={styles.taskTitleRow}>
          <span className={styles.taskTitle}>{quest.title}</span>
        </div>

        <div className={styles.taskTimeRow}>
          {startLabel && (
            <span className={`${styles.timeCue} ${isStartingSoon ? styles.timeCueAccent : ''}`}>
              <Clock size={11} aria-hidden="true" />
              {startLabel}
            </span>
          )}
          {startLabel && (
            <span className={styles.timeDotSep} aria-hidden="true">
              ·
            </span>
          )}
          <span
            className={`${styles.timeCue} ${
              timeState === 'overdue'
                ? styles.timeCueDanger
                : isUrgent
                  ? styles.timeCueAccent
                  : ''
            }`}
          >
            <CalendarClock size={11} aria-hidden="true" />
            {dueLabel}
          </span>
        </div>

        <div className={styles.taskQuietMeta}>
          <span>{typeMeta.label}</span>
          {quest.priority === 1 && (
            <>
              <span aria-hidden="true">·</span>
              <span className={styles.quietHighPriority}>{priorityMeta.label}</span>
            </>
          )}
          {linkedGoal && (
            <>
              <span aria-hidden="true">·</span>
              <span className={styles.quietGoalName} title={linkedGoal.title}>
                {linkedGoal.title}
              </span>
            </>
          )}
        </div>
      </button>

      <div className={styles.taskActions}>
        {quest.status === 'ACTIVE' && (
          <FoxPawPinButton
            pinned={quest.isPinned}
            taskTitle={quest.title}
            disabled={pinDisabled}
            onToggle={() => onTogglePin(quest)}
          />
        )}

        <button
          type="button"
          className={styles.iconActionBtn}
          onClick={() => onOpenDetail(quest.id)}
          aria-label={`Xem chi tiết ${quest.title}`}
          title="Mở trang chi tiết nhiệm vụ"
        >
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}

export function WorkPage() {
  const navigate = useNavigate()
  const [actionError, setActionError] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 24)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Sticky glass filter/search/sort state
  const [bucket, setBucket] = useState<TaskFilterBucket>('all')
  const [filterGoalId, setFilterGoalId] = useState<string>('')
  const [questSearch, setQuestSearch] = useState<string>('')
  const [sortBy, setSortBy] = useState<TaskSortKey>('smart')

  const goalsQuery = useWorkGoalsQuery()
  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data])

  // Primary action-first feed always reads ACTIVE quests
  const activeQuestsQuery = useWorkQuestsQuery({ status: 'ACTIVE' })
  const activeQuests = useMemo(() => activeQuestsQuery.data ?? [], [activeQuestsQuery.data])

  // Filtered query (switches to ARCHIVED only when requested)
  const apiStatus = bucket === 'archived' ? 'ARCHIVED' : 'ACTIVE'
  const filteredQuestsQuery = useWorkQuestsQuery({
    status: apiStatus,
    goalId: filterGoalId || undefined,
    search: questSearch.trim() || undefined
  })
  const filteredRaw = useMemo(() => filteredQuestsQuery.data ?? [], [filteredQuestsQuery.data])

  const goalMap = useMemo(() => {
    const map = new Map<string, Goal>()
    for (const g of goals) map.set(g.id, g)
    return map
  }, [goals])

  const nowMs = Date.now()
  const actionGroups = useMemo(
    () => groupTasksActionFirst(activeQuests, nowMs),
    [activeQuests, nowMs]
  )

  const bucketCounts = useMemo(
    () => ({
      all: filterQuestsByBucket(activeQuests, 'all', nowMs).length,
      today: filterQuestsByBucket(activeQuests, 'today', nowMs).length,
      upcoming: filterQuestsByBucket(activeQuests, 'upcoming', nowMs).length,
      overdue: filterQuestsByBucket(activeQuests, 'overdue', nowMs).length,
      completed: filterQuestsByBucket(activeQuests, 'completed', nowMs).length
    }),
    [activeQuests, nowMs]
  )

  const hasFilterActive =
    bucket !== 'all' || Boolean(filterGoalId) || Boolean(questSearch.trim()) || sortBy !== 'smart'

  const filteredVisibleQuests = useMemo(() => {
    const filtered = filterQuestsByBucket(filteredRaw, bucket, nowMs)
    return sortQuests(filtered, sortBy, nowMs)
  }, [filteredRaw, bucket, sortBy, nowMs])

  const questMut = useQuestMutations()
  const pinBusy = questMut.pinQuest.isPending || questMut.unpinQuest.isPending

  const handleOpenDetail = (questId: string) => {
    navigate(`/work/tasks/${encodeURIComponent(questId)}`)
  }

  const resetFilters = () => {
    setBucket('all')
    setFilterGoalId('')
    setQuestSearch('')
    setSortBy('smart')
  }

  const handleTogglePin = async (q: Quest) => {
    setActionError(null)
    try {
      if (q.isPinned) {
        await questMut.unpinQuest.mutateAsync(q.id)
      } else {
        await questMut.pinQuest.mutateAsync(q.id)
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái ghim.')
    }
  }

  const upcomingAndUnscheduled = [...actionGroups.upcoming, ...actionGroups.unscheduled]
  const activeBucketLabel = FILTER_OPTIONS.find((o) => o.key === bucket)?.label ?? 'Tất cả'

  return (
    <div className={styles.stack} data-testid="work-task-page">
      <WorkHubSwitcher />

      {actionError && (
        <div className={styles.errorBox} role="alert">
          {actionError}
        </div>
      )}

      {/* Main Center Task Area: shows filtered results directly when filtering/searching, or action-first sections by default */}
      {hasFilterActive ? (
        <section
          className={styles.taskSection}
          aria-label="Kết quả lọc và tìm kiếm"
          data-testid="task-filtered-results"
        >
          <div className={styles.sectionHeaderRow}>
            <h2 className={styles.sectionTitle}>
              <SlidersHorizontal size={14} aria-hidden="true" />
              Kết quả: {activeBucketLabel}
              {questSearch.trim() ? ` · "${questSearch.trim()}"` : ''}
            </h2>
            <button
              type="button"
              className={styles.resetFilterBtn}
              onClick={resetFilters}
              aria-label="Xóa bộ lọc"
            >
              <RotateCcw size={12} aria-hidden="true" /> Đặt lại
            </button>
          </div>

          {bucket === 'completed' && (
            <div className={styles.pendingNotice} role="status">
              Hoàn thành nhiệm vụ &amp; cộng XP đang chờ Backend Execution API (PENDING).
            </div>
          )}

          {filteredQuestsQuery.isLoading ? (
            <div className={styles.taskList}>
              <LoadingSkeleton height={78} />
              <LoadingSkeleton height={78} />
            </div>
          ) : filteredQuestsQuery.error ? (
            <ErrorBanner
              error={filteredQuestsQuery.error}
              onRetry={() => filteredQuestsQuery.refetch()}
            />
          ) : filteredVisibleQuests.length === 0 ? (
            <Card>
              <EmptyState
                title="Không tìm thấy nhiệm vụ phù hợp"
                description="Thử đổi bộ lọc hoặc từ khóa tìm kiếm ở thanh bên dưới."
              />
            </Card>
          ) : (
            <div className={styles.taskList} data-testid="task-list">
              {filteredVisibleQuests.map((q) => (
                <TaskCardRow
                  key={q.id}
                  quest={q}
                  linkedGoal={q.goalId ? (goalMap.get(q.goalId) ?? null) : null}
                  nowMs={nowMs}
                  onOpenDetail={handleOpenDetail}
                  onTogglePin={handleTogglePin}
                  pinDisabled={pinBusy}
                />
              ))}
            </div>
          )}
        </section>
      ) : activeQuestsQuery.isLoading ? (
        <div className={styles.taskList}>
          <LoadingSkeleton height={78} />
          <LoadingSkeleton height={78} />
          <LoadingSkeleton height={78} />
        </div>
      ) : activeQuestsQuery.error ? (
        <ErrorBanner
          error={activeQuestsQuery.error}
          onRetry={() => activeQuestsQuery.refetch()}
        />
      ) : activeQuests.length === 0 ? (
        <Card>
          <EmptyState
            title="Chưa có nhiệm vụ nào đang mở"
            description="Tạo nhiệm vụ mới ngay ở khung Fox đồng hành bên phải để bắt đầu hôm nay."
          />
        </Card>
      ) : (
        <div className={styles.actionSections} data-testid="task-list">
          {/* Urgent / Overdue / Due Soon / Starting Soon */}
          {actionGroups.urgent.length > 0 && (
            <section className={styles.taskSection} aria-label="Cần chú ý ngay" data-testid="section-urgent">
              <div className={styles.sectionHeaderRow}>
                <h2 className={`${styles.sectionTitle} ${styles.sectionTitleUrgent}`}>
                  <AlertCircle size={14} aria-hidden="true" />
                  Cần chú ý ngay
                </h2>
                <span className={styles.sectionCount}>{actionGroups.urgent.length}</span>
              </div>
              <div className={styles.taskList}>
                {actionGroups.urgent.map((q) => (
                  <TaskCardRow
                    key={q.id}
                    quest={q}
                    linkedGoal={q.goalId ? (goalMap.get(q.goalId) ?? null) : null}
                    nowMs={nowMs}
                    onOpenDetail={handleOpenDetail}
                    onTogglePin={handleTogglePin}
                    pinDisabled={pinBusy}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Today's Tasks in Chronological Order */}
          <section className={styles.taskSection} aria-label="Hôm nay" data-testid="section-today">
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>
                <Clock size={14} aria-hidden="true" />
                Hôm nay
              </h2>
              <span className={styles.sectionCount}>{actionGroups.today.length}</span>
            </div>
            {actionGroups.today.length === 0 ? (
              <p className={styles.quietEmptyLine}>
                Không còn đầu việc nào khác trong hôm nay.
              </p>
            ) : (
              <div className={styles.taskList}>
                {actionGroups.today.map((q) => (
                  <TaskCardRow
                    key={q.id}
                    quest={q}
                    linkedGoal={q.goalId ? (goalMap.get(q.goalId) ?? null) : null}
                    nowMs={nowMs}
                    onOpenDetail={handleOpenDetail}
                    onTogglePin={handleTogglePin}
                    pinDisabled={pinBusy}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Upcoming & Unscheduled Tasks */}
          {upcomingAndUnscheduled.length > 0 && (
            <section className={styles.taskSection} aria-label="Sắp tới" data-testid="section-upcoming">
              <div className={styles.sectionHeaderRow}>
                <h2 className={styles.sectionTitle}>
                  <Calendar size={14} aria-hidden="true" />
                  Sắp tới &amp; Chưa đặt lịch
                </h2>
                <span className={styles.sectionCount}>{upcomingAndUnscheduled.length}</span>
              </div>
              <div className={styles.taskList}>
                {upcomingAndUnscheduled.map((q) => (
                  <TaskCardRow
                    key={q.id}
                    quest={q}
                    linkedGoal={q.goalId ? (goalMap.get(q.goalId) ?? null) : null}
                    nowMs={nowMs}
                    onOpenDetail={handleOpenDetail}
                    onTogglePin={handleTogglePin}
                    pinDisabled={pinBusy}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Sticky Glass Search & Filter Dock (Controls ONLY — results always render cleanly above) */}
      <section
        id="task-advanced-search"
        className={`${styles.toolbarCard} ${styles.stickyGlassToolbar} ${
          isScrolled ? styles.stickyGlassScrolled : ''
        }`.trim()}
        aria-label="Tìm kiếm và quản lý toàn bộ nhiệm vụ"
        data-testid="task-advanced-section"
        data-scrolled={isScrolled ? 'true' : 'false'}
      >
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.sectionTitle}>
            <SlidersHorizontal size={14} aria-hidden="true" />
            Tìm kiếm &amp; Quản lý toàn bộ
          </h2>
          <span className={styles.quietCountText}>
            {bucketCounts.all} đang mở · {bucketCounts.overdue} quá hạn
          </span>
        </div>

        <div className={styles.filterPills} role="group" aria-label="Lọc theo trạng thái">
          {FILTER_OPTIONS.map((opt) => {
            const active = bucket === opt.key
            const count = opt.key === 'archived' ? null : bucketCounts[opt.key]
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={active}
                className={`${styles.filterPill} ${
                  active
                    ? opt.key === 'overdue'
                      ? styles.filterPillDangerActive
                      : styles.filterPillActive
                    : ''
                }`}
                onClick={() => setBucket(opt.key)}
              >
                <span>{opt.label}</span>
                {count !== null && <span className={styles.filterCount}>{count}</span>}
              </button>
            )
          })}
        </div>

        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} aria-hidden="true" />
            <input
              ref={searchInputRef}
              aria-label="Tìm nhiệm vụ"
              className={styles.searchInput}
              value={questSearch}
              onChange={(e) => setQuestSearch(e.target.value)}
              placeholder="Tìm theo tên nhiệm vụ..."
            />
          </div>

          <select
            aria-label="Lọc theo hành trình"
            className={styles.select}
            value={filterGoalId}
            onChange={(e) => setFilterGoalId(e.target.value)}
          >
            <option value="">Tất cả hành trình</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>

          <select
            aria-label="Sắp xếp nhiệm vụ"
            className={styles.select}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as TaskSortKey)}
          >
            <option value="smart">Ưu tiên thời gian</option>
            <option value="due_asc">Hạn gần nhất</option>
            <option value="priority_asc">Ưu tiên cao</option>
            <option value="updated_desc">Mới cập nhật</option>
            <option value="title_asc">Tên A–Z</option>
          </select>
        </div>
      </section>
    </div>
  )
}
