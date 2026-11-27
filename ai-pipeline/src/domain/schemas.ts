import { z } from 'zod'

export const QuestTypeSchema = z.enum(['SIMPLE', 'QUANTITY', 'DURATION', 'PROGRESS', 'FOCUS'])
export const PlanLevelSchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
export const DialogueEmotionSchema = z.enum([
  'neutral',
  'happy',
  'curious',
  'encouraging',
  'playful',
  'alert',
  'panic',
  'calm'
])
export const CosmeticSlotSchema = z.enum([
  'HEAD',
  'FACE',
  'NECK',
  'BODY',
  'BACK',
  'HAND_LEFT',
  'HAND_RIGHT',
  'FEET',
  'TAIL'
])
export const AlarmMiniGameSchema = z.enum(['NONE', 'MATH', 'MEMORY_SEQUENCE', 'TYPING', 'QUICK_TAP'])
export const AlarmDifficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD'])

export const PlanGenerateInputSchema = z.object({
  prompt: z.string().trim().min(3, 'Mục tiêu cần tối thiểu 3 ký tự').max(2000),
  durationDays: z.coerce.number().int().min(1).max(365).optional(),
  timeframeDays: z.coerce.number().int().min(1).max(365).optional(),
  availableMinutesPerDay: z.coerce.number().int().min(5).max(1440).optional(),
  dailyAvailableMinutes: z.coerce.number().int().min(5).max(1440).optional(),
  level: PlanLevelSchema.optional().default('BEGINNER'),
  targetCategory: z.string().trim().max(80).optional().nullable(),
  feedback: z.string().trim().max(1000).optional().nullable(),
  timezone: z.string().trim().max(100).optional().default('Asia/Ho_Chi_Minh')
}).transform((raw) => ({
  prompt: raw.prompt,
  durationDays: raw.durationDays ?? raw.timeframeDays ?? 30,
  availableMinutesPerDay: raw.availableMinutesPerDay ?? raw.dailyAvailableMinutes ?? 60,
  level: raw.level ?? 'BEGINNER',
  targetCategory: raw.targetCategory?.trim() || undefined,
  feedback: raw.feedback?.trim() || undefined,
  timezone: raw.timezone || 'Asia/Ho_Chi_Minh'
}))

export const GeneratedPlanBodySchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  goal: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    durationDays: z.number().int().min(1).max(365)
  }),
  milestones: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().default(''),
      position: z.number().int().min(1),
      quests: z.array(
        z.object({
          title: z.string().min(1),
          description: z.string().default(''),
          priority: z.number().int().min(1).max(3).default(2),
          type: QuestTypeSchema.default('SIMPLE'),
          estimatedDurationSeconds: z.number().int().min(300).max(86400).default(1800),
          xpReward: z.number().int().min(10).max(500).default(50),
          coinReward: z.number().int().min(5).max(300).default(20),
          scheduleSuggestion: z.object({
            scheduleType: z.enum(['ONE_TIME', 'RECURRING']).default('RECURRING'),
            timeOfDay: z.string().regex(/^\d{2}:\d{2}$/).default('20:00'),
            daysOfWeek: z.array(z.number().int().min(0).max(6)).optional()
          }).optional()
        })
      ).min(1)
    })
  ).min(1)
})

const GoalProgressSnapshotSchema = z.object({
  entityType: z.enum(['GOAL', 'QUEST']).default('GOAL'),
  entityId: z.string(),
  title: z.string(),
  completedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().positive(),
  elapsedTimeRatio: z.number().min(0).max(1).optional(),
  nextStepTitle: z.string().optional(),
  isGroupShared: z.boolean().optional()
})

const WardrobeProfileSchema = z.object({
  ownedItemIds: z.array(z.string()).default([]),
  equippedSlots: z.record(CosmeticSlotSchema, z.string()).default({}),
  coinBalance: z.number().nonnegative().default(0),
  userLevel: z.number().int().min(1).default(1),
  dominantCategories: z
    .array(z.enum(['study', 'sports', 'explorer', 'coding', 'general']))
    .optional()
})

const AlarmTriggerSnapshotSchema = z.object({
  alarmId: z.string(),
  label: z.string(),
  timeOfDay: z.string(),
  miniGameType: AlarmMiniGameSchema,
  difficulty: AlarmDifficultySchema,
  status: z.enum(['DISMISSED', 'MISSED', 'SNOOZED']),
  snoozeCount: z.number().int().nonnegative().default(0),
  attempts: z.number().int().nonnegative().default(1),
  linkedQuestId: z.string().nullable().optional(),
  linkedQuestTitle: z.string().nullable().optional()
})

