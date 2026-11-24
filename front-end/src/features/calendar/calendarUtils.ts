import type { Goal, Milestone, Quest } from '@/types/domain'
import { formatLocalDate, getTodayLocalDate, parseLocalDate, type CalendarCell } from '@/utils/date'
import { PROTOTYPE_HABITS, type PrototypeHabit } from '@/features/work/habitPrototypeData'
import { classifyTaskTimeState, sortTasksActionFirst } from '@/features/work/taskUtils'

export type CalendarEventCategory = 'task' | 'habit' | 'quest' | 'moment'

export interface CalendarEventItem {
  id: string
  category: CalendarEventCategory
  title: string
  /** Local YYYY-MM-DD date bucket */
  ymd: string
  /** Optional HH:mm local time for chronological sorting */
  timeLabel: string | null
  /** Explicit distinction between start time and deadline */
  timingKind: 'start' | 'deadline' | 'schedule' | 'milestone'
  urgency: 'overdue' | 'due_soon' | 'normal' | 'completed'
  route: string
  subtitle: string
  isPreview: boolean
}

export interface JourneyTimelineItem {
  id: string
  kind: 'quest' | 'epic'
  title: string
  parentTitle?: string
  dueYmd: string
  dueLabel: string
  progressLabel: string
  route: string
  isOverdue: boolean
  isPreview: boolean
}

export interface MonthSummaryCounts {
  tasks: number
  habits: number
  quests: number
  moments: number | null // null = PENDING Media API (honest unavailable state)
}

export interface DailyTaskDeadlineSummary {
  ymd: string
  /** Unique atomic Tasks whose dueAt falls on this local calendar date */
  totalDue: number
  /** Due on this date and still actionable (not completed) */
  actionableDue: number
  /** Due on this date and verified completed */
  completedDue: number
  /** Actionable and past dueAt */
  overdueDue: number
  /** Actionable, not overdue, due soon */
  dueSoonDue: number
}

/**
 * Reusable per-day Task deadline aggregation helper (FE-05A.3).
 * - Deduplicates tasks by stable unique ID.
 * - Counts ONLY atomic Tasks with a valid `dueAt` falling on the local date.
 * - Never counts Habit schedules, Task `startAt`, or Quest/Epic deadlines.
 */
export function aggregateDailyTaskDeadlines(
  tasks: Quest[],
  nowMs = Date.now()
): Map<string, DailyTaskDeadlineSummary> {
  const seenIds = new Set<string>()
  const map = new Map<string, DailyTaskDeadlineSummary>()

  for (const task of tasks) {
    if (!task.id || seenIds.has(task.id)) continue
    seenIds.add(task.id)
    if (task.deletedAt || task.status === 'ARCHIVED') continue

    const dueParts = isoToLocalYmdAndTime(task.dueAt)
    if (!dueParts) continue

    let entry = map.get(dueParts.ymd)
    if (!entry) {
      entry = {
        ymd: dueParts.ymd,
        totalDue: 0,
        actionableDue: 0,
        completedDue: 0,
        overdueDue: 0,
        dueSoonDue: 0
      }
      map.set(dueParts.ymd, entry)
    }

    const timeState = classifyTaskTimeState(task, nowMs)
    entry.totalDue += 1
    if (timeState === 'completed') {
      entry.completedDue += 1
    } else {
      entry.actionableDue += 1
      if (timeState === 'overdue') entry.overdueDue += 1
      else if (timeState === 'due_soon') entry.dueSoonDue += 1
    }
  }

  return map
}

/**
 * Orders non-habit cell preview events according to FE-05A.3 priority:
 * 1. Overdue / urgent actionable Tasks
 * 2. Actionable Tasks due that day
 * 3. Verified completed Tasks
 * 4. Other scheduled events (Quest deadlines, Task startAt)
 */
export function sortCellPreviewEvents(events: CalendarEventItem[]): CalendarEventItem[] {
  const rank = (ev: CalendarEventItem): number => {
    if (ev.category === 'task' && ev.urgency === 'overdue') return 0
    if (ev.category === 'task' && ev.urgency === 'due_soon') return 1
    if (ev.category === 'task' && ev.timingKind === 'deadline' && ev.urgency !== 'completed') return 2
    if (ev.category === 'task' && ev.urgency === 'completed') return 3
    if (ev.category === 'quest') return 4
    return 5
  }

  return [...events].sort((a, b) => {
    const rDiff = rank(a) - rank(b)
    if (rDiff !== 0) return rDiff
    return (a.timeLabel ?? '99:99').localeCompare(b.timeLabel ?? '99:99')
  })
}

