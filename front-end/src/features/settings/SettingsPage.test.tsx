import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from './SettingsPage'
import { useAuthStore } from '@/stores/authStore'
import { MOCK_USER_ME } from '@/services/repositories/fixtures'

function renderSettings() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('SettingsPage (Profile & UserSettings)', () => {
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

  it('loads and patches /users/me and /users/me/settings', async () => {
    const user = userEvent.setup()
    let patchedProfile: unknown = null
    let patchedSettings: unknown = null

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'

      if (url.endsWith('/users/me/settings') && method === 'GET') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                id: 's1',
                userId: 'u1',
                timezone: 'Asia/Ho_Chi_Minh',
                language: 'vi',
                privacyMode: 'FRIENDS',
                notificationEnabled: true,
                createdAt: '2026-11-01T00:00:00.000Z',
                updatedAt: '2026-11-01T00:00:00.000Z'
              }
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      if (url.endsWith('/users/me/settings') && method === 'PATCH') {
        patchedSettings = JSON.parse(String(init?.body))
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: patchedSettings }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      if (url.endsWith('/users/me') && method === 'GET') {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: MOCK_USER_ME }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      if (url.endsWith('/users/me') && method === 'PATCH') {
        patchedProfile = JSON.parse(String(init?.body))
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: patchedProfile }), {
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

    renderSettings()

    const nameInput = await screen.findByLabelText(/Tên hiển thị/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Minh Quân')
    await user.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))

    await waitFor(() => {
      expect(patchedProfile).toMatchObject({ displayName: 'Minh Quân' })
    })

    await user.selectOptions(screen.getByLabelText(/Quyền riêng tư/i), 'PRIVATE')
    await user.click(screen.getByRole('button', { name: 'Lưu cài đặt' }))

    await waitFor(() => {
      expect(patchedSettings).toMatchObject({ privacyMode: 'PRIVATE' })
    })
  })
})
