import { Router, type RequestHandler } from 'express'
import type { AiPipelineEnv } from '../config/env.js'
import { PlanGenerateInputSchema } from '../domain/schemas.js'
import { generateAiPlan } from '../engines/planGenerator.js'

export function createPlansRoute(env: AiPipelineEnv, requireServiceKey: RequestHandler): Router {
  const router = Router()

  // Public preview route for unauthenticated FE sandbox (strictly deterministic, 0 LLM quota)
  router.post('/preview', async (req, res) => {
    const parsed = PlanGenerateInputSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid AI plan preview payload'
        }
      })
      return
    }

    const plan = await generateAiPlan(parsed.data, { allowLlm: false, env })
    res.status(200).json({ success: true, data: plan })
  })

  // Service-key gated route for backend/ (uses Gemini Structured Output when key configured)
  router.post('/generate', requireServiceKey, async (req, res) => {
    const parsed = PlanGenerateInputSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid AI plan generate payload'
        }
      })
      return
    }

    const plan = await generateAiPlan(parsed.data, { allowLlm: true, env })
    res.status(200).json({ success: true, data: plan })
  })

  // Service-key gated regenerate route for backend/
  router.post('/regenerate', requireServiceKey, async (req, res) => {
    const parsed = PlanGenerateInputSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid AI plan regenerate payload'
        }
      })
      return
    }

    const plan = await generateAiPlan(parsed.data, { allowLlm: true, env })
    res.status(200).json({ success: true, data: plan })
  })

  return router
}
