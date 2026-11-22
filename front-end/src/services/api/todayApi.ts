import { apiRequest } from './httpClient'
import type { TodayData } from '@/types/domain'

export const todayApi = {
  getToday: (date?: string) =>
    apiRequest<TodayData>('/today', {
      method: 'GET',
      query: date ? { date } : undefined
    })
}
