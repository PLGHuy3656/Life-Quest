import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CompanionProvider } from '@/features/mascot/CompanionProvider'
import { useAuthStore } from '@/stores/authStore'
import { VoiceAssistantSheet } from './VoiceAssistantSheet'

function renderVoice() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <CompanionProvider>
        <VoiceAssistantSheet open onClose={() => {}} />
      </CompanionProvider>
    </QueryClientProvider>
  )
}

describe('VoiceAssistantSheet (Gate I Event Contract)', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('transitions Gate I voice phases and enforces strict TASK_CREATED Backend gate', async () => {
    const user = userEvent.setup()
    renderVoice()

    expect(screen.getByText(/DEMO \/ ASR UNAVAILABLE/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Lắng nghe' }))
    expect(screen.getByText(/voice_listening_loop/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Suy nghĩ' }))
    expect(screen.getByText(/voice_processing/i)).toBeInTheDocument()

    // Unauthenticated confirm MUST fail and emit VOICE_RETRY_REQUESTED (never TASK_CREATED)
    await user.type(screen.getByLabelText(/Xác nhận tạo nhiệm vụ thật/i), 'Đọc sách 20 phút')
    await user.click(screen.getByRole('button', { name: /Xác nhận & Lưu/i }))

    expect(await screen.findByText('Thử lại (voice_retry)')).toBeInTheDocument()
    expect(screen.queryByText(/task_notebook_confirm/i)).not.toBeInTheDocument()

    // Authenticated confirm with real 201 Backend response fires TASK_CREATED
    useAuthStore.getState().setSession({
      accessToken: 'live-test-token',
      refreshToken: null,
      user: { id: 'u1', email: 'a@b.com', username: 'u', status: 'ACTIVE' }
    })
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: 'q1', title: 'Đọc sách 20 phút' } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
    ) as unknown as typeof fetch

    await user.click(screen.getByRole('button', { name: /Xác nhận & Lưu/i }))
    await waitFor(() => {
      expect(screen.getByText(/task_notebook_confirm/i)).toBeInTheDocument()
    })
  })
})
