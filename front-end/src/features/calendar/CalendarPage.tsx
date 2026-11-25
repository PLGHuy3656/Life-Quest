import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Flag,
  PanelRightOpen,
  PawPrint
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { ErrorBanner, LoadingSkeleton } from '@/components/ui/StateViews'
import {
  SocialMediaLightbox,
  type LightboxMediaItem
} from '@/features/dashboard/media/SocialMediaLightbox'
import { useWorkGoalsQuery, useWorkQuestsQuery } from '@/hooks/useWorkData'
import { MOCK_MILESTONES } from '@/services/repositories/fixtures'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import {
  addDaysLocal,
  addMonthsLocal,
  getTodayLocalDate,
  getWeekDatesLocal,
  parseLocalDate
} from '@/utils/date'
import { CalendarDailyAgendaPanel } from './CalendarDailyAgendaPanel'
import { CalendarDayTimeline } from './CalendarDayTimeline'
import { getDemoMomentForDate, getDemoMomentsForDate } from './calendarDemoMoments'
import {
  buildRoadSpanWeeks,
  computeWeekRoadSegments,
  deriveCalendarJourneyRoads,
  type CalendarJourneyRoad,
  type RoadSpanRow
} from './calendarRoadUtils'
import { JourneyRoadOverlay } from './JourneyRoadOverlay'
import {
  aggregateDailyTaskDeadlines,
  buildUpcomingDeadlines,
  computeMonthlySummaryCounts,
  deriveCalendarEventsForRange,
  formatVietnameseFullDate,
  getDynamicMonthCalendarGrid,
  sortCellPreviewEvents,
  type CalendarEventCategory,
  type CalendarEventItem
} from './calendarUtils'
import styles from './CalendarPage.module.css'

type CalendarView = 'month' | 'week' | 'day'

const WEEKDAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const

const CATEGORY_META: {
  key: CalendarEventCategory
  label: string
  activeClass: string
  color: string
}[] = [
  { key: 'task', label: 'Task', activeClass: styles.catToggleTaskActive, color: '#f26b3a' },
  { key: 'habit', label: 'Habit', activeClass: styles.catToggleHabitActive, color: '#168c78' },
  { key: 'quest', label: 'Quest', activeClass: styles.catToggleQuestActive, color: '#d99b1e' },
  { key: 'moment', label: 'Moment', activeClass: styles.catToggleMomentActive, color: '#6f5ce0' }
]

const INLINE_AGENDA_MIN_WORKSPACE_WIDTH = 920

function renderCategoryIcon(category: CalendarEventCategory, size = 12, color?: string) {
  const style = color ? { color, flexShrink: 0 } : { flexShrink: 0 }
  if (category === 'task') return <CheckSquare size={size} style={style} aria-hidden="true" />
  if (category === 'habit') return <PawPrint size={size} style={style} aria-hidden="true" />
  if (category === 'quest') return <Compass size={size} style={style} aria-hidden="true" />
  return <Camera size={size} style={style} aria-hidden="true" />
}

/**
 * FE-05A.2 Journey Calendar (/calendar).
 * - Fox-free workspace inside shared AppShell (Header + aligned PinnedTaskRail + PlayerStatsRail).
 * - No redundant title block or top strip; maximum space dedicated to the Calendar Grid & Daily Agenda.
 * - Distinct visual symbols per type: Task (CheckSquare left-accented chip), Habit (Fox PawPrint badge),
 *   Quest (Compass gold milestone banner), Moment (Camera).
 */
