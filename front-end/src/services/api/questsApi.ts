import { apiRequest } from './httpClient'
import type { CreateQuestInput, Quest } from '@/types/domain'

export interface ListQuestsParams {
  status?: 'ACTIVE' | 'ARCHIVED'
  goalId?: string
  milestoneId?: string
  search?: string
}

export const questsApi = {
  listQuests: (params?: ListQuestsParams) =>
    apiRequest<Quest[]>('/quests', {
      method: 'GET',
      query: params as Record<string, string | undefined> | undefined
    }),

  getQuestById: (questId: string) => apiRequest<Quest>(`/quests/${questId}`, { method: 'GET' }),

  createQuest: (input: CreateQuestInput) =>
    apiRequest<Quest>('/quests', {
      method: 'POST',
      body: input
    }),

  updateQuest: (questId: string, input: Partial<CreateQuestInput>) =>
    apiRequest<Quest>(`/quests/${questId}`, {
      method: 'PATCH',
      body: input
    }),

  deleteQuest: (questId: string) => apiRequest<Quest>(`/quests/${questId}`, { method: 'DELETE' }),

  pinQuest: (questId: string) => apiRequest<Quest>(`/quests/${questId}/pin`, { method: 'POST' }),

  unpinQuest: (questId: string) => apiRequest<Quest>(`/quests/${questId}/pin`, { method: 'DELETE' }),

  archiveQuest: (questId: string) =>
    apiRequest<Quest>(`/quests/${questId}/archive`, { method: 'POST' }),

  restoreQuest: (questId: string) =>
    apiRequest<Quest>(`/quests/${questId}/restore`, { method: 'POST' })
}
