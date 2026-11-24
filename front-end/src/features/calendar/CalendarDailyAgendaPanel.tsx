import { useMemo } from 'react'
import {
  Camera,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Compass,
  PawPrint,
  Plus
} from 'lucide-react'
import { getTodayLocalDate, parseLocalDate } from '@/utils/date'
import {
  formatVietnameseFullDate,
  type CalendarEventItem,
  type MonthSummaryCounts
} from './calendarUtils'
import styles from './CalendarDailyAgendaPanel.module.css'

export interface SelectedDateMoment {
  imageUrl: string
  caption?: string
}

interface CalendarDailyAgendaPanelProps {
  selectedDate: string
  events: CalendarEventItem[]
  upcomingDeadlines: CalendarEventItem[]
  monthSummary: MonthSummaryCounts
  featuredMoment?: SelectedDateMoment | null
  momentCount?: number
  showMomentSection?: boolean
  inSheet?: boolean
  onSelectEvent: (event: CalendarEventItem) => void
  onOpenDayView?: () => void
  onQuickCreate?: () => void
  onOpenMomentLightbox?: () => void
}

const VI_WEEKDAYS = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy'
] as const

function extractClockKey(ev: CalendarEventItem): string {
  if (ev.timeLabel && /^\d{2}:\d{2}$/.test(ev.timeLabel)) return ev.timeLabel
  const match = ev.subtitle.match(/\b(\d{2}:\d{2})\b/)
  return match ? match[1] : '99:99'
}

function displayClockLabel(ev: CalendarEventItem): string {
  const key = extractClockKey(ev)
  return key === '99:99' ? '—' : key
}

function sortEventsChronologically(events: CalendarEventItem[]): CalendarEventItem[] {
  return [...events].sort((a, b) => {
    const aTime = extractClockKey(a)
    const bTime = extractClockKey(b)
    if (aTime !== bTime) return aTime.localeCompare(bTime)
    if (a.isPreview !== b.isPreview) return a.isPreview ? 1 : -1
    return a.title.localeCompare(b.title, 'vi')
  })
}