export function CalendarPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const openSheet = useUiStore((s) => s.openSheet)
  const todayYmd = getTodayLocalDate()

  const workspaceRef = useRef<HTMLDivElement | null>(null)
  const monthGridScrollRef = useRef<HTMLDivElement | null>(null)

  const [selectedDate, setSelectedDate] = useState(todayYmd)
  const [view, setView] = useState<CalendarView>('month')
  const [enabledCategories, setEnabledCategories] = useState<Record<CalendarEventCategory, boolean>>({
    task: true,
    habit: true,
    quest: true,
    moment: true
  })
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false)
  const [highlightedRoad, setHighlightedRoad] = useState<CalendarJourneyRoad | null>(null)
  const [activeRoad, setActiveRoad] = useState<CalendarJourneyRoad | null>(null)
  const [lightboxState, setLightboxState] = useState<{
    items: LightboxMediaItem[]
    activeIndex: number
  } | null>(null)

  const tasksQuery = useWorkQuestsQuery({})
  const goalsQuery = useWorkGoalsQuery()
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data])
  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data])

  const parsedSelected = parseLocalDate(selectedDate)
  const monthLabel = `Tháng ${parsedSelected.getMonth() + 1} / ${parsedSelected.getFullYear()}`
  const monthPrefix = `${parsedSelected.getFullYear()}-${String(parsedSelected.getMonth() + 1).padStart(2, '0')}`

  const monthGrid = useMemo(
    () =>
      getDynamicMonthCalendarGrid(
        parsedSelected.getFullYear(),
        parsedSelected.getMonth(),
        todayYmd
      ),
    [parsedSelected, todayYmd]
  )

  const weekCells = useMemo(
    () => getWeekDatesLocal(selectedDate, todayYmd),
    [selectedDate, todayYmd]
  )

  const monthWeeks = useMemo(() => {
    const cells = monthGrid.cells
    const chunks: (typeof cells)[] = []
    for (let i = 0; i < cells.length; i += 7) {
      chunks.push(cells.slice(i, i + 7))
    }
    return chunks
  }, [monthGrid.cells])

  const displayRows = useMemo<RoadSpanRow[]>(() => {
    if (
      view === 'month' &&
      highlightedRoad?.hasValidRange &&
      highlightedRoad.startYmd &&
      highlightedRoad.endYmd
    ) {
      return buildRoadSpanWeeks(highlightedRoad.startYmd, highlightedRoad.endYmd, todayYmd)
    }
    return monthWeeks.map((cells, idx) => ({ kind: 'week', weekIndex: idx, cells }))
  }, [highlightedRoad, monthWeeks, todayYmd, view])

  const visibleCells = useMemo(() => {
    if (view === 'month') {
      return displayRows.flatMap((row) => (row.kind === 'week' ? row.cells : []))
    }
    if (view === 'week') return weekCells
    return [
      {
        ymd: selectedDate,
        dayOfMonth: parsedSelected.getDate(),
        inCurrentMonth: true,
        isToday: selectedDate === todayYmd
      }
    ]
  }, [displayRows, parsedSelected, selectedDate, todayYmd, view, weekCells])

  const visibleYmds = useMemo(() => visibleCells.map((c) => c.ymd), [visibleCells])

  const allRangeEvents = useMemo(
    () =>
      deriveCalendarEventsForRange({
        tasks,
        goals,
        visibleYmds,
        isLiveAuth: isAuthenticated
      }),
    [goals, isAuthenticated, tasks, visibleYmds]
  )

  const filteredEvents = useMemo(
    () => allRangeEvents.filter((ev) => enabledCategories[ev.category]),
    [allRangeEvents, enabledCategories]
  )

  const eventsByYmd = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>()
    for (const ev of filteredEvents) {
      const bucket = map.get(ev.ymd)
      if (bucket) bucket.push(ev)
      else map.set(ev.ymd, [ev])
    }
    return map
  }, [filteredEvents])

  const selectedDayEvents = useMemo(
    () => eventsByYmd.get(selectedDate) ?? [],
    [eventsByYmd, selectedDate]
  )

  const monthSummary = useMemo(
    () => computeMonthlySummaryCounts(allRangeEvents, monthPrefix),
    [allRangeEvents, monthPrefix]
  )

  const upcomingDeadlines = useMemo(
    () => buildUpcomingDeadlines(tasks, goals, isAuthenticated),
    [goals, isAuthenticated, tasks]
  )

  const dailyDeadlines = useMemo(() => aggregateDailyTaskDeadlines(tasks), [tasks])

  const journeyRoads = useMemo(
    () =>
      deriveCalendarJourneyRoads({
        tasks,
        goals,
        milestonesByGoal: isAuthenticated ? {} : MOCK_MILESTONES,
        isLiveAuth: isAuthenticated
      }),
    [goals, isAuthenticated, tasks]
  )

  const visibleJourneyRoads = useMemo(
    () =>
      journeyRoads.filter((r) =>
        r.kind === 'quest' ? enabledCategories.quest : enabledCategories.task
      ),
    [enabledCategories.quest, enabledCategories.task, journeyRoads]
  )

  const selectedDayMoments = useMemo(
    () => (enabledCategories.moment ? getDemoMomentsForDate(selectedDate, todayYmd) : []),
    [enabledCategories.moment, selectedDate, todayYmd]
  )

  const openPhotoLightboxForDate = (ymd: string) => {
    const dayMoments = enabledCategories.moment ? getDemoMomentsForDate(ymd, todayYmd) : []
    if (dayMoments.length === 0) return
    const items: LightboxMediaItem[] = dayMoments.map((m, idx) => ({
      id: `moment:${ymd}:${idx}`,
      src: m.imageUrl,
      alt: m.caption ?? `Khoảnh khắc ngày ${formatVietnameseFullDate(ymd)}`,
      capturedAt: formatVietnameseFullDate(ymd),
      isDemo: true
    }))
    setLightboxState({ items, activeIndex: 0 })
  }

  // Auto-scroll Month grid so the user's current / selected date is immediately centered in view
  useEffect(() => {
    if (view !== 'month') return
    const container = monthGridScrollRef.current
    if (!container) return
    const target = container.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`)
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'center', behavior: 'auto' })
    }
  }, [selectedDate, view, monthGrid.cells])

  const stepPeriod = (dir: -1 | 1) => {
    if (view === 'month') setSelectedDate((d) => addMonthsLocal(d, dir))
    else if (view === 'week') setSelectedDate((d) => addDaysLocal(d, dir * 7))
    else setSelectedDate((d) => addDaysLocal(d, dir))
  }

  const toggleCategory = (cat: CalendarEventCategory) => {
    setEnabledCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const handleSelectCell = (ymd: string) => {
    setSelectedDate(ymd)
    const width = workspaceRef.current?.clientWidth
    const shouldOpenDrawer =
      typeof width === 'number' && width > 0
        ? width < INLINE_AGENDA_MIN_WORKSPACE_WIDTH
        : typeof window !== 'undefined' && window.innerWidth < 1180
    if (shouldOpenDrawer) {
      setDayDrawerOpen(true)
    }
  }

  const handleSelectEvent = (ev: CalendarEventItem) => {
    setDayDrawerOpen(false)
    navigate(ev.route)
  }

  return (
    <div ref={workspaceRef} className={styles.workspace} data-testid="journey-calendar-page">
      {(tasksQuery.error || goalsQuery.error) && (
        <ErrorBanner
          error={tasksQuery.error ?? goalsQuery.error}
          onRetry={() => {
            void tasksQuery.refetch()
            void goalsQuery.refetch()
          }}
        />
      )}

      {/* Viewport-Fit Split Workspace (~70% Calendar Grid / ~30% Claude Daily Agenda Panel) */}
      <div className={styles.mainGrid}>
        <section className={styles.calendarCard} aria-label="Lưới lịch chính">
          <div className={styles.navBar}>
            <div className={styles.navLeft}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => stepPeriod(-1)}
                aria-label="Kỳ trước"
                data-testid="calendar-prev-btn"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => stepPeriod(1)}
                aria-label="Kỳ sau"
                data-testid="calendar-next-btn"
              >
                <ChevronRight size={16} />
              </Button>
              <h1 className={styles.periodTitle} data-testid="calendar-period-title">
                {view === 'day' ? formatVietnameseFullDate(selectedDate) : monthLabel}
              </h1>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => setSelectedDate(todayYmd)}
                data-testid="calendar-today-btn"
              >
                Hôm nay
              </Button>
            </div>

            <div className={styles.navRight}>
              <div className={styles.categoryFilters} role="group" aria-label="Lọc loại sự kiện">
                {CATEGORY_META.map((cat) => {
                  const active = enabledCategories[cat.key]
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      aria-pressed={active}
                      className={`${styles.catToggle} ${active ? cat.activeClass : ''}`}
                      onClick={() => toggleCategory(cat.key)}
                      data-testid={`calendar-filter-${cat.key}`}
                    >
                      {renderCategoryIcon(cat.key, 12, active ? cat.color : '#8b9cad')}
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className={styles.viewSwitch} role="group" aria-label="Chế độ xem lịch">
                {(['month', 'week', 'day'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={view === mode}
                    className={`${styles.viewBtn} ${view === mode ? styles.viewBtnActive : ''}`}
                    onClick={() => setView(mode)}
                    data-testid={`calendar-view-${mode}`}
                  >
                    {mode === 'month' ? 'Tháng' : mode === 'week' ? 'Tuần' : 'Ngày'}
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className={styles.mobileDrawerTrigger}
                onClick={() => setDayDrawerOpen(true)}
                data-testid="calendar-open-day-drawer"
              >
                <PanelRightOpen size={14} aria-hidden="true" /> Chi tiết ngày
              </Button>
            </div>
          </div>

          {tasksQuery.isLoading && goalsQuery.isLoading ? (
            <LoadingSkeleton height={320} />
          ) : view === 'month' ? (
            <>
              <div className={styles.weekdays} aria-hidden="true">
                {WEEKDAY_HEADERS.map((d, idx) => (
                  <div
                    key={d}
                    className={`${styles.weekday} ${idx >= 5 ? styles.weekdayWeekend : ''}`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div ref={monthGridScrollRef} className={styles.monthGridScroll}>
                <div
                  className={styles.monthWeeksStack}
                  data-testid="calendar-month-grid"
                  data-week-rows={monthGrid.weekRows}
                >
                  {displayRows.map((row, rowIdx) => {
                    if (row.kind === 'gap') {
                      return (
                        <div
                          key={`gap-${rowIdx}`}
                          className={styles.roadGapDivider}
                          data-testid="calendar-road-gap"
                        >
                          ··· Đã lược bớt {row.skippedWeeks} tuần ở giữa (giữ nguyên ngày bắt đầu &
                          kết thúc) ···
                        </div>
                      )
                    }

                    const weekCells = row.cells
                    const weekIdx = row.weekIndex
                    // Draw thin 2.5px route line ONLY when the user has clicked a Quest/Road icon
                    const { segments } = highlightedRoad
                      ? computeWeekRoadSegments([highlightedRoad], weekCells, 1)
                      : { segments: [] }
                    return (
                      <div key={weekCells[0]?.ymd ?? weekIdx} className={styles.weekBlock}>
                        {row.monthBanner && (
                          <div className={styles.roadMonthDivider}>{row.monthBanner}</div>
                        )}
                        {segments.length > 0 && (
                          <div
                            className={styles.thinRoadOverlay}
                            data-testid="calendar-thin-road-line"
                          >
                            {segments.map((seg) => (
                              <div
                                key={`${seg.road.id}:w${weekIdx}`}
                                className={styles.thinRoadSegment}
                                style={{
                                  gridColumn: `${seg.colStart} / span ${seg.colSpan}`
                                }}
                              >
                                <div
                                  className={`${styles.thinRoadTrack} ${
                                    seg.road.kind === 'quest'
                                      ? styles.thinRoadTrackQuest
                                      : styles.thinRoadTrackTask
                                  }`}
                                />
                                {seg.isStart && (
                                  <button
                                    type="button"
                                    className={`${styles.thinRoadNodeBtn} ${styles.thinRoadNodeStart}`}
                                    onClick={() => setActiveRoad(seg.road)}
                                    title={`Bắt đầu: ${seg.road.title}`}
                                    aria-label={`Mở lộ trình ${seg.road.title}`}
                                    data-testid="road-start-node"
                                  >
                                    {seg.road.kind === 'quest' ? (
                                      <Compass size={12} aria-hidden="true" />
                                    ) : (
                                      <CheckSquare size={12} aria-hidden="true" />
                                    )}
                                  </button>
                                )}
                                {seg.isEnd && (
                                  <button
                                    type="button"
                                    className={`${styles.thinRoadNodeBtn} ${styles.thinRoadNodeEnd}`}
                                    onClick={() => setActiveRoad(seg.road)}
                                    title={`Đích đến: ${seg.road.title}`}
                                    aria-label={`Cờ đích ${seg.road.title}`}
                                    data-testid="road-destination-flag"
                                  >
                                    <Flag size={12} aria-hidden="true" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className={styles.monthGrid}>
                          {weekCells.map((cell) => {
                            const cellEvents = eventsByYmd.get(cell.ymd) ?? []
                            const deadlineInfo = dailyDeadlines.get(cell.ymd)
                            const nonHabitEvents = sortCellPreviewEvents(
                              cellEvents.filter((e) => e.category !== 'habit')
                            )
                            const habitCount = cellEvents.filter((e) => e.category === 'habit').length
                            const taskEvents = cellEvents.filter((e) => e.category === 'task')
                            const hasActionableDueTask = Boolean(
                              enabledCategories.task &&
                                deadlineInfo &&
                                deadlineInfo.actionableDue > 0
                            )
                            const allTasksDone =
                              taskEvents.length > 0 &&
                              taskEvents.every((e) => e.urgency === 'completed')
                            const cellMoment =
                              enabledCategories.moment && cell.inCurrentMonth
                                ? getDemoMomentForDate(cell.ymd, todayYmd)
                                : null

                            // Roads anchored on this date (start, end, or Today if currently active)
                            const cellAnchoredRoad =
                              visibleJourneyRoads.find(
                                (r) =>
                                  r.startYmd === cell.ymd ||
                                  r.endYmd === cell.ymd ||
                                  (cell.isToday &&
                                    r.hasValidRange &&
                                    r.startYmd !== null &&
                                    r.endYmd !== null &&
                                    r.startYmd <= cell.ymd &&
                                    r.endYmd >= cell.ymd)
                              ) ?? null

                            const isUrgentDay = hasActionableDueTask
                            const completionRatio =
                              deadlineInfo && deadlineInfo.totalDue > 0
                                ? deadlineInfo.completedDue / deadlineInfo.totalDue
                                : 0
                            const isSafeDay = Boolean(!isUrgentDay && completionRatio >= 0.7)
                            const cellTone = isUrgentDay ? 'urgent' : isSafeDay ? 'safe' : 'normal'

                            const featuredItems = nonHabitEvents.slice(0, 1)

                            const prominentSymbols: {
                              key: string
                              cls: string
                              title: string
                              icon: JSX.Element
                            }[] = []
                            if (cellMoment) {
                              prominentSymbols.push({
                                key: 'moment',
                                cls: styles.symbolMoment,
                                title: cellMoment.caption ?? 'Khoảnh khắc (Ảnh mẫu)',
                                icon: <Camera size={11} aria-hidden="true" />
                              })
                            }
                            if (taskEvents.length > 0) {
                              prominentSymbols.push({
                                key: 'task',
                                cls: allTasksDone ? styles.symbolCompleted : styles.symbolTask,
                                title: `${taskEvents.length} Nhiệm vụ (Task)`,
                                icon: allTasksDone ? (
                                  <CheckCircle2 size={11} aria-hidden="true" />
                                ) : (
                                  <CheckSquare size={11} aria-hidden="true" />
                                )
                              })
                            }
                            if (habitCount > 0) {
                              prominentSymbols.push({
                                key: 'habit',
                                cls: styles.symbolHabit,
                                title: `${habitCount} Thói quen (Habit)`,
                                icon: <PawPrint size={11} aria-hidden="true" />
                              })
                            }

                            const remainingCount = Math.max(
                              0,
                              nonHabitEvents.length - featuredItems.length
                            )

                            const dueBadgeTone =
                              !deadlineInfo || deadlineInfo.totalDue === 0
                                ? null
                                : deadlineInfo.actionableDue > 0
                                  ? styles.dueBadgeOverdue
                                  : isSafeDay
                                    ? styles.dueBadgeDone
                                    : styles.dueBadgeNeutral

                            const ariaSummaryParts = [formatVietnameseFullDate(cell.ymd)]
                            if (deadlineInfo && deadlineInfo.totalDue > 0) {
                              ariaSummaryParts.push(
                                `${deadlineInfo.totalDue} nhiệm vụ đến hạn${
                                  deadlineInfo.overdueDue > 0
                                    ? ` (${deadlineInfo.overdueDue} quá hạn)`
                                    : ''
                                }${
                                  deadlineInfo.completedDue > 0
                                    ? `, ${deadlineInfo.completedDue} đã hoàn thành`
                                    : ''
                                }`
                              )
                            }
                            if (cellEvents.length > 0) {
                              ariaSummaryParts.push(`${cellEvents.length} hoạt động`)
                            }

                            const isOutsideActiveRoad = Boolean(
                              highlightedRoad?.hasValidRange &&
                                highlightedRoad.startYmd &&
                                highlightedRoad.endYmd &&
                                (cell.ymd < highlightedRoad.startYmd ||
                                  cell.ymd > highlightedRoad.endYmd)
                            )

                            return (
                              <div
                                key={cell.ymd}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleSelectCell(cell.ymd)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleSelectCell(cell.ymd)
                                  }
                                }}
                                aria-pressed={cell.ymd === selectedDate}
                                aria-label={ariaSummaryParts.join(', ')}
                                data-date={cell.ymd}
                                data-testid="calendar-day-cell"
                                data-due-count={deadlineInfo?.totalDue ?? 0}
                                data-cell-tone={cellTone}
                                data-outside-road={isOutsideActiveRoad ? '1' : '0'}
                                className={[
                                  styles.dayCell,
                                  !cell.inCurrentMonth && !highlightedRoad ? styles.dayMuted : '',
                                  isOutsideActiveRoad ? styles.dayOutsideRoad : '',
                                  isUrgentDay ? styles.dayCellUrgent : '',
                                  isSafeDay ? styles.dayCellSafe : '',
                                  cell.ymd === selectedDate ? styles.daySelected : ''
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                <div className={styles.dayTopRow}>
                                  <span
                                    className={`${styles.dayNum} ${
                                      cell.isToday ? styles.dayNumToday : ''
                                    }`}
                                  >
                                    {cell.dayOfMonth}
                                  </span>
                                  {enabledCategories.task &&
                                    deadlineInfo &&
                                    deadlineInfo.totalDue > 0 &&
                                    dueBadgeTone && (
                                      <span
                                        className={`${styles.dueBadge} ${dueBadgeTone}`}
                                        data-testid="calendar-due-badge"
                                        title={`${deadlineInfo.totalDue} nhiệm vụ đến hạn (${deadlineInfo.completedDue} hoàn thành, ${deadlineInfo.overdueDue} quá hạn)`}
                                      >
                                        {isSafeDay ? (
                                          <CheckCircle2 size={10} aria-hidden="true" />
                                        ) : (
                                          <Clock size={10} aria-hidden="true" />
                                        )}
                                        <span>{deadlineInfo.totalDue}</span>
                                      </span>
                                    )}
                                </div>

                                {featuredItems.length > 0 ? (
                                  <div className={styles.dayEventsPreview}>
                                    {featuredItems.map((item) => {
                                      const isCompleted = item.urgency === 'completed'
                                      const isDueTask =
                                        item.category === 'task' &&
                                        item.timingKind === 'deadline' &&
                                        !isCompleted
                                      const chipTone = isCompleted
                                        ? styles.pillCompleted
                                        : isDueTask
                                          ? styles.pillOverdue
                                          : item.category === 'quest'
                                            ? styles.pillQuest
                                            : styles.pillTaskNeutral

                                      return (
                                        <button
                                          key={item.id}
                                          type="button"
                                          className={`${styles.cellEventChip} ${chipTone}`}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleSelectEvent(item)
                                          }}
                                          title={`${item.title} — ${item.subtitle}`}
                                          data-testid="calendar-cell-event"
                                          data-urgency={item.urgency}
                                        >
                                          {isCompleted ? (
                                            <CheckCircle2
                                              size={10}
                                              style={{ flexShrink: 0 }}
                                              aria-hidden="true"
                                            />
                                          ) : (
                                            renderCategoryIcon(item.category, 10)
                                          )}
                                          <span className={styles.cellEventChipText}>
                                            {item.title}
                                          </span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                ) : cellMoment ? (
                                  <button
                                    type="button"
                                    className={styles.cellMomentBtn}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openPhotoLightboxForDate(cell.ymd)
                                    }}
                                    aria-label={`Xem ảnh khoảnh khắc ngày ${formatVietnameseFullDate(cell.ymd)}`}
                                    data-testid="calendar-cell-moment-thumb"
                                  >
                                    <img
                                      src={cellMoment.imageUrl}
                                      alt=""
                                      className={styles.cellMomentThumb}
                                      aria-hidden="true"
                                    />
                                  </button>
                                ) : null}

                                <div className={styles.dayFooterRow}>
                                  <span className={styles.daySymbolsRow}>
                                    {cellAnchoredRoad && (
                                      <button
                                        type="button"
                                        className={`${styles.roadIconBtn} ${
                                          highlightedRoad?.id === cellAnchoredRoad.id
                                            ? styles.roadIconBtnActive
                                            : ''
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          // Click once to open thin road & auto-span start->end; click again to turn off
                                          setHighlightedRoad((prev) =>
                                            prev?.id === cellAnchoredRoad.id
                                              ? null
                                              : cellAnchoredRoad
                                          )
                                        }}
                                        aria-label={`Hiện dây lộ trình: ${cellAnchoredRoad.title}`}
                                        title={`Nhấn để hiện dây lộ trình: ${cellAnchoredRoad.title}`}
                                        data-testid="calendar-road-icon"
                                      >
                                        {cellAnchoredRoad.endYmd === cell.ymd ? (
                                          <Flag size={11} aria-hidden="true" />
                                        ) : (
                                          <Compass size={11} aria-hidden="true" />
                                        )}
                                      </button>
                                    )}
                                    {prominentSymbols.map((sym) => (
                                      <span
                                        key={sym.key}
                                        className={`${styles.symbolInline} ${sym.cls}`}
                                        title={sym.title}
                                        aria-hidden="true"
                                      >
                                        {sym.icon}
                                      </span>
                                    ))}
                                  </span>
                                  <span className={styles.dayTypeIcons} aria-hidden="true">
                                    {remainingCount > 0 && (
                                      <span
                                        className={styles.dayDenseCount}
                                        data-testid="calendar-cell-overflow"
                                      >
                                        +{remainingCount}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {highlightedRoad && (
                <div className={styles.activeRoadBar} data-testid="calendar-active-road-bar">
                  <span className={styles.activeRoadBarLeft}>
                    <Compass size={13} style={{ color: '#f26b3a', flexShrink: 0 }} aria-hidden="true" />
                    <span className={styles.activeRoadBarTitle}>
                      Lộ trình: {highlightedRoad.title}
                    </span>
                  </span>
                  <span className={styles.activeRoadBarActions}>
                    <button
                      type="button"
                      className={styles.activeRoadDetailBtn}
                      onClick={() => setActiveRoad(highlightedRoad)}
                      data-testid="calendar-active-road-detail"
                    >
                      Chi tiết lộ trình ›
                    </button>
                    <button
                      type="button"
                      className={styles.activeRoadCloseBtn}
                      onClick={() => setHighlightedRoad(null)}
                      aria-label="Ẩn dây lộ trình"
                    >
                      Ẩn
                    </button>
                  </span>
                </div>
              )}
            </>
          ) : view === 'week' ? (
            <div className={styles.weekGrid} data-testid="calendar-week-grid">
              {weekCells.map((cell, idx) => {
                const cellEvents = eventsByYmd.get(cell.ymd) ?? []
                return (
                  <div
                    key={cell.ymd}
                    className={`${styles.weekCol} ${
                      cell.ymd === selectedDate ? styles.weekColSelected : ''
                    }`}
                  >
                    <button
                      type="button"
                      className={styles.weekColHead}
                      onClick={() => handleSelectCell(cell.ymd)}
                    >
                      <span className={styles.weekday}>{WEEKDAY_HEADERS[idx]}</span>
                      <span
                        className={`${styles.dayNum} ${cell.isToday ? styles.dayNumToday : ''}`}
                      >
                        {cell.dayOfMonth}
                      </span>
                    </button>
                    <div className={styles.weekColList}>
                      {cellEvents.length === 0 ? (
                        <span className={styles.emptyInline} style={{ fontSize: 11 }}>
                          Trống
                        </span>
                      ) : (
                        cellEvents.map((ev) => (
                          <button
                            key={ev.id}
                            type="button"
                            className={`${styles.cellEventChip} ${
                              ev.urgency === 'overdue'
                                ? styles.pillOverdue
                                : ev.category === 'quest'
                                  ? styles.pillQuest
                                  : ev.category === 'habit'
                                    ? styles.pillHabit
                                    : styles.pillTask
                            }`}
                            style={{ border: 'none', textAlign: 'left', cursor: 'pointer', padding: '4px 6px' }}
                            onClick={() => handleSelectEvent(ev)}
                          >
                            {renderCategoryIcon(ev.category, 10)}
                            <span className={styles.cellEventChipText}>
                              {ev.timeLabel ? `${ev.timeLabel} · ` : ''}
                              {ev.title}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <CalendarDayTimeline
              selectedDate={selectedDate}
              dayEvents={selectedDayEvents}
              tasks={tasks}
              roads={journeyRoads}
              dayMoment={
                enabledCategories.moment ? getDemoMomentForDate(selectedDate, todayYmd) : null
              }
              onSelectEvent={handleSelectEvent}
              onOpenRoad={(road) => setActiveRoad(road)}
              onOpenLightbox={() => openPhotoLightboxForDate(selectedDate)}
            />
          )}
        </section>

        {/* Inline Claude-Style Daily Agenda Panel when center workspace width >= 920px */}
        <aside className={styles.sidePanel} aria-label="Lịch trình ngày đã chọn">
          <CalendarDailyAgendaPanel
            selectedDate={selectedDate}
            events={selectedDayEvents}
            upcomingDeadlines={upcomingDeadlines}
            monthSummary={monthSummary}
            featuredMoment={selectedDayMoments[0] ?? null}
            momentCount={selectedDayMoments.length}
            showMomentSection={enabledCategories.moment}
            onSelectEvent={handleSelectEvent}
            onOpenDayView={() => setView('day')}
            onQuickCreate={() => openSheet('quick-create')}
            onOpenMomentLightbox={() => openPhotoLightboxForDate(selectedDate)}
          />
        </aside>
      </div>

      {/* Accessible Overlay Sheet when center workspace width < 920px (e.g. 1024px or expanded left rail) */}
      <Sheet
        open={dayDrawerOpen}
        title={formatVietnameseFullDate(selectedDate)}
        onClose={() => setDayDrawerOpen(false)}
      >
        <CalendarDailyAgendaPanel
          selectedDate={selectedDate}
          events={selectedDayEvents}
          upcomingDeadlines={upcomingDeadlines}
          monthSummary={monthSummary}
          featuredMoment={selectedDayMoments[0] ?? null}
          momentCount={selectedDayMoments.length}
          showMomentSection={enabledCategories.moment}
          inSheet
          onSelectEvent={handleSelectEvent}
          onOpenDayView={() => {
            setDayDrawerOpen(false)
            setView('day')
          }}
          onQuickCreate={() => {
            setDayDrawerOpen(false)
            openSheet('quick-create')
          }}
          onOpenMomentLightbox={() => openPhotoLightboxForDate(selectedDate)}
        />
      </Sheet>

      {/* FE-05B Interactive Journey Road Overlay (Quest -> Epic -> Task & Long Tasks) */}
      <JourneyRoadOverlay
        road={activeRoad}
        onClose={() => setActiveRoad(null)}
        onNavigate={(route) => navigate(route)}
      />

      {/* FE-05B Shared Photo / Evidence Lightbox */}
      {lightboxState && (
        <SocialMediaLightbox
          items={lightboxState.items}
          activeIndex={lightboxState.activeIndex}
          onSelectIndex={(nextIndex) =>
            setLightboxState((prev) => (prev ? { ...prev, activeIndex: nextIndex } : null))
          }
          onClose={() => setLightboxState(null)}
          onNavigate={(route) => navigate(route)}
        />
      )}
    </div>
  )
}
