import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/router'
import { CompanionProvider } from '@/features/mascot/CompanionProvider'
import { PinnedBoard } from '@/features/dashboard/PinnedBoard'
import { MOCK_QUESTS } from '@/services/repositories/fixtures'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

function renderApp() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return render(
    <QueryClientProvider client={qc}>
      <CompanionProvider>
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      </CompanionProvider>
    </QueryClientProvider>
  )
}

describe('DashboardPage & AppShell FE-01', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
    useUiStore.getState().setReducedMotion(false)
    useUiStore.getState().closeSheet()
  })

  it('renders Claude Canvas dashboard sections with neutral display-name fallback', async () => {
    renderApp()

    expect(await screen.findByText(/Bạn!/)).toBeInTheDocument()
    expect(screen.queryByText(/Huy/)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bảng ghim' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nhiệm vụ hôm nay' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Mục tiêu & Cột mốc' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Social và nhật ký hành trình' })).toBeInTheDocument()
    expect(screen.getByTestId('fox-fallback')).toBeInTheDocument()
  })

  it('enforces max 3 cards on PinnedBoard even when >3 quests are pinned', () => {
    const fourPinned = MOCK_QUESTS.map((q) => ({ ...q, isPinned: true }))
    expect(fourPinned.length).toBeGreaterThan(3)

    render(
      <PinnedBoard
        quests={fourPinned}
        source="MOCK"
        isLoading={false}
        onRetry={() => {}}
        onManagePins={() => {}}
      />
    )

    expect(screen.getAllByTestId('pinned-quest-card')).toHaveLength(3)
  })

  it('toggles html.lq-rm class via reduced-motion header control', async () => {
    const user = userEvent.setup()
    renderApp()

    const rmButton = await screen.findByRole('button', { name: /chế độ giảm chuyển động/i })
    expect(document.documentElement.classList.contains('lq-rm')).toBe(false)

    await user.click(rmButton)
    expect(document.documentElement.classList.contains('lq-rm')).toBe(true)

    await user.click(rmButton)
    expect(document.documentElement.classList.contains('lq-rm')).toBe(false)
  })

  it('opens QuickCreate Sheet with dialog semantics and closes on Escape', async () => {
    const user = userEvent.setup()
    renderApp()

    const createBtn = await screen.findByRole('button', { name: /Tạo mới nhanh/i })
    await user.click(createBtn)

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Tạo nhiệm vụ nhanh')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('shows explicit UNAVAILABLE status when attempting unimplemented quest completion', async () => {
    const user = userEvent.setup()
    renderApp()

    const completeButtons = await screen.findAllByRole('button', { name: /^Hoàn thành /i })
    await user.click(completeButtons[0])

    expect(await screen.findByText(/UNAVAILABLE:/)).toBeInTheDocument()
  })
})
