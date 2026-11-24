import { lazy, Suspense, type CSSProperties } from 'react'
import { LoadingSkeleton } from '@/components/ui/StateViews'
import type { FoxPresentation } from '@/mascot/FoxLevelScale'
import { hasWebGL } from './environment'
import type { FoxCameraCommand } from './FoxCanvas'
import { FoxFallback } from './FoxFallback'

const LazyFoxCanvas = lazy(() =>
  import('./FoxCanvas').then((m) => ({ default: m.FoxCanvas }))
)

export interface FoxCompanionViewProps {
  presentation: FoxPresentation
  label: string
  orbit?: boolean
  suspended?: boolean
  cameraCommand?: FoxCameraCommand | null
  className?: string
  style?: CSSProperties
}

export function FoxCompanionView(props: FoxCompanionViewProps) {
  if (!hasWebGL()) {
    return <FoxFallback reason="webgl" presentation={props.presentation} />
  }

  return (
    <Suspense fallback={<LoadingSkeleton height={props.presentation === 'full' ? 360 : 220} />}>
      <LazyFoxCanvas {...props} />
    </Suspense>
  )
}
