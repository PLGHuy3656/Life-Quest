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
Router.route('/milestones/:milestoneId')
  .get(validate(milestonesValidation.getMilestonesById), milestonesController.getMilestonesById)
  .patch(validate(milestonesValidation.updateMilestone), milestonesController.updateMilestone)
  .delete(validate(milestonesValidation.deleteMilestone), milestonesController.deleteMilestone)

export const milestonesRoute = Router