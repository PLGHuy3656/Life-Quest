import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '@/app/router'
import { CompanionProvider } from '@/features/mascot/CompanionProvider'
import { useAuthStore } from '@/stores/authStore'

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <CompanionProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </CompanionProvider>
    </QueryClientProvider>
  )
}

describe('Auth flows & ProtectedRoute', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('redirects unauthenticated users from /calendar to /login', async () => {
    renderAt('/calendar')
    expect(await screen.findByRole('heading', { name: /Đăng nhập LifeQuest/i })).toBeInTheDocument()
  })

  it('displays session expiration message on /login when session expired', async () => {
    useAuthStore.getState().expireSession('Phiên của bạn đã hết hạn.')
    renderAt('/login')
    expect(await screen.findByText('Phiên của bạn đã hết hạn.')).toBeInTheDocument()
  })

  it('shows accessible validation errors and Backend 401 login error', async () => {
    const user = userEvent.setup()
    renderAt('/login')

    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByText('Vui lòng nhập email.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument()

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    ) as unknown as typeof fetch

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Mật khẩu'), 'wrongpass123')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
  })

  it('validates Register fields matching Backend Joi rules (username 3..50, password 8..72)', async () => {
    const user = userEvent.setup()
    renderAt('/register')

    await user.type(screen.getByLabelText('Email'), 'bad-email')
    await user.type(screen.getByLabelText(/Tên đăng nhập/i), 'ab')
    await user.type(screen.getByLabelText(/^Mật khẩu/i), '1234')
    await user.type(screen.getByLabelText(/Xác nhận mật khẩu/i), '9999')
    await user.click(screen.getByRole('button', { name: 'Đăng ký' }))

    expect(await screen.findByText('Định dạng email không hợp lệ.')).toBeInTheDocument()
    expect(screen.getByText('Tên đăng nhập phải từ 3 đến 50 ký tự.')).toBeInTheDocument()
    expect(screen.getByText('Mật khẩu phải từ 8 đến 72 ký tự.')).toBeInTheDocument()
    expect(screen.getByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument()
  })
})
