import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { foxDialogueBus } from '@/features/mascot/dialogue/dialogueBus'
import { goalsApi } from '@/services/api/goalsApi'
import { milestonesApi } from '@/services/api/milestonesApi'
import { questsApi, type ListQuestsParams } from '@/services/api/questsApi'
import { MOCK_GOALS, MOCK_MILESTONES } from '@/services/repositories/fixtures'
import { getPreviewQuests, setPreviewQuestPinned } from '@/services/repositories/previewWorkState'
import { findCollaborativePreviewById } from '@/features/work/questUtils'
import { useAuthStore } from '@/stores/authStore'
import type { CreateQuestInput } from '@/types/domain'

export const workKeys = {
  goals: (authed = true) => ['work', 'goals', authed] as const,
  goalById: (goalId: string, authed = true) => ['work', 'goal', goalId, authed] as const,
  milestones: (goalId: string, authed = true) => ['work', 'milestones', goalId, authed] as const,
  quests: (filters: ListQuestsParams, authed = true) => ['work', 'quests', filters, authed] as const,
  questById: (questId: string, authed = true) => ['work', 'quest', questId, authed] as const
}

export function useWorkGoalsQuery() {
  const authed = useAuthStore((s) => Boolean(s.accessToken.trim()))
  return useQuery({
    queryKey: workKeys.goals(authed),
    queryFn: () => (authed ? goalsApi.listGoals() : Promise.resolve(MOCK_GOALS)),
    retry: false
  })
}

export function useWorkGoalByIdQuery(goalId: string | undefined) {
  const authed = useAuthStore((s) => Boolean(s.accessToken.trim()))
  return useQuery({
    queryKey: workKeys.goalById(goalId ?? 'none', authed),
    queryFn: async () => {
      if (!goalId) return null
      const collab = findCollaborativePreviewById(goalId)
      if (collab) return collab.goal
      if (authed) return goalsApi.getGoalById(goalId)
      return MOCK_GOALS.find((g) => g.id === goalId) ?? null
    },
    enabled: Boolean(goalId),
    retry: false
  })
}

export function useGoalMilestonesQuery(goalId: string | null) {
  const authed = useAuthStore((s) => Boolean(s.accessToken.trim()))
  return useQuery({
    queryKey: workKeys.milestones(goalId ?? 'none', authed),
    queryFn: () =>
      authed
        ? milestonesApi.listByGoal(goalId!)
        : Promise.resolve(goalId ? (MOCK_MILESTONES[goalId] ?? []) : []),
    enabled: Boolean(goalId),
    retry: false
  })
}

export function useWorkQuestsQuery(filters: ListQuestsParams) {
  const authed = useAuthStore((s) => Boolean(s.accessToken.trim()))
  return useQuery({
    queryKey: workKeys.quests(filters, authed),
    queryFn: () => {
      if (authed) return questsApi.listQuests(filters)
      const q = (filters.search ?? '').trim().toLowerCase()
      return Promise.resolve(
        getPreviewQuests().filter((item) => {
          if (filters.status && item.status !== filters.status) return false
          if (filters.goalId && item.goalId !== filters.goalId) return false
          if (filters.milestoneId && item.milestoneId !== filters.milestoneId) return false
          if (q && !item.title.toLowerCase().includes(q)) return false
          return true
        })
      )
    },
    retry: false
  })
}

export function useWorkQuestByIdQuery(questId: string | undefined) {
  const authed = useAuthStore((s) => Boolean(s.accessToken.trim()))
  return useQuery({
    queryKey: workKeys.questById(questId ?? 'none', authed),
    queryFn: async () => {
      if (!questId) return null
      if (authed) return questsApi.getQuestById(questId)
      return getPreviewQuests().find((q) => q.id === questId) ?? null
    },
    enabled: Boolean(questId),
    retry: false
  })
}

