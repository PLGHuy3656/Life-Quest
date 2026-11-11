import express from 'express'
import { milestonesController } from './milestonesController.js'
import { milestonesValidation } from './milestonesValidation.js'
import validate from '../../common/middleware/validate.js'

const Router = express.Router()

// /api/v1/goals/:goalId/milestones
Router.route('/:goalId/milestones')
  .get(validate(milestonesValidation.getMilestonesByGoalId), milestonesController.getMilestonesByGoalId)
  .post(validate(milestonesValidation.createMilestone), milestonesController.createMilestone)

// GET    /milestones/:milestoneId
Router.get('/milestones/:milestoneId', validate(milestonesValidation.getMilestonesById), milestonesController.getMilestonesById)

// PATCH /milestones/:milestoneId
Router.patch('/milestones/:milestoneId', validate(milestonesValidation.updateMilestone), milestonesController.updateMilestone)

export const milestonesRoute = Router