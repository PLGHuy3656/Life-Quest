export type QuestType = 'SIMPLE' | 'QUANTITY' | 'DURATION' | 'PROGRESS' | 'FOCUS'
export type PlanLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type DataSource = 'LIVE' | 'MOCK'
export type DialogueEmotion =
  | 'neutral'
  | 'happy'
  | 'curious'
  | 'encouraging'
  | 'playful'
  | 'alert'
  | 'panic'
  | 'calm'

export interface TokenUsage {
  promptTokens: number
  candidatesTokens: number
  totalTokens: number
}

export interface ScheduleSuggestion {
  scheduleType: 'ONE_TIME' | 'RECURRING'
  timeOfDay: string // HH:mm
  daysOfWeek?: number[] // 0=Sun..6=Sat
}

export interface GeneratedQuest {
  title: string
  description: string
  priority: number // 1..3
  type: QuestType
  estimatedDurationSeconds: number
  xpReward: number
  coinReward: number
  scheduleSuggestion?: ScheduleSuggestion
}

export interface GeneratedMilestone {
  title: string
  description: string
  position: number
  quests: GeneratedQuest[]
}

export interface GeneratedPlan {
  title: string
  category: string
  timeframeDays: number
  dailyAvailableMinutes: number
  level: PlanLevel
  feedbackNote?: string
  goal: {
    title: string
    description: string
    durationDays: number
  }
  milestones: GeneratedMilestone[]
  generationMeta: {
    provider: 'gemini' | 'deterministic-fallback'
    model: string
    fallbackUsed: boolean
    tokenUsage?: TokenUsage
  }
}

export interface PlanGenerateInput {
  prompt: string
  durationDays: number
  availableMinutesPerDay: number
  level: PlanLevel
  targetCategory?: string
  feedback?: string
  timezone: string
}

export type RecommendationType =
  | 'SCHEDULE_OPTIMIZATION'
  | 'QUEST_SUGGESTION'
  | 'CHALLENGE_MATCH'
  | 'REWARD_SUGGESTION'
  | 'PROGRESS_NUDGE'
  | 'COSMETIC_SUGGESTION'
  | 'ALARM_OPTIMIZATION'

export interface ActiveQuestSnapshot {
  questId: string
  title: string
  goalId?: string | null
  milestoneId?: string | null
  type: QuestType
}

export interface ActiveScheduleSnapshot {
  scheduleId: string
  questId: string
  scheduleType: 'ONE_TIME' | 'RECURRING'
  timeOfDay?: string | null
  daysOfWeek?: number[]
}

export interface ExecutionSnapshot {
  questId: string
  questTitle: string
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'ABANDONED'
  completedAt?: string | null
  scheduledAt?: string | null
  durationSeconds?: number
}

export interface FocusSessionSnapshot {
  startedAt: string
  durationSeconds: number
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED'
}

export interface StreakSnapshot {
  currentCount: number
  longestCount: number
  freezeCount: number
}

export interface FriendChallengeSnapshot {
  challengeId: string
  name: string
  friendNames: string[]
  alreadyJoined: boolean
}

export interface FreezeRewardItemSnapshot {
  rewardItemId: string
  name: string
  priceCoin: number
}

export interface GoalProgressSnapshot {
  entityType: 'GOAL' | 'QUEST'
  entityId: string
  title: string
  completedCount: number
  totalCount: number
  elapsedTimeRatio?: number // 0..1
  nextStepTitle?: string
  isGroupShared?: boolean
}

export type CosmeticSlot = 'HEAD' | 'FACE' | 'NECK' | 'BODY' | 'BACK' | 'HAND_LEFT' | 'HAND_RIGHT' | 'FEET' | 'TAIL'
export type OutfitThemeId = 'outfit_student' | 'outfit_sports' | 'outfit_explorer' | 'outfit_mage' | 'outfit_ninja' | 'outfit_tet'

export interface WardrobeProfileSnapshot {
  ownedItemIds: string[]
  equippedSlots: Partial<Record<CosmeticSlot, string>>
  coinBalance: number
  userLevel: number
  dominantCategories?: Array<'study' | 'sports' | 'explorer' | 'coding' | 'general'>
}

export type AlarmMiniGameType = 'NONE' | 'MATH' | 'MEMORY_SEQUENCE' | 'TYPING' | 'QUICK_TAP'
export type AlarmDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface AlarmTriggerSnapshot {
  alarmId: string
  label: string
  timeOfDay: string
  miniGameType: AlarmMiniGameType
  difficulty: AlarmDifficulty
  status: 'DISMISSED' | 'MISSED' | 'SNOOZED'
  snoozeCount: number
  attempts: number
  linkedQuestId?: string | null
  linkedQuestTitle?: string | null
}

