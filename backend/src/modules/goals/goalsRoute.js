import express from 'express'
import { goalsController } from './goalsController.js'
import { goalsValidation } from './goalsValidation.js'
import validate from '../../common/middleware/validate.js'


const Router = express.Router()

Router.route('/')
  .get(validate(goalsValidation.getGoalsByUserId), goalsController.getGoalsByUserId)
  .post(validate(goalsValidation.createGoal), goalsController.createGoal)


export const goalsRoute = Router