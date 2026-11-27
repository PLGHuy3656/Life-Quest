import type { GroupChatContextInput } from '../domain/types.js'

export interface MockGroupScenario extends Required<GroupChatContextInput> {
  conversationId: string
}

/**
 * Aligned 1:1 with Branch 1/2 GroupStreak schema AND real FE messengerFixtures.ts (`conv-group-run`).
 */
export const MOCK_GROUP_SCENARIOS: Record<string, MockGroupScenario> = {
  'conv-group-run': {
    conversationId: 'conv-group-run',
    groupTitle: 'Nhóm Chạy Bộ Sáng 6h',
    currentStreak: 9,
    streakMode: 'THRESHOLD_PERCENT',
    thresholdPercent: 75,
    totalMembers: 4,
    qualifiedCount: 2,
    freezeCount: 1,
    pendingMemberNames: ['Minh Anh', 'Bạn'],
    pendingMemberIds: ['u-minh-anh', 'u-self'],
    planTitle: 'Nhóm tích lũy 15km tuần này',
    challengeName: 'Thử thách 7 ngày dậy sớm 6h chạy 3km'
  },
  'mock-group-study-squad': {
    conversationId: 'mock-group-study-squad',
    groupTitle: 'Nhóm Cày Đồ Án CNPM',
    currentStreak: 12,
    streakMode: 'ALL_MEMBERS',
    thresholdPercent: 100,
    totalMembers: 4,
    qualifiedCount: 2,
    freezeCount: 0,
    pendingMemberNames: ['Hoàng Nam', 'Khánh Linh'],
    pendingMemberIds: ['mock-user-nam', 'mock-user-linh'],
    planTitle: 'Lộ trình 14 ngày hoàn thiện LifeQuest Sprint',
    challengeName: '7 ngày Deep Focus cùng nhóm'
  },
  'mock-group-morning-club': {
    conversationId: 'mock-group-morning-club',
    groupTitle: 'CLB Dậy Sớm 6h',
    currentStreak: 14,
    streakMode: 'THRESHOLD_PERCENT',
    thresholdPercent: 80,
    totalMembers: 5,
    qualifiedCount: 3,
    freezeCount: 1,
    pendingMemberNames: ['Minh Quân', 'Gia Bảo'],
    pendingMemberIds: ['mock-user-quan', 'u-gia-bao'],
    planTitle: 'Lộ trình 21 ngày dậy sớm không bấm Snooze',
    challengeName: 'Thử thách 14 ngày không bấm Snooze'
  }
}

export function resolveMockGroupContext(conversationId: string): MockGroupScenario {
  return (
    MOCK_GROUP_SCENARIOS[conversationId] ?? {
      ...MOCK_GROUP_SCENARIOS['conv-group-run'],
      conversationId
    }
  )
}
