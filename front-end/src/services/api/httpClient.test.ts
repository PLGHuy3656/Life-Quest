import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '@/services/api/authApi'
import { resolveDataMode } from '@/services/api/config'
import { apiRequest } from '@/services/api/httpClient'
import { dashboardRepository } from '@/services/repositories/dashboardRepository'
import { useAuthStore } from '@/stores/authStore'
import { ApiClientError } from '@/types/api'

describe('httpClient & Live/Mock repository separation', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    useAuthStore.getState().clearSession()
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
