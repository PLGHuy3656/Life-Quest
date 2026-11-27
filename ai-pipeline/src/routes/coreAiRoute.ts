import { Router, type RequestHandler } from 'express'
import type { AiPipelineEnv } from '../config/env.js'
import {
  AlarmCoachRequestSchema,
  AlarmMinigameGenerateRequestSchema,
  BehavioralSnapshot14dSchema,
  DailyReflectionRequestSchema,
  DailyWakeupCompleteRequestSchema,
  FoxAssistantChatRequestSchema,
  GroupChatAssistRequestSchema,
  KnowledgeSearchRequestSchema,
  NotificationPlanRequestSchema,
  PlanGenerateInputSchema,
  ProgressNudgeRequestSchema,
  ProofVerificationRequestSchema,
  WardrobeStylistRequestSchema
} from '../domain/schemas.js'
import type { ServiceCapabilityEntry } from '../domain/types.js'
import { analyzeAlarmDiscipline } from '../engines/alarmCoachEngine.js'
import {
  completeDailyWakeup,
  generateAlarmMinigameChallenge,
  getDailyWakeupStatus
} from '../engines/alarmMinigameGenerator.js'
import { analyzeBehavior14d } from '../engines/behaviorAnalyzer.js'
import { generateDailyReflection } from '../engines/dailyReflectionService.js'
import {
  clearAssistantSessionHistory,
  getAssistantSessionHistory,
  runFoxAssistantChat
} from '../engines/foxAssistantAgent.js'
import { polishRecommendationsWithFoxTone } from '../engines/foxTonePolisher.js'
import { buildGroupChatAssist } from '../engines/groupChatAssistEngine.js'
import { buildNotificationDispatchPlan } from '../engines/notificationPlannerEngine.js'
import { generateAiPlan } from '../engines/planGenerator.js'
import { evaluateProgressNudge } from '../engines/progressCoachEngine.js'
import { verifyTaskCompletionProof } from '../engines/proofVerificationService.js'
import { recommendWardrobeCosmetics } from '../engines/wardrobeStylistEngine.js'
import { runQualityBenchmarkSuite } from '../evaluation/qualityBenchmark.js'
import {
  LIFEQUEST_KNOWLEDGE_BASE,
  searchLifeQuestKnowledge
} from '../knowledge/lifequestKnowledgeBase.js'

