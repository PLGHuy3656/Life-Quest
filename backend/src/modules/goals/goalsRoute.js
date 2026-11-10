import express from 'express'
import { goalsController } from './goalsController.js'
import { goalsValidation } from './goalsValidation.js'
import validate from '../../common/middleware/validate.js'


const Router = express.Router()


// /api/v1/goals
Router.route('/')
  .get(validate(goalsValidation.getGoalsByUserId), goalsController.getGoalsByUserId)
  .post(validate(goalsValidation.createGoal), goalsController.createGoal)


// /api/v1/goals/:goalId
Router.route('/:goalId')
  .get(validate(goalsValidation.getGoalById), goalsController.getGoalById)
  .patch(validate(goalsValidation.updateGoal), goalsController.updateGoal)

// /api/v1/goals/:goalId/pause
Router.post('/:goalId/pause', validate(goalsValidation.pauseGoal), goalsController.pauseGoal)

// /api/v1/goals/:goalId/resume
Router.post('/:goalId/resume', validate(goalsValidation.resumeGoal), goalsController.resumeGoal)

// /api/v1/goals/:goalId/complete
Router.post('/:goalId/complete', validate(goalsValidation.completeGoal), goalsController.completeGoal)

// /api/v1/goals/:goalId/archive
Router.post('/:goalId/archive', validate(goalsValidation.archiveGoal), goalsController.archiveGoal)

export const goalsRoute = Router