export function useGoalMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['work', 'goals'] })
    qc.invalidateQueries({ queryKey: ['dashboard', 'goals'] })
  }

  return {
    createGoal: useMutation({
      mutationFn: goalsApi.createGoal,
      onSuccess: invalidate
    }),
    updateGoal: useMutation({
      mutationFn: ({
        goalId,
        input
      }: {
        goalId: string
        input: Parameters<typeof goalsApi.updateGoal>[1]
      }) => goalsApi.updateGoal(goalId, input),
      onSuccess: invalidate
    }),
    pauseGoal: useMutation({ mutationFn: goalsApi.pauseGoal, onSuccess: invalidate }),
    resumeGoal: useMutation({ mutationFn: goalsApi.resumeGoal, onSuccess: invalidate }),
    completeGoal: useMutation({ mutationFn: goalsApi.completeGoal, onSuccess: invalidate }),
    archiveGoal: useMutation({ mutationFn: goalsApi.archiveGoal, onSuccess: invalidate })
  }
}

export function useMilestoneMutations(goalId: string | null) {
  const qc = useQueryClient()
  const invalidate = () => {
    if (goalId) {
      qc.invalidateQueries({ queryKey: workKeys.milestones(goalId) })
    }
    qc.invalidateQueries({ queryKey: ['dashboard', 'goals'] })
  }

  return {
    createMilestone: useMutation({
      mutationFn: (input: { title: string; description?: string | null }) =>
        milestonesApi.create(goalId!, input),
      onSuccess: invalidate
    }),
    updateMilestone: useMutation({
      mutationFn: ({
        milestoneId,
        input
      }: {
        milestoneId: string
        input: { title?: string; description?: string | null }
      }) => milestonesApi.update(milestoneId, input),
      onSuccess: invalidate
    }),
    completeMilestone: useMutation({
      mutationFn: milestonesApi.complete,
      onSuccess: invalidate
    }),
    deleteMilestone: useMutation({
      mutationFn: milestonesApi.remove,
      onSuccess: invalidate
    }),
    reorderMilestones: useMutation({
      mutationFn: (milestoneIds: string[]) => milestonesApi.reorder(goalId!, milestoneIds),
      onSuccess: invalidate
    })
  }
}

export function useQuestMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['work', 'quests'] })
    qc.invalidateQueries({ queryKey: ['work', 'quest'] })
    qc.invalidateQueries({ queryKey: ['dashboard', 'quests'] })
    qc.invalidateQueries({ queryKey: ['dashboard', 'today'] })
  }

  return {
    createQuest: useMutation({
      mutationFn: (input: CreateQuestInput) => questsApi.createQuest(input),
      onSuccess: () => {
        invalidate()
        foxDialogueBus.emit({ event: 'TASK_CREATED' })
      }
    }),
    updateQuest: useMutation({
      mutationFn: ({ questId, input }: { questId: string; input: Partial<CreateQuestInput> }) =>
        questsApi.updateQuest(questId, input),
      onSuccess: () => {
        invalidate()
        foxDialogueBus.emit({ event: 'TASK_UPDATED' })
      }
    }),
    deleteQuest: useMutation({ mutationFn: questsApi.deleteQuest, onSuccess: invalidate }),
    pinQuest: useMutation({
      mutationFn: async (questId: string) => {
        if (!useAuthStore.getState().isAuthenticated()) {
          const updated = setPreviewQuestPinned(questId, true)
          if (!updated) throw new Error('Không tìm thấy nhiệm vụ xem trước.')
          return updated
        }
        return questsApi.pinQuest(questId)
      },
      onSuccess: () => {
        invalidate()
        foxDialogueBus.emit({ event: 'PIN_UPDATED' })
      }
    }),
    unpinQuest: useMutation({
      mutationFn: async (questId: string) => {
        if (!useAuthStore.getState().isAuthenticated()) {
          const updated = setPreviewQuestPinned(questId, false)
          if (!updated) throw new Error('Không tìm thấy nhiệm vụ xem trước.')
          return updated
        }
        return questsApi.unpinQuest(questId)
      },
      onSuccess: () => {
        invalidate()
        foxDialogueBus.emit({ event: 'PIN_UPDATED' })
      }
    }),
    archiveQuest: useMutation({ mutationFn: questsApi.archiveQuest, onSuccess: invalidate }),
    restoreQuest: useMutation({ mutationFn: questsApi.restoreQuest, onSuccess: invalidate })
  }
}
