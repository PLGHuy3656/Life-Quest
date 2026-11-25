import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { isStrictWorkspaceGuardActive, validateSafeRedirect } from './authRedirect'

export interface ProtectedRouteProps {
  children: ReactNode
  /**
   * - 'strict' (default): Always enforces authentication (e.g. /profile, /settings).
   * - 'workspace': Enforces authentication when VITE_STRICT_AUTH_GUARD=true or ?authGuard=strict.
   *   Allows explicit hybrid/preview access when running frontend-only QA without a live Backend.
   */
  mode?: 'strict' | 'workspace'
}

export function ProtectedRoute({ children, mode = 'strict' }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const location = useLocation()

  const shouldEnforce = mode === 'strict' || isStrictWorkspaceGuardActive(location.search)

  if (shouldEnforce && !isAuthenticated) {
    // Strip internal QA flag from post-login redirect target
    const cleanParams = new URLSearchParams(location.search)
    cleanParams.delete('authGuard')
    const cleanSearch = cleanParams.toString()
    const rawDest = `${location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}`
    const safeDest = validateSafeRedirect(rawDest, '/')
    return <Navigate to={`/login?redirect=${encodeURIComponent(safeDest)}`} replace />
  }

  return <>{children}</>
}
