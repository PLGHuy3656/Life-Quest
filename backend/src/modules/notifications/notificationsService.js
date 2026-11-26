import { notificationsRepository } from './notificationsRepository.js'
import ApiError from '../../common/errors/ApiError.js'

// Lấy danh sách thông báo
const getNotifications = async (userId, query = {}) => {
  const page = Number(query.page || 1)
  const limit = Number(query.limit || 20)
  const unreadOnly = query.unreadOnly === true || query.unreadOnly === 'true'
  const skip = (page - 1) * limit

  const { notifications, total, unreadCount } = await notificationsRepository.findUserNotifications(userId, {
    skip,
    take: limit,
    unreadOnly
  })

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// Đánh dấu một thông báo đã đọc
const markRead = async (userId, notificationId) => {
  const notification = await notificationsRepository.findNotificationById(notificationId)
  if (!notification || notification.userId !== userId) {
    throw new ApiError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND')
  }

  return await notificationsRepository.markNotificationRead(notificationId)
}

// Đánh dấu toàn bộ thông báo đã đọc
const markAllRead = async (userId) => {
  await notificationsRepository.markAllNotificationsRead(userId)
  return { success: true, message: 'All notifications marked as read' }
}

// Lấy cài đặt thông báo
const getSettings = async (userId) => {
  const settings = await notificationsRepository.findUserSettings(userId)
  return {
    notificationEnabled: settings?.notificationEnabled ?? true
  }
}

// Cập nhật cài đặt thông báo
const updateSettings = async (userId, data) => {
  const updated = await notificationsRepository.updateUserSettings(userId, {
    notificationEnabled: data.notificationEnabled
  })

  return {
    notificationEnabled: updated.notificationEnabled
  }
}

// Đăng ký thiết bị push
const registerDevice = async (userId, data) => {
  return await notificationsRepository.upsertDevice(userId, data)
}

// Hủy đăng ký thiết bị
const deleteDevice = async (userId, deviceId) => {
  const device = await notificationsRepository.findDeviceById(deviceId)
  if (!device || device.userId !== userId) {
    throw new ApiError(404, 'Device not found', 'DEVICE_NOT_FOUND')
  }

  await notificationsRepository.deleteDevice(deviceId)
  return { success: true, message: 'Device deleted successfully' }
}

export const notificationsService = {
  getNotifications,
  markRead,
  markAllRead,
  getSettings,
  updateSettings,
  registerDevice,
  deleteDevice
}
