import express from 'express'
import { usersController } from './usersController.js'
import { usersValidation } from './usersValidation.js'
import validate from '../../common/middleware/validate.js'
import { authenticate } from '../../common/middleware/authenticate.js'


const Router = express.Router()


// GET /api/v1/users/me - Lấy thông tin cá nhân của user đang đăng nhập
Router.get('/me', authenticate, validate(usersValidation.getMe), usersController.getMe)

// PATCH /api/v1/users/me - Cập nhật profile của user đang đăng nhập
Router.patch('/me', authenticate, validate(usersValidation.updateMe), usersController.updateMe)

// GET /api/v1/users/me/settings - Lấy cài đặt của user đang đăng nhập
Router.get('/me/settings', authenticate, validate(usersValidation.getMySettings), usersController.getMySettings)

// PATCH /api/v1/users/me/settings - Cập nhật cài đặt của user đang đăng nhập
Router.patch('/me/settings', authenticate, validate(usersValidation.updateMySettings), usersController.updateMySettings)

// GET /api/v1/users/:userId - Xem thông tin public của user khác (không cần đăng nhập)
Router.get('/:userId', validate(usersValidation.getUserById), usersController.getUserById)

export const usersRoute = Router
