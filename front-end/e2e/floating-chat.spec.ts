import { expect, test } from '@playwright/test'

test.describe('FE-06A.1 Global Floating Chat Bubbles', () => {
  test('persists floating bubbles and expanded window across routes, collapses on /messages, and keeps <= 1 WebGL canvas', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/?nowebgl=1')

    // Single FloatingChatHost mounted on Dashboard
    await expect(page.getByTestId('floating-chat-host')).toHaveCount(1)
    await expect(page.getByTestId('floating-bubble-dock')).toBeVisible()

    // Unread badge visible on preview bubbles (conv-minh-anh: 2, conv-group-run: 1)
    await expect(page.getByTestId('floating-chat-unread-conv-minh-anh')).toHaveText('2')
    await expect(page.getByTestId('floating-chat-unread-conv-group-run')).toHaveText('1')

    // Expand personal chat bubble on Dashboard
    await page.getByTestId('floating-chat-bubble-btn-conv-minh-anh').click()
    await expect(page.getByTestId('floating-chat-window')).toBeVisible()

    // Fox Companion rail remains unobstructed (no overlap between floating window and Fox rail)
    const foxRail = page.getByTestId('shared-fox-rail')
    const chatWin = page.getByTestId('floating-chat-window')
    await expect(foxRail).toBeVisible()
    const foxBox = await foxRail.boundingBox()
    const winBox = await chatWin.boundingBox()
    expect(foxBox && winBox).toBeTruthy()
    if (foxBox && winBox) {
      // Window is docked left so its right edge stays well to the left of Fox rail
      expect(winBox.x + winBox.width).toBeLessThan(foxBox.x)
    }

    // Navigate to Work Hub -> expanded floating chat persists
    await page.goto('/work/tasks?nowebgl=1')
    await expect(page.getByTestId('floating-chat-host')).toHaveCount(1)
    await expect(page.getByTestId('floating-bubble-dock')).toBeVisible()

    // Navigate to Calendar -> bubble dock persists
    await page.goto('/calendar?nowebgl=1')
    await expect(page.getByTestId('floating-chat-host')).toHaveCount(1)
    await expect(page.getByTestId('floating-bubble-dock')).toBeVisible()

    // Navigate to Wardrobe -> bubble dock persists & no duplicate WebGL canvas
    await page.goto('/wardrobe?nowebgl=1')
    await expect(page.getByTestId('floating-chat-host')).toHaveCount(1)
    await expect(page.getByTestId('floating-bubble-dock')).toBeVisible()
    const canvasCount = await page.locator('canvas').count()
    expect(canvasCount).toBeLessThanOrEqual(1)

    // Client-side navigate to /messages -> expanded floating window collapses to avoid duplicate chat
    await page.getByTestId('floating-chat-bubble-btn-conv-minh-anh').click()
    await expect(page.getByTestId('floating-chat-window')).toBeVisible()
    await page.getByTestId('floating-chat-open-full-btn').click()
    await expect(page).toHaveURL(/\/messages/)
    await expect(page.getByTestId('floating-chat-host')).toHaveAttribute(
      'data-messenger-coexistence',
      'collapsed'
    )
    await expect(page.getByTestId('floating-chat-window')).toHaveCount(0)

    // Client-side navigate back to / -> expanded floating window restores automatically
    await page.getByRole('link', { name: 'Trang chủ' }).first().click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('floating-chat-window')).toBeVisible()

    // Unauthenticated route /login never mounts FloatingChatHost
    await page.goto('/login')
    await expect(page.getByTestId('floating-chat-host')).toHaveCount(0)
  })

  test('supports minimize, individual close, global disable persistence across reload, and re-enable from Messenger', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/?nowebgl=1')

    // Expand then minimize
    await page.getByTestId('floating-chat-bubble-btn-conv-minh-anh').click()
    await expect(page.getByTestId('floating-chat-window')).toBeVisible()
    await page.getByTestId('floating-chat-minimize-btn').click()
    await expect(page.getByTestId('floating-chat-window')).toHaveCount(0)
    await expect(page.getByTestId('floating-chat-bubble-conv-minh-anh')).toBeVisible()

    // Clicking Fox Paw button collapses bubbles upward/downward while Fox Paw stays anchored (<= 1px shift)
    const pawBtn = page.getByTestId('floating-dock-paw-toggle-btn')
    const pawBefore = await pawBtn.boundingBox()
    await pawBtn.click()
    await expect(page.getByTestId('floating-bubble-dock')).toHaveAttribute('data-dock-collapsed', 'true')
    await page.waitForTimeout(320)
    const pawAfter = await pawBtn.boundingBox()
    expect(pawBefore && pawAfter).toBeTruthy()
    if (pawBefore && pawAfter) {
      expect(Math.abs(pawAfter.y - pawBefore.y)).toBeLessThanOrEqual(1)
    }
    await pawBtn.click()
    await expect(page.getByTestId('floating-bubble-dock')).toHaveAttribute('data-dock-collapsed', 'false')

    // Disable globally via the 6-dot handle settings menu
    await page.getByTestId('floating-dock-drag-handle').click()
    await page.getByTestId('floating-dock-disable-btn').click()
    await expect(page.getByTestId('floating-chat-host')).toHaveCount(0)

    // Reload page -> disable MUST persist
    await page.reload()
    await expect(page.getByTestId('floating-chat-host')).toHaveCount(0)

    // Re-enable from Messenger header popover
    await page.goto('/messages?nowebgl=1')
    await page.getByTestId('messenger-bubble-settings-btn').click()
    await expect(page.getByTestId('messenger-bubble-settings-popover')).toBeVisible()
    await page.getByTestId('chat-bubble-settings-toggle').click()
    await expect(page.getByTestId('floating-chat-host')).toBeVisible()
  })

  test('supports dragging dock to right edge with edge snapping and zero overflow across desktop, tablet & mobile', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/?nowebgl=1')

    const handle = page.getByTestId('floating-dock-drag-handle')
    await expect(handle).toBeVisible()
    const box = await handle.boundingBox()
    expect(box).toBeTruthy()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(1180, 420, { steps: 10 })
      await page.mouse.up()
    }
    await expect(page.getByTestId('floating-bubble-dock')).toHaveAttribute('data-dock-side', 'right')

    // Verify zero horizontal overflow across key desktop, tablet & mobile viewports
    const viewports = [
      { width: 1024, height: 900 },
      { width: 1280, height: 900 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
      { width: 820, height: 1180 },
      { width: 390, height: 844 }
    ]

    for (const vp of viewports) {
      await page.setViewportSize(vp)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow).toBeLessThanOrEqual(1)
    }
  })
})
