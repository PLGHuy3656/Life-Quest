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

    // Fox V2 canvas OR WebGL fallback must be present without duplicate WebGL contexts
    const foxStage = page.locator(
      '[data-testid="fox-canvas-container"], [data-testid="fox-fallback"]'
    )
    await expect(foxStage.first()).toBeVisible()

    const canvasCount = await page.locator('canvas').count()
    expect(canvasCount).toBeLessThanOrEqual(1)

    // Production preview must NOT silently fall back to mock for authenticated LIVE endpoints
    await expect(page.getByText(/AUTHENTICATION_REQUIRED/).first()).toBeVisible()

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
  await page.getByRole('button', { name: /Mở Trợ lý Giọng nói Fox V2/i }).first().click()
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

  await page.getByRole('button', { name: 'Mở chi tiết tạo nhiệm vụ' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('protected routes (/settings, /profile) redirect unauthenticated users to /login', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/settings')

  await expect(page).toHaveURL(/\/login\?redirect=%2Fsettings/)
  await expect(page.getByRole('heading', { name: /Đăng nhập LifeQuest/i })).toBeVisible()

  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page.getByText('Vui lòng nhập email.')).toBeVisible()

  await page.goto('/profile')
  await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/)
})

test('shared AppShell route navigation (/ -> /messages -> /wardrobe -> /) preserves Fox collapse, draft & single WebGL', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByTestId('social-feed-section')).toBeVisible()
  expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1)

  // Type draft into Quick Create & collapse FoxCompanionRail
  await page.locator('#mascot-quick-prompt').fill('Ôn tập kiến trúc hệ thống')
  await page.getByRole('button', { name: 'Thu gọn Fox Companion' }).click()
  await expect(page.getByTestId('shared-fox-rail')).toHaveAttribute('data-state', 'collapsed')

  // Navigate to /messages and verify collapsed state persists
  const headerNav = page.getByLabel('Điều hướng nhanh')
  await headerNav.getByRole('link', { name: 'Tin nhắn' }).click()
  await expect(page.getByRole('heading', { name: /Tin nhắn & Nhóm bạn bè/i })).toBeVisible()
  await expect(page.getByTestId('shared-fox-rail')).toHaveAttribute('data-state', 'collapsed')

  // Navigate to /wardrobe and verify single active WebGL renderer
  await headerNav.getByRole('link', { name: 'Tủ đồ Fox' }).click()
  await expect(page.getByRole('heading', { name: /Tủ đồ Fox V2/i })).toBeVisible()
  expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1)

  // Return to /, expand Fox, and verify Quick Create draft survived intact
  await headerNav.getByRole('link', { name: 'Trang chủ' }).click()
  await expect(page.getByTestId('social-feed-section')).toBeVisible()
  await page.getByRole('button', { name: 'Mở rộng Fox Companion' }).click()
  await expect(page.locator('#mascot-quick-prompt')).toHaveValue('Ôn tập kiến trúc hệ thống')
  expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1)
})

for (const width of [1024, 1280, 1440, 1920]) {
  test(`FE-03.5I desktop ${width}px: shared 3-region AppShell, Social-First feed, Fox rail & alignment`, async ({
    page
  }) => {
    const height = width === 1920 ? 1080 : 900
    await page.setViewportSize({ width, height })
    await page.goto('/?nowebgl=1')

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

    // Verify Social-First Home + Compact Composer + Shared Fox Rail
    await expect(page.getByTestId('social-feed-section')).toBeVisible()
    await expect(page.getByTestId('social-composer-card')).toBeVisible()
    await expect(page.getByTestId('shared-fox-rail')).toBeVisible()
    await expect(page.getByTestId('mascot-prompt-mic-btn')).toBeVisible()

    // In production build without auth, 0 pinned tasks => PinnedTaskRail auto-hides cleanly
    await expect(page.getByTestId('shared-pinned-rail')).toHaveCount(0)

    // Verify Header-to-Shell outer alignment within 4px and no overlap with Floating Fox dock
    const layout = await page.evaluate(() => {
      const headerGrid = document.querySelector('[data-testid="desktop-canvas-header"]')?.firstElementChild
      const headerRect = headerGrid?.getBoundingClientRect()
      const shell = document.querySelector('[data-testid="shared-desktop-three-region"]')!.getBoundingClientRect()
      const feed = document.querySelector('[data-testid="social-feed-section"]')!.getBoundingClientRect()
      const fox = document.querySelector('[data-testid="shared-fox-rail"]')!.getBoundingClientRect()
      const prompt = document.querySelector('[data-testid="mascot-prompt-box"]')!.getBoundingClientRect()
      const dock = document.querySelector('[data-testid="floating-mascot-dock"]')!.getBoundingClientRect()
      return { headerRect, shell, feed, fox, prompt, dock }
    })

    expect(Math.abs(layout.shell.left - layout.headerRect!.left)).toBeLessThanOrEqual(4)
    expect(Math.abs(layout.shell.right - layout.headerRect!.right)).toBeLessThanOrEqual(4)
    expect(layout.feed.right).toBeLessThanOrEqual(layout.fox.left + 1)

    const dockOverlapsPrompt =
      layout.dock.left < layout.prompt.right &&
      layout.dock.right > layout.prompt.left &&
      layout.dock.top < layout.prompt.bottom &&
      layout.dock.bottom > layout.prompt.top
    expect(dockOverlapsPrompt).toBe(false)
  })
}

