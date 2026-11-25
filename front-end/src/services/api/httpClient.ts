import { API_CONFIG } from './config'
import { useAuthStore } from '@/stores/authStore'
import { ApiClientError, type ApiErrorEnvelope, type ApiSuccessEnvelope } from '@/types/api'

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  requiresAuth?: boolean
  query?: Record<string, string | number | boolean | undefined | null>
  /** Internal guard: prevents infinite 401 refresh loops */
  _isRetry?: boolean
}

// Single-flight refresh promise shared across concurrent 401 responses
let inFlightRefresh: Promise<string | null> | null = null

export function resetRefreshGuardForTests(): void {
  inFlightRefresh = null
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const base = `${API_CONFIG.baseUrl}${normalizedPath}`

  if (!query) return base
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

async function performSingleFlightRefresh(): Promise<string | null> {
  if (inFlightRefresh) {
    return inFlightRefresh
  }

  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) {
    return null
  }

  inFlightRefresh = (async () => {
    try {
      const response = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })

      if (!response.ok) {
        useAuthStore.getState().expireSession('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        return null
      }

      const payload = (await response.json()) as Partial<ApiSuccessEnvelope<{ accessToken: string }>>
      const nextAccessToken = payload?.data?.accessToken
      if (!payload?.success || !nextAccessToken) {
        useAuthStore.getState().expireSession('Không thể làm mới phiên đăng nhập.')
        return null
      }

      useAuthStore.getState().setAccessToken(nextAccessToken)
      return nextAccessToken
    } catch {
      return null
    } finally {
      inFlightRefresh = null
    }
  })()

  return inFlightRefresh
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, requiresAuth = true, query, headers: customHeaders, _isRetry = false, ...rest } = options
  const headers = new Headers(customHeaders)

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (requiresAuth) {
    const token = useAuthStore.getState().accessToken.trim()
    if (!token) {
      throw new ApiClientError({
        status: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Chưa có phiên đăng nhập để gọi API trực tiếp.'
      })
    }
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    })
  } catch {
    throw new ApiClientError({
      status: 0,
      code: 'NETWORK_UNAVAILABLE',
      message: 'Không thể kết nối máy chủ LifeQuest Backend.',
      isNetworkError: true
    })
  }

  // Single-flight refresh on 401 (only once per request, never on /auth/* endpoints)
  if (
    response.status === 401 &&
    requiresAuth &&
    !_isRetry &&
    !path.startsWith('/auth/')
  ) {
    const hasRefreshToken = Boolean(useAuthStore.getState().refreshToken)
    if (hasRefreshToken) {
      const refreshedToken = await performSingleFlightRefresh()
      if (refreshedToken) {
        return apiRequest<T>(path, { ...options, _isRetry: true })
      }
    } else {
      useAuthStore.getState().expireSession('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }
  } else if (response.status === 401 && requiresAuth && _isRetry) {
    useAuthStore.getState().expireSession('Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.')
  }

  let payload: unknown = null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const errEnvelope = payload as Partial<ApiErrorEnvelope> | null
    const code = errEnvelope?.error?.code || `HTTP_${response.status}`
    const message = errEnvelope?.error?.message || `Yêu cầu thất bại (${response.status}).`
    throw new ApiClientError({
      status: response.status,
      code,
      message
    })
  }

  const okEnvelope = payload as Partial<ApiSuccessEnvelope<T>> | null
  if (!okEnvelope || okEnvelope.success !== true || !('data' in okEnvelope)) {
    throw new ApiClientError({
      status: response.status,
      code: 'INVALID_RESPONSE_ENVELOPE',
      message: 'Phản hồi từ Backend không đúng định dạng chuẩn.'
    })
  }

  return okEnvelope.data as T
}
