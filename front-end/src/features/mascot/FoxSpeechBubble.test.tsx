import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { FoxSpeechBubble } from './FoxSpeechBubble'
import type { ActiveDialogueBubble } from './dialogue/types'

function makeBubble(overrides: Partial<ActiveDialogueBubble> = {}): ActiveDialogueBubble {
  return {
    instanceId: 'dlg-1',
    entryId: 'sys-gm-01',
    event: 'APP_GREETING',
    text: 'Chào buổi sáng! Cùng Fox bắt đầu một bước nhỏ nhé.',
    emotion: 'happy',
    priority: 35,
    durationMs: 6500,
    createdAt: 1000,
    ...overrides
  }
}

describe('FOX-D02 / D03 Overhead FoxSpeechBubble Component', () => {
  it('renders single bubble when visible, hides when collapsed, and supports Escape & click dismissal', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    const dialogue = makeBubble()

    const { rerender } = render(
      <MemoryRouter>
        <FoxSpeechBubble dialogue={dialogue} visible={true} onDismiss={onDismiss} />
      </MemoryRouter>
    )

    expect(screen.getAllByTestId('fox-speech-bubble')).toHaveLength(1)
    expect(screen.getByTestId('fox-speech-bubble')).toHaveAttribute('data-trigger', 'APP_GREETING')
    expect(screen.getByTestId('fox-speech-bubble')).toHaveAttribute('data-emotion', 'happy')
    expect(screen.getByText(dialogue.text)).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(onDismiss).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Đóng lời thoại của Fox' }))
    expect(onDismiss).toHaveBeenCalledTimes(2)

    rerender(
      <MemoryRouter>
        <FoxSpeechBubble dialogue={dialogue} visible={false} onDismiss={onDismiss} />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('fox-speech-bubble')).not.toBeInTheDocument()
  })

  it('renders panic emotion variant and optional action link for urgent deadline alerts', () => {
    const panicBubble = makeBubble({
      instanceId: 'dlg-panic',
      event: 'DEADLINE_15M',
      emotion: 'panic',
      text: 'Gấp lắm rồi! "Nộp báo cáo" chỉ còn dưới 15 phút nữa thôi!',
      actionRoute: '/work',
      actionLabel: 'Mở nhiệm vụ'
    })

    render(
      <MemoryRouter>
        <FoxSpeechBubble dialogue={panicBubble} visible={true} onDismiss={() => {}} />
      </MemoryRouter>
    )

    const el = screen.getByTestId('fox-speech-bubble')
    expect(el).toHaveAttribute('data-emotion', 'panic')
    expect(el).toHaveAttribute('aria-live', 'assertive')
    expect(screen.getByRole('link', { name: /Mở nhiệm vụ/i })).toHaveAttribute('href', '/work')
  })
})
