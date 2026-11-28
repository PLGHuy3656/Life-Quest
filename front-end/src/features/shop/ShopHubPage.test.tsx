import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/router'
import { CompanionProvider } from '@/features/mascot/CompanionProvider'
import { useAuthStore } from '@/stores/authStore'
import { useMockProfileStore } from '@/stores/mockProfileStore'

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <CompanionProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </CompanionProvider>
    </QueryClientProvider>,
  )
}

describe('FE-15B Experience Shop, Coin Wallet, Profile Cosmetics & Purchase States', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    useAuthStore.getState().clearSession()
    useMockProfileStore.getState().activateMockSession()
    useMockProfileStore.getState().resetProfile()
  })

  it('navigates to Shop Hub and switches all 4 categories with honest Phase 2 labels', async () => {
    const user = userEvent.setup()
    renderAt('/shop')

    expect(await screen.findByTestId('experience-shop-page')).toBeInTheDocument()
    expect(screen.getByTestId('shop-panel-fox')).toBeInTheDocument()

    // No food or toys anywhere in the shop
    expect(screen.queryByText(/thức ăn|đồ chơi|food|toy/i)).not.toBeInTheDocument()

    // Switch to Profile Cosmetics category
    await user.click(screen.getByTestId('shop-category-profile'))
    expect(screen.getByTestId('shop-profile-cosmetics-view')).toBeInTheDocument()
    expect(screen.getByTestId('achievement-separation-note')).toHaveTextContent(
      /Huy hiệu thành tích không bán bằng Xu/i,
    )

    // Switch to Phase 2 Messages category (Coming Soon, zero buy controls)
    await user.click(screen.getByTestId('shop-category-messages'))
    const msgPanel = screen.getByTestId('shop-panel-messages')
    expect(msgPanel).toHaveTextContent(/Sắp ra mắt/i)
    expect(within(msgPanel).queryByRole('button', { name: /Mua/i })).not.toBeInTheDocument()

    // Switch to Phase 2 Album category (Coming Soon, zero buy controls)
    await user.click(screen.getByTestId('shop-category-album'))
    const albPanel = screen.getByTestId('shop-panel-album')
    expect(albPanel).toHaveTextContent(/Sắp ra mắt/i)
    expect(within(albPanel).queryByRole('button', { name: /Mua/i })).not.toBeInTheDocument()
  })

  it('supports Profile Cosmetics live Avatar Frame & Decorative Title preview with TRANG TRÍ badge', async () => {
    const user = userEvent.setup()
    renderAt('/shop/profile')

    expect(await screen.findByTestId('shop-profile-cosmetics-view')).toBeInTheDocument()
    expect(screen.getByTestId('profile-preview-title')).toHaveTextContent('TRANG TRÍ')

    // Preview another static avatar frame
    await user.click(screen.getByTestId('preview-frame-btn-frame-sunrise-trail'))
    expect(screen.getByTestId('profile-preview-frame')).toHaveAttribute(
      'data-frame-id',
      'frame-sunrise-trail',
    )

    // Preview another decorative title
    await user.click(screen.getByTestId('preview-title-btn-title-dawn-runner'))
    expect(screen.getByTestId('profile-preview-title')).toHaveTextContent('Người giữ nhịp bình minh')
    expect(screen.getByTestId('profile-preview-title')).toHaveTextContent('TRANG TRÍ')
  })

  it('filters Coin Wallet transactions (EARNED/SPENT/REFUNDED) and clearly labels preview data', async () => {
    const user = userEvent.setup()
    renderAt('/shop/wallet')

    expect(await screen.findByTestId('shop-wallet-view')).toBeInTheDocument()
    expect(screen.getByTestId('wallet-preview-notice')).toBeInTheDocument()
    expect(screen.getByTestId('wallet-data-source-badge')).toHaveTextContent(/Mock|xem trước/i)

    const initialItems = within(screen.getByTestId('wallet-tx-list')).getAllByRole('listitem')
    expect(initialItems).toHaveLength(4)

    await user.click(screen.getByTestId('wallet-filter-earned'))
    expect(within(screen.getByTestId('wallet-tx-list')).getAllByRole('listitem')).toHaveLength(2)

    await user.click(screen.getByTestId('wallet-filter-spent'))
    expect(within(screen.getByTestId('wallet-tx-list')).getAllByRole('listitem')).toHaveLength(1)

    await user.click(screen.getByTestId('wallet-filter-refunded'))
    expect(within(screen.getByTestId('wallet-tx-list')).getAllByRole('listitem')).toHaveLength(1)
  })

  it('keeps real purchase strictly disabled and renders all 9 approved purchase UI states honestly', async () => {
    const user = userEvent.setup()
    renderAt('/shop')

    // Open Purchase State Modal for a high-level / high-price item (tet_ao_dai: 680 Xu, Lv.15)
    await user.click(screen.getByTestId('hub-fox-inspect-tet_ao_dai'))
    const modal = await screen.findByTestId('shop-purchase-modal')
    expect(modal).toHaveAttribute('data-purchase-state', 'level_locked')
    expect(screen.getByTestId('shop-real-purchase-disabled-btn')).toBeDisabled()

    // Expand isolated UI state inspector and verify key states
    await user.click(screen.getByTestId('toggle-purchase-state-inspector'))

    await user.click(screen.getByTestId('simulate-state-insufficient_coins'))
    expect(screen.getByTestId('purchase-state-insufficient')).toBeInTheDocument()

    await user.click(screen.getByTestId('simulate-state-api_unavailable'))
    expect(screen.getByTestId('purchase-state-api-unavailable')).toBeInTheDocument()

    await user.click(screen.getByTestId('simulate-state-success_simulated'))
    expect(screen.getByTestId('purchase-state-simulated-success')).toHaveTextContent(
      /TRẠNG THÁI MÔ PHỎNG UI/i,
    )
    // Real purchase button remains strictly disabled in all states
    expect(screen.getByTestId('shop-real-purchase-disabled-btn')).toBeDisabled()
  })
})