test('FE-03.5J adaptive social media preview: multi-image selection, +N overlay, lightbox keyboard nav & removal', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?nowebgl=1')

  // Minimal valid 1x1 PNG buffer
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  )

  // Compact before selection
  await expect(page.getByTestId('social-composer-card')).toHaveAttribute('data-has-media', '0')

  // Upload 5 local images to trigger 2x2 + "+1" overlay
  await page.getByTestId('social-media-file-input').setInputFiles([
    { name: 'img-1.png', mimeType: 'image/png', buffer: pngBuffer },
    { name: 'img-2.png', mimeType: 'image/png', buffer: pngBuffer },
    { name: 'img-3.png', mimeType: 'image/png', buffer: pngBuffer },
    { name: 'img-4.png', mimeType: 'image/png', buffer: pngBuffer },
    { name: 'img-5.png', mimeType: 'image/png', buffer: pngBuffer }
  ])

  const drawer = page.getByTestId('composer-media-drawer')
  await expect(drawer).toBeVisible()
  await expect(drawer.getByTestId('social-media-overflow-badge')).toHaveText('+1')

  // Open lightbox and navigate via keyboard
  await drawer.getByRole('button', { name: /img-1\.png/i }).first().click()
  const lightbox = page.getByTestId('social-media-lightbox')
  await expect(lightbox).toBeVisible()
  await expect(lightbox.getByText('1 / 5')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(lightbox.getByText('2 / 5')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(lightbox).toBeHidden()

  // Clear all collapses composer back to compact state
  await drawer.getByRole('button', { name: 'Xóa tất cả' }).click()
  await expect(page.getByTestId('social-composer-card')).toHaveAttribute('data-has-media', '0')
})

test('FOX-D02 overhead FoxSpeechBubble: positioned above Fox, hides on collapse, Escape dismissible', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?nowebgl=1')

  const bubble = page.getByTestId('fox-speech-bubble')
  await expect(bubble).toBeVisible()

  // Positioned cleanly in the upper zone of the Fox stage without clipping
  const geom = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="mascot-decorated-stage"]')!.getBoundingClientRect()
    const b = document.querySelector('[data-testid="fox-speech-bubble"]')!.getBoundingClientRect()
    return { stage, b }
  })
  expect(geom.b.top).toBeGreaterThanOrEqual(geom.stage.top)
  expect(geom.b.left).toBeGreaterThanOrEqual(geom.stage.left)
  expect(geom.b.right).toBeLessThanOrEqual(geom.stage.right)
  expect(geom.b.bottom).toBeLessThanOrEqual(geom.stage.top + 92)

  // Hides cleanly when Fox panel collapses, restores when expanded
  await page.getByRole('button', { name: 'Thu gọn Fox Companion' }).click()
  await expect(bubble).toHaveCount(0)
  await page.getByRole('button', { name: 'Mở rộng Fox Companion' }).click()
  await expect(bubble).toBeVisible()

  // Dismisses cleanly via Escape key
  await page.keyboard.press('Escape')
  await expect(bubble).toHaveCount(0)
})

test('FOX-D03.1 touch interaction: click and keyboard trigger touch dialogue without side effects', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?nowebgl=1')

  const bubble = page.getByTestId('fox-speech-bubble')
  const touchTarget = page.getByTestId('fox-touch-target')
  await expect(touchTarget).toBeVisible()
  await expect(touchTarget).toHaveAttribute('aria-label', 'Chạm vào Fox')

  // Verify touch target is tightly bounded inside the Fox stage (not the full companion panel)
  const bounds = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="mascot-decorated-stage"]')!.getBoundingClientRect()
    const target = document.querySelector('[data-testid="fox-touch-target"]')!.getBoundingClientRect()
    return { stage, target }
  })
  expect(bounds.target.width).toBeLessThan(bounds.stage.width * 0.6)
  expect(bounds.target.top).toBeGreaterThanOrEqual(bounds.stage.top)
  expect(bounds.target.bottom).toBeLessThanOrEqual(bounds.stage.bottom)

  // Dismiss initial greeting bubble
  await page.keyboard.press('Escape')
  await expect(bubble).toHaveCount(0)

  // First click -> TOUCH_SINGLE
  await touchTarget.click()
  await expect(bubble).toBeVisible()
  await expect(bubble).toHaveAttribute('data-trigger', 'TOUCH_SINGLE')

  // Second click after cooldown -> TOUCH_REPEAT
  await page.waitForTimeout(1300)
  await touchTarget.click()
  await expect(bubble).toBeVisible()
  await expect(bubble).toHaveAttribute('data-trigger', 'TOUCH_REPEAT')

  // Keyboard Enter activation works and does not focus Quick Create
  await page.waitForTimeout(1300)
  await touchTarget.focus()
  await page.keyboard.press('Enter')
  await expect(bubble).toBeVisible()
  await expect(bubble).toHaveAttribute('data-trigger', 'TOUCH_REPEAT')

  const quickCreateFocused = await page.evaluate(
    () => document.activeElement?.getAttribute('placeholder') === 'Tôi muốn...'
  )
  expect(quickCreateFocused).toBe(false)

  // Single WebGL canvas budget preserved
  const canvasCount = await page.evaluate(() => document.querySelectorAll('canvas').length)
  expect(canvasCount).toBeLessThanOrEqual(1)
})
