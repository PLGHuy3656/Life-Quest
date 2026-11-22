import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarPage } from './CalendarPage'
import { useAuthStore } from '@/stores/authStore'
import { MOCK_QUESTS, MOCK_TODAY_DATA } from '@/services/repositories/fixtures'

function renderCalendar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <CalendarPage />
    </QueryClientProvider>
  )
}

describe('CalendarPage & Schedules validation', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    useAuthStore.getState().setSession({
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
      user: { id: 'u1', email: 'a@b.com', username: 'tester', status: 'ACTIVE' }
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('loads GET /today?date=YYYY-MM-DD and validates RECURRING schedule creation', async () => {
    const user = userEvent.setup()
    const calledUrls: string[] = []
    let postedScheduleBody: unknown = null

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'
      calledUrls.push(`${method} ${url}`)

      if (url.includes('/today')) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: MOCK_TODAY_DATA }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      if (url.includes('/schedules') && method === 'POST') {
        postedScheduleBody = init?.body ? JSON.parse(String(init.body)) : null
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                id: 'sched-1',
                questId: MOCK_QUESTS[0].id,
                scheduleType: 'RECURRING',
                timezone: 'Asia/Ho_Chi_Minh',
                startAt: '2026-11-22T01:30:00.000Z',
                endAt: null,
                recurrenceRule: { frequency: 'DAILY', interval: 1, timeOfDay: '08:30' },
                isActive: true,
                createdAt: '2026-11-22T00:00:00.000Z',
                updatedAt: '2026-11-22T00:00:00.000Z'
              }
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      if (url.includes('/schedules') && method === 'GET') {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      if (url.includes('/quests') && method === 'GET') {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: MOCK_QUESTS }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    }) as unknown as typeof fetch

    renderCalendar()

    await waitFor(() => {
      expect(calledUrls.some((u) => u.includes('/today?date='))).toBe(true)
    })

    // Open Create Schedule Sheet
    const createBtn = await screen.findByRole('button', { name: /Tạo lịch/i })
    await user.click(createBtn)

    // Switch to RECURRING DAILY and submit
    await user.selectOptions(screen.getByLabelText(/Loại lịch/i), 'RECURRING')
    await user.click(screen.getByRole('button', { name: 'Lưu lịch trình' }))

    await waitFor(() => {
      expect(postedScheduleBody).toMatchObject({
        scheduleType: 'RECURRING',
        recurrenceRule: { frequency: 'DAILY', interval: 1 }
      })
    })
  })
})
