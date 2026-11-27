import { Router, type RequestHandler } from 'express'
import type { AiPipelineEnv } from '../config/env.js'
import { BehavioralSnapshot14dSchema, WardrobeStylistRequestSchema } from '../domain/schemas.js'
import { analyzeBehavior14d } from '../engines/behaviorAnalyzer.js'
import { polishRecommendationsWithFoxTone } from '../engines/foxTonePolisher.js'
import { recommendWardrobeCosmetics } from '../engines/wardrobeStylistEngine.js'

export function createRecommendationsRoute(
  env: AiPipelineEnv,
  requireServiceKey: RequestHandler
): Router {
  const router = Router()

  // Public preview route for unauthenticated FE demo (14-day mock dataset + deterministic Fox tone)
  router.post('/preview', async (req, res) => {
    const parsed = BehavioralSnapshot14dSchema.safeParse({
      ...(req.body ?? {}),
      allowMockFallback: true
    })
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid behavioral snapshot payload'
        }
      })
      return
    }

    const rawCandidates = analyzeBehavior14d(parsed.data)
    const polished = await polishRecommendationsWithFoxTone(rawCandidates, {
      enableLlm: false,
      env
    })

    res.status(200).json({
      success: true,
      data: {
        recommendations: polished,
        dataSource: polished.some((r) => r.dataSource === 'LIVE') ? 'HYBRID' : 'MOCK',
        tonePolishMode: 'deterministic'
      }
    })
  })

  // Backend-mediated behavioral analyzer route
  router.post('/analyze', requireServiceKey, async (req, res) => {
    const parsed = BehavioralSnapshot14dSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid behavioral snapshot payload'
        }
      })
      return
    }

    const rawCandidates = analyzeBehavior14d(parsed.data)
    const polished = await polishRecommendationsWithFoxTone(rawCandidates, {
      enableLlm: env.enableTonePolish,
      env
    })

    const hasLive = polished.some((r) => r.dataSource === 'LIVE')
    const hasMock = polished.some((r) => r.dataSource === 'MOCK')
    const dataSource = hasLive && hasMock ? 'HYBRID' : hasLive ? 'LIVE' : 'MOCK'

    res.status(200).json({
      success: true,
      data: {
        recommendations: polished,
        dataSource,
        tonePolishMode: env.enableTonePolish && Boolean(env.aiApiKey) ? 'gemini' : 'deterministic'
      }
    })
  })

  // AI Mascot Wardrobe Stylist (Fox V2 Gate H1/H2 cosmetics recommendations)
  router.post('/wardrobe-stylist', (req, res) => {
    const parsed = WardrobeStylistRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid wardrobe stylist payload'
        }
      })
      return
    }
    const result = recommendWardrobeCosmetics(parsed.data)
    res.status(200).json({ success: true, data: result })
  })

  return router
}
