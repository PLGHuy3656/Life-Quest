import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DesktopHeader } from './DesktopHeader'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { MOCK_TODAY_DATA, MOCK_USER_ME } from '@/services/repositories/fixtures'

function renderHeader(onLogout = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    onLogout,
    ...render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <DesktopHeader onLogout={onLogout} />
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
}

describe('DesktopHeader (Claude Canvas 3-Island Restoration)', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    useAuthStore.getState().clearSession()
    useUiStore.getState().setSearchQuery('')
    useUiStore.getState().setReducedMotion(false)
    useUiStore.getState().closeSheet()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('connects inline search input to uiStore.searchQuery and hides unverified stat pills when unauthenticated', async () => {
    const user = userEvent.setup()
    renderHeader()

    const searchInput = screen.getByRole('searchbox', { name: 'Tìm kiếm nhiệm vụ' })
    await user.type(searchInput, 'chạy bộ')
    expect(useUiStore.getState().searchQuery).toBe('chạy bộ')

    // Never invents streak/coin values when unauthenticated
    expect(screen.queryByTestId('header-streak-pill')).not.toBeInTheDocument()
    expect(screen.queryByTestId('header-coin-pill')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Đăng nhập/i })).toBeInTheDocument()
  })

  it('renders LIVE streak/coin pills, initials avatar, profile dropdown, and logout when authenticated', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().setSession({
      accessToken: 'live-header-token',
      refreshToken: 'refresh-tok',
      user: { id: 'u1', email: 'u@test.com', username: 'minhquan', status: 'ACTIVE' }
    })

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/today')) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: MOCK_TODAY_DATA }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      if (url.includes('/users/me')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                ...MOCK_USER_ME,
                profile: { ...MOCK_USER_ME.profile!, displayName: 'Minh Quân' }
              }
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    }) as unknown as typeof fetch

    const { onLogout } = renderHeader()

    await waitFor(() => {
      expect(screen.getByTestId('header-streak-pill')).toHaveTextContent('0')
      expect(screen.getByTestId('header-coin-pill')).toHaveTextContent('320')
    })

    const profileBtn = await screen.findByRole('button', { name: /Tài khoản của Minh Quân/i })
    expect(profileBtn).toHaveTextContent('MQ')
    await user.click(profileBtn)

    const logoutItem = await screen.findByRole('menuitem', { name: 'Đăng xuất' })
    await user.click(logoutItem)
    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})
