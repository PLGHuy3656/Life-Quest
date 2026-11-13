import express from 'express'
import { milestonesController } from './milestonesController.js'
import { milestonesValidation } from './milestonesValidation.js'
import validate from '../../common/middleware/validate.js'

const Router = express.Router()

// /api/v1/goals/:goalId/milestones
Router.route('/:goalId/milestones')
  .get(validate(milestonesValidation.getMilestonesByGoalId), milestonesController.getMilestonesByGoalId)
  .post(validate(milestonesValidation.createMilestone), milestonesController.createMilestone)

//milestones/:milestoneId
Router.route('/:milestoneId')
  .get(validate(milestonesValidation.getMilestonesById), milestonesController.getMilestonesById)
  .patch(validate(milestonesValidation.updateMilestone), milestonesController.updateMilestone)
  .delete(validate(milestonesValidation.deleteMilestone), milestonesController.deleteMilestone)

// POST   /milestones/:milestoneId/complete
Router.post('/:milestoneId/complete', validate(milestonesValidation.completeMilestone), milestonesController.completeMilestone)
// PATCH /goals/:goalId/milestones/reorder
Router.patch('/:goalId/milestones/reorder', validate(milestonesValidation.reorderMilestones), milestonesController.reorderMilestones)

export const milestonesRoute = Router