import express from 'express'
import { analyticsController } from './analyticsController.js'
import { analyticsValidation } from './analyticsValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// Metrics
Router.get('/overview', authenticate, analyticsController.getOverview)
Router.get('/weekly', authenticate, analyticsController.getWeekly)
Router.get('/quests', authenticate, analyticsController.getQuests)
Router.get('/focus', authenticate, analyticsController.getFocus)
Router.get('/streaks', authenticate, analyticsController.getStreaks)

// Behavior Events
Router.get('/behavior', authenticate, validate(analyticsValidation.getBehavior), analyticsController.getBehavior)
Router.post('/events', authenticate, validate(analyticsValidation.recordEvent), analyticsController.recordEvent)

export const analyticsRoute = Router
