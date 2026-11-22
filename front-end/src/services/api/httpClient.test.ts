import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '@/services/api/authApi'
import { resolveDataMode } from '@/services/api/config'
import { apiRequest, resetRefreshGuardForTests } from '@/services/api/httpClient'
import { dashboardRepository } from '@/services/repositories/dashboardRepository'
import { useAuthStore } from '@/stores/authStore'
import { ApiClientError } from '@/types/api'

describe('httpClient, single-flight refresh & Live/Mock separation', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    useAuthStore.getState().clearSession()
    resetRefreshGuardForTests()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('rejects authenticated request with AUTHENTICATION_REQUIRED when no token exists', async () => {
    await expect(apiRequest('/users/me')).rejects.toMatchObject({
      status: 401,
      code: 'AUTHENTICATION_REQUIRED'
    })
  })

  it('attaches Bearer token and unwraps standard Backend success envelope', async () => {
    useAuthStore.getState().setSession({
      accessToken: 'session-token-for-test',
      refreshToken: null,
      user: null
    })

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: 'u1', username: 'alice' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const result = await apiRequest<{ id: string; username: string }>('/users/me')
    expect(result).toEqual({ id: 'u1', username: 'alice' })

    const [, init] = fetchMock.mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer session-token-for-test')
  })

  it('deduplicates concurrent 401 refreshes via single-flight guard and retries once', async () => {
    useAuthStore.getState().setSession({
      accessToken: 'expired-access',
      refreshToken: 'valid-refresh',
      user: null
    })

    let refreshCalls = 0
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/auth/refresh')) {
        refreshCalls += 1
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: { accessToken: 'fresh-access' } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }

      const authHeader = (init?.headers as Headers | undefined)?.get('Authorization')
      if (authHeader === 'Bearer fresh-access') {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: { ok: url } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Expired' } }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      )
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const [r1, r2] = await Promise.all([
      apiRequest<{ ok: string }>('/goals'),
      apiRequest<{ ok: string }>('/quests')
    ])

    expect(refreshCalls).toBe(1)
    expect(r1.ok).toContain('/goals')
    expect(r2.ok).toContain('/quests')
    expect(useAuthStore.getState().accessToken).toBe('fresh-access')
  })

  it('expires session and never enters infinite retry loop when refresh fails or retry still returns 401', async () => {
    useAuthStore.getState().setSession({
      accessToken: 'expired-access',
      refreshToken: 'revoked-refresh',
      user: null
    })

    let refreshCalls = 0
    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/auth/refresh')) {
        refreshCalls += 1
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: false,
              error: { code: 'SESSION_INVALID', message: 'Revoked' }
            }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Expired' } }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      )
    }) as unknown as typeof fetch

    await expect(apiRequest('/goals')).rejects.toMatchObject({ status: 401, code: 'TOKEN_EXPIRED' })
    expect(refreshCalls).toBe(1)
    expect(useAuthStore.getState().accessToken).toBe('')
    expect(useAuthStore.getState().sessionExpiredMessage).toBeTruthy()
  })

  it('parses Backend error envelope and NEVER silently falls back to mock on LIVE error', async () => {
    useAuthStore.getState().setSession({
      accessToken: 'session-token-for-test',
      refreshToken: null,
      user: null
    })

    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'Database offline' }
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      )
    ) as unknown as typeof fetch

    await expect(dashboardRepository.getToday()).rejects.toBeInstanceOf(ApiClientError)
    await expect(dashboardRepository.getToday()).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR'
    })
  })

  it('returns explicit MOCK source when unauthenticated in hybrid mode', async () => {
    const res = await dashboardRepository.getToday()
    expect(res.source).toBe('MOCK')
    expect(res.data.summary.totalTasks).toBeGreaterThan(0)
  })

  it('enforces live mode in production builds (never silently uses mock data)', () => {
    expect(resolveDataMode(undefined, true)).toBe('live')
    expect(resolveDataMode('hybrid', true)).toBe('live')
    expect(resolveDataMode('hybrid', false)).toBe('hybrid')
    expect(resolveDataMode('live', false)).toBe('live')
  })

  it('marks unimplemented features explicitly UNAVAILABLE (never fakes success)', async () => {
    await expect(dashboardRepository.completeQuestExecution()).rejects.toMatchObject({
      status: 501,
      code: 'FEATURE_UNAVAILABLE'
    })
    await expect(authApi.forgotPassword()).rejects.toMatchObject({
      status: 501,
      code: 'FEATURE_UNAVAILABLE'
    })
  })
})
