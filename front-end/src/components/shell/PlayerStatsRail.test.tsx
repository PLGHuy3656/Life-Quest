import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PlayerStatsRail } from './PlayerStatsRail'
import { useAuthStore } from '@/stores/authStore'
import { MOCK_TODAY_DATA } from '@/services/repositories/fixtures'

function renderStatsRail() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <PlayerStatsRail />
    </QueryClientProvider>
  )
}

describe('FE-04A.3 PlayerStatsRail (Compact Streak, Coin, Level)', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('displays neutral "—" placeholders when unauthenticated (never fabricates demo stats) and shows accessible tooltips', async () => {
    const user = userEvent.setup()
    renderStatsRail()

    expect(screen.getByTestId('player-stats-rail')).toHaveAttribute('data-source', 'UNAVAILABLE')
    expect(screen.getByTestId('player-stat-streak')).toHaveTextContent('—')
    expect(screen.getByTestId('player-stat-coin')).toHaveTextContent('—')
    expect(screen.getByTestId('player-stat-level')).toHaveTextContent('—')

    await user.hover(screen.getByTestId('player-stat-streak'))
    expect(screen.getByTestId('player-stat-tooltip-streak')).toHaveTextContent('Chuỗi ngày')
  })

  it('displays verified LIVE Streak, Coin, and Level from GET /api/v1/today when authenticated', async () => {
    useAuthStore.getState().setSession({
      accessToken: 'live-token',
      refreshToken: 'refresh',
      user: { id: 'u1', email: 'a@b.com', username: 'tester', status: 'ACTIVE' }
    })

    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              ...MOCK_TODAY_DATA,
              streak: { currentCount: 7, longestCount: 14, isQualifiedToday: true, lastQualifiedDate: '2026-11-23' },
              gamification: { totalXp: 1250, level: 5, coinBalance: 480 }
            }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    ) as unknown as typeof fetch

    renderStatsRail()

    await waitFor(() => {
      expect(screen.getByTestId('player-stats-rail')).toHaveAttribute('data-source', 'LIVE')
      expect(screen.getByTestId('player-stat-streak')).toHaveTextContent('7')
      expect(screen.getByTestId('player-stat-coin')).toHaveTextContent('480')
      expect(screen.getByTestId('player-stat-level')).toHaveTextContent('L5')
    })
  })
})
