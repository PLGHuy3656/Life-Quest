import express from 'express'
import { streaksController } from './streaksController.js'
import { streaksValidation } from './streaksValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

// Router cho /api/v1/streak-rules
const streakRulesRouter = express.Router()

streakRulesRouter.route('/')
  .get(authenticate, validate(streaksValidation.getStreakRules), streaksController.getStreakRules)
  .post(authenticate, validate(streaksValidation.createStreakRule), streaksController.createStreakRule)

streakRulesRouter.route('/:ruleId')
  .get(authenticate, validate(streaksValidation.ruleIdParam), streaksController.getStreakRuleById)
  .patch(authenticate, validate(streaksValidation.updateStreakRule), streaksController.updateStreakRule)
  .delete(authenticate, validate(streaksValidation.ruleIdParam), streaksController.deleteStreakRule)

// Router cho /api/v1/streaks
const streaksRouter = express.Router()

streaksRouter.route('/')
  .get(authenticate, validate(streaksValidation.getStreaks), streaksController.getStreaks)

export const streakRulesRoute = streakRulesRouter
export const streaksRoute = streaksRouter
