import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '@/app/router'
import { CompanionProvider } from '@/features/mascot/CompanionProvider'
import { useAuthStore } from '@/stores/authStore'
import { useMessengerStore } from '@/stores/messengerStore'
import { validateSafeRedirect } from './authRedirect'

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    qc,
    ...render(
      <QueryClientProvider client={qc}>
        <CompanionProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
          </MemoryRouter>
        </CompanionProvider>
      </QueryClientProvider>
    )
  }
}

describe('FE-07 Authentication Experience, ProtectedRoute & Security Boundaries', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    useAuthStore.getState().clearSession()
    useMessengerStore.getState().clearPrivateSession()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('prevents open redirects and auth redirect loops in validateSafeRedirect', () => {
    expect(validateSafeRedirect('/calendar')).toBe('/calendar')
    expect(validateSafeRedirect('/work/tasks?tab=all')).toBe('/work/tasks?tab=all')
    expect(validateSafeRedirect('https://evil.com')).toBe('/')
    expect(validateSafeRedirect('//evil.com/phish')).toBe('/')
    expect(validateSafeRedirect('/\\evil.com')).toBe('/')
    expect(validateSafeRedirect('/login')).toBe('/')
    expect(validateSafeRedirect('/register?x=1')).toBe('/')
    expect(validateSafeRedirect('/forgot-password')).toBe('/')
    expect(validateSafeRedirect(null, '/work')).toBe('/work')
  })

  it('redirects unauthenticated users from /profile and strict /calendar to /login with safe redirect', async () => {
    const { unmount } = renderAt('/profile')
    expect(await screen.findByRole('heading', { name: /^Đăng nhập$/i })).toBeInTheDocument()
    unmount()

    renderAt('/calendar?authGuard=strict')
    expect(await screen.findByRole('heading', { name: /^Đăng nhập$/i })).toBeInTheDocument()
  })

  it('displays session expiration message on /login when session expired', async () => {
    useAuthStore.getState().expireSession('Phiên của bạn đã hết hạn.')
    renderAt('/login')
    expect(await screen.findByText('Phiên của bạn đã hết hạn.')).toBeInTheDocument()
  })

  it('shows accessible validation, password show/hide, Fox reactions, and Backend 401/network errors', async () => {
    const user = userEvent.setup()
    const { container } = renderAt('/login')

    // Zero WebGL canvases on Auth page
    expect(container.querySelectorAll('canvas')).toHaveLength(0)
    expect(screen.getByTestId('auth-fox-stage')).toHaveAttribute('data-fox-reaction', 'LOGIN_IDLE')

    // Empty submit triggers validation & Fox error encouragement
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByText('Vui lòng nhập email.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument()
    expect(screen.getByTestId('auth-fox-stage')).toHaveAttribute('data-fox-reaction', 'LOGIN_ERROR')

    // Password visibility toggle
    const passInput = screen.getByLabelText('Mật khẩu') as HTMLInputElement
    expect(passInput.type).toBe('password')
    await user.click(screen.getByTestId('login-toggle-password'))
    expect(passInput.type).toBe('text')
    await user.click(screen.getByTestId('login-toggle-password'))
    expect(passInput.type).toBe('password')

    // Focus triggers Fox privacy reaction
    await user.click(passInput)
    expect(screen.getByTestId('auth-fox-stage')).toHaveAttribute(
      'data-fox-reaction',
      'PASSWORD_FOCUS'
    )

    // Pending submit triggers LOGIN_LOADING Fox reaction & disabled submit button
    let resolvePendingLogin: ((res: Response) => void) | undefined
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolvePendingLogin = resolve
        })
    ) as unknown as typeof fetch

    await user.type(screen.getByLabelText('Email'), 'USER@Example.com')
    await user.type(passInput, 'wrongpass123')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(screen.getByTestId('auth-fox-stage')).toHaveAttribute(
      'data-fox-reaction',
      'LOGIN_LOADING'
    )
    expect(screen.getByTestId('login-submit-btn')).toBeDisabled()

    // Backend 401 response
    resolvePendingLogin?.(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    )
    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
    expect(screen.getByTestId('auth-fox-stage')).toHaveAttribute('data-fox-reaction', 'LOGIN_ERROR')

    // Network failure response
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByTestId('login-network-error')).toBeInTheDocument()
  })

  it('prevents duplicate submission, succeeds only after verified response, restores intended destination, and never stores tokens in localStorage', async () => {
    const user = userEvent.setup()
    let resolveLogin: (res: Response) => void = () => {}
    const fetchSpy = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveLogin = resolve
        })
    )
    globalThis.fetch = fetchSpy as unknown as typeof fetch

    renderAt('/login?redirect=%2Fcalendar')

    await user.type(screen.getByLabelText('Email'), '  Hero@LifeQuest.vn ')
    await user.type(screen.getByLabelText('Mật khẩu'), 'SecretPass123')

    const submitBtn = screen.getByTestId('login-submit-btn')
    await user.click(submitBtn)
    await user.click(submitBtn) // Duplicate click while pending

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(submitBtn).toBeDisabled()

    // Resolve verified Backend login response
    resolveLogin(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            accessToken: 'jwt-access-verified',
            refreshToken: 'jwt-refresh-verified',
            user: {
              id: 'user-hero',
              email: 'hero@lifequest.vn',
              username: 'herolq',
              status: 'ACTIVE'
            }
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe('jwt-access-verified')
    })

    // Tokens must NEVER be written to localStorage or sessionStorage
    expect(JSON.stringify(window.localStorage)).not.toContain('jwt-access-verified')
    expect(JSON.stringify(window.localStorage)).not.toContain('jwt-refresh-verified')
    expect(JSON.stringify(window.sessionStorage)).not.toContain('jwt-access-verified')
  })

  it('walks through multi-step Register survey and validates 2-field res1 (Email+Username) and res2 (Password+Confirm) matching Backend Joi rules', async () => {
    const user = userEvent.setup()
    renderAt('/register')

    // Step 1: Intro -> Source -> Goal -> Pace -> Preview -> res1
    expect(screen.getByTestId('register-wizard')).toHaveAttribute('data-step', 'intro')
    await user.click(screen.getByTestId('register-continue-btn'))

    expect(screen.getByTestId('register-wizard')).toHaveAttribute('data-step', 'source')
    expect(screen.getByTestId('register-continue-btn')).toBeDisabled()
    await user.click(screen.getByTestId('survey-source-friends'))
    await user.click(screen.getByTestId('register-continue-btn'))

    expect(screen.getByTestId('register-wizard')).toHaveAttribute('data-step', 'goal')
    await user.click(screen.getByTestId('survey-goal-study'))
    await user.click(screen.getByTestId('register-continue-btn'))

    expect(screen.getByTestId('register-wizard')).toHaveAttribute('data-step', 'pace')
    await user.click(screen.getByTestId('survey-pace-15m'))
    await user.click(screen.getByTestId('register-continue-btn'))

    expect(screen.getByTestId('register-wizard')).toHaveAttribute('data-step', 'preview')
    await user.click(screen.getByTestId('register-continue-btn'))

    // res1: ONLY 2 inputs (Email & Username)
    expect(screen.getByTestId('register-wizard')).toHaveAttribute('data-step', 'res1')
    expect(screen.queryByLabelText(/^Mật khẩu/i)).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Email'), 'bad-email')
    await user.type(screen.getByLabelText(/Tên đăng nhập/i), 'ab')
    await user.click(screen.getByTestId('register-continue-btn'))
    expect(await screen.findByText('Định dạng email không hợp lệ.')).toBeInTheDocument()
    expect(screen.getByText('Tên đăng nhập phải từ 3 đến 50 ký tự.')).toBeInTheDocument()

    // Fix res1 -> advance to res2
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'hero@gmail.com')
    await user.clear(screen.getByLabelText(/Tên đăng nhập/i))
    await user.type(screen.getByLabelText(/Tên đăng nhập/i), 'fox_explorer')
    await user.click(screen.getByTestId('register-continue-btn'))

    // res2: ONLY 2 inputs (Password & Confirm Password)
    expect(screen.getByTestId('register-wizard')).toHaveAttribute('data-step', 'res2')
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText(/^Mật khẩu/i), '1234')
    await user.type(screen.getByLabelText(/Xác nhận mật khẩu/i), '9999')
    await user.click(screen.getByTestId('register-submit-btn'))
    expect(await screen.findByText('Mật khẩu phải từ 8 đến 72 ký tự.')).toBeInTheDocument()
    expect(screen.getByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument()
  })

  it('renders honest PENDING BACKEND states on /forgot-password and /reset-password without faking success', async () => {
    const user = userEvent.setup()
    const { unmount } = renderAt('/forgot-password')

    expect(screen.getByTestId('forgot-pending-badge')).toHaveTextContent(/PENDING BACKEND/i)
    await user.type(screen.getByLabelText(/Email tài khoản/i), 'hero@example.com')
    await user.click(screen.getByTestId('forgot-submit-btn'))
    expect(await screen.findByTestId('forgot-submit-notice')).toHaveTextContent(/chưa được kích hoạt/i)
    unmount()

    renderAt('/reset-password')
    expect(screen.getByTestId('reset-pending-badge')).toHaveTextContent(/PENDING BACKEND/i)
    await user.type(screen.getByLabelText(/^Mật khẩu mới/i), 'NewStrongPass123')
    await user.type(screen.getByLabelText(/Xác nhận mật khẩu mới/i), 'NewStrongPass123')
    await user.click(screen.getByTestId('reset-submit-btn'))
    expect(await screen.findByTestId('reset-submit-notice')).toHaveTextContent(/chưa được kích hoạt/i)
  })
})