/**
 * Generates an exact 4-, 5-, or 6-week Monday-first Gregorian month grid in local time.
 * Never pads an unnecessary 6th row when a month fits in 4 or 5 weeks, and never clips a 6-week month.
 */
export function getDynamicMonthCalendarGrid(
  year: number,
  monthIndex: number,
  todayYmd = getTodayLocalDate()
): { cells: CalendarCell[]; weekRows: number } {
  const firstOfMonth = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  // Convert JS Sunday=0..Saturday=6 into Monday=0..Sunday=6
  const startOffset = (firstOfMonth.getDay() + 6) % 7
  const totalSlots = startOffset + daysInMonth
  const weekRows = Math.ceil(totalSlots / 7) // 4, 5, or 6
  const totalCells = weekRows * 7

  const gridStart = new Date(year, monthIndex, 1 - startOffset)
  const cells: CalendarCell[] = []
  for (let i = 0; i < totalCells; i++) {
    const cellDate = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i
    )
    const ymd = formatLocalDate(cellDate)
    cells.push({
      ymd,
      dayOfMonth: cellDate.getDate(),
      inCurrentMonth: cellDate.getMonth() === monthIndex,
      isToday: ymd === todayYmd
    })
  }
  return { cells, weekRows }
}

function isoToLocalYmdAndTime(iso: string | null | undefined): { ymd: string; time: string } | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const ymd = formatLocalDate(d)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return { ymd, time: `${hh}:${mm}` }
}

/**
 * Derives normalized Calendar events directly from existing verified Task (Quest),
 * Quest (Goal), and prototype Habit sources — zero duplicated calendar records.
 * Strictly distinguishes Task startAt from dueAt.
 */
