import Joi from 'joi'

// Lấy danh sách thông báo
const getNotifications = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    unreadOnly: Joi.boolean().optional()
  })
})

// Kiểm tra notificationId trong param
const notificationIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    notificationId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Cập nhật cài đặt thông báo
const updateNotificationSettings = Joi.object({
  body: Joi.object({
    notificationEnabled: Joi.boolean().required()
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Đăng ký thiết bị nhận thông báo push
const registerDevice = Joi.object({
  body: Joi.object({
    platform: Joi.string().valid('IOS', 'ANDROID', 'WEB').required(),
    pushToken: Joi.string().trim().optional().allow(null, ''),
    deviceName: Joi.string().trim().max(100).optional().allow(null, '')
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Kiểm tra deviceId trong param
const deviceIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    deviceId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

export const notificationsValidation = {
  getNotifications,
  notificationIdParam,
  updateNotificationSettings,
  registerDevice,
  deviceIdParam
}
