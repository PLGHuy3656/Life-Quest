import express from 'express'
import { questsController } from './questsController.js'
import { questsValidation } from './questsValidation.js'
import validate from '../../common/middleware/validate.js'

const Router = express.Router()

// /quests
Router.route('/')
  .get(validate(questsValidation.getQuestsByUserId), questsController.getQuestsByUserId)
  .post(validate(questsValidation.createQuest), questsController.createQuest)

//   /quests/:questId
Router.route('/:questId')
  .get(validate(questsValidation.getQuestById), questsController.getQuestById)
  .patch(validate(questsValidation.updateQuest), questsController.updateQuest)

export const questsRoute = Router