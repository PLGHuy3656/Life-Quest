import cors from 'cors'
import express, { type Express, type RequestHandler } from 'express'
import { loadEnv, type AiPipelineEnv } from './config/env.js'
import { createAgentsRoute } from './routes/agentsRoute.js'
import { createCoreAiRoute } from './routes/coreAiRoute.js'
import { createEngagementRoute } from './routes/engagementRoute.js'
import { createHealthRoute } from './routes/healthRoute.js'
import { createMascotRoute } from './routes/mascotRoute.js'
import { createPlansRoute } from './routes/plansRoute.js'
import { createRecommendationsRoute } from './routes/recommendationsRoute.js'
import { createSocialRoute } from './routes/socialRoute.js'

function createServiceKeyMiddleware(env: AiPipelineEnv): RequestHandler {
  return (req, res, next) => {
    if (!env.serviceKey) {
      next()
      return
    }
    const provided = req.header('x-ai-service-key')?.trim() || ''
    if (provided !== env.serviceKey) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_SERVICE',
          message: 'Missing or invalid x-ai-service-key header.'
        }
      })
      return
    }
    next()
  }
}

export function createAiPipelineApp(envOverride?: AiPipelineEnv): Express {
  const env = envOverride ?? loadEnv()
  const app = express()

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.allowedOrigins.length === 0 || env.allowedOrigins.includes(origin)) {
          callback(null, true)
          return
        }
        callback(null, false)
      }
    })
  )
  app.use(express.json({ limit: '8mb' }))

  const requireServiceKey = createServiceKeyMiddleware(env)

  app.use('/', createHealthRoute(env))
  app.use('/v1', createCoreAiRoute(env, requireServiceKey))
  app.use('/v1/agents', createAgentsRoute(env, requireServiceKey))
  app.use('/v1/mascot', createMascotRoute())
  app.use('/v1/plans', createPlansRoute(env, requireServiceKey))
  app.use('/v1/recommendations', createRecommendationsRoute(env, requireServiceKey))
  app.use('/v1/engagement', createEngagementRoute())
  app.use('/v1/social', createSocialRoute(requireServiceKey))

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'AI Pipeline route not found'
      }
    })
  })

  return app
}
