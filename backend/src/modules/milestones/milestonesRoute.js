import express from 'express'
import { milestonesController } from './milestonesController.js'
import { milestonesValidation } from './milestonesValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// /api/v1/goals/:goalId/milestones
Router.route('/:goalId/milestones')
  .get(authenticate, validate(milestonesValidation.getMilestonesByGoalId), milestonesController.getMilestonesByGoalId)
  .post(authenticate, validate(milestonesValidation.createMilestone), milestonesController.createMilestone)

//milestones/:milestoneId
Router.route('/:milestoneId')
  .get(authenticate, validate(milestonesValidation.getMilestonesById), milestonesController.getMilestonesById)
  .patch(authenticate, validate(milestonesValidation.updateMilestone), milestonesController.updateMilestone)
  .delete(authenticate, validate(milestonesValidation.deleteMilestone), milestonesController.deleteMilestone)

// POST   /milestones/:milestoneId/complete
Router.post('/:milestoneId/complete', authenticate, validate(milestonesValidation.completeMilestone), milestonesController.completeMilestone)
// PATCH /goals/:goalId/milestones/reorder
Router.patch('/:goalId/milestones/reorder', authenticate, validate(milestonesValidation.reorderMilestones), milestonesController.reorderMilestones)

export const milestonesRoute = Router
