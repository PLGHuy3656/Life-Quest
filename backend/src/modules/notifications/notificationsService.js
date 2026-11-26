import { notificationsRepository } from './notificationsRepository.js'
import ApiError from '../../common/errors/ApiError.js'

// Tạo thông báo có kiểm tra user_settings.notification_enabled
const notifyUser = async (userId, { type, title, body, data = null, dedupeSince = null }) => {
  if (!userId) return null

  const settings = await notificationsRepository.findUserNotificationSettings(userId)
  if (settings && settings.notificationEnabled === false) {
    return null
  }

  if (dedupeSince) {
    const existing = await notificationsRepository.findRecentNotificationByType(userId, type, dedupeSince)
    if (existing) {
      return null
    }
  }

  return await notificationsRepository.createNotification({
    userId,
    type,
    title,
    body,
    data
  })
}

// Lấy danh sách thông báo của user
const getNotifications = async (userId, { page = 1, limit = 20, isRead } = {}) => {
  const numericPage = Number(page) || 1
  const numericLimit = Number(limit) || 20
  const skip = (numericPage - 1) * numericLimit

  let parsedIsRead
  if (isRead === true || isRead === 'true') {
    parsedIsRead = true
  } else if (isRead === false || isRead === 'false') {
    parsedIsRead = false
  }

  const [{ notifications, total }, unreadCount] = await Promise.all([
    notificationsRepository.findNotificationsByUserId(userId, {
      skip,
      take: numericLimit,
      isRead: parsedIsRead
    }),
    notificationsRepository.countUnreadByUserId(userId)
  ])

  return {
    notifications,
    unreadCount,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit)
    }
  }
}

// Đánh dấu 1 thông báo đã đọc
const markAsRead = async (userId, notificationId) => {
  const notification = await notificationsRepository.findNotificationById(notificationId)
  if (!notification || notification.userId !== userId) {
    throw new ApiError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND')
  }

  if (notification.isRead) {
    return notification
  }

  return await notificationsRepository.markAsRead(notificationId)
}

// Đánh dấu tất cả thông báo đã đọc
const markAllAsRead = async (userId) => {
  const result = await notificationsRepository.markAllAsRead(userId)
  return {
    updatedCount: result.count
  }
}

// Lấy cài đặt thông báo
const getNotificationSettings = async (userId) => {
  const settings = await notificationsRepository.findUserNotificationSettings(userId)
  if (!settings) {
    return {
      userId,
      notificationEnabled: true,
      timezone: 'UTC'
    }
  }
  return settings
}

// Cập nhật cài đặt bật/tắt thông báo
const updateNotificationSettings = async (userId, { notificationEnabled }) => {
  return await notificationsRepository.upsertUserNotificationSettings(userId, notificationEnabled)
}

export const notificationsService = {
  notifyUser,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationSettings,
  updateNotificationSettings
}
