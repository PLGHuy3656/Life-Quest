import prisma from '../../config/database.js'

// Lấy danh sách thông báo của User
const findUserNotifications = async (userId, { skip = 0, take = 20, unreadOnly = false }) => {
  const where = { userId }
  if (unreadOnly) {
    where.readAt = null
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, readAt: null }
    })
  ])

  return { notifications, total, unreadCount }
}

// Tìm thông báo theo ID
const findNotificationById = async (id) => {
  return await prisma.notification.findUnique({
    where: { id }
  })
}

// Đánh dấu một thông báo đã đọc
const markNotificationRead = async (id) => {
  return await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() }
  })
}

// Đánh dấu tất cả thông báo đã đọc
const markAllNotificationsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  })
}

// Tạo thông báo mới
const createNotification = async (userId, data) => {
  return await prisma.notification.create({
    data: {
      userId,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data || null
    }
  })
}

// Lấy cấu hình cài đặt thông báo của User
const findUserSettings = async (userId) => {
  return await prisma.userSettings.findUnique({
    where: { userId }
  })
}

// Cập nhật cấu hình thông báo
const updateUserSettings = async (userId, data) => {
  return await prisma.userSettings.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data
    }
  })
}

// Đăng ký hoặc cập nhật thiết bị
const upsertDevice = async (userId, data) => {
  if (data.pushToken) {
    const existing = await prisma.device.findFirst({
      where: {
        userId,
        pushToken: data.pushToken
      }
    })

    if (existing) {
      return await prisma.device.update({
        where: { id: existing.id },
        data: {
          platform: data.platform,
          deviceName: data.deviceName || existing.deviceName,
          lastActiveAt: new Date()
        }
      })
    }
  }

  return await prisma.device.create({
    data: {
      userId,
      platform: data.platform,
      pushToken: data.pushToken || null,
      deviceName: data.deviceName || null,
      lastActiveAt: new Date()
    }
  })
}

// Tìm thiết bị theo ID
const findDeviceById = async (deviceId) => {
  return await prisma.device.findUnique({
    where: { id: deviceId }
  })
}

// Xóa thiết bị
const deleteDevice = async (deviceId) => {
  return await prisma.device.delete({
    where: { id: deviceId }
  })
}

export const notificationsRepository = {
  findUserNotifications,
  findNotificationById,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
  findUserSettings,
  updateUserSettings,
  upsertDevice,
  findDeviceById,
  deleteDevice
}
