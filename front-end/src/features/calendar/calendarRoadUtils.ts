import type { Goal, Milestone, Quest } from '@/types/domain'
import { formatLocalDate, parseLocalDate, type CalendarCell } from '@/utils/date'
import { classifyTaskTimeState } from '@/features/work/taskUtils'

export interface JourneyRoadCheckpoint {
  id: string
  position: number
  title: string
  status: 'completed' | 'active' | 'future'
  completedTasks: number
  totalTasks: number
}

export interface CalendarJourneyRoad {
  id: string
  sourceId: string
  kind: 'quest' | 'task'
  title: string
  startYmd: string | null
  endYmd: string | null
  hasValidRange: boolean
  durationDays: number | null
  elapsedDays: number | null
  remainingDays: number | null
  /** Elapsed calendar time / total duration (0..100). Never confused with workProgressPct. */
  timeProgressPct: number | null
  /** Verified completed Tasks / eligible Tasks (0..100). Null when 0 eligible tasks. */
  workProgressPct: number | null
  completedTaskCount: number
  totalTaskCount: number
  status: 'completed' | 'overdue' | 'active' | 'unscheduled'
  route: string
  checkpoints: JourneyRoadCheckpoint[]
  nextActionableTask: {
    id: string
    title: string
    dueLabel: string | null
    route: string
  } | null
  isPreview: boolean
}

export interface WeekRoadSegment {
  road: CalendarJourneyRoad
  /** 1-based CSS grid column start (1..7) */
  colStart: number
  /** Number of columns spanned in this week row (1..7) */
  colSpan: number
  /** 0-based vertical lane index (0..maxLanes-1) */
  lane: number
  isStart: boolean
  isEnd: boolean
  continuesLeft: boolean
  continuesRight: boolean
}

const MS_PER_DAY = 86_400_000

function isoToLocalYmd(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return formatLocalDate(d)
}

function daysBetweenYmd(startYmd: string, endYmd: string): number {
  const a = parseLocalDate(startYmd)
  const b = parseLocalDate(endYmd)
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcB - utcA) / MS_PER_DAY)
}

