import { useEffect, useState, type RefObject } from 'react'

let webglCache: boolean | null = null

export function resetWebGLCacheForTests(): void {
  webglCache = null
}

/**
 * Probes WebGL availability once per session and releases the probe context immediately.
 * Respects `?nowebgl=1` for deterministic fallback testing.
 */
export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return (webglCache = false)
  }
  try {
    if (new URLSearchParams(window.location.search).get('nowebgl') === '1') {
      return (webglCache = false)
    }
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl')) as WebGLRenderingContext | null
    webglCache = Boolean(gl)
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglCache = false
  }
  return webglCache
}

export function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)'
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches
  )

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return matches
}

export function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden'
  )

  useEffect(() => {
    if (typeof document === 'undefined') return
    const onChange = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return visible
}

export function useInView(ref: RefObject<Element | null>): boolean {
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '100px'
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return inView
}
