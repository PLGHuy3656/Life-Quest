import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Quest } from '@/types/domain'
import { FoxDialogueEngine } from './FoxDialogueEngine'
import { validateDialogueCatalog } from './catalogLoader'
import { evaluateQuestDeadlines } from './deadlineMonitor'
import { foxDialogueBus } from './dialogueBus'
import { FoxTouchClassifier } from './touchClassifier'

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

describe('FOX-D03.1 Touch Interaction Dialogue', () => {
  it('validates the touch dialogue collection (>= 30 distinct Vietnamese lines across all 4 touch events)', () => {
    const report = validateDialogueCatalog()
    expect(report.valid).toBe(true)
    expect(report.errors).toEqual([])
    expect(report.countsByCategory.touch).toBeGreaterThanOrEqual(30)
    expect(report.totalEntries).toBeGreaterThanOrEqual(175)
  })

  it('classifies single, debounced, repeat, return, and verified-sleep touches deterministically', () => {
    let clock = 1_000_000
    const classifier = new FoxTouchClassifier({
      now: () => clock,
      debounceMs: 250,
      repeatWindowMs: 4000,
      returnGapMs: 600_000
    })

    // First touch -> TOUCH_SINGLE
    expect(classifier.classify({ isSleeping: false })).toBe('TOUCH_SINGLE')

    // Rapid duplicate within 250ms debounce -> null (prevents mouse/touch double-fire)
    clock += 120
    expect(classifier.classify({ isSleeping: false })).toBeNull()

    // Second touch within 4s repeat window -> TOUCH_REPEAT
    clock += 600
    expect(classifier.classify({ isSleeping: false })).toBe('TOUCH_REPEAT')

    // Touch after repeat window (10s) -> TOUCH_SINGLE
    clock += 10_000
    expect(classifier.classify({ isSleeping: false })).toBe('TOUCH_SINGLE')

    // Touch after long gap (>= 10m) -> TOUCH_RETURN
    clock += 610_000
    expect(classifier.classify({ isSleeping: false })).toBe('TOUCH_RETURN')

    // Touch while real mascot sleep state is active -> TOUCH_SLEEP
    clock += 2_000
    expect(classifier.classify({ isSleeping: true })).toBe('TOUCH_SLEEP')

    // Non-sleeping state never infers TOUCH_SLEEP
    clock += 5_000
    expect(classifier.classify({ isSleeping: false })).toBe('TOUCH_SINGLE')
  })

  it('allows touch to interrupt idle chatter, updates smoothly on repeat, and never interrupts urgent deadlines', () => {
    let clock = 2_000_000
    const engine = new FoxDialogueEngine({ now: () => clock, random: () => 0.05 })

    // Idle chatter active
    const idle = engine.emit({ event: 'IDLE_CHATTER' })
    expect(idle.accepted).toBe(true)

    // Touch interrupts idle immediately (even inside 4s global cooldown)
    clock += 500
    const firstTouch = engine.emit({ event: 'TOUCH_SINGLE' })
    expect(firstTouch.accepted).toBe(true)
    expect(firstTouch.active?.event).toBe('TOUCH_SINGLE')
    expect(firstTouch.active?.gateIEvent).toBe('FRIEND_GREETING')

    // Repeat touch after 1.3s replaces single touch smoothly
    clock += 1_300
    const repeatTouch = engine.emit({ event: 'TOUCH_REPEAT' })
    expect(repeatTouch.accepted).toBe(true)
    expect(repeatTouch.active?.event).toBe('TOUCH_REPEAT')
    expect(repeatTouch.active?.entryId).not.toBe(firstTouch.active?.entryId)

    // Urgent 15m deadline interrupts touch dialogue
    clock += 1_000
    const urgent = engine.emit({
      event: 'DEADLINE_15M',
      dedupeKey: 'deadline:touch-test:15m',
      taskTitle: 'Hoàn thành sprint'
    })
    expect(urgent.accepted).toBe(true)
    expect(urgent.active?.event).toBe('DEADLINE_15M')

    // Touch MUST NOT interrupt active urgent deadline alert
    clock += 2_000
    const blockedTouch = engine.emit({ event: 'TOUCH_SINGLE' })
    expect(blockedTouch.accepted).toBe(false)
    expect(blockedTouch.reason).toBe('blocked_by_urgent_alert')
    expect(engine.getActive()?.event).toBe('DEADLINE_15M')
  })
})
