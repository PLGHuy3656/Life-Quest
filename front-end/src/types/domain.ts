// Typed contracts aligned 1:1 with D:\Development\LifeQuest_Repo\backend\prisma\schema.prisma
// and controllers on origin/develop (f9db2e1).

export type QuestType = 'SIMPLE' | 'QUANTITY' | 'DURATION' | 'PROGRESS' | 'FOCUS'
export type ProofRequirement = 'NONE' | 'OPTIONAL' | 'REQUIRED'
export type ScheduleType = 'ONE_TIME' | 'RECURRING'
export type ExecutionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'ABANDONED'
export type PrivacyMode = 'PUBLIC' | 'FRIENDS' | 'PRIVATE'

export interface UserProfile {
  id: string
  userId: string
  displayName: string | null
  bio: string | null
  title: string | null
  createdAt: string
  updatedAt: string
}

export interface UserMe {
  id: string
  email: string
  username: string
  status: string
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  profile: UserProfile | null
}

export interface UserSettings {
  id: string
  userId: string
  timezone: string
  language: string
  privacyMode: PrivacyMode
  notificationEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    username: string
    status: string
  }
}

export interface Goal {
  id: string
  userId: string
  title: string
  description: string | null
  startDate: string
  dueDate: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED' | string
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  goalId: string
  title: string
  description: string | null
  position: number
  status: 'ACTIVE' | 'COMPLETED' | string
  completedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Quest {
  id: string
  userId: string
  goalId: string | null
  milestoneId: string | null
  title: string
  description: string | null
  type: QuestType
  priority: number
  proofRequirement: ProofRequirement
  targetValue: string | number | null
  targetUnit: string | null
  estimatedDurationSeconds: number | null
  xpReward: number
  coinReward: number
  startAt: string | null
  dueAt: string | null
  completedAt: string | null
  archivedAt: string | null
  status: 'ACTIVE' | 'ARCHIVED' | string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  isPinned: boolean
}

export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  interval?: number
  daysOfWeek?: number[]
  timeOfDay?: string
}

export interface QuestSchedule {
  id: string
  questId: string
  scheduleType: ScheduleType
  timezone: string
  startAt: string
  endAt: string | null
  recurrenceRule: RecurrenceRule | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface QuestExecution {
  id: string
  questId: string
  userId: string
  scheduleId: string | null
  status: ExecutionStatus
  scheduledAt: string | null
  startedAt: string | null
  completedAt: string | null
  abandonedAt: string | null
  progressValue: string | number
  durationSeconds: number
  createdAt: string
  updatedAt: string
  quest?: Pick<Quest, 'id' | 'title' | 'type' | 'xpReward' | 'coinReward'>
}

export interface TodayScheduleItem {
  id: string
  questId: string
  scheduleType: ScheduleType
  timeOfDay: string
  quest: Pick<Quest, 'id' | 'title' | 'type' | 'priority' | 'xpReward' | 'coinReward' | 'isPinned'>
}

export interface TodayData {
  date: string
  timezone: string
  summary: {
    totalTasks: number
    completedTasks: number
    completionRatePercentage: number
    totalFocusDurationSeconds: number
  }
  executions: QuestExecution[]
  schedules: TodayScheduleItem[]
  streak: {
    currentCount: number
    longestCount: number
    isQualifiedToday: boolean
    lastQualifiedDate: string | null
  }
  gamification: {
    totalXp: number
    level: number
    coinBalance: number
  }
}

export interface CreateQuestInput {
  title: string
  description?: string
  goalId?: string | null
  milestoneId?: string | null
  type?: QuestType
  priority?: number
  proofRequirement?: ProofRequirement
  targetValue?: number | null
  targetUnit?: string | null
  estimatedDurationSeconds?: number | null
  startAt?: string | null
  dueAt?: string | null
}

// Preview-only contract for Social & Journey Log (pending origin/feature/friends-and-social merge)
export interface SocialPreviewItem {
  id: string
  authorName: string
  authorTag: string
  caption: string
  questBadge: string
  timeLabel: string
  cheerCount: number
  illustrationKey?: 'study-corner' | 'milestone-moment' | 'morning-run' | 'hydration-habit'
  illustrationAlt?: string
  category?: 'focus' | 'milestone' | 'habit' | 'activity'
}
