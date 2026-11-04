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


export const goalsRoute = Router