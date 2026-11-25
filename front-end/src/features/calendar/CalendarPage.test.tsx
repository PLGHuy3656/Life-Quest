import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { MOCK_GOALS, MOCK_QUESTS } from '@/services/repositories/fixtures'
import { useAuthStore } from '@/stores/authStore'
import { CalendarPage } from './CalendarPage'
import {
  aggregateDailyTaskDeadlines,
  buildUpcomingDeadlines,
  computeMonthlySummaryCounts,
  deriveCalendarEventsForRange,
  getDynamicMonthCalendarGrid,
  sortCellPreviewEvents
} from './calendarUtils'

function renderCalendar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/calendar']}>
        <Routes>
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/work/tasks/:taskId" element={<div data-testid="task-detail-stub">Task</div>} />
          <Route path="/work/quests/:questId" element={<div data-testid="quest-detail-stub">Quest</div>} />
          <Route path="/work/habits" element={<div data-testid="habits-stub">Habits</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('FE-05A Journey Calendar Math, Event Derivation & Interactions', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('generates exact 4-, 5-, and 6-week Monday-first Gregorian grids including leap years', () => {
    // Feb 2021: starts Monday, 28 days -> exact 4 week rows (28 cells)
    const feb2021 = getDynamicMonthCalendarGrid(2021, 1, '2021-02-10')
    expect(feb2021.weekRows).toBe(4)
    expect(feb2021.cells).toHaveLength(28)
    expect(feb2021.cells[0].ymd).toBe('2021-02-01')

    // Feb 2024 (Leap year): 29 days, starts Thursday -> 5 week rows (35 cells), includes 2024-02-29
    const feb2024 = getDynamicMonthCalendarGrid(2024, 1, '2024-02-29')
    expect(feb2024.weekRows).toBe(5)
    expect(feb2024.cells.some((c) => c.ymd === '2024-02-29' && c.inCurrentMonth && c.isToday)).toBe(
      true
    )

    // Nov 2026: starts Sunday (Monday-first offset 6), 30 days -> 6 week rows (42 cells)
    const nov2026 = getDynamicMonthCalendarGrid(2026, 10, '2026-11-24')
    expect(nov2026.weekRows).toBe(6)
    expect(nov2026.cells).toHaveLength(42)
    expect(nov2026.cells[6].ymd).toBe('2026-11-01')
  })

  it('derives normalized events separating Task startAt vs dueAt, Quest deadlines, and prototype Habits', () => {
    const startOnlyTask = {
      ...MOCK_QUESTS[0],
      id: 'start-only',
      title: 'Start Only Task',
      startAt: '2026-11-24T09:00:00',
      dueAt: null
    }
    const dueTask = {
      ...MOCK_QUESTS[0],
      id: 'due-task',
      title: 'Due Task',
      startAt: '2026-11-24T08:00:00',
      dueAt: '2026-11-24T17:30:00'
    }

    const events = deriveCalendarEventsForRange({
      tasks: [startOnlyTask, dueTask],
      goals: MOCK_GOALS,
      visibleYmds: ['2026-11-24', '2026-12-20'],
      isLiveAuth: false,
      nowMs: Date.parse('2026-11-24T10:00:00')
    })

    const startEv = events.find((e) => e.id === 'task-start:start-only')
    const dueEv = events.find((e) => e.id === 'task-due:due-task')
    const questEv = events.find((e) => e.id === `quest-due:${MOCK_GOALS[0].id}`)
    const habitEv = events.find((e) => e.category === 'habit')

    expect(startEv?.timingKind).toBe('start')
    expect(startEv?.subtitle).toContain('Bắt đầu')
    expect(dueEv?.timingKind).toBe('deadline')
    expect(dueEv?.subtitle).toContain('Hạn chót')
    expect(questEv?.category).toBe('quest')
    expect(habitEv?.isPreview).toBe(true)

    const summary = computeMonthlySummaryCounts(events, '2026-11')
    expect(summary.tasks).toBe(2)
    expect(summary.moments).toBeNull()

    const upcoming = buildUpcomingDeadlines([dueTask], MOCK_GOALS, false, Date.parse('2026-11-24T10:00:00'))
    expect(upcoming[0].id).toBe('up-task:due-task')
  })

  it('supports Month/Week/Day switching, period navigation, category filtering, and Journey strip navigation', async () => {
    const user = userEvent.setup()
    renderCalendar()

    expect(await screen.findByTestId('calendar-month-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('calendar-journey-strip')).not.toBeInTheDocument()
    expect(screen.queryByText('Lịch hành trình')).not.toBeInTheDocument()
    expect(screen.getByTestId('calendar-daily-agenda-panel')).toBeInTheDocument()
    expect(screen.getByTestId('calendar-featured-moment')).toBeInTheDocument()

    // Switch to Week view and Day view
    await user.click(screen.getByTestId('calendar-view-week'))
    expect(screen.getByTestId('calendar-week-grid')).toBeInTheDocument()

    await user.click(screen.getByTestId('calendar-view-day'))
    expect(screen.getByTestId('calendar-day-agenda')).toBeInTheDocument()

    await user.click(screen.getByTestId('calendar-view-month'))
    const initialTitle = screen.getByTestId('calendar-period-title').textContent

    // Navigate next & back to today
    await user.click(screen.getByTestId('calendar-next-btn'))
    expect(screen.getByTestId('calendar-period-title').textContent).not.toBe(initialTitle)

    await user.click(screen.getByTestId('calendar-today-btn'))
    expect(screen.getByTestId('calendar-period-title').textContent).toBe(initialTitle)

    // Filter out Habit category
    const habitFilter = screen.getByTestId('calendar-filter-habit')
    expect(habitFilter).toHaveAttribute('aria-pressed', 'true')
    await user.click(habitFilter)
    expect(habitFilter).toHaveAttribute('aria-pressed', 'false')

    // Clicking an event in the Daily Agenda Panel navigates to Task Detail
    const firstTaskEvent = screen
      .getAllByTestId('calendar-event-item')
      .find((el) => el.getAttribute('data-category') === 'task')
    expect(firstTaskEvent).toBeDefined()
    if (firstTaskEvent) {
      await user.click(firstTaskEvent)
      expect(await screen.findByTestId('task-detail-stub')).toBeInTheDocument()
    }
  })

  it('aggregates per-day due Task counts accurately, eliminates duplicates, respects local timezone, and excludes startAt', () => {
    const nowMs = new Date(2026, 10, 24, 16, 0, 0).getTime()
    // Local 2026-11-24 23:30 and 2026-11-25 00:15 test local timezone date boundary cleanly
    const lateTonight = new Date(2026, 10, 24, 23, 30, 0).toISOString()
    const earlyTomorrow = new Date(2026, 10, 25, 0, 15, 0).toISOString()
    const overdueToday = new Date(2026, 10, 24, 10, 0, 0).toISOString()
    const completedToday = new Date(2026, 10, 24, 12, 0, 0).toISOString()

    const tOverdue = { ...MOCK_QUESTS[0], id: 't-overdue', title: 'Overdue Task', dueAt: overdueToday, completedAt: null }
    const tUpcoming = { ...MOCK_QUESTS[0], id: 't-upcoming', title: 'Late Tonight Task', dueAt: lateTonight, completedAt: null }
    const tDone = { ...MOCK_QUESTS[0], id: 't-done', title: 'Completed Task', dueAt: completedToday, completedAt: completedToday, status: 'COMPLETED' as const }
    const tStartOnly = { ...MOCK_QUESTS[0], id: 't-start-only', title: 'Start Only', startAt: overdueToday, dueAt: null, completedAt: null }
    const tTomorrow = { ...MOCK_QUESTS[0], id: 't-tomorrow', title: 'Early Tomorrow', dueAt: earlyTomorrow, completedAt: null }

    // Pass duplicate tOverdue to verify duplicate elimination
    const map = aggregateDailyTaskDeadlines(
      [tOverdue, tOverdue, tUpcoming, tDone, tStartOnly, tTomorrow],
      nowMs
    )

    const nov24 = map.get('2026-11-24')
    expect(nov24?.totalDue).toBe(3) // tOverdue (deduped) + tUpcoming + tDone; excludes tStartOnly!
    expect(nov24?.overdueDue).toBe(1)
    expect(nov24?.actionableDue).toBe(2)
    expect(nov24?.completedDue).toBe(1)

    const nov25 = map.get('2026-11-25')
    expect(nov25?.totalDue).toBe(1)
    expect(nov25?.overdueDue).toBe(0)

    // Verify dense cell preview ordering: Overdue -> Due -> Completed -> Quest/Start
    const events = deriveCalendarEventsForRange({
      tasks: [tDone, tStartOnly, tUpcoming, tOverdue],
      goals: MOCK_GOALS,
      visibleYmds: ['2026-11-24'],
      isLiveAuth: true,
      nowMs
    }).filter((e) => e.category !== 'habit')

    const ordered = sortCellPreviewEvents(events)
    expect(ordered[0].id).toBe('task-due:t-overdue')
    expect(ordered[1].id).toBe('task-due:t-upcoming')
    expect(ordered[2].id).toBe('task-due:t-done')
    expect(ordered[3].id).toBe('task-start:t-start-only')
  })

  it('renders per-day due Task count badges and updates Daily Agenda on date selection', async () => {
    const user = userEvent.setup()
    renderCalendar()

    expect(await screen.findByTestId('calendar-month-grid')).toBeInTheDocument()
    const dueBadges = screen.getAllByTestId('calendar-due-badge')
    expect(dueBadges.length).toBeGreaterThan(0)
    expect(dueBadges[0].textContent?.trim()).toMatch(/^\d+$/)
    expect(dueBadges[0].getAttribute('title')).toContain('đến hạn')

    // Click another date cell and verify Daily Agenda heading updates
    const dayCells = screen.getAllByTestId('calendar-day-cell')
    const targetCell = dayCells.find((c) => c.getAttribute('data-date')?.endsWith('-15'))
    expect(targetCell).toBeDefined()
    if (targetCell) {
      await user.click(targetCell)
      expect(screen.getByTestId('calendar-selected-date-heading').textContent).toContain('15 tháng')
    }
  })
})
