import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/services/api/usersApi'

export const settingsKeys = {
  me: () => ['settings', 'me'] as const,
  settings: () => ['settings', 'preferences'] as const
}

export function useProfileQuery() {
  return useQuery({
    queryKey: settingsKeys.me(),
    queryFn: () => usersApi.getMe(),
    retry: false
  })
}

export function useUserSettingsQuery() {
  return useQuery({
    queryKey: settingsKeys.settings(),
    queryFn: () => usersApi.getMySettings(),
    retry: false
  })
}

export function useSettingsMutations() {
  const qc = useQueryClient()
  return {
    updateProfile: useMutation({
      mutationFn: usersApi.updateMe,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: settingsKeys.me() })
        qc.invalidateQueries({ queryKey: ['dashboard', 'userMe'] })
      }
    }),
    updateSettings: useMutation({
      mutationFn: usersApi.updateMySettings,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: settingsKeys.settings() })
        qc.invalidateQueries({ queryKey: ['calendar', 'today'] })
        qc.invalidateQueries({ queryKey: ['dashboard', 'today'] })
      }
    })
  }
}
