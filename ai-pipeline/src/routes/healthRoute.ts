import { Router } from 'express'
import type { AiPipelineEnv } from '../config/env.js'

export function createHealthRoute(env: AiPipelineEnv): Router {
  const router = Router()

  router.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        service: 'lifequest-ai-pipeline',
        llmConfigured: Boolean(env.aiApiKey),
        model: env.aiModel,
        tonePolishEnabled: env.enableTonePolish,
        timestamp: new Date().toISOString()
      }
    })
  })

  return router
}
