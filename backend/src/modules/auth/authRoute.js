import express from 'express'
import { authController } from './authController.js'
import { authValidation } from './authValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// Đăng ký tài khoản mới
Router.route('/register')
  .post(validate(authValidation.register), authController.register)

// Đăng nhập
Router.route('/login')
  .post(validate(authValidation.login), authController.login)

// Làm mới access token
Router.route('/refresh')
  .post(validate(authValidation.refresh), authController.refresh)

// Đăng xuất (cần xác thực)
Router.route('/logout')
  .post(authenticate, validate(authValidation.logout), authController.logout)

// Quên mật khẩu - placeholder
Router.route('/forgot-password')
  .post(validate(authValidation.forgotPassword), authController.forgotPassword)

// Đặt lại mật khẩu - placeholder
Router.route('/reset-password')
  .post(validate(authValidation.resetPassword), authController.resetPassword)


export const authRoute = Router
