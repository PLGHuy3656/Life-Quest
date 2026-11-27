import { describe, it, expect } from 'vitest'
import { analyzeBehavior14d } from '../src/engines/behaviorAnalyzer.js'
import type { BehavioralSnapshot14d } from '../src/domain/types.js'

const emptySnapshot = (allowMockFallback: boolean): BehavioralSnapshot14d => ({
  userId: 'u-1',
  timezone: 'Asia/Ho_Chi_Minh',
  allowMockFallback,
  activeQuests: [],
  activeSchedules: [],
  executions: [],
  focusSessions: [],
  streaks: [],
  coinBalance: 0,
  friendChallenges: [],
  freezeRewardItem: null
})

describe('analyzeBehavior14d', () => {
  it('produces all 7 scored MOCK recommendations when empty and allowMockFallback=true', () => {
    const recs = analyzeBehavior14d(emptySnapshot(true), new Date('2026-11-27T05:00:00.000Z'))
    expect(recs).toHaveLength(7)
    const types = recs.map((r) => r.type)
    expect(types).toContain('SCHEDULE_OPTIMIZATION')
    expect(types).toContain('QUEST_SUGGESTION')
    expect(types).toContain('CHALLENGE_MATCH')
    expect(types).toContain('REWARD_SUGGESTION')
    expect(types).toContain('PROGRESS_NUDGE')
    expect(types).toContain('COSMETIC_SUGGESTION')
    expect(types).toContain('ALARM_OPTIMIZATION')
    expect(recs.every((r) => r.dataSource === 'MOCK')).toBe(true)
    // Verify descending priorityScore sort
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].priorityScore).toBeGreaterThanOrEqual(recs[i].priorityScore)
    }
  })

  it('produces empty list when allowMockFallback=false and user has no history', () => {
    const recs = analyzeBehavior14d(emptySnapshot(false), new Date('2026-11-27T05:00:00.000Z'))
    expect(recs).toHaveLength(0)
  })

  it('produces LIVE recommendations with exact target IDs from real behavioral data', () => {
    const now = new Date('2026-11-27T05:00:00.000Z')
    const snapshot: BehavioralSnapshot14d = {
      userId: 'u-live',
      timezone: 'Asia/Ho_Chi_Minh',
      allowMockFallback: false,
      activeQuests: [
        { questId: 'q-1', title: 'Đọc tài liệu hệ thống', goalId: 'g-1', milestoneId: 'm-1', type: 'FOCUS' },
        { questId: 'q-skip', title: 'Viết báo cáo 2000 từ', goalId: 'g-1', milestoneId: 'm-2', type: 'DURATION' }
      ],
      activeSchedules: [
        { scheduleId: 'sch-1', questId: 'q-1', scheduleType: 'RECURRING', timeOfDay: '09:00', daysOfWeek: [1, 3, 5] }
      ],
      executions: [
        // 20:00 VN = 13:00 UTC
        { questId: 'q-1', questTitle: 'Đọc tài liệu hệ thống', status: 'COMPLETED', completedAt: '2026-11-26T13:15:00.000Z' },
        { questId: 'q-1', questTitle: 'Đọc tài liệu hệ thống', status: 'COMPLETED', completedAt: '2026-11-25T13:30:00.000Z' },
        { questId: 'q-1', questTitle: 'Đọc tài liệu hệ thống', status: 'COMPLETED', completedAt: '2026-11-24T14:10:00.000Z' },
        { questId: 'q-skip', questTitle: 'Viết báo cáo 2000 từ', status: 'SKIPPED' },
        { questId: 'q-skip', questTitle: 'Viết báo cáo 2000 từ', status: 'ABANDONED' },
        { questId: 'q-skip', questTitle: 'Viết báo cáo 2000 từ', status: 'SKIPPED' }
      ],
      focusSessions: [
        { startedAt: '2026-11-26T13:00:00.000Z', durationSeconds: 2400, status: 'COMPLETED' }
      ],
      streaks: [{ currentCount: 8, longestCount: 10, freezeCount: 0 }],
      coinBalance: 250,
      friendChallenges: [
        { challengeId: 'ch-99', name: 'Sprint Cuối Kỳ', friendNames: ['An'], alreadyJoined: false }
      ],
      freezeRewardItem: { rewardItemId: 'rw-freeze', name: 'Streak Freeze', priceCoin: 150 }
    }

    const recs = analyzeBehavior14d(snapshot, now)
    expect(recs).toHaveLength(4)
    expect(recs.every((r) => r.dataSource === 'LIVE')).toBe(true)

    const sched = recs.find((r) => r.type === 'SCHEDULE_OPTIMIZATION')
    expect(sched?.actionPayload.scheduleId).toBe('sch-1')
    expect(sched?.actionPayload.recommendedTimeOfDay).toBe('20:00')

    const split = recs.find((r) => r.type === 'QUEST_SUGGESTION')
    expect(split?.actionPayload.questId).toBe('q-skip')
    expect(split?.actionPayload.suggestedSubQuests).toHaveLength(3)

    const ch = recs.find((r) => r.type === 'CHALLENGE_MATCH')
    expect(ch?.actionPayload.challengeId).toBe('ch-99')

    const rw = recs.find((r) => r.type === 'REWARD_SUGGESTION')
    expect(rw?.actionPayload.targetRoute).toBe('/wardrobe/shop')
  })
})
