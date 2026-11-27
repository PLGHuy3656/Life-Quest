import { Router, type RequestHandler } from 'express'
import type { AiPipelineEnv } from '../config/env.js'
import {
  AlarmCoachRequestSchema,
  AlarmMinigameGenerateRequestSchema,
  BehavioralSnapshot14dSchema,
  DailyWakeupCompleteRequestSchema,
  FoxAssistantChatRequestSchema,
  GroupChatAssistRequestSchema,
  KnowledgeSearchRequestSchema,
  NotificationPlanRequestSchema,
  PlanGenerateInputSchema,
  ProgressNudgeRequestSchema,
  WardrobeStylistRequestSchema
} from '../domain/schemas.js'
import type { AiAgentCatalogEntry } from '../domain/types.js'
import { analyzeAlarmDiscipline } from '../engines/alarmCoachEngine.js'
import {
  completeDailyWakeup,
  generateAlarmMinigameChallenge,
  getDailyWakeupStatus
} from '../engines/alarmMinigameGenerator.js'
import { analyzeBehavior14d } from '../engines/behaviorAnalyzer.js'
import { runFoxAssistantChat } from '../engines/foxAssistantAgent.js'
import { polishRecommendationsWithFoxTone } from '../engines/foxTonePolisher.js'
import { buildGroupChatAssist } from '../engines/groupChatAssistEngine.js'
import { buildNotificationDispatchPlan } from '../engines/notificationPlannerEngine.js'
import { generateAiPlan } from '../engines/planGenerator.js'
import { evaluateProgressNudge } from '../engines/progressCoachEngine.js'
import { recommendWardrobeCosmetics } from '../engines/wardrobeStylistEngine.js'
import {
  LIFEQUEST_KNOWLEDGE_BASE,
  searchLifeQuestKnowledge
} from '../knowledge/lifequestKnowledgeBase.js'