export function CalendarDailyAgendaPanel({
  selectedDate,
  events,
  upcomingDeadlines,
  monthSummary,
  featuredMoment = null,
  momentCount = 0,
  showMomentSection = true,
  inSheet = false,
  onSelectEvent,
  onOpenDayView,
  onQuickCreate,
  onOpenMomentLightbox
}: CalendarDailyAgendaPanelProps) {
  const sortedEvents = useMemo(() => sortEventsChronologically(events), [events])
  const dueTaskCount = useMemo(
    () =>
      sortedEvents.filter(
        (e) => e.category === 'task' && e.timingKind === 'deadline' && e.urgency !== 'completed'
      ).length,
    [sortedEvents]
  )
  const habitCount = useMemo(
    () => sortedEvents.filter((e) => e.category === 'habit').length,
    [sortedEvents]
  )
  const questCount = useMemo(
    () => sortedEvents.filter((e) => e.category === 'quest').length,
    [sortedEvents]
  )

  const parsedDate = parseLocalDate(selectedDate)
  const isToday = selectedDate === getTodayLocalDate()
  const dayHeadline = `${parsedDate.getDate()} tháng ${parsedDate.getMonth() + 1}, ${parsedDate.getFullYear()}`
  const weekdayLabel = `${VI_WEEKDAYS[parsedDate.getDay()]}${isToday ? ' · Hôm nay' : ''}`

  // Avoid duplicate deadline listings already displayed in the selected-day list
  const distinctUpcomingDeadlines = useMemo(() => {
    const selectedRoutes = new Set(sortedEvents.map((e) => `${e.route}|${e.ymd}`))
    return upcomingDeadlines.filter((up) => !selectedRoutes.has(`${up.route}|${up.ymd}`))
  }, [sortedEvents, upcomingDeadlines])

  const renderEventIcon = (ev: CalendarEventItem, size = 14) => {
    if (ev.urgency === 'completed') {
      return <CheckCircle2 size={size} style={{ color: '#16a34a' }} aria-hidden="true" />
    }
    if (ev.category === 'task') {
      const isDueTask = ev.timingKind === 'deadline'
      const color = isDueTask ? '#dc2626' : '#3b82f6'
      return <CheckSquare size={size} style={{ color }} aria-hidden="true" />
    }
    if (ev.category === 'habit') {
      return <PawPrint size={size} style={{ color: '#168c78' }} aria-hidden="true" />
    }
    if (ev.category === 'quest') {
      return <Compass size={size} style={{ color: '#d97706' }} aria-hidden="true" />
    }
    return <Camera size={size} style={{ color: '#6f5ce0' }} aria-hidden="true" />
  }

  return (
    <div
      className={`${styles.stack} ${inSheet ? styles.stackSheet : ''}`}
      data-testid="calendar-daily-agenda-panel"
    >
      {/* Top Card: Spacious Selected-Day Info matching Claude reference */}
      <section className={`${styles.card} ${styles.dayInfoCard}`} aria-label="Thông tin ngày đang chọn">
        {/* A. Featured Moment (verified image only; compact neutral strip otherwise) */}
        {showMomentSection &&
          (featuredMoment?.imageUrl ? (
            <button
              type="button"
              className={styles.momentMediaWrap}
              style={{ width: '100%', padding: 0, cursor: 'pointer', textAlign: 'left' }}
              onClick={onOpenMomentLightbox}
              aria-label={`Mở ảnh khoảnh khắc: ${featuredMoment.caption ?? formatVietnameseFullDate(selectedDate)}`}
              data-testid="calendar-featured-moment"
            >
              <img
                src={featuredMoment.imageUrl}
                alt={featuredMoment.caption ?? `Khoảnh khắc ngày ${formatVietnameseFullDate(selectedDate)}`}
                className={styles.momentImg}
              />
              {featuredMoment.caption && (
                <span className={styles.momentCaption}>{featuredMoment.caption}</span>
              )}
              {momentCount > 0 && (
                <span className={styles.momentCountBadge} data-testid="calendar-moment-count">
                  {momentCount > 1 ? `${momentCount} ảnh` : '1 ảnh'}
                </span>
              )}
            </button>
          ) : (
            <div className={styles.momentEmptyStrip} data-testid="calendar-moment-empty">
              <Camera size={14} style={{ color: '#6f5ce0', flexShrink: 0 }} aria-hidden="true" />
              <span>Chưa có ảnh khoảnh khắc — chờ Backend Media API.</span>
            </div>
          ))}

        {/* B. Spacious Date Header */}
        {!inSheet && (
          <header className={styles.dateHeader}>
            <h2 className={styles.dateHeading} data-testid="calendar-selected-date-heading">
              {dayHeadline}
            </h2>
            <p className={styles.dateSubline}>{weekdayLabel}</p>
          </header>
        )}

        {/* C. Compact summary inline (full chronological timeline opens in Day view or Sheet drawer) */}
        {inSheet ? (
          <div
            className={styles.timelineList}
            role="region"
            aria-label="Hoạt động trong ngày theo thứ tự thời gian"
            data-testid="calendar-selected-day-list"
          >
            {sortedEvents.length === 0 ? (
              <div className={styles.emptyState} data-testid="calendar-day-empty-state">
                Không có hoạt động nào trong ngày {dayHeadline}.
              </div>
            ) : (
              sortedEvents.map((ev) => {
                const isDone = ev.urgency === 'completed'
                const isDueTask = ev.category === 'task' && ev.timingKind === 'deadline' && !isDone
                return (
                  <button
                    key={ev.id}
                    type="button"
                    className={`${styles.timelineRow} ${isDueTask ? styles.timelineRowUrgent : ''}`}
                    onClick={() => onSelectEvent(ev)}
                    title={`${ev.title} — ${ev.subtitle}`}
                    data-testid="calendar-event-item"
                    data-category={ev.category}
                    data-urgency={ev.urgency}
                  >
                    <span
                      className={`${styles.timelineTime} ${isDueTask ? styles.timelineTimeUrgent : ''}`}
                    >
                      {displayClockLabel(ev)}
                    </span>
                    <span className={styles.timelineIconWrap}>{renderEventIcon(ev, 14)}</span>
                    <span className={styles.timelineMain}>
                      <span
                        className={`${styles.timelineTitle} ${
                          isDone
                            ? styles.timelineTitleDone
                            : isDueTask
                              ? styles.timelineTitleUrgent
                              : ''
                        }`}
                      >
                        {ev.title}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        ) : (
          <div className={styles.daySummaryLine} data-testid="calendar-selected-day-list">
            {sortedEvents.length === 0 ? (
              <span data-testid="calendar-day-empty-state">Không có hoạt động nào trong ngày</span>
            ) : (
              <>
                {dueTaskCount > 0 && (
                  <span className={styles.daySummaryDue}>{dueTaskCount} Task đến hạn</span>
                )}
                {questCount > 0 && <span>{questCount} Quest</span>}
                {habitCount > 0 && <span>{habitCount} Thói quen</span>}
              </>
            )}
          </div>
        )}

        {/* Action Buttons Row ("Xem hành trình ngày này >" + "+ Tạo") */}
        <div className={styles.actionsRow}>
          {onOpenDayView && (
            <button
              type="button"
              className={styles.primaryActionBtn}
              onClick={onOpenDayView}
              data-testid="calendar-open-day-view-btn"
            >
              <span>Xem hành trình ngày này</span>
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          )}
          {onQuickCreate && (
            <button
              type="button"
              className={styles.secondaryActionBtn}
              onClick={onQuickCreate}
              data-testid="calendar-quick-create-btn"
            >
              <Plus size={14} aria-hidden="true" />
              <span>Tạo</span>
            </button>
          )}
        </div>
      </section>

      {/* Bottom Card: Deadline gần nhất */}
      <section
        className={`${styles.card} ${styles.deadlinesCard}`}
        aria-label="Deadline gần nhất"
        data-testid="calendar-upcoming-deadlines"
      >
        <div className={styles.deadlinesHead}>
          <h3 className={styles.deadlinesTitle}>Deadline gần nhất</h3>
        </div>

        <div className={styles.deadlinesList}>
          {distinctUpcomingDeadlines.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: '10px 12px' }}>
              {upcomingDeadlines.length > 0
                ? 'Các hạn chót gần nhất đã hiển thị trong ngày đang chọn.'
                : 'Không có hạn chót khẩn cấp nào sắp tới.'}
            </div>
          ) : (
            distinctUpcomingDeadlines.map((ev) => {
              const isUrgent = ev.urgency === 'overdue' || ev.urgency === 'due_soon'
              const isQuest = ev.category === 'quest'
              return (
                <button
                  key={ev.id}
                  type="button"
                  className={`${styles.deadlineRow} ${
                    isUrgent
                      ? styles.deadlineRowUrgent
                      : isQuest
                        ? styles.deadlineRowQuest
                        : ''
                  }`}
                  onClick={() => onSelectEvent(ev)}
                  data-testid="calendar-event-item"
                  data-category={ev.category}
                  data-urgency={ev.urgency}
                >
                  <span className={styles.timelineIconWrap}>{renderEventIcon(ev, 15)}</span>
                  <span className={styles.deadlineMain}>
                    <span className={styles.deadlineName}>{ev.title}</span>
                    <span
                      className={`${styles.deadlineMeta} ${
                        isUrgent ? styles.deadlineMetaUrgent : ''
                      }`}
                    >
                      {ev.subtitle}
                    </span>
                  </span>
                  <span
                    className={`${styles.deadlineKindTag} ${
                      isUrgent
                        ? styles.kindUrgent
                        : isQuest
                          ? styles.kindQuest
                          : styles.kindTask
                    }`}
                  >
                    {isQuest ? 'Quest' : 'Task'}
                  </span>
                </button>
              )
            })
          )}
        </div>

        <footer
          className={styles.summaryFooter}
          aria-label="Tóm tắt tháng"
          data-testid="calendar-month-summary"
        >
          <span className={styles.summaryStat}>
            <CheckSquare size={12} style={{ color: '#f26b3a' }} aria-hidden="true" />
            {monthSummary.tasks} Task
          </span>
          <span className={styles.summaryStat}>
            <PawPrint size={12} style={{ color: '#168c78' }} aria-hidden="true" />
            {monthSummary.habits} Habit (mẫu)
          </span>
          <span className={styles.summaryStat}>
            <Compass size={12} style={{ color: '#d99b1e' }} aria-hidden="true" />
            {monthSummary.quests} Quest
          </span>
          <span className={styles.summaryStat} title="Đang chờ Backend Media API">
            <Camera size={12} style={{ color: '#6f5ce0' }} aria-hidden="true" />
            Moment: —
          </span>
        </footer>
      </section>
    </div>
  )
}
