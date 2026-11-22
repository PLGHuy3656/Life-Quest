import { create } from 'zustand'
import type { LoginResponse } from '@/types/domain'

// Security decision (FE-02): Backend returns refreshToken in JSON body and does not
// issue HttpOnly cookies. To eliminate XSS token theft from browser storage, both
// accessToken and refreshToken are stored strictly in memory (Zustand state only).
// Trade-off: full page reload requires re-authentication until Backend adds HttpOnly cookies.
export interface AuthSession {
  accessToken: string
  refreshToken: string | null
  user: LoginResponse['user'] | null
}

interface AuthState extends AuthSession {
  sessionExpiredMessage: string | null
  setSession: (session: AuthSession) => void
  setAccessToken: (accessToken: string) => void
  clearSession: () => void
  expireSession: (message?: string) => void
  clearExpiredMessage: () => void
  isAuthenticated: () => boolean
}

const EMPTY_SESSION: AuthSession = {
  accessToken: '',
  refreshToken: null,
  user: null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...EMPTY_SESSION,
  sessionExpiredMessage: null,
  setSession: (session) => set({ ...session, sessionExpiredMessage: null }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ ...EMPTY_SESSION, sessionExpiredMessage: null }),
  expireSession: (message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') =>
    set({ ...EMPTY_SESSION, sessionExpiredMessage: message }),
  clearExpiredMessage: () => set({ sessionExpiredMessage: null }),
  isAuthenticated: () => Boolean(get().accessToken.trim())
}))
