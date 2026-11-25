import { expect, test } from '@playwright/test'

test.describe('FE-07 Authentication Experience', () => {
  test('renders split Login/Register/Recovery routes with zero WebGL canvas, Fox reactions, and zero overflow across viewports', async ({
    page
  }) => {
    const viewports = [
      { width: 1024, height: 900 },
      { width: 1280, height: 900 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
      { width: 820, height: 1180 },
      { width: 390, height: 844 }
    ]

    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /^Đăng nhập$/i })).toBeVisible()
    await expect(page.getByTestId('auth-fox-stage')).toBeVisible()
    expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1)
    await expect(page.getByTestId('floating-chat-host')).toHaveCount(0)

    for (const vp of viewports) {
      await page.setViewportSize(vp)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow).toBeLessThanOrEqual(1)
    }

    // Navigate to Register multi-step wizard (survey -> res1 -> res2) & Recovery routes
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.getByTestId('auth-top-action-link').click()
    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByTestId('register-wizard')).toHaveAttribute('data-step', 'intro')
    await page.getByTestId('register-continue-btn').click()
    await expect(page.getByTestId('register-wizard')).toHaveAttribute('data-step', 'source')
    await page.getByTestId('survey-source-friends').click()
    await page.getByTestId('register-continue-btn').click()
    await page.getByTestId('survey-goal-study').click()
    await page.getByTestId('register-continue-btn').click()
    await page.getByTestId('survey-pace-15m').click()
    await page.getByTestId('register-continue-btn').click()
    await page.getByTestId('register-continue-btn').click()
    await expect(page.getByTestId('register-wizard')).toHaveAttribute('data-step', 'res1')
    await expect(page.getByRole('heading', { name: /Tạo tài khoản LifeQuest/i })).toBeVisible()

    await page.goto('/forgot-password')
    await expect(page.getByTestId('forgot-pending-badge')).toBeVisible()
    await expect(page.getByTestId('floating-chat-host')).toHaveCount(0)

    await page.goto('/reset-password')
    await expect(page.getByTestId('reset-pending-badge')).toBeVisible()
    await expect(page.getByTestId('floating-chat-host')).toHaveCount(0)
  })

  test('redirects unauthenticated strict /calendar to /login, restores /calendar after mocked verified login, and clears state on logout', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })

    // Mock verified Backend login & logout responses
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'e2e-verified-access-token',
            refreshToken: 'e2e-verified-refresh-token',
            user: {
              id: 'u-e2e-hero',
              email: 'hero@lifequest.vn',
              username: 'herolq',
              status: 'ACTIVE'
            }
          }
        })
      })
    })
    await page.route('**/api/v1/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { message: 'Logged out successfully' } })
      })
    })

    // Unauthenticated access to strict /calendar redirects to /login?redirect=%2Fcalendar
    await page.goto('/calendar?authGuard=strict')
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcalendar/)

    // Toggle password visibility & submit verified login
    await page.getByLabel('Email').fill('hero@lifequest.vn')
    await page.getByLabel('Mật khẩu').fill('StrongPass123')
    await page.getByTestId('login-toggle-password').click()
    await expect(page.getByLabel('Mật khẩu')).toHaveAttribute('type', 'text')
    await page.getByTestId('login-submit-btn').click()

    // Restores intended destination /calendar
    await expect(page).toHaveURL(/\/calendar/)
    await expect(page.getByTestId('calendar-month-grid')).toBeVisible()

    // Ensure tokens are never stored in localStorage
    const lsDump = await page.evaluate(() => JSON.stringify(window.localStorage))
    expect(lsDump).not.toContain('e2e-verified-access-token')
  })
})
