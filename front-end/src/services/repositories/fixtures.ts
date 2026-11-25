import type { Goal, Milestone, Quest, SocialPreviewItem, TodayData, UserMe } from '@/types/domain'

const TODAY_ISO = new Date().toISOString().slice(0, 10)

export const MOCK_USER_ME: UserMe = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'explorer@lifequest.local',
  username: 'explorer',
  status: 'ACTIVE',
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-22T00:00:00.000Z',
  profile: {
    id: '00000000-0000-4000-8000-000000000002',
    userId: '00000000-0000-4000-8000-000000000001',
    displayName: 'Bạn',
    bio: 'Giữ nhịp mỗi ngày cùng Fox đồng hành.',
    title: 'Người kiến tạo thói quen',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-22T00:00:00.000Z'
  }
}

export const MOCK_GOALS: Goal[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    userId: MOCK_USER_ME.id,
    title: 'Hoàn thành đồ án LifeQuest',
    description: 'Đồng bộ kiến trúc Frontend, Backend và Mascot Fox V2.',
    startDate: '2026-11-01T00:00:00.000Z',
    dueDate: '2026-12-20T00:00:00.000Z',
    status: 'ACTIVE',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-20T00:00:00.000Z'
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    userId: MOCK_USER_ME.id,
    title: 'Duy trì sức khỏe & thể lực buổi sáng',
    description: 'Chạy bộ nhẹ, uống đủ nước và giãn cơ 15 phút mỗi ngày.',
    startDate: '2026-11-01T00:00:00.000Z',
    dueDate: '2026-12-31T00:00:00.000Z',
    status: 'ACTIVE',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-20T00:00:00.000Z'
  }
]

export const MOCK_MILESTONES: Record<string, Milestone[]> = {
  '10000000-0000-4000-8000-000000000001': [
    {
      id: '20000000-0000-4000-8000-000000000001',
      goalId: '10000000-0000-4000-8000-000000000001',
      title: 'Khôi phục thiết kế Claude Canvas & FE-01 Foundation',
      description: null,
      position: 1,
      status: 'COMPLETED',
      completedAt: '2026-11-21T09:00:00.000Z',
      deletedAt: null,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-21T09:00:00.000Z'
    },
    {
      id: '20000000-0000-4000-8000-000000000002',
      goalId: '10000000-0000-4000-8000-000000000001',
      title: 'Kết nối API Auth, Today, Goals & Quests',
      description: null,
      position: 2,
      status: 'ACTIVE',
      completedAt: null,
      deletedAt: null,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-21T09:00:00.000Z'
    },
    {
      id: '20000000-0000-4000-8000-000000000003',
      goalId: '10000000-0000-4000-8000-000000000001',
      title: 'Tích hợp Mascot Fox V2 3D Runtime (FE-03)',
      description: null,
      position: 3,
      status: 'ACTIVE',
      completedAt: null,
      deletedAt: null,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-21T09:00:00.000Z'
    }
  ],
  '10000000-0000-4000-8000-000000000002': [
    {
      id: '20000000-0000-4000-8000-000000000004',
      goalId: '10000000-0000-4000-8000-000000000002',
      title: 'Hoàn thành 14 buổi vận động sáng',
      description: null,
      position: 1,
      status: 'COMPLETED',
      completedAt: '2026-11-18T07:30:00.000Z',
      deletedAt: null,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-18T07:30:00.000Z'
    },
    {
      id: '20000000-0000-4000-8000-000000000005',
      goalId: '10000000-0000-4000-8000-000000000002',
      title: 'Đạt mốc 5km liên tục không nghỉ',
      description: null,
      position: 2,
      status: 'ACTIVE',
      completedAt: null,
      deletedAt: null,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-18T07:30:00.000Z'
    }
  ]
}

