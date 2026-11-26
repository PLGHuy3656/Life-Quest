import { expect, test } from '@playwright/test'

const TARGET_VIEWPORTS = [
  { name: 'Desktop 1440x900', width: 1440, height: 900, desktop: true },
  { name: 'Laptop 1280x800', width: 1280, height: 800, desktop: true },
  { name: 'Tablet landscape 1024x768', width: 1024, height: 768, desktop: false },
  { name: 'Tablet portrait 768x1024', width: 768, height: 1024, desktop: false },
  { name: 'Mobile 390x844', width: 390, height: 844, desktop: false },
  { name: 'Mobile 375x812', width: 375, height: 812, desktop: false },
]

test.describe('FE-12B Landing Page', () => {
  test('renders approved FE-12B story, checkpoints, and navigates to Register & Login', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/welcome')

    await expect(page.getByTestId('landing-page')).toBeVisible()
    await expect(page.getByTestId('landing-desktop')).toBeVisible()
    await expect(page.getByTestId('landing-desktop').getByRole('heading', { level: 1 })).toContainText(
      'Mỗi ngày đều là',
    )
    await expect(page.getByTestId('landing-desktop').getByRole('heading', { level: 1 })).toContainText(
      'phiêu lưu.',
    )

    // Verify all 4 checkpoints + finale exist on desktop
    for (const id of ['#cp1', '#cp2', '#cp3', '#cp4', '#finale']) {
      await expect(page.locator(id)).toBeAttached()
    }

    // No extra WebGL renderer on Landing
    expect(await page.locator('canvas').count()).toBe(0)

    // Primary CTA -> /register
    await page.getByTestId('landing-start-btn').click()
    await expect(page).toHaveURL(/\/register/)

    // Back to /index alias -> Login CTA -> /login
    await page.goto('/index')
    await expect(page.getByTestId('landing-page')).toBeVisible()
    await page.getByTestId('landing-login-btn').click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('has zero horizontal overflow across all 6 required viewports', async ({ page }) => {
    for (const vp of TARGET_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/welcome')
      await expect(page.getByTestId('landing-page')).toBeVisible()

      if (vp.desktop) {
        await expect(page.getByTestId('landing-desktop')).toBeVisible()
      } else {
        await expect(page.getByTestId('landing-mobile')).toBeVisible()
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      )
      expect(overflow, `Horizontal overflow detected at ${vp.name}`).toBe(false)
    }
  })

  test('respects prefers-reduced-motion without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/welcome')

    await expect(page.getByTestId('landing-desktop')).toBeVisible()
    const animationName = await page
      .locator('[data-testid="landing-desktop"] .lqCloud, [data-testid="landing-desktop"] header')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName)
    expect(animationName).toBe('none')
    expect(errors).toEqual([])
  })
})
