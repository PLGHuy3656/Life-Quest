import express from 'express'
import { achievementsController } from './achievementsController.js'
import { achievementsValidation } from './achievementsValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

// Router cho /api/v1/achievements
const achievementsRouter = express.Router()

// GET /api/v1/achievements
achievementsRouter.get('/', authenticate, validate(achievementsValidation.getAchievements), achievementsController.getAchievements)

// GET /api/v1/achievements/me
achievementsRouter.get('/me', authenticate, validate(achievementsValidation.getMyAchievements), achievementsController.getMyAchievements)

// GET /api/v1/achievements/:achievementId
achievementsRouter.get('/:achievementId', authenticate, validate(achievementsValidation.getAchievementById), achievementsController.getAchievementById)

// Router cho /api/v1/users/me/achievements
const userAchievementsRouter = express.Router()
userAchievementsRouter.get('/me/achievements', authenticate, validate(achievementsValidation.getMyAchievements), achievementsController.getMyAchievements)

export const achievementsRoute = achievementsRouter
export const userAchievementsRoute = userAchievementsRouter
