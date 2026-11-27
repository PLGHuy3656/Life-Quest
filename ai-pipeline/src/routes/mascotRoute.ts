import { Router } from 'express'
import { MascotDialogueRequestSchema, MascotIntentRequestSchema } from '../domain/schemas.js'
import { generateMascotDialogue } from '../engines/foxTonePolisher.js'
import { parseMascotIntent } from '../engines/mascotIntentEngine.js'

export function createMascotRoute(): Router {
  const router = Router()

  // Direct FE <-> ai-pipeline route (deterministic, zero LLM quota spend)
  router.post('/dialogue', (req, res) => {
    const parsed = MascotDialogueRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid mascot dialogue payload'
        }
      })
      return
    }

    const reply = generateMascotDialogue(parsed.data)
    res.status(200).json({ success: true, data: reply })
  })

  // Direct FE <-> ai-pipeline quick intent parser
  router.post('/parse-intent', (req, res) => {
    const parsed = MascotIntentRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid intent payload'
        }
      })
      return
    }

    const intent = parseMascotIntent(parsed.data.text)
    res.status(200).json({ success: true, data: intent })
  })

  return router
}
