import { apiRequest } from './httpClient'
import type { UserMe, UserProfile, UserSettings } from '@/types/domain'

export const usersApi = {
  getMe: () => apiRequest<UserMe>('/users/me', { method: 'GET' }),

  updateMe: (input: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'title'>>) =>
    apiRequest<UserProfile>('/users/me', {
      method: 'PATCH',
      body: input
    }),

  getMySettings: () => apiRequest<UserSettings>('/users/me/settings', { method: 'GET' }),

  updateMySettings: (
    input: Partial<Pick<UserSettings, 'timezone' | 'language' | 'privacyMode' | 'notificationEnabled'>>
  ) =>
    apiRequest<UserSettings>('/users/me/settings', {
      method: 'PATCH',
      body: input
    })
}
