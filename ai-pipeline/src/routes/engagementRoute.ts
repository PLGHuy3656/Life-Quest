import { Router } from 'express'
import {
  AlarmCoachRequestSchema,
  NotificationPlanRequestSchema,
  ProgressNudgeRequestSchema
} from '../domain/schemas.js'
import { analyzeAlarmDiscipline } from '../engines/alarmCoachEngine.js'
import { buildNotificationDispatchPlan } from '../engines/notificationPlannerEngine.js'
import { evaluateProgressNudge } from '../engines/progressCoachEngine.js'

export function createEngagementRoute(): Router {
  const router = Router()

  // 1. Progress & Milestone Coach (50% Halfway / 80% Sprint / 100% / Behind Pace)
  router.post('/progress-nudge', (req, res) => {
    const parsed = ProgressNudgeRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid progress nudge payload'
        }
      })
      return
    }
    const result = evaluateProgressNudge(parsed.data)
    res.status(200).json({ success: true, data: result })
  })

  // 2. Smart Alarm & Mini-Game Coach (Branch 4)
  router.post('/alarm-coach', (req, res) => {
    const parsed = AlarmCoachRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid alarm coach payload'
        }
      })
      return
    }
    const result = analyzeAlarmDiscipline(parsed.data)
    res.status(200).json({ success: true, data: result })
  })

  // 3. Notification Timing & Quiet Hours Anti-Spam Planner (Branch 3 FCM)
  router.post('/notification-plan', (req, res) => {
    const parsed = NotificationPlanRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid notification plan payload'
        }
      })
      return
    }
    const result = buildNotificationDispatchPlan(parsed.data)
    res.status(200).json({ success: true, data: result })
  })

  return router
}