export const MOCK_QUESTS: Quest[] = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    userId: MOCK_USER_ME.id,
    goalId: MOCK_GOALS[0].id,
    milestoneId: '20000000-0000-4000-8000-000000000002',
    title: 'Rà soát hợp đồng API Today & Quests',
    description: 'Đối chiếu schema Prisma và response envelope từ Backend.',
    type: 'FOCUS',
    priority: 1,
    proofRequirement: 'NONE',
    targetValue: null,
    targetUnit: null,
    estimatedDurationSeconds: 1800,
    xpReward: 40,
    coinReward: 15,
    startAt: `${TODAY_ISO}T08:30:00.000Z`,
    dueAt: `${TODAY_ISO}T11:30:00.000Z`,
    completedAt: null,
    archivedAt: null,
    status: 'ACTIVE',
    createdAt: '2026-11-20T00:00:00.000Z',
    updatedAt: '2026-11-22T00:00:00.000Z',
    deletedAt: null,
    isPinned: true
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    userId: MOCK_USER_ME.id,
    goalId: MOCK_GOALS[1].id,
    milestoneId: '20000000-0000-4000-8000-000000000005',
    title: 'Chạy bộ nhẹ buổi sáng 20 phút',
    description: 'Giữ nhịp thở đều và khởi động kỹ trước khi chạy.',
    type: 'DURATION',
    priority: 2,
    proofRequirement: 'OPTIONAL',
    targetValue: 20,
    targetUnit: 'phút',
    estimatedDurationSeconds: 1200,
    xpReward: 30,
    coinReward: 10,
    startAt: `${TODAY_ISO}T06:30:00.000Z`,
    dueAt: `${TODAY_ISO}T08:00:00.000Z`,
    completedAt: null,
    archivedAt: null,
    status: 'ACTIVE',
    createdAt: '2026-11-20T00:00:00.000Z',
    updatedAt: '2026-11-22T00:00:00.000Z',
    deletedAt: null,
    isPinned: true
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    userId: MOCK_USER_ME.id,
    goalId: MOCK_GOALS[1].id,
    milestoneId: null,
    title: 'Uống đủ 2 lít nước trong ngày',
    description: 'Chia đều 4 mốc sáng, trưa, chiều, tối.',
    type: 'QUANTITY',
    priority: 3,
    proofRequirement: 'NONE',
    targetValue: 2000,
    targetUnit: 'ml',
    estimatedDurationSeconds: null,
    xpReward: 20,
    coinReward: 8,
    startAt: null,
    dueAt: `${TODAY_ISO}T21:00:00.000Z`,
    completedAt: null,
    archivedAt: null,
    status: 'ACTIVE',
    createdAt: '2026-11-20T00:00:00.000Z',
    updatedAt: '2026-11-22T00:00:00.000Z',
    deletedAt: null,
    isPinned: true
  },
  {
    id: '30000000-0000-4000-8000-000000000004',
    userId: MOCK_USER_ME.id,
    goalId: MOCK_GOALS[0].id,
    milestoneId: '20000000-0000-4000-8000-000000000003',
    title: 'Đọc 15 trang tài liệu kiến trúc React Query',
    description: null,
    type: 'SIMPLE',
    priority: 2,
    proofRequirement: 'NONE',
    targetValue: null,
    targetUnit: null,
    estimatedDurationSeconds: 1500,
    xpReward: 25,
    coinReward: 10,
    startAt: null,
    dueAt: `${TODAY_ISO}T20:00:00.000Z`,
    completedAt: null,
    archivedAt: null,
    status: 'ACTIVE',
    createdAt: '2026-11-20T00:00:00.000Z',
    updatedAt: '2026-11-22T00:00:00.000Z',
    deletedAt: null,
    isPinned: false
  }
]

export const MOCK_TODAY_DATA: TodayData = {
  date: TODAY_ISO,
  timezone: 'Asia/Ho_Chi_Minh',
  summary: {
    totalTasks: 4,
    completedTasks: 2,
    completionRatePercentage: 50,
    totalFocusDurationSeconds: 2700
  },
  executions: [],
  schedules: [
    {
      id: '40000000-0000-4000-8000-000000000001',
      questId: MOCK_QUESTS[0].id,
      scheduleType: 'RECURRING',
      timeOfDay: '08:30',
      quest: {
        id: MOCK_QUESTS[0].id,
        title: MOCK_QUESTS[0].title,
        type: MOCK_QUESTS[0].type,
        priority: MOCK_QUESTS[0].priority,
        xpReward: MOCK_QUESTS[0].xpReward,
        coinReward: MOCK_QUESTS[0].coinReward,
        isPinned: true
      }
    },
    {
      id: '40000000-0000-4000-8000-000000000002',
      questId: MOCK_QUESTS[1].id,
      scheduleType: 'RECURRING',
      timeOfDay: '06:30',
      quest: {
        id: MOCK_QUESTS[1].id,
        title: MOCK_QUESTS[1].title,
        type: MOCK_QUESTS[1].type,
        priority: MOCK_QUESTS[1].priority,
        xpReward: MOCK_QUESTS[1].xpReward,
        coinReward: MOCK_QUESTS[1].coinReward,
        isPinned: true
      }
    }
  ],
  streak: {
    currentCount: 0,
    longestCount: 0,
    isQualifiedToday: false,
    lastQualifiedDate: null
  },
  gamification: {
    totalXp: 1240,
    level: 5,
    coinBalance: 320
  }
}

export const MOCK_SOCIAL_PREVIEW: SocialPreviewItem[] = [
  {
    id: 'social-preview-1',
    authorName: 'Minh Anh',
    authorTag: '@minhanh',
    caption: 'Hoàn thành 25 phút tập trung đầu ngày — giữ chuỗi 6 ngày liên tiếp.',
    questBadge: 'Focus 25p',
    timeLabel: '24 phút trước',
    cheerCount: 8,
    illustrationKey: 'study-corner',
    illustrationAlt: 'Minh họa góc học tập buổi sáng cùng sổ tay và bộ đếm tập trung 25 phút',
    category: 'focus'
  },
  {
    id: 'social-preview-2',
    authorName: 'Đức Khá',
    authorTag: '@duckha',
    caption: 'Vừa chốt xong mốc API Auth & Today trên nhánh develop!',
    questBadge: 'Milestone ✓',
    timeLabel: '1 giờ trước',
    cheerCount: 12,
    illustrationKey: 'milestone-moment',
    illustrationAlt: 'Minh họa hành trình hoàn thành cột mốc trên đỉnh đồi sáng sớm',
    category: 'milestone'
  }
]
