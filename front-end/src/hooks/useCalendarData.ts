import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { questsApi } from '@/services/api/questsApi'
import {
  schedulesApi,
  type CreateScheduleInput,
  type UpdateScheduleInput
} from '@/services/api/schedulesApi'
import { todayApi } from '@/services/api/todayApi'

export const calendarKeys = {
  today: (date: string) => ['calendar', 'today', date] as const,
  quests: () => ['calendar', 'activeQuests'] as const,
  schedules: (questId: string) => ['calendar', 'schedules', questId] as const
}

export function useCalendarTodayQuery(date: string) {
  return useQuery({
    queryKey: calendarKeys.today(date),
    queryFn: () => todayApi.getToday(date),
    retry: false
  })
}

export function useCalendarQuestsQuery() {
  return useQuery({
    queryKey: calendarKeys.quests(),
    queryFn: () => questsApi.listQuests({ status: 'ACTIVE' }),
    retry: false
  })
}

export function useQuestSchedulesQuery(questId: string | null) {
  return useQuery({
    queryKey: calendarKeys.schedules(questId ?? 'none'),
    queryFn: () => schedulesApi.listByQuest(questId!),
    enabled: Boolean(questId),
    retry: false
  })
}

export function useScheduleMutations(questId: string | null) {
  const qc = useQueryClient()
  const invalidate = () => {
    if (questId) qc.invalidateQueries({ queryKey: calendarKeys.schedules(questId) })
    qc.invalidateQueries({ queryKey: ['calendar', 'today'] })
    qc.invalidateQueries({ queryKey: ['dashboard', 'today'] })
  }

  return {
    createSchedule: useMutation({
      mutationFn: (input: CreateScheduleInput) => schedulesApi.create(questId!, input),
      onSuccess: invalidate
    }),
    updateSchedule: useMutation({
      mutationFn: ({ scheduleId, input }: { scheduleId: string; input: UpdateScheduleInput }) =>
        schedulesApi.update(scheduleId, input),
      onSuccess: invalidate
    }),
    deactivateSchedule: useMutation({
      mutationFn: schedulesApi.deactivate,
      onSuccess: invalidate
    })
  }
}
