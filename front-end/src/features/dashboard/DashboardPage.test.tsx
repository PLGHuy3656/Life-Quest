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

function renderApp(initialPath = '/') {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return render(
    <QueryClientProvider client={qc}>
      <CompanionProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <AppRoutes />
        </MemoryRouter>
      </CompanionProvider>
    </QueryClientProvider>
  )
}

describe('DashboardPage & Shared 3-Region AppShell (FE-03.5I)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
    useUiStore.getState().setReducedMotion(false)
    useUiStore.getState().setPinnedRailCollapsed(false)
    useUiStore.getState().setFoxRailCollapsed(false)
    useUiStore.getState().setQuickCreateDraft('')
    useUiStore.getState().closeSheet()
  })

  it('renders approved Social-First Dashboard with shared PinnedTaskRail & FoxCompanionRail', async () => {
    renderApp()

    expect(await screen.findByText(/Bạn!/)).toBeInTheDocument()
    expect(screen.queryByText(/Huy/)).not.toBeInTheDocument()
    expect(screen.getByTestId('shared-desktop-three-region')).toBeInTheDocument()
    expect(await screen.findByTestId('shared-pinned-rail')).toBeInTheDocument()
    expect(screen.getByTestId('shared-fox-rail')).toBeInTheDocument()
    expect(screen.getByTestId('social-feed-section')).toBeInTheDocument()
    expect(screen.getByTestId('social-composer-card')).toBeInTheDocument()
    expect(screen.getAllByTestId('social-feed-post')).toHaveLength(4)
    expect(screen.getByTestId('mascot-greeting-block')).toBeInTheDocument()
    expect(screen.getByTestId('mascot-decorated-stage')).toBeInTheDocument()
    expect(screen.getByTestId('mascot-prompt-mic-btn')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hôm nay bạn muốn làm gì?' })).toBeInTheDocument()
    expect(screen.getByTestId('fox-fallback')).toBeInTheDocument()
  })

  it('preserves Quick Create draft across Fox collapse/expand and persists rail collapse', async () => {
    const user = userEvent.setup()
    renderApp()

    const promptInput = await screen.findByLabelText('Hôm nay bạn muốn làm gì?')
    await user.type(promptInput, 'Đọc 15 trang sách kiến trúc')

    await user.click(screen.getByRole('button', { name: 'Thu gọn Fox Companion' }))
    expect(screen.getByTestId('shared-fox-rail')).toHaveAttribute('data-state', 'collapsed')

    await user.click(screen.getByRole('button', { name: 'Mở rộng Fox Companion' }))
    expect(screen.getByTestId('shared-fox-rail')).toHaveAttribute('data-state', 'expanded')
    expect(screen.getByLabelText('Hôm nay bạn muốn làm gì?')).toHaveValue(
      'Đọc 15 trang sách kiến trúc'
    )
  })

  it('surfaces honest PENDING / UNAVAILABLE feedback for unmerged Social actions', async () => {
    const user = userEvent.setup()
    renderApp()

    const composerInput = await screen.findByLabelText(
      'Chia sẻ khoảnh khắc hoàn thành nhiệm vụ cùng bạn bè'
    )
    await user.type(composerInput, 'Hoàn thành nhiệm vụ đầu ngày!')
    await user.click(screen.getByRole('button', { name: 'Đăng bài chia sẻ' }))

    expect(await screen.findByTestId('social-capability-status')).toHaveTextContent(/PENDING:/)
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

    const rmButtons = await screen.findAllByRole('button', { name: /chế độ giảm chuyển động/i })
    const rmButton = rmButtons[0]
    expect(document.documentElement.classList.contains('lq-rm')).toBe(false)

    await user.click(rmButton)
    expect(document.documentElement.classList.contains('lq-rm')).toBe(true)

    await user.click(rmButton)
    expect(document.documentElement.classList.contains('lq-rm')).toBe(false)
  })

  it('opens QuickCreate Sheet from FoxCompanionRail and closes on Escape', async () => {
    const user = userEvent.setup()
    renderApp()

    const detailBtn = await screen.findByRole('button', { name: 'Mở chi tiết tạo nhiệm vụ' })
    await user.click(detailBtn)

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Tạo nhiệm vụ nhanh')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
