import express from 'express'
import { streaksController } from './streaksController.js'
import { streaksValidation } from './streaksValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// Tất cả các route Streaks đều yêu cầu đăng nhập
Router.use(authenticate)

// GET /api/v1/streaks/me
Router.get('/me', validate(streaksValidation.getMyStreak), streaksController.getMyStreak)

// POST /api/v1/streaks/freeze
Router.post('/freeze', validate(streaksValidation.freezeStreak), streaksController.freezeStreak)

export const streaksRoute = Router
export default streaksRoute
