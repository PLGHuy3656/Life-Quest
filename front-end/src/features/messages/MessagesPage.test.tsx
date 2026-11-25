import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { useMessengerStore } from '@/stores/messengerStore'
import { MessagesPage } from './MessagesPage'

function renderMessages(initialEntry = '/messages') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/messages/*" element={<MessagesPage />} />
        <Route path="/work/quests" element={<div>Quests Target</div>} />
        <Route path="/profile" element={<div>Profile Target</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('FE-06A Private Messenger Core', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useMessengerStore.getState().clearPrivateSession()
  })

  it('filters conversations by search query and Cá nhân / Nhóm tabs', async () => {
    const user = userEvent.setup()
    renderMessages()

    // Default shows all 5 preview conversations
    expect(screen.getByTestId('messenger-conv-item-conv-minh-anh')).toBeInTheDocument()
    expect(screen.getByTestId('messenger-conv-item-conv-group-run')).toBeInTheDocument()

    // Filter to Nhóm (2 groups)
    await user.click(screen.getByTestId('messenger-filter-group'))
    expect(screen.queryByTestId('messenger-conv-item-conv-minh-anh')).not.toBeInTheDocument()
    expect(screen.getByTestId('messenger-conv-item-conv-group-run')).toBeInTheDocument()
    expect(screen.getByTestId('messenger-conv-item-conv-group-ielts')).toBeInTheDocument()

    // Search within groups
    await user.type(screen.getByTestId('messenger-search-input'), 'IELTS')
    expect(screen.queryByTestId('messenger-conv-item-conv-group-run')).not.toBeInTheDocument()
    expect(screen.getByTestId('messenger-conv-item-conv-group-ielts')).toBeInTheDocument()

    // No results empty state
    await user.clear(screen.getByTestId('messenger-search-input'))
    await user.type(screen.getByTestId('messenger-search-input'), 'khong-ton-tai-xyz')
    expect(screen.getByTestId('messenger-search-empty')).toBeInTheDocument()
  })

  it('switches between personal & group chats, groups consecutive messages, opens lightbox, and toggles details panel', async () => {
    const user = userEvent.setup()
    renderMessages()

    // Consecutive messages from Minh Anh are grouped
    const rows = screen.getAllByTestId('messenger-message-row')
    expect(rows.some((r) => r.getAttribute('data-grouped') === 'true')).toBe(true)

    // Open image in SocialMediaLightbox & dismiss with Escape
    await user.click(screen.getByTestId('messenger-image-img-ma-study'))
    expect(screen.getByTestId('social-media-lightbox')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByTestId('social-media-lightbox')).not.toBeInTheDocument()

    // Switch to Group conversation & open details panel
    await user.click(screen.getByTestId('messenger-conv-item-conv-group-run'))
    expect(screen.getByTestId('messenger-chat-header')).toHaveTextContent('Nhóm Chạy Bộ Sáng 6h')
    await user.click(screen.getByTestId('messenger-toggle-details-btn'))
    expect(screen.getByTestId('messenger-details-panel')).toBeInTheDocument()
    expect(screen.getByText('Thành viên (4)')).toBeInTheDocument()

    // Close details panel
    await user.click(screen.getByTestId('messenger-close-details-btn'))
    expect(screen.queryByTestId('messenger-details-panel')).not.toBeInTheDocument()
  })

  it('supports Enter to send local preview, Shift+Enter newline, Vietnamese IME composition guard, and per-conversation draft retention', async () => {
    const user = userEvent.setup()
    renderMessages()

    const input = screen.getByTestId('messenger-composer-input') as HTMLTextAreaElement

    // Vietnamese IME composition: Enter must NOT submit while composing
    fireEvent.compositionStart(input)
    await user.type(input, 'tieng viet')
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(screen.queryByTestId('messenger-local-sim-badge')).not.toBeInTheDocument()
    fireEvent.compositionEnd(input)

    // Draft retained when switching away and back
    await user.click(screen.getByTestId('messenger-conv-item-conv-gia-bao'))
    expect((screen.getByTestId('messenger-composer-input') as HTMLTextAreaElement).value).toBe('')
    await user.click(screen.getByTestId('messenger-conv-item-conv-minh-anh'))
    expect((screen.getByTestId('messenger-composer-input') as HTMLTextAreaElement).value).toBe('tieng viet')

    // Shift+Enter inserts newline instead of sending
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    expect(screen.queryByTestId('messenger-local-sim-badge')).not.toBeInTheDocument()

    // Plain Enter sends local preview simulation (honestly labeled)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByTestId('messenger-local-sim-badge')).toHaveTextContent(/Mô phỏng cục bộ/i)
    expect((screen.getByTestId('messenger-composer-input') as HTMLTextAreaElement).value).toBe('')
  })

  it('renders honest empty, pending API, and unauthorized states', () => {
    const { unmount } = renderMessages('/messages?state=unauthorized')
    expect(screen.getByTestId('messenger-state-unauthorized')).toBeInTheDocument()
    unmount()

    const { unmount: unmountPending } = renderMessages('/messages?state=pending')
    expect(screen.getByTestId('messenger-state-pending_api')).toBeInTheDocument()
    unmountPending()

    renderMessages('/messages?state=empty')
    expect(screen.getByTestId('messenger-state-empty')).toBeInTheDocument()
  })
})