export function deriveCalendarEventsForRange(input: {
  tasks: Quest[]
  goals: Goal[]
  visibleYmds: string[]
  habits?: PrototypeHabit[]
  isLiveAuth: boolean
  nowMs?: number
}): CalendarEventItem[] {
  const { tasks, goals, visibleYmds, habits = PROTOTYPE_HABITS, isLiveAuth, nowMs = Date.now() } = input
  const visibleSet = new Set(visibleYmds)
  const events: CalendarEventItem[] = []

  // 1. Verified Tasks (Quest model): deduplicate by ID & separate Start vs Deadline clearly
  const seenTaskIds = new Set<string>()
  for (const task of tasks) {
    if (!task.id || seenTaskIds.has(task.id)) continue
    seenTaskIds.add(task.id)
    if (task.deletedAt || task.status === 'ARCHIVED') continue
    const timeState = classifyTaskTimeState(task, nowMs)
    const urgency: CalendarEventItem['urgency'] =
      timeState === 'completed'
        ? 'completed'
        : timeState === 'overdue'
          ? 'overdue'
          : timeState === 'due_soon'
            ? 'due_soon'
            : 'normal'

    const dueParts = isoToLocalYmdAndTime(task.dueAt)
    const startParts = isoToLocalYmdAndTime(task.startAt)

    if (dueParts && visibleSet.has(dueParts.ymd)) {
      events.push({
        id: `task-due:${task.id}`,
        category: 'task',
        title: task.title,
        ymd: dueParts.ymd,
        timeLabel: dueParts.time,
        timingKind: 'deadline',
        urgency,
        route: `/work/tasks/${task.id}`,
        subtitle:
          urgency === 'completed'
            ? 'Đã hoàn thành'
            : urgency === 'overdue'
              ? `Quá hạn · ${dueParts.time}`
              : `Hạn chót · ${dueParts.time}`,
        isPreview: !isLiveAuth
      })
    }

    // Show startAt on its own date when startAt differs from dueAt date (or when dueAt is absent)
    if (startParts && visibleSet.has(startParts.ymd) && startParts.ymd !== dueParts?.ymd) {
      events.push({
        id: `task-start:${task.id}`,
        category: 'task',
        title: task.title,
        ymd: startParts.ymd,
        timeLabel: startParts.time,
        timingKind: 'start',
        urgency: urgency === 'completed' ? 'completed' : 'normal',
        route: `/work/tasks/${task.id}`,
        subtitle: urgency === 'completed' ? 'Đã hoàn thành' : `Bắt đầu · ${startParts.time}`,
        isPreview: !isLiveAuth
      })
    }
  }

  // 2. Verified Quests (Goal model): show Quest deadlines
  for (const goal of goals) {
    if (goal.status === 'ARCHIVED') continue
    const dueParts = isoToLocalYmdAndTime(goal.dueDate)
    if (dueParts && visibleSet.has(dueParts.ymd)) {
      const dueMs = Date.parse(goal.dueDate)
      const isOverdue = goal.status !== 'COMPLETED' && Number.isFinite(dueMs) && dueMs < nowMs
      events.push({
        id: `quest-due:${goal.id}`,
        category: 'quest',
        title: goal.title,
        ymd: dueParts.ymd,
        timeLabel: null,
        timingKind: 'deadline',
        urgency: goal.status === 'COMPLETED' ? 'completed' : isOverdue ? 'overdue' : 'normal',
        route: `/work/quests/${goal.id}`,
        subtitle: 'Hạn hành trình (Quest)',
        isPreview: !isLiveAuth
      })
    }
  }

  // 3. Prototype Habit planned schedule (explicitly labeled isPreview: true — PENDING Habit API)
  for (const ymd of visibleYmds) {
    const d = parseLocalDate(ymd)
    const dowMon0 = (d.getDay() + 6) % 7
    for (const habit of habits) {
      if (!habit.plannedDays[dowMon0]) continue
      events.push({
        id: `habit-plan:${habit.id}:${ymd}`,
        category: 'habit',
        title: habit.title,
        ymd,
        timeLabel: null,
        timingKind: 'schedule',
        urgency: 'normal',
        route: '/work/habits',
        subtitle: `${habit.shortCadence} (Mẫu lịch · Chờ Habit API)`,
        isPreview: true
      })
    }
  }

  return events.sort((a, b) => {
    if (a.ymd !== b.ymd) return a.ymd.localeCompare(b.ymd)
    const order = { task: 0, quest: 1, habit: 2, moment: 3 }
    if (order[a.category] !== order[b.category]) return order[a.category] - order[b.category]
    return (a.timeLabel ?? '99:99').localeCompare(b.timeLabel ?? '99:99')
  })
}

/**
 * Builds the horizontal Journey Timeline Strip from verified Quests (Goals) & linked Tasks.
 */
export function buildJourneyTimelineItems(
  goals: Goal[],
  tasks: Quest[],
  milestonesByGoal: Record<string, Milestone[]>,
  isLiveAuth: boolean,
  nowMs = Date.now()
): JourneyTimelineItem[] {
  const items: JourneyTimelineItem[] = []
  const activeGoals = goals.filter((g) => g.status !== 'ARCHIVED')

  for (const goal of activeGoals) {
    const linked = tasks.filter(
      (t) => t.goalId === goal.id && !t.deletedAt && t.status !== 'ARCHIVED'
    )
    const done = linked.filter((t) => Boolean(t.completedAt)).length
    const dueParts = isoToLocalYmdAndTime(goal.dueDate)
    const dueYmd = dueParts?.ymd ?? goal.dueDate.slice(0, 10)
    const dueDateObj = parseLocalDate(dueYmd)
    const dueLabel = `${String(dueDateObj.getDate()).padStart(2, '0')}/${String(
      dueDateObj.getMonth() + 1
    ).padStart(2, '0')}`
    const dueMs = Date.parse(goal.dueDate)
    const isOverdue = goal.status !== 'COMPLETED' && Number.isFinite(dueMs) && dueMs < nowMs

    items.push({
      id: `tl-quest:${goal.id}`,
      kind: 'quest',
      title: goal.title,
      dueYmd,
      dueLabel: `Hạn ${dueLabel}`,
      progressLabel: linked.length > 0 ? `${done}/${linked.length} Task` : '0 Task',
      route: `/work/quests/${goal.id}`,
      isOverdue,
      isPreview: !isLiveAuth
    })

    // Include next active Epic (Milestone) for this Quest if verified
    const goalEpics = (milestonesByGoal[goal.id] ?? [])
      .filter((m) => !m.deletedAt && m.status !== 'COMPLETED')
      .sort((a, b) => a.position - b.position)
    const nextEpic = goalEpics[0]
    if (nextEpic) {
      const epicTasks = linked.filter((t) => t.milestoneId === nextEpic.id)
      const epicDone = epicTasks.filter((t) => Boolean(t.completedAt)).length
      items.push({
        id: `tl-epic:${nextEpic.id}`,
        kind: 'epic',
        title: `Epic #${nextEpic.position}: ${nextEpic.title}`,
        parentTitle: goal.title,
        dueYmd,
        dueLabel: `Chặng #${nextEpic.position}`,
        progressLabel: `${epicDone}/${epicTasks.length} Task`,
        route: `/work/quests/${goal.id}`,
        isOverdue: false,
        isPreview: !isLiveAuth
      })
    }
  }

  return items
}

