import { expect, test } from '@playwright/test'

test('FE-05A.3 Calendar: Fox-free viewport-fit, due Task count badges, and 0px sidebar alignment across routes', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  // 1. Measure sidebar top on Dashboard
  await page.goto('/')
  await page.waitForSelector('[data-testid="shared-left-rail-stack"]')
  const dashboardTop = await page
    .locator('[data-testid="shared-left-rail-stack"]')
    .evaluate((el) => Math.round(el.getBoundingClientRect().top))

  // 2. Navigate to Work Hub (/work/tasks)
  await page.goto('/work/tasks')
  await page.waitForSelector('[data-testid="shared-left-rail-stack"]')
  const workTop = await page
    .locator('[data-testid="shared-left-rail-stack"]')
    .evaluate((el) => Math.round(el.getBoundingClientRect().top))
  expect(Math.abs(workTop - dashboardTop)).toBeLessThanOrEqual(1)

  // 3. Navigate to Calendar (/calendar) and verify alignment + Fox-free + viewport-fit + due badges
  await page.goto('/calendar')
  await page.waitForSelector('[data-testid="calendar-month-grid"]')

  const calMetrics = await page.evaluate(() => {
    const doc = document.documentElement
    const leftRail = document.querySelector('[data-testid="shared-left-rail-stack"]')
    const region = document.querySelector('[data-testid="shared-desktop-three-region"]')
    const selectedCell = document.querySelector('[data-testid="calendar-day-cell"][aria-pressed="true"]')
    const selRect = selectedCell ? selectedCell.getBoundingClientRect() : null
    return {
      leftRailTop: leftRail ? Math.round(leftRail.getBoundingClientRect().top) : null,
      foxHidden: region ? region.getAttribute('data-fox-hidden') : null,
      canvases: document.querySelectorAll('canvas').length,
      vOverflow: doc.scrollHeight - doc.clientHeight,
      hOverflow: doc.scrollWidth - doc.clientWidth,
      selectedVisible: selRect ? selRect.top >= 0 && selRect.bottom <= window.innerHeight + 1 : false,
      dueBadges: document.querySelectorAll('[data-testid="calendar-due-badge"]').length
    }
  })

  expect(calMetrics.leftRailTop).not.toBeNull()
  expect(Math.abs((calMetrics.leftRailTop ?? 0) - dashboardTop)).toBeLessThanOrEqual(1)
  expect(calMetrics.foxHidden).toBe('1')
  expect(calMetrics.canvases).toBe(0)
  expect(calMetrics.vOverflow).toBe(0)
  expect(calMetrics.hOverflow).toBe(0)
  expect(calMetrics.selectedVisible).toBe(true)
  expect(calMetrics.dueBadges).toBeGreaterThan(0)

  // 4. Verify alignment persists after browser refresh
  await page.reload()
  await page.waitForSelector('[data-testid="calendar-month-grid"]')
  const afterReloadTop = await page
    .locator('[data-testid="shared-left-rail-stack"]')
    .evaluate((el) => Math.round(el.getBoundingClientRect().top))
  expect(Math.abs(afterReloadTop - dashboardTop)).toBeLessThanOrEqual(1)

  // 5. FE-05B: Thin road line is hidden by default, appears on Quest icon click, and opens Journey Road Overlay
  await expect(page.getByTestId('calendar-thin-road-line')).toHaveCount(0)
  await page.locator('[data-testid="calendar-road-icon"]').first().click()
  await expect(page.locator('[data-testid="calendar-thin-road-line"]').first()).toBeVisible()
  await page.getByTestId('calendar-active-road-detail').click()
  await expect(page.getByTestId('journey-road-overlay')).toBeVisible()
  await expect(page.getByTestId('road-time-progress')).toBeVisible()
  await expect(page.getByTestId('road-work-progress')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('journey-road-overlay')).toBeHidden()

  // 6. FE-05B: Open Photo Lightbox, navigate with ArrowRight, dismiss with Escape
  await page.getByTestId('calendar-featured-moment').click()
  await expect(page.getByTestId('social-media-lightbox')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('social-media-lightbox')).toBeHidden()

  // 7. FE-05B: Switch to Time-Based Day View and verify internal scroll (0px document vertical scroll)
  await page.getByTestId('calendar-view-day').click()
  await expect(page.getByTestId('day-timeline-grid')).toBeVisible()
  const dayOverflow = await page.evaluate(
    () => document.documentElement.scrollHeight - document.documentElement.clientHeight
  )
  expect(dayOverflow).toBe(0)
})
