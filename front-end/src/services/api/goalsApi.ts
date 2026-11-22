import { apiRequest } from './httpClient'
import type { Goal } from '@/types/domain'

export const goalsApi = {
  listGoals: () => apiRequest<Goal[]>('/goals', { method: 'GET' }),

  getGoalById: (goalId: string) => apiRequest<Goal>(`/goals/${goalId}`, { method: 'GET' }),

  createGoal: (input: { title: string; description?: string; startDate: string; dueDate: string }) =>
    apiRequest<Goal>('/goals', {
      method: 'POST',
      body: input
    }),

  updateGoal: (
    goalId: string,
    input: Partial<{ title: string; description: string; startDate: string; dueDate: string }>
  ) =>
    apiRequest<Goal>(`/goals/${goalId}`, {
      method: 'PATCH',
      body: input
    }),

  pauseGoal: (goalId: string) => apiRequest<Goal>(`/goals/${goalId}/pause`, { method: 'POST' }),
  resumeGoal: (goalId: string) => apiRequest<Goal>(`/goals/${goalId}/resume`, { method: 'POST' }),
  completeGoal: (goalId: string) => apiRequest<Goal>(`/goals/${goalId}/complete`, { method: 'POST' }),
  archiveGoal: (goalId: string) => apiRequest<Goal>(`/goals/${goalId}/archive`, { method: 'POST' })
}
