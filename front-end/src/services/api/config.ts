export type RuntimeDataMode = 'live' | 'hybrid'

export function resolveDataMode(rawMode: string | undefined, isProd: boolean): RuntimeDataMode {
  // Production builds NEVER silently use mock data.
  if (isProd) return 'live'
  const normalized = rawMode?.trim().toLowerCase()
  return normalized === 'live' ? 'live' : 'hybrid'
}

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
const rawMode = import.meta.env.VITE_DATA_MODE as string | undefined

export const API_CONFIG = {
  baseUrl: (rawBaseUrl && rawBaseUrl.length > 0 ? rawBaseUrl : '/api/v1').replace(/\/+$/, ''),
  dataMode: resolveDataMode(rawMode, Boolean(import.meta.env.PROD)),
  isDev: Boolean(import.meta.env.DEV),
  isProd: Boolean(import.meta.env.PROD)
} as const
