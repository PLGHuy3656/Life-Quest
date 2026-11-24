import type { Goal, Milestone, Quest } from '@/types/domain'
import { sortTasksActionFirst } from './taskUtils'

export type QuestMode = 'personal' | 'collaborative'
export type QuestMemberRole = 'OWNER' | 'COLLABORATOR' | 'VIEWER'
export type QuestMemberStatus = 'OWNER' | 'ACCEPTED' | 'PENDING' | 'DECLINED'

export interface QuestMemberPreview {
  id: string
  displayName: string
  username: string
  initials: string
  accentColor: string
  role: QuestMemberRole
  status: QuestMemberStatus
}

export interface CollaborativeQuestPreview {
  goal: Goal
  mode: 'collaborative'
  ownerName: string
  members: QuestMemberPreview[]
  /** Preview-only Epics (Milestone shape) for Collaborative Quest hierarchy preview. */
  previewEpics: Milestone[]
  /** Preview-only assignee map (taskId -> memberId); never persisted to Backend. */
  previewAssignees: Record<string, string>
  previewTasks: Quest[]
  isInvitationToMe?: boolean
  isPermissionDenied?: boolean
}

export interface EpicTaskGroup {
  epic: Milestone
  tasks: Quest[]
  completedCount: number
  totalCount: number
  percent: number
}

export interface QuestEpicGrouping {
  epicGroups: EpicTaskGroup[]
  unassignedTasks: Quest[]
  deduplicatedActiveTasks: Quest[]
}

/**
 * Deduplicates linked Tasks by task.id and groups them strictly under their parent Epic (Milestone).
 * - Guarantees zero duplicate Tasks across Epic groups.
 * - Computes each Epic's progress strictly from verified completed Task counts (never fake 100%).
 * - Tasks with milestoneId === null (or orphan milestoneId) go into `unassignedTasks`.
 */
export function groupTasksByEpic(
  epics: Milestone[],
  linkedTasks: Quest[],
  nowMs = Date.now()
): QuestEpicGrouping {
  const seen = new Set<string>()
  const deduplicatedActiveTasks: Quest[] = []
  for (const task of linkedTasks) {
    if (task.deletedAt || task.status === 'ARCHIVED') continue
    if (seen.has(task.id)) continue
    seen.add(task.id)
    deduplicatedActiveTasks.push(task)
  }

  const orderedEpics = [...epics]
    .filter((e) => !e.deletedAt)
    .sort((a, b) => a.position - b.position)

  const epicIdSet = new Set(orderedEpics.map((e) => e.id))

  const epicGroups: EpicTaskGroup[] = orderedEpics.map((epic) => {
    const grouped = sortTasksActionFirst(
      deduplicatedActiveTasks.filter((t) => t.milestoneId === epic.id),
      nowMs
    )
    const completedCount = grouped.filter((t) => Boolean(t.completedAt)).length
    const totalCount = grouped.length
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    return {
      epic,
      tasks: grouped,
      completedCount,
      totalCount,
      percent
    }
  })

  const unassignedTasks = sortTasksActionFirst(
    deduplicatedActiveTasks.filter((t) => !t.milestoneId || !epicIdSet.has(t.milestoneId)),
    nowMs
  )

  return {
    epicGroups,
    unassignedTasks,
    deduplicatedActiveTasks
  }
}

export interface QuestProgressSummary {
  completedCount: number
  totalCount: number
  remainingCount: number
  archivedCount: number
  percent: number
  nextActionableTask: Quest | null
}

/**
 * Authoritative FE-04C Quest Progress calculation from verified linked Tasks (Quest[]).
 * - Excludes archived and soft-deleted Tasks from the active denominator.
 * - Never fabricates 100% completion when totalCount === 0.
 * - Never derives Quest progress from Milestone count.
 */
export function computeQuestProgress(
  linkedTasks: Quest[],
  nowMs = Date.now()
): QuestProgressSummary {
  const seen = new Set<string>()
  const nonDeleted: Quest[] = []
  for (const t of linkedTasks) {
    if (t.deletedAt || seen.has(t.id)) continue
    seen.add(t.id)
    nonDeleted.push(t)
  }
  const archivedCount = nonDeleted.filter((t) => t.status === 'ARCHIVED').length
  const activeTasks = nonDeleted.filter((t) => t.status !== 'ARCHIVED')

  const completedCount = activeTasks.filter((t) => Boolean(t.completedAt)).length
  const totalCount = activeTasks.length
  const remainingCount = Math.max(0, totalCount - completedCount)
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const incomplete = activeTasks.filter((t) => !t.completedAt)
  const nextActionableTask = sortTasksActionFirst(incomplete, nowMs)[0] ?? null

  return {
    completedCount,
    totalCount,
    remainingCount,
    archivedCount,
    percent,
    nextActionableTask
  }
}

export type QuestTimingState =
  | 'completed'
  | 'paused'
  | 'archived'
  | 'overdue'
  | 'due_soon'
  | 'upcoming'
  | 'active'

