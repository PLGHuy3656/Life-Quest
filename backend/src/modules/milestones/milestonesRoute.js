import express from 'express'
import { milestonesController } from './milestonesController.js'
import { milestonesValidation } from './milestonesValidation.js'
import validate from '../../common/middleware/validate.js'

const Router = express.Router()

// /api/v1/goals/:goalId/milestones
Router.get('/:goalId/milestones', validate(milestonesValidation.getMilestonesByGoalId), milestonesController.getMilestonesByGoalId)

export const milestonesRoute = Router