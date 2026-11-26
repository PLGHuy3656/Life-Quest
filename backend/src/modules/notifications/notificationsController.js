import { StatusCodes } from 'http-status-codes'
import { notificationsService } from './notificationsService.js'

// Lấy danh sách thông báo
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await notificationsService.getNotifications(userId, req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}

// Đánh dấu 1 thông báo là đã đọc
const markRead = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { notificationId } = req.params
    const result = await notificationsService.markRead(userId, notificationId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Đánh dấu tất cả thông báo là đã đọc
const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await notificationsService.markAllRead(userId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Lấy cài đặt thông báo
const getSettings = async (req, res, next) => {
  try {
    const userId = req.user.id
    const settings = await notificationsService.getSettings(userId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: settings
    })
  } catch (error) {
    next(error)
  }
}

// Cập nhật cài đặt thông báo
const updateSettings = async (req, res, next) => {
  try {
    const userId = req.user.id
    const updated = await notificationsService.updateSettings(userId, req.body)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

// Đăng ký thiết bị
const registerDevice = async (req, res, next) => {
  try {
    const userId = req.user.id
    const device = await notificationsService.registerDevice(userId, req.body)
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: device
    })
  } catch (error) {
    next(error)
  }
}

// Xóa thiết bị
const deleteDevice = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { deviceId } = req.params
    const result = await notificationsService.deleteDevice(userId, deviceId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const notificationsController = {
  getNotifications,
  markRead,
  markAllRead,
  getSettings,
  updateSettings,
  registerDevice,
  deleteDevice
}
