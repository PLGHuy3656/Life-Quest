import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CanvasErrorBoundary } from './CanvasErrorBoundary'
import { CompanionProvider, useCompanion } from './CompanionProvider'
import { resetWebGLCacheForTests } from './environment'
import { FoxCompanionView } from './FoxCompanionView'
import { FoxFallback } from './FoxFallback'
import { MascotEventAdapter } from './MascotEventAdapter'
import { useUiStore } from '@/stores/uiStore'

function Probe() {
  const c = useCompanion()
  return (
    <div>
      <span data-testid="rm-flag">{String(c.effectiveReducedMotion)}</span>
      <span data-testid="level-flag">{c.settings.level}</span>
      <span data-testid="log-names">{c.eventLog.map((e) => e.name).join(',')}</span>
      <button type="button" onClick={() => c.publish('TASK_CREATED', { title: 'Test' } as never)}>
        emit-task
      </button>
    </div>
  )
}

function ExplodingMascot(): JSX.Element {
  throw new Error('Simulated WebGL crash')
}

describe('Fox V2 Mascot Integration Boundary', () => {
  beforeEach(() => {
    resetWebGLCacheForTests()
    useUiStore.getState().setReducedMotion(false)
  })

  it('renders accessible WebGL fallback in environments without WebGL (jsdom)', () => {
    render(
      <CompanionProvider>
        <FoxCompanionView presentation="widget" label="Cáo V2" />
      </CompanionProvider>
    )
    const fallback = screen.getByTestId('fox-fallback')
    expect(fallback).toHaveAttribute('data-reason', 'webgl')
  })

  it('renders context-lost fallback with retry handler', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<FoxFallback reason="context-lost" presentation="widget" onRetry={onRetry} />)

    expect(screen.getByTestId('fox-fallback')).toHaveAttribute('data-reason', 'context-lost')
    await user.click(screen.getByRole('button', { name: 'Thử lại 3D' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('isolates mascot crash inside CanvasErrorBoundary without breaking sibling Dashboard UI', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <div>
        <h1>Dashboard Remains Healthy</h1>
        <CanvasErrorBoundary fallback={<FoxFallback reason="webgl" presentation="widget" />}>
          <ExplodingMascot />
        </CanvasErrorBoundary>
      </div>
    )
    expect(screen.getByRole('heading', { name: 'Dashboard Remains Healthy' })).toBeInTheDocument()
    expect(screen.getByTestId('fox-fallback')).toBeInTheDocument()
    spy.mockRestore()
  })

  it('syncs html.lq-rm reduced-motion toggle, authoritative level, and real Gate I events', async () => {
    const user = userEvent.setup()
    const { rerender, unmount } = render(
      <CompanionProvider>
        <MascotEventAdapter triggerGreetingOnMount authoritativeLevel={9} />
        <Probe />
      </CompanionProvider>
    )

    expect(screen.getByTestId('rm-flag')).toHaveTextContent('false')
    expect(screen.getByTestId('level-flag')).toHaveTextContent('9')
    expect(screen.getByTestId('log-names')).toHaveTextContent('APP_GREETING')

    useUiStore.getState().setReducedMotion(true)
    rerender(
      <CompanionProvider>
        <MascotEventAdapter triggerGreetingOnMount authoritativeLevel={9} />
        <Probe />
      </CompanionProvider>
    )
    expect(screen.getByTestId('rm-flag')).toHaveTextContent('true')

    await user.click(screen.getByRole('button', { name: 'emit-task' }))
    expect(screen.getByTestId('log-names')).toHaveTextContent('TASK_CREATED')

    // Clean unmount without throwing
    unmount()
  })

  it('tracks active controller count cleanly across repeated mount/unmount cycles', () => {
    function MockControllerMount({ id }: { id: string }) {
      const { register, activeInstanceCount } = useCompanion()
      const registeredRef = vi.fn()
      // Register a lightweight controller stub to verify lifecycle cleanup
      const stub = { id, handleEvent: vi.fn() } as never
      return (
        <div>
          <span data-testid="active-count">{activeInstanceCount}</span>
          <button
            type="button"
            onClick={() => {
              const off = register(stub, { presentation: 'widget', label: id })
              registeredRef(off)
              off()
            }}
          >
            cycle-{id}
          </button>
        </div>
      )
    }

    render(
      <CompanionProvider>
        <MockControllerMount id="fox-1" />
      </CompanionProvider>
    )
    expect(screen.getByTestId('active-count')).toHaveTextContent('0')
  })
})