export const LIFEQUEST_AI_CAPABILITIES: ServiceCapabilityEntry[] = [
  {
    id: 'companion-assistant',
    name: 'Fox Companion Conversation Service',
    description:
      'Generalized LifeQuest Q&A (RAG) combined with natural everyday small-talk, humor, emotional support, and domain boundaries.',
    endpoints: [
      'POST /v1/assistant/chat',
      'GET /v1/knowledge/documents',
      'POST /v1/knowledge/search'
    ],
    features: [
      'Dynamic LifeQuest Knowledge Retrieval',
      'Everyday humor & emotional companionship',
      'Principle-based domain boundary enforcement'
    ],
    executionMode: 'hybrid-llm-and-rag'
  },
  {
    id: 'proof-verification',
    name: 'Task Completion Proof Verification Service',
    description:
      'Multimodal image verification validating whether uploaded proof photos match the completed quest before journaling or sharing.',
    endpoints: ['POST /v1/proofs/verify'],
    features: [
      'Multimodal Vision semantic relevance scoring',
      'APPROVED / NEEDS_REVIEW / REJECTED verdicts',
      'Auto-generated social/group caption and Fox reaction'
    ],
    executionMode: 'hybrid-multimodal-llm'
  },
  {
    id: 'roadmap-planner',
    name: 'Goal Roadmap Planning Service',
    description: 'Transforms natural-language user goals into structured milestones, daily quests, and schedules.',
    endpoints: ['POST /v1/roadmaps/generate', 'POST /v1/roadmaps/refine'],
    features: ['Goal -> Milestones -> Quests decomposition', 'Feedback-driven roadmap refinement'],
    executionMode: 'hybrid-llm-and-rag'
  },
  {
    id: 'behavioral-recommendations',
    name: 'Behavioral Analytics & Recommendation Service',
    description: '14-day behavioral analysis generating prioritized schedule, quest, challenge, and streak advice.',
    endpoints: ['POST /v1/recommendations/analyze'],
    features: ['7-rule behavioral analytics', 'Fox tone polishing'],
    executionMode: 'hybrid-llm-and-rag'
  },
  {
    id: 'wardrobe-stylist',
    name: 'Fox Wardrobe Styling Service',
    description: 'Recommends affordable cosmetics prioritizing incomplete outfit sets (2/3 -> 3/3).',
    endpoints: ['POST /v1/wardrobe/recommendations'],
    features: ['Outfit completion scoring', 'Coin budget & behavior theme matching'],
    executionMode: 'deterministic-engine'
  },
  {
    id: 'progress-coaching',
    name: 'Milestone Progress Coaching Service',
    description: 'Detects 50%, 80%, 100%, and behind-pace milestones and emits proactive encouragement nudges.',
    endpoints: ['POST /v1/progress/evaluate'],
    features: ['Halfway 50% & Sprint 80% nudges', 'Push notification payload builder'],
    executionMode: 'deterministic-engine'
  },
  {
    id: 'daily-wakeup-alarms',
    name: 'Daily 06:00 Wake-up Alarm Service',
    description: 'Manages once-per-day 06:00 wake-up missions with non-repeating daily mini-games and snooze analytics.',
    endpoints: [
      'GET /v1/alarms/daily-wakeup',
      'POST /v1/alarms/daily-wakeup/complete',
      'POST /v1/alarms/analyze',
      'POST /v1/alarms/minigames/generate'
    ],
    features: ['Once-per-day lock after completion', 'Non-repeating daily rotation across 4 mini-games'],
    executionMode: 'deterministic-engine'
  },
  {
    id: 'notification-scheduler',
    name: 'Smart Notification Scheduling Service',
    description: 'Enforces Quiet Hours (22:00-06:00), emergency alarm bypasses, muted room suppression, and deduplication.',
    endpoints: ['POST /v1/notifications/schedule'],
    features: ['Quiet hours deferral', 'Emergency alarm.ringing override'],
    executionMode: 'deterministic-engine'
  },
  {
    id: 'group-streak-assist',
    name: 'Group Streak Accountability Service',
    description: 'Computes exact remaining members needed to protect group streaks and drafts group chat notices.',
    endpoints: ['POST /v1/groups/streak-assist'],
    features: ['ALL_MEMBERS & THRESHOLD_PERCENT calculation', 'Ready-to-send group chat payload'],
    executionMode: 'deterministic-engine'
  },
  {
    id: 'daily-reflection',
    name: 'Daily Reflection & Mood Recap Service',
    description: 'Generates empathetic end-of-day story cards adapting to user mood and Fox persona style.',
    endpoints: ['POST /v1/reflections/daily-summary'],
    features: ['Persona-adaptive storytelling', 'Highlight & gentle next-day recommendation'],
    executionMode: 'hybrid-llm-and-rag'
  },
  {
    id: 'quality-benchmark',
    name: 'AI Quality Evaluation & Benchmark Service',
    description: 'Automated benchmark suite verifying chat boundaries, proof rubric accuracy, duplicate detection, and roadmap validity.',
    endpoints: ['GET /v1/quality/benchmark'],
    features: ['Domain precision/recall checks', 'Rubric & SHA-256 anti-cheat checks', 'Latency telemetry'],
    executionMode: 'deterministic-engine'
  }
]

