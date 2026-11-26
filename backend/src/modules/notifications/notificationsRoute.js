import express from 'express'
import { notificationsController } from './notificationsController.js'
import { notificationsValidation } from './notificationsValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

// Router cho /api/v1/notifications
const notificationsRouter = express.Router()

notificationsRouter.get('/', authenticate, validate(notificationsValidation.getNotifications), notificationsController.getNotifications)
notificationsRouter.post('/read-all', authenticate, notificationsController.markAllRead)
notificationsRouter.post('/:notificationId/read', authenticate, validate(notificationsValidation.notificationIdParam), notificationsController.markRead)

// Cài đặt thông báo (/api/v1/notifications/settings)
notificationsRouter.get('/settings', authenticate, notificationsController.getSettings)
notificationsRouter.patch('/settings', authenticate, validate(notificationsValidation.updateNotificationSettings), notificationsController.updateSettings)

// Router cho /api/v1/devices
const devicesRouter = express.Router()

devicesRouter.post('/', authenticate, validate(notificationsValidation.registerDevice), notificationsController.registerDevice)
devicesRouter.delete('/:deviceId', authenticate, validate(notificationsValidation.deviceIdParam), notificationsController.deleteDevice)

export const notificationsRoute = notificationsRouter
export const devicesRoute = devicesRouter
