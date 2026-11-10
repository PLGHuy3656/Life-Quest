import express from 'express'
import { milestonesController } from './milestonesController.js'
import { milestonesValidation } from './milestonesValidation.js'
import validate from '../../common/middleware/validate.js'

const Router = express.Router()

// /api/v1/goals/:goalId/milestones
Router.route('/:goalId/milestones')
  .get(validate(milestonesValidation.getMilestonesByGoalId), milestonesController.getMilestonesByGoalId)
  .post(validate(milestonesValidation.createMilestone), milestonesController.createMilestone)

export const milestonesRoute = Router