import { describe, it, expect } from 'vitest'
import { analyzeAlarmDiscipline } from '../src/engines/alarmCoachEngine.js'
import { buildGroupChatAssist } from '../src/engines/groupChatAssistEngine.js'
import { buildNotificationDispatchPlan } from '../src/engines/notificationPlannerEngine.js'
import { evaluateProgressNudge } from '../src/engines/progressCoachEngine.js'
import { recommendWardrobeCosmetics } from '../src/engines/wardrobeStylistEngine.js'

describe('Smart Engagement Engines (5-Branches AI)', () => {
  it('progressCoachEngine detects 50% halfway, 80% sprint, 100% completion, and behind-pace', () => {
    const half = evaluateProgressNudge({
      entityType: 'GOAL',
      entityId: 'g-1',
      title: 'Học IELTS',
      completedCount: 2,
      totalCount: 4,
      nextStepTitle: 'Luyện nghe Part 2',
      isGroupShared: true
    })
    expect(half.triggered).toBe(true)
    expect(half.stage).toBe('HALFWAY_50')
    expect(half.progressPercent).toBe(50)
    expect(half.suggestGroupShare).toBe(true)
    expect(half.pushPayload.type).toBe('ai.progress.halfway')

    const sprint = evaluateProgressNudge({
      entityType: 'GOAL',
      entityId: 'g-1',
      title: 'Học IELTS',
      completedCount: 4,
      totalCount: 5
    })
    expect(sprint.stage).toBe('SPRINT_80')

    const behind = evaluateProgressNudge({
      entityType: 'GOAL',
      entityId: 'g-1',
      title: 'Đồ án',
      completedCount: 1,
      totalCount: 5,
      elapsedTimeRatio: 0.75
    })
    expect(behind.stage).toBe('BEHIND_PACE')
    expect(behind.emotion).toBe('alert')
  })

  it('wardrobeStylistEngine prioritizes set completion (student_glasses) with real Fox V2 items', () => {
    const res = recommendWardrobeCosmetics({ useMockIfEmpty: true })
    expect(res.dataSource).toBe('MOCK')
    expect(res.suggestions.length).toBeGreaterThanOrEqual(3)
    expect(res.suggestions[0].itemId).toBe('student_glasses')
    expect(res.suggestions[0].completesOutfitSet).toBe(true)
    expect(res.suggestions[0].canAffordNow).toBe(true)
    expect(res.suggestions[0].targetRoute).toBe('/wardrobe/shop')
  })

  it('alarmCoachEngine recommends upgrading mini-game when snooze/missed rate is high', () => {
    const res = analyzeAlarmDiscipline({ useMockIfEmpty: true })
    expect(res.dataSource).toBe('MOCK')
    expect(res.missedCount).toBe(4)
    expect(res.recommendedMiniGame).toBe('MEMORY_SEQUENCE')
    expect(res.recommendedDifficulty).toBe('MEDIUM')
    expect(res.recommendedMaxSnooze).toBe(1)
  })

  it('groupChatAssistEngine computes exact membersNeededToSaveStreak for THRESHOLD_PERCENT', () => {
    const res = buildGroupChatAssist({
      conversationId: 'conv-group-run',
      mode: 'STREAK_RISK_NUDGE'
    })
    // 4 members, 75% threshold -> need 3; currently 2 qualified -> need 1 more!
    expect(res.membersNeededToSaveStreak).toBe(1)
    expect(res.currentCompletionPercent).toBe(50)
    expect(res.content).toContain('thêm đúng 1 người nữa')
  })

  it('notificationPlannerEngine enforces Quiet Hours, muted chat suppression, dedup, and alarm.ringing bypass', () => {
    const plan = buildNotificationDispatchPlan({
      userId: 'u-1',
      localHour: 23,
      quietHoursStart: 22,
      quietHoursEnd: 6,
      events: [
        { id: 'e1', type: 'ai.progress.halfway', title: '50%', body: 'Keep going', priority: 'NORMAL', data: { entityId: 'g1' } },
        { id: 'e2', type: 'ai.progress.halfway', title: '50% dup', body: 'Dup', priority: 'NORMAL', data: { entityId: 'g1' } },
        { id: 'e3', type: 'chat.message', title: 'Group', body: 'Hi', priority: 'NORMAL', conversationMuted: true },
        { id: 'e4', type: 'alarm.ringing', title: '06:30', body: 'Dậy đi!', priority: 'URGENT' }
      ]
    })
    expect(plan.inQuietHours).toBe(true)
    expect(plan.sendNowCount).toBe(1) // alarm.ringing only
    expect(plan.deferredCount).toBe(1) // halfway deferred to morning
    expect(plan.suppressedCount).toBe(2) // 1 dedup + 1 muted
  })
})
