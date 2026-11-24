import type { Quest } from '@/types/domain'
import type { CalendarEventItem } from './calendarUtils'

export interface TimedTimelineBlock {
  event: CalendarEventItem
  startMin: number
  endMin: number
  durationMin: number
  /** Side-by-side column index within overlapping cluster */
  columnIndex: number
  /** Total columns in overlapping cluster */
  columnCount: number
}

export interface DeadlineTimelineMarker {
  event: CalendarEventItem
  minuteOfDay: number
}

export interface DayTimelineLayout {
  allDayEvents: CalendarEventItem[]
  timedBlocks: TimedTimelineBlock[]
  deadlineMarkers: DeadlineTimelineMarker[]
  hasEarlyOrLateEvents: boolean
}

function parseClockMinutes(clock: string | null | undefined): number | null {
  if (!clock) return null
  const m = clock.match(/\b(\d{1,2}):(\d{2})\b/)
  if (!m) return null
  const hh = Number(m[1])
  const mm = Number(m[2])
  if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null
  return hh * 60 + mm
}

export function formatMinutesAs24h(totalMin: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, totalMin))
  const hh = Math.floor(clamped / 60)
  const mm = clamped % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/**
 * Pure time-based Day View layout engine (FE-05B).
 * - Separates untimed/all-day items, point-in-time deadline markers, and timed duration blocks.
 * - Uses verified Task `startAt` + `estimatedDurationSeconds` (or `dueAt - startAt`) for duration blocks.
 * - Packs overlapping intervals side-by-side so no event is ever hidden behind another.
 */
export function layoutDayTimelineEvents(input: {
  dayEvents: CalendarEventItem[]
  tasksById: Map<string, Quest>
  defaultRangeStartMin?: number
  defaultRangeEndMin?: number
}): DayTimelineLayout {
  const {
    dayEvents,
    tasksById,
    defaultRangeStartMin = 6 * 60,
    defaultRangeEndMin = 22 * 60
  } = input

  const allDayEvents: CalendarEventItem[] = []
  const deadlineMarkers: DeadlineTimelineMarker[] = []
  const rawTimed: Omit<TimedTimelineBlock, 'columnIndex' | 'columnCount'>[] = []

  for (const ev of dayEvents) {
    // 1. Deadlines render as point-in-time markers (NEVER duration blocks!)
    if (ev.timingKind === 'deadline') {
      const dueMin = parseClockMinutes(ev.timeLabel)
      if (dueMin !== null) {
        deadlineMarkers.push({ event: ev, minuteOfDay: dueMin })
      } else {
        allDayEvents.push(ev)
      }

      // If this Task ALSO has a verified startAt on this SAME date, also render its duration block!
      if (ev.category === 'task') {
        const taskId = ev.id.replace(/^task-due:/, '')
        const task = tasksById.get(taskId)
        if (task?.startAt) {
          const startDate = new Date(task.startAt)
          if (!Number.isNaN(startDate.getTime())) {
            const startYmd = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(
              2,
              '0'
            )}-${String(startDate.getDate()).padStart(2, '0')}`
            if (startYmd === ev.ymd) {
              const startMin = startDate.getHours() * 60 + startDate.getMinutes()
              const verifiedDurMin = task.estimatedDurationSeconds
                ? Math.max(15, Math.round(task.estimatedDurationSeconds / 60))
                : dueMin !== null && dueMin > startMin
                  ? Math.min(240, dueMin - startMin)
                  : 30
              const endMin = Math.min(24 * 60, startMin + verifiedDurMin)
              rawTimed.push({
                event: {
                  ...ev,
                  id: `day-block:${task.id}`,
                  timingKind: 'start',
                  timeLabel: formatMinutesAs24h(startMin),
                  subtitle: `${formatMinutesAs24h(startMin)} – ${formatMinutesAs24h(endMin)}`
                },
                startMin,
                endMin,
                durationMin: endMin - startMin
              })
            }
          }
        }
      }
      continue
    }

    // 2. Start-time Tasks or timed Habits -> duration block
    const clockMin = parseClockMinutes(ev.timeLabel ?? ev.subtitle)
    if (clockMin === null) {
      allDayEvents.push(ev)
      continue
    }

    let durationMin = 30
    if (ev.category === 'task') {
      const taskId = ev.id.replace(/^task-(start|due):/, '')
      const task = tasksById.get(taskId)
      if (task?.estimatedDurationSeconds) {
        durationMin = Math.max(15, Math.round(task.estimatedDurationSeconds / 60))
      }
    }

    const endMin = Math.min(24 * 60, clockMin + durationMin)
    rawTimed.push({
      event: {
        ...ev,
        timeLabel: formatMinutesAs24h(clockMin)
      },
      startMin: clockMin,
      endMin,
      durationMin: endMin - clockMin
    })
  }

  // Sort timed blocks chronologically (earliest start, then longest duration)
  rawTimed.sort((a, b) => a.startMin - b.startMin || b.durationMin - a.durationMin)

  // Connected-component overlap clustering -> side-by-side column assignment
  const timedBlocks: TimedTimelineBlock[] = []
  let cluster: Omit<TimedTimelineBlock, 'columnIndex' | 'columnCount'>[] = []
  let clusterEnd = -1

  const flushCluster = () => {
    if (cluster.length === 0) return
    const colEnds: number[] = []
    const placed: { item: (typeof cluster)[number]; col: number }[] = []

    for (const item of cluster) {
      let col = colEnds.findIndex((end) => end <= item.startMin)
      if (col === -1) {
        col = colEnds.length
        colEnds.push(item.endMin)
      } else {
        colEnds[col] = item.endMin
      }
      placed.push({ item, col })
    }

    const totalCols = Math.max(1, colEnds.length)
    for (const p of placed) {
      timedBlocks.push({
        ...p.item,
        columnIndex: p.col,
        columnCount: totalCols
      })
    }
    cluster = []
    clusterEnd = -1
  }

  for (const item of rawTimed) {
    if (cluster.length === 0) {
      cluster.push(item)
      clusterEnd = item.endMin
    } else if (item.startMin < clusterEnd) {
      cluster.push(item)
      clusterEnd = Math.max(clusterEnd, item.endMin)
    } else {
      flushCluster()
      cluster.push(item)
      clusterEnd = item.endMin
    }
  }
  flushCluster()

  deadlineMarkers.sort((a, b) => a.minuteOfDay - b.minuteOfDay)

  const hasEarlyOrLateEvents =
    timedBlocks.some((b) => b.startMin < defaultRangeStartMin || b.endMin > defaultRangeEndMin) ||
    deadlineMarkers.some((m) => m.minuteOfDay < defaultRangeStartMin || m.minuteOfDay > defaultRangeEndMin)

  return {
    allDayEvents,
    timedBlocks,
    deadlineMarkers,
    hasEarlyOrLateEvents
  }
}
