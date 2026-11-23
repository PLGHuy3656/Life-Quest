import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FoxSpeechBubble } from './FoxSpeechBubble'
import { getDialogueForTrigger } from './foxDialogueCatalog'

describe('FOX-D02 Overhead FoxSpeechBubble & Dialogue Catalog', () => {
  it('returns localized Vietnamese dialogue for all 4 supported triggers', () => {
    expect(getDialogueForTrigger('APP_GREETING', { hour: 9 }).text).toMatch(/Chào buổi sáng/)
    expect(getDialogueForTrigger('APP_GREETING', { hour: 14 }).text).toMatch(/Chào buổi chiều/)
    expect(getDialogueForTrigger('APP_GREETING', { hour: 20 }).text).toMatch(/Chào buổi tối/)
    expect(getDialogueForTrigger('TASK_CREATED', { taskTitle: 'Chạy bộ' }).text).toMatch(/Chạy bộ/)
    expect(getDialogueForTrigger('BACKEND_ERROR').text).toMatch(/kết nối máy chủ/i)
    expect(getDialogueForTrigger('EMPTY_TASKS').text).toMatch(/chưa có nhiệm vụ/i)
  })

  it('renders single bubble when visible, hides when collapsed, and supports Escape & click dismissal', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    const dialogue = getDialogueForTrigger('APP_GREETING', { hour: 10 })

    const { rerender } = render(
      <FoxSpeechBubble dialogue={dialogue} visible={true} onDismiss={onDismiss} />
    )

    expect(screen.getAllByTestId('fox-speech-bubble')).toHaveLength(1)
    expect(screen.getByTestId('fox-speech-bubble')).toHaveAttribute('data-trigger', 'APP_GREETING')
    expect(screen.getByText(dialogue.text)).toBeInTheDocument()

    // Dismiss via Escape key
    await user.keyboard('{Escape}')
    expect(onDismiss).toHaveBeenCalledTimes(1)

    // Dismiss via close button
    await user.click(screen.getByRole('button', { name: 'Đóng lời thoại của Fox' }))
    expect(onDismiss).toHaveBeenCalledTimes(2)

    // Hidden cleanly when Fox panel is collapsed (visible=false)
    rerender(<FoxSpeechBubble dialogue={dialogue} visible={false} onDismiss={onDismiss} />)
    expect(screen.queryByTestId('fox-speech-bubble')).not.toBeInTheDocument()
  })
})
