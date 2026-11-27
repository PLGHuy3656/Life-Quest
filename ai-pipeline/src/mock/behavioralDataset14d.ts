import type { BehavioralSnapshot14d } from '../domain/types.js'
import { getMockAlarmTriggers14d } from './alarmMinigameFixtures.js'
import { getMockWardrobeProfile } from './wardrobeCosmeticFixtures.js'

/**
 * Realistic 14-day behavioral mock dataset aligned 1:1 with Prisma schema & 5-Branches spec.
 * Triggers all 7 smart recommendation rules cleanly when live DB lacks history.
 */
export function getMockBehavioralDataset14d(
  userId = 'mock-user-01',
  now = new Date()
): BehavioralSnapshot14d {
  const daysAgoAt = (daysAgo: number, localHourVn: number): string => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const utcHour = (localHourVn - 7 + 24) % 24
    d.setUTCHours(utcHour, 15, 0, 0)
    return d.toISOString()
  }

  return {
    userId,
    timezone: 'Asia/Ho_Chi_Minh',
    allowMockFallback: true,
    activeQuests: [
      {
        questId: 'mock-quest-reading-01',
        title: 'Đọc 30 trang sách chuyên ngành buổi tối',
        goalId: 'mock-goal-01',
        milestoneId: 'mock-ms-01',
        type: 'DURATION'
      },
      {
        questId: 'mock-quest-ielts-02',
        title: 'Luyện đề IELTS Writing Task 2 hoàn chỉnh',
        goalId: 'mock-goal-01',
        milestoneId: 'mock-ms-02',
        type: 'FOCUS'
      }
    ],
    activeSchedules: [
      {
        scheduleId: 'mock-schedule-01',
        questId: 'mock-quest-reading-01',
        scheduleType: 'RECURRING',
        timeOfDay: '14:00',
        daysOfWeek: [1, 2, 3, 4, 5]
      }
    ],
    executions: [
      {
        questId: 'mock-quest-reading-01',
        questTitle: 'Đọc 30 trang sách chuyên ngành buổi tối',
        status: 'COMPLETED',
        completedAt: daysAgoAt(1, 20),
        durationSeconds: 1800
      },
      {
        questId: 'mock-quest-reading-01',
        questTitle: 'Đọc 30 trang sách chuyên ngành buổi tối',
        status: 'COMPLETED',
        completedAt: daysAgoAt(2, 20),
        durationSeconds: 1500
      },
      {
        questId: 'mock-quest-reading-01',
        questTitle: 'Đọc 30 trang sách chuyên ngành buổi tối',
        status: 'COMPLETED',
        completedAt: daysAgoAt(4, 21),
        durationSeconds: 1800
      },
      {
        questId: 'mock-quest-reading-01',
        questTitle: 'Đọc 30 trang sách chuyên ngành buổi tối',
        status: 'COMPLETED',
        completedAt: daysAgoAt(6, 20),
        durationSeconds: 2100
      },
      {
        questId: 'mock-quest-ielts-02',
        questTitle: 'Luyện đề IELTS Writing Task 2 hoàn chỉnh',
        status: 'SKIPPED',
        scheduledAt: daysAgoAt(2, 14)
      },
      {
        questId: 'mock-quest-ielts-02',
        questTitle: 'Luyện đề IELTS Writing Task 2 hoàn chỉnh',
        status: 'ABANDONED',
        scheduledAt: daysAgoAt(5, 14)
      },
      {
        questId: 'mock-quest-ielts-02',
        questTitle: 'Luyện đề IELTS Writing Task 2 hoàn chỉnh',
        status: 'SKIPPED',
        scheduledAt: daysAgoAt(8, 14)
      },
      {
        questId: 'mock-quest-ielts-02',
        questTitle: 'Luyện đề IELTS Writing Task 2 hoàn chỉnh',
        status: 'SKIPPED',
        scheduledAt: daysAgoAt(11, 14)
      }
    ],
    focusSessions: [
      { startedAt: daysAgoAt(1, 20), durationSeconds: 2700, status: 'COMPLETED' },
      { startedAt: daysAgoAt(3, 20), durationSeconds: 2400, status: 'COMPLETED' },
      { startedAt: daysAgoAt(5, 21), durationSeconds: 1800, status: 'COMPLETED' }
    ],
    streaks: [
      {
        currentCount: 7,
        longestCount: 12,
        freezeCount: 0
      }
    ],
    coinBalance: 320,
    friendChallenges: [
      {
        challengeId: 'mock-challenge-focus-7d',
        name: '7 ngày Deep Focus 45 phút mỗi tối',
        friendNames: ['Minh Anh', 'Gia Bảo'],
        alreadyJoined: false
      }
    ],
    freezeRewardItem: {
      rewardItemId: 'mock-item-streak-freeze',
      name: 'Khiên Đóng Băng Chuỗi (Streak Freeze)',
      priceCoin: 150
    },
    goalProgress: [
      {
        entityType: 'GOAL',
        entityId: 'mock-goal-01',
        title: 'Hoàn thiện đồ án LifeQuest & IELTS',
        completedCount: 2,
        totalCount: 4,
        elapsedTimeRatio: 0.45,
        nextStepTitle: 'Chốt bài luyện nghe 25 phút tối nay',
        isGroupShared: true
      }
    ],
    wardrobeProfile: getMockWardrobeProfile(),
    alarmTriggers: getMockAlarmTriggers14d()
  }
}