function formatShortViDate(ymd: string): string {
  const d = parseLocalDate(ymd)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Derives interactive Journey Roads for:
 * 1. Quests (Backend Goal -> UI Quest, Milestone -> UI Epic, Quest -> UI Task)
 * 2. Multi-day atomic Tasks (startAt + dueAt spanning >= 2 local dates; NEVER creates fake Epics)
 */
export function deriveCalendarJourneyRoads(input: {
  tasks: Quest[]
  goals: Goal[]
  milestonesByGoal: Record<string, Milestone[]>
  isLiveAuth: boolean
  nowMs?: number
}): CalendarJourneyRoad[] {
  const { tasks, goals, milestonesByGoal, isLiveAuth, nowMs = Date.now() } = input
  const todayYmd = formatLocalDate(new Date(nowMs))
  const activeTasks = tasks.filter((t) => !t.deletedAt && t.status !== 'ARCHIVED')
  const roads: CalendarJourneyRoad[] = []

  // 1. UI Quests (Backend Goals) with real Epic (Milestone) checkpoints
  for (const goal of goals) {
    if (goal.status === 'ARCHIVED') continue
    const startYmd = isoToLocalYmd(goal.startDate)
    const endYmd = isoToLocalYmd(goal.dueDate)
    const hasValidRange = Boolean(startYmd && endYmd && endYmd >= startYmd)

    const linkedTasks = activeTasks.filter((t) => t.goalId === goal.id)
    const completedTaskCount = linkedTasks.filter(
      (t) => classifyTaskTimeState(t, nowMs) === 'completed'
    ).length
    const totalTaskCount = linkedTasks.length
    const workProgressPct =
      totalTaskCount > 0 ? Math.round((completedTaskCount / totalTaskCount) * 100) : null

    let durationDays: number | null = null
    let elapsedDays: number | null = null
    let remainingDays: number | null = null
    let timeProgressPct: number | null = null

    if (hasValidRange && startYmd && endYmd) {
      durationDays = Math.max(1, daysBetweenYmd(startYmd, endYmd) + 1)
      const rawElapsed = daysBetweenYmd(startYmd, todayYmd) + 1
      elapsedDays = Math.max(0, Math.min(durationDays, rawElapsed))
      remainingDays = daysBetweenYmd(todayYmd, endYmd)
      timeProgressPct = Math.max(0, Math.min(100, Math.round((elapsedDays / durationDays) * 100)))
    }

    const goalMilestones = (milestonesByGoal[goal.id] ?? [])
      .filter((m) => !m.deletedAt)
      .sort((a, b) => a.position - b.position)

    let activeAssigned = false
    const checkpoints: JourneyRoadCheckpoint[] = goalMilestones.map((m) => {
      const mTasks = linkedTasks.filter((t) => t.milestoneId === m.id)
      const mDone = mTasks.filter((t) => classifyTaskTimeState(t, nowMs) === 'completed').length
      let cpStatus: JourneyRoadCheckpoint['status']
      if (m.status === 'COMPLETED' || Boolean(m.completedAt)) {
        cpStatus = 'completed'
      } else if (!activeAssigned) {
        cpStatus = 'active'
        activeAssigned = true
      } else {
        cpStatus = 'future'
      }
      return {
        id: m.id,
        position: m.position,
        title: m.title,
        status: cpStatus,
        completedTasks: mDone,
        totalTasks: mTasks.length
      }
    })

    const nextPending = linkedTasks
      .filter((t) => classifyTaskTimeState(t, nowMs) !== 'completed')
      .sort((a, b) => {
        const aDue = a.dueAt ? Date.parse(a.dueAt) : Number.MAX_SAFE_INTEGER
        const bDue = b.dueAt ? Date.parse(b.dueAt) : Number.MAX_SAFE_INTEGER
        return aDue - bDue
      })[0]

    const status: CalendarJourneyRoad['status'] =
      goal.status === 'COMPLETED'
        ? 'completed'
        : !endYmd
          ? 'unscheduled'
          : remainingDays !== null && remainingDays < 0
            ? 'overdue'
            : 'active'

    roads.push({
      id: `road-quest:${goal.id}`,
      sourceId: goal.id,
      kind: 'quest',
      title: goal.title,
      startYmd,
      endYmd,
      hasValidRange,
      durationDays,
      elapsedDays,
      remainingDays,
      timeProgressPct,
      workProgressPct,
      completedTaskCount,
      totalTaskCount,
      status,
      route: `/work/quests/${goal.id}`,
      checkpoints,
      nextActionableTask: nextPending
        ? {
            id: nextPending.id,
            title: nextPending.title,
            dueLabel: nextPending.dueAt ? formatShortViDate(isoToLocalYmd(nextPending.dueAt) ?? todayYmd) : null,
            route: `/work/tasks/${nextPending.id}`
          }
        : null,
      isPreview: !isLiveAuth
    })
  }

  // 2. Long-duration atomic Tasks (valid startAt + dueAt spanning >= 2 local days; no fake Epics!)
  const seenTaskIds = new Set<string>()
  for (const task of activeTasks) {
    if (!task.id || seenTaskIds.has(task.id)) continue
    seenTaskIds.add(task.id)

    const startYmd = isoToLocalYmd(task.startAt)
    const endYmd = isoToLocalYmd(task.dueAt)
    // Only create a multi-day range road when BOTH startAt and dueAt exist and span >= 2 local dates
    if (!startYmd || !endYmd || endYmd <= startYmd) continue

    const durationDays = Math.max(2, daysBetweenYmd(startYmd, endYmd) + 1)
    const rawElapsed = daysBetweenYmd(startYmd, todayYmd) + 1
    const elapsedDays = Math.max(0, Math.min(durationDays, rawElapsed))
    const remainingDays = daysBetweenYmd(todayYmd, endYmd)
    const timeProgressPct = Math.max(0, Math.min(100, Math.round((elapsedDays / durationDays) * 100)))

    const timeState = classifyTaskTimeState(task, nowMs)
    const isCompleted = timeState === 'completed'
    const status: CalendarJourneyRoad['status'] = isCompleted
      ? 'completed'
      : timeState === 'overdue'
        ? 'overdue'
        : 'active'

    roads.push({
      id: `road-task:${task.id}`,
      sourceId: task.id,
      kind: 'task',
      title: task.title,
      startYmd,
      endYmd,
      hasValidRange: true,
      durationDays,
      elapsedDays,
      remainingDays,
      timeProgressPct,
      workProgressPct: isCompleted ? 100 : 0,
      completedTaskCount: isCompleted ? 1 : 0,
      totalTaskCount: 1,
      status,
      route: `/work/tasks/${task.id}`,
      checkpoints: [], // Atomic Tasks NEVER fabricate Epic checkpoints
      nextActionableTask: isCompleted
        ? null
        : {
            id: task.id,
            title: task.title,
            dueLabel: formatShortViDate(endYmd),
            route: `/work/tasks/${task.id}`
          },
      isPreview: !isLiveAuth
    })
  }

  return roads
}

export interface RoadSpanWeekRow {
  kind: 'week'
  weekIndex: number
  cells: CalendarCell[]
  monthBanner?: string
}

export interface RoadSpanGapRow {
  kind: 'gap'
  skippedWeeks: number
}

export type RoadSpanRow = RoadSpanWeekRow | RoadSpanGapRow

/**
 * Builds the Monday-first week rows covering a Journey Road from `startYmd` to `endYmd`.
 * - Up to 9 weeks (~2 months): shows every week continuously from start to finish.
 * - Over 9 weeks (> 2 months): omits middle weeks with a `gap` row while ALWAYS preserving
 *   the start week(s) and end week(s) so both Start and Finish Flag remain visible.
 */
export function buildRoadSpanWeeks(
  startYmd: string,
  endYmd: string,
  todayYmd: string
): RoadSpanRow[] {
  const startDate = parseLocalDate(startYmd)
  const endDate = parseLocalDate(endYmd)
  const startOffset = (startDate.getDay() + 6) % 7
  const firstMonday = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate() - startOffset
  )
  const endOffset = (endDate.getDay() + 6) % 7
  const lastSunday = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate() + (6 - endOffset)
  )

  const allWeeks: CalendarCell[][] = []
  const cursor = new Date(firstMonday.getFullYear(), firstMonday.getMonth(), firstMonday.getDate())
  while (cursor.getTime() <= lastSunday.getTime() && allWeeks.length < 120) {
    const week: CalendarCell[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + i)
      const ymd = formatLocalDate(d)
      week.push({
        ymd,
        dayOfMonth: d.getDate(),
        inCurrentMonth: ymd >= startYmd && ymd <= endYmd,
        isToday: ymd === todayYmd
      })
    }
    allWeeks.push(week)
    cursor.setDate(cursor.getDate() + 7)
  }

  const MAX_FULL_WEEKS = 9 // ~2 months
  const rows: RoadSpanRow[] = []
  let prevMonthKey = ''

  const pushWeek = (cells: CalendarCell[], idx: number) => {
    // Label month transitions cleanly
    const anchor = cells.find((c) => c.dayOfMonth === 1) ?? cells[0]
    const mKey = anchor.ymd.slice(0, 7)
    let monthBanner: string | undefined
    if (mKey !== prevMonthKey) {
      prevMonthKey = mKey
      const d = parseLocalDate(anchor.ymd)
      monthBanner = `Tháng ${d.getMonth() + 1} / ${d.getFullYear()}`
    }
    rows.push({ kind: 'week', weekIndex: idx, cells, monthBanner })
  }

  if (allWeeks.length <= MAX_FULL_WEEKS) {
    allWeeks.forEach((w, idx) => pushWeek(w, idx))
    return rows
  }

  // > 2 months: keep first 2 weeks (guaranteed start) + gap + last 2 weeks (guaranteed finish)
  const headCount = 2
  const tailCount = 2
  const skippedWeeks = allWeeks.length - headCount - tailCount
  for (let i = 0; i < headCount; i++) {
    pushWeek(allWeeks[i], i)
  }
  rows.push({ kind: 'gap', skippedWeeks })
  prevMonthKey = ''
  for (let i = allWeeks.length - tailCount; i < allWeeks.length; i++) {
    pushWeek(allWeeks[i], i)
  }
  return rows
}

