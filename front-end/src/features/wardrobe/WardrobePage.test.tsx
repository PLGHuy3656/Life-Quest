import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { CompanionProvider } from '@/features/mascot/CompanionProvider'
import { foxDialogueBus } from '@/features/mascot/dialogue/dialogueBus'
import { WARDROBE_DIALOGUE_COLLECTION } from '@/features/mascot/dialogue/wardrobeDialogues'
import { COSMETIC_CATALOG } from '@/mascot/cosmetics/cosmeticContract'
import { WardrobePage } from './WardrobePage'
import { WARDROBE_CATALOG_ITEMS, WARDROBE_CATEGORIES } from './wardrobeCatalog'

function renderWardrobe(initialEntries: string[] = ['/wardrobe']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <CompanionProvider>
          <Routes>
            <Route path="/wardrobe/*" element={<WardrobePage />} />
          </Routes>
        </CompanionProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('FE-W01 WardrobePage & Cosmetic Shop', () => {
  beforeEach(() => {
    foxDialogueBus.dismiss()
  })

  it('validates real Gate I H1/H2 non-fixture catalog items and real GLB paths', () => {
    expect(WARDROBE_CATALOG_ITEMS).toHaveLength(18)
    for (const item of WARDROBE_CATALOG_ITEMS) {
      expect(COSMETIC_CATALOG[item.id]).toBeDefined()
      expect(item.def.fixture).not.toBe(true)
      expect(item.def.path).toMatch(/^models\/cosmetics\/[a-z0-9_]+\.glb$/)
      expect(item.ownershipStatus).toBe('UNVERIFIED_PENDING_API')
      expect(item.priceStatus).toBe('UNAVAILABLE_PENDING_API')
    }
    expect(WARDROBE_CATEGORIES.map((c) => c.label)).toEqual([
      'Tất cả',
      'Mũ',
      'Khăn',
      'Balo',
      'Trang phục',
      'Phụ kiện'
    ])
  })

  it('filters by category, replaces same-slot items, keeps independent slots, separates preview vs persisted state, and resets', async () => {
    const user = userEvent.setup()
    renderWardrobe(['/wardrobe'])

    expect(screen.getByText('PREVIEW ONLY')).toBeInTheDocument()
    const allCards = screen.getAllByTestId('wardrobe-item-card')
    expect(allCards).toHaveLength(18)

    // Persisted equipment stays default
    const stage = screen.getByTestId('wardrobe-dressing-room')
    expect(stage).toHaveAttribute('data-persisted-count', '0')
    expect(stage).toHaveAttribute('data-preview-slots', '')

    // Filter by Mũ (HEAD) — 6 real HEAD GLBs
    await user.click(screen.getByRole('tab', { name: /Mũ/i }))
    const hatCards = screen.getAllByTestId('wardrobe-item-card')
    expect(hatCards).toHaveLength(6)

    // Preview first hat (student_cap)
    await user.click(within(hatCards[0]).getByRole('button', { name: 'Thử ngay' }))
    expect(within(stage).getByText('Đang xem trước (1)')).toBeInTheDocument()
    expect(stage).toHaveAttribute('data-preview-slots', 'HEAD')
    expect(stage).toHaveAttribute('data-persisted-count', '0')

    // Preview another hat in same slot (HEAD) -> replaces previous HEAD preview (count stays 1)
    await user.click(within(hatCards[1]).getByRole('button', { name: 'Thử ngay' }))
    expect(within(stage).getByText('Đang xem trước (1)')).toBeInTheDocument()

    // Switch to Balo (BACK) and preview a backpack -> independent slot (count becomes 2)
    await user.click(screen.getByRole('tab', { name: /Balo/i }))
    const backCards = screen.getAllByTestId('wardrobe-item-card')
    expect(backCards).toHaveLength(3)
    await user.click(within(backCards[0]).getByRole('button', { name: 'Thử ngay' }))
    expect(within(stage).getByText('Đang xem trước (2)')).toBeInTheDocument()
    expect(stage.getAttribute('data-preview-slots')).toContain('HEAD')
    expect(stage.getAttribute('data-preview-slots')).toContain('BACK')
    expect(stage).toHaveAttribute('data-persisted-count', '0')

    // Khăn (NECK) shows honest built-in default Fox scarf without inventing fake NECK GLBs
    await user.click(screen.getByRole('tab', { name: /Khăn/i }))
    expect(screen.getByTestId('default-scarf-card')).toBeInTheDocument()

    // Switch to Hộc tủ tab and apply H2 Tết outfit preset (3 items)
    await user.click(screen.getByTestId('closet-tab-hanging'))
    await user.click(screen.getByRole('button', { name: 'Tết' }))
    expect(within(stage).getByText('Đang xem trước (3)')).toBeInTheDocument()
  })

  it('supports Cosmetic Shop route (/wardrobe/shop) with try-on, preserved category, and disabled purchases without API', async () => {
    const user = userEvent.setup()
    renderWardrobe(['/wardrobe'])

    // Select Mũ category in Wardrobe then switch to Shop -> category preserved
    await user.click(screen.getByRole('tab', { name: /Mũ/i }))
    await user.click(screen.getByTestId('shop-tab-btn'))

    expect(screen.getByTestId('wardrobe-workspace')).toHaveAttribute('data-mode', 'shop')
    expect(screen.getByTestId('shop-api-boundary-banner')).toBeInTheDocument()

    const shopCards = screen.getAllByTestId('shop-item-card')
    expect(shopCards).toHaveLength(6)

    // Purchase button is strictly disabled while Shop/Purchase API is pending
    const buyBtn = within(shopCards[0]).getByRole('button', { name: /Mua \(Chờ API\)/i })
    expect(buyBtn).toBeDisabled()

    // Try-on from Shop works and does not alter authoritative Coin/Level placeholders
    expect(screen.getByTestId('wardrobe-coin-balance')).toHaveTextContent('—')
    expect(screen.getByTestId('wardrobe-player-level')).toHaveTextContent('—')
    await user.click(within(shopCards[0]).getByRole('button', { name: /Thử trên Fox/i }))
    expect(screen.getByText('Đang xem trước (1)')).toBeInTheDocument()
    expect(screen.getByTestId('wardrobe-coin-balance')).toHaveTextContent('—')
  })

  it('enforces Fox dialogue boundaries — wardrobe lines never claim purchase or save succeeded', () => {
    const forbidden = /(đã mua|mua thành công|đã lưu|đồng bộ tài khoản|trừ xu)/i
    for (const entry of WARDROBE_DIALOGUE_COLLECTION.entries) {
      expect(entry.text).not.toMatch(forbidden)
    }
  })
})
