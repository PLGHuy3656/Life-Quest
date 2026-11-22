import { apiRequest } from './httpClient'
import type { QuestSchedule, RecurrenceRule, ScheduleType } from '@/types/domain'

export const schedulesApi = {
  listByQuest: (questId: string, isActive?: boolean) =>
    apiRequest<QuestSchedule[]>(`/quests/${questId}/schedules`, {
      method: 'GET',
      query: isActive !== undefined ? { isActive } : undefined
    }),

  create: (
    questId: string,
    input: {
      scheduleType: ScheduleType
      timezone: string
      startAt: string
      endAt?: string | null
      recurrenceRule?: RecurrenceRule
    }
  ) =>
    apiRequest<QuestSchedule>(`/quests/${questId}/schedules`, {
      method: 'POST',
      body: input
    }),

  deactivate: (scheduleId: string) =>
    apiRequest<{ id: string; isActive: boolean; message: string }>(`/schedules/${scheduleId}`, {
      method: 'DELETE'
    })
}