export interface BehavioralSnapshot14d {
  userId: string
  timezone: string
  allowMockFallback: boolean
  activeQuests: ActiveQuestSnapshot[]
  activeSchedules: ActiveScheduleSnapshot[]
  executions: ExecutionSnapshot[]
  focusSessions: FocusSessionSnapshot[]
  streaks: StreakSnapshot[]
  coinBalance: number
  friendChallenges: FriendChallengeSnapshot[]
  freezeRewardItem?: FreezeRewardItemSnapshot | null
  goalProgress?: GoalProgressSnapshot[]
  wardrobeProfile?: WardrobeProfileSnapshot | null
  alarmTriggers?: AlarmTriggerSnapshot[]
}

export interface RecommendationActionPayload {
  kind:
    | 'RESCHEDULE_QUEST'
    | 'SPLIT_QUEST'
    | 'JOIN_CHALLENGE'
    | 'BUY_STREAK_FREEZE'
    | 'OPEN_NEXT_STEP'
    | 'PREVIEW_OR_BUY_COSMETIC'
    | 'UPDATE_ALARM_MINIGAME'
  questId?: string
  questTitle?: string
  goalId?: string | null
  milestoneId?: string | null
  scheduleId?: string
  currentTimeOfDay?: string | null
  recommendedTimeOfDay?: string
  suggestedSubQuests?: Array<{
    title: string
    estimatedDurationSeconds: number
    type: QuestType
  }>
  challengeId?: string
  challengeName?: string
  friendNames?: string[]
  rewardItemId?: string
  priceCoin?: number
  currentStreak?: number
  coinBalance?: number
  targetRoute?: string
  // Progress Nudge fields
  entityId?: string
  progressPercent?: number
  milestoneStage?: 'HALFWAY_50' | 'SPRINT_80' | 'COMPLETED_100' | 'BEHIND_PACE'
  nextStepTitle?: string
  // Cosmetic Stylist fields
  itemId?: string
  itemNameVi?: string
  slot?: CosmeticSlot
  outfitThemeId?: OutfitThemeId
  coinGap?: number
  completesOutfitSet?: boolean
  // Alarm Coach fields
  alarmId?: string
  recommendedMiniGame?: AlarmMiniGameType
  recommendedDifficulty?: AlarmDifficulty
  suggestedAffirmation?: string
}

export interface RecommendationCandidate {
  type: RecommendationType
  source: string
  title: string
  reason: string
  priorityScore: number
  expiresAt: string
  dataSource: DataSource
  actionPayload: RecommendationActionPayload
}

export interface ProgressNudgeRequest {
  entityType: 'GOAL' | 'QUEST'
  entityId: string
  title: string
  completedCount: number
  totalCount: number
  elapsedTimeRatio?: number
  nextStepTitle?: string
  isGroupShared?: boolean
  userName?: string
}

export interface ProgressNudgeResponse {
  triggered: boolean
  stage: 'HALFWAY_50' | 'SPRINT_80' | 'COMPLETED_100' | 'BEHIND_PACE' | 'ON_TRACK'
  progressPercent: number
  foxMessage: string
  emotion: DialogueEmotion
  nextActionLabel: string
  pushPayload: {
    type: string
    title: string
    body: string
    priority: 'LOW' | 'NORMAL' | 'HIGH'
    data: Record<string, string>
  }
  suggestGroupShare: boolean
}

export interface WardrobeStylistRequest {
  userId?: string
  ownedItemIds?: string[]
  equippedSlots?: Partial<Record<CosmeticSlot, string>>
  coinBalance?: number
  userLevel?: number
  dominantCategories?: Array<'study' | 'sports' | 'explorer' | 'coding' | 'general'>
  useMockIfEmpty?: boolean
}

export interface CosmeticSuggestionItem {
  itemId: string
  displayNameVi: string
  slot: CosmeticSlot
  outfitThemeId: OutfitThemeId
  outfitThemeVi: string
  priceCoin: number
  coinGap: number
  canAffordNow: boolean
  completesOutfitSet: boolean
  score: number
  reason: string
  targetRoute: string
}

export interface WardrobeStylistResponse {
  dominantTheme: OutfitThemeId
  coinBalance: number
  dataSource: DataSource
  foxSummary: string
  suggestions: CosmeticSuggestionItem[]
}

export interface AlarmCoachRequest {
  userId?: string
  triggers?: AlarmTriggerSnapshot[]
  morningQuestTitle?: string
  useMockIfEmpty?: boolean
}

