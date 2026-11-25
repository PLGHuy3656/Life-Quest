import express from 'express'
import { focusController } from './focusController.js'
import { focusValidation } from './focusValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// /executions/:executionId/focus-sessions
Router.route('/:executionId/focus-sessions')
  .post(authenticate, validate(focusValidation.createFocusSession), focusController.createFocusSession)
  .get(authenticate, validate(focusValidation.getFocusSessionsByExecutionId), focusController.getFocusSessionsByExecutionId)

// /focus-sessions/:focusSessionId/start
Router.post('/:focusSessionId/start', authenticate, validate(focusValidation.focusSessionIdParam), focusController.startFocusSession)

// /focus-sessions/:focusSessionId/pause
Router.post('/:focusSessionId/pause', authenticate, validate(focusValidation.focusSessionIdParam), focusController.pauseFocusSession)

// /focus-sessions/:focusSessionId/resume
Router.post('/:focusSessionId/resume', authenticate, validate(focusValidation.focusSessionIdParam), focusController.resumeFocusSession)

// /focus-sessions/:focusSessionId/interrupt
Router.post('/:focusSessionId/interrupt', authenticate, validate(focusValidation.interruptFocusSession), focusController.interruptFocusSession)

// /focus-sessions/:focusSessionId/complete
Router.post('/:focusSessionId/complete', authenticate, validate(focusValidation.focusSessionIdParam), focusController.completeFocusSession)

// /focus-sessions/:focusSessionId/abandon
Router.post('/:focusSessionId/abandon', authenticate, validate(focusValidation.focusSessionIdParam), focusController.abandonFocusSession)

export const focusRoute = Router
