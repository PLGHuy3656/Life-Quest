import { useEffect, useRef } from 'react'
import { useOptionalCompanion } from './CompanionProvider'

export interface MascotEventAdapterProps {
  /** Authoritative level from LIVE GET /api/v1/today (undefined when mock/unauthenticated) */
  authoritativeLevel?: number
  /** Fires local-time APP_GREETING once when Dashboard mounts */
  triggerGreetingOnMount?: boolean
}

export function MascotEventAdapter({
  authoritativeLevel,
  triggerGreetingOnMount = false
}: MascotEventAdapterProps) {
  const companion = useOptionalCompanion()
  const publish = companion?.publish
  const update = companion?.update
  const greetedRef = useRef(false)

  useEffect(() => {
    if (!publish || !triggerGreetingOnMount || greetedRef.current) return
    greetedRef.current = true
    const hour = new Date().getHours()
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
    publish('APP_GREETING', { timeOfDay } as never)
  }, [publish, triggerGreetingOnMount])

  useEffect(() => {
    if (!update || typeof authoritativeLevel !== 'number' || authoritativeLevel < 1) return
    update({ level: authoritativeLevel })
  }, [update, authoritativeLevel])

  return null
}
