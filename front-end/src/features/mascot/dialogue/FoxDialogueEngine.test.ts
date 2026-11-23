import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Quest } from '@/types/domain'
import { FoxDialogueEngine } from './FoxDialogueEngine'
import { validateDialogueCatalog } from './catalogLoader'
import { evaluateQuestDeadlines } from './deadlineMonitor'
import { foxDialogueBus } from './dialogueBus'

function makeQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: 'q-1',
    userId: 'u-1',
    goalId: null,
    milestoneId: null,
    title: 'Hoàn thiện báo cáo FE',
    description: null,
    type: 'SIMPLE',
    priority: 1,
    proofRequirement: 'NONE',
    targetValue: null,
    targetUnit: null,
    estimatedDurationSeconds: null,
    xpReward: 30,
    coinReward: 10,
    startAt: null,
    dueAt: null,
    completedAt: null,
    archivedAt: null,
    status: 'ACTIVE',
    createdAt: '2026-11-23T00:00:00.000Z',
    updatedAt: '2026-11-23T00:00:00.000Z',
    deletedAt: null,
    isPinned: false,
    ...overrides
  }
}

describe('FOX-D03 Contextual Dialogue & Personality Engine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    foxDialogueBus.resetForTests()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('validates the standalone Vietnamese dialogue catalog (>= 145 distinct lines, all 7 categories)', () => {
    const report = validateDialogueCatalog()
    expect(report.valid).toBe(true)
    expect(report.errors).toEqual([])
    expect(report.totalEntries).toBeGreaterThanOrEqual(145)
    expect(report.countsByCategory.idle).toBeGreaterThanOrEqual(30)
    expect(report.countsByCategory.encouragement).toBeGreaterThanOrEqual(20)
    expect(report.countsByCategory.dashboard).toBeGreaterThanOrEqual(20)
    expect(report.countsByCategory.social).toBeGreaterThanOrEqual(20)
    expect(report.countsByCategory.task).toBeGreaterThanOrEqual(25)
    expect(report.countsByCategory.deadline).toBeGreaterThanOrEqual(20)
    expect(report.countsByCategory.system).toBeGreaterThanOrEqual(10)
  })

  it('enforces pause gates: no idle chatter while typing, modal open, lightbox open, collapsed, or hidden', () => {
    let clock = 100_000
    const engine = new FoxDialogueEngine({ now: () => clock, random: () => 0.1 })

    engine.setPauseReason({ typing: true })
    expect(engine.emit({ event: 'IDLE_CHATTER' }).accepted).toBe(false)

    engine.setPauseReason({ typing: false, lightboxOpen: true })
    expect(engine.emit({ event: 'IDLE_CHATTER' }).accepted).toBe(false)

    engine.setPauseReason({ lightboxOpen: false, modalOpen: true })
    expect(engine.emit({ event: 'IDLE_CHATTER' }).accepted).toBe(false)

    engine.setPauseReason({ modalOpen: false, foxCollapsed: true })
    expect(engine.emit({ event: 'IDLE_CHATTER' }).accepted).toBe(false)

    engine.setPauseReason({ foxCollapsed: false, pageHidden: true })
    expect(engine.emit({ event: 'IDLE_CHATTER' }).accepted).toBe(false)

    engine.setPauseReason({ pageHidden: false })
    clock += 10_000
    const res = engine.emit({ event: 'IDLE_CHATTER' })
    expect(res.accepted).toBe(true)
    expect(res.active?.event).toBe('IDLE_CHATTER')
  })

  it('handles priority interruption: urgent deadline interrupts idle; idle never interrupts urgent', () => {
    let clock = 200_000
    const engine = new FoxDialogueEngine({ now: () => clock, random: () => 0.2 })

    const idle = engine.emit({ event: 'IDLE_CHATTER' })
    expect(idle.accepted).toBe(true)
    expect(idle.active?.event).toBe('IDLE_CHATTER')

    // Urgent 15m deadline immediately interrupts idle chatter
    clock += 1000
    const urgent = engine.emit({
      event: 'DEADLINE_15M',
      dedupeKey: 'deadline:q-1:15m',
      taskTitle: 'Nộp bài đồ án'
    })
    expect(urgent.accepted).toBe(true)
    expect(urgent.active?.event).toBe('DEADLINE_15M')
    expect(urgent.active?.emotion).toBe('panic')
    expect(urgent.active?.text).toContain('Nộp bài đồ án')

    // Idle chatter must NOT interrupt active urgent deadline alert
    clock += 40_000
    const blockedIdle = engine.emit({ event: 'IDLE_CHATTER' })
    expect(blockedIdle.accepted).toBe(false)
    expect(engine.getActive()?.event).toBe('DEADLINE_15M')
  })

  it('avoids phrase repetition loops and enforces per-event cooldowns', () => {
    let clock = 300_000
    const engine = new FoxDialogueEngine({
      now: () => clock,
      random: () => 0.01 // Always bias toward index 0 to test repeat avoidance
    })

    const first = engine.emit({ event: 'SOCIAL_MEDIA_VIEWED' })
    expect(first.accepted).toBe(true)
    const firstId = first.active!.entryId

    // Inside cooldown window -> rejected
    clock += 2_000
    expect(engine.emit({ event: 'SOCIAL_MEDIA_VIEWED' }).reason).toBe('event_cooldown')

    // After cooldown + dismiss -> picks a DIFFERENT line (no repetition loop)
    engine.dismiss()
    clock += 15_000
    const second = engine.emit({ event: 'SOCIAL_MEDIA_VIEWED' })
    expect(second.accepted).toBe(true)
    expect(second.active!.entryId).not.toBe(firstId)
  })

  it('supports verified TASK_CREATED, TASK_COMPLETED contract, and Dashboard actions', () => {
    let clock = 400_000
    const engine = new FoxDialogueEngine({ now: () => clock, random: () => 0.3 })

    const pinRes = engine.emit({ event: 'PIN_UPDATED' })
    expect(pinRes.accepted).toBe(true)
    expect(pinRes.active?.event).toBe('PIN_UPDATED')

    engine.dismiss()
    clock += 10_000
    const created = engine.emit({ event: 'TASK_CREATED' })
    expect(created.accepted).toBe(true)
    expect(created.active?.gateIEvent).toBe('TASK_CREATED')

    engine.dismiss()
    clock += 10_000
    const completed = engine.emit({ event: 'TASK_COMPLETED' })
    expect(completed.accepted).toBe(true)
    expect(completed.active?.gateIEvent).toBe('TASK_COMPLETED')
  })

  it('evaluates 60m, 15m, and overdue deadlines accurately, ignores completed quests, and deduplicates', () => {
    const nowMs = Date.parse('2026-11-23T10:00:00.000Z')
    const quests: Quest[] = [
      makeQuest({ id: 'q-60', title: 'Task 60m', dueAt: '2026-11-23T10:45:00.000Z' }),
      makeQuest({ id: 'q-15', title: 'Task 15m', dueAt: '2026-11-23T10:10:00.000Z' }),
      makeQuest({ id: 'q-ov', title: 'Task Overdue', dueAt: '2026-11-23T09:50:00.000Z' }),
      makeQuest({
        id: 'q-done',
        title: 'Task Done',
        dueAt: '2026-11-23T10:05:00.000Z',
        completedAt: '2026-11-23T09:00:00.000Z'
      })
    ]

    const alerts = evaluateQuestDeadlines(quests, nowMs)
    expect(alerts.map((a) => `${a.questId}:${a.threshold}`)).toEqual([
      'q-ov:overdue',
      'q-15:15m',
      'q-60:60m'
    ])

    // Deduplication across repeated evaluations
    const engine = new FoxDialogueEngine({ now: () => nowMs })
    const first = engine.emit({
      event: alerts[0].event,
      dedupeKey: alerts[0].dedupeKey,
      taskTitle: alerts[0].questTitle
    })
    expect(first.accepted).toBe(true)

    engine.dismiss()
    const duplicate = engine.emit({
      event: alerts[0].event,
      dedupeKey: alerts[0].dedupeKey,
      taskTitle: alerts[0].questTitle
    })
    expect(duplicate.accepted).toBe(false)
    expect(duplicate.reason).toBe('deduplicated')
  })

  it('auto-expires active bubbles via fake timers on foxDialogueBus', () => {
    const active = foxDialogueBus.emit({ event: 'APP_GREETING', hour: 10 })
    expect(active).not.toBeNull()
    expect(foxDialogueBus.getActive()).not.toBeNull()

    vi.advanceTimersByTime(active!.durationMs + 50)
    expect(foxDialogueBus.getActive()).toBeNull()
  })
})