export function classifyQuestTimingState(goal: Goal, nowMs = Date.now()): QuestTimingState {
  if (goal.status === 'COMPLETED') return 'completed'
  if (goal.status === 'PAUSED') return 'paused'
  if (goal.status === 'ARCHIVED') return 'archived'

  const dueMs = Date.parse(goal.dueDate)
  const startMs = Date.parse(goal.startDate)

  if (Number.isFinite(dueMs) && dueMs < nowMs) return 'overdue'
  if (Number.isFinite(dueMs) && dueMs - nowMs <= 72 * 60 * 60 * 1000) return 'due_soon'
  if (Number.isFinite(startMs) && startMs > nowMs) return 'upcoming'
  return 'active'
}

export function getQuestTimingLabel(state: QuestTimingState): string {
  switch (state) {
    case 'completed':
      return 'Hoàn thành'
    case 'paused':
      return 'Tạm dừng'
    case 'archived':
      return 'Đã lưu trữ'
    case 'overdue':
      return 'Quá hạn hành trình'
    case 'due_soon':
      return 'Sắp đến hạn'
    case 'upcoming':
      return 'Sắp bắt đầu'
    default:
      return 'Đang thực hiện'
  }
}

export function formatQuestRemaining(dueDate: string, nowMs = Date.now()): string | null {
  const dueMs = Date.parse(dueDate)
  if (!Number.isFinite(dueMs)) return null
  const diffDays = Math.ceil((dueMs - nowMs) / (24 * 60 * 60 * 1000))
  if (diffDays < 0) return `Quá hạn ${Math.abs(diffDays)} ngày`
  if (diffDays === 0) return 'Hạn hôm nay'
  if (diffDays === 1) return 'Còn 1 ngày'
  return `Còn ${diffDays} ngày`
}

