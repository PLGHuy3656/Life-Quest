import { useMemo } from 'react'
import { Camera, CheckCircle2, CheckSquare, Compass, Flag, PawPrint } from 'lucide-react'
import type { Quest } from '@/types/domain'
import type { SelectedDateMoment } from './CalendarDailyAgendaPanel'
import type { CalendarJourneyRoad } from './calendarRoadUtils'
import type { CalendarEventItem } from './calendarUtils'
import { formatMinutesAs24h, layoutDayTimelineEvents } from './dayTimelineUtils'
import styles from './CalendarDayTimeline.module.css'

interface CalendarDayTimelineProps {
  selectedDate: string
  dayEvents: CalendarEventItem[]
  tasks: Quest[]
  roads: CalendarJourneyRoad[]
  dayMoment: SelectedDateMoment | null
  onSelectEvent: (event: CalendarEventItem) => void
  onOpenRoad: (road: CalendarJourneyRoad) => void
  onOpenLightbox: () => void
}

interface ActiveTimeSlot {
  key: string
  sortMin: number
  timeLabel: string
  slotKind: 'untimed' | 'deadline' | 'habit' | 'task' | 'quest' | 'completed'
  items: {
    id: string
    event: CalendarEventItem
    isDeadline: boolean
    isAllDay: boolean
    intervalLabel: string | null
  }[]
}

/**
 * FE-05B Compact Vertical Day Timeline (only shows time slots that actually have activities/deadlines).
 * Matches the clean vertical rail reference:
 * - Untimed/All-day items at top (`—` with orange ring)
 * - Chronological timed activities & point-in-time deadline markers (no empty blank hours)
 * - Overlapping events at the same time slot render side-by-side
 */