export const AI_AGENTS_CATALOG: AiAgentCatalogEntry[] = [
  {
    id: 'fox-assistant',
    name: 'Fox Assistant Agent',
    role: 'RAG-powered LifeQuest concierge with structured Knowledge Base and strict in-domain guardrails',
    endpoints: [
      'POST /v1/agents/fox-assistant/chat',
      'GET /v1/agents/knowledge/lifequest',
      'POST /v1/agents/knowledge/search'
    ],
    capabilities: [
      'Generalized Vietnamese Q&A grounded in LifeQuest Knowledge Base (RAG)',
      'Out-of-domain refusal guardrail',
      'Live user progress & wardrobe-aware answers'
    ],
    mode: 'hybrid-gemini-and-rules'
  },
  {
    id: 'roadmap-architect',
    name: 'Roadmap Architect Agent',
    role: 'Goal-to-roadmap planner converting user goals into milestones, daily quests, and schedules',
    endpoints: [
      'POST /v1/agents/roadmap-architect/generate',
      'POST /v1/agents/roadmap-architect/refine'
    ],
    capabilities: [
      'Structured Goal -> Milestones -> Quests generation',
      'Adaptive refinement via user feedback constraints',
      'XP, Coin, and golden-hour schedule suggestions'
    ],
    mode: 'hybrid-gemini-and-rules'
  },
  {
    id: 'recommendation-advisor',
    name: 'Recommendation Advisor Agent',
    role: '14-day behavioral analyzer producing prioritized schedule, quest, challenge, and streak advice',
    endpoints: ['POST /v1/agents/recommendation-advisor/analyze'],
    capabilities: [
      '7-rule behavioral analytics',
      'Fox tone polishing',
      'Executable action payloads'
    ],
    mode: 'hybrid-gemini-and-rules'
  },
  {
    id: 'wardrobe-stylist',
    name: 'Wardrobe Stylist Agent',
    role: 'Mascot cosmetic advisor recommending affordable items that complete Fox outfit sets',
    endpoints: ['POST /v1/agents/wardrobe-stylist/recommend'],
    capabilities: [
      'Outfit set completion prioritization (2/3 -> 3/3)',
      'Coin budget & level eligibility check',
      'Behavior-to-theme matching'
    ],
    mode: 'deterministic-rules'
  },
  {
    id: 'progress-coach',
    name: 'Progress Coach Agent',
    role: 'Milestone detector firing proactive encouragement nudges at 50%, 80%, 100%, and behind-pace states',
    endpoints: ['POST /v1/agents/progress-coach/evaluate'],
    capabilities: [
      'Halfway 50% momentum trigger',
      'Sprint 80% & Completion 100% nudges',
      'Push notification FCM payload generation'
    ],
    mode: 'deterministic-rules'
  },
  {
    id: 'alarm-coach',
    name: 'Alarm Coach Agent',
    role: '06:00 daily wake-up mission manager with non-repeating daily mini-games and snooze analytics',
    endpoints: [
      'GET /v1/agents/alarm-coach/daily-wakeup',
      'POST /v1/agents/alarm-coach/daily-wakeup/complete',
      'POST /v1/agents/alarm-coach/analyze',
      'POST /v1/agents/alarm-coach/minigame/generate'
    ],
    capabilities: [
      '06:00 daily wake-up quest played once per day',
      'Non-repeating daily rotation across MATH, MEMORY_SEQUENCE, TYPING, and QUICK_TAP',
      '14-day snooze & miss-rate diagnostics'
    ],
    mode: 'deterministic-rules'
  },
  {
    id: 'notification-planner',
    name: 'Notification Planner Agent',
    role: 'Smart push notification scheduler enforcing quiet hours, emergency overrides, and anti-spam rules',
    endpoints: ['POST /v1/agents/notification-planner/schedule'],
    capabilities: [
      'Quiet hours deferral (22:00-06:00)',
      'Emergency alarm.ringing bypass',
      'Muted room suppression & deduplication'
    ],
    mode: 'deterministic-rules'
  },
  {
    id: 'group-streak-moderator',
    name: 'Group Streak Moderator Agent',
    role: 'Social accountability assistant drafting group streak rescue notices and shared plan summaries',
    endpoints: ['POST /v1/agents/group-streak-moderator/compose'],
    capabilities: [
      'Exact members-needed calculation for ALL_MEMBERS & THRESHOLD_PERCENT',
      'Ready-to-send group chat payload generation'
    ],
    mode: 'deterministic-rules'
  }
]

