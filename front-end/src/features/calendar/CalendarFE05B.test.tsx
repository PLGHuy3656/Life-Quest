import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { MOCK_GOALS, MOCK_MILESTONES, MOCK_QUESTS } from '@/services/repositories/fixtures'
import { useAuthStore } from '@/stores/authStore'
import { CalendarPage } from './CalendarPage'
import {
  buildRoadSpanWeeks,
  computeWeekRoadSegments,
  deriveCalendarJourneyRoads
} from './calendarRoadUtils'
import { getDynamicMonthCalendarGrid, type CalendarEventItem } from './calendarUtils'
import { layoutDayTimelineEvents } from './dayTimelineUtils'

function renderCalendar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/calendar']}>
        <Routes>
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/work/tasks/:taskId" element={<div data-testid="task-detail-stub">Task</div>} />
          <Route path="/work/quests/:questId" element={<div data-testid="quest-detail-stub">Quest</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('FE-05B Journey Road, Photo Lightbox & Time-Based Day View', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('maps Quest -> Epic -> Task roads, separates time vs work progress, handles zero Epics, and excludes single-day/missing-date Tasks', () => {
    const nowMs = new Date(2026, 10, 24, 12, 0, 0).getTime()
    const multiDayTask = {
      ...MOCK_QUESTS[0],
      id: 'multi-day-task',
      title: 'Viết tài liệu kiến trúc 5 ngày',
      startAt: '2026-11-22T09:00:00',
      dueAt: '2026-11-28T18:00:00',
      completedAt: null
    }
    const missingStartTask = {
      ...MOCK_QUESTS[0],
      id: 'missing-start',
      title: 'No Start Task',
      startAt: null,
      dueAt: '2026-11-26T18:00:00'
    }
    const zeroEpicGoal = {
      ...MOCK_GOALS[0],
      id: 'goal-zero-epics',
      title: 'Hành trình chưa có chặng',
      startDate: '2026-11-20T00:00:00',
      dueDate: '2026-12-10T00:00:00'
    }

    const roads = deriveCalendarJourneyRoads({
      tasks: [multiDayTask, missingStartTask],
      goals: [MOCK_GOALS[0], zeroEpicGoal],
      milestonesByGoal: MOCK_MILESTONES,
      isLiveAuth: true,
      nowMs
    })

    const questRoad = roads.find((r) => r.sourceId === MOCK_GOALS[0].id)
    expect(questRoad?.kind).toBe('quest')
    expect(questRoad?.checkpoints.length).toBe(3)
    expect(questRoad?.checkpoints[0].status).toBe('completed')
    expect(questRoad?.checkpoints[1].status).toBe('active')
    expect(questRoad?.checkpoints[2].status).toBe('future')
    // Time progress (elapsed days) must NEVER be confused with work progress (verified completed tasks)
    expect(questRoad?.timeProgressPct).toBeGreaterThan(0)
    expect(questRoad?.workProgressPct).toBe(0)

    const zeroEpicRoad = roads.find((r) => r.sourceId === 'goal-zero-epics')
    expect(zeroEpicRoad?.checkpoints).toHaveLength(0)
    expect(zeroEpicRoad?.workProgressPct).toBeNull()

    const taskRoad = roads.find((r) => r.sourceId === 'multi-day-task')
    expect(taskRoad?.kind).toBe('task')
    expect(taskRoad?.checkpoints).toHaveLength(0) // Never fabricates Epics for atomic Tasks!
    expect(taskRoad?.durationDays).toBe(7)

    // Task missing startAt must NOT fabricate a multi-day interval
    expect(roads.find((r) => r.sourceId === 'missing-start')).toBeUndefined()
  })

  it('clips range segments across week rows and month boundaries and caps overlapping lanes with overflow', () => {
    const nov2026 = getDynamicMonthCalendarGrid(2026, 10, '2026-11-24')
    const lastWeek = nov2026.cells.slice(35, 42) // 2026-11-30 .. 2026-12-06 (crosses Nov -> Dec!)

    const roads = deriveCalendarJourneyRoads({
      tasks: [
        {
          ...MOCK_QUESTS[0],
          id: 't-cross-month',
          title: 'Task vượt tháng',
          startAt: '2026-11-28T09:00:00',
          dueAt: '2026-12-03T18:00:00'
        }
      ],
      goals: MOCK_GOALS,
      milestonesByGoal: MOCK_MILESTONES,
      isLiveAuth: true,
      nowMs: new Date(2026, 10, 24, 12, 0, 0).getTime()
    })

    const { segments, overflowRoads } = computeWeekRoadSegments(roads, lastWeek, 2)
    expect(segments).toHaveLength(2)
    expect(overflowRoads).toHaveLength(1) // 3 overlapping roads -> 2 visible lanes + 1 overflow!
    expect(segments[0].continuesLeft).toBe(true)
    expect(segments[0].continuesRight).toBe(true)
    expect(segments[0].colStart).toBe(1)
    expect(segments[0].colSpan).toBe(7)
  })

  it('positions timed events vertically, packs overlapping intervals side-by-side, keeps deadlines as point markers, and groups untimed events', () => {
    const tasksById = new Map(MOCK_QUESTS.map((t) => [t.id, t]))
    const dayEvents: CalendarEventItem[] = [
      {
        id: 'task-start:overlap-a',
        category: 'task',
        title: 'Họp nhóm sáng',
        ymd: '2026-11-24',
        timeLabel: '09:00',
        timingKind: 'start',
        urgency: 'normal',
        route: '/work/tasks/a',
        subtitle: 'Bắt đầu · 09:00',
        isPreview: false
      },
      {
        id: 'habit-plan:overlap-b:2026-11-24',
        category: 'habit',
        title: 'Tập trung sâu 25p',
        ymd: '2026-11-24',
        timeLabel: null,
        timingKind: 'schedule',
        urgency: 'normal',
        route: '/work/habits',
        subtitle: 'T2 – T6 · 09:15 (Mẫu lịch)',
        isPreview: true
      },
      {
        id: `task-due:${MOCK_QUESTS[2].id}`,
        category: 'task',
        title: MOCK_QUESTS[2].title,
        ymd: '2026-11-24',
        timeLabel: '21:00',
        timingKind: 'deadline',
        urgency: 'normal',
        route: `/work/tasks/${MOCK_QUESTS[2].id}`,
        subtitle: 'Hạn chót · 21:00',
        isPreview: false
      },
      {
        id: 'habit-plan:allday:2026-11-24',
        category: 'habit',
        title: 'Uống 2 lít nước',
        ymd: '2026-11-24',
        timeLabel: null,
        timingKind: 'schedule',
        urgency: 'normal',
        route: '/work/habits',
        subtitle: 'Hằng ngày · Cả ngày',
        isPreview: true
      }
    ]

    const layout = layoutDayTimelineEvents({ dayEvents, tasksById })
    expect(layout.allDayEvents).toHaveLength(1)
    expect(layout.deadlineMarkers).toHaveLength(1)
    expect(layout.deadlineMarkers[0].minuteOfDay).toBe(21 * 60)

    // Overlapping 09:00..09:30 and 09:15..09:45 must sit side-by-side (columnCount = 2)
    expect(layout.timedBlocks).toHaveLength(2)
    expect(layout.timedBlocks[0].columnCount).toBe(2)
    expect(layout.timedBlocks[1].columnCount).toBe(2)
    expect(layout.timedBlocks[0].columnIndex).not.toBe(layout.timedBlocks[1].columnIndex)
  })

  it('opens Journey Road Overlay, Photo Lightbox, and Time-Based Day View interactively', async () => {
    const user = userEvent.setup()
    renderCalendar()

    expect(await screen.findByTestId('calendar-month-grid')).toBeInTheDocument()

    // 1. Thin Journey Road line is hidden by default, appears on clicking the Quest icon, dims outside days, and toggles OFF on 2nd click
    expect(screen.queryByTestId('calendar-thin-road-line')).not.toBeInTheDocument()
    const roadIcons = screen.getAllByTestId('calendar-road-icon')
    expect(roadIcons.length).toBeGreaterThan(0)
    await user.click(roadIcons[0])
    expect(screen.getAllByTestId('calendar-thin-road-line').length).toBeGreaterThan(0)
    // Both start (Nov 1) and finish (Dec 20) are auto-spanned into view
    expect(document.querySelector('[data-date="2026-11-01"]')).toBeInTheDocument()
    expect(document.querySelector('[data-date="2026-12-20"]')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-outside-road="1"]').length).toBeGreaterThan(0)
    await user.click(screen.getByTestId('calendar-active-road-detail'))
    expect(await screen.findByTestId('journey-road-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('road-time-progress')).toBeInTheDocument()
    expect(screen.getByTestId('road-work-progress')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByTestId('journey-road-overlay')).not.toBeInTheDocument()
    // Clicking the active Quest icon a 2nd time toggles the road OFF
    await user.click(screen.getAllByTestId('calendar-road-icon')[0])
    expect(screen.queryByTestId('calendar-thin-road-line')).not.toBeInTheDocument()

    // 2. Open Photo Lightbox from featured Moment (scoped strictly to Today's 2 photos: 1 / 2 -> 2 / 2)
    expect(screen.getByTestId('calendar-moment-count').textContent).toBe('2 ảnh')
    await user.click(screen.getByTestId('calendar-featured-moment'))
    expect(await screen.findByTestId('social-media-lightbox')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByTestId('social-media-lightbox')).not.toBeInTheDocument()

    // 3. Switch to Time-Based Day View
    await user.click(screen.getByTestId('calendar-view-day'))
    expect(await screen.findByTestId('day-timeline-grid')).toBeInTheDocument()
    expect(screen.getAllByTestId('day-deadline-marker').length).toBeGreaterThan(0)
  })

  it('builds continuous road-span weeks up to 2 months and collapses middle weeks when > 2 months while keeping start & end dates', () => {
    const shortSpan = buildRoadSpanWeeks('2026-11-01', '2026-12-20', '2026-11-24')
    expect(shortSpan.some((r) => r.kind === 'gap')).toBe(false)
    const shortYmds = shortSpan.flatMap((r) => (r.kind === 'week' ? r.cells.map((c) => c.ymd) : []))
    expect(shortYmds).toContain('2026-11-01')
    expect(shortYmds).toContain('2026-12-20')

    const longSpan = buildRoadSpanWeeks('2026-11-01', '2027-03-20', '2026-11-24')
    const gapRow = longSpan.find((r) => r.kind === 'gap')
    expect(gapRow).toBeDefined()
    if (gapRow?.kind === 'gap') {
      expect(gapRow.skippedWeeks).toBeGreaterThan(0)
    }
    const longYmds = longSpan.flatMap((r) => (r.kind === 'week' ? r.cells.map((c) => c.ymd) : []))
    expect(longYmds).toContain('2026-11-01')
    expect(longYmds).toContain('2027-03-20')
  })
})