export function CalendarDayTimeline({
  dayEvents,
  tasks,
  roads,
  dayMoment,
  onSelectEvent,
  onOpenRoad,
  onOpenLightbox
}: CalendarDayTimelineProps) {
  const tasksById = useMemo(() => {
    const m = new Map<string, Quest>()
    for (const t of tasks) m.set(t.id, t)
    return m
  }, [tasks])

  const layout = useMemo(
    () => layoutDayTimelineEvents({ dayEvents, tasksById }),
    [dayEvents, tasksById]
  )

  const activeSlots = useMemo<ActiveTimeSlot[]>(() => {
    const slotMap = new Map<string, ActiveTimeSlot>()

    const upsertSlot = (
      key: string,
      sortMin: number,
      timeLabel: string,
      slotKind: ActiveTimeSlot['slotKind'],
      item: ActiveTimeSlot['items'][number]
    ) => {
      const existing = slotMap.get(key)
      if (existing) {
        existing.items.push(item)
        if (slotKind === 'deadline') existing.slotKind = 'deadline'
      } else {
        slotMap.set(key, { key, sortMin, timeLabel, slotKind, items: [item] })
      }
    }

    // 1. Untimed / All-day items (`—`)
    for (const ev of layout.allDayEvents) {
      upsertSlot('untimed', -1, '—', 'untimed', {
        id: ev.id,
        event: ev,
        isDeadline: false,
        isAllDay: true,
        intervalLabel: 'Cả ngày'
      })
    }

    // 2. Timed duration blocks
    for (const block of layout.timedBlocks) {
      const label = formatMinutesAs24h(block.startMin)
      const isDone = block.event.urgency === 'completed'
      const kind: ActiveTimeSlot['slotKind'] = isDone
        ? 'completed'
        : block.event.category === 'habit'
          ? 'habit'
          : block.event.category === 'quest'
            ? 'quest'
            : 'task'
      upsertSlot(`t:${block.startMin}`, block.startMin, label, kind, {
        id: block.event.id,
        event: block.event,
        isDeadline: false,
        isAllDay: false,
        intervalLabel: `${formatMinutesAs24h(block.startMin)} – ${formatMinutesAs24h(block.endMin)}`
      })
    }

    // 3. Point-in-time deadline markers
    for (const marker of layout.deadlineMarkers) {
      const label = formatMinutesAs24h(marker.minuteOfDay)
      const isDone = marker.event.urgency === 'completed'
      upsertSlot(
        `d:${marker.minuteOfDay}`,
        marker.minuteOfDay,
        label,
        isDone ? 'completed' : 'deadline',
        {
          id: marker.event.id,
          event: marker.event,
          isDeadline: true,
          isAllDay: false,
          intervalLabel: isDone ? 'Đã hoàn thành' : `Hạn chót · ${label}`
        }
      )
    }

    return Array.from(slotMap.values()).sort((a, b) => a.sortMin - b.sortMin)
  }, [layout])

  const findRoadForEvent = (ev: CalendarEventItem): CalendarJourneyRoad | undefined => {
    const rawId = ev.id.replace(/^(task-due|task-start|day-block|quest-due):/, '')
    return roads.find((r) => r.sourceId === rawId)
  }

  return (
    <div className={styles.container} data-testid="calendar-day-agenda">
      <div className={styles.topStrip}>
        <span className={styles.summaryText}>
          {activeSlots.length > 0
            ? `${activeSlots.length} mốc thời gian có hoạt động`
            : 'Chưa có hoạt động nào trong ngày'}
        </span>

        {dayMoment && (
          <button
            type="button"
            className={styles.photoStripBtn}
            onClick={onOpenLightbox}
            data-testid="day-timeline-photo-btn"
          >
            <img src={dayMoment.imageUrl} alt="" className={styles.photoStripThumb} aria-hidden="true" />
            <Camera size={12} aria-hidden="true" />
            <span>Xem ảnh khoảnh khắc</span>
          </button>
        )}
      </div>

      <div
        className={styles.scrollArea}
        role="region"
        aria-label="Lịch trình các mốc có hoạt động trong ngày"
        data-testid="day-timeline-grid"
      >
        {activeSlots.length === 0 ? (
          <div className={styles.emptyDay}>
            Không có nhiệm vụ, thói quen hay hạn chót nào trong ngày này.
          </div>
        ) : (
          <div className={styles.timelineList}>
            {activeSlots.map((slot) => {
              const timeClass =
                slot.slotKind === 'deadline'
                  ? styles.timeDeadline
                  : slot.slotKind === 'habit' || slot.slotKind === 'completed'
                    ? styles.timeHabit
                    : slot.slotKind === 'quest'
                      ? styles.timeQuest
                      : slot.slotKind === 'untimed'
                        ? styles.timeUntimed
                        : styles.timeTask

              const nodeClass =
                slot.slotKind === 'deadline'
                  ? styles.nodeDeadline
                  : slot.slotKind === 'habit'
                    ? styles.nodeHabit
                    : slot.slotKind === 'completed'
                      ? styles.nodeCompleted
                      : slot.slotKind === 'quest'
                        ? styles.nodeQuest
                        : slot.slotKind === 'untimed'
                          ? styles.nodeUntimed
                          : styles.nodeTask

              return (
                <div key={slot.key} className={styles.slotRow}>
                  <span className={`${styles.timeCol} ${timeClass}`}>{slot.timeLabel}</span>
                  <span className={styles.nodeCol} aria-hidden="true">
                    <span className={`${styles.nodeDot} ${nodeClass}`} />
                  </span>
                  <div className={styles.cardsGrid}>
                    {slot.items.map((item) => {
                      const ev = item.event
                      const isDone = ev.urgency === 'completed'
                      const isDeadline = item.isDeadline && !isDone
                      const linkedRoad = findRoadForEvent(ev)

                      const cardClass = isDone
                        ? styles.cardCompleted
                        : isDeadline
                          ? styles.cardDeadline
                          : ev.category === 'habit'
                            ? styles.cardHabit
                            : ''

                      const iconBoxClass = isDone
                        ? styles.iconBoxDone
                        : isDeadline
                          ? styles.iconBoxDeadline
                          : ev.category === 'habit'
                            ? styles.iconBoxHabit
                            : ev.category === 'quest'
                              ? styles.iconBoxQuest
                              : styles.iconBoxTask

                      const tagClass = isDeadline
                        ? styles.tagDeadline
                        : ev.category === 'habit'
                          ? styles.tagHabit
                          : ev.category === 'quest'
                            ? styles.tagQuest
                            : styles.tagTask

                      const tagText = isDeadline
                        ? 'Đến hạn'
                        : ev.category === 'habit'
                          ? 'Habit'
                          : ev.category === 'quest'
                            ? 'Quest'
                            : 'Task'

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`${styles.eventCard} ${cardClass}`.trim()}
                          onClick={() => (linkedRoad ? onOpenRoad(linkedRoad) : onSelectEvent(ev))}
                          data-testid={
                            item.isDeadline
                              ? 'day-deadline-marker'
                              : item.isAllDay
                                ? 'day-allday-item'
                                : 'day-timed-block'
                          }
                        >
                          <span className={styles.cardLeft}>
                            <span className={`${styles.cardIconBox} ${iconBoxClass}`} aria-hidden="true">
                              {isDone ? (
                                <CheckCircle2 size={15} />
                              ) : isDeadline ? (
                                <Flag size={14} />
                              ) : ev.category === 'habit' ? (
                                <PawPrint size={15} />
                              ) : ev.category === 'quest' ? (
                                <Compass size={15} />
                              ) : (
                                <CheckSquare size={15} />
                              )}
                            </span>
                            <span className={styles.cardMain}>
                              <span
                                className={`${styles.cardTitle} ${
                                  isDone
                                    ? styles.cardTitleDone
                                    : isDeadline
                                      ? styles.cardTitleDeadline
                                      : ''
                                }`}
                              >
                                {ev.title}
                              </span>
                              <span
                                className={`${styles.cardMeta} ${
                                  isDeadline ? styles.cardMetaDeadline : ''
                                }`}
                              >
                                {item.intervalLabel ?? ev.subtitle}
                              </span>
                            </span>
                          </span>
                          <span className={`${styles.cardTag} ${tagClass}`}>{tagText}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
