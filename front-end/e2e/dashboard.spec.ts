import { expect, test } from '@playwright/test'

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, expectedNav: 'Điều hướng nhanh' },
  { name: 'tablet', width: 820, height: 1180, expectedNav: 'Điều hướng máy tính bảng' },
  { name: 'mobile', width: 390, height: 844, expectedNav: 'Điều hướng di động' }
] as const

for (const vp of VIEWPORTS) {
  test(`viewport ${vp.name} (${vp.width}x${vp.height}): responsive nav, Fox V2 & zero overflow`, async ({
    page
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Bảng ghim' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Social và nhật ký hành trình' })).toBeVisible()

    // Fox V2 canvas OR WebGL fallback must be present without duplicate WebGL contexts
    const foxStage = page.locator('[data-testid="fox-canvas-container"], [data-testid="fox-fallback"]')
    await expect(foxStage.first()).toBeVisible()

    const canvasCount = await page.locator('canvas').count()
    expect(canvasCount).toBeLessThanOrEqual(1)

    // Production preview must NOT silently fall back to mock for authenticated LIVE endpoints
    await expect(
      page.getByTestId('pinned-board-card').getByText(/AUTHENTICATION_REQUIRED/)
    ).toBeVisible()

    // Verify correct nav for breakpoint
    await expect(page.getByLabel(vp.expectedNav)).toBeVisible()

    // Zero horizontal overflow
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    )
    expect(overflow).toBe(false)
  })
}

test('nowebgl=1 renders accessible FoxFallback cleanly', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?nowebgl=1')
  await expect(page.getByTestId('fox-fallback')).toBeVisible()
  await expect(page.getByTestId('fox-fallback')).toHaveAttribute('data-reason', 'webgl')
})

test('wardrobe H1/H2 cosmetic switching, reset & Voice Assistant Gate I sheet', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/wardrobe?nowebgl=1')

  await expect(page.getByRole('heading', { name: /Tủ đồ Fox V2/i })).toBeVisible()
  await page.getByRole('button', { name: 'Tết' }).click()
  await expect(page.getByRole('button', { name: /Khôi phục mặc định \(3\)/i })).toBeEnabled()
  await page.getByRole('button', { name: /Khôi phục mặc định \(3\)/i }).click()
  await expect(page.getByRole('button', { name: /Khôi phục mặc định \(0\)/i })).toBeDisabled()

  // Open Voice Assistant dock sheet & test state transitions + Escape dismissal
  await page.getByRole('button', { name: /Mở Trợ lý Giọng nói Fox V2/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await page.getByRole('button', { name: 'Lắng nghe' }).click()
  await expect(page.getByText(/voice_listening_loop/i)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('reduced-motion toggle and accessible Sheet Escape dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?nowebgl=1')

  const rmBtn = page.getByRole('button', { name: /chế độ giảm chuyển động/i })
  await rmBtn.click()
  await expect(page.locator('html')).toHaveClass(/lq-rm/)

  await page.getByRole('button', { name: /\+ Thêm nhiệm vụ/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('protected route /work redirects unauthenticated users to /login with validation', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/work')

  await expect(page).toHaveURL(/\/login\?redirect=%2Fwork/)
  await expect(page.getByRole('heading', { name: /Đăng nhập LifeQuest/i })).toBeVisible()

  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page.getByText('Vui lòng nhập email.')).toBeVisible()
})

test('route navigation (/ -> /wardrobe -> /) cleans up and maintains single active WebGL renderer', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Bảng ghim' })).toBeVisible()
  expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1)

  const headerNav = page.getByLabel('Điều hướng nhanh')
  await headerNav.getByRole('link', { name: 'Tủ đồ Fox' }).click()
  await expect(page.getByRole('heading', { name: /Tủ đồ Fox V2/i })).toBeVisible()
  expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1)

  await headerNav.getByRole('link', { name: 'Trang chủ' }).click()
  await expect(page.getByRole('heading', { name: 'Bảng ghim' })).toBeVisible()
  expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1)
})

for (const width of [1024, 1280, 1440, 1920]) {
  test(`FE-03.5E desktop ${width}px: mascot greeting + prompt on right, pinned + social on left, no old left hero`, async ({
    page
  }) => {
    const height = width === 1920 ? 1080 : 900
    await page.setViewportSize({ width, height })
    await page.goto('/?nowebgl=1')

    // 1. Desktop sidebar removed & old left hero hidden on Desktop
    expect(await page.locator('aside').count()).toBe(0)
    await expect(page.getByTestId('hero-info-card')).toBeHidden()

    const header = page.getByTestId('desktop-canvas-header')
    await expect(header).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    )
    expect(overflow).toBe(false)

    // Verify 3 header islands exist and do not overlap horizontally
    const rects = await header.evaluate((el) => {
      const grid = el.firstElementChild as HTMLElement
      return Array.from(grid.children).map((c) => {
        const r = c.getBoundingClientRect()
        return { left: r.left, right: r.right, height: Math.round(r.height) }
      })
    })
    expect(rects).toHaveLength(3)
    expect(rects[0].height).toBe(64)
    expect(rects[1].height).toBe(64)
    expect(rects[2].height).toBe(64)
    expect(rects[0].right).toBeLessThanOrEqual(rects[1].left + 1)
    expect(rects[1].right).toBeLessThanOrEqual(rects[2].left + 1)

    // 2. Greeting, decorated stage & "Hôm nay bạn muốn làm gì?" inside right mascot panel; Pinned + Social on left
    await expect(page.getByTestId('mascot-greeting-block')).toBeVisible()
    await expect(page.getByTestId('mascot-decorated-stage')).toBeVisible()
    await expect(page.getByTestId('mascot-prompt-box')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Hôm nay bạn muốn làm gì?' })).toBeVisible()

    // Verify social mock illustrations loaded cleanly
    const socialImgs = page.locator('[data-testid="social-preview-item"] img')
    await expect(socialImgs).toHaveCount(2)
    for (let i = 0; i < 2; i++) {
      await expect(socialImgs.nth(i)).toBeVisible()
      const loaded = await socialImgs.nth(i).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)
      expect(loaded).toBe(true)
    }

    const layout = await page.evaluate(() => {
      const pinned = document.querySelector('[data-testid="pinned-board-card"]')!.getBoundingClientRect()
      const social = document.querySelector('[data-testid="social-preview-card"]')!.getBoundingClientRect()
      const mascot = document.querySelector('[data-testid="mascot-hero-panel"]')!.getBoundingClientRect()
      return { pinned, social, mascot }
    })
    expect(layout.pinned.right).toBeLessThanOrEqual(layout.mascot.left + 1)
    expect(layout.social.right).toBeLessThanOrEqual(layout.mascot.left + 1)
    expect(layout.social.top).toBeGreaterThanOrEqual(layout.pinned.bottom)
  })
}
