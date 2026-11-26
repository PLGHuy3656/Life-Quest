import express from 'express'
import { aiPlansController } from './aiPlansController.js'
import { aiPlansValidation } from './aiPlansValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// /api/v1/ai-plans
Router.route('/')
  .post(authenticate, validate(aiPlansValidation.createAiPlan), aiPlansController.createAiPlan)

Router.route('/:planId')
  .get(authenticate, validate(aiPlansValidation.planIdParam), aiPlansController.getAiPlanById)
  .patch(authenticate, validate(aiPlansValidation.updateAiPlan), aiPlansController.updateAiPlan)

Router.post('/:planId/regenerate', authenticate, validate(aiPlansValidation.regenerateAiPlan), aiPlansController.regenerateAiPlan)
Router.post('/:planId/accept', authenticate, validate(aiPlansValidation.planIdParam), aiPlansController.acceptAiPlan)
Router.post('/:planId/reject', authenticate, validate(aiPlansValidation.planIdParam), aiPlansController.rejectAiPlan)

export const aiPlansRoute = Router
