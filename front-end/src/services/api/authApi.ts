import { apiRequest } from './httpClient'
import { ApiClientError } from '@/types/api'
import type { LoginResponse } from '@/types/domain'

export const authApi = {
  login: (input: { email: string; password: string }) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      requiresAuth: false,
      body: input
    }),

  register: (input: { email: string; username: string; password: string }) =>
    apiRequest<{ id: string; email: string; username: string; status: string; createdAt: string }>(
      '/auth/register',
      {
        method: 'POST',
        requiresAuth: false,
        body: input
      }
    ),

  refresh: (refreshToken: string) =>
    apiRequest<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      requiresAuth: false,
      body: { refreshToken }
    }),

  logout: (refreshToken: string) =>
    apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
      requiresAuth: true,
      body: { refreshToken }
    }),

  // Explicitly unavailable: backend/src/modules/auth/authService.js lines 210-221 are TODO stubs.
  forgotPassword: async (): Promise<never> => {
    throw new ApiClientError({
      status: 501,
      code: 'FEATURE_UNAVAILABLE',
      message: 'Chức năng đặt lại mật khẩu chưa được kích hoạt trên Backend.'
    })
  },

  resetPassword: async (): Promise<never> => {
    throw new ApiClientError({
      status: 501,
      code: 'FEATURE_UNAVAILABLE',
      message: 'Chức năng xác nhận đặt lại mật khẩu chưa được kích hoạt trên Backend.'
    })
  }
}
