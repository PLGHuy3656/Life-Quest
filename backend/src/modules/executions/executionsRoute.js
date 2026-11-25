import express from 'express'
import { executionsController } from './executionsController.js'
import { executionsValidation } from './executionsValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// /api/v1/executions
Router.route('/')
  .get(authenticate, validate(executionsValidation.getExecutions), executionsController.getExecutions)
  .post(authenticate, validate(executionsValidation.createExecution), executionsController.createExecution)

// /api/v1/executions/:executionId
Router.route('/:executionId')
  .get(authenticate, validate(executionsValidation.getExecutionById), executionsController.getExecutionById)

// /api/v1/executions/:executionId/start
Router.post('/:executionId/start', authenticate, validate(executionsValidation.startExecution), executionsController.startExecution)

// /api/v1/executions/:executionId/progress
Router.patch('/:executionId/progress', authenticate, validate(executionsValidation.updateProgress), executionsController.updateProgress)

// /api/v1/executions/:executionId/complete
Router.post('/:executionId/complete', authenticate, validate(executionsValidation.completeExecution), executionsController.completeExecution)

// /api/v1/executions/:executionId/skip
Router.post('/:executionId/skip', authenticate, validate(executionsValidation.skipExecution), executionsController.skipExecution)

// /api/v1/executions/:executionId/abandon
Router.post('/:executionId/abandon', authenticate, validate(executionsValidation.abandonExecution), executionsController.abandonExecution)

export const executionsRoute = Router