/**
 * Prioritizes upcoming deadlines:
 * 1. Overdue actionable Tasks -> 2. Due-soon Tasks -> 3. Upcoming Quest deadlines -> 4. Other scheduled Tasks
 */
export function buildUpcomingDeadlines(
  tasks: Quest[],
  goals: Goal[],
  isLiveAuth: boolean,
  nowMs = Date.now(),
  limit = 4
): CalendarEventItem[] {
  const actionableTasks = sortTasksActionFirst(
    tasks.filter((t) => !t.deletedAt && t.status !== 'ARCHIVED' && !t.completedAt && Boolean(t.dueAt)),
    nowMs
  )

  const list: CalendarEventItem[] = []
  for (const task of actionableTasks) {
    const dueParts = isoToLocalYmdAndTime(task.dueAt)
    if (!dueParts) continue
    const state = classifyTaskTimeState(task, nowMs)
    const d = parseLocalDate(dueParts.ymd)
    const shortDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    list.push({
      id: `up-task:${task.id}`,
      category: 'task',
      title: task.title,
      ymd: dueParts.ymd,
      timeLabel: dueParts.time,
      timingKind: 'deadline',
      urgency: state === 'overdue' ? 'overdue' : state === 'due_soon' ? 'due_soon' : 'normal',
      route: `/work/tasks/${task.id}`,
      subtitle:
        state === 'overdue'
          ? `Quá hạn · ${shortDate} ${dueParts.time}`
          : `Hạn ${shortDate} · ${dueParts.time}`,
      isPreview: !isLiveAuth
    })
  }

  for (const goal of goals) {
    if (goal.status === 'COMPLETED' || goal.status === 'ARCHIVED') continue
    const dueParts = isoToLocalYmdAndTime(goal.dueDate)
    if (!dueParts) continue
    const d = parseLocalDate(dueParts.ymd)
    const shortDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    const dueMs = Date.parse(goal.dueDate)
    list.push({
      id: `up-quest:${goal.id}`,
      category: 'quest',
      title: goal.title,
      ymd: dueParts.ymd,
      timeLabel: null,
      timingKind: 'deadline',
      urgency: Number.isFinite(dueMs) && dueMs < nowMs ? 'overdue' : 'normal',
      route: `/work/quests/${goal.id}`,
      subtitle: `Hạn Quest · ${shortDate}`,
      isPreview: !isLiveAuth
    })
  }

  return list.slice(0, limit)
}

export function computeMonthlySummaryCounts(
  monthEvents: CalendarEventItem[],
  monthPrefix: string // YYYY-MM
): MonthSummaryCounts {
  const inMonth = monthEvents.filter((e) => e.ymd.startsWith(monthPrefix))
  const taskIds = new Set(inMonth.filter((e) => e.category === 'task').map((e) => e.id))
  const questIds = new Set(inMonth.filter((e) => e.category === 'quest').map((e) => e.id))
  const uniqueHabits = new Set(
    inMonth
      .filter((e) => e.category === 'habit')
      .map((e) => e.id.split(':')[1] ?? e.id)
  )
  return {
    tasks: taskIds.size,
    habits: uniqueHabits.size,
    quests: questIds.size,
    moments: null // Honest PENDING Media API state
  }
}

export function formatVietnameseFullDate(ymd: string): string {
  const d = parseLocalDate(ymd)
  const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  return `${weekdays[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1
  ).padStart(2, '0')}/${d.getFullYear()}`
}
