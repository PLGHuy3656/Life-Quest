import prisma from '../../config/database.js'

// Lấy cài đặt thông báo của user
const findUserNotificationSettings = async (userId) => {
  return await prisma.userSettings.findUnique({
    where: { userId },
    select: {
      userId: true,
      notificationEnabled: true,
      timezone: true,
      updatedAt: true
    }
  })
}

// Cập nhật cài đặt thông báo (upsert an toàn nếu user chưa có bản ghi settings)
const upsertUserNotificationSettings = async (userId, notificationEnabled) => {
  return await prisma.userSettings.upsert({
    where: { userId },
    update: { notificationEnabled },
    create: {
      userId,
      notificationEnabled
    },
    select: {
      userId: true,
      notificationEnabled: true,
      timezone: true,
      updatedAt: true
    }
  })
}

// Tạo thông báo mới
const createNotification = async ({ userId, type, title, body, data = null }) => {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      data
    }
  })
}

// Kiểm tra thông báo cùng loại đã được tạo từ mốc thời gian cho trước chưa (chống gửi trùng)
const findRecentNotificationByType = async (userId, type, sinceDate) => {
  return await prisma.notification.findFirst({
    where: {
      userId,
      type,
      createdAt: {
        gte: sinceDate
      }
    }
  })
}

// Lấy danh sách thông báo của user có phân trang
const findNotificationsByUserId = async (userId, { skip = 0, take = 20, isRead }) => {
  const where = { userId }
  if (typeof isRead === 'boolean') {
    where.isRead = isRead
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.notification.count({ where })
  ])

  return { notifications, total }
}

// Đếm số thông báo chưa đọc của user
const countUnreadByUserId = async (userId) => {
  return await prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  })
}

// Tìm 1 thông báo theo ID
const findNotificationById = async (id) => {
  return await prisma.notification.findUnique({
    where: { id }
  })
}

// Đánh dấu 1 thông báo là đã đọc
const markAsRead = async (id) => {
  return await prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date()
    }
  })
}

// Đánh dấu toàn bộ thông báo chưa đọc của user là đã đọc
const markAllAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  })
}

export const notificationsRepository = {
  findUserNotificationSettings,
  upsertUserNotificationSettings,
  createNotification,
  findRecentNotificationByType,
  findNotificationsByUserId,
  countUnreadByUserId,
  findNotificationById,
  markAsRead,
  markAllAsRead
}