export interface AlarmCoachResponse {
  dataSource: DataSource
  alarmId: string
  timeOfDay: string
  onTimeRatePercent: number
  avgSnoozeCount: number
  missedCount: number
  currentMiniGame: AlarmMiniGameType
  currentDifficulty: AlarmDifficulty
  recommendedMiniGame: AlarmMiniGameType
  recommendedDifficulty: AlarmDifficulty
  recommendedMaxSnooze: number
  suggestedAffirmation: string
  reason: string
  foxAdvice: string
}

export interface NotificationInputEvent {
  id: string
  type: string
  title: string
  body: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  channel?: 'IN_APP' | 'FCM_PUSH' | 'GROUP_CHAT'
  conversationMuted?: boolean
  data?: Record<string, string>
}

export interface NotificationPlanRequest {
  userId: string
  timezone?: string
  localHour?: number // 0..23 override for deterministic testing
  quietHoursStart?: number // default 22
  quietHoursEnd?: number // default 6
  preferredGoldenHour?: number // default 20
  events: NotificationInputEvent[]
}

export interface PlannedNotificationItem {
  id: string
  type: string
  decision: 'SEND_NOW' | 'DEFER_UNTIL_MORNING' | 'SUPPRESS_MUTED' | 'DEDUP_DROPPED'
  scheduledLabel: string
  reason: string
  fcmPayload?: {
    notification: { title: string; body: string }
    data: Record<string, string>
  }
}

export interface NotificationPlanResponse {
  userId: string
  inQuietHours: boolean
  sendNowCount: number
  deferredCount: number
  suppressedCount: number
  items: PlannedNotificationItem[]
}

export interface MascotDialogueRequest {
  event: string
  userName?: string
  contextText?: string
  emotionHint?: DialogueEmotion
  completedToday?: number
  totalToday?: number
}

export interface MascotDialogueResponse {
  text: string
  emotion: DialogueEmotion
  source: 'AI_PIPELINE'
  toneMode: 'deterministic' | 'gemini'
}

export interface MascotIntentResponse {
  rawText: string
  suggestedEntity: 'AI_PLAN' | 'TASK' | 'GOAL'
  prompt: string
  durationDays: number
  availableMinutesPerDay: number
  level: PlanLevel
  targetCategory: string
  confidence: number
  foxReply: string
}

export type GroupAssistMode =
  | 'STREAK_RISK_NUDGE'
  | 'SHARED_PLAN_SUMMARY'
  | 'CHALLENGE_INVITE'

export interface GroupChatContextInput {
  groupTitle?: string
  currentStreak?: number
  streakMode?: 'ALL_MEMBERS' | 'THRESHOLD_PERCENT'
  thresholdPercent?: number
  totalMembers?: number
  qualifiedCount?: number
  freezeCount?: number
  pendingMemberNames?: string[]
  pendingMemberIds?: string[]
  planTitle?: string
  challengeName?: string
}

export interface GroupChatAssistRequest {
  conversationId: string
  mode: GroupAssistMode
  actorName?: string
  groupContext?: GroupChatContextInput
}

export interface GroupChatAssistResponse {
  conversationId: string
  mode: GroupAssistMode
  messageKind: 'STREAK_NOTICE' | 'QUEST_INVITE' | 'TEXT'
  content: string
  metadata: Record<string, unknown>
  targetPendingUserIds: string[]
  membersNeededToSaveStreak: number
  currentCompletionPercent: number
  dataSource: DataSource
}

export interface FoxChatHistoryTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface FoxChatUserContext {
  userName?: string
  completedToday?: number
  totalToday?: number
  coinBalance?: number
  currentStreak?: number
  ownedCosmeticIds?: string[]
  pendingQuestTitles?: string[]
}

export interface FoxSuggestedAction {
  id: string
  label: string
  actionType:
    | 'OPEN_ROADMAP_STUDIO'
    | 'OPEN_WARDROBE_STYLIST'
    | 'LAUNCH_ALARM_MINIGAME'
    | 'OPEN_NOTIFICATION_CENTER'
    | 'OPEN_WORK_HUB'
  payload?: Record<string, unknown>
}

export type FoxPersonaStyle = 'WARM_COACH' | 'PLAYFUL_BUDDY' | 'STRICT_MENTOR'

export interface FoxAssistantChatRequest {
  sessionId?: string
  message: string
  personaStyle?: FoxPersonaStyle
  history?: FoxChatHistoryTurn[]
  userContext?: FoxChatUserContext
}

