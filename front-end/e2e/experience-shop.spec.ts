import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const SHOT_DIR = path.resolve(process.cwd(), '../docs/frontend/screenshots/fe15b_shop')
fs.mkdirSync(SHOT_DIR, { recursive: true })

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(2)
}

test.describe('FE-15B Experience Shop E2E & Responsive Verification', () => {
  test('Desktop 1440x900: Shop Hub, Categories, Profile Cosmetics, Purchase Modal, Wallet, Wardrobe & Screenshots', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/shop')

    await expect(page.getByTestId('experience-shop-page')).toBeVisible()
    await assertNoHorizontalOverflow(page)
    await page.screenshot({ path: path.join(SHOT_DIR, '01-shop-hub-fox-1440.png'), fullPage: false })

    // Open Purchase State Modal and verify real purchase is strictly disabled
    await page.getByTestId('hub-fox-inspect-tet_ao_dai').click()
    await expect(page.getByTestId('shop-purchase-modal')).toBeVisible()
    await expect(page.getByTestId('shop-real-purchase-disabled-btn')).toBeDisabled()
    await page.screenshot({ path: path.join(SHOT_DIR, '02-shop-purchase-modal-1440.png') })
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('shop-purchase-modal')).toHaveCount(0)

    // Profile Cosmetics tab
    await page.getByTestId('shop-nav-profile').click()
    await expect(page.getByTestId('shop-profile-cosmetics-view')).toBeVisible()
    await page.getByTestId('preview-frame-btn-frame-sunrise-trail').click()
    await assertNoHorizontalOverflow(page)
    await page.screenshot({ path: path.join(SHOT_DIR, '03-shop-profile-cosmetics-1440.png') })

    // Coin Wallet tab + filters
    await page.getByTestId('shop-nav-wallet').click()
    await expect(page.getByTestId('shop-wallet-view')).toBeVisible()
    await page.getByTestId('wallet-filter-earned').click()
    await assertNoHorizontalOverflow(page)
    await page.screenshot({ path: path.join(SHOT_DIR, '04-shop-wallet-1440.png') })

    // Phase 2 Coming Soon check
    await page.getByTestId('shop-nav-hub').click()
    await page.getByTestId('shop-category-messages').click()
    await expect(page.getByTestId('shop-panel-messages')).toContainText('Sắp ra mắt')
    await page.screenshot({ path: path.join(SHOT_DIR, '05-shop-phase2-messages-1440.png') })

    // Wardrobe Shop regression check
    await page.goto('/wardrobe/shop')
    await expect(page.getByTestId('wardrobe-workspace')).toHaveAttribute('data-mode', 'shop')
    await expect(page.getByTestId('wardrobe-open-shop-hub-btn')).toBeVisible()
    await page.screenshot({ path: path.join(SHOT_DIR, '06-wardrobe-shop-1440.png') })
  })

  test('Responsive Matrix: 1280x800, 1024x768, 834x1112, 390x844, 375x812 with zero horizontal overflow', async ({
    page,
  }) => {
    const viewports = [
      { width: 1280, height: 800, name: '1280' },
      { width: 1024, height: 768, name: '1024' },
      { width: 834, height: 1112, name: 'tablet-834' },
      { width: 390, height: 844, name: 'mobile-390' },
      { width: 375, height: 812, name: 'mobile-375' },
    ]

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/shop')
      await expect(page.getByTestId('experience-shop-page')).toBeVisible()
      await assertNoHorizontalOverflow(page)
      if (vp.name === 'tablet-834' || vp.name === 'mobile-390') {
        await page.screenshot({ path: path.join(SHOT_DIR, `07-shop-hub-${vp.name}.png`) })
      }
    }

    // Mobile Wallet check at 390x844
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/shop/wallet')
    await expect(page.getByTestId('shop-wallet-view')).toBeVisible()
    await assertNoHorizontalOverflow(page)
    await page.screenshot({ path: path.join(SHOT_DIR, '08-shop-wallet-mobile-390.png') })
  })
})
