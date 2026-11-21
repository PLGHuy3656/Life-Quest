import express from 'express'
import { goalsController } from './goalsController.js'
import { goalsValidation } from './goalsValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'


const Router = express.Router()


// /api/v1/goals
Router.route('/')
  .get(authenticate, validate(goalsValidation.getGoalsByUserId), goalsController.getGoalsByUserId)
  .post(authenticate, validate(goalsValidation.createGoal), goalsController.createGoal)


// /api/v1/goals/:goalId
Router.route('/:goalId')
  .get(authenticate, validate(goalsValidation.getGoalById), goalsController.getGoalById)
  .patch(authenticate, validate(goalsValidation.updateGoal), goalsController.updateGoal)

// /api/v1/goals/:goalId/pause
Router.post('/:goalId/pause', authenticate, validate(goalsValidation.pauseGoal), goalsController.pauseGoal)

// /api/v1/goals/:goalId/resume
Router.post('/:goalId/resume', authenticate, validate(goalsValidation.resumeGoal), goalsController.resumeGoal)

// /api/v1/goals/:goalId/complete
Router.post('/:goalId/complete', authenticate, validate(goalsValidation.completeGoal), goalsController.completeGoal)

// /api/v1/goals/:goalId/archive
Router.post('/:goalId/archive', authenticate, validate(goalsValidation.archiveGoal), goalsController.archiveGoal)

export const goalsRoute = Router
