import { expect, test } from '@playwright/test'

test.describe('FE-W01 Fox V2 Wardrobe & Cosmetic Shop', () => {
  test('hides FoxCompanionRail on /wardrobe & /wardrobe/shop, keeps <=1 WebGL canvas, and restores rail on /', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/wardrobe?nowebgl=1')

    await expect(page.getByTestId('wardrobe-workspace')).toHaveAttribute('data-mode', 'wardrobe')
    await expect(page.getByTestId('wardrobe-dressing-room')).toBeVisible()
    await expect(page.getByTestId('shared-fox-rail')).toHaveCount(0)
    expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1)

    // Switch to Shop (/wardrobe/shop)
    await page.getByTestId('shop-tab-btn').click()
    await expect(page).toHaveURL(/\/wardrobe\/shop/)
    await expect(page.getByTestId('wardrobe-workspace')).toHaveAttribute('data-mode', 'shop')
    await expect(page.getByTestId('shared-fox-rail')).toHaveCount(0)
    await expect(page.getByTestId('shop-api-boundary-banner')).toBeVisible()
    expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1)

    // Try on an item in Shop & verify buy button is disabled
    const firstShopCard = page.getByTestId('shop-item-card').first()
    await expect(firstShopCard.getByRole('button', { name: /Mua \(Chờ API\)/i })).toBeDisabled()
    await firstShopCard.getByRole('button', { name: /Thử trên Fox/i }).click()
    await expect(page.getByText('Đang xem trước (1)')).toBeVisible()

    // Browser back returns to /wardrobe with preview still intact
    await page.goBack()
    await expect(page.getByTestId('wardrobe-workspace')).toHaveAttribute('data-mode', 'wardrobe')
    await expect(page.getByText('Đang xem trước (1)')).toBeVisible()

    // Navigate back to Dashboard -> FoxCompanionRail restored, still <=1 canvas
    const headerNav = page.getByLabel('Điều hướng nhanh')
    await headerNav.getByRole('link', { name: 'Trang chủ' }).click()
    await expect(page.getByTestId('shared-fox-rail')).toBeVisible()
    expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1)
  })

  for (const [width, height] of [
    [1024, 900],
    [1280, 900],
    [1440, 900],
    [1920, 1080]
  ] as const) {
    test(`desktop ${width}x${height} has zero horizontal overflow on /wardrobe and /wardrobe/shop`, async ({
      page
    }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/wardrobe?nowebgl=1')
      await expect(page.getByTestId('wardrobe-dressing-room')).toBeVisible()

      const overflowWardrobe = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      )
      expect(overflowWardrobe).toBeLessThanOrEqual(0)

      await page.getByTestId('shop-tab-btn').click()
      await expect(page.getByTestId('shop-catalog-grid')).toBeVisible()
      const overflowShop = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      )
      expect(overflowShop).toBeLessThanOrEqual(0)
    })
  }
})
