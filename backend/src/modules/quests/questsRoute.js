import express from 'express'
import { questsController } from './questsController.js'
import { questsValidation } from './questsValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// /quests
Router.route('/')
  .get(authenticate, validate(questsValidation.getQuestsByUserId), questsController.getQuestsByUserId)
  .post(authenticate, validate(questsValidation.createQuest), questsController.createQuest)

//   /quests/:questId
Router.route('/:questId')
  .get(authenticate, validate(questsValidation.getQuestById), questsController.getQuestById)
  .patch(authenticate, validate(questsValidation.updateQuest), questsController.updateQuest)
  .delete(authenticate, validate(questsValidation.deleteQuest), questsController.deleteQuest)

//   /quests/:questId/pin
Router.route('/:questId/pin')
  .post(authenticate, validate(questsValidation.pinQuest), questsController.pinQuest)
  .delete(authenticate, validate(questsValidation.unpinQuest), questsController.unpinQuest)

//   /quests/:questId/archive
Router.post('/:questId/archive', authenticate, validate(questsValidation.archiveQuest), questsController.archiveQuest)

//   /quests/:questId/restore
Router.post('/:questId/restore', authenticate, validate(questsValidation.restoreQuest), questsController.restoreQuest)
export const questsRoute = Router