export interface FoxAssistantChatResponse {
  agent: 'fox-assistant'
  reply: string
  emotion: DialogueEmotion
  scope: 'IN_DOMAIN' | 'OUT_OF_DOMAIN'
  intent:
    | 'GREETING'
    | 'APP_HELP'
    | 'USER_PROGRESS'
    | 'ROADMAP_REQUEST'
    | 'WARDROBE_ADVICE'
    | 'ALARM_MINIGAME'
    | 'GROUP_STREAK'
    | 'MOTIVATION'
    | 'KNOWLEDGE_QA'
    | 'OUT_OF_SCOPE'
  provider: 'gemini' | 'lifequest-knowledge-engine'
  matchedKnowledgeTopics?: string[]
  suggestedActions: FoxSuggestedAction[]
}

export interface DailyWakeupAlarmStatus {
  agent: 'alarm-coach'
  dateKey: string
  alarmTime: string // default 06:00
  questTitle: string
  completedToday: boolean
  completedAt: string | null
  lastPlayedMiniGameType: Exclude<AlarmMiniGameType, 'NONE'> | null
  todayChallenge: AlarmMinigameChallenge
}

export interface AlarmMinigameGenerateRequest {
  miniGameType?: Exclude<AlarmMiniGameType, 'NONE'>
  difficulty?: AlarmDifficulty
  morningQuestTitle?: string
  snoozeCount?: number
}

export interface AlarmMinigameChallenge {
  agent: 'alarm-coach'
  challengeId: string
  miniGameType: Exclude<AlarmMiniGameType, 'NONE'>
  difficulty: AlarmDifficulty
  title: string
  instruction: string
  affirmation: string
  foxPrompt: string
  rewardXp: number
  rewardCoin: number
  mathProblems?: Array<{ expression: string; answer: number }>
  memorySequence?: string[]
  memoryPalette?: Array<{ id: string; label: string; emoji: string }>
  typingTarget?: string
  quickTapTargetCount?: number
  quickTapTimeLimitSeconds?: number
}

export interface AiAgentCatalogEntry {
  id: string
  name: string
  role: string
  endpoints: string[]
  capabilities: string[]
  mode: 'hybrid-gemini-and-rules' | 'deterministic-rules'
}

export interface ServiceCapabilityEntry {
  id: string
  name: string
  description: string
  endpoints: string[]
  features: string[]
  executionMode: 'hybrid-multimodal-llm' | 'hybrid-llm-and-rag' | 'deterministic-engine'
}

export type ProofVerdict = 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED'

export interface ProofQualityRubric {
  relevanceScore: number // 0..100
  authenticityScore: number // 0..100
  effortScore: number // 0..100
  clarityScore: number // 0..100
  overallScore: number // 0..100
}

export interface ProofVerificationRequest {
  userId?: string
  questId: string
  questTitle: string
  questDescription?: string
  userNote?: string
  fileName?: string
  imageMimeType: string
  imageBase64: string
  userName?: string
}

export interface ProofVerificationResponse {
  questId: string
  verified: boolean
  verdict: ProofVerdict
  qualityBadge: 'EXCELLENT' | 'VERIFIED' | 'NEEDS_RETRY' | 'REJECTED'
  confidenceScore: number // 0..1
  bonusXp: number
  duplicateDetected: boolean
  imageSha256: string
  qualityRubric: ProofQualityRubric
  detectedObjects: string[]
  reason: string
  foxReaction: string
  suggestedCaption: string
  recommendedShareTargets: Array<'PRIVATE_JOURNAL' | 'GROUP_CHAT' | 'SOCIAL_FEED'>
  provider: 'gemini-vision' | 'semantic-fallback'
}

export interface DailyReflectionRequest {
  userName?: string
  personaStyle?: FoxPersonaStyle
  mood?: 'GREAT' | 'GOOD' | 'OKAY' | 'TIRED' | 'STRESSED'
  completedCount: number
  totalCount: number
  verifiedProofCount?: number
  currentStreak?: number
  completedTitles?: string[]
  pendingTitles?: string[]
}

export interface DailyReflectionResponse {
  headline: string
  summary: string
  highlightOfDay: string
  tomorrowTip: string
  foxSignOff: string
  completionPercent: number
  personaStyle: FoxPersonaStyle
  provider: 'gemini' | 'reflection-engine'
}

export interface QualityBenchmarkSuiteReport {
  generatedAt: string
  overallScorePercent: number
  passed: boolean
  metrics: {
    chatDomainAccuracyPercent: number
    proofVerificationAccuracyPercent: number
    roadmapSchemaValidityPercent: number
    averageLatencyMs: number
  }
  details: Array<{
    suite: string
    passedCases: number
    totalCases: number
    scorePercent: number
    avgLatencyMs: number
  }>
}
