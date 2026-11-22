import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dashboardRepository } from '@/services/repositories/dashboardRepository'
import { useAuthStore } from '@/stores/authStore'
import type { CreateQuestInput } from '@/types/domain'

export const dashboardKeys = {
  userMe: (authed: boolean) => ['dashboard', 'userMe', authed] as const,
  today: (authed: boolean, date?: string) => ['dashboard', 'today', authed, date ?? 'today'] as const,
  quests: (authed: boolean, search?: string) => ['dashboard', 'quests', authed, search ?? ''] as const,
  goals: (authed: boolean) => ['dashboard', 'goals', authed] as const,
  socialPreview: () => ['dashboard', 'socialPreview'] as const
}

export function useUserMeQuery() {
  const authed = useAuthStore((s) => Boolean(s.accessToken.trim()))
  return useQuery({
    queryKey: dashboardKeys.userMe(authed),
    queryFn: () => dashboardRepository.getUserMe(),
    retry: false
  })
}

export function useTodayQuery(date?: string) {
  const authed = useAuthStore((s) => Boolean(s.accessToken.trim()))
  return useQuery({
    queryKey: dashboardKeys.today(authed, date),
    queryFn: () => dashboardRepository.getToday(date),
    retry: false
  })
}

export function useQuestsQuery(search?: string) {
  const authed = useAuthStore((s) => Boolean(s.accessToken.trim()))
  return useQuery({
    queryKey: dashboardKeys.quests(authed, search),
    queryFn: () => dashboardRepository.getQuests(search),
    retry: false
  })
}

export function useGoalsWithMilestonesQuery() {
  const authed = useAuthStore((s) => Boolean(s.accessToken.trim()))
  return useQuery({
    queryKey: dashboardKeys.goals(authed),
    queryFn: () => dashboardRepository.getGoalsWithMilestones(),
    retry: false
  })
}

export function useSocialPreviewQuery() {
  return useQuery({
    queryKey: dashboardKeys.socialPreview(),
    queryFn: () => dashboardRepository.getSocialPreview(),
    staleTime: 60_000
  })
}

export function useCreateQuestMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateQuestInput) => dashboardRepository.createQuest(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', 'quests'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'today'] })
    }
  })
}

export function usePinQuestMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ questId, nextPinned }: { questId: string; nextPinned: boolean }) =>
      nextPinned ? dashboardRepository.pinQuest(questId) : dashboardRepository.unpinQuest(questId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', 'quests'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'today'] })
    }
  })
}