export function createAgentsRoute(env: AiPipelineEnv, requireServiceKey?: RequestHandler): Router {
  const router = Router()

  // Discovery endpoint listing all available AI Agents & their RESTful contracts
  router.get('/catalog', (_req, res) => {
    res.json({
      success: true,
      data: {
        version: 'v1',
        totalAgents: AI_AGENTS_CATALOG.length,
        agents: AI_AGENTS_CATALOG
      }
    })
  })

  // 1. Fox Assistant Agent — RAG-powered conversational chat + LifeQuest Knowledge Base API
  router.get('/knowledge/lifequest', (_req, res) => {
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
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid knowledge search payload'
        }
      })
      return
    }
    const hits = searchLifeQuestKnowledge(parsed.data.query, parsed.data.topK)
    res.json({
      success: true,
      data: {
        query: parsed.data.query,
        totalMatches: hits.length,
        results: hits
      }
    })
  })

  router.post('/fox-assistant/chat', async (req, res) => {
    const parsed = FoxAssistantChatRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid chat payload'
        }
      })
      return
    }
    const result = await runFoxAssistantChat(parsed.data, { env })
    res.json({ success: true, data: result })
  })

  // 2. Roadmap Architect Agent — generate & refine structured goal roadmaps
  router.post('/roadmap-architect/generate', async (req, res) => {
    const parsed = PlanGenerateInputSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid roadmap generation payload'
        }
      })
      return
    }
    const plan = await generateAiPlan(parsed.data, { env })
    res.json({ success: true, data: plan })
  })

  router.post('/roadmap-architect/refine', async (req, res) => {
    const parsed = PlanGenerateInputSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid roadmap refine payload'
        }
      })
      return
    }
    const plan = await generateAiPlan(
      {
        ...parsed.data,
        feedback: parsed.data.feedback || 'Tinh chỉnh lại lộ trình cho nhẹ nhàng và dễ duy trì hơn'
      },
      { env }
    )
    res.json({ success: true, data: plan })
  })

  // 3. Recommendation Advisor Agent — 14-day behavioral analytics + Fox tone polish
  router.post('/recommendation-advisor/analyze', async (req, res) => {
    const parsed = BehavioralSnapshot14dSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid behavioral snapshot payload'
        }
      })
      return
    }
    const raw = analyzeBehavior14d(parsed.data)
    const polished = await polishRecommendationsWithFoxTone(raw, { env })
    res.json({
      success: true,
      data: {
        agent: 'recommendation-advisor',
        recommendations: polished
      }
    })
  })

  // 4. Wardrobe Stylist Agent — mascot cosmetic recommendations
  router.post('/wardrobe-stylist/recommend', (req, res) => {
    const parsed = WardrobeStylistRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid wardrobe stylist payload'
        }
      })
      return
    }
    const result = recommendWardrobeCosmetics(parsed.data)
    res.json({ success: true, data: result })
  })

  // 5. Progress Coach Agent — 50% / 80% / 100% proactive nudges
  router.post('/progress-coach/evaluate', (req, res) => {
    const parsed = ProgressNudgeRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid progress evaluation payload'
        }
      })
      return
    }
    const result = evaluateProgressNudge(parsed.data)
    res.json({ success: true, data: result })
  })

  // 6. Alarm Coach Agent — 07:00 daily wake-up mission (once/day, rotated) + snooze analytics
  router.get('/alarm-coach/daily-wakeup', (req, res) => {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : 'demo-user'
    const dateKey = typeof req.query.dateKey === 'string' ? req.query.dateKey : undefined
    const alarmTime = typeof req.query.alarmTime === 'string' ? req.query.alarmTime : '07:00'
    const status = getDailyWakeupStatus({ userId, dateKey, alarmTime })
    res.json({ success: true, data: status })
  })

  router.post('/alarm-coach/daily-wakeup/complete', (req, res) => {
    const parsed = DailyWakeupCompleteRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid daily wakeup completion payload'
        }
      })
      return
    }
    const updated = completeDailyWakeup({
      userId: parsed.data.userId,
      dateKey: parsed.data.dateKey
    })
    res.json({ success: true, data: updated })
  })

  router.post('/alarm-coach/analyze', (req, res) => {
    const parsed = AlarmCoachRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid alarm analysis payload'
        }
      })
      return
    }
    const result = analyzeAlarmDiscipline(parsed.data)
    res.json({ success: true, data: result })
  })

  router.post('/alarm-coach/minigame/generate', (req, res) => {
    const parsed = AlarmMinigameGenerateRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid alarm mini-game request'
        }
      })
      return
    }
    const challenge = generateAlarmMinigameChallenge(parsed.data)
    res.json({ success: true, data: challenge })
  })

  // 7. Notification Planner Agent — smart FCM scheduling & Quiet Hours enforcement
  router.post('/notification-planner/schedule', (req, res) => {
    const parsed = NotificationPlanRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid notification schedule payload'
        }
      })
      return
    }
    const result = buildNotificationDispatchPlan(parsed.data)
    res.json({ success: true, data: result })
  })

  // 8. Group Streak Moderator Agent — compose group streak rescue & social summaries
  const composeHandlers: RequestHandler[] = requireServiceKey
    ? [
        (req, res, next) => {
          // Allow public preview calls for mock/demo conversations while protecting live service calls when key is configured
          if (req.body?.allowPreview === true || !env.serviceKey) {
            next()
            return
          }
          requireServiceKey(req, res, next)
        }
      ]
    : []

  router.post('/group-streak-moderator/compose', ...composeHandlers, (req, res) => {
    const parsed = GroupChatAssistRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid group streak moderator payload'
        }
      })
      return
    }
    const result = buildGroupChatAssist(parsed.data)
    res.json({ success: true, data: result })
  })

  return router
}
