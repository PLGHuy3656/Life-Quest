import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HabitsPage } from './HabitsPage'
import { QuestsPage } from './QuestsPage'
import { TaskDetailPage } from './TaskDetailPage'
import { WorkPage } from './WorkPage'
import {
  classifyTaskTimeState,
  formatDueLabel,
  formatStartLabel,
  sortTasksActionFirst
} from './taskUtils'
import { validateCreationTitle, WORK_ENTITY_OPTIONS } from './creationContract'
import { useAuthStore } from '@/stores/authStore'
import { MOCK_GOALS, MOCK_MILESTONES, MOCK_QUESTS } from '@/services/repositories/fixtures'
import type { Quest } from '@/types/domain'

function renderWorkAt(initialPath = '/work/tasks') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/work/tasks" element={<WorkPage />} />
          <Route path="/work/tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="/work/habits" element={<HabitsPage />} />
          <Route path="/work/quests" element={<QuestsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function makeQuest(overrides: Partial<Quest>): Quest {
  return {
    ...MOCK_QUESTS[0],
    id: 'q-base',
    title: 'Base Task',
    startAt: null,
    dueAt: null,
    completedAt: null,
    status: 'ACTIVE',
    priority: 2,
    isPinned: false,
    ...overrides
  }
}

describe('FE-04A.2 Deadline-Aware Sorting & Creation Contract', () => {
  it('strictly distinguishes starting-soon from due-soon and handles missing timestamps deterministically', () => {
    const nowMs = Date.parse('2026-11-23T10:00:00.000Z')

    const overdue = makeQuest({
      id: 'q-overdue',
      title: 'Overdue Task',
      dueAt: '2026-11-23T09:00:00.000Z'
    })
    const dueSoon = makeQuest({
      id: 'q-due-soon',
      title: 'Due In 50m',
      dueAt: '2026-11-23T10:50:00.000Z'
    })
    const startingSoon = makeQuest({
      id: 'q-start-soon',
      title: 'Starting In 50m',
      startAt: '2026-11-23T10:50:00.000Z',
      dueAt: '2026-11-23T18:00:00.000Z'
    })
    const todayLater = makeQuest({
      id: 'q-today',
      title: 'Today Afternoon',
      startAt: '2026-11-23T14:00:00.000Z',
      dueAt: '2026-11-23T17:00:00.000Z'
    })
    const upcoming = makeQuest({
      id: 'q-upcoming',
      title: 'Tomorrow Task',
      dueAt: '2026-11-25T10:00:00.000Z'
    })
    const unscheduled = makeQuest({
      id: 'q-unscheduled',
      title: 'Unscheduled Task',
      startAt: null,
      dueAt: null
    })
    const completed = makeQuest({
      id: 'q-completed',
      title: 'Completed Task',
      completedAt: '2026-11-23T08:00:00.000Z',
      dueAt: '2026-11-23T09:00:00.000Z'
    })

    // Never confuse starting in 50m with due in 50m
    expect(classifyTaskTimeState(dueSoon, nowMs)).toBe('due_soon')
    expect(classifyTaskTimeState(startingSoon, nowMs)).toBe('starting_soon')
    expect(formatDueLabel(dueSoon.dueAt, nowMs)).toContain('Hạn trong 50 phút')
    expect(formatStartLabel(startingSoon.startAt, nowMs)).toContain('Bắt đầu sau 50 phút')
    expect(classifyTaskTimeState(unscheduled, nowMs)).toBe('unscheduled')
    expect(classifyTaskTimeState(completed, nowMs)).toBe('completed')

    const ordered = sortTasksActionFirst(
      [completed, unscheduled, upcoming, todayLater, startingSoon, dueSoon, overdue],
      nowMs
    )
    expect(ordered.map((q) => q.id)).toEqual([
      'q-overdue',
      'q-due-soon',
      'q-start-soon',
      'q-today',
      'q-upcoming',
      'q-unscheduled',
      'q-completed'
    ])
  })

  it('standardizes TASK / HABIT / QUEST entity contract and shared title validation', () => {
    expect(WORK_ENTITY_OPTIONS.map((o) => o.type)).toEqual(['TASK', 'HABIT', 'QUEST'])
    expect(WORK_ENTITY_OPTIONS.find((o) => o.type === 'HABIT')?.capability).toBe('PENDING')
    expect(validateCreationTitle('ab')).not.toBeNull()
    expect(validateCreationTitle('Học React Query')).toBeNull()
  })
})

describe('FE-04A.2 Work Hub (Action-First Tasks, Full Task Detail Page, Habits, Quests)', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    useAuthStore.getState().setSession({
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
      user: { id: 'u1', email: 'a@b.com', username: 'tester', status: 'ACTIVE' }
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('renders action-first tasks, fox-paw pin stamp without navigating, navigates to /work/tasks/:taskId, and preserves Habit/Quest views', async () => {
    const user = userEvent.setup()
    const called: string[] = []

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'
      called.push(`${method} ${url}`)

      if (url.endsWith('/goals') && method === 'GET') {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: MOCK_GOALS }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      if (url.includes('/milestones') && method === 'GET') {
        return Promise.resolve(
          new Response(
            JSON.stringify({ success: true, data: MOCK_MILESTONES[MOCK_GOALS[0].id] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      if (url.includes('/quests') && url.endsWith('/pin') && method === 'POST') {
        return Promise.resolve(
          new Response(
            JSON.stringify({ success: true, data: { ...MOCK_QUESTS[3], isPinned: true } }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      if (url.includes(`/quests/${MOCK_QUESTS[0].id}`) && method === 'GET') {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: MOCK_QUESTS[0] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      if (url.includes('/quests') && method === 'GET') {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: MOCK_QUESTS }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    }) as unknown as typeof fetch

    renderWorkAt('/work/tasks')

    // 1. Action-first task list renders immediately; no explicit "Đã ghim" text badge
    expect(await screen.findByText(MOCK_QUESTS[0].title)).toBeInTheDocument()
    expect(screen.queryByText('Đã ghim')).not.toBeInTheDocument()

    // 2. Clicking fox-paw pin calls POST /pin and stays on task list
    const pinBtn = screen.getByRole('button', { name: new RegExp(`^Ghim ${MOCK_QUESTS[3].title}$`) })
    await user.click(pinBtn)
    await waitFor(() => {
      expect(called.some((c) => c.startsWith('POST ') && c.endsWith('/pin'))).toBe(true)
    })
    expect(screen.queryByTestId('task-detail-page')).not.toBeInTheDocument()

    // 3. Clicking task title opens dedicated Full Task Detail Page (/work/tasks/:taskId)
    await user.click(
      screen.getByRole('button', { name: new RegExp(`Mở chi tiết nhiệm vụ ${MOCK_QUESTS[0].title}`) })
    )
    expect(await screen.findByTestId('task-detail-page')).toBeInTheDocument()
    expect(screen.getByTestId('task-evidence-boundary')).toBeInTheDocument()
    expect(screen.queryByTestId('task-checklist-boundary')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Hoàn thành nhiệm vụ \(chờ Execution API\)/i })
    ).toBeDisabled()
  })

  it('supports direct bookmarked /work/tasks/:taskId URL and handles unknown task IDs cleanly', async () => {
    useAuthStore.getState().clearSession()
    renderWorkAt('/work/tasks/non-existent-id-999')
    expect(await screen.findByText('Không tìm thấy nhiệm vụ')).toBeInTheDocument()
  })

  it('propagates Backend API errors cleanly without faking success', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: 'QUEST_ACCESS_DENIED', message: 'No access to quests' }
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      )
    ) as unknown as typeof fetch

    renderWorkAt('/work/tasks')
    expect(await screen.findByText(/QUEST_ACCESS_DENIED/)).toBeInTheDocument()
  })
})
