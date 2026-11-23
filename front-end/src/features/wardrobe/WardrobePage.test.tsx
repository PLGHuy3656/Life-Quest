import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CompanionProvider } from '@/features/mascot/CompanionProvider'
import { WardrobePage } from './WardrobePage'

describe('WardrobePage (H1/H2 Cosmetic Catalog Preview)', () => {
  it('filters catalog by slot, equips cosmetics, applies H2 outfit preset, and resets to base', async () => {
    const user = userEvent.setup()
    render(
      <CompanionProvider>
        <WardrobePage />
      </CompanionProvider>
    )

    expect(screen.getByText('PREVIEW ONLY')).toBeInTheDocument()
    const allCards = screen.getAllByTestId('wardrobe-item-card')
    expect(allCards.length).toBeGreaterThanOrEqual(18)

    // Filter by HEAD slot
    await user.click(screen.getByRole('tab', { name: /Đầu \(HEAD\)/i }))
    const headCards = screen.getAllByTestId('wardrobe-item-card')
    expect(headCards.length).toBeLessThan(allCards.length)
    expect(headCards.length).toBeGreaterThanOrEqual(4)

    // Equip first HEAD item
    const tryButtons = screen.getAllByRole('button', { name: 'Thử ngay' })
    await user.click(tryButtons[0])
    expect(screen.getByRole('button', { name: /Khôi phục mặc định \(1\)/i })).toBeEnabled()

    // Apply H2 Tết outfit preset (3 items)
    await user.click(screen.getByRole('button', { name: 'Tết' }))
    expect(screen.getByRole('button', { name: /Khôi phục mặc định \(3\)/i })).toBeEnabled()

    // Reset to base
    await user.click(screen.getByRole('button', { name: /Khôi phục mặc định \(3\)/i }))
    expect(screen.getByRole('button', { name: /Khôi phục mặc định \(0\)/i })).toBeDisabled()
  })
})
