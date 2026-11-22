import { API_CONFIG } from '@/services/api/config'
import { goalsApi } from '@/services/api/goalsApi'
import { milestonesApi } from '@/services/api/milestonesApi'
import { questsApi } from '@/services/api/questsApi'
import { todayApi } from '@/services/api/todayApi'
import { usersApi } from '@/services/api/usersApi'
import { useAuthStore } from '@/stores/authStore'
import { ApiClientError, type RepositoryResult } from '@/types/api'
import type {
  CreateQuestInput,
  Goal,
  Milestone,
  Quest,
  SocialPreviewItem,
  TodayData,
  UserMe
} from '@/types/domain'
import {
  MOCK_GOALS,
  MOCK_MILESTONES,
  MOCK_QUESTS,
  MOCK_SOCIAL_PREVIEW,
  MOCK_TODAY_DATA,
  MOCK_USER_ME
} from './fixtures'

export interface GoalWithMilestones {
  goal: Goal
  milestones: Milestone[]
}

function shouldUseLive(): boolean {
  if (API_CONFIG.dataMode === 'live') return true
  return useAuthStore.getState().isAuthenticated()
}

export const dashboardRepository = {
  // LIVE when authenticated (or strict live mode); explicit MOCK preview when unauthenticated in hybrid dev mode.
  // NEVER silently falls back to mock if a live API call fails!
  async getUserMe(): Promise<RepositoryResult<UserMe>> {
    if (!shouldUseLive()) {
      return {
        data: MOCK_USER_ME,
        source: 'MOCK',
        note: 'Chế độ xem trước (chưa đăng nhập Backend).'
      }
    }
    const data = await usersApi.getMe()
    return { data, source: 'LIVE' }
  },

  async getToday(date?: string): Promise<RepositoryResult<TodayData>> {
    if (!shouldUseLive()) {
      return {
        data: MOCK_TODAY_DATA,
        source: 'MOCK',
        note: 'Dữ liệu mẫu Today (đăng nhập để gọi GET /api/v1/today).'
      }
    }
    const data = await todayApi.getToday(date)
    return { data, source: 'LIVE' }
  },

  async getQuests(search?: string): Promise<RepositoryResult<Quest[]>> {
    if (!shouldUseLive()) {
      const normalized = search?.trim().toLowerCase()
      const filtered = normalized
        ? MOCK_QUESTS.filter((q) => q.title.toLowerCase().includes(normalized))
        : MOCK_QUESTS
      return {
        data: filtered,
        source: 'MOCK',
        note: 'Dữ liệu mẫu Quests (đăng nhập để gọi GET /api/v1/quests).'
      }
    }
    const data = await questsApi.listQuests({
      status: 'ACTIVE',
      search: search?.trim() || undefined
    })
    return { data, source: 'LIVE' }
  },

  async getGoalsWithMilestones(): Promise<RepositoryResult<GoalWithMilestones[]>> {
    if (!shouldUseLive()) {
      return {
        data: MOCK_GOALS.map((goal) => ({
          goal,
          milestones: MOCK_MILESTONES[goal.id] ?? []
        })),
        source: 'MOCK',
        note: 'Dữ liệu mẫu Goals & Milestones (đăng nhập để gọi API thật).'
      }
    }
    const goals = await goalsApi.listGoals()
    const activeGoals = goals.filter((g) => g.status !== 'ARCHIVED').slice(0, 4)
    const milestonesLists = await Promise.all(
      activeGoals.map((g) => milestonesApi.listByGoal(g.id))
    )
    return {
      data: activeGoals.map((goal, idx) => ({
        goal,
        milestones: milestonesLists[idx] ?? []
      })),
      source: 'LIVE'
    }
  },

  // Mutations are ALWAYS LIVE — never faked as successful when unauthenticated.
  async createQuest(input: CreateQuestInput): Promise<Quest> {
    if (!useAuthStore.getState().isAuthenticated()) {
      throw new ApiClientError({
        status: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Cần đăng nhập Backend để tạo Quest thật (POST /api/v1/quests).'
      })
    }
    return questsApi.createQuest(input)
  },

  async pinQuest(questId: string): Promise<Quest> {
    if (!useAuthStore.getState().isAuthenticated()) {
      throw new ApiClientError({
        status: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Cần đăng nhập Backend để ghim Quest (POST /api/v1/quests/:id/pin).'
      })
    }
    return questsApi.pinQuest(questId)
  },

  async unpinQuest(questId: string): Promise<Quest> {
    if (!useAuthStore.getState().isAuthenticated()) {
      throw new ApiClientError({
        status: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Cần đăng nhập Backend để bỏ ghim Quest (DELETE /api/v1/quests/:id/pin).'
      })
    }
    return questsApi.unpinQuest(questId)
  },

  // Social feed is pending merge of origin/feature/friends-and-social into develop.
  async getSocialPreview(): Promise<RepositoryResult<SocialPreviewItem[]>> {
    return {
      data: MOCK_SOCIAL_PREVIEW,
      source: 'MOCK',
      note: 'Chờ merge nhánh Backend feature/friends-and-social vào develop.'
    }
  },

  // Quest execution completion does not have a Backend endpoint on develop yet.
  async completeQuestExecution(): Promise<never> {
    throw new ApiClientError({
      status: 501,
      code: 'FEATURE_UNAVAILABLE',
      message: 'Backend chưa có endpoint ghi nhận hoàn thành QuestExecution trên nhánh develop.'
    })
  }
}
