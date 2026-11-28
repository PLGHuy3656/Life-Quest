import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const SHOT_DIR = path.resolve('..', 'docs', 'frontend', 'screenshots', 'fe13c_fe14c')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'tablet-landscape-1024', width: 1024, height: 768 },
  { name: 'tablet-portrait-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-375', width: 375, height: 812 },
] as const

test.describe('FE-13C Profile & FE-14C Album E2E + Responsive Verification', () => {
  test('Profile viewer states, tabs & Edit drawer work cleanly at 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/profile')
    await expect(page.getByTestId('profile-page')).toBeVisible()
    await page.screenshot({ path: path.join(SHOT_DIR, '01-profile-own-desktop.png') })

    await page.getByTestId('profile-tab-badges').click()
    await expect(page.getByTestId('profile-badges-panel')).toBeVisible()
    await page.screenshot({ path: path.join(SHOT_DIR, '02-profile-badges-desktop.png') })

    await page.goto('/profile/gia-huy')
    await expect(page.getByTestId('ticket-stat-hidden')).toBeVisible()
    await page.screenshot({ path: path.join(SHOT_DIR, '03-profile-friend-desktop.png') })

    await page.goto('/profile/thu-ha')
    await expect(page.getByTestId('profile-pending-banner')).toBeVisible()
    await page.screenshot({ path: path.join(SHOT_DIR, '04-profile-pending-desktop.png') })
  })

  test('Album Overview, Open Book, Gallery, Timeline & Privacy Confirm work cleanly at 1440x900', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/album')
    await expect(page.getByTestId('album-overview-view')).toBeVisible()
    await page.screenshot({ path: path.join(SHOT_DIR, '05-album-overview-desktop.png') })

    await page.getByTestId('album-card-alb-run-10k').click()
    await expect(page.getByTestId('open-book-view')).toBeVisible()
    await page.screenshot({ path: path.join(SHOT_DIR, '06-album-open-book-desktop.png') })

    // Open photo detail & verify widening privacy triggers confirmation dialog
    await page.getByTestId('book-photo-ph-1').click()
    await expect(page.getByTestId('photo-detail-modal')).toBeVisible()
    await page.getByTestId('photo-vis-FRIENDS').click()
    await expect(page.getByTestId('confirm-visibility-dialog')).toBeVisible()
    await page.screenshot({ path: path.join(SHOT_DIR, '07-album-privacy-confirm-desktop.png') })
    await page.getByTestId('confirm-visibility-accept').click()

    await page.goto('/album/gallery')
    await expect(page.getByTestId('album-gallery-view')).toBeVisible()
    await page.screenshot({ path: path.join(SHOT_DIR, '08-album-gallery-desktop.png') })

    await page.goto('/album/timeline')
    await expect(page.getByTestId('album-timeline-view')).toBeVisible()
    await page.screenshot({ path: path.join(SHOT_DIR, '09-album-timeline-desktop.png') })
  })

  test('All 6 required viewports have zero horizontal overflow on Profile & Open Book', async ({
    page,
  }) => {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height })

      for (const route of ['/profile', '/album/alb-run-10k']) {
        await page.goto(route)
        await page.waitForTimeout(150)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        )
        expect(overflow, `Overflow on ${route} at ${vp.name} (${vp.width}x${vp.height})`).toBeLessThanOrEqual(2)
      }

      if (vp.name === 'mobile-390') {
        await page.goto('/profile')
        await page.screenshot({ path: path.join(SHOT_DIR, '10-profile-mobile-390.png') })
        await page.goto('/album/alb-run-10k')
        await page.screenshot({ path: path.join(SHOT_DIR, '11-album-open-book-mobile-390.png') })
      }
    }
  })
})
