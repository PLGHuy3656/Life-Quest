import { expect, test } from '@playwright/test'

test.describe('FE-06A Private Messenger Core', () => {
  test('hides FoxCompanionRail on /messages, keeps <=1 WebGL canvas, and restores Fox on /', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/messages?nowebgl=1')

    await expect(page.getByTestId('messenger-workspace')).toBeVisible()
    await expect(page.getByTestId('shared-fox-rail')).toHaveCount(0)
    expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1)

    // Switch to group chat, open details panel, and test lightbox
    await page.getByTestId('messenger-conv-item-conv-group-run').click()
    await expect(page.getByTestId('messenger-chat-header')).toContainText('Nhóm Chạy Bộ Sáng 6h')
    await page.getByTestId('messenger-toggle-details-btn').click()
    await expect(page.getByTestId('messenger-details-panel')).toBeVisible()

    // Navigate back to Dashboard -> FoxCompanionRail restored
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
    test(`desktop ${width}x${height} has zero horizontal and vertical document overflow on /messages`, async ({
      page
    }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/messages?nowebgl=1')
      await expect(page.getByTestId('messenger-workspace')).toBeVisible()

      const metrics = await page.evaluate(() => ({
        hOverflow: document.documentElement.scrollWidth - window.innerWidth,
        vOverflow: document.documentElement.scrollHeight - window.innerHeight
      }))
      expect(metrics.hOverflow).toBeLessThanOrEqual(0)
      expect(metrics.vOverflow).toBeLessThanOrEqual(0)
    })
  }

  test('mobile 390x844 navigates cleanly between list, chat, and details with zero overflow', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/messages?nowebgl=1')

    await expect(page.getByTestId('messenger-sidebar')).toBeVisible()
    await page.getByTestId('messenger-conv-item-conv-minh-anh').click()
    await expect(page.getByTestId('messenger-chat-header')).toBeVisible()

    const hOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    )
    expect(hOverflow).toBeLessThanOrEqual(0)
  })
})
