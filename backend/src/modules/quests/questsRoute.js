import express from 'express'
import { questsController } from './questsController.js'
import { questsValidation } from './questsValidation.js'
import validate from '../../common/middleware/validate.js'

const Router = express.Router()

Router.route('/')
  .get(validate(questsValidation.getQuestsByUserId), questsController.getQuestsByUserId)
  .post(validate(questsValidation.createQuest), questsController.createQuest)

export const questsRoute = Router