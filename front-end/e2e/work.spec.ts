import { expect, test } from '@playwright/test'

test('FE-04A.2 Work Hub: action-first tasks, fox-paw pin, full /work/tasks/:taskId detail page, and shared Fox creation types', async ({
  page
}) => {
  const now = new Date()
  const isoDay = (offsetDays: number, hh: number, mm: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + offsetDays)
    d.setHours(hh, mm, 0, 0)
    return d.toISOString()
  }
  const todayStr = now.toISOString().slice(0, 10)

  const goals = [
    {
      id: '10000000-0000-4000-8000-000000000001',
      userId: 'u1',
      title: 'Hoàn thành đồ án LifeQuest',
      description: 'Đồng bộ kiến trúc Frontend, Backend và Mascot Fox V2.',
      startDate: '2026-11-01T00:00:00.000Z',
      dueDate: '2026-12-20T00:00:00.000Z',
      status: 'ACTIVE',
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-22T00:00:00.000Z'
    }
  ]

  const milestones = [
    {
      id: '20000000-0000-4000-8000-000000000002',
      goalId: goals[0].id,
      title: 'Hoàn thiện Work Hub FE-04A.2',
      description: null,
      position: 1,
      status: 'ACTIVE',
      completedAt: null,
      deletedAt: null,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-22T00:00:00.000Z'
    }
  ]

  const quests = [
    {
      id: '30000000-0000-4000-8000-000000000001',
      userId: 'u1',
      goalId: goals[0].id,
      milestoneId: milestones[0].id,
      title: 'Rà soát hợp đồng API Today & Quests',
      description: 'Đối chiếu schema Prisma và response envelope từ Backend.',
      type: 'FOCUS',
      priority: 1,
      proofRequirement: 'REQUIRED',
      targetValue: null,
      targetUnit: null,
      estimatedDurationSeconds: 1800,
      xpReward: 40,
      coinReward: 15,
      startAt: isoDay(0, 8, 30),
      dueAt: isoDay(0, 22, 30),
      completedAt: null,
      archivedAt: null,
      status: 'ACTIVE',
      createdAt: '2026-11-20T00:00:00.000Z',
      updatedAt: '2026-11-22T00:00:00.000Z',
      deletedAt: null,
      isPinned: true
    },
    {
      id: '30000000-0000-4000-8000-000000000002',
      userId: 'u1',
      goalId: goals[0].id,
      milestoneId: null,
      title: 'Chạy bộ nhẹ buổi sáng 20 phút',
      description: 'Khởi động kỹ trước khi chạy.',
      type: 'DURATION',
      priority: 2,
      proofRequirement: 'OPTIONAL',
      targetValue: 20,
      targetUnit: 'phút',
      estimatedDurationSeconds: 1200,
      xpReward: 30,
      coinReward: 10,
      startAt: isoDay(-1, 6, 30),
      dueAt: isoDay(-1, 8, 0),
      completedAt: null,
      archivedAt: null,
      status: 'ACTIVE',
      createdAt: '2026-11-20T00:00:00.000Z',
      updatedAt: '2026-11-22T00:00:00.000Z',
      deletedAt: null,
      isPinned: true
    }
  ]

  await page.route('**/api/v1/**', async (route) => {
    const req = route.request()
    const url = req.url()
    const method = req.method()

    if (url.includes('/auth/login') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'e2e-access',
            refreshToken: 'e2e-refresh',
            user: { id: 'u1', email: 'qa@lifequest.local', username: 'qa_user', status: 'ACTIVE' }
          }
        })
      })
    }
    if (url.includes('/users/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'u1', email: 'qa@lifequest.local', username: 'qa_user', status: 'ACTIVE', profile: { displayName: 'Huy', bio: '', title: 'Explorer' } }
        })
      })
    }
    if (url.includes('/today')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            date: todayStr,
            timezone: 'Asia/Ho_Chi_Minh',
            summary: { totalTasks: 2, completedTasks: 0, completionRatePercentage: 0, totalFocusDurationSeconds: 0 },
            executions: [],
            schedules: [],
            streak: { currentCount: 5, longestCount: 12, isQualifiedToday: true, lastQualifiedDate: todayStr },
            gamification: { totalXp: 420, level: 4, coinBalance: 130 }
          }
        })
      })
    }
    if (url.includes('/milestones')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: milestones }) })
    }
    if (url.includes('/goals')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: goals }) })
    }
    if (url.includes('/quests') && url.endsWith('/pin')) {
      const id = url.split('/quests/')[1]?.split('/pin')[0]
      const target = quests.find((q) => q.id === id)
      if (target) target.isPinned = method === 'POST'
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: target ?? {} }) })
    }
    const singleMatch = url.match(/\/quests\/([0-9a-f-]+)$/i)
    if (singleMatch && method === 'GET') {
      const found = quests.find((q) => q.id === singleMatch[1])
      return route.fulfill({
        status: found ? 200 : 404,
        contentType: 'application/json',
        body: JSON.stringify(found ? { success: true, data: found } : { success: false, error: { code: 'NOT_FOUND', message: 'Not found' } })
      })
    }
    if (url.includes('/quests')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: quests }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/login?nowebgl=1')
  await page.getByLabel(/Email/i).fill('qa@lifequest.local')
  await page.getByLabel(/Mật khẩu/i).fill('password123')
  await page.getByRole('button', { name: /Đăng nhập/i }).click()

  // 1. /work -> /work/tasks with primary task list immediately visible above fold
  await page.waitForURL('**/work/tasks*')
  await expect(page.getByTestId('work-task-page')).toBeVisible()
  await expect(page.getByTestId('task-list')).toBeVisible()
  const geom = await page.evaluate(() => {
    const listRect = document.querySelector('[data-testid="task-list"]')!.getBoundingClientRect()
    const overflow = document.documentElement.scrollWidth - window.innerWidth
    const canvases = document.querySelectorAll('canvas').length
    return { listTop: listRect.top, overflow, canvases }
  })
  expect(geom.listTop).toBeLessThan(310)
  expect(geom.overflow).toBeLessThanOrEqual(1)
  expect(geom.canvases).toBeLessThanOrEqual(1)

  // 2. Fox Quick Create entity dropdown menu selects Habit -> Quest -> Task
  const entityPill = page.getByTestId('fox-entity-type-pill')
  await expect(entityPill).toContainText('Task')
  await entityPill.click()
  const menu = page.getByTestId('fox-entity-type-menu')
  await expect(menu).toBeVisible()
  await menu.getByRole('option', { name: /Habit/i }).click()
  await expect(entityPill).toContainText('Habit')
  await entityPill.click()
  await page.getByTestId('fox-entity-type-menu').getByRole('option', { name: /Quest/i }).click()
  await expect(entityPill).toContainText('Quest')
  await entityPill.click()
  await page.getByTestId('fox-entity-type-menu').getByRole('option', { name: /Task/i }).click()
  await expect(entityPill).toContainText('Task')

  // 2b. Selecting a filter in sticky bar renders results in the main center area (above sticky bar)
  await page.getByTestId('task-advanced-section').getByRole('button', { name: /Quá hạn/i }).click()
  await expect(page.getByTestId('task-filtered-results')).toBeVisible()
  const filterGeom = await page.evaluate(() => {
    const res = document.querySelector('[data-testid="task-filtered-results"]')!.getBoundingClientRect()
    const sticky = document.querySelector('[data-testid="task-advanced-section"]')!.getBoundingClientRect()
    return { resBottom: res.bottom, stickyTop: sticky.top }
  })
  expect(filterGeom.resBottom).toBeLessThanOrEqual(filterGeom.stickyTop + 2)
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click()

  // 3. Clicking pinned task in PinnedTaskRail navigates to full /work/tasks/:taskId page
  const firstPinned = page.getByTestId('rail-pinned-snippet').first()
  await firstPinned.click()
  await page.waitForURL(`**/work/tasks/${quests[0].id}`)
  const detailPage = page.getByTestId('task-detail-page')
  await expect(detailPage).toBeVisible()
  await expect(page.getByTestId('detail-timing-strip')).toBeVisible()
  await expect(page.getByTestId('detail-focus-launch-btn')).toBeVisible()
  await expect(page.getByTestId('task-evidence-boundary')).toBeVisible()
  await expect(page.getByTestId('task-checklist-boundary')).toHaveCount(0)

  // 3b. Local evidence preview + Nộp minh chứng & Đăng lên Social action buttons
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  )
  await page.getByTestId('evidence-file-input').setInputFiles([
    { name: 'evidence-1.png', mimeType: 'image/png', buffer: pngBuffer }
  ])
  await expect(page.getByTestId('evidence-preview-grid')).toBeVisible()
  await expect(page.getByTestId('evidence-submit-btn')).toBeVisible()
  await expect(page.getByTestId('evidence-share-social-btn')).toBeVisible()
  await page.getByTestId('evidence-submit-btn').click()
  await expect(page.getByTestId('evidence-action-notice')).toContainText(/Media Upload API/i)
  await page.getByTestId('evidence-share-social-btn').click()
  await expect(page.getByTestId('evidence-action-notice')).toContainText(/Social Publish API/i)

  // 3c. Clicking compact Focus button dims screen into dedicated /work/tasks/:taskId/focus page (1 Fox canvas)
  await page.getByTestId('detail-focus-launch-btn').click()
  await page.waitForURL(`**/work/tasks/${quests[0].id}/focus`)
  const focusPage = page.getByTestId('focus-mode-page')
  await expect(focusPage).toBeVisible()
  expect(await page.evaluate(() => document.querySelectorAll('canvas').length)).toBeLessThanOrEqual(1)
  await page.getByTestId('focus-primary-btn').click()
  await expect(focusPage).toHaveAttribute('data-status', 'running')
  await page.getByTestId('focus-primary-btn').click()
  await expect(focusPage).toHaveAttribute('data-status', 'paused')
  await page.getByTestId('focus-exit-btn').click()
  await page.waitForURL(`**/work/tasks/${quests[0].id}`)
  await expect(page.getByTestId('detail-focus-launch-btn')).toContainText(/Tiếp tục/i)

  // 4. Fox-paw pin toggle on Full Task Detail Page syncs PinnedTaskRail immediately
  await expect(page.getByTestId('rail-pinned-snippet')).toHaveCount(2)
  await detailPage.getByTestId('fox-paw-pin-btn').click()
  await expect(page.getByTestId('rail-pinned-snippet')).toHaveCount(1)
  await detailPage.getByTestId('fox-paw-pin-btn').click()
  await expect(page.getByTestId('rail-pinned-snippet')).toHaveCount(2)

  // 5. Back breadcrumb returns to /work/tasks with single WebGL canvas
  await page.getByTestId('task-detail-back').click()
  await page.waitForURL('**/work/tasks')
  expect(await page.evaluate(() => document.querySelectorAll('canvas').length)).toBeLessThanOrEqual(1)
})