export const BehavioralSnapshot14dSchema = z.object({
  userId: z.string().trim().min(1).default('preview-user'),
  timezone: z.string().trim().max(100).default('Asia/Ho_Chi_Minh'),
  allowMockFallback: z.boolean().default(true),
  activeQuests: z.array(
    z.object({
      questId: z.string(),
      title: z.string(),
      goalId: z.string().nullable().optional(),
      milestoneId: z.string().nullable().optional(),
      type: QuestTypeSchema.default('SIMPLE')
    })
  ).default([]),
  activeSchedules: z.array(
    z.object({
      scheduleId: z.string(),
      questId: z.string(),
      scheduleType: z.enum(['ONE_TIME', 'RECURRING']).default('RECURRING'),
      timeOfDay: z.string().nullable().optional(),
      daysOfWeek: z.array(z.number().int().min(0).max(6)).optional()
    })
  ).default([]),
  executions: z.array(
    z.object({
      questId: z.string(),
      questTitle: z.string(),
      status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'ABANDONED']),
      completedAt: z.string().nullable().optional(),
      scheduledAt: z.string().nullable().optional(),
      durationSeconds: z.number().nonnegative().optional()
    })
  ).default([]),
  focusSessions: z.array(
    z.object({
      startedAt: z.string(),
      durationSeconds: z.number().nonnegative(),
      status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED'])
    })
  ).default([]),
  streaks: z.array(
    z.object({
      currentCount: z.number().int().nonnegative(),
      longestCount: z.number().int().nonnegative(),
      freezeCount: z.number().int().nonnegative().default(0)
    })
  ).default([]),
  coinBalance: z.number().nonnegative().default(0),
  friendChallenges: z.array(
    z.object({
      challengeId: z.string(),
      name: z.string(),
      friendNames: z.array(z.string()).default([]),
      alreadyJoined: z.boolean().default(false)
    })
  ).default([]),
  freezeRewardItem: z.object({
    rewardItemId: z.string(),
    name: z.string(),
    priceCoin: z.number().nonnegative()
  }).nullable().optional(),
  goalProgress: z.array(GoalProgressSnapshotSchema).optional(),
  wardrobeProfile: WardrobeProfileSchema.nullable().optional(),
  alarmTriggers: z.array(AlarmTriggerSnapshotSchema).optional()
})

export const ProgressNudgeRequestSchema = z.object({
  entityType: z.enum(['GOAL', 'QUEST']).default('GOAL'),
  entityId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(200),
  completedCount: z.coerce.number().int().nonnegative(),
  totalCount: z.coerce.number().int().positive(),
  elapsedTimeRatio: z.coerce.number().min(0).max(1).optional(),
  nextStepTitle: z.string().trim().max(200).optional(),
  isGroupShared: z.boolean().optional().default(false),
  userName: z.string().trim().max(80).optional()
})

export const WardrobeStylistRequestSchema = z.object({
  userId: z.string().trim().optional(),
  ownedItemIds: z.array(z.string()).optional(),
  equippedSlots: z.record(CosmeticSlotSchema, z.string()).optional(),
  coinBalance: z.coerce.number().nonnegative().optional(),
  userLevel: z.coerce.number().int().min(1).optional(),
  dominantCategories: z
    .array(z.enum(['study', 'sports', 'explorer', 'coding', 'general']))
    .optional(),
  useMockIfEmpty: z.boolean().optional().default(true)
})

export const AlarmCoachRequestSchema = z.object({
  userId: z.string().trim().optional(),
  triggers: z.array(AlarmTriggerSnapshotSchema).optional(),
  morningQuestTitle: z.string().trim().max(200).optional(),
  useMockIfEmpty: z.boolean().optional().default(true)
})

export const NotificationPlanRequestSchema = z.object({
  userId: z.string().trim().min(1).default('demo-user'),
  timezone: z.string().trim().max(100).optional().default('Asia/Ho_Chi_Minh'),
  localHour: z.coerce.number().int().min(0).max(23).optional(),
  quietHoursStart: z.coerce.number().int().min(0).max(23).optional().default(22),
  quietHoursEnd: z.coerce.number().int().min(0).max(23).optional().default(6),
  preferredGoldenHour: z.coerce.number().int().min(0).max(23).optional().default(20),
  events: z.array(
    z.object({
      id: z.string().min(1),
      type: z.string().min(1),
      title: z.string().min(1),
      body: z.string().min(1),
      priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
      channel: z.enum(['IN_APP', 'FCM_PUSH', 'GROUP_CHAT']).optional(),
      conversationMuted: z.boolean().optional().default(false),
      data: z.record(z.string(), z.string()).optional()
    })
  ).default([])
})

export const MascotDialogueRequestSchema = z.object({
  event: z.string().trim().min(1).max(80).default('ENCOURAGEMENT'),
  userName: z.string().trim().max(80).optional(),
  contextText: z.string().trim().max(500).optional(),
  emotionHint: DialogueEmotionSchema.optional(),
  completedToday: z.number().int().nonnegative().optional(),
  totalToday: z.number().int().nonnegative().optional()
})

