import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FoxDialogueEngine } from '@/features/mascot/dialogue/FoxDialogueEngine'
import { MOCK_GOALS, MOCK_MILESTONES, MOCK_QUESTS } from '@/services/repositories/fixtures'
import { useAuthStore } from '@/stores/authStore'
import type { Quest } from '@/types/domain'
import { buildQuestCheckpoints } from './QuestCheckpointMap'
import { QuestCreateSheet } from './QuestCreateSheet'
import { QuestDetailPage } from './QuestDetailPage'
import { QuestMomentsGallery } from './QuestMomentsGallery'
import { QuestNextActionPanel } from './QuestNextActionPanel'
import {
  classifyQuestTimingState,
  computeQuestProgress,
  groupTasksByEpic
} from './questUtils'

function makeTask(overrides: Partial<Quest>): Quest {
  return {
    ...MOCK_QUESTS[0],
    id: `task-${Math.random().toString(36).slice(2, 8)}`,
    completedAt: null,
    archivedAt: null,
    deletedAt: null,
    status: 'ACTIVE',
    ...overrides
  }
}

function renderQuestRoute(initialPath: string) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/work/quests/:questId" element={<QuestDetailPage />} />
          <Route path="/work/quests" element={<div data-testid="quests-list-stub">List</div>} />
          <Route path="/work/tasks/:taskId" element={<div data-testid="task-detail-stub">Task</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('FE-04C Quest Management, Progress & Collaborative Boundaries', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: '', refreshToken: '', user: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('computes authoritative Quest progress from linked Tasks (zero tasks = 0%, excludes archived/deleted, orders overdue first)', () => {
    const now = Date.parse('2026-11-23T12:00:00.000Z')

    const empty = computeQuestProgress([], now)
    expect(empty.totalCount).toBe(0)
    expect(empty.completedCount).toBe(0)
    expect(empty.percent).toBe(0)
    expect(empty.nextActionableTask).toBeNull()

    const overdueTask = makeTask({
      id: 't-overdue',
      title: 'Overdue Task',
      dueAt: '2026-11-23T09:00:00.000Z'
    })
    const completedTask = makeTask({
      id: 't-done',
      title: 'Done Task',
      completedAt: '2026-11-23T08:00:00.000Z'
    })
    const upcomingTask = makeTask({
      id: 't-up',
      title: 'Upcoming Task',
      dueAt: '2026-11-25T09:00:00.000Z'
    })
    const archivedTask = makeTask({
      id: 't-arch',
      title: 'Archived Task',
      status: 'ARCHIVED'
    })

    const summary = computeQuestProgress(
      [upcomingTask, completedTask, overdueTask, archivedTask],
      now
    )
    expect(summary.totalCount).toBe(3)
    expect(summary.completedCount).toBe(1)
    expect(summary.remainingCount).toBe(2)
    expect(summary.archivedCount).toBe(1)
    expect(summary.percent).toBe(33)
    expect(summary.nextActionableTask?.id).toBe('t-overdue')
  })

  it('classifies Quest timing states accurately without marking completed quests overdue', () => {
    const now = Date.parse('2026-11-23T12:00:00.000Z')
    expect(
      classifyQuestTimingState(
        { ...MOCK_GOALS[0], status: 'COMPLETED', dueDate: '2026-11-01T00:00:00.000Z' },
        now
      )
    ).toBe('completed')
    expect(
      classifyQuestTimingState(
        { ...MOCK_GOALS[0], status: 'ACTIVE', dueDate: '2026-11-20T00:00:00.000Z' },
        now
      )
    ).toBe('overdue')
    expect(
      classifyQuestTimingState(
        { ...MOCK_GOALS[0], status: 'ACTIVE', dueDate: '2026-11-25T00:00:00.000Z' },
        now
      )
    ).toBe('due_soon')
  })

  it('renders Personal Quest Detail cleanly without empty team panels and Collaborative Preview with expandable Members', async () => {
    const user = userEvent.setup()

    // Personal Quest
    const { unmount } = renderQuestRoute(`/work/quests/${MOCK_GOALS[0].id}`)
    await screen.findByTestId('quest-checkpoint-map')
    expect(screen.getByTestId('quest-detail-page')).toHaveAttribute('data-quest-mode', 'personal')
    expect(screen.queryByTestId('quest-members-list')).not.toBeInTheDocument()
    expect(screen.getByTestId('quest-next-action-panel')).toBeInTheDocument()
    expect(screen.getByTestId('quest-moments-gallery')).toBeInTheDocument()
    expect(screen.getByTestId('quest-linked-tasks')).toBeInTheDocument()
    unmount()

    // Collaborative Preview Quest
    renderQuestRoute('/work/quests/collab-preview-1')
    await screen.findByTestId('quest-members-list')
    expect(screen.getByTestId('quest-detail-page')).toHaveAttribute(
      'data-quest-mode',
      'collaborative'
    )
    expect(screen.getByTestId('quest-collab-preview-banner')).toBeInTheDocument()

    // Collapse & expand member section
    await user.click(screen.getByTestId('quest-members-toggle'))
    expect(screen.queryByTestId('quest-members-list')).not.toBeInTheDocument()
    await user.click(screen.getByTestId('quest-members-toggle'))
    expect(screen.getByTestId('quest-members-list')).toBeInTheDocument()
  })

  it('renders Permission Denied state cleanly without leaking private Quest details', async () => {
    renderQuestRoute('/work/quests/collab-preview-denied')
    expect(await screen.findByTestId('quest-permission-denied')).toBeInTheDocument()
    expect(screen.queryByTestId('quest-linked-tasks')).not.toBeInTheDocument()
  })

  it('preserves parent Quest ID (goalId) when submitting a new linked Task via API', async () => {
    const user = userEvent.setup()
    useAuthStore.setState({
      accessToken: 'live-token',
      refreshToken: 'refresh-token',
      user: { id: 'u1', email: 'u1@test.local', username: 'u1', status: 'ACTIVE' }
    })

    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes(`/goals/${MOCK_GOALS[0].id}/milestones`)) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      if (url.includes(`/goals/${MOCK_GOALS[0].id}`)) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: MOCK_GOALS[0] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      if (url.includes('/quests') && init?.method === 'POST') {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: MOCK_QUESTS[0] }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    renderQuestRoute(`/work/quests/${MOCK_GOALS[0].id}`)
    await screen.findByTestId('quest-add-task-btn')
    await user.click(screen.getByTestId('quest-add-task-btn'))
    await user.type(screen.getByLabelText(/Tên nhiệm vụ/i), 'Viết test FE-04C')
    await user.click(screen.getByTestId('quest-add-task-submit'))

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        ([u, init]) => String(u).includes('/quests') && init?.method === 'POST'
      )
      expect(postCall).toBeTruthy()
      const body = JSON.parse(String(postCall?.[1]?.body))
      expect(body.goalId).toBe(MOCK_GOALS[0].id)
      expect(body.title).toBe('Viết test FE-04C')
    })
  })

  it('shows Friend Invitation Picker boundary in Collaborative mode and refuses fake creation when unauthenticated', async () => {
    const user = userEvent.setup()
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={qc}>
        <QuestCreateSheet open onClose={() => {}} />
      </QueryClientProvider>
    )

    await user.click(screen.getByTestId('quest-mode-collaborative'))
    expect(screen.getByTestId('quest-friend-invite-picker')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/Tên hành trình/i), 'Hành trình thử nghiệm')
    await user.click(screen.getByTestId('quest-submit-btn'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/đăng nhập tài khoản/i)
  })

  it('ensures QUEST_DEADLINE_URGENT takes priority over QUEST_OPENED and idle chatter in FoxDialogueEngine', () => {
    let clock = 8_000_000
    const engine = new FoxDialogueEngine({ now: () => clock, random: () => 0.1 })

    engine.emit({ event: 'QUEST_OPENED' })
    expect(engine.getActive()?.event).toBe('QUEST_OPENED')

    clock += 4_000
    const urgent = engine.emit({
      event: 'QUEST_DEADLINE_URGENT',
      dedupeKey: 'quest:urgent:1',
      taskTitle: 'Hoàn thành đồ án'
    })
    expect(urgent.accepted).toBe(true)
    expect(engine.getActive()?.event).toBe('QUEST_DEADLINE_URGENT')

    clock += 4_000
    engine.emit({ event: 'IDLE_CHATTER' })
    expect(engine.getActive()?.event).toBe('QUEST_DEADLINE_URGENT')
  })

  it('maps every Journey Map checkpoint strictly to an Epic (Milestone), deduplicates Tasks, and computes Epic progress from verified Tasks', () => {
    const empty = buildQuestCheckpoints([], [])
    expect(empty).toHaveLength(0)

    const ms = MOCK_MILESTONES[MOCK_GOALS[0].id]
    const dupTask = makeTask({
      id: 'dup-1',
      milestoneId: ms[1].id,
      completedAt: '2026-11-22T00:00:00.000Z'
    })
    const openTask = makeTask({
      id: 'open-2',
      milestoneId: ms[1].id,
      completedAt: null
    })
    const unassigned = makeTask({ id: 'unassigned-1', milestoneId: null })

    const grouping = groupTasksByEpic(ms, [dupTask, dupTask, openTask, unassigned])
    expect(grouping.deduplicatedActiveTasks).toHaveLength(3)
    expect(grouping.epicGroups[1].totalCount).toBe(2)
    expect(grouping.epicGroups[1].completedCount).toBe(1)
    expect(grouping.epicGroups[1].percent).toBe(50)
    expect(grouping.epicGroups[2].totalCount).toBe(0)
    expect(grouping.epicGroups[2].percent).toBe(0)
    expect(grouping.unassignedTasks).toHaveLength(1)

    const msCheckpoints = buildQuestCheckpoints(ms, [dupTask, openTask])
    expect(msCheckpoints).toHaveLength(3)
    expect(msCheckpoints[0].status).toBe('completed')
    expect(msCheckpoints[1].status).toBe('active')
    expect(msCheckpoints[1].percent).toBe(50)
    expect(msCheckpoints[2].status).toBe('upcoming')
    expect(msCheckpoints[0].source).toBe('milestone')

    // Zero Epics returns empty checkpoint list cleanly (no fake Epic nodes)
    expect(buildQuestCheckpoints([], [unassigned])).toHaveLength(0)
  })

  it('filters Tasks grouped by Epic when clicking an Epic checkpoint and preselects Epic in Add Task sheet', async () => {
    const user = userEvent.setup()
    renderQuestRoute('/work/quests/collab-preview-1')
    await screen.findByTestId('quest-checkpoint-map')

    // Both collaborative Epics visible initially
    expect(screen.getAllByTestId('epic-task-group')).toHaveLength(2)

    // Clicking Epic #2 checkpoint filters groups below to Epic #2 only
    await user.click(screen.getByTestId('checkpoint-node-2'))
    expect(screen.getAllByTestId('epic-task-group')).toHaveLength(1)
    expect(screen.getByTestId('epic-task-group')).toHaveAttribute('data-epic-id', 'collab-epic-2')

    // Clicking "+ Thêm Task" inside Epic #2 preselects collab-epic-2 in the form
    await user.click(screen.getByTestId('epic-add-task-1'))
    const select = (await screen.findByTestId('quest-add-task-epic-select')) as HTMLSelectElement
    expect(select.value).toBe('collab-epic-2')
  })

  it('prioritizes current user tasks in QuestNextActionPanel while surfacing urgent team alerts', async () => {
    const user = userEvent.setup()
    const myTask = makeTask({
      id: 'my-t',
      title: 'My Upcoming Task',
      dueAt: '2026-11-28T10:00:00.000Z'
    })
    const teamUrgent = makeTask({
      id: 'team-t',
      title: 'Team Overdue Task',
      dueAt: '2026-11-20T10:00:00.000Z'
    })

    render(
      <QuestNextActionPanel
        tasks={[myTask, teamUrgent]}
        isCollaborative
        currentUserId="u1"
        assigneeMap={{ 'my-t': 'u1', 'team-t': 'u2' }}
        onOpenTask={() => {}}
        onAddTask={() => {}}
      />
    )

    expect(screen.getByText('My Upcoming Task')).toBeInTheDocument()
    expect(screen.getByTestId('urgent-team-alert')).toHaveTextContent('Team Overdue Task')

    await user.click(screen.getByTestId('next-action-scope-team'))
    expect(screen.getAllByTestId('quest-next-action-item')[0]).toHaveTextContent('Team Overdue Task')
  })

  it('manages local image preview & revokes URLs on removal and unmount in QuestMomentsGallery', async () => {
    const user = userEvent.setup()
    const origCreate = URL.createObjectURL
    const origRevoke = URL.revokeObjectURL
    const createMock = vi.fn(() => 'blob:moment-1')
    const revokeMock = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: createMock })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: revokeMock })

    try {
      const { unmount } = render(
        <QuestMomentsGallery questTitle="Demo Quest" authorName="Bạn" relatedLabels={['Chặng #1']} />
      )
      const input = screen.getByTestId('moments-file-input') as HTMLInputElement
      const file = new File(['png'], 'moment.png', { type: 'image/png' })
      fireEvent.change(input, { target: { files: [file] } })

      expect(createMock).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('moments-grid')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Xóa toàn bộ khoảnh khắc xem trước' }))
      expect(revokeMock).toHaveBeenCalledWith('blob:moment-1')

      fireEvent.change(input, { target: { files: [file] } })
      unmount()
      expect(revokeMock).toHaveBeenCalledTimes(2)
    } finally {
      Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: origCreate })
      Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: origRevoke })
    }
  })
})
