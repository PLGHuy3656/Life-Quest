import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/router'
import { CompanionProvider } from '@/features/mascot/CompanionProvider'
import { useAuthStore } from '@/stores/authStore'
import { MOCK_LOGIN_CREDENTIALS, useMockProfileStore } from '@/stores/mockProfileStore'

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <CompanionProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </CompanionProvider>
    </QueryClientProvider>,
  )
}

describe('Profile Page & Local Mock Account', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    useAuthStore.getState().clearSession()
    useMockProfileStore.getState().deactivateMockSession()
    useMockProfileStore.getState().resetProfile()
  })

  it('signs in with mock credentials on /login, navigates to /profile, and persists profile edits in memory', async () => {
    const user = userEvent.setup()
    renderAt('/login')

    await user.type(screen.getByLabelText('Email'), MOCK_LOGIN_CREDENTIALS.email)
    await user.type(screen.getByLabelText('Mật khẩu'), MOCK_LOGIN_CREDENTIALS.password)
    await user.click(screen.getByTestId('login-submit-btn'))

    expect(await screen.findByTestId('profile-page')).toBeInTheDocument()
    expect(screen.getByTestId('profile-mock-session-bar')).toBeInTheDocument()
    expect(screen.getByTestId('profile-display-name')).toHaveTextContent('Minh Anh')
    expect(window.localStorage.length).toBe(0)

    // Open Edit Profile modal & update name, handle, bio
    await user.click(screen.getByTestId('profile-edit-btn'))
    expect(screen.getByTestId('profile-edit-modal')).toBeInTheDocument()

    const nameInput = screen.getByLabelText(/Tên hiển thị/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Hoàng Nam')

    const handleInput = screen.getByLabelText(/Tên người dùng/i)
    await user.clear(handleInput)
    await user.type(handleInput, 'hoangnam_lq')

    const bioInput = screen.getByLabelText(/Giới thiệu ngắn/i)
    await user.clear(bioInput)
    await user.type(bioInput, 'Chinh phục 30 ngày chạy bộ cùng Fox V2.')

    await user.click(screen.getByTestId('profile-save-btn'))

    expect(screen.queryByTestId('profile-edit-modal')).not.toBeInTheDocument()
    expect(screen.getByTestId('profile-display-name')).toHaveTextContent('Hoàng Nam')
    expect(screen.getByTestId('profile-handle')).toHaveTextContent('@hoangnam_lq')
    expect(screen.getByTestId('profile-bio')).toHaveTextContent(
      'Chinh phục 30 ngày chạy bộ cùng Fox V2.',
    )
    expect(screen.getByTestId('profile-toast')).toHaveTextContent(/Đã lưu thay đổi hồ sơ/i)
  })
})
