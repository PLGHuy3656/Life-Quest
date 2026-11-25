const AUTH_PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

/**
 * Validates an intended post-login destination to prevent open-redirect vulnerabilities
 * and auth redirect loops. Only relative internal paths starting with a single `/` are allowed.
 */
export function validateSafeRedirect(raw: string | null | undefined, fallback = '/'): string {
  if (!raw) return fallback
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/')) return fallback
  // Reject protocol-relative URLs (`//evil.com`), backslashes (`/\evil.com`), and control chars
  if (trimmed.startsWith('//') || trimmed.includes('\\') || /[\r\n\t]/.test(trimmed)) {
    return fallback
  }
  const pathname = trimmed.split('?')[0].split('#')[0]
  if (AUTH_PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return fallback
  }
  return trimmed
}

/**
 * Checks whether strict authentication guard is active for workspace routes
 * (e.g. /calendar, /work/*, /wardrobe/*, /messages).
 * - Always active when VITE_STRICT_AUTH_GUARD=true
 * - Can also be explicitly activated per-session via ?authGuard=strict for QA/verification
 */
export function isStrictWorkspaceGuardActive(search = ''): boolean {
  if (import.meta.env.VITE_STRICT_AUTH_GUARD === 'true') return true
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(search || window.location.search)
    if (params.get('authGuard') === 'strict') return true
    try {
      if (window.sessionStorage.getItem('lq_strict_auth_guard') === '1') return true
    } catch {
      // Ignore storage errors
    }
  }
  return false
}
