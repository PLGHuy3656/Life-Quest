import { StatusCodes } from 'http-status-codes'
import { notificationsService } from './notificationsService.js'

// GET /api/v1/notifications
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { page, limit, isRead } = req.query
    const data = await notificationsService.getNotifications(userId, { page, limit, isRead })

    return res.status(StatusCodes.OK).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

// POST /api/v1/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const data = await notificationsService.markAsRead(userId, id)

    return res.status(StatusCodes.OK).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

// POST /api/v1/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id
    const data = await notificationsService.markAllAsRead(userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/v1/notifications/settings
const getNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.user.id
    const data = await notificationsService.getNotificationSettings(userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

// PATCH /api/v1/notifications/settings
const updateNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { notificationEnabled } = req.body
    const data = await notificationsService.updateNotificationSettings(userId, { notificationEnabled })

    return res.status(StatusCodes.OK).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

export const notificationsController = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationSettings,
  updateNotificationSettings
}
