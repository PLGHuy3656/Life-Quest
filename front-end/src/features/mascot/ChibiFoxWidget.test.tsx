import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChibiFoxWidget } from './ChibiFoxWidget'

describe('ChibiFoxWidget (Fox-free routes)', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('does not render when visible=false and renders without any WebGL canvas when visible=true', () => {
    const { rerender, container } = render(<ChibiFoxWidget visible={false} />)
    expect(screen.queryByTestId('chibi-fox-widget')).not.toBeInTheDocument()

    rerender(<ChibiFoxWidget visible />)
    expect(screen.getByTestId('chibi-fox-widget')).toBeInTheDocument()
    expect(container.querySelectorAll('canvas')).toHaveLength(0)
  })

  it('supports keyboard move/resize, persistence, reset, and smooth quote on click', () => {
    render(<ChibiFoxWidget visible />)
    const widget = screen.getByTestId('chibi-fox-widget')
    const body = screen.getByTestId('chibi-fox-body')
    expect(widget).toHaveAttribute('data-size', '74')

    fireEvent.keyDown(body, { key: '+' })
    expect(widget).toHaveAttribute('data-size', '86')
    const saved = JSON.parse(window.localStorage.getItem('lq_chibi_fox_prefs_v1') || '{}')
    expect(saved.size).toBe(86)

    fireEvent.keyDown(body, { key: 'ArrowLeft' })
    const savedMoved = JSON.parse(window.localStorage.getItem('lq_chibi_fox_prefs_v1') || '{}')
    expect(savedMoved.normX).toBeLessThan(0.98)

    fireEvent.keyDown(body, { key: 'Home' })
    expect(widget).toHaveAttribute('data-size', '74')

    fireEvent.click(body)
    expect(screen.getByTestId('chibi-fox-quote')).toHaveAttribute('data-visible', 'true')
  })
})
