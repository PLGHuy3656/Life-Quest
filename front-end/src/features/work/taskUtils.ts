import type { ProofRequirement, Quest } from '@/types/domain'

export type TaskFilterBucket = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'archived'
export type TaskSortKey = 'smart' | 'due_asc' | 'priority_asc' | 'updated_desc' | 'title_asc'

export type DeadlineUrgency = 'overdue' | 'today' | 'upcoming' | 'none'

export type TaskTimeState =
  | 'completed'
  | 'overdue'
  | 'due_soon'
  | 'starting_soon'
  | 'today'
  | 'upcoming'
  | 'unscheduled'

export interface PriorityMeta {
  label: string
  tone: 'high' | 'medium' | 'low'
}

const SOON_WINDOW_MS = 2 * 60 * 60 * 1000 // 2 hours

export function getPriorityMeta(priority: number): PriorityMeta {
  if (priority === 1) {
    return { label: 'Ưu tiên cao', tone: 'high' }
  }
  if (priority === 2) {
    return { label: 'Trung bình', tone: 'medium' }
  }
  return { label: 'Nhẹ nhàng', tone: 'low' }
}

export function getProofLabel(req: ProofRequirement): string {
  switch (req) {
    case 'REQUIRED':
      return 'Bắt buộc minh chứng'
    case 'OPTIONAL':
      return 'Minh chứng tùy chọn'
    default:
      return 'Không cần minh chứng'
  }
}

