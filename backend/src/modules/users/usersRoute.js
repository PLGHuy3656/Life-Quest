import express from 'express'
import { usersController } from './usersController.js'
import { usersValidation } from './usersValidation.js'
import validate from '../../common/middleware/validate.js'

const Router = express.Router()

// Tạo 1 user
Router.route('/')
  .post(validate(usersValidation.createUser), usersController.createUser)


// Lấy 1 user từ email
Router.route('/:email')
  .get(validate(usersValidation.getUserByEmail), usersController.getUserByEmail)


export const usersRoute = Router