export const MascotIntentRequestSchema = z.object({
  text: z.string().trim().min(2, 'Nhập ít nhất 2 ký tự để Fox phân tích').max(1000)
})

export const GroupChatAssistRequestSchema = z.object({
  conversationId: z.string().trim().min(1).max(120),
  mode: z.enum(['STREAK_RISK_NUDGE', 'SHARED_PLAN_SUMMARY', 'CHALLENGE_INVITE']),
  actorName: z.string().trim().max(80).optional(),
  groupContext: z.object({
    groupTitle: z.string().trim().max(120).optional(),
    currentStreak: z.number().int().nonnegative().optional(),
    streakMode: z.enum(['ALL_MEMBERS', 'THRESHOLD_PERCENT']).optional(),
    thresholdPercent: z.number().int().min(1).max(100).optional(),
    totalMembers: z.number().int().min(1).optional(),
    qualifiedCount: z.number().int().min(0).optional(),
    freezeCount: z.number().int().min(0).optional(),
    pendingMemberNames: z.array(z.string().trim().max(80)).optional(),
    pendingMemberIds: z.array(z.string().trim().max(120)).optional(),
    planTitle: z.string().trim().max(200).optional(),
    challengeName: z.string().trim().max(200).optional()
  }).optional()
})

export const FoxPersonaStyleSchema = z.enum(['WARM_COACH', 'PLAYFUL_BUDDY', 'STRICT_MENTOR'])

export const FoxAssistantChatRequestSchema = z.object({
  sessionId: z.string().trim().max(120).optional(),
  message: z.string().trim().min(1, 'Tin nhắn không được để trống').max(1000),
  personaStyle: FoxPersonaStyleSchema.optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(1000)
      })
    )
    .max(12)
    .optional()
    .default([]),
  userContext: z
    .object({
      userName: z.string().trim().max(80).optional(),
      completedToday: z.coerce.number().int().nonnegative().optional(),
      totalToday: z.coerce.number().int().nonnegative().optional(),
      coinBalance: z.coerce.number().nonnegative().optional(),
      currentStreak: z.coerce.number().int().nonnegative().optional(),
      ownedCosmeticIds: z.array(z.string()).max(40).optional(),
      pendingQuestTitles: z.array(z.string().max(120)).max(15).optional()
    })
    .optional()
})

export const AlarmMinigameGenerateRequestSchema = z.object({
  miniGameType: z.enum(['MATH', 'MEMORY_SEQUENCE', 'TYPING', 'QUICK_TAP']).optional(),
  difficulty: AlarmDifficultySchema.optional(),
  morningQuestTitle: z.string().trim().max(200).optional(),
  snoozeCount: z.coerce.number().int().nonnegative().max(10).optional().default(0)
})

export const KnowledgeSearchRequestSchema = z.object({
  query: z.string().trim().min(1, 'Từ khóa truy vấn không được để trống').max(500),
  topK: z.coerce.number().int().min(1).max(8).optional().default(3)
})

export const DailyWakeupCompleteRequestSchema = z.object({
  userId: z.string().trim().min(1).max(120).optional().default('demo-user'),
  dateKey: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'dateKey phải theo định dạng YYYY-MM-DD')
    .optional(),
  challengeId: z.string().trim().min(1).max(120).optional()
})

export const ProofVerificationRequestSchema = z.object({
  userId: z.string().trim().max(120).optional().default('demo-user'),
  questId: z.string().trim().min(1).max(120),
  questTitle: z.string().trim().min(2, 'Tiêu đề nhiệm vụ không hợp lệ').max(200),
  questDescription: z.string().trim().max(500).optional(),
  userNote: z.string().trim().max(500).optional(),
  fileName: z.string().trim().max(200).optional(),
  imageMimeType: z
    .enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    .default('image/jpeg'),
  imageBase64: z.string().trim().min(16, 'Dữ liệu ảnh xác thực không hợp lệ').max(7_000_000),
  userName: z.string().trim().max(80).optional()
})

export const DailyReflectionRequestSchema = z.object({
  userName: z.string().trim().max(80).optional(),
  personaStyle: FoxPersonaStyleSchema.optional().default('WARM_COACH'),
  mood: z.enum(['GREAT', 'GOOD', 'OKAY', 'TIRED', 'STRESSED']).optional().default('GOOD'),
  completedCount: z.coerce.number().int().nonnegative().default(2),
  totalCount: z.coerce.number().int().positive().default(4),
  verifiedProofCount: z.coerce.number().int().nonnegative().optional().default(0),
  currentStreak: z.coerce.number().int().nonnegative().optional().default(12),
  completedTitles: z.array(z.string().max(120)).max(20).optional().default([]),
  pendingTitles: z.array(z.string().max(120)).max(20).optional().default([])
})
