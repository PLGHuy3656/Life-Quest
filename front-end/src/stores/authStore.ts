import { create } from 'zustand'
import type { LoginResponse } from '@/types/domain'

// Security: Access & refresh tokens are kept strictly in memory (never written to
// localStorage or sessionStorage) to minimize XSS token exposure risk.
interface AuthSession {
  accessToken: string
  refreshToken: string | null
  user: LoginResponse['user'] | null
}

interface AuthState extends AuthSession {
  setSession: (session: AuthSession) => void
  setAccessToken: (accessToken: string) => void
  clearSession: () => void
  isAuthenticated: () => boolean
}

const EMPTY_SESSION: AuthSession = {
  accessToken: '',
  refreshToken: null,
  user: null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...EMPTY_SESSION,
  setSession: (session) => set(session),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ ...EMPTY_SESSION }),
  isAuthenticated: () => Boolean(get().accessToken.trim())
}))
