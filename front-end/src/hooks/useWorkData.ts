import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goalsApi } from '@/services/api/goalsApi'
import { milestonesApi } from '@/services/api/milestonesApi'
import { questsApi, type ListQuestsParams } from '@/services/api/questsApi'
import type { CreateQuestInput } from '@/types/domain'

export const workKeys = {
  goals: () => ['work', 'goals'] as const,
  milestones: (goalId: string) => ['work', 'milestones', goalId] as const,
  quests: (filters: ListQuestsParams) => ['work', 'quests', filters] as const
}

export function useWorkGoalsQuery() {
  return useQuery({
    queryKey: workKeys.goals(),
    queryFn: () => goalsApi.listGoals(),
    retry: false
  })
}

export function useGoalMilestonesQuery(goalId: string | null) {
  return useQuery({
    queryKey: workKeys.milestones(goalId ?? 'none'),
    queryFn: () => milestonesApi.listByGoal(goalId!),
    enabled: Boolean(goalId),
    retry: false
  })
}

export function useWorkQuestsQuery(filters: ListQuestsParams) {
  return useQuery({
    queryKey: workKeys.quests(filters),
    queryFn: () => questsApi.listQuests(filters),
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
    qc.invalidateQueries({ queryKey: ['dashboard', 'quests'] })
    qc.invalidateQueries({ queryKey: ['dashboard', 'today'] })
  }

  return {
    createQuest: useMutation({
      mutationFn: (input: CreateQuestInput) => questsApi.createQuest(input),
      onSuccess: invalidate
    }),
    updateQuest: useMutation({
      mutationFn: ({ questId, input }: { questId: string; input: Partial<CreateQuestInput> }) =>
        questsApi.updateQuest(questId, input),
      onSuccess: invalidate
    }),
    deleteQuest: useMutation({ mutationFn: questsApi.deleteQuest, onSuccess: invalidate }),
    pinQuest: useMutation({ mutationFn: questsApi.pinQuest, onSuccess: invalidate }),
    unpinQuest: useMutation({ mutationFn: questsApi.unpinQuest, onSuccess: invalidate }),
    archiveQuest: useMutation({ mutationFn: questsApi.archiveQuest, onSuccess: invalidate }),
    restoreQuest: useMutation({ mutationFn: questsApi.restoreQuest, onSuccess: invalidate })
  }
}
