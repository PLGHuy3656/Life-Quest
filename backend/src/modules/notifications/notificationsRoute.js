import express from 'express'
import { notificationsController } from './notificationsController.js'
import { notificationsValidation } from './notificationsValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

Router.use(authenticate)

// /api/v1/notifications/settings
Router.route('/settings')
  .get(validate(notificationsValidation.getNotificationSettings), notificationsController.getNotificationSettings)
  .patch(validate(notificationsValidation.updateNotificationSettings), notificationsController.updateNotificationSettings)

// /api/v1/notifications/read-all
Router.post('/read-all', validate(notificationsValidation.markAllAsRead), notificationsController.markAllAsRead)

// /api/v1/notifications
Router.get('/', validate(notificationsValidation.getNotifications), notificationsController.getNotifications)

// /api/v1/notifications/:id/read
Router.post('/:id/read', validate(notificationsValidation.markAsRead), notificationsController.markAsRead)

export const notificationsRoute = Router
