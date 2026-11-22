import { API_CONFIG } from './config'
import { useAuthStore } from '@/stores/authStore'
import { ApiClientError, type ApiErrorEnvelope, type ApiSuccessEnvelope } from '@/types/api'

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  requiresAuth?: boolean
  query?: Record<string, string | number | boolean | undefined | null>
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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, requiresAuth = true, query, headers: customHeaders, ...rest } = options
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
