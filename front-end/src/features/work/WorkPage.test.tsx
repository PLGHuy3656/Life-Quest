import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkPage } from './WorkPage'
import { useAuthStore } from '@/stores/authStore'
import { MOCK_GOALS, MOCK_MILESTONES, MOCK_QUESTS } from '@/services/repositories/fixtures'

function renderWork() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <WorkPage />
    </QueryClientProvider>
  )
}

describe('WorkPage (Goals, Milestones, Quests)', () => {
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

  it('lists goals/milestones, pauses a goal, reorders milestones, and pins a quest', async () => {
    const user = userEvent.setup()
    const called: string[] = []

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'
      called.push(`${method} ${url}`)

      if (url.endsWith('/goals') && method === 'GET') {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: MOCK_GOALS }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      if (url.includes('/milestones/reorder') && method === 'PATCH') {
        return Promise.resolve(
          new Response(
            JSON.stringify({ success: true, data: MOCK_MILESTONES[MOCK_GOALS[0].id] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      if (url.includes('/milestones') && method === 'GET') {
        return Promise.resolve(
          new Response(
            JSON.stringify({ success: true, data: MOCK_MILESTONES[MOCK_GOALS[0].id] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      if (url.includes('/pause') && method === 'POST') {
        return Promise.resolve(
          new Response(
            JSON.stringify({ success: true, data: { ...MOCK_GOALS[0], status: 'PAUSED' } }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      if (url.includes('/quests') && url.endsWith('/pin') && method === 'POST') {
        return Promise.resolve(
          new Response(
            JSON.stringify({ success: true, data: { ...MOCK_QUESTS[3], isPinned: true } }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
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

    renderWork()

    expect(await screen.findByText(MOCK_GOALS[0].title)).toBeInTheDocument()
    expect(
      await screen.findByText(/Khôi phục thiết kế Claude Canvas & FE-01 Foundation/i)
    ).toBeInTheDocument()

    // Pause first goal
    const pauseBtns = screen.getAllByRole('button', { name: /Tạm dừng/i })
    await user.click(pauseBtns[0])
    await waitFor(() => {
      expect(called.some((c) => c.startsWith('POST ') && c.includes('/pause'))).toBe(true)
    })

    // Reorder first milestone down
    const moveDownBtn = screen.getByRole('button', {
      name: /Đẩy xuống Khôi phục thiết kế Claude Canvas/i
    })
    await user.click(moveDownBtn)
    await waitFor(() => {
      expect(called.some((c) => c.startsWith('PATCH ') && c.includes('/milestones/reorder'))).toBe(
        true
      )
    })

    // Switch to Quests tab and pin unpinned quest
    await user.click(screen.getByRole('tab', { name: /Nhiệm vụ/i }))
    expect(await screen.findByText(MOCK_QUESTS[3].title)).toBeInTheDocument()
    const pinBtn = screen.getByRole('button', { name: /^Ghim$/i })
    await user.click(pinBtn)
    await waitFor(() => {
      expect(called.some((c) => c.startsWith('POST ') && c.endsWith('/pin'))).toBe(true)
    })
  })

  it('propagates Backend API errors cleanly without faking success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: 'GOAL_ACCESS_DENIED', message: 'No access to goals' }
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    ) as unknown as typeof fetch

    renderWork()
    expect(await screen.findByText(/GOAL_ACCESS_DENIED/)).toBeInTheDocument()
  })
})
