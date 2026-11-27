import { Router, type RequestHandler } from 'express'
import { GroupChatAssistRequestSchema } from '../domain/schemas.js'
import { buildGroupChatAssist } from '../engines/groupChatAssistEngine.js'
import { MOCK_GROUP_SCENARIOS } from '../mock/groupChatFixtures.js'

export function createSocialRoute(requireServiceKey: RequestHandler): Router {
  const router = Router()

  router.get('/mock-groups', (_req, res) => {
    res.status(200).json({
      success: true,
      data: Object.values(MOCK_GROUP_SCENARIOS)
    })
  })

  // Public preview route for unauthenticated mock testing (0 LLM quota)
  router.post('/group-assist-preview', (req, res) => {
    const parsed = GroupChatAssistRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid group assist preview payload'
        }
      })
      return
    }

    const payload = buildGroupChatAssist(parsed.data)
    res.status(200).json({ success: true, data: payload })
  })

  // Backend-mediated route: AI builds structured message payload; backend authorizes, persists, and emits
  router.post('/group-assist', requireServiceKey, (req, res) => {
    const parsed = GroupChatAssistRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid group assist payload'
        }
      })
      return
    }

    const payload = buildGroupChatAssist(parsed.data)
    res.status(200).json({ success: true, data: payload })
  })

  return router
}