/**
 * Computes clipped horizontal road segments for a single 7-day calendar week row.
 * - Breaks/restarts cleanly across week rows and month boundaries.
 * - Limits simultaneous visible lanes to `maxLanes` and returns `overflowRoads` for an accessible selector.
 */
export function computeWeekRoadSegments(
  roads: CalendarJourneyRoad[],
  weekCells: CalendarCell[],
  maxLanes = 2
): { segments: WeekRoadSegment[]; overflowRoads: CalendarJourneyRoad[] } {
  if (weekCells.length === 0) return { segments: [], overflowRoads: [] }
  const weekStart = weekCells[0].ymd
  const weekEnd = weekCells[weekCells.length - 1].ymd

  const overlapping = roads.filter(
    (r) =>
      r.hasValidRange &&
      r.startYmd !== null &&
      r.endYmd !== null &&
      r.startYmd <= weekEnd &&
      r.endYmd >= weekStart
  )

  const segments: WeekRoadSegment[] = []
  const overflowRoads: CalendarJourneyRoad[] = []
  // Track occupied end column per lane (1..7)
  const laneOccupiedEnd: number[] = []

  for (const road of overlapping) {
    const startYmd = road.startYmd!
    const endYmd = road.endYmd!

    const clippedStart = startYmd < weekStart ? weekStart : startYmd
    const clippedEnd = endYmd > weekEnd ? weekEnd : endYmd

    const startIdx = weekCells.findIndex((c) => c.ymd === clippedStart)
    const endIdx = weekCells.findIndex((c) => c.ymd === clippedEnd)
    if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) continue

    const colStart = startIdx + 1
    const colEnd = endIdx + 1

    let assignedLane = -1
    for (let l = 0; l < maxLanes; l++) {
      if ((laneOccupiedEnd[l] ?? 0) < colStart) {
        assignedLane = l
        laneOccupiedEnd[l] = colEnd
        break
      }
    }

    if (assignedLane === -1) {
      overflowRoads.push(road)
      continue
    }

    segments.push({
      road,
      colStart,
      colSpan: colEnd - colStart + 1,
      lane: assignedLane,
      isStart: startYmd >= weekStart && startYmd <= weekEnd,
      isEnd: endYmd >= weekStart && endYmd <= weekEnd,
      continuesLeft: startYmd < weekStart,
      continuesRight: endYmd > weekEnd
    })
  }

  return { segments, overflowRoads }
}
