import express from 'express'
import { gamificationController } from './gamificationController.js'
import { gamificationValidation } from './gamificationValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// /api/v1/gamification/me
Router.get('/me', authenticate, validate(gamificationValidation.getGamificationMe), gamificationController.getGamificationMe)

// /api/v1/gamification/me/xp-transactions
Router.get('/me/xp-transactions', authenticate, validate(gamificationValidation.getXpTransactions), gamificationController.getXpTransactions)

// /api/v1/gamification/me/coin-transactions
Router.get('/me/coin-transactions', authenticate, validate(gamificationValidation.getCoinTransactions), gamificationController.getCoinTransactions)

export const gamificationRoute = Router
