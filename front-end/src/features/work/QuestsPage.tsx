import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  RotateCcw,
  Search,
  SlidersHorizontal,
  User,
  Users
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorBanner, LoadingSkeleton } from '@/components/ui/StateViews'
import { useWorkGoalsQuery, useWorkQuestsQuery } from '@/hooks/useWorkData'
import type { Goal, Quest } from '@/types/domain'
import { pickQuestArtTheme, QuestCoverArt } from './QuestCoverArt'
import {
  classifyQuestTimingState,
  COLLAB_PREVIEW_QUESTS,
  computeQuestProgress,
  formatQuestRemaining,
  formatShortDateVi,
  getQuestTimingLabel,
  type CollaborativeQuestPreview
} from './questUtils'
import { WorkHubSwitcher } from './WorkHubSwitcher'
import styles from './WorkPage.module.css'

type QuestListFilter =
  | 'all'
  | 'mine'
  | 'shared'
  | 'invitations'
  | 'active'
  | 'completed'
  | 'archived'

const QUEST_FILTERS: { key: QuestListFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'mine', label: 'Của tôi' },
  { key: 'shared', label: 'Cộng tác' },
  { key: 'invitations', label: 'Lời mời' },
  { key: 'active', label: 'Đang thực hiện' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'archived', label: 'Lưu trữ' }
]

interface QuestListItem {
  goal: Goal
  tasks: Quest[]
  collab: CollaborativeQuestPreview | null
}

