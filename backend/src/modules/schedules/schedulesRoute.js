import express from 'express'
import { schedulesController } from './schedulesController.js'
import { schedulesValidation } from './schedulesValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// /quests/:questId/schedules
Router.route('/:questId/schedules')
  .get(authenticate, validate(schedulesValidation.getSchedulesByQuestId), schedulesController.getSchedulesByQuestId)
  .post(authenticate, validate(schedulesValidation.createSchedule), schedulesController.createSchedule)

// /schedules/:scheduleId
Router.route('/:scheduleId')
  .patch(authenticate, validate(schedulesValidation.updateSchedule), schedulesController.updateSchedule)
  .delete(authenticate, validate(schedulesValidation.deactivateSchedule), schedulesController.deactivateSchedule)

export const schedulesRoute = Router
