import Joi from 'joi'

const getNotifications = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    isRead: Joi.boolean().optional()
  })
})

const markAsRead = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object({
    id: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

const markAllAsRead = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

const getNotificationSettings = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

const updateNotificationSettings = Joi.object({
  body: Joi.object({
    notificationEnabled: Joi.boolean().required()
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

export const notificationsValidation = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationSettings,
  updateNotificationSettings
}