export function formatShortDateVi(iso: string | null | undefined): string {
  if (!iso) return 'Chưa đặt'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Chưa đặt'
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** Isolated friend directory preview for Collaborative Quest UI boundary (PENDING Friendship API). */
export const COLLAB_PREVIEW_FRIENDS: QuestMemberPreview[] = [
  {
    id: 'friend-preview-1',
    displayName: 'Minh Anh',
    username: 'minhanh',
    initials: 'MA',
    accentColor: '#168c78',
    role: 'COLLABORATOR',
    status: 'ACCEPTED'
  },
  {
    id: 'friend-preview-2',
    displayName: 'Gia Huy',
    username: 'giahuy',
    initials: 'GH',
    accentColor: '#f26b3a',
    role: 'COLLABORATOR',
    status: 'PENDING'
  },
  {
    id: 'friend-preview-3',
    displayName: 'Khánh Linh',
    username: 'khanhlinh',
    initials: 'KL',
    accentColor: '#5b3cc4',
    role: 'VIEWER',
    status: 'PENDING'
  }
]

const TODAY_ISO_PREFIX = new Date().toISOString().slice(0, 10)

/**
 * Isolated Collaborative Quest Preview Fixtures (clearly labeled PREVIEW • PENDING API).
 * Never presented as persisted live Backend collaboration records.
 */
export const COLLAB_PREVIEW_QUESTS: CollaborativeQuestPreview[] = [
  {
    goal: {
      id: 'collab-preview-1',
      userId: '00000000-0000-4000-8000-000000000001',
      title: 'Sprint hoàn thiện đồ án LifeQuest cùng nhóm',
      description:
        'Hành trình cộng tác mẫu giữa bạn và nhóm bạn bè — chia nhiệm vụ, theo dõi hạn chót và hoàn thiện bản trình bày.',
      startDate: '2026-11-10T00:00:00.000Z',
      dueDate: '2026-12-15T23:59:59.000Z',
      status: 'ACTIVE',
      createdAt: '2026-11-10T08:00:00.000Z',
      updatedAt: '2026-11-23T09:00:00.000Z'
    },
    mode: 'collaborative',
    ownerName: 'Bạn',
    members: [
      {
        id: '00000000-0000-4000-8000-000000000001',
        displayName: 'Bạn',
        username: 'explorer',
        initials: 'B',
        accentColor: '#16324a',
        role: 'OWNER',
        status: 'OWNER'
      },
      COLLAB_PREVIEW_FRIENDS[0],
      COLLAB_PREVIEW_FRIENDS[1],
      COLLAB_PREVIEW_FRIENDS[2]
    ],
    previewEpics: [
      {
        id: 'collab-epic-1',
        goalId: 'collab-preview-1',
        title: 'Epic 1: Thiết kế hợp đồng & Demo',
        description: 'Hoàn thiện tài liệu API cộng tác và bộ slide trình bày.',
        position: 1,
        status: 'ACTIVE',
        completedAt: null,
        deletedAt: null,
        createdAt: '2026-11-10T08:00:00.000Z',
        updatedAt: '2026-11-22T08:00:00.000Z'
      },
      {
        id: 'collab-epic-2',
        goalId: 'collab-preview-1',
        title: 'Epic 2: Kiểm thử & Nghiệm thu',
        description: 'Kiểm thử toàn diện luồng Quest → Epic → Task.',
        position: 2,
        status: 'ACTIVE',
        completedAt: null,
        deletedAt: null,
        createdAt: '2026-11-12T08:00:00.000Z',
        updatedAt: '2026-11-22T08:00:00.000Z'
      }
    ],
    previewAssignees: {
      'collab-task-1': '00000000-0000-4000-8000-000000000001',
      'collab-task-2': 'friend-preview-1',
      'collab-task-3': 'friend-preview-1'
    },
    previewTasks: [
      {
        id: 'collab-task-1',
        userId: '00000000-0000-4000-8000-000000000001',
        goalId: 'collab-preview-1',
        milestoneId: 'collab-epic-1',
        title: 'Chốt tài liệu đặc tả hợp đồng API Quest cộng tác',
        description: 'Xác nhận cấu trúc lời mời, vai trò thành viên và phân công nhiệm vụ.',
        type: 'FOCUS',
        priority: 1,
        proofRequirement: 'OPTIONAL',
        targetValue: null,
        targetUnit: null,
        estimatedDurationSeconds: 1800,
        xpReward: 40,
        coinReward: 15,
        startAt: `${TODAY_ISO_PREFIX}T08:00:00.000Z`,
        dueAt: `${TODAY_ISO_PREFIX}T19:30:00.000Z`,
        completedAt: null,
        archivedAt: null,
        status: 'ACTIVE',
        createdAt: '2026-11-18T00:00:00.000Z',
        updatedAt: '2026-11-22T00:00:00.000Z',
        deletedAt: null,
        isPinned: false
      },
      {
        id: 'collab-task-2',
        userId: 'friend-preview-1',
        goalId: 'collab-preview-1',
        milestoneId: 'collab-epic-1',
        title: 'Thiết kế bộ slide demo tương tác Fox V2',
        description: 'Gom ảnh chụp giao diện 4 kích thước màn hình Desktop.',
        type: 'SIMPLE',
        priority: 2,
        proofRequirement: 'NONE',
        targetValue: null,
        targetUnit: null,
        estimatedDurationSeconds: 2400,
        xpReward: 35,
        coinReward: 12,
        startAt: '2026-11-19T08:00:00.000Z',
        dueAt: '2026-11-22T17:00:00.000Z',
        completedAt: '2026-11-21T16:10:00.000Z',
        archivedAt: null,
        status: 'ACTIVE',
        createdAt: '2026-11-18T00:00:00.000Z',
        updatedAt: '2026-11-21T16:10:00.000Z',
        deletedAt: null,
        isPinned: false
      },
      {
        id: 'collab-task-3',
        userId: 'friend-preview-1',
        goalId: 'collab-preview-1',
        milestoneId: 'collab-epic-2',
        title: 'Kiểm thử luồng tạo Task gắn với Quest',
        description: 'Đảm bảo ID hành trình được giữ nguyên khi gửi form.',
        type: 'SIMPLE',
        priority: 2,
        proofRequirement: 'NONE',
        targetValue: null,
        targetUnit: null,
        estimatedDurationSeconds: 1200,
        xpReward: 25,
        coinReward: 10,
        startAt: null,
        dueAt: '2026-12-05T17:00:00.000Z',
        completedAt: null,
        archivedAt: null,
        status: 'ACTIVE',
        createdAt: '2026-11-19T00:00:00.000Z',
        updatedAt: '2026-11-22T00:00:00.000Z',
        deletedAt: null,
        isPinned: false
      }
    ]
  },
  {
    goal: {
      id: 'collab-preview-invite',
      userId: 'friend-preview-1',
      title: 'Thử thách 30 ngày chạy bộ buổi sáng',
      description: 'Minh Anh mời bạn cùng tham gia hành trình vận động mỗi sáng.',
      startDate: '2026-11-25T00:00:00.000Z',
      dueDate: '2026-12-25T23:59:59.000Z',
      status: 'ACTIVE',
      createdAt: '2026-11-22T08:00:00.000Z',
      updatedAt: '2026-11-23T08:00:00.000Z'
    },
    mode: 'collaborative',
    ownerName: 'Minh Anh',
    isInvitationToMe: true,
    members: [
      {
        id: 'friend-preview-1',
        displayName: 'Minh Anh',
        username: 'minhanh',
        initials: 'MA',
        accentColor: '#168c78',
        role: 'OWNER',
        status: 'OWNER'
      },
      {
        id: '00000000-0000-4000-8000-000000000001',
        displayName: 'Bạn',
        username: 'explorer',
        initials: 'B',
        accentColor: '#16324a',
        role: 'COLLABORATOR',
        status: 'PENDING'
      }
    ],
    previewEpics: [],
    previewAssignees: {},
    previewTasks: []
  }
]

export function findCollaborativePreviewById(
  questId: string | undefined
): CollaborativeQuestPreview | null {
  if (!questId) return null
  return COLLAB_PREVIEW_QUESTS.find((c) => c.goal.id === questId) ?? null
}
