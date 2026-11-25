import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuthStore } from '@/stores/authStore'
import { useMessengerStore } from '@/stores/messengerStore'
import { ChatBubbleSettings } from './ChatBubbleSettings'
import { computeSafeDockBounds } from './dockGeometry'
import { FloatingChatHost } from './FloatingChatHost'

function renderHost(initialEntries: string[] = ['/']) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <FloatingChatHost isFoxVisible />
                <ChatBubbleSettings />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('FE-06A.1 Global Floating Chat Bubbles', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useAuthStore.getState().clearSession()
    useMessengerStore.getState().clearPrivateSession()
    useMessengerStore.getState().setFloatingEnabled(true)
    useMessengerStore.getState().resetBubblePosition()
  })

  it('mounts a single FloatingChatHost on app routes and hides on /login & /register', () => {
    const { unmount } = renderHost(['/'])
    expect(screen.getAllByTestId('floating-chat-host')).toHaveLength(1)
    expect(screen.getByTestId('floating-bubble-dock')).toBeInTheDocument()
    unmount()

    renderHost(['/login'])
    expect(screen.queryByTestId('floating-chat-host')).not.toBeInTheDocument()
  })

  it('expands bubble, minimizes via Escape/button without closing, and closes individual bubble', async () => {
    const user = userEvent.setup()
    renderHost(['/'])

    // Click first bubble to expand
    const bubbleBtn = screen.getByTestId('floating-chat-bubble-btn-conv-minh-anh')
    await user.click(bubbleBtn)
    expect(screen.getByTestId('floating-chat-window')).toBeInTheDocument()
    expect(screen.getByTestId('floating-chat-window')).toHaveAttribute(
      'data-conversation-id',
      'conv-minh-anh'
    )

    // Minimize via Escape -> window closes, bubble remains open, floating stays enabled
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('floating-chat-window')).not.toBeInTheDocument()
    expect(screen.getByTestId('floating-chat-bubble-conv-minh-anh')).toBeInTheDocument()
    expect(useMessengerStore.getState().floatingEnabled).toBe(true)

    // Close individual bubble -> only that bubble disappears
    await user.click(screen.getByTestId('floating-chat-bubble-close-conv-minh-anh'))
    expect(screen.queryByTestId('floating-chat-bubble-conv-minh-anh')).not.toBeInTheDocument()
    expect(screen.getByTestId('floating-chat-bubble-conv-group-run')).toBeInTheDocument()
    expect(useMessengerStore.getState().floatingEnabled).toBe(true)
  })

  it('distinguishes global disable from minimize, persists disable in localStorage, and does not auto-reopen', async () => {
    const user = userEvent.setup()
    renderHost(['/'])

    const toggle = screen.getByTestId('chat-bubble-settings-toggle')
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    // Disable globally
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.queryByTestId('floating-chat-host')).not.toBeInTheDocument()

    // Persisted preference must contain enabled=false and NEVER message bodies or tokens
    const raw = window.localStorage.getItem('lq_floating_chat_prefs_v1::preview-guest')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.enabled).toBe(false)
    expect(raw).not.toContain('accessToken')
    expect(raw).not.toContain('refreshToken')

    // Attempting to open a conversation without forceEnable must NOT auto-reopen while disabled
    useMessengerStore.getState().openFloatingConversation('conv-minh-anh')
    expect(useMessengerStore.getState().floatingEnabled).toBe(false)
    expect(screen.queryByTestId('floating-chat-host')).not.toBeInTheDocument()

    // Re-enable restores bubbles
    await user.click(toggle)
    expect(screen.getByTestId('floating-chat-host')).toBeInTheDocument()
  })

  it('limits visible bubbles to 3 with overflow menu and supports keyboard dock positioning', () => {
    const store = useMessengerStore.getState()
    // Open 4 conversations so 3 are visible and 1 is in overflow
    store.openFloatingConversation('conv-minh-anh', { expand: false })
    store.openFloatingConversation('conv-group-run', { expand: false })
    store.openFloatingConversation('conv-gia-bao', { expand: false })
    store.openFloatingConversation('conv-group-ielts', { expand: false })

    renderHost(['/'])
    const dragHandle = screen.getByTestId('floating-dock-drag-handle')
    expect(screen.getByTestId('floating-dock-overflow-count')).toHaveTextContent('+1')

    // Clicking the 6-dot handle opens the settings & overflow menu
    fireEvent.click(dragHandle)
    expect(screen.getByTestId('floating-dock-overflow-menu')).toBeInTheDocument()
    fireEvent.click(dragHandle)

    // Keyboard alternative to dragging: ArrowRight snaps dock to right side
    dragHandle.focus()
    fireEvent.keyDown(dragHandle, { key: 'ArrowRight' })
    expect(useMessengerStore.getState().dockSide).toBe('right')
    expect(screen.getByTestId('floating-bubble-dock')).toHaveAttribute('data-dock-side', 'right')

    // Home resets position back to left default
    fireEvent.keyDown(dragHandle, { key: 'Home' })
    expect(useMessengerStore.getState().dockSide).toBe('left')

    // Fox Paw button collapses bubbles with aggregate unread badge and expands them back
    const pawToggle = screen.getByTestId('floating-dock-paw-toggle-btn')
    expect(screen.getByTestId('floating-bubble-dock')).toHaveAttribute('data-dock-collapsed', 'false')
    fireEvent.click(pawToggle)
    expect(screen.getByTestId('floating-bubble-dock')).toHaveAttribute('data-dock-collapsed', 'true')
    expect(screen.getByTestId('floating-dock-collapsed-unread')).toHaveTextContent('3')
    fireEvent.click(pawToggle)
    expect(screen.getByTestId('floating-bubble-dock')).toHaveAttribute('data-dock-collapsed', 'false')
  })

  it('collapses expanded floating window on /messages to avoid duplicates and preserves state', () => {
    useMessengerStore.getState().openFloatingConversation('conv-minh-anh', { expand: true })
    renderHost(['/messages'])

    expect(screen.getByTestId('floating-chat-host')).toHaveAttribute(
      'data-messenger-coexistence',
      'collapsed'
    )
    expect(screen.queryByTestId('floating-chat-window')).not.toBeInTheDocument()
    expect(screen.getByTestId('floating-bubble-dock')).toHaveAttribute('data-compact', 'true')
    // Active conversation ID stays intact in store for restoration on navigation away
    expect(useMessengerStore.getState().activeFloatingConvId).toBe('conv-minh-anh')
  })

  it('enforces account isolation and wipes private drafts/messages on logout', () => {
    // User A logs in and writes a private draft + sends local message
    useAuthStore.getState().setSession({
      accessToken: 'token-user-a',
      refreshToken: 'refresh-a',
      user: { id: 'user-a', email: 'a@example.com', username: 'usera', status: 'ACTIVE' }
    })
    useMessengerStore.getState().syncAccountScope('user_user-a')
    useMessengerStore.getState().setDraft('conv-minh-anh', 'Tin nhắn bí mật của A')
    useMessengerStore.getState().setFloatingEnabled(false)

    // Ensure localStorage NEVER stores the private draft
    const rawA = window.localStorage.getItem('lq_floating_chat_prefs_v1::user_user-a') ?? ''
    expect(rawA).not.toContain('Tin nhắn bí mật của A')
    expect(rawA).not.toContain('token-user-a')

    // Logout wipes in-memory state
    useAuthStore.getState().clearSession()
    useMessengerStore.getState().clearPrivateSession()
    expect(useMessengerStore.getState().draftsByConv['conv-minh-anh']).toBeUndefined()
    expect(useMessengerStore.getState().activeFloatingConvId).toBeNull()

    // User B logs in -> gets fresh default enabled=true preference, zero leak from User A
    useAuthStore.getState().setSession({
      accessToken: 'token-user-b',
      refreshToken: 'refresh-b',
      user: { id: 'user-b', email: 'b@example.com', username: 'userb', status: 'ACTIVE' }
    })
    useMessengerStore.getState().syncAccountScope('user_user-b')
    expect(useMessengerStore.getState().floatingEnabled).toBe(true)
    expect(useMessengerStore.getState().draftsByConv['conv-minh-anh']).toBeUndefined()
  })

  it('clamps dock coordinates safely within viewport bounds on desktop and mobile', () => {
    const desktop = computeSafeDockBounds(1440, 900, 180)
    expect(desktop.minX).toBeGreaterThanOrEqual(12)
    expect(desktop.maxX).toBeLessThan(1440)
    expect(desktop.minY).toBeGreaterThanOrEqual(76)
    expect(desktop.maxY).toBeLessThan(900)

    const mobile = computeSafeDockBounds(390, 844, 160)
    expect(mobile.minX).toBeGreaterThanOrEqual(12)
    expect(mobile.maxX).toBeLessThan(390)
    expect(mobile.minY).toBeGreaterThanOrEqual(60)
    expect(mobile.maxY).toBeLessThan(844 - 70)

    // Silence unused vi lint if any
    expect(typeof vi.fn).toBe('function')
  })
})
