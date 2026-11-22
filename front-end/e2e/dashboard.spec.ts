import { expect, test } from '@playwright/test'

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, expectedNav: 'Điều hướng chính' },
  { name: 'tablet', width: 820, height: 1180, expectedNav: 'Điều hướng máy tính bảng' },
  { name: 'mobile', width: 390, height: 844, expectedNav: 'Điều hướng di động' }
] as const

for (const vp of VIEWPORTS) {
  test(`viewport ${vp.name} (${vp.width}x${vp.height}): responsive nav & zero horizontal overflow`, async ({
    page
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Bảng ghim' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Social và nhật ký hành trình' })).toBeVisible()
    await expect(page.getByTestId('mascot-slot-placeholder')).toBeVisible()

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

test('reduced-motion toggle and accessible Sheet Escape dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  // Toggle lq-rm
  const rmBtn = page.getByRole('button', { name: /chế độ giảm chuyển động/i })
  await rmBtn.click()
  await expect(page.locator('html')).toHaveClass(/lq-rm/)

  // Open & close Quick-Create Sheet via Escape
  await page.getByRole('button', { name: /Tạo mới nhanh/i }).click()
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