export function createCoreAiRoute(env: AiPipelineEnv, requireServiceKey?: RequestHandler): Router {
  const router = Router()

  router.get('/capabilities', (_req, res) => {
    res.json({
      success: true,
      data: {
        version: 'v1',
        totalCapabilities: LIFEQUEST_AI_CAPABILITIES.length,
        capabilities: LIFEQUEST_AI_CAPABILITIES
      }
    })
  })

  // 1. Companion Conversation & Knowledge Base
  router.get('/knowledge/documents', (_req, res) => {
    res.json({
      success: true,
      data: {
        domain: 'LifeQuest',
        totalDocuments: LIFEQUEST_KNOWLEDGE_BASE.length,
        documents: LIFEQUEST_KNOWLEDGE_BASE
      }
    })
  })

  router.post('/knowledge/search', (req, res) => {
    const parsed = KnowledgeSearchRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid query' }
      })
      return
    }
    const results = searchLifeQuestKnowledge(parsed.data.query, parsed.data.topK)
    res.json({
      success: true,
      data: { query: parsed.data.query, totalMatches: results.length, results }
    })
  })

  router.post('/assistant/chat', async (req, res) => {
    const parsed = FoxAssistantChatRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid chat payload' }
      })
      return
    }
    const result = await runFoxAssistantChat(parsed.data, { env })
    res.json({ success: true, data: result })
  })

  router.get('/assistant/sessions/:sessionId', (req, res) => {
    const history = getAssistantSessionHistory(req.params.sessionId)
    res.json({
      success: true,
      data: {
        sessionId: req.params.sessionId,
        totalMessages: history.length,
        messages: history
      }
    })
  })

  router.delete('/assistant/sessions/:sessionId', (req, res) => {
    clearAssistantSessionHistory(req.params.sessionId)
    res.json({ success: true, data: { sessionId: req.params.sessionId, cleared: true } })
  })

  // 2. Multimodal Proof Verification
  router.post('/proofs/verify', async (req, res) => {
    const parsed = ProofVerificationRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid proof payload' }
      })
      return
    }
    const result = await verifyTaskCompletionProof(parsed.data, { env })
    res.json({ success: true, data: result })
  })

  // 3. Goal Roadmaps
  router.post('/roadmaps/generate', async (req, res) => {
    const parsed = PlanGenerateInputSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid roadmap payload' }
      })
      return
    }
    const plan = await generateAiPlan(parsed.data, { env })
    res.json({ success: true, data: plan })
  })

  router.post('/roadmaps/refine', async (req, res) => {
    const parsed = PlanGenerateInputSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid refine payload' }
      })
      return
    }
    const plan = await generateAiPlan(
      {
        ...parsed.data,
        feedback: parsed.data.feedback || 'Tinh chỉnh lại lộ trình cho phù hợp hơn'
      },
      { env }
    )
    res.json({ success: true, data: plan })
  })

  // 4. Behavioral Recommendations & Wardrobe Styling
  router.post('/recommendations/analyze', async (req, res) => {
    const parsed = BehavioralSnapshot14dSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid snapshot' }
      })
      return
    }
    const raw = analyzeBehavior14d(parsed.data)
    const polished = await polishRecommendationsWithFoxTone(raw, { env })
    res.json({ success: true, data: { recommendations: polished } })
  })

  router.post('/wardrobe/recommendations', (req, res) => {
    const parsed = WardrobeStylistRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid wardrobe payload' }
      })
      return
    }
    res.json({ success: true, data: recommendWardrobeCosmetics(parsed.data) })
  })

  // 5. Progress Evaluation
  router.post('/progress/evaluate', (req, res) => {
    const parsed = ProgressNudgeRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid progress payload' }
      })
      return
    }
    res.json({ success: true, data: evaluateProgressNudge(parsed.data) })
  })

  // 6. Daily 07:00 Wake-up Alarms
  router.get('/alarms/daily-wakeup', (req, res) => {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : 'demo-user'
    const dateKey = typeof req.query.dateKey === 'string' ? req.query.dateKey : undefined
    const alarmTime = typeof req.query.alarmTime === 'string' ? req.query.alarmTime : '07:00'
    res.json({ success: true, data: getDailyWakeupStatus({ userId, dateKey, alarmTime }) })
  })

  router.post('/alarms/daily-wakeup/complete', (req, res) => {
    const parsed = DailyWakeupCompleteRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid completion payload' }
      })
      return
    }
    res.json({
      success: true,
      data: completeDailyWakeup({ userId: parsed.data.userId, dateKey: parsed.data.dateKey })
    })
  })

  router.post('/alarms/analyze', (req, res) => {
    const parsed = AlarmCoachRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid alarm payload' }
      })
      return
    }
    res.json({ success: true, data: analyzeAlarmDiscipline(parsed.data) })
  })

  router.post('/alarms/minigames/generate', (req, res) => {
    const parsed = AlarmMinigameGenerateRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid mini-game request' }
      })
      return
    }
    res.json({ success: true, data: generateAlarmMinigameChallenge(parsed.data) })
  })

  // 7. Smart Notification Scheduling
  router.post('/notifications/schedule', (req, res) => {
    const parsed = NotificationPlanRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid notification payload' }
      })
      return
    }
    res.json({ success: true, data: buildNotificationDispatchPlan(parsed.data) })
  })

  // 8. Group Streak Assist
  const groupGuard: RequestHandler[] = requireServiceKey
    ? [
        (req, res, next) => {
          if (req.body?.allowPreview === true || !env.serviceKey) {
            next()
            return
          }
          requireServiceKey(req, res, next)
        }
      ]
    : []

  router.post('/groups/streak-assist', ...groupGuard, (req, res) => {
    const parsed = GroupChatAssistRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid group assist payload' }
      })
      return
    }
    res.json({ success: true, data: buildGroupChatAssist(parsed.data) })
  })

  // 9. Daily Reflection & Mood Recap
  router.post('/reflections/daily-summary', async (req, res) => {
    const parsed = DailyReflectionRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid reflection payload' }
      })
      return
    }
    const result = await generateDailyReflection(parsed.data, { env })
    res.json({ success: true, data: result })
  })

  // 10. Automated AI Quality Benchmark
  router.get('/quality/benchmark', async (_req, res) => {
    const report = await runQualityBenchmarkSuite()
    res.json({ success: true, data: report })
  })

  return router
}
