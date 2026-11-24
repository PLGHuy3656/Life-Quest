import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FoxDialogueEngine } from '@/features/mascot/dialogue/FoxDialogueEngine'
import { MOCK_QUESTS } from '@/services/repositories/fixtures'
import {
  computeRemainingMs,
  formatTimerMMSS,
  useFocusSessionStore
} from '@/stores/focusSessionStore'
import type { Quest } from '@/types/domain'
import { FocusSessionCard } from './FocusSessionCard'
import { TaskEvidenceSection } from './TaskEvidenceSection'
import { classifyDetailTimingState, formatRemainingDuration } from './taskUtils'

function makeQuest(overrides: Partial<Quest>): Quest {
  return {
    ...MOCK_QUESTS[0],
    startAt: null,
    dueAt: null,
    completedAt: null,
    status: 'ACTIVE',
    ...overrides
  }
}

describe('FE-04B.1 Task Detail Timing, Focus Session V1 & Evidence Preview', () => {
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL

  beforeEach(() => {
    useFocusSessionStore.getState().reset(25)
  })

  afterEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: originalCreateObjectURL
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: originalRevokeObjectURL
    })
    vi.restoreAllMocks()
  })

  it('classifies all 6 detail timing states accurately and never marks completed tasks overdue', () => {
    const now = Date.parse('2026-11-23T10:00:00.000Z')

    expect(
      classifyDetailTimingState(
        makeQuest({ dueAt: '2026-11-23T08:00:00.000Z', completedAt: '2026-11-23T07:30:00.000Z' }),
        now
      )
    ).toBe('completed')

    expect(
      classifyDetailTimingState(makeQuest({ dueAt: '2026-11-23T09:00:00.000Z' }), now)
    ).toBe('overdue')

    expect(
      classifyDetailTimingState(makeQuest({ dueAt: '2026-11-23T10:45:00.000Z' }), now)
    ).toBe('due_soon')

    expect(
      classifyDetailTimingState(
        makeQuest({ startAt: '2026-11-23T09:30:00.000Z', dueAt: '2026-11-23T16:00:00.000Z' }),
        now
      )
    ).toBe('in_progress')

    expect(
      classifyDetailTimingState(
        makeQuest({ startAt: '2026-11-23T10:30:00.000Z', dueAt: '2026-11-23T16:00:00.000Z' }),
        now
      )
    ).toBe('starting_soon')

    expect(
      classifyDetailTimingState(
        makeQuest({ startAt: '2026-11-24T09:00:00.000Z', dueAt: '2026-11-24T17:00:00.000Z' }),
        now
      )
    ).toBe('not_started')

    expect(formatRemainingDuration('2026-11-23T11:30:00.000Z', now)).toBe('Còn 1g 30p')
    expect(formatRemainingDuration('2026-11-23T08:00:00.000Z', now)).toBe('Quá hạn 2 giờ')
  })

  it('keeps Focus timer drift-free across background tab intervals and enforces single active session', () => {
    const tResume = Date.now()
    const tAfter10m = tResume - 120_000
    const t0 = tAfter10m - 10 * 60 * 1000
    const store = useFocusSessionStore.getState()
    store.start('task-A', 'Nhiệm vụ A', 25, t0)

    // Simulate 10 minutes elapsed while tab was hidden
    const rem = computeRemainingMs(useFocusSessionStore.getState(), tAfter10m)
    expect(formatTimerMMSS(rem)).toBe('15:00')

    // Pause freezes remaining time at 15:00
    useFocusSessionStore.getState().pause(tAfter10m)
    expect(useFocusSessionStore.getState().status).toBe('paused')
    expect(formatTimerMMSS(useFocusSessionStore.getState().remainingAtAnchorMs)).toBe('15:00')

    // Resume from 15:00 and advance 5 minutes -> 10:00
    useFocusSessionStore.getState().resume(tResume)
    expect(
      formatTimerMMSS(computeRemainingMs(useFocusSessionStore.getState(), tResume + 5 * 60 * 1000))
    ).toBe('10:00')

    // Rendering FocusSessionCard for a different task warns about active session rather than running 2 sessions
    render(<FocusSessionCard taskId="task-B" taskTitle="Nhiệm vụ B" />)
    expect(screen.getByText(/Đang có phiên tập trung hoạt động cho/i)).toBeInTheDocument()
  })

  it('creates local evidence preview via URL.createObjectURL and revokes object URLs on removal & unmount', async () => {
    const user = userEvent.setup()
    const createMock = vi.fn(() => 'blob:evidence-preview-1')
    const revokeMock = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: createMock })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: revokeMock })

    const { unmount } = render(<TaskEvidenceSection proofRequirement="OPTIONAL" />)
    const input = screen.getByTestId('evidence-file-input') as HTMLInputElement
    const file = new File(['png-bytes'], 'proof.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(createMock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('evidence-preview-grid')).toBeInTheDocument()
    expect(screen.getByText('XEM TRƯỚC CỤC BỘ • CHƯA TẢI LÊN')).toBeInTheDocument()
    expect(screen.getByTestId('evidence-submit-btn')).toBeInTheDocument()
    expect(screen.getByTestId('evidence-share-social-btn')).toBeInTheDocument()

    await user.click(screen.getByTestId('evidence-submit-btn'))
    expect(screen.getByTestId('evidence-action-notice')).toHaveTextContent(/Media Upload API/i)

    await user.click(screen.getByTestId('evidence-share-social-btn'))
    expect(screen.getByTestId('evidence-action-notice')).toHaveTextContent(/Social Publish API/i)

    // Clear all revokes object URL
    await user.click(screen.getByRole('button', { name: 'Xóa toàn bộ ảnh minh chứng cục bộ' }))
    expect(revokeMock).toHaveBeenCalledWith('blob:evidence-preview-1')

    // Re-add and unmount -> cleanup revokes URL
    fireEvent.change(input, { target: { files: [file] } })
    unmount()
    expect(revokeMock).toHaveBeenCalledTimes(2)
  })

  it('ensures Focus and Evidence Fox dialogue events never interrupt urgent deadline alerts', () => {
    let clock = 5_000_000
    const engine = new FoxDialogueEngine({ now: () => clock, random: () => 0.1 })

    const urgent = engine.emit({
      event: 'DEADLINE_15M',
      dedupeKey: 'deadline:focus-priority:15m',
      taskTitle: 'Nộp báo cáo'
    })
    expect(urgent.accepted).toBe(true)

    clock += 5_000
    const focusRes = engine.emit({ event: 'FOCUS_STARTED' })
    expect(engine.getActive()?.event).toBe('DEADLINE_15M')
    expect(focusRes.active?.event).toBe('DEADLINE_15M')

    clock += 5_000
    engine.emit({ event: 'EVIDENCE_SELECTED' })
    expect(engine.getActive()?.event).toBe('DEADLINE_15M')
  })
})
