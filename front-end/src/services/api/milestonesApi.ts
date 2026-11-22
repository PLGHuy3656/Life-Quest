import { apiRequest } from './httpClient'
import type { Milestone } from '@/types/domain'

export const milestonesApi = {
  listByGoal: (goalId: string) =>
    apiRequest<Milestone[]>(`/goals/${goalId}/milestones`, { method: 'GET' }),

  create: (goalId: string, input: { title: string; description?: string | null }) =>
    apiRequest<Milestone>(`/goals/${goalId}/milestones`, {
      method: 'POST',
      body: input
    }),

  reorder: (goalId: string, milestoneIds: string[]) =>
    apiRequest<Milestone[]>(`/goals/${goalId}/milestones/reorder`, {
      method: 'PATCH',
      body: { milestoneIds }
    }),

  complete: (milestoneId: string) =>
    apiRequest<Milestone>(`/milestones/${milestoneId}/complete`, { method: 'POST' }),

  remove: (milestoneId: string) =>
    apiRequest<Milestone>(`/milestones/${milestoneId}`, { method: 'DELETE' })
}