export function getQuestStatusLabel(status: string, completedAt: string | null): string {
  if (completedAt) return 'Hoàn thành'
  if (status === 'ARCHIVED') return 'Đã lưu trữ'
  return 'Đang hoạt động'
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function parseMs(iso: string | null | undefined): number | null {
  if (!iso) return null
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? ms : null
}

/**
 * Deterministic time-state classification that strictly separates
 * startAt ("starting soon") from dueAt ("due soon" / "overdue").
 */
export function classifyTaskTimeState(quest: Quest, nowMs = Date.now()): TaskTimeState {
  if (quest.completedAt) return 'completed'

  const startMs = parseMs(quest.startAt)
  const dueMs = parseMs(quest.dueAt)
  const nowDate = new Date(nowMs)

  if (dueMs !== null && dueMs < nowMs) {
    return 'overdue'
  }
  if (dueMs !== null && dueMs - nowMs <= SOON_WINDOW_MS) {
    return 'due_soon'
  }
  if (startMs !== null && startMs >= nowMs && startMs - nowMs <= SOON_WINDOW_MS) {
    return 'starting_soon'
  }
  if (
    (startMs !== null && isSameLocalDay(new Date(startMs), nowDate)) ||
    (dueMs !== null && isSameLocalDay(new Date(dueMs), nowDate))
  ) {
    return 'today'
  }
  if (startMs !== null || dueMs !== null) {
    return 'upcoming'
  }
  return 'unscheduled'
}

export function classifyDeadline(dueAt: string | null, nowMs = Date.now()): DeadlineUrgency {
  const dueMs = parseMs(dueAt)
  if (dueMs === null) return 'none'
  if (dueMs < nowMs) return 'overdue'
  if (isSameLocalDay(new Date(dueMs), new Date(nowMs))) return 'today'
  return 'upcoming'
}

function formatHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDDMM(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatRelativeMinutes(diffMs: number): string {
  const mins = Math.max(1, Math.round(diffMs / 60_000))
  if (mins < 60) return `${mins} phút`
  const h = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${h}g ${rem}p` : `${h} giờ`
}

export function formatStartLabel(startAt: string | null, nowMs = Date.now()): string | null {
  const startMs = parseMs(startAt)
  if (startMs === null) return null
  const d = new Date(startMs)
  const diff = startMs - nowMs
  if (diff >= 0 && diff <= SOON_WINDOW_MS) {
    return `Bắt đầu sau ${formatRelativeMinutes(diff)} (${formatHHMM(d)})`
  }
  if (isSameLocalDay(d, new Date(nowMs))) {
    return `Bắt đầu ${formatHHMM(d)}`
  }
  return `Bắt đầu ${formatDDMM(d)} • ${formatHHMM(d)}`
}

export function formatDueLabel(dueAt: string | null, nowMs = Date.now()): string {
  const dueMs = parseMs(dueAt)
  if (dueMs === null) return 'Chưa đặt hạn'
  const d = new Date(dueMs)
  const diff = dueMs - nowMs
  if (diff < 0) {
    if (isSameLocalDay(d, new Date(nowMs))) return `Quá hạn • ${formatHHMM(d)}`
    return `Quá hạn • ${formatDDMM(d)}`
  }
  if (diff <= SOON_WINDOW_MS) {
    return `Hạn trong ${formatRelativeMinutes(diff)} (${formatHHMM(d)})`
  }
  if (isSameLocalDay(d, new Date(nowMs))) {
    return `Hạn ${formatHHMM(d)}`
  }
  return `Hạn ${formatDDMM(d)} • ${formatHHMM(d)}`
}

export function getTimeStateBadgeLabel(state: TaskTimeState): string {
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
    case 'completed':
      return 'Hoàn thành'
    default:
      return 'Chưa đặt lịch'
  }
}

export type TaskDetailTimingState =
  | 'completed'
  | 'overdue'
  | 'due_soon'
  | 'in_progress'
  | 'starting_soon'
  | 'not_started'
  | 'unscheduled'

/**
 * FE-04B.1 6-state Task Detail timing classifier.
 * Strictly distinguishes startAt from dueAt and never marks completed tasks overdue.
 */
export function classifyDetailTimingState(
  quest: Quest,
  nowMs = Date.now()
): TaskDetailTimingState {
  if (quest.completedAt) return 'completed'

  const startMs = parseMs(quest.startAt)
  const dueMs = parseMs(quest.dueAt)

  if (dueMs !== null && dueMs < nowMs) return 'overdue'
  if (dueMs !== null && dueMs - nowMs <= SOON_WINDOW_MS) return 'due_soon'
  if (startMs !== null && startMs <= nowMs) return 'in_progress'
  if (startMs !== null && startMs - nowMs <= SOON_WINDOW_MS) return 'starting_soon'
  if (startMs !== null || dueMs !== null) return 'not_started'
  return 'unscheduled'
}

export function getDetailTimingLabel(state: TaskDetailTimingState): string {
  switch (state) {
    case 'completed':
      return 'Hoàn thành'
    case 'overdue':
      return 'Quá hạn'
    case 'due_soon':
      return 'Sắp đến hạn'
    case 'in_progress':
      return 'Đang trong khung giờ'
    case 'starting_soon':
      return 'Sắp bắt đầu'
    case 'not_started':
      return 'Chưa bắt đầu'
    default:
      return 'Chưa đặt lịch'
  }
}

export function formatRemainingDuration(dueAt: string | null, nowMs = Date.now()): string | null {
  const dueMs = parseMs(dueAt)
  if (dueMs === null) return null
  const diff = dueMs - nowMs
  const absMins = Math.max(1, Math.round(Math.abs(diff) / 60_000))
  const days = Math.floor(absMins / (60 * 24))
  const hours = Math.floor((absMins % (60 * 24)) / 60)
  const mins = absMins % 60
  const span =
    days > 0
      ? hours > 0
        ? `${days} ngày ${hours}g`
        : `${days} ngày`
      : hours > 0
        ? mins > 0
          ? `${hours}g ${mins}p`
          : `${hours} giờ`
        : `${mins} phút`
  return diff < 0 ? `Quá hạn ${span}` : `Còn ${span}`
}

export function formatFullDateTime(iso: string | null): string {
  const ms = parseMs(iso)
  if (ms === null) return 'Chưa thiết lập'
  const d = new Date(ms)
  return `${formatHHMM(d)}, ${formatDDMM(d)}/${d.getFullYear()}`
}

export function toDatetimeLocalValue(iso: string | null): string {
  const ms = parseMs(iso)
  if (ms === null) return ''
  const d = new Date(ms)
  const yyyy = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mo}-${dd}T${hh}:${mm}`
}

export function filterQuestsByBucket(
  quests: Quest[],
  bucket: TaskFilterBucket,
  nowMs = Date.now()
): Quest[] {
  switch (bucket) {
    case 'archived':
      return quests.filter((q) => q.status === 'ARCHIVED')
    case 'completed':
      return quests.filter((q) => Boolean(q.completedAt))
    case 'overdue':
      return quests.filter(
        (q) =>
          q.status === 'ACTIVE' &&
          !q.completedAt &&
          classifyTaskTimeState(q, nowMs) === 'overdue'
      )
    case 'today':
      return quests.filter((q) => {
        if (q.status !== 'ACTIVE' || q.completedAt) return false
        const st = classifyTaskTimeState(q, nowMs)
        return st === 'today' || st === 'due_soon' || st === 'starting_soon'
      })
    case 'upcoming':
      return quests.filter(
        (q) =>
          q.status === 'ACTIVE' &&
          !q.completedAt &&
          classifyTaskTimeState(q, nowMs) === 'upcoming'
      )
    case 'all':
    default:
      return quests.filter((q) => q.status === 'ACTIVE')
  }
}

const TIME_STATE_RANK: Record<TaskTimeState, number> = {
  overdue: 0,
  due_soon: 1,
  starting_soon: 2,
  today: 3,
  upcoming: 4,
  unscheduled: 5,
  completed: 6
}

/**
 * Deterministic FE-04A.2 deadline-aware action-first sort:
 * 1. Overdue (earliest dueAt first)
 * 2. Due soon (<= 2h, earliest dueAt first)
 * 3. Starting soon (<= 2h, earliest startAt first)
 * 4. Today (chronological by startAt ?? dueAt)
 * 5. Upcoming (chronological by startAt ?? dueAt)
 * 6. Unscheduled (priority -> pinned -> title)
 * 7. Completed / Archived last
 */
export function sortTasksActionFirst(quests: Quest[], nowMs = Date.now()): Quest[] {
  const copy = [...quests]
  copy.sort((a, b) => {
    const archA = a.status === 'ARCHIVED' ? 1 : 0
    const archB = b.status === 'ARCHIVED' ? 1 : 0
    if (archA !== archB) return archA - archB

    const stA = classifyTaskTimeState(a, nowMs)
    const stB = classifyTaskTimeState(b, nowMs)
    const rankDiff = TIME_STATE_RANK[stA] - TIME_STATE_RANK[stB]
    if (rankDiff !== 0) return rankDiff

    if (stA === 'overdue' || stA === 'due_soon') {
      const da = parseMs(a.dueAt) ?? Number.MAX_SAFE_INTEGER
      const db = parseMs(b.dueAt) ?? Number.MAX_SAFE_INTEGER
      if (da !== db) return da - db
    } else if (stA === 'starting_soon' || stA === 'today' || stA === 'upcoming') {
      const ta = parseMs(a.startAt) ?? parseMs(a.dueAt) ?? Number.MAX_SAFE_INTEGER
      const tb = parseMs(b.startAt) ?? parseMs(b.dueAt) ?? Number.MAX_SAFE_INTEGER
      if (ta !== tb) return ta - tb
    }

    const pa = a.priority === 0 ? 99 : a.priority
    const pb = b.priority === 0 ? 99 : b.priority
    if (pa !== pb) return pa - pb

    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return a.title.localeCompare(b.title, 'vi')
  })
  return copy
}

export function sortQuests(quests: Quest[], sortBy: TaskSortKey, nowMs = Date.now()): Quest[] {
  if (sortBy === 'smart') {
    return sortTasksActionFirst(quests, nowMs)
  }
  const copy = [...quests]
  copy.sort((a, b) => {
    if (sortBy === 'priority_asc') {
      const pa = a.priority === 0 ? 99 : a.priority
      const pb = b.priority === 0 ? 99 : b.priority
      if (pa !== pb) return pa - pb
    }
    if (sortBy === 'title_asc') {
      return a.title.localeCompare(b.title, 'vi')
    }
    if (sortBy === 'updated_desc') {
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
    }
    const da = parseMs(a.dueAt) ?? Number.MAX_SAFE_INTEGER
    const db = parseMs(b.dueAt) ?? Number.MAX_SAFE_INTEGER
    if (da !== db) return da - db
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return a.title.localeCompare(b.title, 'vi')
  })
  return copy
}

export interface ActionFirstGroups {
  urgent: Quest[]
  today: Quest[]
  upcoming: Quest[]
  unscheduled: Quest[]
}

export function groupTasksActionFirst(quests: Quest[], nowMs = Date.now()): ActionFirstGroups {
  const active = quests.filter((q) => q.status === 'ACTIVE' && !q.completedAt)
  const sorted = sortTasksActionFirst(active, nowMs)
  const groups: ActionFirstGroups = { urgent: [], today: [], upcoming: [], unscheduled: [] }
  for (const q of sorted) {
    const st = classifyTaskTimeState(q, nowMs)
    if (st === 'overdue' || st === 'due_soon' || st === 'starting_soon') {
      groups.urgent.push(q)
    } else if (st === 'today') {
      groups.today.push(q)
    } else if (st === 'upcoming') {
      groups.upcoming.push(q)
    } else {
      groups.unscheduled.push(q)
    }
  }
  return groups
}