function QuestJourneyCard({
  item,
  onOpen
}: {
  item: QuestListItem
  onOpen: (questId: string) => void
}) {
  const { goal, tasks, collab } = item
  const progress = computeQuestProgress(tasks)
  const timingState = classifyQuestTimingState(goal)
  const remaining =
    goal.status === 'COMPLETED' || goal.status === 'ARCHIVED'
      ? null
      : formatQuestRemaining(goal.dueDate)
  const isUrgent = timingState === 'overdue'
  const isSoon = timingState === 'due_soon'
  const artTheme = pickQuestArtTheme(goal.id, goal.title, Boolean(collab))

  return (
    <article
      className={styles.questHeroCard}
      data-testid="quest-journey-card"
      data-quest-mode={collab ? 'collaborative' : 'personal'}
      onClick={() => onOpen(goal.id)}
    >
      {/* Large Scenic Visual Banner */}
      <div className={styles.questHeroBanner}>
        <QuestCoverArt theme={artTheme} />
        <div className={styles.questHeroScrim} aria-hidden="true" />

        <div className={styles.questHeroOverlayTop}>
          <span className={styles.questHeroModePill}>
            {collab ? (
              <>
                <Users size={12} aria-hidden="true" />
                {collab.isInvitationToMe ? 'Lời mời (Xem trước)' : 'Cộng tác (Xem trước)'}
              </>
            ) : (
              <>
                <User size={12} aria-hidden="true" /> Cá nhân
              </>
            )}
          </span>

          {collab && (
            <div className={styles.avatarStack} aria-label={`${collab.members.length} thành viên`}>
              {collab.members.slice(0, 3).map((m) => (
                <span
                  key={m.id}
                  className={styles.avatarStackItem}
                  style={{ background: m.accentColor }}
                  title={`${m.displayName} (${m.status})`}
                >
                  {m.initials}
                </span>
              ))}
              {collab.members.length > 3 && (
                <span className={styles.avatarStackMore}>+{collab.members.length - 3}</span>
              )}
            </div>
          )}
        </div>

        <div className={styles.questHeroOverlayBottom}>
          <span className={styles.questHeroStatusPill}>{getQuestTimingLabel(timingState)}</span>
        </div>
      </div>

      {/* Spacious Card Body */}
      <div className={styles.questHeroBody}>
        <div className={styles.questHeroTitleRow}>
          <button
            type="button"
            className={styles.questHeroTitleBtn}
            onClick={(e) => {
              e.stopPropagation()
              onOpen(goal.id)
            }}
            data-testid={`quest-open-${goal.id}`}
          >
            {goal.title}
          </button>

          <span className={styles.questHeroOpenPill} aria-hidden="true">
            Mở hành trình <ArrowRight size={13} />
          </span>
        </div>

        {goal.description && <p className={styles.questHeroDesc}>{goal.description}</p>}

        <div className={styles.questQuietMetaRow}>
          <span>Chủ hành trình: {collab ? collab.ownerName : 'Bạn'}</span>
          <span aria-hidden="true">·</span>
          <span className={isUrgent ? styles.textDanger : isSoon ? styles.textAccent : ''}>
            <CalendarClock
              size={12}
              style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }}
              aria-hidden="true"
            />
            Hạn {formatShortDateVi(goal.dueDate)}
            {remaining ? ` (${remaining})` : ''}
          </span>
        </div>

        {/* Authoritative Task-Derived Progress Bar */}
        <div className={styles.progressBlock} style={{ marginTop: 6 }}>
          <div className={styles.progressLabelRow}>
            <span className={styles.progressLabel}>
              {progress.totalCount > 0
                ? `${progress.completedCount}/${progress.totalCount} nhiệm vụ hoàn thành`
                : 'Chưa có nhiệm vụ liên kết'}
            </span>
            <span className={styles.progressPct} style={{ fontSize: 13.5 }}>
              {progress.percent}%
            </span>
          </div>
          <div
            className={styles.progressTrack}
            style={{ height: 8 }}
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Tiến độ ${goal.title}`}
          >
            <div className={styles.progressFill} style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      </div>
    </article>
  )
}

export function QuestsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<QuestListFilter>('all')
  const [search, setSearch] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goalsQuery = useWorkGoalsQuery()
  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data])
  const tasksQuery = useWorkQuestsQuery({})
  const allTasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data])

  const allItems = useMemo<QuestListItem[]>(() => {
    const personalItems: QuestListItem[] = goals.map((goal) => ({
      goal,
      tasks: allTasks.filter((t) => t.goalId === goal.id),
      collab: null
    }))
    const collabItems: QuestListItem[] = COLLAB_PREVIEW_QUESTS.map((collab) => ({
      goal: collab.goal,
      tasks: collab.previewTasks,
      collab
    }))
    return [...personalItems, ...collabItems]
  }, [allTasks, goals])

  const counts = useMemo(() => {
    const res: Record<QuestListFilter, number> = {
      all: allItems.length,
      mine: 0,
      shared: 0,
      invitations: 0,
      active: 0,
      completed: 0,
      archived: 0
    }
    for (const item of allItems) {
      if (!item.collab) res.mine += 1
      else if (item.collab.isInvitationToMe) res.invitations += 1
      else res.shared += 1

      if (item.goal.status === 'COMPLETED') res.completed += 1
      else if (item.goal.status === 'ARCHIVED') res.archived += 1
      else res.active += 1
    }
    return res
  }, [allItems])

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allItems.filter((item) => {
      if (q) {
        const matchTitle = item.goal.title.toLowerCase().includes(q)
        const matchDesc = (item.goal.description ?? '').toLowerCase().includes(q)
        if (!matchTitle && !matchDesc) return false
      }
      switch (filter) {
        case 'mine':
          return !item.collab
        case 'shared':
          return Boolean(item.collab && !item.collab.isInvitationToMe)
        case 'invitations':
          return Boolean(item.collab?.isInvitationToMe)
        case 'active':
          return item.goal.status !== 'COMPLETED' && item.goal.status !== 'ARCHIVED'
        case 'completed':
          return item.goal.status === 'COMPLETED'
        case 'archived':
          return item.goal.status === 'ARCHIVED'
        default:
          return true
      }
    })
  }, [allItems, filter, search])

  const hasActiveFilter = filter !== 'all' || search.trim().length > 0

  const personalActive = filteredItems.filter(
    (i) => !i.collab && i.goal.status !== 'COMPLETED' && i.goal.status !== 'ARCHIVED'
  )
  const sharedOrInvited = filteredItems.filter((i) => Boolean(i.collab))
  const completedOrArchived = filteredItems.filter(
    (i) => !i.collab && (i.goal.status === 'COMPLETED' || i.goal.status === 'ARCHIVED')
  )

  return (
    <div className={styles.stack} data-testid="work-quests-page">
      <WorkHubSwitcher />

      {hasActiveFilter && (
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.sectionTitle}>
            <SlidersHorizontal size={14} aria-hidden="true" />
            Kết quả lọc ({filteredItems.length})
          </h2>
          <button
            type="button"
            className={styles.resetFilterBtn}
            onClick={() => {
              setFilter('all')
              setSearch('')
            }}
            aria-label="Xóa bộ lọc hành trình"
          >
            <RotateCcw size={12} aria-hidden="true" /> Đặt lại
          </button>
        </div>
      )}

      {goalsQuery.isLoading ? (
        <div className={styles.taskList}>
          <LoadingSkeleton height={116} />
          <LoadingSkeleton height={116} />
        </div>
      ) : goalsQuery.error ? (
        <ErrorBanner error={goalsQuery.error} onRetry={() => goalsQuery.refetch()} />
      ) : filteredItems.length === 0 ? (
        <Card>
          <EmptyState
            title="Chưa có hành trình phù hợp"
            description="Chọn Quest ở khung Fox đồng hành bên phải để tạo hành trình mới hoặc đặt lại bộ lọc bên dưới."
          />
        </Card>
      ) : hasActiveFilter ? (
        <div className={styles.taskList} data-testid="quest-journey-list">
          {filteredItems.map((item) => (
            <QuestJourneyCard
              key={item.goal.id}
              item={item}
              onOpen={(id) => navigate(`/work/quests/${id}`)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.stack} data-testid="quest-journey-list">
          {/* Active Personal Quests */}
          {personalActive.length > 0 && (
            <section className={styles.taskSection} aria-label="Hành trình đang thực hiện">
              <div className={styles.sectionHeaderRow}>
                <h2 className={styles.sectionTitle}>Hành trình đang thực hiện</h2>
                <span className={styles.quietCountText}>{personalActive.length}</span>
              </div>
              <div className={styles.taskList}>
                {personalActive.map((item) => (
                  <QuestJourneyCard
                    key={item.goal.id}
                    item={item}
                    onOpen={(id) => navigate(`/work/quests/${id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Collaborative & Invited Quests (Clearly labeled Preview • PENDING API) */}
          {sharedOrInvited.length > 0 && (
            <section className={styles.taskSection} aria-label="Hành trình cộng tác và lời mời">
              <div className={styles.sectionHeaderRow}>
                <h2 className={styles.sectionTitle}>
                  <Users size={14} aria-hidden="true" />
                  Cộng tác &amp; Lời mời
                </h2>
                <span className={styles.pendingPill}>COLLAB PREVIEW • PENDING API</span>
              </div>
              <div className={styles.taskList}>
                {sharedOrInvited.map((item) => (
                  <QuestJourneyCard
                    key={item.goal.id}
                    item={item}
                    onOpen={(id) => navigate(`/work/quests/${id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed / Archived Quests */}
          {completedOrArchived.length > 0 && (
            <section className={styles.taskSection} aria-label="Hoàn thành và lưu trữ">
              <div className={styles.sectionHeaderRow}>
                <h2 className={styles.sectionTitle}>Hoàn thành &amp; Lưu trữ</h2>
                <span className={styles.quietCountText}>{completedOrArchived.length}</span>
              </div>
              <div className={styles.taskList}>
                {completedOrArchived.map((item) => (
                  <QuestJourneyCard
                    key={item.goal.id}
                    item={item}
                    onOpen={(id) => navigate(`/work/quests/${id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Sticky Glass Search & Filter Dock */}
      <section
        className={`${styles.toolbarCard} ${styles.stickyGlassToolbar} ${
          isScrolled ? styles.stickyGlassScrolled : ''
        }`.trim()}
        aria-label="Tìm kiếm và lọc hành trình"
        data-testid="quest-filter-dock"
      >
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.sectionTitle}>
            <SlidersHorizontal size={14} aria-hidden="true" />
            Tìm kiếm &amp; Lọc hành trình
          </h2>
          <span className={styles.quietCountText}>
            {counts.mine} cá nhân · {counts.shared} cộng tác · {counts.invitations} lời mời
          </span>
        </div>

        <div className={styles.filterPills} role="group" aria-label="Lọc hành trình">
          {QUEST_FILTERS.map((opt) => {
            const active = filter === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={active}
                className={`${styles.filterPill} ${active ? styles.filterPillActive : ''}`}
                onClick={() => setFilter(opt.key)}
              >
                <span>{opt.label}</span>
                <span className={styles.filterCount}>{counts[opt.key]}</span>
              </button>
            )
          })}
        </div>

        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Tìm theo tên hoặc mô tả hành trình..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm kiếm hành trình"
          />
        </div>
      </section>
    </div>
  )
}
