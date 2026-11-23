import { useEffect, useState } from 'react'

/**
 * Tracks Desktop breakpoint (>= 1024px) via matchMedia so we mount at most ONE
 * <FoxCompanionView> WebGL renderer at any viewport width.
 * Defaults to `true` in non-browser/jsdom test environments without matchMedia.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true
    }
    return window.matchMedia('(min-width: 1024px)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}
